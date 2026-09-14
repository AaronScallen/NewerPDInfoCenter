import React from 'react';
import { ShieldAlert, Flame, AlertTriangle, Radio, Volume2, X, Clock } from 'lucide-react';
import { playCriticalAlertSound, playUrgentAlertSound, playStandardNoticeSound } from '../services/audioAlert';

export default function AlertHistoryModal({ isOpen, onClose, alerts = [] }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-3xl rounded-2xl bg-tactical-950 border-2 border-tactical-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 bg-tactical-900 border-b border-tactical-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src="/nisd_police_patch.png"
              alt="NISD Police Department"
              className="h-10 w-auto object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
            />
            <div>
              <h2 className="text-base font-bold font-mono text-white">
                EMERGENCY DISPATCH ARCHIVE & AUDIT TRAIL
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Log of Priority 1, 2, and 3 broadcasts sent across the department network
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-tactical-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-3 overflow-y-auto flex-1 font-mono text-xs">
          {alerts.length === 0 ? (
            <div className="p-8 text-center text-slate-500 border border-dashed border-tactical-800 rounded-xl">
              No alert transmissions in archive.
            </div>
          ) : (
            alerts.map((al) => {
              const isPrio1 = al.priority === 1;
              const isPrio2 = al.priority === 2;

              return (
                <div
                  key={al.alert_id}
                  className={`p-4 rounded-xl border transition-all ${
                    isPrio1
                      ? 'bg-red-950/40 border-red-500/60 shadow-md'
                      : isPrio2
                      ? 'bg-amber-950/30 border-amber-500/50'
                      : 'bg-tactical-900 border-tactical-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isPrio1
                            ? 'bg-red-900 text-red-200 border border-red-500'
                            : isPrio2
                            ? 'bg-amber-900 text-amber-200 border border-amber-500'
                            : 'bg-cyan-900 text-cyan-200 border border-cyan-500'
                        }`}
                      >
                        PRIO {al.priority} // {isPrio1 ? 'CODE 3 FLASH' : isPrio2 ? 'URGENT' : 'STANDARD'}
                      </span>
                      <span className="font-bold text-white text-sm">{al.title}</span>
                    </div>

                    <div className="flex items-center space-x-3 text-slate-400 text-[11px]">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{al.created_at}</span>
                      </span>
                    </div>
                  </div>

                  <p className="text-slate-200 font-sans text-xs leading-relaxed mb-3">
                    {al.message}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-tactical-800 text-[11px] text-slate-400">
                    <span>Incident Reference: #{al.alert_id}</span>
                    <button
                      onClick={() => {
                        if (isPrio1) playCriticalAlertSound();
                        else if (isPrio2) playUrgentAlertSound();
                        else playStandardNoticeSound();
                      }}
                      className="flex items-center space-x-1.5 text-cyan-400 hover:text-cyan-300 font-bold"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Replay Tactical Audio</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
