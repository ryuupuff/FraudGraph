import React, { useEffect, useState } from 'react';
import { Network, Menu, X, Shield, Activity } from 'lucide-react';
import { fetchHealth } from '../../services/api';

interface HeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ sidebarOpen, onToggleSidebar }) => {
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  useEffect(() => {
    fetchHealth()
      .then((res) => {
        setBackendOnline(res.status === 'healthy' && res.dataset_loaded);
      })
      .catch(() => {
        setBackendOnline(false);
      });
  }, []);

  return (
    <header className="h-14 border-b border-[#262626] bg-[#141414]/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-3">
        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={sidebarOpen ? "Close navigation menu" : "Open navigation menu"}
          className="p-1.5 -ml-1.5 rounded-md text-neutral-400 hover:text-neutral-200 hover:bg-[#202020] lg:hidden transition-colors"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Brand / Logo */}
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-md bg-violet-500/10 border border-violet-500/25 flex items-center justify-center text-violet-400">
            <Network className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-base tracking-tight text-neutral-100">FraudGraph</span>
              <span className="text-[10px] font-mono tracking-wider px-1.5 py-0.5 rounded bg-[#1e1e1e] text-neutral-400 border border-[#2b2b2b]">
                v0.1
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 hidden sm:block">
              Cryptocurrency Transaction Intelligence
            </p>
          </div>
        </div>
      </div>

      {/* Top right actions / indicators */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#1a1a1a] border border-[#262626] text-xs text-neutral-300">
          <Activity
            className={`w-3.5 h-3.5 ${
              backendOnline === true
                ? 'text-emerald-400'
                : backendOnline === false
                ? 'text-amber-400'
                : 'text-neutral-500 animate-pulse'
            }`}
          />
          <span>
            Backend:{' '}
            <span
              className={`font-medium ${
                backendOnline === true
                  ? 'text-neutral-200'
                  : backendOnline === false
                  ? 'text-amber-300'
                  : 'text-neutral-400'
              }`}
            >
              {backendOnline === true
                ? 'Connected (203k nodes)'
                : backendOnline === false
                ? 'Offline'
                : 'Connecting...'}
            </span>
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#1a1a1a] border border-[#262626] text-xs text-neutral-400">
          <Shield className="w-3.5 h-3.5 text-violet-400" />
          <span>Workspace: <span className="text-neutral-200 font-medium">Forensic Analysis</span></span>
        </div>
      </div>
    </header>
  );
};
