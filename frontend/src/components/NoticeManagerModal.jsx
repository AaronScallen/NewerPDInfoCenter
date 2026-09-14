import React, { useState } from 'react';
import { Bell, Plus, Edit3, Trash2, Calendar, User, Clock, Check, X, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../services/AuthContext';

export default function NoticeManagerModal({ 
  isOpen, 
  onClose, 
  notices = [], 
  employees = [], 
  onRefresh 
}) {
  const { hasPermission } = useAuth();
  const canManageNotices = hasPermission('notices_manage');
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [message, setMessage] = useState('');
  const [datetimeStart, setDatetimeStart] = useState('');
  const [datetimeEnd, setDatetimeEnd] = useState('');
  const [userId, setUserId] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleStartCreate = () => {
    setIsEditing(true);
    setEditId(null);
    setMessage('');
    
    // Default current time to 7 days in future
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + 7);

    setDatetimeStart(now.toISOString().substring(0, 19).replace('T', ' '));
    setDatetimeEnd(future.toISOString().substring(0, 19).replace('T', ' '));
    setUserId(employees[0]?.enumber || '');
    setError(null);
  };

  const handleStartEdit = (notice) => {
    setIsEditing(true);
    setEditId(notice.id);
    setMessage(notice.message);
    setDatetimeStart(notice.datetime_start);
    setDatetimeEnd(notice.datetime_end);
    setUserId(notice.user_id || '');
    setError(null);
  };

  const handleCancelForm = () => {
    setIsEditing(false);
    setEditId(null);
    setMessage('');
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || !datetimeStart || !datetimeEnd) {
      setError('Message, Start Date/Time, and End Date/Time are required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      if (editId) {
        await api.updateNotice(editId, {
          message: message.trim(),
          datetime_start: datetimeStart,
          datetime_end: datetimeEnd,
          user_id: userId ? Number(userId) : null
        });
      } else {
        await api.createNotice({
          message: message.trim(),
          datetime_start: datetimeStart,
          datetime_end: datetimeEnd,
          user_id: userId ? Number(userId) : null
        });
      }
      setIsEditing(false);
      setEditId(null);
      onRefresh();
    } catch (err) {
      setError(err.message || 'Failed to save notice');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this bulletin notice?')) {
      try {
        await api.deleteNotice(id);
        onRefresh();
      } catch (err) {
        alert(`Error deleting notice: ${err.message}`);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-3xl rounded-2xl bg-tactical-950 border-2 border-tactical-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-tactical-900 border-b border-tactical-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold font-mono text-white">
                DEPARTMENT BULLETINS & IMPORTANT NOTICES
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Filtered dynamically by current time between datetime_start & datetime_end
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

        {/* Modal Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 font-mono text-xs">
          {!isEditing ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Total Scheduled & Active Notices: {notices.length}</span>
                {canManageNotices && (
                  <button
                    onClick={handleStartCreate}
                    className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-tactical-950 font-bold flex items-center space-x-1.5 shadow-md shadow-amber-950/40 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>POST NEW NOTICE</span>
                  </button>
                )}
              </div>

              {/* Notice List */}
              <div className="space-y-3">
                {notices.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 border border-dashed border-tactical-800 rounded-xl">
                    No notices on record. Click "POST NEW NOTICE" to schedule one.
                  </div>
                ) : (
                  notices.map((n) => {
                    const now = new Date();
                    const start = new Date(n.datetime_start);
                    const end = new Date(n.datetime_end);
                    const isActive = now >= start && now <= end;

                    return (
                      <div
                        key={n.id}
                        className={`p-4 rounded-xl border transition-all ${
                          isActive
                            ? 'bg-amber-950/40 border-amber-500/60 text-amber-100 shadow-md'
                            : 'bg-tactical-900 border-tactical-800 text-slate-400 opacity-75'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isActive
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {isActive ? '● CURRENTLY ACTIVE ON BANNER' : '○ EXPIRED / FUTURE'}
                            </span>
                            <span className="text-slate-400 text-[11px]">Notice #{n.id}</span>
                          </div>

                          <div className="flex items-center space-x-2">
                            {canManageNotices && (
                              <>
                                <button
                                  onClick={() => handleStartEdit(n)}
                                  className="p-1 rounded bg-tactical-800 hover:bg-tactical-700 text-slate-300 hover:text-cyan-300"
                                  title="Edit notice"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(n.id)}
                                  className="p-1 rounded bg-tactical-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300"
                                  title="Delete notice"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        <p className="text-slate-100 font-sans text-sm font-medium leading-relaxed mb-3">
                          {n.message}
                        </p>

                        <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-tactical-800">
                          <div className="flex items-center space-x-3">
                            <span>Start: <strong className="text-slate-300">{n.datetime_start}</strong></span>
                            <span>→</span>
                            <span>End: <strong className="text-slate-300">{n.datetime_end}</strong></span>
                          </div>
                          {n.author_name && (
                            <div>
                              Author: <strong className="text-slate-300">{n.author_name} (#{n.author_badge})</strong>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            /* Create / Edit Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-500/60 text-rose-200 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-slate-400 mb-1">Notice Broadcast Message*</label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="e.g. CRITICAL: All body-worn cameras must be docked by shift end for firmware update..."
                  required
                  className="w-full px-3 py-2 bg-tactical-900 border border-tactical-700 rounded text-slate-200 font-sans focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Start Date / Time (datetime_start)*</label>
                  <input
                    type="text"
                    value={datetimeStart}
                    onChange={(e) => setDatetimeStart(e.target.value)}
                    placeholder="YYYY-MM-DD HH:MM:SS"
                    required
                    className="w-full px-3 py-2 bg-tactical-900 border border-tactical-700 rounded text-slate-200 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">End Date / Time (datetime_end)*</label>
                  <input
                    type="text"
                    value={datetimeEnd}
                    onChange={(e) => setDatetimeEnd(e.target.value)}
                    placeholder="YYYY-MM-DD HH:MM:SS"
                    required
                    className="w-full px-3 py-2 bg-tactical-900 border border-tactical-700 rounded text-slate-200 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Author Officer (user_id FK &rarr; employees.enumber)</label>
                <select
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-full px-3 py-2 bg-tactical-900 border border-tactical-700 rounded text-slate-200 focus:border-amber-500 focus:outline-none"
                >
                  <option value="">-- No Author Officer --</option>
                  {employees.map((e) => (
                    <option key={e.enumber} value={e.enumber}>
                      #{e.badge} - {e.first_name} {e.last_name} ({e.location_name || 'Officer'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-tactical-800 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="px-4 py-2 rounded bg-tactical-800 text-slate-300 hover:bg-tactical-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded bg-amber-600 hover:bg-amber-500 text-tactical-950 font-bold"
                >
                  {isSubmitting ? 'Saving...' : editId ? 'Update Notice' : 'Post Notice'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
