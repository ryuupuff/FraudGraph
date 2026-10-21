# Elliptic++ Bitcoin Dataset Documentation

This document describes the official **Elliptic++** dataset used in FraudGraph, including its origins, schemas, file definitions, acquisition instructions, and validation procedures.

---

## 1. Overview & Attribution

The **Elliptic++** dataset is an expanded, multi-relational benchmark graph dataset of the Bitcoin blockchain introduced for financial forensics, anti-money laundering (AML), and graph machine learning research. It extends the original Elliptic dataset by de-anonymizing transaction features and mapping transactions to Bitcoin wallet addresses.

- **Official Repository**: [https://github.com/git-disl/EllipticPlusPlus](https://github.com/git-disl/EllipticPlusPlus)
- **Official Google Drive Storage**: [Google Drive Folder (1MRPXz79Lu_JGLlJ21MDfML44dKN9R08l)](https://drive.google.com/drive/folders/1MRPXz79Lu_JGLlJ21MDfML44dKN9R08l?usp=sharing)
- **Primary Authors**: Youssef Elmougy & Ling Liu (Distributed Data Intensive Systems Lab, Georgia Institute of Technology)
- **Paper Citation**:
  > Youssef Elmougy and Ling Liu. 2023. *Demystifying Fraudulent Transactions and Illicit Nodes in the Bitcoin Network for Financial Forensics*. ACM SIGKDD International Conference on Knowledge Discovery and Data Mining (KDD 2023).

### Licensing & Access
- The dataset is released publicly for academic and open research by Georgia Tech DiSL.
- No API key, account registration, or access token is required.
- Files are hosted on Google Drive and tracked via Git LFS in the upstream repository.

---

## 2. Dataset Files & Schema Specification

FraudGraph focuses on the **Transactions Dataset** component of Elliptic++, which captures transaction-to-transaction payment flows across 49 discrete timesteps (each spanning a 2-week window).

All raw files reside in `data/raw/` (ignored by Git):

### A. `txs_classes.csv` (Ground Truth Labels)
Maps transaction identifiers to their verified ground-truth forensic classification.

| Column | Type | Description |
| :--- | :--- | :--- |
| `txId` | `int64` / string | Unique identifier of the Bitcoin transaction. |
| `class` | `int` | Categorical label indicator: `1` = Illicit, `2` = Licit, `3` = Unknown / Unlabelled. |

- **Total Records**: 203,769 transactions (+ 1 header row)
- **Label Semantics**:
  - **`1` (Illicit)**: 4,545 transactions (~2.23%) — Entities associated with scams, ransomware, darknet markets, Ponzi schemes, and terrorist financing.
  - **`2` (Licit)**: 42,019 transactions (~20.62%) — Regulated exchanges, miners, merchant services, and legitimate custody providers.
  - **`3` (Unknown / Unlabelled)**: 157,205 transactions (~77.15%) — Unclassified transactions requiring investigative analysis.

### B. `txs_edgelist.csv` (Directed Payment Graph)
Represents the directed flow of funds between Bitcoin transactions.

| Column | Type | Description |
| :--- | :--- | :--- |
| `txId1` | `int64` / string | Source transaction producing a transaction output. |
| `txId2` | `int64` / string | Target transaction spending that output as a transaction input. |

- **Total Records**: 234,355 directed edges (+ 1 header row)
- **Directionality**: Directed payment flow $txId_1 \to txId_2$. A transaction network in Bitcoin is a Directed Acyclic Graph (DAG) across time steps.

### C. `txs_features.csv` (Transaction Features)
Numerical feature vectors capturing local, graph aggregate, and newly de-anonymized blockchain properties.

| Column Span | Count | Description |
| :--- | :--- | :--- |
| `txId` | 1 | Unique transaction ID. |
| `Time step` | 1 | Discrete time step interval from $1$ to $49$. |
| `Local_feature_1` ... `Local_feature_93` | 93 | Local transaction features (transacted volume, fees, number of inputs/outputs). |
| `Aggregate_feature_1` ... `Aggregate_feature_72` | 72 | Aggregated neighborhood features (1-hop backward/forward mean, std, min, max). |
| Interpretable Blockchain Features | 17 | De-anonymized features added by Elliptic++ (see breakdown below). |

**17 Interpretable Blockchain Features:**
1. `in_txs_degree` — In-degree in the transaction network.
2. `out_txs_degree` — Out-degree in the transaction network.
3. `total_BTC` — Total transaction volume in Bitcoin.
4. `fees` — Transaction fee in BTC.
5. `size` — Physical transaction size in bytes.
6. `num_input_addresses` — Count of distinct input addresses.
7. `num_output_addresses` — Count of distinct output addresses.
8. `in_BTC_min`, `in_BTC_max`, `in_BTC_mean`, `in_BTC_median`, `in_BTC_total` — Summary statistics of input BTC amounts.
9. `out_BTC_min`, `out_BTC_max`, `out_BTC_mean`, `out_BTC_median`, `out_BTC_total` — Summary statistics of output BTC amounts.

- **Total Records**: 203,769 rows x 184 columns (+ 1 header row)

---

## 3. How to Obtain the Dataset

### Method 1: Automated Download (Recommended)
Run the automated acquisition script from the project root:

```bash
python scripts/download_dataset.py
```

This script connects directly to the official Google Drive files, handles Google Drive's virus scan confirmation tokens for files exceeding 100MB, and streams files directly into `data/raw/`.

### Method 2: Manual Download
If the automated network download is blocked by your firewall or proxy:

1. Open the official [Google Drive Folder](https://drive.google.com/drive/folders/1MRPXz79Lu_JGLlJ21MDfML44dKN9R08l?usp=sharing).
2. Download the following three files from the `Transactions Dataset` directory:
   - `txs_classes.csv`
   - `txs_edgelist.csv`
   - `txs_features.csv`
3. Place all three files into:
   ```
   <project_root>/data/raw/
   ```
   Specifically:
   - `data/raw/txs_classes.csv`
   - `data/raw/txs_edgelist.csv`
   - `data/raw/txs_features.csv`

---

## 4. Validating Dataset Integrity

To verify file completeness, schemas, missing values, duplicate IDs, label distribution, and referential integrity between edges and nodes:

```bash
python scripts/validate_dataset.py
```

The script executes:
1. **Schema Check**: Verifies headers, column counts, and column classifications.
2. **Missing & Duplicate Check**: Detects missing cells and duplicate transaction identifiers or duplicate edges.
3. **Label Verification**: Confirms exact class distributions (Class 1 Illicit, Class 2 Licit, Class 3 Unknown).
4. **Referential Integrity**: Verifies that 100% of directed edges in `txs_edgelist.csv` reference valid node IDs present in `txs_classes.csv` and `txs_features.csv`.
