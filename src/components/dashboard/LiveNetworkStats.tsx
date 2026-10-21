import React, { useEffect, useState, useCallback } from 'react';
import { fetchDatasetSummary } from '../../services/api';
import type { DatasetSummaryResponse } from '../../types/api';
import { TransactionActivityChart } from './TransactionActivityChart';
import {
  Layers,
  ShieldCheck,
  ShieldAlert,
  HelpCircle,
  Hash,
  ArrowRightLeft,
  RotateCw,
  AlertTriangle,
  Clock,
  PieChart,
  Info,
} from 'lucide-react';

export const LiveNetworkStats: React.FC = () => {
  const [summary, setSummary] = useState<DatasetSummaryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredClass, setHoveredClass] = useState<'illicit' | 'licit' | 'unknown' | null>(null);

  const loadStats = useCallback(async () => {
    setError(null);
    try {
      const data = await fetchDatasetSummary();
      setSummary(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch dataset summary.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    fetchDatasetSummary()
      .then((data) => {
        if (!ignore) {
          setSummary(data);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          const message = err instanceof Error ? err.message : 'Failed to fetch dataset summary.';
          setError(message);
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    loadStats();
  };

  if (loading) {
    return (
      <div className="bg-[#181818] border border-[#262626] rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-[#262626]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#222222] animate-pulse" />
            <div className="space-y-1.5">
              <div className="w-40 h-4 bg-[#222222] rounded animate-pulse" />
              <div className="w-56 h-3 bg-[#222222]/60 rounded animate-pulse" />
            </div>
          </div>
          <div className="w-20 h-6 bg-[#222222] rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="h-28 bg-[#141414] border border-[#262626] rounded-xl animate-pulse" />
          <div className="h-28 bg-[#141414] border border-[#262626] rounded-xl animate-pulse" />
          <div className="h-28 bg-[#141414] border border-[#262626] rounded-xl animate-pulse" />
        </div>
        <div className="h-64 bg-[#141414] border border-[#262626] rounded-xl animate-pulse" />
        <div className="h-64 bg-[#141414] border border-[#262626] rounded-xl animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#181818] border border-rose-900/40 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/25">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-rose-200">
                Backend Connection Error
              </h2>
              <p className="text-xs text-rose-300/80 mt-0.5">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#222222] hover:bg-[#282828] text-xs text-neutral-200 border border-[#2e2e2e] transition-colors cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  const total = summary.total_nodes;
  const illicitCount = summary.label_counts.illicit;
  const licitCount = summary.label_counts.licit;
  const unknownCount = summary.label_counts.unknown;

  const illicitPct = total > 0 ? (illicitCount / total) * 100 : 0;
  const licitPct = total > 0 ? (licitCount / total) * 100 : 0;
  const unknownPct = total > 0 ? (unknownCount / total) * 100 : 0;

  const avgDegree = total > 0 ? (summary.total_edges / total).toFixed(2) : '0.00';

  // SVG Donut calculation
  const R = 70;
  const C = 2 * Math.PI * R; // ~439.82

  const unknownLen = total > 0 ? (unknownPct / 100) * C : 0;
  const licitLen = total > 0 ? (licitPct / 100) * C : 0;
  const illicitLen = total > 0 ? (illicitPct / 100) * C : 0;

  const unknownOffset = 0;
  const licitOffset = -unknownLen;
  const illicitOffset = -(unknownLen + licitLen);

  return (
    <div className="bg-[#181818] border border-[#262626] rounded-xl p-5 shadow-sm space-y-5">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#262626]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-neutral-100">
                Elliptic++ Dataset Forensic Summary
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#222222] text-neutral-300 border border-[#2e2e2e] font-medium">
                Live Backend API
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Graph scale, directed connectivity, and ground-truth forensic class distributions
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#222222] hover:bg-[#282828] text-xs text-neutral-300 border border-[#2e2e2e] transition-colors cursor-pointer"
          title="Refresh dataset statistics"
        >
          <RotateCw className="w-3.5 h-3.5 text-neutral-400" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Total Transactions (Nodes) */}
        <div className="p-4 rounded-xl border border-[#262626] bg-[#141414] flex flex-col justify-between transition-colors hover:border-[#333333]">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span className="font-medium text-neutral-300">Total Transactions</span>
            <div className="p-1.5 rounded-lg bg-[#202020] text-neutral-300 border border-[#2a2a2a]">
              <Hash className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight">
              {total.toLocaleString()}
            </div>
            <div className="text-[11px] text-neutral-400 mt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 shrink-0" />
              <span>Unique transaction vertices in DAG</span>
            </div>
          </div>
        </div>

        {/* Directed Payment Flows (Edges) */}
        <div className="p-4 rounded-xl border border-[#262626] bg-[#141414] flex flex-col justify-between transition-colors hover:border-[#333333]">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span className="font-medium text-neutral-300">Directed Payment Flows</span>
            <div className="p-1.5 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight">
              {summary.total_edges.toLocaleString()}
            </div>
            <div className="text-[11px] text-neutral-400 mt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
              <span>Directed payment edges ({avgDegree} per transaction)</span>
            </div>
          </div>
        </div>

        {/* Temporal Span (Timesteps) */}
        <div className="p-4 rounded-xl border border-[#262626] bg-[#141414] flex flex-col justify-between transition-colors hover:border-[#333333]">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span className="font-medium text-neutral-300">Temporal Span</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight">
              {summary.timesteps_count} <span className="text-sm font-normal text-neutral-400 font-sans">Timesteps</span>
            </div>
            <div className="text-[11px] text-neutral-400 mt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
              <span>Consecutive 2-week observation windows (1–49)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Ground-Truth Class Distribution Area */}
      <div className="p-5 rounded-xl border border-[#262626] bg-[#141414] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#262626]">
          <div>
            <h3 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-violet-400" />
              <span>Ground-Truth Transaction Class Distribution</span>
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Forensic labels observed in the Elliptic++ dataset (Illicit, Licit, and Unlabelled)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-neutral-300 bg-[#1c1c1c] px-2.5 py-1 rounded-md border border-[#262626]">
              Labeled: {(illicitCount + licitCount).toLocaleString()} ({((illicitPct + licitPct)).toFixed(2)}%)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Donut Chart Visualization (5 cols on lg) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-2">
            <div className="relative w-48 h-48 sm:w-52 sm:h-52">
              <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
                {/* Background Ring Track */}
                <circle
                  cx="100"
                  cy="100"
                  r={R}
                  fill="transparent"
                  stroke="#222222"
                  strokeWidth="22"
                />
                {/* Unknown segment */}
                <circle
                  cx="100"
                  cy="100"
                  r={R}
                  fill="transparent"
                  stroke="#71717a"
                  strokeWidth={hoveredClass === 'unknown' ? 26 : 22}
                  strokeDasharray={`${unknownLen} ${C - unknownLen}`}
                  strokeDashoffset={unknownOffset}
                  className="transition-all duration-300 cursor-pointer"
                  style={{ opacity: hoveredClass && hoveredClass !== 'unknown' ? 0.35 : 1 }}
                  onMouseEnter={() => setHoveredClass('unknown')}
                  onMouseLeave={() => setHoveredClass(null)}
                />
                {/* Licit segment */}
                <circle
                  cx="100"
                  cy="100"
                  r={R}
                  fill="transparent"
                  stroke="#10b981"
                  strokeWidth={hoveredClass === 'licit' ? 26 : 22}
                  strokeDasharray={`${licitLen} ${C - licitLen}`}
                  strokeDashoffset={licitOffset}
                  className="transition-all duration-300 cursor-pointer"
                  style={{ opacity: hoveredClass && hoveredClass !== 'licit' ? 0.35 : 1 }}
                  onMouseEnter={() => setHoveredClass('licit')}
                  onMouseLeave={() => setHoveredClass(null)}
                />
                {/* Illicit segment */}
                <circle
                  cx="100"
                  cy="100"
                  r={R}
                  fill="transparent"
                  stroke="#f43f5e"
                  strokeWidth={hoveredClass === 'illicit' ? 26 : 22}
                  strokeDasharray={`${illicitLen} ${C - illicitLen}`}
                  strokeDashoffset={illicitOffset}
                  className="transition-all duration-300 cursor-pointer"
                  style={{ opacity: hoveredClass && hoveredClass !== 'illicit' ? 0.35 : 1 }}
                  onMouseEnter={() => setHoveredClass('illicit')}
                  onMouseLeave={() => setHoveredClass(null)}
                />
              </svg>

              {/* Center Readout inside Donut Hole */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
                {hoveredClass === 'illicit' ? (
                  <>
                    <span className="text-[10px] font-semibold text-rose-400 tracking-wider uppercase">
                      Illicit (Class 1)
                    </span>
                    <span className="text-xl font-bold font-mono text-white mt-0.5">
                      {illicitCount.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-rose-300 font-mono">
                      {illicitPct.toFixed(2)}% of network
                    </span>
                  </>
                ) : hoveredClass === 'licit' ? (
                  <>
                    <span className="text-[10px] font-semibold text-emerald-400 tracking-wider uppercase">
                      Licit (Class 2)
                    </span>
                    <span className="text-xl font-bold font-mono text-white mt-0.5">
                      {licitCount.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-emerald-300 font-mono">
                      {licitPct.toFixed(2)}% of network
                    </span>
                  </>
                ) : hoveredClass === 'unknown' ? (
                  <>
                    <span className="text-[10px] font-semibold text-neutral-400 tracking-wider uppercase">
                      Unknown (Class 3)
                    </span>
                    <span className="text-xl font-bold font-mono text-white mt-0.5">
                      {unknownCount.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-neutral-300 font-mono">
                      {unknownPct.toFixed(2)}% of network
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-[10px] font-semibold text-neutral-400 tracking-wider uppercase">
                      Total Nodes
                    </span>
                    <span className="text-xl font-bold font-mono text-white mt-0.5">
                      {total.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-neutral-400 font-mono">
                      100% DAG Verified
                    </span>
                  </>
                )}
              </div>
            </div>
            <p className="text-[11px] text-neutral-500 mt-2 text-center">
              Hover over segments to inspect exact class metrics
            </p>
          </div>

          {/* Tabular / Card Breakdown Rows (7 cols on lg) */}
          <div className="lg:col-span-7 space-y-2.5">
            {/* Illicit Card */}
            <div
              onMouseEnter={() => setHoveredClass('illicit')}
              onMouseLeave={() => setHoveredClass(null)}
              className={`p-3 rounded-lg border transition-all cursor-pointer ${
                hoveredClass === 'illicit'
                  ? 'bg-rose-950/20 border-rose-500/40 shadow-sm'
                  : 'bg-[#181818] border-[#262626] hover:border-[#383838]'
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    <ShieldAlert className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-semibold text-neutral-200">
                    Illicit Transactions (Class 1)
                  </span>
                </div>
                <div className="flex items-baseline gap-2 font-mono">
                  <span className="text-sm font-bold text-rose-400">
                    {illicitCount.toLocaleString()}
                  </span>
                  <span className="text-xs text-rose-300/80">
                    ({illicitPct.toFixed(2)}%)
                  </span>
                </div>
              </div>
              <div className="w-full bg-[#242424] h-1.5 rounded-full overflow-hidden mt-2">
                <div
                  className="bg-rose-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${illicitPct}%` }}
                />
              </div>
              <p className="text-[11px] text-neutral-400 mt-1.5 leading-relaxed">
                Confirmed illicit entities (ransomware, darknet services, scams, exchange hacks).
              </p>
            </div>

            {/* Licit Card */}
            <div
              onMouseEnter={() => setHoveredClass('licit')}
              onMouseLeave={() => setHoveredClass(null)}
              className={`p-3 rounded-lg border transition-all cursor-pointer ${
                hoveredClass === 'licit'
                  ? 'bg-emerald-950/20 border-emerald-500/40 shadow-sm'
                  : 'bg-[#181818] border-[#262626] hover:border-[#383838]'
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-semibold text-neutral-200">
                    Licit Transactions (Class 2)
                  </span>
                </div>
                <div className="flex items-baseline gap-2 font-mono">
                  <span className="text-sm font-bold text-emerald-400">
                    {licitCount.toLocaleString()}
                  </span>
                  <span className="text-xs text-emerald-300/80">
                    ({licitPct.toFixed(2)}%)
                  </span>
                </div>
              </div>
              <div className="w-full bg-[#242424] h-1.5 rounded-full overflow-hidden mt-2">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${licitPct}%` }}
                />
              </div>
              <p className="text-[11px] text-neutral-400 mt-1.5 leading-relaxed">
                Verified compliant entities (regulated exchanges, merchant services, compliant miners).
              </p>
            </div>

            {/* Unknown Card */}
            <div
              onMouseEnter={() => setHoveredClass('unknown')}
              onMouseLeave={() => setHoveredClass(null)}
              className={`p-3 rounded-lg border transition-all cursor-pointer ${
                hoveredClass === 'unknown'
                  ? 'bg-[#202020] border-neutral-600 shadow-sm'
                  : 'bg-[#181818] border-[#262626] hover:border-[#383838]'
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-[#242424] text-neutral-400 border border-[#303030]">
                    <HelpCircle className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-semibold text-neutral-200">
                    Unknown / Unlabelled (Class 3)
                  </span>
                </div>
                <div className="flex items-baseline gap-2 font-mono">
                  <span className="text-sm font-bold text-neutral-200">
                    {unknownCount.toLocaleString()}
                  </span>
                  <span className="text-xs text-neutral-400">
                    ({unknownPct.toFixed(2)}%)
                  </span>
                </div>
              </div>
              <div className="w-full bg-[#242424] h-1.5 rounded-full overflow-hidden mt-2">
                <div
                  className="bg-neutral-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${unknownPct}%` }}
                />
              </div>
              <p className="text-[11px] text-neutral-400 mt-1.5 leading-relaxed">
                Ground-truth unlabelled. Preserved as neutral unknown; never assumed to be fraudulent.
              </p>
            </div>
          </div>
        </div>

        {/* Epistemic note */}
        <div className="p-3 rounded-lg bg-[#181818] border border-[#262626] text-xs text-neutral-400 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
          <span className="leading-relaxed">
            <strong className="text-neutral-300">Epistemic Standard:</strong> The Elliptic++ dataset has verified ground-truth labels for 22.85% of transactions.
            The remaining 77.15% are unlabelled. In FraudGraph, unlabelled transactions are strictly treated as unknown and never inferred as fraudulent without evidence.
          </span>
        </div>
      </div>

      {/* Transaction Activity Over Time */}
      <TransactionActivityChart timesteps={summary.timesteps} />
    </div>
  );
};
