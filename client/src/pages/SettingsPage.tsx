import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import {
  Settings as SettingsIcon,
  Server,
  Download,
  RefreshCw,
  CheckCircle2,
  Car,
  Database,
  Plus,
  Edit,
  Trash2,
  Wifi,
  Sparkles,
  User as UserIcon,
  LogOut,
  ShieldCheck,
  Cloud,
  Lock,
  Zap,
  Smartphone,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useVehicle } from '../context/VehicleContext';
import { useUpdate } from '../context/UpdateContext';
import { getServerUrl, setServerUrl, api } from '../api/client';
import { VehicleModal } from '../components/vehicles/VehicleModal';
import { Vehicle } from '../types';

export const SettingsPage: React.FC = () => {
  const isNative = Capacitor.isNativePlatform();
  const { user, logout } = useAuth();
  const { vehicles, activeVehicle, setActiveVehicleId, deleteVehicle, refreshAll } = useVehicle();
  const {
    currentVersion,
    currentVersionCode,
    latestRelease,
    hasUpdate,
    isChecking,
    isDownloading,
    downloadProgress,
    downloadedUri,
    autoDownloadWifi,
    isWifi,
    lastChecked,
    setAutoDownloadWifi,
    checkForUpdates,
    downloadUpdate,
    installUpdate,
  } = useUpdate();

  const [serverAddress, setServerAddress] = useState(getServerUrl());
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const [tunnelStatus, setTunnelStatus] = useState<any>(null);
  const [checkingTunnel, setCheckingTunnel] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  useEffect(() => {
    fetchTunnelStatus();
  }, []);

  const fetchTunnelStatus = async () => {
    setCheckingTunnel(true);
    try {
      const baseUrl = getServerUrl();
      const res = await fetch(`${baseUrl}/api/tunnel-status`);
      if (res.ok) {
        setTunnelStatus(await res.json());
      }
    } catch {
      // ignore
    } finally {
      setCheckingTunnel(false);
    }
  };

  const handleSaveServerUrl = async () => {
    setServerUrl(serverAddress);
    setTestingConnection(true);
    try {
      const ok = await api.checkHealth();
      if (ok) {
        setConnectionStatus('Connected successfully!');
        await refreshAll();
        if (isNative) await checkForUpdates();
      } else {
        setConnectionStatus('Could not reach backend API at this URL.');
      }
    } catch {
      setConnectionStatus('Connection failed. Verify IP, port, and network.');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleExportBackup = async () => {
    try {
      window.open(`${getServerUrl()}/api/stats/export`, '_blank');
    } catch (err: any) {
      alert('Export failed: ' + err.message);
    }
  };

  const handleDeleteVehicle = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete vehicle "${name}"? All associated logs will be removed.`)) return;
    try {
      await deleteVehicle(id);
    } catch (err: any) {
      alert(err.message || 'Failed to delete vehicle');
    }
  };

  const apkDownloadHref = `${getServerUrl()}/api/app/download-latest`;
  const apkAvailable = Boolean(latestRelease?.available);
  const apkVersionLabel = latestRelease?.available
    ? latestRelease.version
    : currentVersion;
  const apkDownloadName = `apexdrive_v${apkVersionLabel}.apk`;

  return (
    <div className="space-y-6 pb-24 md:pb-12 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-slate-400" />
          Settings
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          {isNative
            ? 'Server connection, APK updates, vehicles, and backups'
            : 'Server connection, APK download, vehicles, and backups'}
        </p>
      </div>

      {user && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-400 flex items-center justify-center border border-brand-500/20">
              <UserIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>{user.username}</span>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Authenticated
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {user.email || 'Private self-hosted user account'}
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      )}

      {/* Website: always offer APK for phones; embeds this server URL at download time */}
      {!isNative && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Android APK</h2>
                <p className="text-xs text-slate-400">
                  Download the mobile app — server URL is embedded from this site
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-white bg-slate-800 px-2.5 py-1 rounded-lg">
                v{apkVersionLabel}
              </span>
              {apkAvailable ? (
                <a
                  href={apkDownloadHref}
                  download={apkDownloadName}
                  className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition active:scale-95 shadow-md shadow-brand-600/20"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download APK</span>
                </a>
              ) : (
                <span className="text-xs text-amber-400/90 font-medium">
                  No APK uploaded on this server yet
                </span>
              )}
              <a
                href={`apexdrive://configure?url=${encodeURIComponent(window.location.origin)}`}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 font-bold text-xs rounded-xl transition"
              >
                Open app with this server
              </a>
            </div>
          </div>
          {latestRelease?.release_notes && (
            <p className="text-[11px] text-slate-500 mt-3">{latestRelease.release_notes}</p>
          )}
        </div>
      )}

      {/* APK only: full updater + Wi-Fi autodownload */}
      {isNative && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">In-App APK Updates</h2>
                <p className="text-xs text-slate-400">
                  Downloads inside the app — then tap Install. Auto on Wi‑Fi, or force anytime.
                </p>
                <p className="text-[10px] text-slate-500 mt-1">
                  If Install says “App not installed”, uninstall the old APK once (signing key changed), then install this build.
                </p>
              </div>
            </div>

            <span className="font-mono text-xs font-bold text-white bg-slate-800 px-2.5 py-1 rounded-lg">
              v{currentVersion} ({currentVersionCode})
            </span>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 mb-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <div className="font-semibold text-slate-200">
                  {hasUpdate ? (
                    <span className="text-emerald-400 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      New version v{latestRelease?.version} is available!
                    </span>
                  ) : (
                    <span className="text-slate-400">You are on the latest version</span>
                  )}
                </div>
                {latestRelease?.release_notes && (
                  <div className="text-slate-400 mt-1">Release Notes: {latestRelease.release_notes}</div>
                )}
                {lastChecked && (
                  <div className="text-[11px] text-slate-500 mt-1">
                    Last checked: {lastChecked.toLocaleTimeString()}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => checkForUpdates(true)}
                  disabled={isChecking}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl flex items-center gap-1.5 transition active:scale-95"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
                  <span>{isChecking ? 'Checking...' : 'Check Now'}</span>
                </button>

                {hasUpdate && !downloadedUri && (
                  <button
                    onClick={downloadUpdate}
                    disabled={isDownloading}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center gap-1.5 transition active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>
                      {isDownloading
                        ? `Downloading (${downloadProgress}%)`
                        : isWifi
                          ? 'Download APK'
                          : 'Force download'}
                    </span>
                  </button>
                )}

                {downloadedUri && (
                  <button
                    onClick={installUpdate}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 active:scale-95 transition"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Install Update</span>
                  </button>
                )}
              </div>
            </div>

            {isDownloading && (
              <div className="space-y-1">
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-300"
                    style={{ width: `${downloadProgress}%` }}
                  />
                </div>
                <div className="text-[11px] text-slate-400 text-right font-mono">
                  {downloadProgress}% downloaded
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-950/40 rounded-2xl border border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl">
                <Wifi className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Auto-Download on Wi-Fi</div>
                <div className="text-[11px] text-slate-400">
                  Download new APK versions in the background when on Wi-Fi
                </div>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoDownloadWifi}
                onChange={(e) => setAutoDownloadWifi(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
            </label>
          </div>
        </div>
      )}

      {/* Server URL — useful on APK; optional on web */}
      {isNative && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Server Connection URL</h2>
              <p className="text-xs text-slate-400">
                Host address of your self-hosted ApexDrive server
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={serverAddress}
                onChange={(e) => setServerAddress(e.target.value)}
                placeholder="http://your-server:8090"
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 font-mono"
              />
              <button
                onClick={handleSaveServerUrl}
                disabled={testingConnection}
                className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm rounded-xl transition active:scale-95"
              >
                {testingConnection ? 'Testing...' : 'Save & Connect'}
              </button>
            </div>
            {connectionStatus && (
              <div className="text-xs text-slate-300 font-medium">{connectionStatus}</div>
            )}
          </div>
        </div>
      )}

      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Cloudflare Tunnel & Remote Access</h2>
              <p className="text-xs text-slate-400">Encrypted remote HTTPS domain routing</p>
            </div>
          </div>

          <button
            onClick={fetchTunnelStatus}
            disabled={checkingTunnel}
            className={`p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/40 transition ${
              checkingTunnel ? 'animate-spin text-brand-500' : ''
            }`}
            title="Refresh Tunnel Diagnostics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {tunnelStatus && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800/80">
              <div className="text-[11px] text-slate-400 font-medium mb-1">Tunnel Status</div>
              <div className="flex items-center gap-1.5 text-xs font-bold">
                {tunnelStatus.isCloudflareTunnel ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Active (Cloudflare Edge)
                  </span>
                ) : (
                  <span className="text-slate-300 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    Direct LAN / Local IP
                  </span>
                )}
              </div>
            </div>

            <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800/80">
              <div className="text-[11px] text-slate-400 font-medium mb-1">Protocol & Security</div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                {tunnelStatus.secure ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" />
                    HTTPS Encrypted
                  </span>
                ) : (
                  <span className="text-amber-400 flex items-center gap-1">HTTP (LAN Standard)</span>
                )}
              </div>
            </div>

            <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800/80">
              <div className="text-[11px] text-slate-400 font-medium mb-1">Detected Host</div>
              <div className="text-xs font-mono font-bold text-slate-200 truncate" title={tunnelStatus.host}>
                {tunnelStatus.host || 'Unknown'}
              </div>
            </div>
          </div>
        )}

        <div className="p-4 bg-slate-950/40 rounded-2xl border border-slate-800/80 space-y-2 text-xs text-slate-400 leading-relaxed">
          <div className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-brand-400" />
            <span>Cloudflare Tunnel Setup Quick-Guide</span>
          </div>
          <p>
            Point your <code className="text-brand-400 bg-slate-800/80 px-1.5 py-0.5 rounded font-mono">cloudflared</code> ingress
            rule to your server (e.g.{' '}
            <code className="text-emerald-400 bg-slate-800/80 px-1.5 py-0.5 rounded font-mono">http://localhost:8090</code>).
          </p>
        </div>
      </div>

      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Vehicles in Garage</h2>
              <p className="text-xs text-slate-400">Manage multiple vehicles and presets</p>
            </div>
          </div>

          <button
            onClick={() => {
              setEditingVehicle(null);
              setShowVehicleModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Vehicle</span>
          </button>
        </div>

        <div className="space-y-2.5">
          {vehicles.map((v) => (
            <div
              key={v.id}
              className={`p-3.5 rounded-2xl border flex items-center justify-between transition ${
                activeVehicle?.id === v.id
                  ? 'bg-purple-500/10 border-purple-500/30'
                  : 'bg-slate-950/40 border-slate-800'
              }`}
            >
              <div>
                <div className="font-bold text-sm text-white flex items-center gap-2">
                  <span>{v.name || `${v.year} ${v.make} ${v.model}`}</span>
                  {activeVehicle?.id === v.id && (
                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-[10px] font-semibold rounded-md">
                      Active
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {v.year} {v.make} {v.model} {v.trim || ''} • {v.fuel_type} • {v.odometer_unit}/{v.fuel_unit}
                </div>
              </div>

              <div className="flex items-center gap-1">
                {activeVehicle?.id !== v.id && (
                  <button
                    onClick={() => setActiveVehicleId(v.id)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 rounded-lg mr-1 font-medium"
                  >
                    Select
                  </button>
                )}
                <button
                  onClick={() => {
                    setEditingVehicle(v);
                    setShowVehicleModal(true);
                  }}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  <Edit className="w-4 h-4" />
                </button>
                {vehicles.length > 1 && (
                  <button
                    onClick={() => handleDeleteVehicle(v.id, v.name || `${v.year} ${v.make} ${v.model}`)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-brand-500/10 text-brand-400 rounded-xl">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Full Database Backup</h2>
              <p className="text-xs text-slate-400">Export complete vehicle records as JSON</p>
            </div>
          </div>

          <button
            onClick={handleExportBackup}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Backup</span>
          </button>
        </div>
      </div>

      {showVehicleModal && (
        <VehicleModal
          isOpen={showVehicleModal}
          onClose={() => {
            setShowVehicleModal(false);
            setEditingVehicle(null);
          }}
          vehicleToEdit={editingVehicle}
        />
      )}
    </div>
  );
};
