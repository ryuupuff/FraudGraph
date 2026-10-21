import React, { useState } from 'react';
import { CytoscapeGraph } from './CytoscapeGraph';
import { GraphLegend } from './GraphLegend';
import { NodeDetailsPanel } from './NodeDetailsPanel';
import { SYNTHETIC_GRAPH_FIXTURE } from '../../fixtures/syntheticGraphFixture';
import type { SelectedNodeDetails } from '../../types/graph';
import { Network, Database, Sparkles } from 'lucide-react';

export const GraphWorkspace: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<SelectedNodeDetails | null>(null);

  const nodeCount = SYNTHETIC_GRAPH_FIXTURE.nodes.length;
  const edgeCount = SYNTHETIC_GRAPH_FIXTURE.edges.length;

  return (
    <div className="flex flex-col space-y-4">
      {/* Graph Viewport Main Container */}
      <div className="bg-[#181818] border border-[#262626] rounded-xl overflow-hidden shadow-md flex flex-col">
        {/* Viewport Top Header */}
        <div className="px-5 py-3 border-b border-[#262626] bg-[#161616] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-violet-500/10 border border-violet-500/20 text-violet-400">
              <Network className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-neutral-100">
                  Transaction Graph Viewport
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/25 font-medium">
                  Synthetic Dev Fixture
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Synthetic 20-node development DAG for canvas testing (independent of live backend queries)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            {/* Quick Metrics Bar for the Fixture */}
            <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-[#202020] border border-[#2a2a2a] text-neutral-300">
              <Database className="w-3.5 h-3.5 text-amber-400" />
              <span>
                Dev Canvas: <strong className="text-white font-mono">{nodeCount}</strong> nodes ·{' '}
                <strong className="text-white font-mono">{edgeCount}</strong> edges
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#202020] border border-[#2a2a2a] text-neutral-400">
              <Sparkles className="w-3.5 h-3.5 text-neutral-500" />
              <span className="text-[11px] text-neutral-400 font-medium">
                Fixture Standby
              </span>
            </div>
          </div>
        </div>

        {/* Cytoscape Canvas Area */}
        <div className="h-[520px] w-full bg-[#101010] relative">
          <CytoscapeGraph
            elements={SYNTHETIC_GRAPH_FIXTURE}
            selectedNodeId={selectedNode?.id}
            onNodeSelect={setSelectedNode}
          />
        </div>

        {/* Visual Legend Bar */}
        <GraphLegend />
      </div>

      {/* Selected Node Details Area */}
      <NodeDetailsPanel
        details={selectedNode}
        onClearSelection={() => setSelectedNode(null)}
      />
    </div>
  );
};
