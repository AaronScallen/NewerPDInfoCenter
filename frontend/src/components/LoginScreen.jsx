import React, { useState } from 'react';
import { ShieldCheck, Lock, User, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../services/AuthContext';

export default function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Username and password are required.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await login(username.trim(), password);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-tactical-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-tactical-900 border border-tactical-700/60 rounded-lg shadow-2xl p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-full bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center mb-3">
            <ShieldCheck className="w-7 h-7 text-cyan-400" />
          </div>
          <h1 className="text-lg font-bold text-slate-100 tracking-wide">NISD PD // CENTRALIZED DISPATCH NETWORK</h1>
          <p className="text-sm text-slate-400 mt-1">Sign in to access the department console</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Username</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-tactical-950 border border-tactical-700 rounded-md py-2 pl-9 pr-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/60"
                placeholder="e.g. chief_hawthorne"
                disabled={submitting}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-tactical-950 border border-tactical-700 rounded-md py-2 pl-9 pr-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/60"
                placeholder="••••••••"
                disabled={submitting}
              />
            </div>
          </div>

          {error && (
            <div className="flex items-start space-x-2 bg-red-500/10 border border-red-500/30 rounded-md px-3 py-2 text-sm text-red-300">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-md transition-colors"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
