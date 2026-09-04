import React, { useState } from 'react';
import { Car, ChevronDown, Plus, Wifi, WifiOff, RefreshCw, Smartphone, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useVehicle } from '../../context/VehicleContext';
import { useUpdate } from '../../context/UpdateContext';
import { getServerUrl } from '../../api/client';
import { VehicleModal } from '../vehicles/VehicleModal';
import { FillupModal } from '../fillups/FillupModal';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { vehicles, activeVehicle, setActiveVehicleId, isOnline, refreshing, refreshAll } = useVehicle();
  const { isWifi } = useUpdate();
  const [showVehicleDropdown, setShowVehicleDropdown] = useState(false);
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [showQuickFillupModal, setShowQuickFillupModal] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 safe-top">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-2">
          {/* Brand & Vehicle Selector */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 pr-2 border-r border-slate-800">
              <img src="/favicon.svg" alt="ApexDrive" className="w-7 h-7" />
              <span className="text-base font-black tracking-tight text-white hidden md:inline">
                Apex<span className="text-emerald-400">Drive</span>
              </span>
            </div>

            {/* Vehicle Selector */}
            <div className="relative">
              <button
                onClick={() => setShowVehicleDropdown(!showVehicleDropdown)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 transition active:scale-95"
              >
                <div className="p-1.5 bg-brand-500/10 text-brand-500 rounded-lg">
                  <Car className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-xs text-slate-400 font-medium">Selected Vehicle</div>
                  <div className="text-sm font-semibold text-white truncate max-w-[120px] sm:max-w-[200px]">
                    {activeVehicle ? `${activeVehicle.year} ${activeVehicle.make} ${activeVehicle.model}` : 'No Vehicle'}
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />
              </button>

            {/* Dropdown Menu */}
            {showVehicleDropdown && (
              <div
                className="absolute left-0 mt-2 w-64 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                onClick={() => setShowVehicleDropdown(false)}
              >
                <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Switch Vehicle
                </div>
                {vehicles.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setActiveVehicleId(v.id)}
                    className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-slate-800/80 transition ${
                      activeVehicle?.id === v.id ? 'text-brand-500 font-semibold bg-brand-500/10' : 'text-slate-200'
                    }`}
                  >
                    <div>
                      <div>{v.name || `${v.year} ${v.make} ${v.model}`}</div>
                      <div className="text-xs text-slate-400">
                        {v.year} {v.make} {v.model} {v.trim ? `• ${v.trim}` : ''} {v.engine ? `• ${v.engine}` : ''}
                      </div>
                    </div>
                    {activeVehicle?.id === v.id && (
                      <span className="w-2 h-2 rounded-full bg-brand-500" />
                    )}
                  </button>
                ))}

                <div className="border-t border-slate-800 my-1 pt-1">
                  <button
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
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2">
            {/* Download APK Button */}
            <a
              href={`${getServerUrl()}/api/app/download-latest`}
              download
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition active:scale-95"
              title="Download Android APK"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Get APK</span>
            </a>

            {/* Connection / Wi-Fi Badge */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/60 border border-slate-700/40 text-xs text-slate-300">
              {isWifi ? (
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <WifiOff className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span>{isOnline ? (isWifi ? 'Wi-Fi' : 'Online') : 'Offline'}</span>
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => refreshAll()}
              disabled={refreshing}
              className={`p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/40 transition ${
                refreshing ? 'animate-spin text-brand-500' : ''
              }`}
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* User Account / Logout */}
            {user && (
              <div className="flex items-center gap-1.5 pl-1">
                <div className="hidden lg:flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-800/80 border border-slate-700/50 text-xs text-slate-300">
                  <UserIcon className="w-3.5 h-3.5 text-brand-400" />
                  <span className="font-semibold text-white">{user.username}</span>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-rose-400 rounded-xl bg-slate-800/60 hover:bg-rose-500/10 border border-slate-700/40 hover:border-rose-500/30 transition"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Quick Fillup Button */}
            <button
              onClick={() => setShowQuickFillupModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-500 hover:to-emerald-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-brand-600/20 active:scale-95 transition"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden xs:inline">Quick Fillup</span>
              <span className="xs:hidden">Fillup</span>
            </button>
          </div>
        </div>
      </header>

      {/* Modals */}
      {showAddVehicleModal && (
        <VehicleModal isOpen={showAddVehicleModal} onClose={() => setShowAddVehicleModal(false)} />
      )}
      {showQuickFillupModal && (
        <FillupModal isOpen={showQuickFillupModal} onClose={() => setShowQuickFillupModal(false)} />
      )}
    </>
  );
};
