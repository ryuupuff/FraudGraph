# FraudGraph Backend API

FastAPI graph intelligence service powered by NetworkX and pandas.

---

## 1. Prerequisites & Environment Setup

Python 3.11+ is required.

Install the backend dependencies:
```bash
pip install -r backend/requirements.txt
```

Ensure raw dataset files are downloaded in `data/raw/`:
- `data/raw/txs_classes.csv`
- `data/raw/txs_edgelist.csv`
- `data/raw/txs_features.csv`

(Run `python scripts/download_dataset.py` if not yet downloaded).

---

## 2. Running the Server

Start the FastAPI application with Uvicorn:

```bash
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

The interactive OpenAPI / Swagger documentation will be available at:
```
http://127.0.0.1:8000/docs
```

---

## 3. Implemented Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Backend status, dataset loaded state, total nodes and edges in memory. |
| `GET` | `/api/dataset/summary` | Real dataset metrics: node count (203,769), edge count (234,355), discrete timesteps (49), and exact ground-truth class label breakdown (illicit, licit, unknown). |
| `GET` | `/api/transactions/{tx_id}` | Transaction ID, verified class code & label, timestep, and 17 de-anonymized interpretable Bitcoin features. |
| `GET` | `/api/transactions/{tx_id}/neighbors` | Immediate incoming (predecessor) and outgoing (successor) transaction neighbors with their verified labels and connection counts. |

---

## 4. Running the Tests

Execute the automated test suite with pytest:

```bash
python -m pytest backend/tests -v
```
