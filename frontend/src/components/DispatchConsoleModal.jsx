import React, { useState } from 'react';
import { Flame, AlertTriangle, Radio, X, Send, Zap, Shield, FileText, Check } from 'lucide-react';
import { api } from '../services/api';

const PRESET_TEMPLATES = [
  {
    name: '10-99 OFFICER IN DISTRESS',
    priority: 1,
    title: 'CODE 3 - OFFICER IN DISTRESS (10-99)',
    message: 'Officer requesting immediate emergency code 3 backup. Foot pursuit of armed suspect heading into Sector 3 Industrial Rail Yard. All available units switch to TAC-1.'
  },
  {
    name: 'ACTIVE VEHICLE PURSUIT',
    priority: 1,
    title: '10-43 PURSUIT IN PROGRESS',
    message: 'Active pursuit: Black Sedan traveling eastbound on Main St exceeding 80mph. K-9 and spike units position at 4th Ave junction.'
  },
  {
    name: 'URGENT BOLO - ARMED SUSPECT',
    priority: 2,
    title: 'URGENT BOLO - ARMED ROBBERY VEHICLE',
    message: 'BOLO: Dark gray Dodge Charger, missing rear plate, tinted windows. Armed and dangerous suspects last seen heading north on Route 4.'
  },
  {
    name: 'TACTICAL PERIMETER ESTABLISHED',
    priority: 2,
    title: 'SWAT PERIMETER - HOLD PERIMETER',
    message: 'Tactical perimeter active around 1400 block of Oakridge. Traffic diverted. All non-tactical personnel maintain outer cordon.'
  },
  {
    name: 'WEATHER & ROAD CLOSURE',
    priority: 3,
    title: 'WEATHER ADVISORY - FLOOD ROAD CLOSURE',
    message: 'Flash flooding under the Harbor viaduct. Patrol units divert traffic away from Lower Bypass toward Summit Blvd.'
  },
  {
    name: 'SHIFT COMMAND BRIEF',
    priority: 3,
    title: 'SHIFT BRIEFING & FREQUENCY UPDATE',
    message: 'Sector 1 and Sector 2 units switch to Primary Dispatch frequency Bravo for evening shift overlap.'
  }
];

