import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Radio,
  Volume2,
  VolumeX,
  Bell,
  Clock,
  RefreshCw,
  Activity,
  Flame,
  Layers,
  Users,
  Car,
  Calendar,
  AlertTriangle,
  ShieldCheck,
  LogOut,
  KeyRound
} from 'lucide-react';
import { playAckChirp, playCriticalAlertSound, setAudioMuted } from '../services/audioAlert';
import { useAuth } from '../services/AuthContext';

export default function Navbar({
  activeTab,
  setActiveTab,
  wsStatus,
  activeClients,
  openDispatchModal,
  openNoticesModal,
  openAlertHistoryModal,
  openRoleManagerModal,
  activeNoticesCount,
  onReseed,
  stats
}) {
  const { currentUser, isCommandOrAbove, hasPermission, logout } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [muted, setMuted] = useState(false);
  const [isReseeding, setIsReseeding] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleToggleMute = () => {
    const next = !muted;
    setMuted(next);
    setAudioMuted(next);
    if (!next) {
      playAckChirp();
    }
  };

  const handleReseedClick = async () => {
    if (window.confirm('Reset database to default seed records (Badge 402, BWC 17916, Vehicle 805009, etc.)?')) {
      setIsReseeding(true);
      try {
        await onReseed();
      } finally {
        setIsReseeding(false);
      }
    }
  };

  const formattedLocal = currentTime.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formattedZulu = currentTime.toISOString().substring(11, 19) + 'Z';
  const formattedDate = currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  const navItems = [
    { id: 'dashboard', label: 'Command Center', icon: Activity },
    { id: 'roster', label: 'Department Roster', icon: Users, badge: stats?.totalEmployees },
    { id: 'absences', label: 'Shift & Absence Tracker', icon: Calendar, badge: stats?.onLeave > 0 ? `${stats?.onLeave} Off` : null, badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
    { id: 'assets', label: 'Equipment & Fleet', icon: Car },
  ];

  return (
    <header className="bg-tactical-900 border-b border-tactical-700/60 sticky top-0 z-40 shadow-xl">
      {/* Top Telemetry & Clock Ribbon */}
      <div className="bg-tactical-950 px-4 py-1 border-b border-tactical-800/80 flex flex-wrap items-center justify-between text-xs font-mono text-slate-400">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5 text-cyan-400 font-semibold tracking-wider">
            <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span>NISD PD // CENTRALIZED DISPATCH NETWORK</span>
          </div>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <div className="hidden md:flex items-center space-x-2 text-slate-400">
            <span>TERMINAL ID: <span className="text-slate-200 font-bold">DISPATCH-01</span></span>
          </div>
        </div>

        <div className="flex items-center space-x-5">
          {/* Current Session */}
          {currentUser && (
            <div className="flex items-center space-x-1.5 text-slate-300" title={`Signed in as ${currentUser.display_name}`}>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-200 font-semibold">{currentUser.display_name}</span>
              <span className="px-1.5 py-0.5 rounded bg-tactical-800 border border-tactical-700 text-[10px] uppercase text-cyan-300">
                {currentUser.role_name || currentUser.role_id}
              </span>
              <button
                onClick={logout}
                title="Sign out"
                className="p-1 rounded hover:bg-tactical-800 text-slate-500 hover:text-rose-300 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          <span className="text-slate-600 hidden sm:inline">|</span>

          {/* WebSocket Status */}
          <div className="flex items-center space-x-1.5" title="Real-time WebSocket connection state">
            <span className={`w-2 h-2 rounded-full ${wsStatus === 'CONNECTED' ? 'bg-emerald-400' : 'bg-rose-500 animate-ping'}`}></span>
            <span className={wsStatus === 'CONNECTED' ? 'text-emerald-400' : 'text-rose-400 font-semibold'}>
              {wsStatus === 'CONNECTED' ? `LIVE WS (${activeClients} active)` : 'OFFLINE (RECONNECTING)'}
            </span>
          </div>

          {/* Clock */}
          <div className="flex items-center space-x-3 text-slate-300 bg-tactical-900/90 px-2 py-0.5 rounded border border-tactical-800">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>{formattedDate}</span>
            <span className="text-cyan-300 font-bold">{formattedLocal} LOCAL</span>
            <span className="text-slate-500 font-medium">({formattedZulu})</span>
          </div>
        </div>
      </div>

      {/* Main Action Header */}
      <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand / Logo */}
        <div className="flex items-center space-x-3">
          <img
            src="/nisd_police_patch.png"
            alt="NISD Police Department Badge"
            className="h-11 w-auto object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] filter hover:scale-105 transition-transform"
          />
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-white tracking-wide font-mono">
                NISD POLICE DEPT
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-cyan-950 text-cyan-300 border border-cyan-700/50">
                Command v2.4
              </span>
            </div>
            <p className="text-xs text-slate-400">Staff Management, Asset Tracking & Emergency Dispatch</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center space-x-1 bg-tactical-950/80 p-1 rounded-lg border border-tactical-800">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${isActive
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-900/40 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-tactical-800'
                  }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge !== null && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded border ${item.badgeColor || 'bg-tactical-800 text-slate-300 border-tactical-700'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Tactical Actions */}
        <div className="flex items-center space-x-2">
          {/* Audio Mute / Unmute */}
          <button
            onClick={handleToggleMute}
            title={muted ? 'Unmute tactical alert sirens' : 'Mute tactical audio alerts'}
            className={`p-2 rounded-lg border text-xs flex items-center space-x-1.5 transition-colors ${muted
              ? 'bg-rose-950/40 text-rose-300 border-rose-800 hover:bg-rose-900/40'
              : 'bg-tactical-800 text-slate-300 border-tactical-700 hover:bg-tactical-700 hover:text-white'
              }`}
          >
            {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            <span className="hidden lg:inline text-[11px] font-mono">{muted ? 'MUTED' : 'AUDIO ON'}</span>
          </button>

          {/* Test Audio Button */}
          <button
            onClick={() => playCriticalAlertSound()}
            title="Test tactical siren tones"
            className="p-2 rounded-lg bg-tactical-800 hover:bg-tactical-700 border border-tactical-700 text-slate-300 hover:text-cyan-300 text-xs font-mono transition-colors"
          >
            TEST SIREN
          </button>

          {/* Notices Manager Trigger */}
          {hasPermission('notices_view') && (
            <button
              onClick={openNoticesModal}
              className="relative px-3 py-2 rounded-lg bg-tactical-800 hover:bg-tactical-700 border border-tactical-700 text-slate-200 text-xs font-medium flex items-center space-x-1.5 transition-colors"
            >
              <Bell className="w-4 h-4 text-amber-400" />
              <span className="hidden md:inline">Notices</span>
              {activeNoticesCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-500 text-tactical-950 text-[10px] font-bold flex items-center justify-center">
                  {activeNoticesCount}
                </span>
              )}
            </button>
          )}

          {/* Alert Logs */}
          {hasPermission('alert_history_view') && (
            <button
              onClick={openAlertHistoryModal}
              className="px-3 py-2 rounded-lg bg-tactical-800 hover:bg-tactical-700 border border-tactical-700 text-slate-200 text-xs font-medium flex items-center space-x-1.5 transition-colors"
            >
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span className="hidden md:inline">Alert History</span>
            </button>
          )}

          {/* Role & Access Management (Super Admin & Command only) */}
          {isCommandOrAbove && (
            <button
              onClick={openRoleManagerModal}
              title="Manage roles, feature permissions, and user assignments"
              className="px-3 py-2 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-700/60 text-indigo-200 text-xs font-medium flex items-center space-x-1.5 transition-colors"
            >
              <KeyRound className="w-4 h-4 text-indigo-300" />
              <span className="hidden md:inline">Role & Access</span>
            </button>
          )}

          {/* Reset / Reseed Demo Data */}
          {hasPermission('system_reseed') && (
            <button
              onClick={handleReseedClick}
              disabled={isReseeding}
              title="Reset to default seed data"
              className="p-2 rounded-lg bg-tactical-800 hover:bg-tactical-700 border border-tactical-700 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isReseeding ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          )}

          {/* EMERGENCY BROADCAST LAUNCHER */}
          {hasPermission('dispatch_broadcast') && (
          <button
            onClick={openDispatchModal}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-red-600 text-white font-bold text-xs flex items-center space-x-2 shadow-lg shadow-rose-950/60 border border-rose-400/40 animate-pulse-fast transition-all transform active:scale-95"
          >
            <Flame className="w-4 h-4" />
            <span className="tracking-wider">DISPATCH BROADCAST</span>
          </button>
          )}
        </div>
      </div>
    </header>
  );
}
