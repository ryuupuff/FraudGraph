/**
 * src/services/api.ts
 * Typed HTTP client communicating with the FraudGraph FastAPI backend.
 */

import type {
  HealthResponse,
  DatasetSummaryResponse,
  TimestepActivity,
  TransactionResponse,
  TransactionNeighborsResponse,
  ApiError,
} from '../types/api';

const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/+$/, '') ||
  'http://127.0.0.1:8000';

class FraudGraphApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = 'FraudGraphApiError';
    this.status = status;
    this.detail = detail;
  }
}

async function request<T>(endpoint: string): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      let detail = `Request failed with status ${response.status}`;
      try {
        const errorJson = (await response.json()) as ApiError;
        if (errorJson && errorJson.detail) {
          detail = errorJson.detail;
        }
      } catch {
        // Fall back to status text
        if (response.statusText) {
          detail = response.statusText;
        }
      }
      throw new FraudGraphApiError(response.status, detail);
    }

    return (await response.json()) as T;
  } catch (error: unknown) {
    if (error instanceof FraudGraphApiError) {
      throw error;
    }

    // Network / connection refused errors
    const message = error instanceof Error ? error.message : 'Unknown network error';
    throw new FraudGraphApiError(
      0,
      `Cannot connect to FraudGraph backend at ${API_BASE_URL}. Ensure the FastAPI server is running. (${message})`
    );
  }
}

/**
 * Check backend health and dataset load status.
 */
export async function fetchHealth(): Promise<HealthResponse> {
  return request<HealthResponse>('/api/health');
}

/**
 * Fetch total transaction counts, edges, and ground-truth class label distribution.
 */
export async function fetchDatasetSummary(): Promise<DatasetSummaryResponse> {
  return request<DatasetSummaryResponse>('/api/dataset/summary');
}

/**
 * Fetch transaction activity timeline across all 49 observation timesteps.
 */
export async function fetchDatasetTimeline(): Promise<TimestepActivity[]> {
  return request<TimestepActivity[]>('/api/dataset/timeline');
}

/**
 * Fetch transaction metadata, ground-truth label, timestep, and interpretable features.
 */
export async function fetchTransaction(txId: string): Promise<TransactionResponse> {
  const cleanId = encodeURIComponent(txId.trim());
  return request<TransactionResponse>(`/api/transactions/${cleanId}`);
}

/**
 * Fetch immediate incoming (predecessor) and outgoing (successor) neighbors.
 */
export async function fetchTransactionNeighbors(
  txId: string
): Promise<TransactionNeighborsResponse> {
  const cleanId = encodeURIComponent(txId.trim());
  return request<TransactionNeighborsResponse>(`/api/transactions/${cleanId}/neighbors`);
}

export { API_BASE_URL, FraudGraphApiError };
