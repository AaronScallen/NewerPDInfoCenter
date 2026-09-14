import React from 'react';
import {
  Users,
  Car,
  Camera,
  Smartphone,
  ShieldAlert,
  Flame,
  Calendar,
  Clock,
  Activity,
  Radio,
  AlertTriangle,
  CheckCircle2,
  Layers,
  PlusCircle,
  FileText,
  Zap,
  Volume2
} from 'lucide-react';
import { playCriticalAlertSound, playUrgentAlertSound, playStandardNoticeSound } from '../services/audioAlert';
import { useAuth } from '../services/AuthContext';

export default function DashboardOverview({
  stats,
  alerts = [],
  employees = [],
  assignments = [],
  absences = [],
  notices = [],
  openDispatchModal,
  openNoticesModal,
  openAddOfficerModal,
  setActiveTab
}) {
  const { hasPermission } = useAuth();
  const vehPercent = stats?.vehicles?.total ? Math.round((stats.vehicles.assigned / stats.vehicles.total) * 100) : 0;
  const bwcPercent = stats?.bodycams?.total ? Math.round((stats.bodycams.assigned / stats.bodycams.total) * 100) : 0;
  const phonePercent = stats?.cellphones?.total ? Math.round((stats.cellphones.assigned / stats.cellphones.total) * 100) : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Tactical Command Telemetry Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3 font-mono">
        {/* Total Force */}
        <div className="p-3.5 rounded-xl bg-tactical-900 border border-tactical-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase mb-1">
            <span>Total Officers</span>
            <Users className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{stats?.totalEmployees || 0}</div>
          <div className="text-[10px] text-cyan-400 mt-1">SWORN PERSONNEL</div>
        </div>

        {/* On Duty */}
        <div className="p-3.5 rounded-xl bg-tactical-900 border border-tactical-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase mb-1">
            <span>Active On Duty</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 tracking-tight">{stats?.onDuty || 0}</div>
          <div className="text-[10px] text-emerald-400/80 mt-1">PATROL READY</div>
        </div>

        {/* On Leave / Absences */}
        <div className="p-3.5 rounded-xl bg-tactical-900 border border-tactical-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase mb-1">
            <span>On Leave</span>
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 tracking-tight">{stats?.onLeave || 0}</div>
          <div className="text-[10px] text-amber-400/80 mt-1">ABSENT / SICK</div>
        </div>

        {/* Vehicle Fleet */}
        <div className="p-3.5 rounded-xl bg-tactical-900 border border-tactical-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase mb-1">
            <span>Cruisers</span>
            <Car className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 tracking-tight">
            {stats?.vehicles?.assigned || 0}<span className="text-xs text-slate-500">/{stats?.vehicles?.total || 0}</span>
          </div>
          <div className="text-[10px] text-cyan-400 mt-1">{vehPercent}% DEPLOYED</div>
        </div>

        {/* Bodycams */}
        <div className="p-3.5 rounded-xl bg-tactical-900 border border-tactical-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase mb-1">
            <span>Coreforce BWCs</span>
            <Camera className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 tracking-tight">
            {stats?.bodycams?.assigned || 0}<span className="text-xs text-slate-500">/{stats?.bodycams?.total || 0}</span>
          </div>
          <div className="text-[10px] text-cyan-400 mt-1">{bwcPercent}% ASSIGNED</div>
        </div>

        {/* Phones */}
        <div className="p-3.5 rounded-xl bg-tactical-900 border border-tactical-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase mb-1">
            <span>Dept Phones</span>
            <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 tracking-tight">
            {stats?.cellphones?.assigned || 0}<span className="text-xs text-slate-500">/{stats?.cellphones?.total || 0}</span>
          </div>
          <div className="text-[10px] text-cyan-400 mt-1">{phonePercent}% ACTIVE</div>
        </div>

        {/* Active Notices */}
        <div className="p-3.5 rounded-xl bg-tactical-900 border border-tactical-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase mb-1">
            <span>Bulletins</span>
            <FileText className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-300 tracking-tight">{stats?.activeNoticesCount || 0}</div>
          <div className="text-[10px] text-amber-400 mt-1">TIME-WINDOW ACTIVE</div>
        </div>

        {/* Critical Alerts */}
        <div className="p-3.5 rounded-xl bg-tactical-900 border border-tactical-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase mb-1">
            <span>Alerts Total</span>
            <Flame className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-400 tracking-tight">{stats?.totalAlerts || 0}</div>
          <div className="text-[10px] text-rose-400 mt-1">DISPATCH LOGS</div>
        </div>
      </div>

      {/* 2. Main Dashboard Split: Live Dispatch Feed & Sector Staffing */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Emergency Alerts & Dispatch Feed (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-4 rounded-xl bg-tactical-900 border border-tactical-700 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-tactical-800 pb-3">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
                <h3 className="text-sm font-mono font-bold uppercase text-white tracking-wider">
                  Live Emergency Broadcast Feed & Dispatch Transmissions
                </h3>
              </div>
              <button
                onClick={openDispatchModal}
                disabled={!hasPermission('dispatch_broadcast')}
                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-mono font-bold flex items-center space-x-1.5 shadow-md shadow-red-950/50"
              >
                <Flame className="w-3.5 h-3.5" />
                <span>+ Broadcast Alert</span>
              </button>
            </div>

            {/* Alerts List */}
            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
              {alerts.length === 0 ? (
                <div className="text-center py-12 text-slate-500 font-mono text-xs">
                  No emergency broadcasts recorded in dispatch log.
                </div>
              ) : (
                alerts.slice(0, 10).map((al) => {
                  const isPrio1 = al.priority === 1;
                  const isPrio2 = al.priority === 2;

                  return (
                    <div
                      key={al.alert_id}
                      className={`p-3.5 rounded-xl border text-xs font-mono transition-all ${isPrio1
                        ? 'bg-red-950/40 border-red-500/60 shadow-lg shadow-red-950/30 ring-1 ring-red-500/30'
                        : isPrio2
                          ? 'bg-amber-950/30 border-amber-500/50'
                          : 'bg-tactical-950/80 border-tactical-800'
                        }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${isPrio1
                              ? 'bg-red-900 text-red-200 border border-red-400'
                              : isPrio2
                                ? 'bg-amber-900 text-amber-200 border border-amber-400'
                                : 'bg-cyan-900 text-cyan-200 border border-cyan-400'
                              }`}
                          >
                            PRIORITY {al.priority} // {isPrio1 ? 'CODE 3 FLASH' : isPrio2 ? 'URGENT' : 'STANDARD'}
                          </span>
                          <span className="font-bold text-white text-xs tracking-wide">
                            {al.title}
                          </span>
                        </div>

                        <span className="text-[10px] text-slate-400 shrink-0">
                          {al.created_at}
                        </span>
                      </div>

                      <p className="text-slate-200 leading-relaxed font-sans text-xs">
                        {al.message}
                      </p>

                      <div className="mt-2 pt-2 border-t border-tactical-800 flex items-center justify-between text-[10px] text-slate-400">
                        <span>Incident #{al.alert_id} • Broadcasted over WebSocket</span>
                        <button
                          onClick={() => {
                            if (isPrio1) playCriticalAlertSound();
                            else if (isPrio2) playUrgentAlertSound();
                            else playStandardNoticeSound();
                          }}
                          className="flex items-center space-x-1 text-cyan-400 hover:text-cyan-300"
                        >
                          <Volume2 className="w-3 h-3" />
                          <span>Replay Audio Tone</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Sector Staffing & Quick Deployment Links (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Sector Staffing Card */}
          <div className="p-4 rounded-xl bg-tactical-900 border border-tactical-700 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-tactical-800 pb-2">
              <h3 className="text-xs font-mono font-bold uppercase text-white tracking-wider flex items-center space-x-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>Sector Postings & Unit Staffing</span>
              </h3>
              <button
                onClick={() => setActiveTab('roster')}
                className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300"
              >
                View Full Roster →
              </button>
            </div>

            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
              {assignments.map((a) => {
                const assignedCount = a.officer_count || 0;
                return (
                  <div
                    key={a.assignment_id}
                    className="p-2.5 rounded-lg bg-tactical-950 border border-tactical-800 flex items-center justify-between text-xs font-mono hover:border-cyan-500/40 transition-colors"
                  >
                    <div>
                      <div className="font-bold text-slate-200">
                        {a.location_name}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Sector Code: #{a.assn_id || a.assignment_id}
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${assignedCount > 0
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-600/40'
                      : 'bg-rose-950 text-rose-300 border border-rose-600/40'
                      }`}>
                      {assignedCount} Officers
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Tactical Actions Grid */}
          <div className="p-4 rounded-xl bg-tactical-900 border border-tactical-700 shadow-xl space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase text-white tracking-wider flex items-center space-x-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>Quick Tactical Operations</span>
            </h3>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              {hasPermission('roster_manage') && (
              <button
                onClick={openAddOfficerModal}
                className="p-3 rounded-lg bg-tactical-950 hover:bg-tactical-850 border border-tactical-800 hover:border-cyan-500/50 text-left transition-all group"
              >
                <PlusCircle className="w-4 h-4 text-cyan-400 mb-1 group-hover:scale-110 transition-transform" />
                <div className="font-bold text-slate-200">Enroll Officer</div>
                <div className="text-[10px] text-slate-400">Badge / PID / Asset Link</div>
              </button>
              )}

              <button
                onClick={() => setActiveTab('absences')}
                className="p-3 rounded-lg bg-tactical-950 hover:bg-tactical-850 border border-tactical-800 hover:border-amber-500/50 text-left transition-all group"
              >
                <Calendar className="w-4 h-4 text-amber-400 mb-1 group-hover:scale-110 transition-transform" />
                <div className="font-bold text-slate-200">Shift Absence</div>
                <div className="text-[10px] text-slate-400">Log Relief / Covering</div>
              </button>

              {hasPermission('notices_view') && (
              <button
                onClick={openNoticesModal}
                className="p-3 rounded-lg bg-tactical-950 hover:bg-tactical-850 border border-tactical-800 hover:border-cyan-500/50 text-left transition-all group"
              >
                <FileText className="w-4 h-4 text-cyan-400 mb-1 group-hover:scale-110 transition-transform" />
                <div className="font-bold text-slate-200">Post Bulletin</div>
                <div className="text-[10px] text-slate-400">Department Notices</div>
              </button>
              )}

              {hasPermission('dispatch_broadcast') && (
              <button
                onClick={openDispatchModal}
                className="p-3 rounded-lg bg-red-950/50 hover:bg-red-900/60 border border-red-700/60 text-left transition-all group"
              >
                <Flame className="w-4 h-4 text-red-400 mb-1 group-hover:scale-110 transition-transform" />
                <div className="font-bold text-red-200">10-99 Emergency</div>
                <div className="text-[10px] text-red-400">Flash Dispatch Siren</div>
              </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
