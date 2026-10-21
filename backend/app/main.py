"""
backend/app/main.py

FastAPI entry point for the FraudGraph backend.
Exposes endpoints for health, dataset summary, and transaction neighborhood queries.
"""

from contextlib import asynccontextmanager
import logging
import re
from typing import Optional
from fastapi import FastAPI, HTTPException, Path, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.app.schemas import (
    HealthResponse,
    DatasetSummaryResponse,
    TimestepActivity,
    TransactionResponse,
    TransactionNeighborsResponse,
    ErrorResponse,
)
from backend.app.services.graph_service import GraphService

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("fraudgraph.api")

# Singleton instance of the graph service
graph_service = GraphService()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager to load graph dataset upon application startup."""
    logger.info("Initializing FraudGraph backend and loading dataset...")
    try:
        graph_service.load_data()
        logger.info(
            "Dataset successfully loaded: %d nodes, %d edges.",
            len(graph_service.node_classes),
            graph_service.graph.number_of_edges(),
        )
    except FileNotFoundError as err:
        logger.error("Dataset files missing: %s", err)
    except Exception as exc:
        logger.error("Failed to load dataset during startup: %s", exc)
    yield
    logger.info("Shutting down FraudGraph backend.")


app = FastAPI(
    title="FraudGraph API",
    description="Graph intelligence engine for cryptocurrency transaction forensic investigation.",
    version="0.1.0",
    lifespan=lifespan,
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["GET", "OPTIONS"],
    allow_headers=["*"],
)


def _validate_tx_id(tx_id: str) -> str:
    """Validate transaction identifier format to avoid injection, path traversal or malformed input."""
    cleaned = tx_id.strip()
    if not cleaned:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transaction ID cannot be empty.",
        )
    if len(cleaned) > 80:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transaction ID exceeds maximum allowed length.",
        )
    # Check valid characters: alphanumeric, dashes, underscores
    if not re.match(r"^[A-Za-z0-9_-]+$", cleaned):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transaction ID contains invalid characters.",
        )
    return cleaned


@app.get(
    "/api/health",
    response_model=HealthResponse,
    summary="Backend Health Status",
    description="Report backend status and whether the dataset is loaded.",
    tags=["System"],
)
async def get_health():
    return HealthResponse(
        status="healthy",
        dataset_loaded=graph_service.is_loaded,
        total_nodes=len(graph_service.node_classes),
        total_edges=graph_service.graph.number_of_edges() if graph_service.is_loaded else 0,
        version="0.1.0",
    )


@app.get(
    "/api/dataset/summary",
    response_model=DatasetSummaryResponse,
    responses={503: {"model": ErrorResponse, "description": "Dataset not loaded"}},
    summary="Dataset Statistics Summary",
    description="Return node, edge, and ground-truth class label counts from the Elliptic++ dataset.",
    tags=["Dataset"],
)
async def get_dataset_summary():
    if not graph_service.is_loaded:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Dataset is not loaded. Ensure data files exist in data/raw/.",
        )
    return graph_service.get_summary()


@app.get(
    "/api/dataset/timeline",
    response_model=list[TimestepActivity],
    responses={503: {"model": ErrorResponse, "description": "Dataset not loaded"}},
    summary="Dataset Timeline Activity",
    description="Return transaction counts for each discrete timestep broken down by forensic class label.",
    tags=["Dataset"],
)
async def get_dataset_timeline():
    if not graph_service.is_loaded:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Dataset is not loaded. Ensure data files exist in data/raw/.",
        )
    return graph_service.get_summary().timesteps


@app.get(
    "/api/transactions/{tx_id}",
    response_model=TransactionResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid transaction identifier format"},
        404: {"model": ErrorResponse, "description": "Transaction not found"},
        503: {"model": ErrorResponse, "description": "Dataset not loaded"},
    },
    summary="Transaction Details",
    description="Return transaction ID, ground-truth label, timestep, and interpretable Bitcoin features.",
    tags=["Transactions"],
)
async def get_transaction(
    tx_id: str = Path(..., description="Unique transaction ID as string"),
):
    if not graph_service.is_loaded:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Dataset is not loaded. Ensure data files exist in data/raw/.",
        )

    valid_id = _validate_tx_id(tx_id)
    tx = graph_service.get_transaction(valid_id)
    if tx is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transaction '{valid_id}' not found in dataset.",
        )
    return tx


@app.get(
    "/api/transactions/{tx_id}/neighbors",
    response_model=TransactionNeighborsResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid transaction identifier format"},
        404: {"model": ErrorResponse, "description": "Transaction not found"},
        503: {"model": ErrorResponse, "description": "Dataset not loaded"},
    },
    summary="Transaction Neighbors",
    description="Return immediate incoming (predecessor) and outgoing (successor) neighbors with their labels.",
    tags=["Transactions"],
)
async def get_transaction_neighbors(
    tx_id: str = Path(..., description="Unique transaction ID as string"),
):
    if not graph_service.is_loaded:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Dataset is not loaded. Ensure data files exist in data/raw/.",
        )

    valid_id = _validate_tx_id(tx_id)
    neighbors = graph_service.get_neighbors(valid_id)
    if neighbors is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transaction '{valid_id}' not found in dataset.",
        )
    return neighbors
