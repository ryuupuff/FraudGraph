/**
 * src/types/api.ts
 * Type definitions matching the FraudGraph FastAPI backend schemas.
 */

export interface HealthResponse {
  status: string;
  dataset_loaded: boolean;
  total_nodes: number;
  total_edges: number;
  version: string;
}

export interface LabelCounts {
  illicit: number;
  licit: number;
  unknown: number;
}

export interface TimestepActivity {
  timestep: number;
  illicit: number;
  licit: number;
  unknown: number;
  total: number;
}

export interface DatasetSummaryResponse {
  total_nodes: number;
  total_edges: number;
  timesteps_count: number;
  label_counts: LabelCounts;
  label_codes: Record<string, number>;
  timesteps?: TimestepActivity[];
}

export interface InterpretableFeatures {
  in_txs_degree?: number | null;
  out_txs_degree?: number | null;
  total_BTC?: number | null;
  fees?: number | null;
  size?: number | null;
  num_input_addresses?: number | null;
  num_output_addresses?: number | null;
  in_BTC_min?: number | null;
  in_BTC_max?: number | null;
  in_BTC_mean?: number | null;
  in_BTC_median?: number | null;
  in_BTC_total?: number | null;
  out_BTC_min?: number | null;
  out_BTC_max?: number | null;
  out_BTC_mean?: number | null;
  out_BTC_median?: number | null;
  out_BTC_total?: number | null;
}

export type TransactionLabel = 'illicit' | 'licit' | 'unknown';

export interface TransactionResponse {
  tx_id: string;
  class_code: number;
  label: TransactionLabel;
  timestep: number;
  features: InterpretableFeatures;
}

export interface NeighborNode {
  tx_id: string;
  class_code: number;
  label: TransactionLabel;
}

export interface TransactionNeighborsResponse {
  tx_id: string;
  class_code: number;
  label: TransactionLabel;
  incoming_count: number;
  outgoing_count: number;
  incoming: NeighborNode[];
  outgoing: NeighborNode[];
}

export interface ApiError {
  detail: string;
  status?: number;
}
