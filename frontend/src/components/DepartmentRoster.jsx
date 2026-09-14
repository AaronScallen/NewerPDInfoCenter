import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  UserPlus,
  Edit3,
  Trash2,
  Car,
  Camera,
  Smartphone,
  MapPin,
  Shield,
  UserX,
  CheckCircle2,
  Download,
  LayoutGrid,
  List,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../services/AuthContext';

export default function DepartmentRoster({
  employees = [],
  assignments = [],
  bodycams = [],
  vehicles = [],
  cellphones = [],
  onRefresh,
  onOpenAddModal,
  onOpenEditModal,
  onOpenAbsenceModal
}) {
  const { hasPermission } = useAuth();
  const canManageRoster = hasPermission('roster_manage');
  const [searchTerm, setSearchTerm] = useState('');
  const [sectorFilter, setSectorFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, ACTIVE, ABSENT
  const [viewMode, setViewMode] = useState('table'); // table or cards
  const [selectedOfficer, setSelectedOfficer] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter & Search Logic
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(emp.badge).includes(searchTerm) ||
      String(emp.pid).includes(searchTerm) ||
      String(emp.positionNumber).includes(searchTerm) ||
      (emp.location_name && emp.location_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (emp.veh_unit_number && String(emp.veh_unit_number).includes(searchTerm)) ||
      (emp.bwc_id && String(emp.bwc_id).includes(searchTerm)) ||
      (emp.phone_num && emp.phone_num.includes(searchTerm));

    const matchesSector =
      sectorFilter === 'ALL' ||
      String(emp.assignment_id) === sectorFilter;

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && !emp.is_absent) ||
      (statusFilter === 'ABSENT' && emp.is_absent);

    return matchesSearch && matchesSector && matchesStatus;
  });

  const handleDelete = async (enumber, name, badge) => {
    if (window.confirm(`Are you sure you want to remove Officer ${name} (Badge #${badge}) from the department roster?`)) {
      setIsDeleting(true);
      try {
        await api.deleteEmployee(enumber);
        onRefresh();
      } catch (err) {
        alert(`Error deleting officer: ${err.message}`);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleExportCSV = () => {
    const headers = ['enumber', 'badge', 'positionNumber', 'pid', 'first_name', 'last_name', 'sector', 'vehicle_unit', 'bwc_id', 'phone_num', 'status'];
    const rows = filteredEmployees.map(e => [
      e.enumber,
      e.badge,
      e.positionNumber,
      e.pid,
      `"${e.first_name}"`,
      `"${e.last_name}"`,
      `"${e.location_name || 'Unassigned'}"`,
      e.veh_unit_number || 'None',
      e.bwc_id || 'None',
      e.phone_num || 'None',
      e.is_absent ? 'On Leave' : 'On Duty'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `NISDPD_Roster_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Control Ribbon */}
      <div className="p-4 rounded-xl bg-tactical-900 border border-tactical-700 shadow-lg flex flex-wrap items-center justify-between gap-3">
        {/* Left: Search */}
        <div className="flex items-center space-x-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Officer Name, Badge # (e.g. 402), PID, Unit (805009), BWC (17916)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-tactical-950 border border-tactical-700 rounded-lg text-xs font-mono text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* Sector Filter */}
          <select
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
            className="px-3 py-2 bg-tactical-950 border border-tactical-700 rounded-lg text-xs font-mono text-slate-200 focus:border-cyan-500 focus:outline-none"
          >
            <option value="ALL">All Sectors & Divisions</option>
            {assignments.map(a => (
              <option key={a.assignment_id} value={String(a.assignment_id)}>
                {a.location_name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-tactical-950 border border-tactical-700 rounded-lg text-xs font-mono text-slate-200 focus:border-cyan-500 focus:outline-none"
          >
            <option value="ALL">All Duty Statuses</option>
            <option value="ACTIVE">🟢 On Active Duty</option>
            <option value="ABSENT">🟡 On Leave / Absent</option>
          </select>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-tactical-950 p-1 rounded-lg border border-tactical-800">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded ${viewMode === 'table' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded ${viewMode === 'cards' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              title="Tactical Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 rounded-lg bg-tactical-800 hover:bg-tactical-750 border border-tactical-700 text-slate-200 text-xs font-mono flex items-center space-x-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          {/* Add Officer Button */}
          {canManageRoster && (
            <button
              onClick={onOpenAddModal}
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold flex items-center space-x-2 shadow-lg shadow-cyan-950/40 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>ENROLL OFFICER</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats Sub-strip */}
      <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-2">
        <div className="flex items-center space-x-4">
          <span>SHOWING: <strong className="text-white">{filteredEmployees.length}</strong> of {employees.length} Personnel</span>
          <span>•</span>
          <span className="text-emerald-400">{filteredEmployees.filter(e => !e.is_absent).length} Active On-Duty</span>
          <span>•</span>
          <span className="text-amber-400">{filteredEmployees.filter(e => e.is_absent).length} On Leave</span>
        </div>
      </div>

      {/* Content: High-Density Table View */}
      {viewMode === 'table' ? (
        <div className="rounded-xl border border-tactical-700/80 bg-tactical-900 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-tactical-950 text-slate-400 font-mono uppercase tracking-wider border-b border-tactical-800">
                <tr>
                  <th className="px-4 py-3">Officer / Badge</th>
                  <th className="px-3 py-3">PID / Pos #</th>
                  <th className="px-4 py-3">Assigned Sector / Division</th>
                  <th className="px-3 py-3">Patrol Cruiser</th>
                  <th className="px-3 py-3">Body-Worn Camera</th>
                  <th className="px-3 py-3">Tactical Phone</th>
                  <th className="px-3 py-3">Duty Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-tactical-800/80 text-slate-200 font-sans">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-500 font-mono">
                      No police officers found matching your active filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp) => (
                    <tr
                      key={emp.enumber}
                      className="hover:bg-tactical-800/60 transition-colors group cursor-pointer"
                      onClick={() => setSelectedOfficer(emp)}
                    >
                      {/* Officer / Badge */}
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-700/60 flex items-center justify-center text-cyan-300 font-mono font-bold shrink-0">
                            #{emp.badge}
                          </div>
                          <div>
                            <div className="font-bold text-white font-mono flex items-center space-x-1.5">
                              <span>{emp.last_name}, {emp.first_name}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              ENUM: {emp.enumber} • DOB: {emp.dob || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* PID / Position */}
                      <td className="px-3 py-3 font-mono">
                        <div className="text-slate-300">PID: <span className="text-cyan-300 font-semibold">{emp.pid}</span></div>
                        <div className="text-[10px] text-slate-500">POS: {emp.positionNumber}</div>
                      </td>

                      {/* Assigned Sector */}
                      <td className="px-4 py-3 font-mono">
                        {emp.location_name ? (
                          <div className="flex items-center space-x-1.5 text-slate-200">
                            <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <span className="truncate max-w-[200px]" title={emp.location_name}>
                              {emp.location_name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">Unassigned</span>
                        )}
                      </td>

                      {/* Patrol Vehicle */}
                      <td className="px-3 py-3 font-mono">
                        {emp.veh_id ? (
                          <div className="flex items-center space-x-1.5 text-slate-200">
                            <Car className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <div>
                              <span className="font-bold text-cyan-300">Unit #{emp.veh_unit_number}</span>
                              <div className="text-[10px] text-slate-400">
                                {emp.veh_year} {emp.veh_make} {emp.veh_model}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-600">-- None --</span>
                        )}
                      </td>

                      {/* Body-Worn Camera */}
                      <td className="px-3 py-3 font-mono">
                        {emp.bwc_id ? (
                          <div className="flex items-center space-x-1.5 text-slate-200">
                            <Camera className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <div>
                              <span className="font-bold text-cyan-300">BWC #{emp.bwc_id}</span>
                              <div className="text-[10px] text-slate-400 truncate max-w-[120px]" title={emp.bwc_locator}>
                                {emp.bwc_locator || emp.bwc_model}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-600">-- None --</span>
                        )}
                      </td>

                      {/* Tactical Phone */}
                      <td className="px-3 py-3 font-mono">
                        {emp.phone_num ? (
                          <div className="flex items-center space-x-1.5 text-slate-200">
                            <Smartphone className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <div>
                              <span className="text-slate-200">{emp.phone_num}</span>
                              <div className="text-[10px] text-slate-400">
                                {emp.phone_make} {emp.phone_model}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-600">-- None --</span>
                        )}
                      </td>

                      {/* Duty Status */}
                      <td className="px-3 py-3 font-mono">
                        {emp.is_absent ? (
                          <div>
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-950 text-amber-300 border border-amber-500/50 flex items-center space-x-1 w-max">
                              <UserX className="w-3 h-3" />
                              <span>ON LEAVE</span>
                            </span>
                            {emp.covering_officer_name && (
                              <div className="text-[10px] text-slate-400 mt-1" title={emp.covering_officer_name}>
                                Cov: <span className="text-slate-300">{emp.covering_officer_name} (#{emp.covering_officer_badge})</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40 flex items-center space-x-1 w-max">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>ON DUTY</span>
                          </span>
                        )}
                      </td>

                      {/* Row Actions */}
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        {canManageRoster && (
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={() => onOpenEditModal(emp)}
                              className="p-1.5 rounded bg-tactical-800 hover:bg-tactical-700 text-slate-300 hover:text-cyan-300 transition-colors"
                              title="Edit Officer & Equipment"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(emp.enumber, `${emp.first_name} ${emp.last_name}`, emp.badge)}
                              className="p-1.5 rounded bg-tactical-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 transition-colors"
                              title="Delete Officer Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Tactical Card Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredEmployees.map((emp) => (
            <div
              key={emp.enumber}
              onClick={() => setSelectedOfficer(emp)}
              className="p-4 rounded-xl bg-tactical-900 border border-tactical-700/80 hover:border-cyan-500/60 transition-all cursor-pointer shadow-lg space-y-3 group"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-300 font-mono font-black text-sm">
                    #{emp.badge}
                  </div>
                  <div>
                    <h3 className="font-bold text-white font-mono text-sm group-hover:text-cyan-300 transition-colors">
                      {emp.last_name}, {emp.first_name}
                    </h3>
                    <div className="text-[11px] text-slate-400 font-mono">
                      PID: <span className="text-cyan-400">{emp.pid}</span> • ENUM: {emp.enumber}
                    </div>
                  </div>
                </div>

                <div>
                  {emp.is_absent ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-500/50">
                      ON LEAVE
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                      ON DUTY
                    </span>
                  )}
                </div>
              </div>

              {/* Assignment Sector */}
              <div className="p-2.5 rounded-lg bg-tactical-950/80 border border-tactical-800 text-xs font-mono">
                <div className="text-[10px] text-slate-400 uppercase">Assigned Sector / Unit</div>
                <div className="text-cyan-300 font-semibold truncate">
                  {emp.location_name || 'No Sector Assigned'}
                </div>
              </div>

              {/* Asset Allocation Badges */}
              <div className="grid grid-cols-3 gap-2 text-[11px] font-mono">
                <div className="p-2 rounded bg-tactical-950 border border-tactical-800 text-center">
                  <Car className="w-3.5 h-3.5 text-cyan-400 mx-auto mb-0.5" />
                  <div className="text-[9px] text-slate-500">VEHICLE</div>
                  <div className="text-slate-200 font-bold truncate">
                    {emp.veh_unit_number ? `#${emp.veh_unit_number}` : 'NONE'}
                  </div>
                </div>

                <div className="p-2 rounded bg-tactical-950 border border-tactical-800 text-center">
                  <Camera className="w-3.5 h-3.5 text-cyan-400 mx-auto mb-0.5" />
                  <div className="text-[9px] text-slate-500">BODYCAM</div>
                  <div className="text-slate-200 font-bold truncate">
                    {emp.bwc_id ? `#${emp.bwc_id}` : 'NONE'}
                  </div>
                </div>

                <div className="p-2 rounded bg-tactical-950 border border-tactical-800 text-center">
                  <Smartphone className="w-3.5 h-3.5 text-cyan-400 mx-auto mb-0.5" />
                  <div className="text-[9px] text-slate-500">PHONE</div>
                  <div className="text-slate-200 font-bold truncate">
                    {emp.phone_num ? emp.phone_num.slice(-4) : 'NONE'}
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-2 border-t border-tactical-800 flex items-center justify-between text-xs font-mono" onClick={(e) => e.stopPropagation()}>
                <span className="text-slate-500 text-[10px]">POS: {emp.positionNumber}</span>
                {canManageRoster && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onOpenEditModal(emp)}
                      className="px-2.5 py-1 rounded bg-tactical-800 hover:bg-tactical-700 text-slate-300 hover:text-cyan-300 flex items-center space-x-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(emp.enumber, `${emp.first_name} ${emp.last_name}`, emp.badge)}
                      className="p-1 rounded bg-tactical-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Officer Detail Drawer / Inspection Modal */}
      {selectedOfficer && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md h-full max-h-[90vh] rounded-2xl bg-tactical-950 border-2 border-tactical-700 shadow-2xl p-6 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-tactical-800 pb-3">
                <div className="flex items-center space-x-3">
                  <img
                    src="/nisd_police_patch.png"
                    alt="NISD Police Department"
                    className="h-11 w-auto object-contain drop-shadow"
                  />
                  <div>
                    <h2 className="text-base font-bold font-mono text-white">
                      {selectedOfficer.first_name} {selectedOfficer.last_name}
                    </h2>
                    <p className="text-xs text-slate-400 font-mono">Badge #{selectedOfficer.badge} • PID: {selectedOfficer.pid}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedOfficer(null)}
                  className="p-1 rounded text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {/* Status Banner */}
              <div className={`p-3 rounded-lg border text-xs font-mono ${selectedOfficer.is_absent ? 'bg-amber-950/60 border-amber-600/60 text-amber-200' : 'bg-emerald-950/60 border-emerald-600/60 text-emerald-200'
                }`}>
                <div className="font-bold flex items-center space-x-1.5 mb-1">
                  {selectedOfficer.is_absent ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>{selectedOfficer.is_absent ? 'STATUS: TEMPORARY LEAVE / ABSENT' : 'STATUS: ACTIVE ON DUTY'}</span>
                </div>
                {selectedOfficer.is_absent && (
                  <div className="space-y-1 mt-2 pt-2 border-t border-amber-800/40 text-[11px]">
                    <div>Covering Officer: <strong>{selectedOfficer.covering_officer_name || 'None Assigned'}</strong> (#{selectedOfficer.covering_officer_badge})</div>
                    <div>Absence Reason: {selectedOfficer.absence_notes || 'N/A'}</div>
                    <div>Logged: {selectedOfficer.absence_date}</div>
                  </div>
                )}
              </div>

              {/* Detail List */}
              <div className="space-y-2 text-xs font-mono">
                <div className="p-3 rounded-lg bg-tactical-900 border border-tactical-800">
                  <span className="text-slate-400 block text-[10px] uppercase">Sector / Assignment</span>
                  <span className="text-cyan-300 font-bold">{selectedOfficer.location_name || 'Unassigned'}</span>
                </div>

                <div className="p-3 rounded-lg bg-tactical-900 border border-tactical-800">
                  <span className="text-slate-400 block text-[10px] uppercase">Assigned Cruiser (police_vehicle)</span>
                  {selectedOfficer.veh_id ? (
                    <div className="text-slate-200 mt-1">
                      <div className="font-bold text-cyan-300">Unit #{selectedOfficer.veh_unit_number} ({selectedOfficer.veh_year} {selectedOfficer.veh_make} {selectedOfficer.veh_model})</div>
                      <div className="text-[11px] text-slate-400">VIN: {selectedOfficer.veh_vin} • Plate: {selectedOfficer.veh_lp_number}</div>
                    </div>
                  ) : <span className="text-slate-500 italic">No cruiser assigned</span>}
                </div>

                <div className="p-3 rounded-lg bg-tactical-900 border border-tactical-800">
                  <span className="text-slate-400 block text-[10px] uppercase">Body-Worn Camera (bodycams)</span>
                  {selectedOfficer.bwc_id ? (
                    <div className="text-slate-200 mt-1">
                      <div className="font-bold text-cyan-300">BWC ID #{selectedOfficer.bwc_id} ({selectedOfficer.bwc_model})</div>
                      <div className="text-[11px] text-slate-400">Locator: {selectedOfficer.bwc_locator} • MAC: {selectedOfficer.bwc_mac}</div>
                    </div>
                  ) : <span className="text-slate-500 italic">No BWC assigned</span>}
                </div>

                <div className="p-3 rounded-lg bg-tactical-900 border border-tactical-800">
                  <span className="text-slate-400 block text-[10px] uppercase">Tactical Cell Phone (cell_phones)</span>
                  {selectedOfficer.cellphone_id ? (
                    <div className="text-slate-200 mt-1">
                      <div className="font-bold text-cyan-300">{selectedOfficer.phone_num} ({selectedOfficer.phone_make} {selectedOfficer.phone_model})</div>
                      <div className="text-[11px] text-slate-400">IMEI: {selectedOfficer.phone_imei} • Short ID: #{selectedOfficer.phone_id_short}</div>
                    </div>
                  ) : <span className="text-slate-500 italic">No phone assigned</span>}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-tactical-800 flex items-center justify-end space-x-2">
              {canManageRoster && (
                <button
                  onClick={() => {
                    const o = selectedOfficer;
                    setSelectedOfficer(null);
                    onOpenEditModal(o);
                  }}
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold"
                >
                  Edit Details
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
