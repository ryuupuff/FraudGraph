import React from 'react';
import { Network, Eye, Crosshair } from 'lucide-react';

export const GraphVisualizationPlaceholder: React.FC = () => {
  return (
    <div className="bg-[#181818] border border-[#262626] rounded-xl overflow-hidden shadow-sm flex flex-col flex-1 min-h-[460px]">
      {/* Canvas Header bar */}
      <div className="px-5 py-3 border-b border-[#262626] bg-[#161616] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-[#222222] text-neutral-300 border border-[#2e2e2e]">
            <Network className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neutral-100">Graph Viewport</h3>
            <p className="text-xs text-neutral-400">Interactive transaction topology canvas</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#202020] text-neutral-400 border border-[#2b2b2b] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-500"></span>
            Canvas Uninitialized
          </span>
        </div>
      </div>

      {/* Canvas Area with subtle radar / grid styling */}
      <div className="relative flex-1 p-6 flex flex-col items-center justify-center bg-[#101010] border-dashed border-[#262626] m-4 rounded-lg border">
        {/* Subtle decorative background grid */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none rounded-lg"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.12) 1px, transparent 0)`,
            backgroundSize: '24px 24px',
          }}
        />

        {/* Center Empty State Card */}
        <div className="relative z-10 max-w-md text-center flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-[#181818] border border-[#262626] flex items-center justify-center text-neutral-500 shadow-md mb-4 group">
            <Crosshair className="w-7 h-7 text-neutral-400" />
          </div>

          <h4 className="text-base font-semibold text-neutral-200 mb-1">
            Graph Canvas Ready
          </h4>
          <p className="text-xs text-neutral-400 leading-relaxed mb-5">
            The visualization viewport will render transaction nodes, directed payment flows, and ego-neighborhoods once data ingestion and graph layout services are connected.
          </p>

          <div className="flex items-center gap-3 text-xs text-neutral-400">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#181818] border border-[#262626]">
              <Eye className="w-3.5 h-3.5 text-neutral-400" />
              Direct DAG Layout
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#181818] border border-[#262626]">
              <Network className="w-3.5 h-3.5 text-neutral-400" />
              k-Hop Neighborhoods
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
