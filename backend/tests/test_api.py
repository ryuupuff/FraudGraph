"""
backend/tests/test_api.py

Integration and unit tests for the FraudGraph backend endpoints.
"""

import pytest
from fastapi.testclient import TestClient


def test_health_endpoint(client: TestClient):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["dataset_loaded"] is True
    assert data["total_nodes"] == 203769
    assert data["total_edges"] == 234355
    assert data["version"] == "0.1.0"


def test_dataset_summary(client: TestClient):
    response = client.get("/api/dataset/summary")
    assert response.status_code == 200
    data = response.json()
    assert data["total_nodes"] == 203769
    assert data["total_edges"] == 234355
    assert data["timesteps_count"] == 49
    
    # Exact label counts according to Elliptic++ ground truth
    label_counts = data["label_counts"]
    assert label_counts["illicit"] == 4545
    assert label_counts["licit"] == 42019
    assert label_counts["unknown"] == 157205

    # Check raw codes mapping
    label_codes = data["label_codes"]
    assert label_codes["1"] == 4545
    assert label_codes["2"] == 42019
    assert label_codes["3"] == 157205

    # Check timesteps activity list
    timesteps = data["timesteps"]
    assert len(timesteps) == 49
    assert timesteps[0]["timestep"] == 1
    assert timesteps[0]["illicit"] == 17
    assert timesteps[0]["licit"] == 2130
    assert timesteps[0]["unknown"] == 5733
    assert timesteps[0]["total"] == 7880
    assert timesteps[-1]["timestep"] == 49


def test_dataset_timeline(client: TestClient):
    response = client.get("/api/dataset/timeline")
    assert response.status_code == 200
    timeline = response.json()
    assert len(timeline) == 49
    assert timeline[0]["timestep"] == 1
    assert timeline[0]["total"] == 7880
    assert timeline[0]["illicit"] + timeline[0]["licit"] + timeline[0]["unknown"] == timeline[0]["total"]


def test_get_transaction_illicit(client: TestClient):
    # '3205536' is a known illicit transaction (class 1)
    response = client.get("/api/transactions/3205536")
    assert response.status_code == 200
    data = response.json()
    assert data["tx_id"] == "3205536"
    assert data["class_code"] == 1
    assert data["label"] == "illicit"
    assert 1 <= data["timestep"] <= 49
    
    # Check interpretable features presence
    features = data["features"]
    assert "in_txs_degree" in features
    assert "out_txs_degree" in features
    assert "total_BTC" in features
    assert "fees" in features


def test_get_transaction_licit(client: TestClient):
    # '68869' is a known licit transaction (class 2)
    response = client.get("/api/transactions/68869")
    assert response.status_code == 200
    data = response.json()
    assert data["tx_id"] == "68869"
    assert data["class_code"] == 2
    assert data["label"] == "licit"
    assert 1 <= data["timestep"] <= 49


def test_get_transaction_unknown(client: TestClient):
    # '3321' is an unlabelled transaction (class 3)
    response = client.get("/api/transactions/3321")
    assert response.status_code == 200
    data = response.json()
    assert data["tx_id"] == "3321"
    assert data["class_code"] == 3
    assert data["label"] == "unknown"


def test_get_transaction_not_found(client: TestClient):
    response = client.get("/api/transactions/nonexistent_tx_99999999999")
    assert response.status_code == 404
    data = response.json()
    assert "not found" in data["detail"].lower()


def test_get_transaction_invalid_id(client: TestClient):
    # Injection/invalid character test
    response = client.get("/api/transactions/invalid@id!123")
    assert response.status_code == 400
    data = response.json()
    assert "invalid characters" in data["detail"].lower()


def test_get_neighbors_success(client: TestClient):
    # '230425980' has known predecessor '98374661' and successor '5530458'
    response = client.get("/api/transactions/230425980/neighbors")
    assert response.status_code == 200
    data = response.json()
    assert data["tx_id"] == "230425980"
    assert data["incoming_count"] >= 1
    assert data["outgoing_count"] >= 1
    
    in_ids = [node["tx_id"] for node in data["incoming"]]
    out_ids = [node["tx_id"] for node in data["outgoing"]]
    assert "98374661" in in_ids
    assert "5530458" in out_ids

    # Validate structure of neighbor item
    neighbor_sample = data["incoming"][0]
    assert "tx_id" in neighbor_sample
    assert "class_code" in neighbor_sample
    assert "label" in neighbor_sample


def test_get_neighbors_high_degree(client: TestClient):
    # '89273' is a licit transaction hub with 288 outputs
    response = client.get("/api/transactions/89273/neighbors")
    assert response.status_code == 200
    data = response.json()
    assert data["tx_id"] == "89273"
    assert data["class_code"] == 2
    assert data["label"] == "licit"
    assert data["outgoing_count"] == 288
    assert len(data["outgoing"]) == 288


def test_get_neighbors_not_found(client: TestClient):
    response = client.get("/api/transactions/nonexistent_tx_99999999999/neighbors")
    assert response.status_code == 404
    data = response.json()
    assert "not found" in data["detail"].lower()
