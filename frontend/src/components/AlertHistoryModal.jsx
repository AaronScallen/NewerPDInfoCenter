import React, { useState } from 'react';
import { Edit3, Trash2, Volume2, X, Clock, AlertCircle } from 'lucide-react';
import { playCriticalAlertSound, playUrgentAlertSound, playStandardNoticeSound } from '../services/audioAlert';
import { api } from '../services/api';
import { useAuth } from '../services/AuthContext';

export default function AlertHistoryModal({ isOpen, onClose, alerts = [], onRefresh }) {
  const { hasPermission } = useAuth();
  const canManageAlerts = hasPermission('dispatch_broadcast');
  const [editingAlert, setEditingAlert] = useState(null);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState(1);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingAlertId, setDeletingAlertId] = useState(null);

  if (!isOpen) return null;

  const handleStartEdit = (alert) => {
    setEditingAlert(alert);
    setTitle(alert.title);
    setPriority(alert.priority);
    setMessage(alert.message);
    setError(null);
  };

  const handleCancelEdit = () => {
    setEditingAlert(null);
    setTitle('');
    setPriority(1);
    setMessage('');
    setError(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!title.trim() || !message.trim()) {
      setError('Alert title and broadcast message are required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await api.updateAlert(editingAlert.alert_id, {
        title: title.trim(),
        priority: Number(priority),
        message: message.trim()
      });
      handleCancelEdit();
      await onRefresh?.();
    } catch (err) {
      setError(err.message || 'Failed to update alert.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (alert) => {
    if (!window.confirm(`Delete archived alert #${alert.alert_id}? This cannot be undone.`)) return;

    setDeletingAlertId(alert.alert_id);
    setError(null);
    try {
      await api.deleteAlert(alert.alert_id);
      await onRefresh?.();
    } catch (err) {
      setError(err.message || 'Failed to delete alert.');
    } finally {
      setDeletingAlertId(null);
    }
  };

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
          {editingAlert ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="text-slate-400">Editing archived incident #{editingAlert.alert_id}</div>
              {error && (
                <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-500/60 text-rose-200 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              <div>
                <label className="block text-slate-400 mb-1">Alert Title*</label>
                <input
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  required
                  className="w-full px-3 py-2 bg-tactical-900 border border-tactical-700 rounded text-slate-200 focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Priority*</label>
                <select
                  value={priority}
                  onChange={(event) => setPriority(Number(event.target.value))}
                  className="w-full px-3 py-2 bg-tactical-900 border border-tactical-700 rounded text-slate-200 focus:border-cyan-500 focus:outline-none"
                >
                  <option value={1}>Priority 1 - Code 3 Flash</option>
                  <option value={2}>Priority 2 - Urgent</option>
                  <option value={3}>Priority 3 - Standard</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Broadcast Message*</label>
                <textarea
                  rows={5}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  required
                  className="w-full px-3 py-2 bg-tactical-900 border border-tactical-700 rounded text-slate-200 font-sans focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div className="pt-3 border-t border-tactical-800 flex justify-end space-x-2">
                <button type="button" onClick={handleCancelEdit} className="px-4 py-2 rounded bg-tactical-800 text-slate-300 hover:bg-tactical-700">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold">
                  {isSubmitting ? 'Saving...' : 'Update Alert'}
                </button>
              </div>
            </form>
          ) : (
            <>
              {error && (
                <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-500/60 text-rose-200 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
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
                      {canManageAlerts && (
                        <>
                          <button
                            onClick={() => handleStartEdit(al)}
                            className="p-1 rounded bg-tactical-800 hover:bg-tactical-700 text-slate-300 hover:text-cyan-300"
                            title="Edit alert"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(al)}
                            disabled={deletingAlertId === al.alert_id}
                            className="p-1 rounded bg-tactical-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300"
                            title="Delete alert"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
