import React, { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Car, ChevronDown, Plus, Wifi, WifiOff, RefreshCw, Smartphone, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useVehicle } from '../../context/VehicleContext';
import { useUpdate } from '../../context/UpdateContext';
import { getServerUrl } from '../../api/client';
import { VehicleModal } from '../vehicles/VehicleModal';
import { FillupModal } from '../fillups/FillupModal';
import { NavTab } from './Navbar';

export const Header: React.FC<{ onNavigate?: (tab: NavTab) => void }> = ({ onNavigate }) => {
  const isNative = Capacitor.isNativePlatform();
  const { user, logout } = useAuth();
  const { vehicles, activeVehicle, setActiveVehicleId, isOnline, refreshing, refreshAll } = useVehicle();
  const { isWifi } = useUpdate();
  const [showVehicleDropdown, setShowVehicleDropdown] = useState(false);
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [showQuickFillupModal, setShowQuickFillupModal] = useState(false);

  return (
    <>
      <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 min-h-14 py-2 flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 pr-2 border-r border-slate-800 shrink-0">
            <img src="/favicon.svg" alt="ApexDrive" className="w-7 h-7" />
            <span className="text-base font-black tracking-tight text-white hidden md:inline">
              Apex<span className="text-emerald-400">Drive</span>
            </span>
          </div>

          {/* Vehicle selector — takes remaining space, never forces overflow */}
          <div className="relative min-w-0 flex-1">
            <button
              type="button"
              onClick={() => setShowVehicleDropdown(!showVehicleDropdown)}
              className="w-full max-w-full flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 transition active:scale-[0.99]"
            >
              <div className="p-1.5 bg-brand-500/10 text-brand-500 rounded-lg shrink-0">
                <Car className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="text-left min-w-0 flex-1">
                <div className="text-[10px] sm:text-xs text-slate-400 font-medium leading-tight">
                  Selected Vehicle
                </div>
                <div className="text-xs sm:text-sm font-semibold text-white truncate">
                  {activeVehicle
                    ? `${activeVehicle.year} ${activeVehicle.make} ${activeVehicle.model}`
                    : 'No Vehicle'}
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
            </button>

            {showVehicleDropdown && (
              <div
                className="absolute left-0 right-0 sm:right-auto sm:w-72 mt-2 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl py-2 z-50"
                onClick={() => setShowVehicleDropdown(false)}
              >
                <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Switch Vehicle
                </div>
                {vehicles.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setActiveVehicleId(v.id)}
                    className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-slate-800/80 transition ${
                      activeVehicle?.id === v.id
                        ? 'text-brand-500 font-semibold bg-brand-500/10'
                        : 'text-slate-200'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="truncate">{v.name || `${v.year} ${v.make} ${v.model}`}</div>
                      <div className="text-xs text-slate-400 truncate">
                        {v.year} {v.make} {v.model}
                        {v.trim ? ` • ${v.trim}` : ''}
                        {v.engine ? ` • ${v.engine}` : ''}
                      </div>
                    </div>
                    {activeVehicle?.id === v.id && (
                      <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0 ml-2" />
                    )}
                  </button>
                ))}

                <div className="border-t border-slate-800 my-1 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddVehicleModal(true)}
                    className="w-full text-left px-4 py-2 text-sm text-brand-500 hover:bg-brand-500/10 flex items-center gap-2 font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Add Another Vehicle
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Actions — shrink-0 so Fill never gets clipped */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {!isNative && (
              <a
                href={`${getServerUrl()}/api/app/download-latest`}
                download
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition active:scale-95"
                title="Download Android APK"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Get APK</span>
              </a>
            )}

            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/60 border border-slate-700/40 text-xs text-slate-300">
              {isNative ? (
                <>
                  {isWifi ? (
                    <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  <span>{isOnline ? (isWifi ? 'Wi-Fi' : 'Online') : 'Offline'}</span>
                </>
              ) : (
                <span className={isOnline ? 'text-emerald-400' : 'text-amber-400'}>
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => refreshAll()}
              disabled={refreshing}
              className={`p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/40 transition ${
                refreshing ? 'animate-spin text-brand-500' : ''
              }`}
              title="Refresh Data"
              aria-label="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {user && (
              <>
                <button
                  type="button"
                  onClick={() => onNavigate?.('profile')}
                  className="hidden lg:flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/50 text-xs text-slate-300 transition"
                  title="Open profile"
                >
                  <UserIcon className="w-3.5 h-3.5 text-brand-400" />
                  <span className="font-semibold text-white">{user.username}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate?.('profile')}
                  className="lg:hidden p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/40 transition"
                  title="Profile"
                  aria-label="Profile"
                >
                  <UserIcon className="w-4 h-4 text-brand-400" />
                </button>
                <button
                  type="button"
                  onClick={logout}
                  className="hidden sm:inline-flex p-2 text-slate-400 hover:text-rose-400 rounded-xl bg-slate-800/60 hover:bg-rose-500/10 border border-slate-700/40 hover:border-rose-500/30 transition"
                  title="Sign Out"
                  aria-label="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => setShowQuickFillupModal(true)}
              className="inline-flex items-center justify-center gap-1 h-9 w-9 sm:h-auto sm:w-auto sm:px-3.5 sm:py-2 bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-500 hover:to-emerald-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-brand-600/20 active:scale-95 transition shrink-0"
              title="Quick fillup"
              aria-label="Quick fillup"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Fillup</span>
            </button>
          </div>
        </div>
      </header>

      {showAddVehicleModal && (
        <VehicleModal isOpen={showAddVehicleModal} onClose={() => setShowAddVehicleModal(false)} />
      )}
      {showQuickFillupModal && (
        <FillupModal isOpen={showQuickFillupModal} onClose={() => setShowQuickFillupModal(false)} />
      )}
    </>
  );
};
