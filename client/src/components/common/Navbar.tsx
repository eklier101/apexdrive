import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Fuel,
  Wrench,
  Sparkles,
  BellRing,
  Receipt,
  BarChart3,
  Settings,
  MoreHorizontal,
  X,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'fillups'
  | 'services'
  | 'upgrades'
  | 'reminders'
  | 'expenses'
  | 'analytics'
  | 'settings';

interface NavbarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

type NavItem = { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> };

const primaryItems: NavItem[] = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'fillups', label: 'Fuel', icon: Fuel },
  { id: 'services', label: 'Service', icon: Wrench },
  { id: 'expenses', label: 'Costs', icon: Receipt },
];

const moreItems: NavItem[] = [
  { id: 'upgrades', label: 'Mods', icon: Sparkles },
  { id: 'reminders', label: 'Alerts', icon: BellRing },
  { id: 'analytics', label: 'Stats', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const allItems = [...primaryItems, ...moreItems];

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onSelectTab }) => {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = moreItems.some((item) => item.id === activeTab);

  useEffect(() => {
    setMoreOpen(false);
  }, [activeTab]);

  useEffect(() => {
    if (!moreOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMoreOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [moreOpen]);

  const tabButtonClass = (isActive: boolean) =>
    `flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl transition ${
      isActive
        ? 'text-brand-500 font-semibold bg-brand-500/10'
        : 'text-slate-400 hover:text-slate-200'
    }`;

  return (
    <>
      {/* Mobile: 4 primary + More */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 safe-bottom">
        <div className="grid grid-cols-5 gap-0.5 px-2 py-1.5">
          {primaryItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={tabButtonClass(isActive)}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] tracking-tight leading-none">{item.label}</span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={tabButtonClass(moreActive || moreOpen)}
            aria-label="More"
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[10px] tracking-tight leading-none">More</span>
          </button>
        </div>
      </nav>

      {moreOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <button
            type="button"
            className="absolute inset-0 bg-black/55"
            aria-label="Close menu"
            onClick={() => setMoreOpen(false)}
          />
          <div className="relative bg-slate-900 border-t border-slate-700 rounded-t-3xl px-4 pt-3 pb-6 safe-bottom shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-white">More</h2>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {moreItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectTab(item.id)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-2xl text-left transition ${
                      isActive
                        ? 'bg-brand-500/15 text-brand-400 border border-brand-500/25'
                        : 'bg-slate-800/70 text-slate-200 border border-slate-700/60 hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span className="text-sm font-semibold">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Desktop: all tabs, no horizontal scroll */}
      <div className="hidden md:block bg-slate-900 border-b border-slate-800 sticky top-16 z-20">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center gap-2 py-2">
          {allItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? 'bg-brand-500/10 text-brand-500 border border-brand-500/20 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
