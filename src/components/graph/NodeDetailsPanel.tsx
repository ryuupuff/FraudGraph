import React from 'react';
import type { SelectedNodeDetails } from '../../types/graph';
import { ArrowDownLeft, ArrowUpRight, ShieldCheck, ShieldAlert, HelpCircle, X, Info } from 'lucide-react';

interface NodeDetailsPanelProps {
  details: SelectedNodeDetails | null;
  onClearSelection: () => void;
}

export const NodeDetailsPanel: React.FC<NodeDetailsPanelProps> = ({
  details,
  onClearSelection,
}) => {
  if (!details) {
    return (
      <div className="p-4 bg-[#181818] border border-[#262626] rounded-lg flex flex-col justify-center items-center text-center text-neutral-400 min-h-[140px]">
        <Info className="w-5 h-5 text-neutral-500 mb-2" />
        <p className="text-xs font-medium text-neutral-300">No Transaction Selected</p>
        <p className="text-[11px] text-neutral-500 max-w-sm mt-0.5">
          Click any transaction node on the canvas to inspect its ID, illustrative ground-truth label, incoming inputs, and outgoing outputs.
        </p>
      </div>
    );
  }

  const getLabelBadge = () => {
    switch (details.label) {
      case 'licit':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            Licit (Illustrative)
          </span>
        );
      case 'illicit':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <ShieldAlert className="w-3.5 h-3.5" />
            Illicit (Illustrative)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#242424] text-neutral-300 border border-[#303030]">
            <HelpCircle className="w-3.5 h-3.5" />
            Unknown (Illustrative)
          </span>
        );
    }
  };

  return (
    <div className="p-4 bg-[#181818] border border-[#262626] rounded-lg text-neutral-200 space-y-3 relative">
      {/* Header with ID and Dismiss */}
      <div className="flex items-start justify-between gap-2 border-b border-[#262626] pb-2.5">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-neutral-500 font-semibold">
            Transaction Inspector
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="font-mono font-bold text-sm text-white">
              {details.id}
            </span>
            {getLabelBadge()}
          </div>
        </div>

        <button
          type="button"
          onClick={onClearSelection}
          className="p-1 rounded text-neutral-400 hover:text-neutral-200 hover:bg-[#202020] transition-colors cursor-pointer"
          title="Clear selection"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Note / Context */}
      {details.note && (
        <div className="text-xs text-neutral-300 bg-[#141414] px-2.5 py-1.5 rounded border border-[#262626]">
          <span className="text-neutral-500 mr-1.5 font-medium">Context:</span>
          {details.note}
        </div>
      )}

      {/* Connection Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Incoming Connections */}
        <div className="p-2.5 rounded-lg bg-[#141414] border border-[#262626]">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-1.5">
            <span className="flex items-center gap-1.5 font-medium text-neutral-300">
              <ArrowDownLeft className="w-3.5 h-3.5 text-violet-400" />
              Incoming Inflows
            </span>
            <span className="font-mono font-bold text-violet-300 bg-violet-950/40 px-1.5 py-0.2 rounded border border-violet-900/40">
              {details.incomingCount}
            </span>
          </div>
          {details.incomingNeighbors.length > 0 ? (
            <div className="flex flex-wrap gap-1 mt-1">
              {details.incomingNeighbors.map((sourceId) => (
                <span
                  key={sourceId}
                  className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#202020] text-neutral-300 border border-[#2b2b2b]"
                >
                  {sourceId}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-neutral-500 italic">No incoming inputs (Source node)</p>
          )}
        </div>

        {/* Outgoing Connections */}
        <div className="p-2.5 rounded-lg bg-[#141414] border border-[#262626]">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-1.5">
            <span className="flex items-center gap-1.5 font-medium text-neutral-300">
              <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
              Outgoing Outflows
            </span>
            <span className="font-mono font-bold text-amber-300 bg-amber-950/40 px-1.5 py-0.2 rounded border border-amber-900/40">
              {details.outgoingCount}
            </span>
          </div>
          {details.outgoingNeighbors.length > 0 ? (
            <div className="flex flex-wrap gap-1 mt-1">
              {details.outgoingNeighbors.map((targetId) => (
                <span
                  key={targetId}
                  className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#202020] text-neutral-300 border border-[#2b2b2b]"
                >
                  {targetId}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-neutral-500 italic">No outgoing outputs (Sink node)</p>
          )}
        </div>
      </div>

      {/* Development disclaimer notice */}
      <div className="text-[11px] text-amber-400/80 bg-[#1c1c1c] px-2.5 py-1 rounded border border-[#262626]">
        Notice: Synthetic development entity. Real Elliptic++ features and model probabilities will integrate in subsequent steps.
      </div>
    </div>
  );
};
