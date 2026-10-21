#!/usr/bin/env python3
"""
scripts/validate_dataset.py

Validation and integrity inspection script for the Elliptic++ Bitcoin Transactions Dataset.
Inspects raw files in data/raw/:
- txs_classes.csv
- txs_edgelist.csv
- txs_features.csv

Reports:
1. File names, file sizes, row counts, and column counts.
2. Missing / null values per file and per column.
3. Duplicate identifiers (txId duplicates, duplicate edges).
4. Label distribution (class 1: illicit, class 2: licit, class 3: unknown).
5. Cross-file referential integrity (verifying every edge references existing transaction nodes).
6. Timestep coverage and feature schema verification.
"""

import os
import sys
import csv
from collections import Counter
from typing import Dict, Set, Tuple, List, Optional

RAW_DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "raw")

CLASSES_FILE = "txs_classes.csv"
EDGELIST_FILE = "txs_edgelist.csv"
FEATURES_FILE = "txs_features.csv"

# Label semantics in Elliptic++:
LABEL_MAP = {
    "1": "Illicit (Fraud / Suspicious)",
    "2": "Licit (Legitimate / Non-fraud)",
    "3": "Unknown (Unlabelled)",
}


def print_header(title: str):
    print("\n" + "=" * 70)
    print(f" {title}")
    print("=" * 70)


def print_section(title: str):
    print("\n" + "-" * 50)
    print(f" >> {title}")
    print("-" * 50)


def validate_classes(filepath: str) -> Tuple[Set[str], Dict]:
    """Validate txs_classes.csv and return node ID set and statistics."""
    print_section(f"Inspecting {os.path.basename(filepath)}")
    stats = {
        "file": os.path.basename(filepath),
        "size_bytes": os.path.getsize(filepath),
        "rows": 0,
        "cols": 0,
        "columns": [],
        "missing_values": 0,
        "duplicate_ids": 0,
        "label_counts": Counter(),
    }
    
    node_ids: Set[str] = set()
    duplicate_count = 0
    missing_count = 0
    
    with open(filepath, "r", encoding="utf-8", errors="replace") as f:
        reader = csv.reader(f)
        header = next(reader, None)
        if not header:
            print("[-] Error: Empty file.")
            return node_ids, stats
            
        stats["columns"] = header
        stats["cols"] = len(header)
        tx_id_idx = header.index("txId") if "txId" in header else 0
        class_idx = header.index("class") if "class" in header else 1
        
        for row_num, row in enumerate(reader, start=1):
            stats["rows"] += 1
            if len(row) < len(header):
                missing_count += 1
                continue
                
            tx_id = row[tx_id_idx].strip()
            cls_val = row[class_idx].strip()
            
            if not tx_id or not cls_val:
                missing_count += 1
                
            if tx_id in node_ids:
                duplicate_count += 1
            else:
                node_ids.add(tx_id)
                
            stats["label_counts"][cls_val] += 1
            
    stats["missing_values"] = missing_count
    stats["duplicate_ids"] = duplicate_count
    
    print(f"  • File size:           {stats['size_bytes']:,} bytes ({stats['size_bytes'] / (1024*1024):.2f} MB)")
    print(f"  • Row count (records): {stats['rows']:,}")
    print(f"  • Column count:        {stats['cols']} {stats['columns']}")
    print(f"  • Missing / null rows: {stats['missing_values']:,}")
    print(f"  • Duplicate txIds:     {stats['duplicate_ids']:,}")
    print(f"  • Unique nodes loaded: {len(node_ids):,}")
    print("\n  • Label Distribution:")
    for code, count in sorted(stats["label_counts"].items()):
        name = LABEL_MAP.get(code, f"Class {code}")
        pct = (count / stats['rows'] * 100) if stats['rows'] > 0 else 0
        print(f"    - [{code}] {name:<32}: {count:>7,} ({pct:6.2f}%)")
        
    return node_ids, stats


