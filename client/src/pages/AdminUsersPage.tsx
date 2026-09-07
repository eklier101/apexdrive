import React, { useCallback, useEffect, useState } from 'react';
import {
  Shield,
  Users,
  Trash2,
  KeyRound,
  RefreshCw,
  Crown,
  User as UserIcon,
  AlertTriangle,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { AdminUser } from '../types';

export const AdminUsersPage: React.FC = () => {
  const { user, isAdmin, refreshUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [resetTarget, setResetTarget] = useState<AdminUser | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirm, setResetConfirm] = useState('');
  const [resetError, setResetError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.adminListUsers();
      setUsers(res.users);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) void load();
  }, [isAdmin, load]);

  if (!isAdmin) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 space-y-3">
        <Shield className="w-10 h-10 text-slate-500 mx-auto" />
        <h1 className="text-xl font-bold text-white">Admin only</h1>
        <p className="text-sm text-slate-400">You need admin access to manage users.</p>
      </div>
    );
  }

  const adminCount = users.filter((u) => u.role === 'admin').length;

  const handleToggleRole = async (target: AdminUser) => {
    const next = target.role === 'admin' ? 'user' : 'admin';
    setBusyId(target.id);
    setError(null);
    try {
      await api.adminSetRole(target.id, next);
      await load();
      if (target.id === user?.id) await refreshUser();
    } catch (err: any) {
      setError(err.message || 'Failed to update role');
    } finally {
      setBusyId(null);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTarget) return;
    setResetError(null);
    if (resetPassword.length < 4) {
      setResetError('Password must be at least 4 characters');
      return;
    }
    if (resetPassword !== resetConfirm) {
      setResetError('Passwords do not match');
      return;
    }
    setBusyId(resetTarget.id);
    try {
      await api.adminResetPassword(resetTarget.id, resetPassword);
      setResetTarget(null);
      setResetPassword('');
      setResetConfirm('');
    } catch (err: any) {
      setResetError(err.message || 'Failed to reset password');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteError(null);
    setBusyId(deleteTarget.id);
    try {
      await api.adminDeleteUser(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete user');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6 pb-24 md:pb-12 max-w-3xl mx-auto">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-brand-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Shield className="w-3.5 h-3.5" />
            Admin
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-400" />
            Users
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage accounts on this ApexDrive instance. The first registered user is admin.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-300 hover:text-white transition"
          title="Refresh"
          aria-label="Refresh users"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">
          {error}
        </div>
      )}

      {loading && users.length === 0 ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <ul className="space-y-3">
          {users.map((u) => {
            const isSelf = u.id === user?.id;
            const isLastAdmin = u.role === 'admin' && adminCount <= 1;
            const busy = busyId === u.id;
            return (
              <li
                key={u.id}
                className="rounded-2xl bg-slate-900/80 border border-slate-800 px-4 py-3.5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={`p-2.5 rounded-xl shrink-0 ${
                      u.role === 'admin'
                        ? 'bg-amber-500/15 text-amber-400'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {u.role === 'admin' ? <Crown className="w-5 h-5" /> : <UserIcon className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-white truncate">{u.username}</span>
                      {isSelf && (
                        <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-brand-500/15 text-brand-400 font-bold">
                          You
                        </span>
                      )}
                      <span
                        className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded font-bold ${
                          u.role === 'admin'
                            ? 'bg-amber-500/15 text-amber-400'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {u.role}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 truncate mt-0.5">
                      {u.email || 'No email'} · {u.vehicle_count} vehicle
                      {u.vehicle_count === 1 ? '' : 's'}
                      {u.created_at ? ` · joined ${String(u.created_at).slice(0, 10)}` : ''}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <button
                    type="button"
                    disabled={busy || (u.role === 'admin' && isLastAdmin)}
                    onClick={() => void handleToggleRole(u)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 disabled:opacity-40 transition"
                    title={isLastAdmin && u.role === 'admin' ? 'Cannot demote the last admin' : undefined}
                  >
                    {u.role === 'admin' ? 'Make user' : 'Make admin'}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setResetTarget(u);
                      setResetPassword('');
                      setResetConfirm('');
                      setResetError(null);
                    }}
                    className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-emerald-400 transition disabled:opacity-40"
                    title="Reset password"
                    aria-label={`Reset password for ${u.username}`}
                  >
                    <KeyRound className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={busy || isSelf || isLastAdmin}
                    onClick={() => {
                      setDeleteTarget(u);
                      setDeleteError(null);
                    }}
                    className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-rose-400 transition disabled:opacity-40"
                    title={
                      isSelf
                        ? 'Use Profile to delete your own account'
                        : isLastAdmin
                          ? 'Cannot delete the last admin'
                          : 'Delete user'
                    }
                    aria-label={`Delete ${u.username}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {resetTarget && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="Close"
            onClick={() => setResetTarget(null)}
          />
          <form
            onSubmit={handleResetPassword}
            className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Reset password</h2>
              <button type="button" onClick={() => setResetTarget(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-slate-400">
              Set a temporary password for <span className="text-white font-semibold">{resetTarget.username}</span>.
            </p>
            {resetError && (
              <div className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-xl px-3 py-2">
                {resetError}
              </div>
            )}
            <input
              type="password"
              required
              value={resetPassword}
              onChange={(e) => setResetPassword(e.target.value)}
              placeholder="New password"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white"
            />
            <input
              type="password"
              required
              value={resetConfirm}
              onChange={(e) => setResetConfirm(e.target.value)}
              placeholder="Confirm password"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white"
            />
            <button
              type="submit"
              disabled={busyId === resetTarget.id}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm disabled:opacity-50"
            >
              Save password
            </button>
          </form>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="Close"
            onClick={() => setDeleteTarget(null)}
          />
          <div className="relative w-full max-w-md bg-slate-900 border border-rose-500/30 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
              <h2 className="text-lg font-bold text-white">Delete {deleteTarget.username}?</h2>
            </div>
            <p className="text-sm text-slate-400">
              This permanently deletes their account and all vehicles, fill-ups, services, and related data.
            </p>
            {deleteError && (
              <div className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-xl px-3 py-2">
                {deleteError}
              </div>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-200 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busyId === deleteTarget.id}
                onClick={() => void handleDelete()}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
