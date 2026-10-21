import React from 'react';
import { AlertCircle, ArrowRight } from 'lucide-react';

export const GraphLegend: React.FC = () => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 bg-[#141414] border-t border-[#262626] text-xs">
      {/* Label Categories */}
      <div className="flex flex-wrap items-center gap-4">
        <span className="text-neutral-400 font-medium">Node Class:</span>

        {/* Licit */}
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-emerald-400"></span>
          <span className="text-neutral-300">Licit (Illustrative)</span>
        </div>

        {/* Illicit */}
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 border border-rose-400"></span>
          <span className="text-neutral-300">Illicit (Illustrative)</span>
        </div>

        {/* Unknown */}
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-neutral-400 border border-neutral-300"></span>
          <span className="text-neutral-300">Unknown (Illustrative)</span>
        </div>

        {/* Selected / Flow Highlights */}
        <div className="flex items-center gap-1.5 pl-2 border-l border-[#262626]">
          <span className="w-2.5 h-2.5 rounded-full bg-violet-500 ring-2 ring-violet-400/40"></span>
          <span className="text-neutral-300">Selected Node</span>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="flex items-center text-neutral-400 text-[11px]">
            <span className="w-2 h-0.5 bg-neutral-400 mr-0.5"></span>
            <ArrowRight className="w-3 h-3 text-neutral-400" />
          </div>
          <span className="text-neutral-300">Directed Payment Flow</span>
        </div>
      </div>

      {/* Synthetic Dev Notice */}
      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#1c1c1c] border border-[#262626] text-amber-300 text-[11px] font-mono">
        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
        <span>Synthetic Dev Fixture (Not real transactions)</span>
      </div>
    </div>
  );
};
