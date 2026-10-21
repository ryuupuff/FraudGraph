import { useState } from 'react';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { LiveNetworkStats } from './components/dashboard/LiveNetworkStats';
import { TransactionSearch } from './components/search/TransactionSearch';
import { LiveGraphExplorer } from './components/graph/LiveGraphExplorer';
import { GraphWorkspace } from './components/graph/GraphWorkspace';
import type { NavItemKey } from './types/navigation';
import { ShieldCheck, Compass, Code, Network } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<NavItemKey>('overview');
  const [showDevFixture, setShowDevFixture] = useState<boolean>(false);

  return (
    <DashboardLayout activeTab={activeTab} onSelectTab={setActiveTab}>
      <div className="flex flex-col flex-1 space-y-6">
        {/* Top Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-[#262626]">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-neutral-100 flex items-center gap-3">
              {activeTab === 'overview' && <span>Overview & Forensic Dashboard</span>}
              {activeTab === 'explorer' && <span>Graph Explorer</span>}
              {activeTab === 'investigations' && <span>Transaction Investigations</span>}
              {activeTab === 'analytics' && <span>Network Analytics & Topology</span>}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-neutral-400 max-w-2xl leading-relaxed">
              {activeTab === 'explorer'
                ? 'Interactive, API-powered neighborhood exploration across 203,769 real Bitcoin transactions.'
                : 'Cryptocurrency transaction forensic intelligence platform. Investigate Bitcoin transaction neighborhoods, trace illicit payment paths, and examine graph structural indicators.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#181818] border border-[#262626] text-xs text-neutral-300">
              <ShieldCheck className="w-3.5 h-3.5 text-violet-400" />
              <span>Evidence-First Architecture</span>
            </div>

            {/* Optional developer sandbox toggle */}
            <button
              type="button"
              onClick={() => setShowDevFixture((prev) => !prev)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-mono transition-colors border cursor-pointer ${
                showDevFixture
                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                  : 'bg-[#181818] text-neutral-400 hover:text-neutral-200 border-[#262626]'
              }`}
              title="Toggle synthetic development fixture for layout testing"
            >
              <Code className="w-3.5 h-3.5" />
              <span>{showDevFixture ? 'Hide Dev Sandbox' : 'Dev Sandbox'}</span>
            </button>
          </div>
        </div>

        {/* Development Fixture Sandbox Notice (if enabled) */}
        {showDevFixture && (
          <div className="p-4 rounded-lg bg-[#181818] border border-amber-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-300 font-mono">
                <Code className="w-4 h-4 text-amber-400" />
                <span>DEVELOPER FIXTURE SANDBOX (NOT REAL TRANSACTIONS)</span>
              </div>
              <span className="text-[11px] text-amber-400/80">
                Purely synthetic 20-node DAG fixture for CSS & interaction regression tests
              </span>
            </div>
            <GraphWorkspace />
          </div>
        )}

        {/* Tab-specific Content */}
        {activeTab === 'overview' && (
          <div className="flex flex-col flex-1 space-y-6">
            {/* Live Dataset Summary */}
            <LiveNetworkStats />

            {/* Real API-Powered Graph Explorer */}
            <LiveGraphExplorer />

            {/* Transaction Dossier Search */}
            <TransactionSearch />
          </div>
        )}

        {activeTab === 'explorer' && (
          <div className="flex flex-col flex-1 space-y-6">
            <div className="px-4 py-2.5 rounded-lg bg-[#181818] border border-[#262626] text-xs text-neutral-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Network className="w-4 h-4 text-violet-400 shrink-0" />
                <span>
                  Active Mode: <strong className="text-neutral-100">Bounded API Neighborhood Explorer</strong>.
                  Queries the live FastAPI backend on demand.
                </span>
              </div>
            </div>

            {/* Primary Real Graph Explorer */}
            <LiveGraphExplorer />
          </div>
        )}

        {activeTab === 'investigations' && (
          <div className="flex flex-col flex-1 space-y-6">
            <div className="px-4 py-2.5 rounded-lg bg-[#181818] border border-[#262626] text-xs text-neutral-300 flex items-center gap-2">
              <Compass className="w-4 h-4 text-violet-400 shrink-0" />
              <span>
                Transaction Dossier & Evidence Examination: Inspect features and expand suspect flows.
              </span>
            </div>

            <TransactionSearch />
            <LiveGraphExplorer />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="flex flex-col flex-1 space-y-6">
            <LiveNetworkStats />
            <TransactionSearch />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default App;