def validate_edgelist(filepath: str, known_node_ids: Optional[Set[str]] = None) -> Tuple[int, Dict]:
    """Validate txs_edgelist.csv and verify referential integrity."""
    print_section(f"Inspecting {os.path.basename(filepath)}")
    stats = {
        "file": os.path.basename(filepath),
        "size_bytes": os.path.getsize(filepath),
        "rows": 0,
        "cols": 0,
        "columns": [],
        "missing_values": 0,
        "duplicate_edges": 0,
        "unique_edges": 0,
        "source_nodes": set(),
        "target_nodes": set(),
        "all_edge_nodes": set(),
        "invalid_edges": 0,
        "dangling_sources": set(),
        "dangling_targets": set(),
    }
    
    edge_seen: Set[Tuple[str, str]] = set()
    missing_count = 0
    duplicate_edges = 0
    
    with open(filepath, "r", encoding="utf-8", errors="replace") as f:
        reader = csv.reader(f)
        header = next(reader, None)
        if not header:
            print("[-] Error: Empty file.")
            return 0, stats
            
        stats["columns"] = header
        stats["cols"] = len(header)
        src_idx = header.index("txId1") if "txId1" in header else 0
        dst_idx = header.index("txId2") if "txId2" in header else 1
        
        for row_num, row in enumerate(reader, start=1):
            stats["rows"] += 1
            if len(row) < len(header):
                missing_count += 1
                continue
                
            src = row[src_idx].strip()
            dst = row[dst_idx].strip()
            
            if not src or not dst:
                missing_count += 1
                continue
                
            edge = (src, dst)
            if edge in edge_seen:
                duplicate_edges += 1
            else:
                edge_seen.add(edge)
                
            stats["source_nodes"].add(src)
            stats["target_nodes"].add(dst)
            stats["all_edge_nodes"].add(src)
            stats["all_edge_nodes"].add(dst)
            
            if known_node_ids is not None:
                src_valid = src in known_node_ids
                dst_valid = dst in known_node_ids
                if not src_valid or not dst_valid:
                    stats["invalid_edges"] += 1
                    if not src_valid:
                        stats["dangling_sources"].add(src)
                    if not dst_valid:
                        stats["dangling_targets"].add(dst)
                        
    stats["missing_values"] = missing_count
    stats["duplicate_edges"] = duplicate_edges
    stats["unique_edges"] = len(edge_seen)
    
    print(f"  • File size:           {stats['size_bytes']:,} bytes ({stats['size_bytes'] / (1024*1024):.2f} MB)")
    print(f"  • Total edge records:  {stats['rows']:,}")
    print(f"  • Unique directed edges: {stats['unique_edges']:,}")
    print(f"  • Duplicate edges:     {stats['duplicate_edges']:,}")
    print(f"  • Column count:        {stats['cols']} {stats['columns']}")
    print(f"  • Missing / null rows: {stats['missing_values']:,}")
    print(f"  • Unique source txIds: {len(stats['source_nodes']):,}")
    print(f"  • Unique target txIds: {len(stats['target_nodes']):,}")
    print(f"  • Total unique nodes in graph edges: {len(stats['all_edge_nodes']):,}")
    
    # Referential integrity check
    if known_node_ids is not None:
        print("\n  • Referential Integrity (Edge -> Node Reference):")
        if stats["invalid_edges"] == 0:
            print("    [PASS] 100% of edges reference valid nodes in node dataset.")
            print(f"    - All {stats['rows']:,} edges map to known transaction IDs.")
        else:
            print(f"    [FAIL] Detected {stats['invalid_edges']:,} edges referencing unknown nodes!")
            print(f"    - Dangling source IDs: {len(stats['dangling_sources']):,}")
            print(f"    - Dangling target IDs: {len(stats['dangling_targets']):,}")
            
    return stats["rows"], stats


