import React from 'react';
import { BarChart2, Hash, Layers, ShieldCheck } from 'lucide-react';

export const NetworkStatsPlaceholder: React.FC = () => {
  return (
    <div className="bg-[#181818] border border-[#262626] rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-[#262626] mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-[#222222] text-neutral-300 border border-[#2e2e2e]">
            <BarChart2 className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-neutral-100">Network Statistics</h2>
            <p className="text-xs text-neutral-400">Structural metrics and label distributions</p>
          </div>
        </div>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#202020] text-neutral-400 border border-[#2b2b2b]">
          Standby
        </span>
      </div>

      {/* Structured placeholder slots */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-lg border border-dashed border-[#262626] bg-[#141414] flex flex-col justify-between min-h-[96px]">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span className="font-medium">Graph Dimensions</span>
            <Hash className="w-3.5 h-3.5" />
          </div>
          <div className="text-xs text-neutral-500 italic">
            Nodes, edges, and density metrics will appear here
          </div>
        </div>

        <div className="p-3.5 rounded-lg border border-dashed border-[#262626] bg-[#141414] flex flex-col justify-between min-h-[96px]">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span className="font-medium">Class Labels</span>
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
          <div className="text-xs text-neutral-500 italic">
            Licit, illicit, and unlabelled proportions
          </div>
        </div>

        <div className="p-3.5 rounded-lg border border-dashed border-[#262626] bg-[#141414] flex flex-col justify-between min-h-[96px]">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span className="font-medium">Topology Indicators</span>
            <Layers className="w-3.5 h-3.5" />
          </div>
          <div className="text-xs text-neutral-500 italic">
            Components, diameter, and degree ratios
          </div>
        </div>
      </div>
    </div>
  );
};
