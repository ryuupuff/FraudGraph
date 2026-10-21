import React, { useState, useCallback } from 'react';
import type { ElementsDefinition, NodeDefinition, EdgeDefinition } from 'cytoscape';
import { CytoscapeGraph } from './CytoscapeGraph';
import {
  fetchTransaction,
  fetchTransactionNeighbors,
  FraudGraphApiError,
} from '../../services/api';
import type {
  TransactionResponse,
  TransactionNeighborsResponse,
  TransactionLabel,
} from '../../types/api';
import {
  Network,
  Search,
  PlusCircle,
  RotateCcw,
  ShieldCheck,
  ShieldAlert,
  HelpCircle,
  Cpu,
  Hash,
  AlertCircle,
  Loader2,
  X,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRight,
  Database,
  Info,
  Sparkles,
  Check,
} from 'lucide-react';

const SEED_PRESETS = [
  { id: '3205536', name: 'Illicit Ransomware Split', label: 'illicit' },
  { id: '68869', name: 'Licit Custody Node', label: 'licit' },
  { id: '3321', name: 'Unknown Unlabelled Tx', label: 'unknown' },
  { id: '230425980', name: 'Multi-Hop Routing Tx', label: 'unknown' },
  { id: '89273', name: 'Licit Exchange Hub', label: 'licit' },
];

const MAX_CANVAS_NEIGHBORS = 25;

const formatDisplayLabel = (id: string): string => {
  return id.length > 7 ? `…${id.slice(-5)}` : id;
};

interface BoundedState {
  isBounded: boolean;
  totalIncoming: number;
  shownIncoming: number;
  totalOutgoing: number;
  shownOutgoing: number;
}