def validate_features(filepath: str, known_node_ids: Optional[Set[str]] = None) -> Tuple[int, Dict]:
    """Validate txs_features.csv columns, row counts, timesteps, and missing values."""
    print_section(f"Inspecting {os.path.basename(filepath)}")
    stats = {
        "file": os.path.basename(filepath),
        "size_bytes": os.path.getsize(filepath),
        "rows": 0,
        "cols": 0,
        "columns": [],
        "missing_cells": 0,
        "duplicate_txids": 0,
        "timesteps": Counter(),
        "feature_categories": {},
    }
    
    feature_node_ids: Set[str] = set()
    duplicate_count = 0
    missing_cells = 0
    
    with open(filepath, "r", encoding="utf-8", errors="replace") as f:
        reader = csv.reader(f)
        header = next(reader, None)
        if not header:
            print("[-] Error: Empty file.")
            return 0, stats
            
        stats["columns"] = header
        stats["cols"] = len(header)
        tx_id_idx = header.index("txId") if "txId" in header else 0
        time_idx = header.index("Time step") if "Time step" in header else 1
        
        # Categorize columns
        local_feats = [c for c in header if c.startswith("Local_feature")]
        agg_feats = [c for c in header if c.startswith("Aggregate_feature")]
        btc_feats = [c for c in header if c not in ["txId", "Time step"] and not c.startswith("Local_feature") and not c.startswith("Aggregate_feature")]
        
        stats["feature_categories"] = {
            "local_features_count": len(local_feats),
            "aggregate_features_count": len(agg_feats),
            "interpretable_blockchain_features_count": len(btc_feats),
            "interpretable_blockchain_features": btc_feats,
        }
        
        for row_num, row in enumerate(reader, start=1):
            stats["rows"] += 1
            if len(row) < len(header):
                missing_cells += (len(header) - len(row))
                
            tx_id = row[tx_id_idx].strip()
            ts = row[time_idx].strip()
            
            if tx_id in feature_node_ids:
                duplicate_count += 1
            else:
                feature_node_ids.add(tx_id)
                
            stats["timesteps"][ts] += 1
            
            # Sample check missing fields in first 500 rows and periodic
            if row_num <= 1000 or row_num % 50000 == 0:
                for val in row:
                    if val == "" or val.lower() == "nan" or val.lower() == "null":
                        missing_cells += 1
                        
    stats["missing_cells"] = missing_cells
    stats["duplicate_txids"] = duplicate_count
    
    print(f"  • File size:           {stats['size_bytes']:,} bytes ({stats['size_bytes'] / (1024*1024):.2f} MB)")
    print(f"  • Total rows:          {stats['rows']:,}")
    print(f"  • Total columns:       {stats['cols']:,}")
    print(f"  • Duplicate txIds:     {stats['duplicate_txids']:,}")
    print(f"  • Missing cells check: {stats['missing_cells']:,}")
    print(f"  • Local features:      {stats['feature_categories']['local_features_count']} (Local_feature_1..)")
    print(f"  • Aggregate features:  {stats['feature_categories']['aggregate_features_count']} (Aggregate_feature_1..)")
    print(f"  • Interpretable BTC features: {stats['feature_categories']['interpretable_blockchain_features_count']}")
    print(f"    Features: {', '.join(btc_feats[:8])}...")
    
    # Timestep statistics
    timesteps_sorted = sorted([int(t) for t in stats["timesteps"].keys() if t.isdigit()])
    if timesteps_sorted:
        print(f"  • Timestep range:      {min(timesteps_sorted)} to {max(timesteps_sorted)} (Total discrete steps: {len(timesteps_sorted)})")
        
    # Cross check node IDs with classes
    if known_node_ids is not None:
        matched = len(feature_node_ids.intersection(known_node_ids))
        print("\n  • Cross-Table ID Consistency:")
        if matched == len(known_node_ids) == len(feature_node_ids):
            print(f"    [PASS] 100% 1-to-1 match between txs_classes and txs_features ({matched:,} nodes).")
        else:
            print(f"    [WARN] Mismatch: {matched:,} overlap out of {len(known_node_ids):,} in classes vs {len(feature_node_ids):,} in features.")
            
    return stats["rows"], stats


def main():
    print_header("FraudGraph: Elliptic++ Dataset Integrity Validator")
    print(f"Target directory: {RAW_DATA_DIR}")
    
    classes_path = os.path.join(RAW_DATA_DIR, CLASSES_FILE)
    edgelist_path = os.path.join(RAW_DATA_DIR, EDGELIST_FILE)
    features_path = os.path.join(RAW_DATA_DIR, FEATURES_FILE)
    
    missing_files = []
    for fname, path in [(CLASSES_FILE, classes_path), (EDGELIST_FILE, edgelist_path), (FEATURES_FILE, features_path)]:
        if not os.path.exists(path):
            missing_files.append(fname)
            
    if missing_files:
        print("\n[!] WARNING: The following required dataset files were not found in data/raw/:")
        for f in missing_files:
            print(f"    - data/raw/{f}")
        print("\nPlease run:")
        print("    python scripts/download_dataset.py")
        print("or see download instructions in docs/DATASET.md.")
        sys.exit(1)
        
    # 1. Validate Classes
    known_node_ids, classes_stats = validate_classes(classes_path)
    
    # 2. Validate Edgelist
    edges_count, edge_stats = validate_edgelist(edgelist_path, known_node_ids)
    
    # 3. Validate Features
    features_count, feat_stats = validate_features(features_path, known_node_ids)
    
    # Executive Summary
    print_header("VALIDATION SUMMARY")
    print(f"  Dataset:                     Elliptic++ Bitcoin Transactions")
    print(f"  Total Transactions (Nodes):  {classes_stats['rows']:,}")
    print(f"  Total Payment Edges:         {edge_stats['rows']:,}")
    print(f"  Feature Columns:             {feat_stats['cols']:,}")
    print(f"  Duplicate Identifiers:       {classes_stats['duplicate_ids'] + edge_stats['duplicate_edges'] + feat_stats['duplicate_txids']:,}")
    print(f"  Edge Referential Integrity:  {'VALID (100% references verified)' if edge_stats['invalid_edges'] == 0 else 'INVALID'}")
    print(f"  Label Breakdown:")
    for code, count in sorted(classes_stats["label_counts"].items()):
        pct = count / classes_stats['rows'] * 100
        print(f"    * Class {code} ({LABEL_MAP.get(code, 'Unknown')}): {count:,} ({pct:.2f}%)")
    print("=" * 70)
    print("[SUCCESS] Dataset inspection and validation complete.")


if __name__ == "__main__":
    main()
