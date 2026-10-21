"""
backend/app/config.py

Configuration constants for FraudGraph backend.
"""

from pathlib import Path
from typing import Dict, List

# Project and Data Directories
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data" / "raw"

CLASSES_FILE = "txs_classes.csv"
EDGELIST_FILE = "txs_edgelist.csv"
FEATURES_FILE = "txs_features.csv"

# Documented Elliptic++ class mapping: 1 = illicit, 2 = licit, 3 = unknown
CLASS_MAPPING: Dict[str, str] = {
    "1": "illicit",
    "2": "licit",
    "3": "unknown",
}

CLASS_CODE_TO_INT: Dict[str, int] = {
    "1": 1,
    "2": 2,
    "3": 3,
}

# 17 newly de-anonymized, human-interpretable Bitcoin blockchain features in Elliptic++
INTERPRETABLE_FEATURES: List[str] = [
    "in_txs_degree",
    "out_txs_degree",
    "total_BTC",
    "fees",
    "size",
    "num_input_addresses",
    "num_output_addresses",
    "in_BTC_min",
    "in_BTC_max",
    "in_BTC_mean",
    "in_BTC_median",
    "in_BTC_total",
    "out_BTC_min",
    "out_BTC_max",
    "out_BTC_mean",
    "out_BTC_median",
    "out_BTC_total",
]

# Columns to load from txs_features.csv to avoid reading all 184 columns into memory
FEATURE_COLUMNS_TO_LOAD: List[str] = ["txId", "Time step"] + INTERPRETABLE_FEATURES
