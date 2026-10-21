"""
backend/tests/conftest.py

Pytest fixtures for backend tests.
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app, graph_service


@pytest.fixture(scope="session")
def client():
    """Create test client with initialized graph service."""
    # Ensure graph data is loaded
    if not graph_service.is_loaded:
        graph_service.load_data()
    with TestClient(app) as test_client:
        yield test_client