export default function DispatchConsoleModal({ isOpen, onClose, onAlertBroadcasted }) {
  const [priority, setPriority] = useState(1);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const applyTemplate = (tpl) => {
    setPriority(tpl.priority);
    setTitle(tpl.title);
    setMessage(tpl.message);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setError('Both alert title and broadcast message are required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await api.createAlert({
        title: title.trim(),
        priority: Number(priority),
        message: message.trim()
      });
      setSuccess(true);
      if (onAlertBroadcasted) onAlertBroadcasted(res.alert);
      setTimeout(() => {
        setSuccess(false);
        setTitle('');
        setMessage('');
        onClose();
      }, 1000);
    } catch (err) {
      setError(err.message || 'Failed to dispatch broadcast');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-3xl rounded-2xl bg-tactical-950 border-2 border-tactical-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-tactical-900 via-tactical-850 to-tactical-900 border-b border-tactical-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src="/nisd_police_patch.png"
              alt="NISD Police Department"
              className="h-10 w-auto object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
            />
            <div>
              <h2 className="text-lg font-bold font-mono text-white tracking-wide">
                DISPATCH EMERGENCY BROADCAST CONSOLE
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Real-Time WebSocket Department-Wide Telemetry & Alert Distribution
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-tactical-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-500/60 text-rose-200 text-xs font-mono">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/60 text-emerald-200 text-xs font-mono flex items-center space-x-2">
              <Check className="w-4 h-4" />
              <span>BROADCAST TRANSMITTED TO ALL ACTIVE TERMINALS VIA WEBSOCKET</span>
            </div>
          )}

          {/* Quick Presets */}
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-2 uppercase tracking-wider">
              Quick Tactical Presets:
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {PRESET_TEMPLATES.map((tpl, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => applyTemplate(tpl)}
                  className="p-2 text-left rounded-lg bg-tactical-900 hover:bg-tactical-850 border border-tactical-800 hover:border-cyan-500/50 transition-all text-xs group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                      tpl.priority === 1 ? 'bg-red-950 text-red-300 border border-red-800' :
                      tpl.priority === 2 ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                      'bg-cyan-950 text-cyan-300 border border-cyan-800'
                    }`}>
                      PRIO {tpl.priority}
                    </span>
                  </div>
                  <div className="font-mono text-slate-200 group-hover:text-cyan-300 font-semibold truncate">
                    {tpl.name}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Priority Selector */}
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-2 uppercase tracking-wider">
              Select Broadcast Priority Level:
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setPriority(1)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  priority === 1
                    ? 'bg-red-950/60 border-red-500 shadow-lg shadow-red-950/50 ring-1 ring-red-500'
                    : 'bg-tactical-900 border-tactical-800 opacity-60 hover:opacity-100'
                }`}
              >
                <div className="flex items-center space-x-2 text-red-400 font-mono font-bold text-xs mb-1">
                  <Flame className="w-4 h-4" />
                  <span>PRIORITY 1: FLASH / CODE 3</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Officer in Distress / Active Shooter / Pursuit. <strong className="text-red-300">Forces full-screen siren overlay on all screens.</strong>
                </p>
              </button>

              <button
                type="button"
                onClick={() => setPriority(2)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  priority === 2
                    ? 'bg-amber-950/60 border-amber-500 shadow-lg shadow-amber-950/50 ring-1 ring-amber-500'
                    : 'bg-tactical-900 border-tactical-800 opacity-60 hover:opacity-100'
                }`}
              >
                <div className="flex items-center space-x-2 text-amber-400 font-mono font-bold text-xs mb-1">
                  <AlertTriangle className="w-4 h-4" />
                  <span>PRIORITY 2: URGENT / BOLO</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Urgent APB / Perimeter / Fleeing vehicle. Displays tactical screen overlay with tone.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setPriority(3)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  priority === 3
                    ? 'bg-cyan-950/60 border-cyan-500 shadow-lg shadow-cyan-950/50 ring-1 ring-cyan-500'
                    : 'bg-tactical-900 border-tactical-800 opacity-60 hover:opacity-100'
                }`}
              >
                <div className="flex items-center space-x-2 text-cyan-400 font-mono font-bold text-xs mb-1">
                  <Radio className="w-4 h-4" />
                  <span>PRIORITY 3: STANDARD NOTICE</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Weather warning, channel switch, advisory notice. Plays radio chime & adds to feed.
                </p>
              </button>
            </div>
          </div>

          {/* Alert Title */}
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1 uppercase tracking-wider">
              Alert Title / 10-Code Subject:
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. CODE 3 - OFFICER IN DISTRESS (10-99) - SECTOR 3"
              className="w-full px-4 py-2.5 bg-tactical-900 border border-tactical-700 rounded-lg text-sm font-mono text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              required
            />
          </div>

          {/* Broadcast Message */}
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1 uppercase tracking-wider">
              Broadcast Dispatch Transmission Details:
            </label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter exact location, vehicle description, weapons, channel directives, and responding units..."
              className="w-full px-4 py-2.5 bg-tactical-900 border border-tactical-700 rounded-lg text-sm font-mono text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none leading-relaxed"
              required
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-tactical-800 flex items-center justify-between">
            <div className="text-[11px] font-mono text-slate-400 flex items-center space-x-1.5">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>Transmits immediately over WebSocket network</span>
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-tactical-800 hover:bg-tactical-700 text-slate-300 text-xs font-mono font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-6 py-2.5 rounded-lg font-mono font-bold text-xs tracking-wider flex items-center space-x-2 text-white shadow-xl transition-all ${
                  priority === 1 ? 'bg-red-600 hover:bg-red-500 shadow-red-950/60' :
                  priority === 2 ? 'bg-amber-600 hover:bg-amber-500 text-tactical-950 font-black shadow-amber-950/60' :
                  'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-950/60'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'TRANSMITTING...' : 'TRANSMIT BROADCAST'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