export const LiveGraphExplorer: React.FC = () => {
  const [searchInput, setSearchInput] = useState<string>('');
  const [elements, setElements] = useState<ElementsDefinition>({ nodes: [], edges: [] });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedDetails, setSelectedDetails] = useState<TransactionResponse | null>(null);
  const [selectedNeighbors, setSelectedNeighbors] = useState<TransactionNeighborsResponse | null>(null);

  const [currentSeedId, setCurrentSeedId] = useState<string | null>(null);
  const [boundedMode, setBoundedMode] = useState<boolean>(true);
  const [boundedInfo, setBoundedInfo] = useState<BoundedState | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [expanding, setExpanding] = useState<boolean>(false);
  const [inspectingNode, setInspectingNode] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  /**
   * Load a seed transaction and initialize the bounded graph canvas with its 1-hop neighborhood.
   */
  const handleLoadSeed = async (seedId: string, overrideBoundedMode?: boolean) => {
    const cleanId = seedId.trim();
    if (!cleanId) return;

    const useBounded = overrideBoundedMode !== undefined ? overrideBoundedMode : boundedMode;

    setLoading(true);
    setError(null);
    setStatusMessage(null);

    try {
      const [tx, neighbors] = await Promise.all([
        fetchTransaction(cleanId),
        fetchTransactionNeighbors(cleanId),
      ]);

      const totalIn = neighbors.incoming.length;
      const totalOut = neighbors.outgoing.length;

      const isBounded = useBounded && (totalIn > MAX_CANVAS_NEIGHBORS || totalOut > MAX_CANVAS_NEIGHBORS);

      const incomingToRender = (useBounded && totalIn > MAX_CANVAS_NEIGHBORS)
        ? neighbors.incoming.slice(0, MAX_CANVAS_NEIGHBORS)
        : neighbors.incoming;

      const outgoingToRender = (useBounded && totalOut > MAX_CANVAS_NEIGHBORS)
        ? neighbors.outgoing.slice(0, MAX_CANVAS_NEIGHBORS)
        : neighbors.outgoing;

      if (isBounded) {
        setBoundedInfo({
          isBounded: true,
          totalIncoming: totalIn,
          shownIncoming: incomingToRender.length,
          totalOutgoing: totalOut,
          shownOutgoing: outgoingToRender.length,
        });
      } else {
        setBoundedInfo(null);
      }

      // Build unique nodes map
      const nodeMap = new Map<string, NodeDefinition>();

      // 1. Center / Seed Node
      nodeMap.set(tx.tx_id, {
        data: {
          id: tx.tx_id,
          displayLabel: formatDisplayLabel(tx.tx_id),
          label: tx.label,
          class_code: tx.class_code,
          timestep: tx.timestep,
          amountBtc: tx.features.total_BTC ?? undefined,
          note: `Seed Node (${tx.label})`,
        },
      });

      // 2. Incoming Neighbors (bounded if enabled)
      incomingToRender.forEach((inNode) => {
        if (!nodeMap.has(inNode.tx_id)) {
          nodeMap.set(inNode.tx_id, {
            data: {
              id: inNode.tx_id,
              displayLabel: formatDisplayLabel(inNode.tx_id),
              label: inNode.label,
              class_code: inNode.class_code,
              note: `Inflow Source (${inNode.label})`,
            },
          });
        }
      });

      // 3. Outgoing Neighbors (bounded if enabled)
      outgoingToRender.forEach((outNode) => {
        if (!nodeMap.has(outNode.tx_id)) {
          nodeMap.set(outNode.tx_id, {
            data: {
              id: outNode.tx_id,
              displayLabel: formatDisplayLabel(outNode.tx_id),
              label: outNode.label,
              class_code: outNode.class_code,
              note: `Outflow Destination (${outNode.label})`,
            },
          });
        }
      });

      // Build unique edges for rendered subset
      const edgeMap = new Map<string, EdgeDefinition>();

      // Inflow edges: inNode -> seed
      incomingToRender.forEach((inNode) => {
        const edgeId = `${inNode.tx_id}->${tx.tx_id}`;
        edgeMap.set(edgeId, {
          data: {
            id: edgeId,
            source: inNode.tx_id,
            target: tx.tx_id,
          },
        });
      });

      // Outflow edges: seed -> outNode
      outgoingToRender.forEach((outNode) => {
        const edgeId = `${tx.tx_id}->${outNode.tx_id}`;
        edgeMap.set(edgeId, {
          data: {
            id: edgeId,
            source: tx.tx_id,
            target: outNode.tx_id,
          },
        });
      });

      const newElements: ElementsDefinition = {
        nodes: Array.from(nodeMap.values()),
        edges: Array.from(edgeMap.values()),
      };

      setElements(newElements);
      setCurrentSeedId(tx.tx_id);
      setSelectedNodeId(tx.tx_id);
      setSelectedDetails(tx);
      setSelectedNeighbors(neighbors);
      setSearchInput(tx.tx_id);

      if (neighbors.incoming_count === 0 && neighbors.outgoing_count === 0) {
        setStatusMessage(`Loaded isolated transaction ${tx.tx_id} (0 network connections in dataset).`);
      } else if (isBounded) {
        setStatusMessage(
          `Loaded seed ${tx.tx_id}: displayed ${newElements.nodes.length} nodes on canvas (${outgoingToRender.length} of ${totalOut} outgoing). Complete neighborhood (${totalIn + totalOut} flows) is listed in the Inspector.`
        );
      } else {
        const allOnCanvas = incomingToRender.length === totalIn && outgoingToRender.length === totalOut;
        setStatusMessage(
          `Loaded seed ${tx.tx_id} with ${newElements.nodes.length} nodes and ${newElements.edges.length} directed payment flows${
            allOnCanvas ? ' (all immediate neighbors rendered)' : ''
          }.`
        );
      }
    } catch (err: unknown) {
      if (err instanceof FraudGraphApiError) {
        setError(err.detail);
      } else {
        const msg = err instanceof Error ? err.message : 'Failed to load seed transaction.';
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBoundedMode = () => {
    const nextMode = !boundedMode;
    setBoundedMode(nextMode);
    if (currentSeedId) {
      handleLoadSeed(currentSeedId, nextMode);
    }
  };

  /**
   * Handle clicking a node on the canvas to inspect its full details.
   */
  const handleNodeClick = useCallback(async (nodeId: string) => {
    if (!nodeId) {
      // Clicked background
      setSelectedNodeId(null);
      setSelectedDetails(null);
      setSelectedNeighbors(null);
      return;
    }

    setSelectedNodeId(nodeId);
    setInspectingNode(true);
    setError(null);

    try {
      const [tx, neighbors] = await Promise.all([
        fetchTransaction(nodeId),
        fetchTransactionNeighbors(nodeId),
      ]);
      setSelectedDetails(tx);
      setSelectedNeighbors(neighbors);
    } catch (err: unknown) {
      console.warn(`Could not fetch details for node ${nodeId}:`, err);
    } finally {
      setInspectingNode(false);
    }
  }, []);

  /**
   * Expand the selected transaction's neighborhood: fetch neighbors and merge into graph.
   */
  const handleExpandNeighborhood = async () => {
    if (!selectedNodeId) return;

    setExpanding(true);
    setStatusMessage(null);
    setError(null);

    try {
      const neighbors = await fetchTransactionNeighbors(selectedNodeId);
      setSelectedNeighbors(neighbors);

      const totalIn = neighbors.incoming.length;
      const totalOut = neighbors.outgoing.length;

      const incomingToRender = (boundedMode && totalIn > MAX_CANVAS_NEIGHBORS)
        ? neighbors.incoming.slice(0, MAX_CANVAS_NEIGHBORS)
        : neighbors.incoming;

      const outgoingToRender = (boundedMode && totalOut > MAX_CANVAS_NEIGHBORS)
        ? neighbors.outgoing.slice(0, MAX_CANVAS_NEIGHBORS)
        : neighbors.outgoing;

      const isBoundedExpansion = boundedMode && (totalIn > MAX_CANVAS_NEIGHBORS || totalOut > MAX_CANVAS_NEIGHBORS);

      // Current nodes and edges
      const currentNodes = [...elements.nodes];
      const currentEdges = [...elements.edges];

      const existingNodeIds = new Set(currentNodes.map((n) => n.data.id));
      const existingEdgeIds = new Set(currentEdges.map((e) => e.data.id));

      let addedNodesCount = 0;
      let addedEdgesCount = 0;

      // Merge incoming neighbors
      incomingToRender.forEach((inNode) => {
        if (!existingNodeIds.has(inNode.tx_id)) {
          currentNodes.push({
            data: {
              id: inNode.tx_id,
              displayLabel: formatDisplayLabel(inNode.tx_id),
              label: inNode.label,
              class_code: inNode.class_code,
              note: `Expanded Inflow (${inNode.label})`,
            },
          });
          existingNodeIds.add(inNode.tx_id);
          addedNodesCount++;
        }

        const edgeId = `${inNode.tx_id}->${selectedNodeId}`;
        if (!existingEdgeIds.has(edgeId)) {
          currentEdges.push({
            data: {
              id: edgeId,
              source: inNode.tx_id,
              target: selectedNodeId,
            },
          });
          existingEdgeIds.add(edgeId);
          addedEdgesCount++;
        }
      });

      // Merge outgoing neighbors
      outgoingToRender.forEach((outNode) => {
        if (!existingNodeIds.has(outNode.tx_id)) {
          currentNodes.push({
            data: {
              id: outNode.tx_id,
              displayLabel: formatDisplayLabel(outNode.tx_id),
              label: outNode.label,
              class_code: outNode.class_code,
              note: `Expanded Outflow (${outNode.label})`,
            },
          });
          existingNodeIds.add(outNode.tx_id);
          addedNodesCount++;
        }

        const edgeId = `${selectedNodeId}->${outNode.tx_id}`;
        if (!existingEdgeIds.has(edgeId)) {
          currentEdges.push({
            data: {
              id: edgeId,
              source: selectedNodeId,
              target: outNode.tx_id,
            },
          });
          existingEdgeIds.add(edgeId);
          addedEdgesCount++;
        }
      });

      setElements({
        nodes: currentNodes,
        edges: currentEdges,
      });

      if (addedNodesCount === 0 && addedEdgesCount === 0) {
        setStatusMessage(`All immediate neighbors for ${selectedNodeId} are already visible on the canvas.`);
      } else if (isBoundedExpansion) {
        setStatusMessage(
          `Expanded ${selectedNodeId}: added ${addedNodesCount} nodes on canvas (${outgoingToRender.length} of ${totalOut} outgoing). Complete neighborhood (${totalIn + totalOut} flows) is listed in the Inspector.`
        );
      } else {
        setStatusMessage(
          `Expanded ${selectedNodeId}: added ${addedNodesCount} new transactions and ${addedEdgesCount} flows. (Total: ${currentNodes.length} nodes).`
        );
      }
    } catch (err: unknown) {
      if (err instanceof FraudGraphApiError) {
        setError(err.detail);
      } else {
        const msg = err instanceof Error ? err.message : 'Failed to expand neighborhood.';
        setError(msg);
      }
    } finally {
      setExpanding(false);
    }
  };

  /**
   * Reset canvas state to empty.
   */
  const handleClearGraph = () => {
    setElements({ nodes: [], edges: [] });
    setSelectedNodeId(null);
    setSelectedDetails(null);
    setSelectedNeighbors(null);
    setCurrentSeedId(null);
    setBoundedInfo(null);
    setStatusMessage(null);
    setError(null);
  };

  const getLabelBadge = (label?: TransactionLabel, classCode?: number) => {
    if (!label) return null;
    switch (label) {
      case 'illicit':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <ShieldAlert className="w-3.5 h-3.5" />
            Illicit (Class {classCode ?? 1})
          </span>
        );
      case 'licit':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            Licit (Class {classCode ?? 2})
          </span>
        );
      case 'unknown':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#242424] text-neutral-300 border border-[#303030]">
            <HelpCircle className="w-3.5 h-3.5" />
            Unknown (Class {classCode ?? 3})
          </span>
        );
    }
  };

  const formatBtc = (val?: number | null) => {
    if (val === undefined || val === null) return 'N/A';
    return `${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} BTC`;
  };

  const nodeCount = elements.nodes.length;
  const edgeCount = elements.edges.length;

  const existingNodeIdSet = new Set(elements.nodes.map((n) => n.data.id));
  const hasMatchedNeighbors = selectedNeighbors !== null && selectedNeighbors.tx_id === selectedNodeId;

  const unrenderedIncoming = hasMatchedNeighbors
    ? selectedNeighbors.incoming.filter((n) => !existingNodeIdSet.has(n.tx_id)).length
    : 0;

  const unrenderedOutgoing = hasMatchedNeighbors
    ? selectedNeighbors.outgoing.filter((n) => !existingNodeIdSet.has(n.tx_id)).length
    : 0;

  const totalUnrendered = unrenderedIncoming + unrenderedOutgoing;
  const isFullyExpanded = hasMatchedNeighbors && totalUnrendered === 0;

  return (
    <div className="flex flex-col space-y-4">
      {/* Top Search & Preset Seeds Bar */}
      <div className="bg-[#181818] border border-[#262626] rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20">
              <Network className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-neutral-100">
                  Real Graph Explorer
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#222222] text-neutral-300 border border-[#2e2e2e] font-medium">
                  Live API Engine
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Explore actual 203,769 Bitcoin transactions via bounded API neighborhood queries
              </p>
            </div>
          </div>

          {nodeCount > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClearGraph}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#222222] hover:bg-[#282828] text-xs text-neutral-300 border border-[#2e2e2e] transition-colors cursor-pointer"
                title="Reset graph canvas"
              >
                <RotateCcw className="w-3.5 h-3.5 text-neutral-400" />
                Clear Canvas
              </button>
            </div>
          )}
        </div>

        {/* Search input form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLoadSeed(searchInput);
          }}
          className="flex flex-col sm:flex-row gap-2"
        >
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
              <Hash className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Enter seed transaction ID (e.g. 3205536, 68869, 3321)..."
              className="w-full pl-9 pr-8 py-2 bg-[#121212] border border-[#262626] rounded-lg text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 font-mono transition-all"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-500 hover:text-neutral-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !searchInput.trim()}
            className="flex items-center justify-center gap-2 px-5 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:bg-[#222222] disabled:text-neutral-600 text-sm font-medium text-white transition-colors shadow-sm cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Explore Seed</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Seed Presets */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-neutral-400 pt-1">
          <span className="text-[11px] font-medium text-neutral-500 mr-1">Sample Seeds:</span>
          {SEED_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleLoadSeed(preset.id)}
              className="px-2.5 py-1 rounded bg-[#202020] hover:bg-[#282828] hover:text-neutral-100 text-[11px] font-mono text-neutral-300 border border-[#2b2b2b] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  preset.label === 'illicit'
                    ? 'bg-rose-400'
                    : preset.label === 'licit'
                    ? 'bg-emerald-400'
                    : 'bg-neutral-400'
                }`}
              />
              <span>{preset.id}</span>
              <span className="text-[10px] text-neutral-500 font-sans">({preset.name})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Notifications / Alerts */}
      {error && (
        <div className="p-3.5 rounded-lg bg-[#181818] border border-rose-900/40 text-rose-300 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold text-rose-200">Exploration Error:</span>
            <p className="text-rose-300/90">{error}</p>
          </div>
        </div>
      )}

      {statusMessage && (
        <div className="p-2.5 rounded-lg bg-[#181818] border border-violet-500/25 text-violet-300 text-xs flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-violet-400 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Main Graph Viewport Container */}
      <div className="bg-[#181818] border border-[#262626] rounded-xl overflow-hidden shadow-md flex flex-col">
        {/* Canvas Header Bar */}
        <div className="px-4 sm:px-5 py-2.5 border-b border-[#262626] bg-[#161616] flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="font-medium text-neutral-200">Topology Canvas</span>
            <span className="px-2 py-0.5 rounded bg-[#222222] text-neutral-300 font-mono text-[11px] border border-[#2e2e2e]">
              {nodeCount} Nodes · {edgeCount} Flows
            </span>
            {boundedInfo?.isBounded && (
              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-mono text-[11px] border border-amber-500/25 flex items-center gap-1">
                <span>Bounded Readability</span>
              </span>
            )}
            {selectedNodeId && (
              <span className="text-neutral-400 hidden sm:inline">
                Selected: <strong className="text-neutral-100 font-mono">{selectedNodeId}</strong>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle Bounded vs Full Canvas button if high-degree hub */}
            {boundedInfo?.isBounded && (
              <button
                type="button"
                onClick={handleToggleBoundedMode}
                className="px-2.5 py-1.5 rounded-md bg-[#222222] hover:bg-[#282828] text-xs text-neutral-300 border border-[#2e2e2e] transition-colors cursor-pointer"
                title="Toggle between bounded layout and complete raw canvas"
              >
                {boundedMode ? 'View Full Graph' : 'Enable Bounded Mode'}
              </button>
            )}

            {/* Expand Neighborhood Action Button */}
            {selectedNodeId && (
              <button
                type="button"
                onClick={handleExpandNeighborhood}
                disabled={expanding || inspectingNode || isFullyExpanded}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  isFullyExpanded
                    ? 'bg-[#202020] text-neutral-400 border border-[#2b2b2b] cursor-default'
                    : 'bg-violet-600 hover:bg-violet-500 text-white cursor-pointer'
                } disabled:opacity-75`}
                title={
                  isFullyExpanded
                    ? `All immediate network connections for transaction ${selectedNodeId} are already visible on the canvas.`
                    : `Expand ${totalUnrendered} additional immediate neighbor(s) onto the canvas.`
                }
              >
                {expanding || inspectingNode ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{expanding ? 'Expanding...' : 'Inspecting...'}</span>
                  </>
                ) : isFullyExpanded ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Fully Expanded</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Expand Neighborhood{totalUnrendered > 0 ? ` (${totalUnrendered})` : ''}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Bounded partial view communication banner */}
        {boundedInfo?.isBounded && boundedMode && (
          <div className="px-4 sm:px-5 py-2 bg-amber-500/10 border-b border-amber-500/25 text-xs text-amber-200 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Partial Canvas View:</strong> Rendering {boundedInfo.shownOutgoing} of {boundedInfo.totalOutgoing} outgoing flows to preserve graph readability. All {boundedInfo.totalOutgoing} transactions are complete and listed in the Inspector drawer below.
              </span>
            </div>
            <button
              type="button"
              onClick={handleToggleBoundedMode}
              className="text-[11px] underline text-amber-300 hover:text-amber-100 font-medium cursor-pointer"
            >
              Show all {boundedInfo.totalOutgoing} nodes on canvas
            </button>
          </div>
        )}

        {/* Viewport Canvas or Empty State */}
        <div className="h-[520px] w-full bg-[#101010] relative">
          {nodeCount > 0 ? (
            <CytoscapeGraph
              elements={elements}
              selectedNodeId={selectedNodeId}
              onNodeClick={handleNodeClick}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center text-neutral-400 select-none">
              <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-3">
                <Network className="w-6 h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-neutral-100 mb-1">
                Explore Real Bitcoin Transaction Neighborhoods
              </h3>
              <p className="text-xs text-neutral-400 max-w-lg leading-relaxed mb-5">
                Select a sample transaction below or search any ID above to visualize its directed payment graph, trace multi-hop flows, and inspect ground-truth labels.
              </p>

              {/* Sample Preset Seed Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-w-2xl w-full">
                {SEED_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleLoadSeed(p.id)}
                    className="group p-3 rounded-lg bg-[#141414] hover:bg-[#1a1a1a] border border-[#262626] hover:border-[#333333] text-left transition-colors cursor-pointer flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-semibold text-neutral-200 group-hover:text-violet-300 transition-colors">
                        {p.id}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                          p.label === 'illicit'
                            ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                            : p.label === 'licit'
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : 'bg-[#242424] text-neutral-300 border border-[#303030]'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            p.label === 'illicit'
                              ? 'bg-rose-400'
                              : p.label === 'licit'
                              ? 'bg-emerald-400'
                              : 'bg-neutral-400'
                          }`}
                        />
                        {p.label === 'illicit' ? 'Illicit' : p.label === 'licit' ? 'Licit' : 'Unknown'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#262626]">
                      <span className="text-[11px] text-neutral-500 group-hover:text-neutral-300 transition-colors">
                        {p.name}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-neutral-600 group-hover:text-violet-400 transform group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Real Dataset Legend */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 bg-[#141414] border-t border-[#262626] text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-neutral-400 font-medium">Verified Class:</span>

            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-emerald-400"></span>
              <span className="text-neutral-300">Licit (Class 2)</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 border border-rose-400"></span>
              <span className="text-neutral-300">Illicit (Class 1)</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-neutral-400 border border-neutral-300"></span>
              <span className="text-neutral-300">Unknown (Class 3)</span>
            </div>

            <div className="flex items-center gap-1.5 pl-2 border-l border-[#262626]">
              <span className="w-2.5 h-2.5 rounded-full bg-violet-500 ring-2 ring-violet-400/40"></span>
              <span className="text-neutral-300">Selected Node</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#1c1c1c] border border-[#262626] text-neutral-400 text-[11px] font-mono">
            <Database className="w-3 h-3 shrink-0" />
            <span>Elliptic++ Live Payment DAG</span>
          </div>
        </div>
      </div>

      {/* Selected Node Inspector Drawer */}
      {selectedDetails ? (
        <div className="bg-[#181818] border border-[#262626] rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-[#262626]">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-neutral-500 font-semibold">
                Inspected Transaction
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-1">
                <span className="font-mono text-base font-bold text-white">
                  {selectedDetails.tx_id}
                </span>
                {getLabelBadge(selectedDetails.label, selectedDetails.class_code)}
                <span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-[#222222] text-neutral-300 border border-[#2e2e2e] font-mono">
                  <Clock className="w-3 h-3 text-amber-400" />
                  Timestep {selectedDetails.timestep} / 49
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExpandNeighborhood}
                disabled={expanding || inspectingNode || isFullyExpanded}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  isFullyExpanded
                    ? 'bg-[#202020] text-neutral-400 border border-[#2b2b2b] cursor-default'
                    : 'bg-violet-600 hover:bg-violet-500 text-white cursor-pointer'
                } disabled:opacity-75`}
                title={
                  isFullyExpanded
                    ? `All immediate network connections for transaction ${selectedDetails.tx_id} are already visible on the canvas.`
                    : `Expand ${totalUnrendered} additional immediate neighbor(s) onto the canvas.`
                }
              >
                {expanding || inspectingNode ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : isFullyExpanded ? (
                  <Check className="w-3.5 h-3.5 text-neutral-400" />
                ) : (
                  <PlusCircle className="w-3.5 h-3.5" />
                )}
                <span>
                  {isFullyExpanded
                    ? 'Fully Expanded'
                    : `Expand Neighbors${totalUnrendered > 0 ? ` (${totalUnrendered})` : ''}`}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedNodeId(null);
                  setSelectedDetails(null);
                  setSelectedNeighbors(null);
                }}
                className="p-1.5 rounded hover:bg-[#222222] text-neutral-400 hover:text-white transition-colors cursor-pointer"
                title="Deselect transaction"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Epistemic note for unknown */}
          {selectedDetails.label === 'unknown' && (
            <div className="p-2.5 rounded bg-[#141414] border border-[#262626] text-xs text-neutral-400 flex items-start gap-2">
              <HelpCircle className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
              <span>
                <strong className="text-neutral-300">Unlabelled Node:</strong> This transaction has no verified
                entity label in Elliptic++. It is rendered as Unknown and not assumed to be illicit.
              </span>
            </div>
          )}

          {/* Blockchain features */}
          <div>
            <div className="text-xs font-semibold text-neutral-300 mb-2 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-violet-400" />
              <span>Interpretable Features</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 rounded bg-[#141414] border border-[#262626]">
                <div className="text-[11px] text-neutral-500">Total Volume</div>
                <div className="font-mono font-medium text-neutral-100 mt-0.5">
                  {formatBtc(selectedDetails.features.total_BTC)}
                </div>
              </div>

              <div className="p-2.5 rounded bg-[#141414] border border-[#262626]">
                <div className="text-[11px] text-neutral-500">Fee</div>
                <div className="font-mono font-medium text-neutral-100 mt-0.5">
                  {formatBtc(selectedDetails.features.fees)}
                </div>
              </div>

              <div className="p-2.5 rounded bg-[#141414] border border-[#262626]">
                <div className="text-[11px] text-neutral-500">Size</div>
                <div className="font-mono font-medium text-neutral-100 mt-0.5">
                  {selectedDetails.features.size ? `${selectedDetails.features.size} bytes` : 'N/A'}
                </div>
              </div>

              <div className="p-2.5 rounded bg-[#141414] border border-[#262626]">
                <div className="text-[11px] text-neutral-500">Addresses (In / Out)</div>
                <div className="font-mono font-medium text-neutral-100 mt-0.5">
                  {selectedDetails.features.num_input_addresses ?? 'N/A'} /{' '}
                  {selectedDetails.features.num_output_addresses ?? 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Connected neighbors summary */}
          {selectedNeighbors && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
              <div className="p-3.5 rounded-lg bg-[#141414] border border-[#262626]">
                <div className="flex items-center justify-between text-neutral-400 mb-2.5">
                  <span className="flex items-center gap-1.5 font-medium text-neutral-300">
                    <ArrowDownLeft className="w-3.5 h-3.5 text-violet-400" />
                    Incoming Inflows
                  </span>
                  <span className="font-mono font-bold text-violet-300 bg-violet-950/40 px-2 py-0.5 rounded border border-violet-900/40">
                    {selectedNeighbors.incoming_count} flows
                  </span>
                </div>
                {selectedNeighbors.incoming.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 max-h-44 overflow-y-auto pr-1">
                    {selectedNeighbors.incoming.map((n) => (
                      <button
                        key={n.tx_id}
                        type="button"
                        onClick={() => handleNodeClick(n.tx_id)}
                        className="px-2 py-1 rounded bg-[#1c1c1c] hover:bg-[#242424] text-[11px] font-mono text-neutral-300 border border-[#282828] hover:border-[#383838] flex items-center gap-1.5 transition-colors cursor-pointer"
                        title={`Inspect incoming transaction ${n.tx_id} (${n.label})`}
                      >
                        <span>{n.tx_id}</span>
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            n.label === 'illicit'
                              ? 'bg-rose-400'
                              : n.label === 'licit'
                              ? 'bg-emerald-400'
                              : 'bg-neutral-400'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-neutral-500 italic py-1">No incoming inputs (Inflow source / origin)</p>
                )}
              </div>

              <div className="p-3.5 rounded-lg bg-[#141414] border border-[#262626]">
                <div className="flex items-center justify-between text-neutral-400 mb-2.5">
                  <span className="flex items-center gap-1.5 font-medium text-neutral-300">
                    <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
                    Outgoing Outflows
                  </span>
                  <span className="font-mono font-bold text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-900/40">
                    {selectedNeighbors.outgoing_count} flows
                  </span>
                </div>
                {selectedNeighbors.outgoing.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 max-h-44 overflow-y-auto pr-1">
                    {selectedNeighbors.outgoing.map((n) => (
                      <button
                        key={n.tx_id}
                        type="button"
                        onClick={() => handleNodeClick(n.tx_id)}
                        className="px-2 py-1 rounded bg-[#1c1c1c] hover:bg-[#242424] text-[11px] font-mono text-neutral-300 border border-[#282828] hover:border-[#383838] flex items-center gap-1.5 transition-colors cursor-pointer"
                        title={`Inspect outgoing transaction ${n.tx_id} (${n.label})`}
                      >
                        <span>{n.tx_id}</span>
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            n.label === 'illicit'
                              ? 'bg-rose-400'
                              : n.label === 'licit'
                              ? 'bg-emerald-400'
                              : 'bg-neutral-400'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-neutral-500 italic py-1">No outgoing outputs (Outflow sink)</p>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        nodeCount > 0 && (
          <div className="p-4 bg-[#181818] border border-[#262626] rounded-lg text-center text-neutral-400 text-xs">
            <Info className="w-4 h-4 text-neutral-500 mx-auto mb-1" />
            Click any node on the graph to inspect its blockchain features and expand its neighborhood.
          </div>
        )
      )}
    </div>
  );
};
