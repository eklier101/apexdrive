import React, { useEffect, useState } from 'react';
import { User as UserIcon, Mail, Lock, Trash2, Save, AlertTriangle, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export const ProfilePage: React.FC = () => {
  const { user, refreshUser, logout } = useAuth();
  const [email, setEmail] = useState(user?.email || '');
  const [savingEmail, setSavingEmail] = useState(false);
  const [emailMsg, setEmailMsg] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    setEmail(user?.email || '');
  }, [user?.email]);

  if (!user) return null;

  const handleSaveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailMsg(null);
    setSavingEmail(true);
    try {
      await api.updateProfile({ email: email.trim() });
      await refreshUser();
      setEmailMsg('Email updated.');
    } catch (err: any) {
      setEmailMsg(err.message || 'Failed to update email');
    } finally {
      setSavingEmail(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);
    if (newPassword !== confirmPassword) {
      setPasswordMsg('New passwords do not match.');
      return;
    }
    setSavingPassword(true);
    try {
      await api.changePassword({ current_password: currentPassword, new_password: newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMsg('Password updated.');
    } catch (err: any) {
      setPasswordMsg(err.message || 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError(null);
    setDeleting(true);
    try {
      await api.deleteAccount({ password: deletePassword, confirm: deleteConfirm });
      logout();
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete account');
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 pb-24 md:pb-12 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <UserIcon className="w-6 h-6 text-brand-400" />
          Profile
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Manage email, password, and account for @{user.username}
        </p>
      </div>

      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-400 flex items-center justify-center border border-brand-500/20">
            <UserIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">{user.username}</div>
            <div className="text-xs text-slate-400">{user.email || 'No email on file'}</div>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSaveEmail}
        className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-3"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Email</h2>
            <p className="text-xs text-slate-400">Optional contact address for this account</p>
          </div>
        </div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
        />
        {emailMsg && <p className="text-xs text-slate-300">{emailMsg}</p>}
        <button
          type="submit"
          disabled={savingEmail}
          className="px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-sm font-bold rounded-xl flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {savingEmail ? 'Saving…' : 'Save email'}
        </button>
      </form>

      <form
        onSubmit={handleChangePassword}
        className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-3"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Change password</h2>
            <p className="text-xs text-slate-400">Requires your current password</p>
          </div>
        </div>
        <input
          type="password"
          required
          autoComplete="current-password"
          placeholder="Current password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
        />
        <input
          type="password"
          required
          minLength={4}
          autoComplete="new-password"
          placeholder="New password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
        />
        <input
          type="password"
          required
          minLength={4}
          autoComplete="new-password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
        />
        {passwordMsg && <p className="text-xs text-slate-300">{passwordMsg}</p>}
        <button
          type="submit"
          disabled={savingPassword}
          className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold rounded-xl flex items-center gap-2"
        >
          <Lock className="w-4 h-4" />
          {savingPassword ? 'Updating…' : 'Update password'}
        </button>
      </form>

      <div className="bg-rose-950/30 border border-rose-500/30 rounded-3xl p-6 space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-rose-500/10 text-rose-400 rounded-xl">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Delete account</h2>
            <p className="text-xs text-rose-200/80">
              Permanently removes your user, vehicles, fillups, services, parts, and all related data.
              This cannot be undone.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowDeleteModal(true);
            setDeletePassword('');
            setDeleteConfirm('');
            setDeleteError(null);
          }}
          className="px-4 py-2.5 bg-rose-600/90 hover:bg-rose-500 text-white text-sm font-bold rounded-xl flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Delete my account…
        </button>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-rose-500/40 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-start justify-between px-5 py-4 border-b border-slate-800">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-rose-500/15 text-rose-400 rounded-xl">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Delete account permanently?</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    There is no recovery. Vehicles, fuel logs, maintenance, parts inventory, reminders,
                    upgrades, and expenses for <span className="text-white font-semibold">@{user.username}</span>{' '}
                    will be erased forever.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleDeleteAccount} className="p-5 space-y-3">
              <input
                type="password"
                required
                placeholder="Your password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
              />
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Type <span className="font-mono text-rose-300">DELETE</span> to confirm
                </label>
                <input
                  type="text"
                  required
                  placeholder="DELETE"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono"
                />
              </div>
              {deleteError && <p className="text-xs text-rose-400">{deleteError}</p>}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-200 text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deleting || deleteConfirm !== 'DELETE'}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white text-sm font-bold"
                >
                  {deleting ? 'Deleting…' : 'Delete forever'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
