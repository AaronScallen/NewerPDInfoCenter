import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, Radio, Volume2, VolumeX, CheckCircle, Flame, Clock, UserCheck } from 'lucide-react';
import { playCriticalAlertSound, playUrgentAlertSound, playAckChirp } from '../services/audioAlert';

export default function EmergencyOverlay({ alert, onAcknowledge }) {
  const [ackBadge, setAckBadge] = useState('');
  const [ackOfficerName, setAckOfficerName] = useState('');
  const [isMuted, setIsMuted] = useState(false);

  const isCritical = alert.priority === 1;

  // Sound loop for unacknowledged critical alert
  useEffect(() => {
    if (isMuted) return;

    if (isCritical) {
      playCriticalAlertSound();
      const interval = setInterval(() => {
        if (!isMuted) playCriticalAlertSound();
      }, 2500);
      return () => clearInterval(interval);
    } else if (alert.priority === 2) {
      playUrgentAlertSound();
      const interval = setInterval(() => {
        if (!isMuted) playUrgentAlertSound();
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [alert, isCritical, isMuted]);

  const handleAcknowledge = () => {
    playAckChirp();
    onAcknowledge({
      alertId: alert.alert_id,
      badge: ackBadge || 'DISPATCH-HQ',
      officerName: ackOfficerName || 'Duty Dispatcher',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
      {/* Flashing Warning Border */}
      <div 
        className={`w-full max-w-4xl rounded-2xl border-4 ${
          isCritical 
            ? 'border-red-600 bg-tactical-950 shadow-[0_0_80px_rgba(220,38,38,0.6)] animate-flash-border' 
            : 'border-amber-500 bg-tactical-950 shadow-[0_0_60px_rgba(245,158,11,0.5)]'
        } overflow-hidden`}
      >
        {/* Header Bar */}
        <div className={`px-6 py-4 flex items-center justify-between ${isCritical ? 'bg-gradient-to-r from-red-900 via-red-800 to-tactical-950' : 'bg-gradient-to-r from-amber-900 via-amber-800 to-tactical-950'}`}>
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-xl ${isCritical ? 'bg-red-600 text-white animate-bounce' : 'bg-amber-500 text-black'}`}>
              {isCritical ? <Flame className="w-8 h-8" /> : <AlertTriangle className="w-8 h-8" />}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-extrabold uppercase tracking-widest ${isCritical ? 'bg-red-950 text-red-200 border border-red-500' : 'bg-amber-950 text-amber-200 border border-amber-500'}`}>
                  {isCritical ? 'PRIORITY 1 // FLASH EMERGENCY' : 'PRIORITY 2 // URGENT DISPATCH'}
                </span>
                <span className="text-xs font-mono text-slate-300">INCIDENT ID: #{alert.alert_id}</span>
              </div>
              <h2 className="text-2xl font-black font-mono tracking-wide text-white mt-0.5">
                {alert.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <img
              src="/nisd_police_patch.png"
              alt="NISD Police Department"
              className="h-12 w-auto object-contain drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] hidden sm:block"
            />
            {/* Audio Mute Switch */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2.5 rounded-lg bg-tactical-900/80 border border-tactical-700 text-slate-200 hover:bg-tactical-800 flex items-center space-x-2 text-xs font-mono"
              title="Silence emergency tone"
            >
              {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-emerald-400 animate-pulse" />}
              <span>{isMuted ? 'UNMUTE SIREN' : 'MUTE SIREN'}</span>
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 md:p-8 space-y-6">
          {/* Main Message Box */}
          <div className="p-6 rounded-xl bg-tactical-900/90 border border-tactical-800 shadow-inner">
            <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
              <span>BROADCAST DISPATCH MESSAGE</span>
              <span className="flex items-center space-x-1 text-cyan-400">
                <Clock className="w-3.5 h-3.5" />
                <span>TIMESTAMP: {alert.created_at || new Date().toISOString().replace('T', ' ').substring(0, 19)}</span>
              </span>
            </div>
            <p className="text-xl md:text-2xl font-mono font-bold text-slate-100 leading-relaxed whitespace-pre-wrap">
              {alert.message}
            </p>
          </div>

          {/* Tactical Directives */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-3 rounded-lg bg-tactical-900 border border-tactical-800">
              <span className="text-slate-400 block mb-1">RADIO CHANNEL:</span>
              <span className="text-cyan-300 font-bold text-sm">TACTICAL TAC-1 DIRECT</span>
            </div>
            <div className="p-3 rounded-lg bg-tactical-900 border border-tactical-800">
              <span className="text-slate-400 block mb-1">DISPATCH ACTION:</span>
              <span className="text-red-400 font-bold text-sm">ALL UNITS HOLD TRAFFIC</span>
            </div>
            <div className="p-3 rounded-lg bg-tactical-900 border border-tactical-800">
              <span className="text-slate-400 block mb-1">SYSTEM STATE:</span>
              <span className="text-amber-400 font-bold text-sm">MANDATORY OPERATOR ACK</span>
            </div>
          </div>

          {/* Acknowledgment & Clearance Section */}
          <div className="pt-4 border-t border-tactical-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono text-slate-400">Badge #:</span>
                <input
                  type="text"
                  placeholder="e.g. 402"
                  value={ackBadge}
                  onChange={(e) => setAckBadge(e.target.value)}
                  className="w-24 px-2.5 py-1.5 bg-tactical-900 border border-tactical-700 rounded text-xs font-mono text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono text-slate-400">Officer:</span>
                <input
                  type="text"
                  placeholder="e.g. Sgt Miller"
                  value={ackOfficerName}
                  onChange={(e) => setAckOfficerName(e.target.value)}
                  className="w-36 px-2.5 py-1.5 bg-tactical-900 border border-tactical-700 rounded text-xs font-mono text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              onClick={handleAcknowledge}
              className={`w-full md:w-auto px-8 py-3.5 rounded-xl font-bold font-mono text-sm tracking-wider flex items-center justify-center space-x-2 shadow-xl transition-all ${
                isCritical
                  ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/50 hover:shadow-red-800/80'
                  : 'bg-amber-600 hover:bg-amber-500 text-tactical-950 font-black shadow-amber-900/50'
              }`}
            >
              <CheckCircle className="w-5 h-5" />
              <span>ACKNOWLEDGE & CLEAR OVERLAY</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
