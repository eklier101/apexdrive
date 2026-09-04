import React, { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Lock, User, Mail, ArrowRight, ShieldCheck, Zap, Server } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getServerUrl, setServerUrl } from '../../api/client';

export const AuthModal: React.FC = () => {
  const { login, register } = useAuth();
  const isNative = Capacitor.isNativePlatform();
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [serverUrl, setServerUrlInput] = useState(getServerUrl());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizeUrl = (raw: string) => {
    const trimmed = raw.trim().replace(/\/$/, '');
    if (!trimmed) return '';
    if (!/^https?:\/\//i.test(trimmed)) {
      return `http://${trimmed}`;
    }
    return trimmed;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isNative) {
        const url = normalizeUrl(serverUrl);
        if (!url) {
          throw new Error('Enter your ApexDrive server URL (e.g. http://192.168.1.10:8090).');
        }
        setServerUrl(url);
        setServerUrlInput(url);
      }

      if (isRegister) {
        await register({ username, password, email: email.trim() || undefined });
      } else {
        await login({ username, password });
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 -translate-x-1/2 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-emerald-500 shadow-xl shadow-brand-500/25 mb-3 p-2.5">
            <img src="/favicon.svg" alt="ApexDrive" className="w-full h-full object-contain filter drop-shadow" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center justify-center gap-1.5">
            <span className="bg-gradient-to-r from-white via-slate-100 to-brand-400 bg-clip-text text-transparent">Apex</span>
            <span className="text-emerald-400">Drive</span>
          </h1>
          <p className="text-xs font-medium text-slate-400 mt-1">
            Fuel Telemetry, MPG Analytics & Maintenance Hub
          </p>
        </div>

        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/50">
          <div className="flex border-b border-slate-800 mb-6">
            <button
              type="button"
              onClick={() => {
                setIsRegister(false);
                setError(null);
              }}
              className={`flex-1 pb-3 text-sm font-bold transition border-b-2 ${
                !isRegister
                  ? 'border-brand-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegister(true);
                setError(null);
              }}
              className={`flex-1 pb-3 text-sm font-bold transition border-b-2 ${
                isRegister
                  ? 'border-brand-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium leading-relaxed">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isNative && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Server URL
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Server className="w-4 h-4" />
                  </div>
                  <input
                    type="url"
                    inputMode="url"
                    autoCapitalize="none"
                    autoCorrect="off"
                    required
                    value={serverUrl}
                    onChange={(e) => setServerUrlInput(e.target.value)}
                    placeholder="http://192.168.1.10:8090"
                    className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 transition font-mono"
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-slate-500 leading-relaxed">
                  Your ApexDrive host (LAN IP, hostname, or HTTPS tunnel). Saved on this device.
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. ethan"
                  className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 transition"
                />
              </div>
            </div>

            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Email (Optional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 transition"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-500 hover:to-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-brand-600/20 active:scale-[0.98] transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isRegister ? 'Sign Up & Start Tracking' : 'Sign In'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Self-Hosted & Private</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Fast Sync</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
