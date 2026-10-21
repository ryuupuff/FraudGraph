export type TransactionLabel = 'licit' | 'illicit' | 'unknown';

export interface GraphNodeData {
  id: string;
  label: TransactionLabel;
  timestep?: number;
  synthetic: true;
  note?: string;
  amountBtc?: number;
}

export interface GraphEdgeData {
  id: string;
  source: string;
  target: string;
  synthetic: true;
  amountBtc?: number;
}

export interface SelectedNodeDetails {
  id: string;
  label: TransactionLabel;
  incomingCount: number;
  outgoingCount: number;
  incomingNeighbors: string[];
  outgoingNeighbors: string[];
  timestep?: number;
  note?: string;
  amountBtc?: number;
}

export type GraphLayoutType = 'dagre-lr' | 'dagre-tb' | 'breadthfirst' | 'cose';
