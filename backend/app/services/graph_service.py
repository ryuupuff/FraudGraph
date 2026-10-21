"""
backend/app/services/graph_service.py

Graph data access and query service.
Loads Elliptic++ raw CSV data into NetworkX and memory structures for low-latency queries.
"""

import math
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
import networkx as nx
import pandas as pd

from backend.app.config import (
    DATA_DIR,
    CLASSES_FILE,
    EDGELIST_FILE,
    FEATURES_FILE,
    CLASS_MAPPING,
    CLASS_CODE_TO_INT,
    FEATURE_COLUMNS_TO_LOAD,
    INTERPRETABLE_FEATURES,
)
from backend.app.schemas import (
    DatasetSummaryResponse,
    LabelCounts,
    TimestepActivity,
    TransactionResponse,
    InterpretableFeatures,
    TransactionNeighborsResponse,
    NeighborNode,
)


def _clean_float(val: Any) -> Optional[float]:
    """Helper to convert numeric values to float or None if NaN/missing."""
    if val is None:
        return None
    try:
        f = float(val)
        return None if math.isnan(f) else f
    except (ValueError, TypeError):
        return None


class GraphService:
    def __init__(self, data_dir: Optional[Path] = None):
        self.data_dir = data_dir or DATA_DIR
        self.is_loaded: bool = False
        
        # In-memory structures
        self.graph: nx.DiGraph = nx.DiGraph()
        # tx_id (str) -> (class_code: int, label_str: str)
        self.node_classes: Dict[str, Tuple[int, str]] = {}
        # tx_id (str) -> dict of features
        self.features_map: Dict[str, Dict[str, Any]] = {}
        # Cached summary response
        self._summary_cache: Optional[DatasetSummaryResponse] = None

    def load_data(self) -> None:
        """Load and index the raw Elliptic++ CSV dataset."""
        classes_path = self.data_dir / CLASSES_FILE
        edgelist_path = self.data_dir / EDGELIST_FILE
        features_path = self.data_dir / FEATURES_FILE

        if not classes_path.exists():
            raise FileNotFoundError(f"Missing required dataset file: {CLASSES_FILE}")
        if not edgelist_path.exists():
            raise FileNotFoundError(f"Missing required dataset file: {EDGELIST_FILE}")
        if not features_path.exists():
            raise FileNotFoundError(f"Missing required dataset file: {FEATURES_FILE}")

        # 1. Load Classes
        # Keep txId as str to avoid silent type alteration or precision loss
        df_classes = pd.read_csv(classes_path, dtype={"txId": str, "class": str})
        node_classes: Dict[str, Tuple[int, str]] = {}
        label_code_counts: Dict[str, int] = {"1": 0, "2": 0, "3": 0}

        for _, row in df_classes.iterrows():
            tx_id = str(row["txId"]).strip()
            cls_code_str = str(row["class"]).strip()
            
            code_int = CLASS_CODE_TO_INT.get(cls_code_str, 3)
            label_name = CLASS_MAPPING.get(cls_code_str, "unknown")
            node_classes[tx_id] = (code_int, label_name)
            
            if cls_code_str in label_code_counts:
                label_code_counts[cls_code_str] += 1
            else:
                label_code_counts[cls_code_str] = label_code_counts.get(cls_code_str, 0) + 1

        self.node_classes = node_classes

        # 2. Load Edgelist into NetworkX DiGraph
        df_edges = pd.read_csv(edgelist_path, dtype={"txId1": str, "txId2": str})
        
        # Build DiGraph: txId1 -> txId2
        self.graph = nx.from_pandas_edgelist(
            df_edges,
            source="txId1",
            target="txId2",
            create_using=nx.DiGraph,
        )
        
        # Ensure all nodes exist in the graph (including degree-0 nodes)
        self.graph.add_nodes_from(self.node_classes.keys())

        # 3. Load Selective Features into Memory
        # Load only txId, Time step, and 17 interpretable features to optimize memory
        df_features = pd.read_csv(
            features_path,
            usecols=FEATURE_COLUMNS_TO_LOAD,
            dtype={"txId": str},
        )
        # Store as fast key-value map
        self.features_map = df_features.set_index("txId").to_dict(orient="index")

        # 4. Cache Summary & Timestep Activity
        timesteps_set = set()
        timestep_counts: Dict[int, Dict[str, int]] = {}

        for tx_id, f in self.features_map.items():
            ts_val = f.get("Time step")
            if ts_val is not None and not math.isnan(float(ts_val)):
                ts = int(ts_val)
                timesteps_set.add(ts)
                if ts not in timestep_counts:
                    timestep_counts[ts] = {"illicit": 0, "licit": 0, "unknown": 0, "total": 0}
                cls_code, label_name = self.node_classes.get(tx_id, (3, "unknown"))
                timestep_counts[ts][label_name] = timestep_counts[ts].get(label_name, 0) + 1
                timestep_counts[ts]["total"] += 1

        timesteps_activity = [
            TimestepActivity(
                timestep=ts,
                illicit=counts.get("illicit", 0),
                licit=counts.get("licit", 0),
                unknown=counts.get("unknown", 0),
                total=counts.get("total", 0),
            )
            for ts, counts in sorted(timestep_counts.items())
        ]

        self._summary_cache = DatasetSummaryResponse(
            total_nodes=len(self.node_classes),
            total_edges=df_edges.shape[0],
            timesteps_count=len(timesteps_set),
            label_counts=LabelCounts(
                illicit=label_code_counts.get("1", 0),
                licit=label_code_counts.get("2", 0),
                unknown=label_code_counts.get("3", 0),
            ),
            label_codes=label_code_counts,
            timesteps=timesteps_activity,
        )

        self.is_loaded = True

    def get_summary(self) -> DatasetSummaryResponse:
        """Return precomputed dataset metrics."""
        if not self.is_loaded or self._summary_cache is None:
            raise RuntimeError("Dataset is not loaded.")
        return self._summary_cache

    def has_transaction(self, tx_id: str) -> bool:
        """Check if a transaction ID exists in the dataset."""
        if not tx_id:
            return False
        return str(tx_id).strip() in self.node_classes

    def get_transaction(self, tx_id: str) -> Optional[TransactionResponse]:
        """Fetch transaction details, label, and interpretable features."""
        clean_id = str(tx_id).strip()
        if clean_id not in self.node_classes:
            return None

        class_code, label_name = self.node_classes[clean_id]
        raw_feat = self.features_map.get(clean_id, {})
        timestep = int(raw_feat.get("Time step", 0))

        feat_kwargs = {}
        for col in INTERPRETABLE_FEATURES:
            feat_kwargs[col] = _clean_float(raw_feat.get(col))

        return TransactionResponse(
            tx_id=clean_id,
            class_code=class_code,
            label=label_name,
            timestep=timestep,
            features=InterpretableFeatures(**feat_kwargs),
        )

    def get_neighbors(self, tx_id: str) -> Optional[TransactionNeighborsResponse]:
        """Fetch incoming (predecessors) and outgoing (successors) neighbor nodes."""
        clean_id = str(tx_id).strip()
        if clean_id not in self.node_classes:
            return None

        class_code, label_name = self.node_classes[clean_id]

        incoming_nodes: List[NeighborNode] = []
        outgoing_nodes: List[NeighborNode] = []

        if self.graph.has_node(clean_id):
            # Ingoing predecessors: transactions that sent BTC to clean_id
            for pred_id in self.graph.predecessors(clean_id):
                pred_code, pred_label = self.node_classes.get(pred_id, (3, "unknown"))
                incoming_nodes.append(
                    NeighborNode(tx_id=pred_id, class_code=pred_code, label=pred_label)
                )

            # Outgoing successors: transactions that received BTC from clean_id
            for succ_id in self.graph.successors(clean_id):
                succ_code, succ_label = self.node_classes.get(succ_id, (3, "unknown"))
                outgoing_nodes.append(
                    NeighborNode(tx_id=succ_id, class_code=succ_code, label=succ_label)
                )

        return TransactionNeighborsResponse(
            tx_id=clean_id,
            class_code=class_code,
            label=label_name,
            incoming_count=len(incoming_nodes),
            outgoing_count=len(outgoing_nodes),
            incoming=incoming_nodes,
            outgoing=outgoing_nodes,
        )
