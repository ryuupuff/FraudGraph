import React, { useState } from 'react';
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
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  ShieldAlert,
  HelpCircle,
  Clock,
  Coins,
  Cpu,
  Hash,
  AlertCircle,
  Loader2,
  X,
  Info,
} from 'lucide-react';

const SAMPLE_TXS = [
  { id: '3205536', label: 'Illicit Sample', class: 'illicit' },
  { id: '68869', label: 'Licit Sample', class: 'licit' },
  { id: '3321', label: 'Unknown Sample', class: 'unknown' },
  { id: '230425980', label: 'Multi-Hop Sample', class: 'unknown' },
  { id: '89273', label: 'High-Outflow Hub', class: 'licit' },
];

export const TransactionSearch: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [txData, setTxData] = useState<TransactionResponse | null>(null);
  const [neighborsData, setNeighborsData] = useState<TransactionNeighborsResponse | null>(null);

  const handleSearch = async (targetId: string) => {
    const cleanId = targetId.trim();
    if (!cleanId) return;

    setLoading(true);
    setError(null);

    try {
      const [tx, neighbors] = await Promise.all([
        fetchTransaction(cleanId),
        fetchTransactionNeighbors(cleanId),
      ]);
      setTxData(tx);
      setNeighborsData(neighbors);
      setSearchTerm(cleanId);
    } catch (err: unknown) {
      setTxData(null);
      setNeighborsData(null);
      if (err instanceof FraudGraphApiError) {
        setError(err.detail);
      } else {
        const message = err instanceof Error ? err.message : 'Failed to query transaction.';
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchTerm);
  };

  const getLabelBadge = (label: TransactionLabel, classCode: number) => {
    switch (label) {
      case 'illicit':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <ShieldAlert className="w-3.5 h-3.5" />
            Illicit (Class {classCode})
          </span>
        );
      case 'licit':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            Licit (Class {classCode})
          </span>
        );
      case 'unknown':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#242424] text-neutral-300 border border-[#303030]">
            <HelpCircle className="w-3.5 h-3.5" />
            Unknown (Class {classCode})
          </span>
        );
    }
  };

  const formatBtc = (val?: number | null) => {
    if (val === undefined || val === null) return 'N/A';
    return `${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })} BTC`;
  };

  const formatNum = (val?: number | null) => {
    if (val === undefined || val === null) return 'N/A';
    return val.toLocaleString();
  };

  return (
    <div className="bg-[#181818] border border-[#262626] rounded-xl p-5 shadow-sm space-y-4">
      {/* Header and description */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#262626]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20">
            <Search className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-neutral-100">
                Transaction Dossier Lookup
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#222222] text-neutral-300 border border-[#2e2e2e] font-medium">
                Real Blockchain Query
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Query any transaction across the 203,769 nodes in the Elliptic++ dataset
            </p>
          </div>
        </div>
      </div>

      {/* Search Input Bar */}
      <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
            <Hash className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Enter transaction ID (e.g. 3205536, 68869, 3321)..."
            className="w-full pl-9 pr-8 py-2 bg-[#121212] border border-[#262626] rounded-lg text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 font-mono transition-all"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-500 hover:text-neutral-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !searchTerm.trim()}
          className="flex items-center justify-center gap-2 px-5 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:bg-[#222222] disabled:text-neutral-600 text-sm font-medium text-white transition-colors shadow-sm cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Querying...</span>
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              <span>Inspect</span>
            </>
          )}
        </button>
      </form>

      {/* Quick sample pills */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs text-neutral-400">
        <span className="text-[11px] font-medium text-neutral-500 mr-1">Quick Samples:</span>
        {SAMPLE_TXS.map((sample) => (
          <button
            key={sample.id}
            type="button"
            onClick={() => handleSearch(sample.id)}
            className="px-2 py-0.5 rounded bg-[#202020] hover:bg-[#282828] hover:text-neutral-100 text-[11px] font-mono text-neutral-300 border border-[#2b2b2b] transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>{sample.id}</span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                sample.class === 'illicit'
                  ? 'bg-rose-400'
                  : sample.class === 'licit'
                  ? 'bg-emerald-400'
                  : 'bg-neutral-400'
              }`}
            />
          </button>
        ))}
      </div>

      {/* Error state */}
      {error && (
        <div className="p-3.5 rounded-lg bg-[#181818] border border-rose-900/40 text-rose-300 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold text-rose-200">Query Failed:</span>
            <p className="text-rose-300/90">{error}</p>
          </div>
        </div>
      )}

      {/* Empty / Unsearched state - compact and unobtrusive */}
      {!txData && !loading && !error && (
        <div className="p-3.5 rounded-lg border border-[#262626] bg-[#141414] flex items-center gap-2.5 text-xs text-neutral-400">
          <Info className="w-4 h-4 text-neutral-500 shrink-0" />
          <span>
            Enter any transaction ID or select a quick sample above to inspect its verified label, temporal timestep, and blockchain feature dossier.
          </span>
        </div>
      )}

      {/* Detailed Transaction Result Card */}
      {txData && (
        <div className="rounded-xl border border-[#262626] bg-[#141414] p-5 space-y-4">
          {/* Identity & Label Header */}
          <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-[#262626]">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-neutral-500 font-semibold">
                Transaction Profile
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className="font-mono text-base font-bold text-white">
                  {txData.tx_id}
                </span>
                {getLabelBadge(txData.label, txData.class_code)}
                <span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-[#202020] text-neutral-300 border border-[#2e2e2e] font-mono">
                  <Clock className="w-3 h-3 text-amber-400" />
                  Timestep {txData.timestep} / 49
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setTxData(null);
                setNeighborsData(null);
                setSearchTerm('');
              }}
              className="p-1.5 rounded hover:bg-[#202020] text-neutral-400 hover:text-white transition-colors cursor-pointer"
              title="Close transaction profile"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Epistemic Label Callout for Unknown */}
          {txData.label === 'unknown' && (
            <div className="p-2.5 rounded bg-[#181818] border border-[#262626] text-xs text-neutral-400 flex items-start gap-2">
              <HelpCircle className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
              <span>
                <strong className="text-neutral-300">Unlabelled Transaction:</strong> This node does not have an
                identified ground-truth entity in Elliptic++. In FraudGraph, unknown labels are strictly preserved
                as unknown and never falsely flagged as fraud.
              </span>
            </div>
          )}

          {/* Interpretable Blockchain Features Grid */}
          <div>
            <div className="text-xs font-semibold text-neutral-300 mb-2 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-violet-400" />
              <span>De-anonymized Blockchain Features (Elliptic++)</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 rounded bg-[#181818] border border-[#262626]">
                <div className="text-[11px] text-neutral-500">Total Transacted</div>
                <div className="font-mono font-medium text-neutral-100 mt-0.5">
                  {formatBtc(txData.features.total_BTC)}
                </div>
              </div>

              <div className="p-2.5 rounded bg-[#181818] border border-[#262626]">
                <div className="text-[11px] text-neutral-500">Transaction Fee</div>
                <div className="font-mono font-medium text-neutral-100 mt-0.5">
                  {formatBtc(txData.features.fees)}
                </div>
              </div>

              <div className="p-2.5 rounded bg-[#181818] border border-[#262626]">
                <div className="text-[11px] text-neutral-500">Physical Size</div>
                <div className="font-mono font-medium text-neutral-100 mt-0.5">
                  {formatNum(txData.features.size)} bytes
                </div>
              </div>

              <div className="p-2.5 rounded bg-[#181818] border border-[#262626]">
                <div className="text-[11px] text-neutral-500">Addresses (In / Out)</div>
                <div className="font-mono font-medium text-neutral-100 mt-0.5">
                  {formatNum(txData.features.num_input_addresses)} / {formatNum(txData.features.num_output_addresses)}
                </div>
              </div>

              <div className="p-2.5 rounded bg-[#181818] border border-[#262626]">
                <div className="text-[11px] text-neutral-500">Graph In-Degree</div>
                <div className="font-mono font-semibold text-violet-400 mt-0.5">
                  {formatNum(txData.features.in_txs_degree)}
                </div>
              </div>

              <div className="p-2.5 rounded bg-[#181818] border border-[#262626]">
                <div className="text-[11px] text-neutral-500">Graph Out-Degree</div>
                <div className="font-mono font-semibold text-amber-400 mt-0.5">
                  {formatNum(txData.features.out_txs_degree)}
                </div>
              </div>

              <div className="p-2.5 rounded bg-[#181818] border border-[#262626]">
                <div className="text-[11px] text-neutral-500">Inflow Mean</div>
                <div className="font-mono font-medium text-neutral-100 mt-0.5">
                  {formatBtc(txData.features.in_BTC_mean)}
                </div>
              </div>

              <div className="p-2.5 rounded bg-[#181818] border border-[#262626]">
                <div className="text-[11px] text-neutral-500">Outflow Mean</div>
                <div className="font-mono font-medium text-neutral-100 mt-0.5">
                  {formatBtc(txData.features.out_BTC_mean)}
                </div>
              </div>
            </div>
          </div>

          {/* Neighbors / Payment Flow section */}
          {neighborsData && (
            <div className="pt-2 border-t border-[#262626] space-y-3">
              <div className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  <span>Immediate Graph Neighborhood</span>
                </span>
                <span className="text-[11px] text-neutral-500">
                  Click any neighbor to navigate
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Incoming inputs */}
                <div className="p-3.5 rounded-lg bg-[#181818] border border-[#262626]">
                  <div className="flex items-center justify-between text-neutral-400 mb-2.5">
                    <span className="flex items-center gap-1.5 font-medium text-neutral-300">
                      <ArrowDownLeft className="w-3.5 h-3.5 text-violet-400" />
                      Incoming Inflows (Predecessors)
                    </span>
                    <span className="font-mono font-bold text-violet-300 bg-violet-950/40 px-2 py-0.5 rounded border border-violet-900/40">
                      {neighborsData.incoming_count} flows
                    </span>
                  </div>

                  {neighborsData.incoming.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 max-h-44 overflow-y-auto pr-1">
                      {neighborsData.incoming.map((n) => (
                        <button
                          key={n.tx_id}
                          type="button"
                          onClick={() => handleSearch(n.tx_id)}
                          className="px-2 py-1 rounded bg-[#202020] hover:bg-[#282828] text-[11px] font-mono text-neutral-300 border border-[#2b2b2b] hover:border-[#383838] flex items-center gap-1.5 transition-colors cursor-pointer"
                          title={`Navigate to incoming tx ${n.tx_id} (${n.label})`}
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
                    <p className="text-[11px] text-neutral-500 italic py-1">No incoming transactions (Inflow origin / source)</p>
                  )}
                </div>

                {/* Outgoing outputs */}
                <div className="p-3.5 rounded-lg bg-[#181818] border border-[#262626]">
                  <div className="flex items-center justify-between text-neutral-400 mb-2.5">
                    <span className="flex items-center gap-1.5 font-medium text-neutral-300">
                      <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
                      Outgoing Outflows (Successors)
                    </span>
                    <span className="font-mono font-bold text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-900/40">
                      {neighborsData.outgoing_count} flows
                    </span>
                  </div>

                  {neighborsData.outgoing.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 max-h-44 overflow-y-auto pr-1">
                      {neighborsData.outgoing.map((n) => (
                        <button
                          key={n.tx_id}
                          type="button"
                          onClick={() => handleSearch(n.tx_id)}
                          className="px-2 py-1 rounded bg-[#202020] hover:bg-[#282828] text-[11px] font-mono text-neutral-300 border border-[#2b2b2b] hover:border-[#383838] flex items-center gap-1.5 transition-colors cursor-pointer"
                          title={`Navigate to outgoing tx ${n.tx_id} (${n.label})`}
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
                    <p className="text-[11px] text-neutral-500 italic py-1">No outgoing transactions (Outflow sink)</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
