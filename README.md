# FraudGraph

**An interactive Bitcoin transaction network visualization and forensic exploration platform.**

FraudGraph helps users explore relationships between Bitcoin transactions through an interactive directed graph, inspect connected transactions, and view class distributions and activity over time. It is built for educational and exploratory analysis—not as an automated system that proves fraud.

## Features

- **Overview dashboard** — summarizes the dataset and displays transaction-class distribution.
- **Interactive Graph Explorer** — explore transaction nodes and their directed connections, select nodes, and expand neighborhoods.
- **Analytics** — visualize transaction classes and activity across the dataset's observation timesteps.
- **REST API** — retrieve dataset summaries and transaction details from the FastAPI backend.

## Tech stack

| Component | Technology | Purpose |
|---|---|---|
| Frontend | React, TypeScript, Vite | User interface and development/build tooling |
| Graph visualization | Cytoscape.js | Interactive nodes and directed edges |
| Backend API | Python, FastAPI | Serves dataset and transaction information |
| Data processing | Pandas | Loads and processes tabular dataset files |
| Graph operations | NetworkX | Represents and operates on transaction relationships |

## Dataset

FraudGraph uses the **transaction portion of the Elliptic++ Bitcoin Transactions Dataset**, released for research by Elmougy and Liu.

The dataset used by this project contains:

- **203,769** transaction nodes
- **234,355** directed edges
- **183** transaction features
- **49** observation timesteps

The supplied class labels are:

| Label ID | Class |
|---:|---|
| 1 | Illicit |
| 2 | Licit |
| 3 | Unknown |

These labels come from the dataset's `txs_classes.csv`; FraudGraph does not independently assign or validate them. Unknown means the transaction is not labelled licit or illicit in the dataset. A graph connection or dataset label should not be treated, on its own, as proof of wrongdoing.

### Dataset files

Place the downloaded transaction dataset files in `data/raw/`:

- `txs_classes.csv` — transaction class labels
- `txs_edgelist.csv` — transaction relationships
- `txs_features.csv` — transaction features

The raw data directory and CSV files are excluded from Git by the project's `.gitignore`. Obtain the dataset from the official sources below and review their terms before reusing or redistributing it.

- [Official Elliptic++ GitHub repository](https://github.com/git-disl/EllipticPlusPlus)
- [Transactions Dataset README](https://github.com/git-disl/EllipticPlusPlus/blob/main/Transactions%20Dataset/README.md)
- [Original research paper (DOI)](https://doi.org/10.1145/3580305.3599803)

Please cite the original dataset paper when using the dataset in research or other academic work.

## Getting started

### Prerequisites

Install a recent version of Node.js/npm and Python. Use a Python version compatible with the backend dependencies.

### 1. Clone the repository

```bash
git clone https://github.com/ryuupuff/FraudGraph.git
cd FraudGraph
```

### 2. Set up the frontend

```bash
npm install
npm run dev
```

Vite will print the local development URL in the terminal.

### 3. Set up the backend

Create and activate a Python virtual environment from the project root.

**Windows PowerShell:**

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Install the backend requirements using the dependency file included in the repository. If the repository's backend dependency file is named `requirements.txt`, run:

```powershell
pip install -r requirements.txt
```

Start the API from the project root using the project's FastAPI app entry point:

```powershell
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

If your local dependency file or app entry point differs, follow the paths present in your checkout.

### Useful API endpoints

When the backend is running, the project provides endpoints including:

- `GET /api/health` — backend health check
- `GET /api/dataset/summary` — dataset summary
- `GET /api/transactions/{tx_id}` — transaction details
- `GET /api/transactions/{tx_id}/neighbors` — neighboring transactions

## Project structure

```text
FraudGraph/
├── backend/       # FastAPI backend and graph/data processing
├── data/          # Local dataset files (not committed)
├── docs/          # Project documentation
├── public/        # Static frontend assets
├── scripts/       # Project scripts
├── src/           # React + TypeScript frontend
├── .env.example   # Example configuration (no secrets)
└── README.md
```

## Responsible use and limitations

FraudGraph is an exploratory visualization tool. It does not currently claim to be a validated fraud-prediction model. Transaction relationships are not proof that a person committed wrongdoing, and dataset labels should be interpreted in the context of the original research. Avoid attempts to identify private individuals from pseudonymous transaction data.

## License

No license has been added yet. Until a license is selected, do not assume that the repository's code is available for reuse under an open-source license. The dataset is separately governed by its original source's terms.
