import React, { useState } from 'react';
import { 
  Calendar, 
  UserX, 
  UserCheck, 
  AlertCircle, 
  ShieldAlert, 
  PlusCircle, 
  CheckCircle, 
  Trash2, 
  Clock, 
  ArrowRight,
  Shield,
  Layers
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../services/AuthContext';

export default function ShiftAbsenceTracker({ 
  absences = [], 
  employees = [], 
  assignments = [],
  onRefresh 
}) {
  const { hasPermission } = useAuth();
  const canManageAbsences = hasPermission('absences_manage');
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedEnumber, setSelectedEnumber] = useState('');
  const [selectedCoveringId, setSelectedCoveringId] = useState('');
  const [assignmentName, setAssignmentName] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Filter available officers for covering (must not be currently absent)
  const availableOfficers = employees.filter(e => !e.is_absent);
  const absentOfficers = employees.filter(e => e.is_absent);
  const activeOfficers = employees.filter(e => !e.is_absent);

  const handleOpenModal = () => {
    setSelectedEnumber(activeOfficers[0]?.enumber || '');
    setSelectedCoveringId(activeOfficers[1]?.enumber || '');
    setAssignmentName(activeOfficers[0]?.location_name || 'Downtown Patrol');
    setNotes('Scheduled Sick / Medical Leave');
    setError(null);
    setShowLogModal(true);
  };

  const handleOfficerChange = (e) => {
    const enumVal = Number(e.target.value);
    setSelectedEnumber(enumVal);
    const emp = employees.find(x => x.enumber === enumVal);
    if (emp && emp.location_name) {
      setAssignmentName(emp.location_name);
    }
  };

  const handleLogAbsence = async (e) => {
    e.preventDefault();
    if (!selectedEnumber) {
      setError('Please select an officer.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await api.createAbsence({
        enumber: Number(selectedEnumber),
        covering_emp_id: selectedCoveringId ? Number(selectedCoveringId) : null,
        assignment: assignmentName,
        notes: notes,
        date_of_entry: new Date().toISOString().replace('T', ' ').substring(0, 19)
      });
      setShowLogModal(false);
      onRefresh();
    } catch (err) {
      setError(err.message || 'Error logging absence');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearAbsence = async (absenceId, officerName) => {
    if (window.confirm(`Mark ${officerName} as returned to active duty (clear absence record)?`)) {
      try {
        await api.deleteAbsence(absenceId);
        onRefresh();
      } catch (err) {
        alert(`Failed to clear absence: ${err.message}`);
      }
    }
  };

  // Find coverage gaps (absent officers with no covering officer)
  const uncoveredAbsences = absences.filter(a => !a.covering_emp_id);

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Strip */}
      <div className="p-4 rounded-xl bg-tactical-900 border border-tactical-700 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold font-mono text-white flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-amber-400" />
            <span>TACTICAL SHIFT ROSTER & ABSENCE COVERAGE TRACKER</span>
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            Track daily officer availability, leave status, and mutual aid shift coverage.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {canManageAbsences && (
            <button
              onClick={handleOpenModal}
              className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-tactical-950 font-mono font-bold text-xs flex items-center space-x-2 shadow-lg shadow-amber-950/40 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>LOG OFFICER ABSENCE</span>
            </button>
          )}
        </div>
      </div>

      {/* Coverage Health & Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-tactical-900 border border-tactical-800 flex items-center space-x-4">
          <div className="p-3 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-400">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-emerald-400">
              {activeOfficers.length} <span className="text-xs font-normal text-slate-400 font-mono">/ {employees.length}</span>
            </div>
            <div className="text-xs font-mono text-slate-300">ACTIVE ON-DUTY FORCE</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-tactical-900 border border-tactical-800 flex items-center space-x-4">
          <div className="p-3 rounded-lg bg-amber-950/80 border border-amber-500/40 text-amber-400">
            <UserX className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-amber-400">
              {absentOfficers.length}
            </div>
            <div className="text-xs font-mono text-slate-300">OFFICERS ON LEAVE / SICK</div>
          </div>
        </div>

        <div className={`p-4 rounded-xl border flex items-center space-x-4 ${
          uncoveredAbsences.length > 0
            ? 'bg-rose-950/40 border-rose-500/60 text-rose-200'
            : 'bg-tactical-900 border-tactical-800 text-slate-300'
        }`}>
          <div className={`p-3 rounded-lg ${uncoveredAbsences.length > 0 ? 'bg-rose-900/60 text-rose-300' : 'bg-tactical-950 text-cyan-400'}`}>
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className={`text-2xl font-bold font-mono ${uncoveredAbsences.length > 0 ? 'text-rose-400' : 'text-slate-200'}`}>
              {uncoveredAbsences.length}
            </div>
            <div className="text-xs font-mono">
              {uncoveredAbsences.length > 0 ? 'UNCOVERED SECTOR GAPS' : 'ALL POSTS COVERED'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Absence & Shift Coverage Log Table */}
      <div className="rounded-xl border border-tactical-700/80 bg-tactical-900 overflow-hidden shadow-xl space-y-0">
        <div className="px-5 py-3.5 bg-tactical-950 border-b border-tactical-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
            <h3 className="text-xs font-mono font-bold uppercase text-white tracking-wider">
              Active Absence & Relief Coverage Ledger
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">Total Records: {absences.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-tactical-950 text-slate-400 uppercase tracking-wider border-b border-tactical-800">
              <tr>
                <th className="px-4 py-3">Absent Officer</th>
                <th className="px-4 py-3">Assigned Sector Post</th>
                <th className="px-4 py-3">Assigned Covering Officer (`covering_emp_id`)</th>
                <th className="px-4 py-3">Date / Entry Time</th>
                <th className="px-4 py-3">Shift Notes / Reason</th>
                <th className="px-4 py-3 text-right">Duty Clearance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tactical-800 text-slate-200">
              {absences.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-mono">
                    <CheckCircle className="w-8 h-8 text-emerald-500/40 mx-auto mb-2" />
                    All personnel are currently on active duty. No absences logged.
                  </td>
                </tr>
              ) : (
                absences.map((ab) => (
                  <tr key={ab.absence_id} className="hover:bg-tactical-800/60 transition-colors">
                    {/* Absent Officer */}
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-7 h-7 rounded bg-amber-950 border border-amber-600/50 flex items-center justify-center text-amber-300 font-bold text-xs">
                          #{ab.employee_badge}
                        </div>
                        <div>
                          <div className="font-bold text-white">{ab.employee_name}</div>
                          <div className="text-[10px] text-slate-400">ENUM #{ab.enumber}</div>
                        </div>
                      </div>
                    </td>

                    {/* Sector */}
                    <td className="px-4 py-3 text-cyan-300 font-semibold">
                      {ab.assignment || 'General Patrol'}
                    </td>

                    {/* Covering Officer */}
                    <td className="px-4 py-3">
                      {ab.covering_emp_id ? (
                        <div className="flex items-center space-x-2">
                          <ArrowRight className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <div className="w-6 h-6 rounded bg-cyan-950 border border-cyan-600/50 flex items-center justify-center text-cyan-300 font-bold text-[10px]">
                            #{ab.covering_badge}
                          </div>
                          <div>
                            <span className="font-bold text-slate-200">{ab.covering_name}</span>
                            <div className="text-[10px] text-slate-400">ENUM #{ab.covering_emp_id}</div>
                          </div>
                        </div>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-600/50 text-[10px] font-bold">
                          ⚠️ NO COVERAGE ASSIGNED
                        </span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 text-slate-400 text-[11px]">
                      {ab.date_of_entry}
                    </td>

                    {/* Notes */}
                    <td className="px-4 py-3 text-slate-300 max-w-xs truncate" title={ab.notes}>
                      {ab.notes || '--'}
                    </td>

                    {/* Action */}
                    <td className="px-4 py-3 text-right">
                      {canManageAbsences && (
                        <button
                          onClick={() => handleClearAbsence(ab.absence_id, ab.employee_name)}
                          className="px-3 py-1 rounded bg-emerald-950 hover:bg-emerald-900 border border-emerald-600/50 text-emerald-300 text-[11px] font-bold flex items-center space-x-1 ml-auto transition-colors"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Return to Duty</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Absence Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl bg-tactical-950 border-2 border-tactical-700 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-tactical-800 pb-3">
              <div className="flex items-center space-x-2 text-amber-400">
                <UserX className="w-5 h-5" />
                <h3 className="text-base font-bold font-mono text-white">LOG OFFICER ABSENCE & COVERAGE</h3>
              </div>
              <button
                onClick={() => setShowLogModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-500/60 text-rose-200 text-xs font-mono">
                {error}
              </div>
            )}

            <form onSubmit={handleLogAbsence} className="space-y-3 text-xs font-mono">
              {/* Select Absent Officer */}
              <div>
                <label className="block text-slate-400 mb-1">Select Officer on Leave (enumber)*</label>
                <select
                  value={selectedEnumber}
                  onChange={handleOfficerChange}
                  required
                  className="w-full px-3 py-2 bg-tactical-900 border border-tactical-700 rounded text-slate-200 focus:border-amber-500 focus:outline-none"
                >
                  {activeOfficers.map(e => (
                    <option key={e.enumber} value={e.enumber}>
                      #{e.badge} - {e.first_name} {e.last_name} ({e.location_name || 'No Sector'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Sector / Post */}
              <div>
                <label className="block text-slate-400 mb-1">Post / Sector Requiring Coverage</label>
                <input
                  type="text"
                  value={assignmentName}
                  onChange={(e) => setAssignmentName(e.target.value)}
                  placeholder="e.g. Sector 1 - Downtown Central Patrol"
                  className="w-full px-3 py-2 bg-tactical-900 border border-tactical-700 rounded text-slate-200 focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Select Covering Officer */}
              <div>
                <label className="block text-slate-400 mb-1">Designated Relief / Covering Officer (`covering_emp_id`)</label>
                <select
                  value={selectedCoveringId}
                  onChange={(e) => setSelectedCoveringId(e.target.value)}
                  className="w-full px-3 py-2 bg-tactical-900 border border-tactical-700 rounded text-slate-200 focus:border-amber-500 focus:outline-none"
                >
                  <option value="">-- No Covering Officer (Post Vacant) --</option>
                  {availableOfficers
                    .filter(e => e.enumber !== Number(selectedEnumber))
                    .map(e => (
                      <option key={e.enumber} value={e.enumber}>
                        #{e.badge} - {e.first_name} {e.last_name} ({e.location_name || 'Available'})
                      </option>
                    ))}
                </select>
              </div>

              {/* Reason / Notes */}
              <div>
                <label className="block text-slate-400 mb-1">Absence Reason & Notes</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Superior court appearance / Sick leave / Training academy"
                  className="w-full px-3 py-2 bg-tactical-900 border border-tactical-700 rounded text-slate-200 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-tactical-800 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 rounded bg-tactical-800 text-slate-300 hover:bg-tactical-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded bg-amber-600 hover:bg-amber-500 text-tactical-950 font-bold"
                >
                  {isSubmitting ? 'Recording...' : 'Record Absence'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
