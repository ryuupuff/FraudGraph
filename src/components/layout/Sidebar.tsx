import React from 'react';
import { LayoutDashboard, Network, FolderGit2, BarChart3, Database } from 'lucide-react';
import type { NavItemKey } from '../../types/navigation';

interface SidebarProps {
  activeTab: NavItemKey;
  onSelectTab: (tab: NavItemKey) => void;
  isOpen: boolean;
  onClose: () => void;
}

interface MenuItem {
  key: NavItemKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const MENU_ITEMS: MenuItem[] = [
  {
    key: 'overview',
    label: 'Overview',
    icon: LayoutDashboard,
    description: 'System state and graph summary',
  },
  {
    key: 'explorer',
    label: 'Graph Explorer',
    icon: Network,
    description: 'Interactive neighborhood inspection',
  },
  {
    key: 'investigations',
    label: 'Investigations',
    icon: FolderGit2,
    description: 'Transaction dossiers and evidence trails',
  },
  {
    key: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    description: 'Topological metrics and risk indicators',
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpen,
  onClose,
}) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-14 bottom-0 left-0 z-40 w-64 bg-[#141414] border-r border-[#262626] transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col justify-between`}
      >
        {/* Navigation Section */}
        <div className="p-3.5 space-y-5">
          <div>
            <p className="px-3 text-[11px] font-medium tracking-wider text-neutral-500 uppercase">
              Workspace
            </p>
            <nav className="mt-2 space-y-1">
              {MENU_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      onSelectTab(item.key);
                      onClose();
                    }}
                    className={`w-full flex items-start gap-3 pl-2.5 pr-3 py-2 rounded-md text-left transition-colors cursor-pointer border-l-2 ${
                      isActive
                        ? 'bg-[#202020] text-neutral-100 border-violet-500 font-medium'
                        : 'text-neutral-400 hover:text-neutral-200 hover:bg-[#1a1a1a] border-transparent'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 mt-0.5 shrink-0 ${
                        isActive ? 'text-violet-400' : 'text-neutral-500'
                      }`}
                    />
                    <div>
                      <div className="text-xs leading-snug">{item.label}</div>
                      <div className="text-[11px] text-neutral-500 font-normal leading-normal mt-0.5">
                        {item.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Dataset Target Metadata in Sidebar Footer */}
        <div className="p-3.5 border-t border-[#262626] bg-[#141414]">
          <div className="flex items-center gap-2 text-xs text-neutral-400 mb-1">
            <Database className="w-3.5 h-3.5 text-neutral-500" />
            <span className="font-medium text-neutral-300">Data Source</span>
          </div>
          <p className="text-xs text-neutral-400 font-mono">Elliptic++ Bitcoin Graph</p>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-neutral-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>203,769 Vertices · 234,355 Edges</span>
          </div>
        </div>
      </aside>
    </>
  );
};
