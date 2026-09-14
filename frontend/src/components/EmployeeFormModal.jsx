import React, { useState, useEffect } from 'react';
import { X, UserPlus, Save, Shield, Car, Camera, Smartphone, MapPin, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export default function EmployeeFormModal({
  isOpen,
  onClose,
  officer,
  onSaved,
  assignments = [],
  bodycams = [],
  vehicles = [],
  cellphones = []
}) {
  const isEdit = Boolean(officer);

  const [formData, setFormData] = useState({
    enumber: '',
    badge: '',
    positionNumber: '',
    pid: '',
    dob: '',
    first_name: '',
    last_name: '',
    assignment_id: '',
    bwc_id: '',
    veh_id: '',
    cellphone_id: ''
  });

  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (officer) {
      setFormData({
        enumber: officer.enumber || '',
        badge: officer.badge || '',
        positionNumber: officer.positionNumber || '',
        pid: officer.pid || '',
        dob: officer.dob || '',
        first_name: officer.first_name || '',
        last_name: officer.last_name || '',
        assignment_id: officer.assignment_id || '',
        bwc_id: officer.bwc_id || '',
        veh_id: officer.veh_id || '',
        cellphone_id: officer.cellphone_id || ''
      });
    } else {
      // Generate realistic default sequence values for convenience
      const randomBadge = Math.floor(100 + Math.random() * 899);
      setFormData({
        enumber: Math.floor(1010 + Math.random() * 50),
        badge: randomBadge,
        positionNumber: Number(`900${randomBadge}`),
        pid: Number(`18${randomBadge}`),
        dob: '1992-05-18',
        first_name: '',
        last_name: '',
        assignment_id: assignments[0]?.assignment_id || '',
        bwc_id: '',
        veh_id: '',
        cellphone_id: ''
      });
    }
    setError(null);
  }, [officer, isOpen, assignments]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (isEdit) {
        await api.updateEmployee(formData.enumber, formData);
      } else {
        await api.createEmployee(formData);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message || 'Error saving officer profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl rounded-2xl bg-tactical-950 border-2 border-tactical-700 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-tactical-900 border-b border-tactical-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src="/nisd_police_patch.png"
              alt="NISD Police Department"
              className="h-10 w-auto object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
            />
            <div>
              <h2 className="text-base font-bold font-mono text-white">
                {isEdit ? `EDIT OFFICER RECORD - ENUM #${formData.enumber}` : 'ENROLL NEW LAW ENFORCEMENT OFFICER'}
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Personnel Credentials & Foreign Key Equipment Linkages
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-500/60 text-rose-200 flex items-start space-x-2 font-mono">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Core Identification Numbers */}
          <div className="p-4 rounded-xl bg-tactical-900/80 border border-tactical-800 space-y-3">
            <h3 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center space-x-1.5">
              <span>1. Badge & System Identifiers</span>
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-slate-400 font-mono mb-1">Employee # (enumber)*</label>
                <input
                  type="number"
                  name="enumber"
                  value={formData.enumber}
                  onChange={handleChange}
                  disabled={isEdit}
                  required
                  className="w-full px-3 py-2 bg-tactical-950 border border-tactical-700 rounded text-slate-200 font-mono focus:border-cyan-500 focus:outline-none disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-mono mb-1">Badge Number*</label>
                <input
                  type="number"
                  name="badge"
                  value={formData.badge}
                  onChange={handleChange}
                  placeholder="e.g. 402"
                  required
                  className="w-full px-3 py-2 bg-tactical-950 border border-tactical-700 rounded text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-mono mb-1">PID (Personal ID)*</label>
                <input
                  type="number"
                  name="pid"
                  value={formData.pid}
                  onChange={handleChange}
                  placeholder="e.g. 18402"
                  required
                  className="w-full px-3 py-2 bg-tactical-950 border border-tactical-700 rounded text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-mono mb-1">Position #*</label>
                <input
                  type="number"
                  name="positionNumber"
                  value={formData.positionNumber}
                  onChange={handleChange}
                  placeholder="e.g. 900402"
                  required
                  className="w-full px-3 py-2 bg-tactical-950 border border-tactical-700 rounded text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="p-4 rounded-xl bg-tactical-900/80 border border-tactical-800 space-y-3">
            <h3 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
              2. Officer Profile & Personal Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 font-mono mb-1">First Name*</label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="e.g. Marcus"
                  required
                  className="w-full px-3 py-2 bg-tactical-950 border border-tactical-700 rounded text-slate-200 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-mono mb-1">Last Name*</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="e.g. Miller"
                  required
                  className="w-full px-3 py-2 bg-tactical-950 border border-tactical-700 rounded text-slate-200 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-mono mb-1">Date of Birth (dob)</label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-tactical-950 border border-tactical-700 rounded text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Foreign Key Dropdowns & Equipment Linkages */}
          <div className="p-4 rounded-xl bg-tactical-900/80 border border-tactical-800 space-y-3">
            <h3 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
              3. Foreign Key Tactical Allocations & Equipment
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Assignment FK */}
              <div>
                <label className="block text-slate-400 font-mono mb-1 flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Assigned Sector / Division (assignment_id)</span>
                </label>
                <select
                  name="assignment_id"
                  value={formData.assignment_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-tactical-950 border border-tactical-700 rounded text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                >
                  <option value="">-- No Sector Assigned --</option>
                  {assignments.map((a) => (
                    <option key={a.assignment_id} value={a.assignment_id}>
                      #{a.assn_id || a.assignment_id} - {a.location_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Police Vehicle FK */}
              <div>
                <label className="block text-slate-400 font-mono mb-1 flex items-center space-x-1">
                  <Car className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Assigned Cruiser / Unit (veh_id)</span>
                </label>
                <select
                  name="veh_id"
                  value={formData.veh_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-tactical-950 border border-tactical-700 rounded text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                >
                  <option value="">-- No Vehicle Assigned (Foot / Unassigned) --</option>
                  {vehicles.map((v) => {
                    const isOccupiedByOther = v.assigned_enumber && v.assigned_enumber !== formData.enumber;
                    return (
                      <option key={v.veh_id} value={v.veh_id}>
                        Unit {v.unit_number} - {v.year} {v.make} {v.model} ({v.color}) {isOccupiedByOther ? `[Currently: #${v.assigned_badge}]` : '[Available]'}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Bodycam FK */}
              <div>
                <label className="block text-slate-400 font-mono mb-1 flex items-center space-x-1">
                  <Camera className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Assigned Body-Worn Camera (bwc_id)</span>
                </label>
                <select
                  name="bwc_id"
                  value={formData.bwc_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-tactical-950 border border-tactical-700 rounded text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                >
                  <option value="">-- No BWC Assigned --</option>
                  {bodycams.map((b) => {
                    const isOccupiedByOther = b.assigned_enumber && b.assigned_enumber !== formData.enumber;
                    return (
                      <option key={b.bwc_id} value={b.bwc_id}>
                        BWC #{b.bwc_id} ({b.Model || 'Coreforce'}) - {b.Locator} {isOccupiedByOther ? `[Currently: #${b.assigned_badge}]` : '[Available]'}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Cell Phone FK */}
              <div>
                <label className="block text-slate-400 font-mono mb-1 flex items-center space-x-1">
                  <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Assigned Tactical Cell Phone (cellphone_id)</span>
                </label>
                <select
                  name="cellphone_id"
                  value={formData.cellphone_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-tactical-950 border border-tactical-700 rounded text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                >
                  <option value="">-- No Tactical Phone Assigned --</option>
                  {cellphones.map((p) => {
                    const isOccupiedByOther = p.assigned_enumber && p.assigned_enumber !== formData.enumber;
                    return (
                      <option key={p.phone_id} value={p.phone_id}>
                        Phone #{p.phone_id} - {p.phone_num} ({p.make} {p.model}) {isOccupiedByOther ? `[Currently: #${p.assigned_badge}]` : '[Available]'}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-tactical-800 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-tactical-800 hover:bg-tactical-700 text-slate-300 font-mono font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono font-bold flex items-center space-x-2 shadow-lg shadow-cyan-950/50 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'SAVING...' : isEdit ? 'UPDATE OFFICER' : 'ENROLL OFFICER'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
