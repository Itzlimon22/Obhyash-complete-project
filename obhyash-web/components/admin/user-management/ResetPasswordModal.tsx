import React, { useState } from 'react';
import {
  X,
  Shield,
  Mail,
  Link as LinkIcon,
  Key,
  LogOut,
  Copy,
  Check,
  RefreshCw,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { User } from '@/lib/types';
import { toast } from 'sonner';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

type TabType = 'email' | 'link' | 'direct' | 'session';

export default function ResetPasswordModal({
  isOpen,
  onClose,
  user,
}: ResetPasswordModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [hasCopiedLink, setHasCopiedLink] = useState(false);

  // Direct password state
  const [tempPassword, setTempPassword] = useState('');
  const [hasCopiedPassword, setHasCopiedPassword] = useState(false);

  if (!isOpen) return null;

  const handleGenerateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setTempPassword(pass);
  };

  const handleSendResetEmail = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/users/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_reset_email',
          userId: user.id,
          userEmail: user.email,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to send reset email');

      toast.success(`Password reset email sent to ${user.email}`);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateRecoveryLink = async () => {
    setIsLoading(true);
    setGeneratedLink('');
    try {
      const res = await fetch('/api/admin/users/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_recovery_link',
          userId: user.id,
          userEmail: user.email,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to generate link');

      setGeneratedLink(data.recoveryLink);
      toast.success('Direct recovery link generated successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate recovery link');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetTemporaryPassword = async () => {
    if (!tempPassword || tempPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/users/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'set_temporary_password',
          userId: user.id,
          userEmail: user.email,
          newPassword: tempPassword,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to update password');

      toast.success(`Temporary password set for ${user.name || user.email}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForceLogoutSessions = async () => {
    if (
      !confirm(
        `Are you sure you want to force logout and revoke all active sessions for ${user.name || user.email}?`,
      )
    ) {
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/users/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'revoke_sessions',
          userId: user.id,
          userEmail: user.email,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to revoke sessions');

      toast.success('All user sessions revoked successfully!');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to revoke sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: 'link' | 'password') => {
    navigator.clipboard.writeText(text);
    if (type === 'link') {
      setHasCopiedLink(true);
      setTimeout(() => setHasCopiedLink(false), 2500);
    } else {
      setHasCopiedPassword(true);
      setTimeout(() => setHasCopiedPassword(false), 2500);
    }
    toast.success('Copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-neutral-900 rounded-t-2xl sm:rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 w-full max-w-lg overflow-hidden animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/80 dark:bg-neutral-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                Account Security & Recovery
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {user.name} ({user.email || 'No Email'})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg transition-colors text-neutral-500"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 p-1.5 gap-1">
          <button
            onClick={() => setActiveTab('email')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'email'
                ? 'bg-white dark:bg-neutral-800 text-red-600 dark:text-red-400 shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/50'
            }`}
          >
            <Mail size={14} />
            Reset Email
          </button>
          <button
            onClick={() => setActiveTab('link')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'link'
                ? 'bg-white dark:bg-neutral-800 text-red-600 dark:text-red-400 shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/50'
            }`}
          >
            <LinkIcon size={14} />
            Direct Link
          </button>
          <button
            onClick={() => setActiveTab('direct')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'direct'
                ? 'bg-white dark:bg-neutral-800 text-red-600 dark:text-red-400 shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/50'
            }`}
          >
            <Key size={14} />
            Set Password
          </button>
          <button
            onClick={() => setActiveTab('session')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'session'
                ? 'bg-white dark:bg-neutral-800 text-red-600 dark:text-red-400 shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/50'
            }`}
          >
            <LogOut size={14} />
            Revoke
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 space-y-4">
          {/* TAB 1: EMAIL */}
          {activeTab === 'email' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                Sends an official password reset link directly to{' '}
                <strong className="underline">{user.email || 'the user\'s email'}</strong>.
                The link is valid for 24 hours.
              </div>

              {!user.email ? (
                <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-lg text-xs flex items-center gap-2">
                  <AlertTriangle size={16} />
                  User does not have an email registered. Please use Direct Link or Set Password instead.
                </div>
              ) : (
                <button
                  onClick={handleSendResetEmail}
                  disabled={isLoading}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Mail className="w-4 h-4" />
                  )}
                  Send Password Reset Email
                </button>
              )}
            </div>
          )}

          {/* TAB 2: DIRECT RECOVERY LINK */}
          {activeTab === 'link' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                Generates a single-use magic recovery link. Ideal for customer support over WhatsApp, Facebook Messenger, or phone calls when user cannot access their inbox.
              </div>

              {!generatedLink ? (
                <button
                  onClick={handleGenerateRecoveryLink}
                  disabled={isLoading || !user.email}
                  className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <LinkIcon className="w-4 h-4" />
                  )}
                  Generate Recovery Link
                </button>
              ) : (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                    Generated Direct Link:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={generatedLink}
                      className="flex-1 px-3 py-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs font-mono text-neutral-800 dark:text-neutral-200 truncate outline-none select-all"
                    />
                    <button
                      onClick={() => copyToClipboard(generatedLink, 'link')}
                      className="px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:opacity-90 transition-all shrink-0"
                    >
                      {hasCopiedLink ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      {hasCopiedLink ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    ⚠️ Give this link directly to the student. It grants instant password change access.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SET DIRECT TEMPORARY PASSWORD */}
          {activeTab === 'direct' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 text-xs text-purple-800 dark:text-purple-300 leading-relaxed">
                Instantly override the user's password in Auth storage. You can provide this temporary password to the user.
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    New Temporary Password
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateRandomPassword}
                    className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                  >
                    <Sparkles size={12} />
                    Generate Random
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tempPassword}
                    onChange={(e) => setTempPassword(e.target.value)}
                    placeholder="Enter new password (min 6 chars)"
                    className="flex-1 px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  {tempPassword && (
                    <button
                      onClick={() => copyToClipboard(tempPassword, 'password')}
                      className="px-3 py-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 transition-colors"
                      title="Copy Password"
                    >
                      {hasCopiedPassword ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </button>
                  )}
                </div>
              </div>

              <button
                onClick={handleSetTemporaryPassword}
                disabled={isLoading || tempPassword.length < 6}
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-purple-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Key className="w-4 h-4" />
                )}
                Save New Password
              </button>
            </div>
          )}

          {/* TAB 4: REVOKE SESSIONS */}
          {activeTab === 'session' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 text-xs text-red-800 dark:text-red-300 leading-relaxed">
                Immediately terminates all active logins, revokes auth tokens, and clears registered devices. The user will be required to log in again on all phones, tablets, and browsers.
              </div>

              <button
                onClick={handleForceLogoutSessions}
                disabled={isLoading}
                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-red-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <LogOut className="w-4 h-4" />
                )}
                Revoke All Sessions & Force Logout
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-semibold rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
