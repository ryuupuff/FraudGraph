"""
backend/app/schemas.py

Pydantic schemas for the FraudGraph REST API.
"""

from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = Field(..., description="Service status indicator")
    dataset_loaded: bool = Field(..., description="Whether the graph and dataset are loaded into memory")
    total_nodes: int = Field(..., description="Total nodes available in memory")
    total_edges: int = Field(..., description="Total directed edges loaded in graph")
    version: str = Field("0.1.0", description="API version")


class LabelCounts(BaseModel):
    illicit: int = Field(..., description="Count of illicit transactions (class 1)")
    licit: int = Field(..., description="Count of licit transactions (class 2)")
    unknown: int = Field(..., description="Count of unknown transactions (class 3)")


class TimestepActivity(BaseModel):
    timestep: int = Field(..., description="Observation window (1 to 49)")
    illicit: int = Field(..., description="Count of illicit transactions in timestep")
    licit: int = Field(..., description="Count of licit transactions in timestep")
    unknown: int = Field(..., description="Count of unknown transactions in timestep")
    total: int = Field(..., description="Total transactions in timestep")


class DatasetSummaryResponse(BaseModel):
    total_nodes: int = Field(..., description="Total unique transactions in dataset")
    total_edges: int = Field(..., description="Total directed payment flow edges")
    timesteps_count: int = Field(..., description="Total discrete timesteps represented")
    label_counts: LabelCounts = Field(..., description="Breakdown of ground-truth transaction labels")
    label_codes: Dict[str, int] = Field(..., description="Raw code to count mapping: '1', '2', '3'")
    timesteps: List[TimestepActivity] = Field(
        default_factory=list,
        description="Transaction activity breakdown across discrete observation timesteps",
    )


class InterpretableFeatures(BaseModel):
    in_txs_degree: Optional[float] = None
    out_txs_degree: Optional[float] = None
    total_BTC: Optional[float] = None
    fees: Optional[float] = None
    size: Optional[float] = None
    num_input_addresses: Optional[float] = None
    num_output_addresses: Optional[float] = None
    in_BTC_min: Optional[float] = None
    in_BTC_max: Optional[float] = None
    in_BTC_mean: Optional[float] = None
    in_BTC_median: Optional[float] = None
    in_BTC_total: Optional[float] = None
    out_BTC_min: Optional[float] = None
    out_BTC_max: Optional[float] = None
    out_BTC_mean: Optional[float] = None
    out_BTC_median: Optional[float] = None
    out_BTC_total: Optional[float] = None


class TransactionResponse(BaseModel):
    tx_id: str = Field(..., description="Unique transaction ID as string")
    class_code: int = Field(..., description="Ground-truth class code: 1, 2, or 3")
    label: str = Field(..., description="Class semantic label: 'illicit', 'licit', or 'unknown'")
    timestep: int = Field(..., description="Discrete block timestep (1 to 49)")
    features: InterpretableFeatures = Field(..., description="De-anonymized interpretable Bitcoin features")


class NeighborNode(BaseModel):
    tx_id: str = Field(..., description="Neighbor transaction ID as string")
    class_code: int = Field(..., description="Ground-truth class code: 1, 2, or 3")
    label: str = Field(..., description="Class semantic label: 'illicit', 'licit', or 'unknown'")


class TransactionNeighborsResponse(BaseModel):
    tx_id: str = Field(..., description="Transaction ID queried")
    class_code: int = Field(..., description="Ground-truth class code")
    label: str = Field(..., description="Class semantic label")
    incoming_count: int = Field(..., description="Count of incoming inflows (predecessors)")
    outgoing_count: int = Field(..., description="Count of outgoing outflows (successors)")
    incoming: List[NeighborNode] = Field(..., description="List of incoming neighbor transactions")
    outgoing: List[NeighborNode] = Field(..., description="List of outgoing neighbor transactions")


class ErrorResponse(BaseModel):
    detail: str = Field(..., description="Human-readable error explanation")
