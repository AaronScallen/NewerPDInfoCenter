import React, { useState } from 'react';
import {
  Car,
  Camera,
  Smartphone,
  MapPin,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Shield,
  Layers,
  Cpu,
  Wifi,
  Key,
  Radio
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../services/AuthContext';

export default function AssetManager({
  vehicles = [],
  bodycams = [],
  cellphones = [],
  assignments = [],
  onRefresh
}) {
  const { hasPermission } = useAuth();
  const canManageAssets = hasPermission('assets_manage');
  const [activeSubTab, setActiveSubTab] = useState('vehicles'); // vehicles, bodycams, phones, assignments

  // Modal State
  const [modalType, setModalType] = useState(null); // 'vehicle', 'bwc', 'phone', 'assignment'
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Open Add/Edit Modal
  const openModal = (type, item = null) => {
    setModalType(type);
    setEditItem(item);
    setError(null);

    if (type === 'vehicle') {
      setFormData(item || {
        veh_id: Math.floor(805020 + Math.random() * 50),
        unit_number: Math.floor(805020 + Math.random() * 50),
        color: 'Black & White',
        year: 2024,
        make: 'Ford',
        model: 'Police Interceptor Utility AWD',
        decals: 1,
        vin: `1FAHP2MK${Math.floor(1000000 + Math.random() * 9000000)}`,
        lp_number: `PD-${Math.floor(10000 + Math.random() * 90000)}`
      });
    } else if (type === 'bwc') {
      setFormData(item || {
        bwc_id: Math.floor(18100 + Math.random() * 50),
        Device: 'BWC-DELTA-01',
        Locator: 'Dock Bay 6 - East Wing',
        Model: 'Coreforce Body 4',
        wifi_mac_address: `00:1A:79:C8:${Math.floor(10 + Math.random() * 89)}:${Math.floor(10 + Math.random() * 89)}`
      });
    } else if (type === 'phone') {
      setFormData(item || {
        id_short: Math.floor(110 + Math.random() * 50),
        phone_num: `555-014-${Math.floor(4200 + Math.random() * 800)}`,
        imei_num: `354892091240${Math.floor(100 + Math.random() * 899)}`,
        make: 'Samsung',
        model: 'Galaxy XCover6 Pro Tactical'
      });
    } else if (type === 'assignment') {
      setFormData(item || {
        assn_id: Math.floor(700 + Math.random() * 50),
        location_name: ''
      });
    }
  };

  const closeModal = () => {
    setModalType(null);
    setEditItem(null);
    setFormData({});
    setError(null);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (modalType === 'vehicle') {
        if (editItem) {
          await api.updateVehicle(editItem.veh_id, formData);
        } else {
          await api.createVehicle(formData);
        }
      } else if (modalType === 'bwc') {
        if (editItem) {
          await api.updateBodycam(editItem.bwc_id, formData);
        } else {
          await api.createBodycam(formData);
        }
      } else if (modalType === 'phone') {
        if (editItem) {
          await api.updateCellphone(editItem.phone_id, formData);
        } else {
          await api.createCellphone(formData);
        }
      } else if (modalType === 'assignment') {
        if (editItem) {
          await api.updateAssignment(editItem.assignment_id, formData);
        } else {
          await api.createAssignment(formData);
        }
      }
      closeModal();
      onRefresh();
    } catch (err) {
      setError(err.message || 'Error saving equipment item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async (type, id, label) => {
    if (window.confirm(`Delete ${type.toUpperCase()} item "${label}"? (Officers assigned to it will be unassigned automatically)`)) {
      try {
        if (type === 'vehicle') await api.deleteVehicle(id);
        if (type === 'bwc') await api.deleteBodycam(id);
        if (type === 'phone') await api.deleteCellphone(id);
        if (type === 'assignment') await api.deleteAssignment(id);
        onRefresh();
      } catch (err) {
        alert(`Error deleting item: ${err.message}`);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Sub-Tabs Bar */}
      <div className="p-3 rounded-xl bg-tactical-900 border border-tactical-700 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center space-x-1.5 bg-tactical-950 p-1 rounded-lg border border-tactical-800">
          <button
            onClick={() => setActiveSubTab('vehicles')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded text-xs font-mono font-medium transition-all ${activeSubTab === 'vehicles' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            <Car className="w-4 h-4" />
            <span>Cruiser Fleet ({vehicles.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('bodycams')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded text-xs font-mono font-medium transition-all ${activeSubTab === 'bodycams' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            <Camera className="w-4 h-4" />
            <span>Body-Worn Cameras ({bodycams.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('phones')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded text-xs font-mono font-medium transition-all ${activeSubTab === 'phones' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Dept Phones ({cellphones.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('assignments')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded text-xs font-mono font-medium transition-all ${activeSubTab === 'assignments' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Sectors & Posts ({assignments.length})</span>
          </button>
        </div>

        {canManageAssets && (
          <button
            onClick={() => {
              if (activeSubTab === 'vehicles') openModal('vehicle');
              if (activeSubTab === 'bodycams') openModal('bwc');
              if (activeSubTab === 'phones') openModal('phone');
              if (activeSubTab === 'assignments') openModal('assignment');
            }}
            className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono font-bold text-xs flex items-center space-x-1.5 shadow-lg shadow-cyan-950/40"
          >
            <Plus className="w-4 h-4" />
            <span>ADD {activeSubTab.toUpperCase().slice(0, -1)}</span>
          </button>
        )}
      </div>

      {/* 1. Vehicles Tab */}
      {activeSubTab === 'vehicles' && (
        <div className="rounded-xl border border-tactical-700/80 bg-tactical-900 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-tactical-950 text-slate-400 uppercase tracking-wider border-b border-tactical-800">
                <tr>
                  <th className="px-4 py-3">Unit Number</th>
                  <th className="px-4 py-3">Cruiser Specs</th>
                  <th className="px-4 py-3">VIN & License Plate</th>
                  <th className="px-4 py-3">Decals / Livery</th>
                  <th className="px-4 py-3">Allocation Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-tactical-800 text-slate-200">
                {vehicles.map((v) => (
                  <tr key={v.veh_id} className="hover:bg-tactical-800/60 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-700 flex items-center justify-center text-cyan-300 font-bold">
                          #{v.unit_number}
                        </div>
                        <span className="font-bold text-white">ID: {v.veh_id}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-100">{v.year} {v.make} {v.model}</div>
                      <div className="text-[10px] text-slate-400">{v.color}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-slate-300">VIN: {v.vin || 'N/A'}</div>
                      <div className="text-[10px] text-cyan-400">Plate: {v.lp_number || 'N/A'}</div>
                    </td>
                    <td className="px-4 py-3">
                      {v.decals ? (
                        <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-600/40 text-[10px] font-bold">
                          MARKED PATROL
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-bold">
                          UNMARKED / SLICKTOP
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {v.assigned_enumber ? (
                        <div>
                          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                            DEPLOYED
                          </span>
                          <div className="text-[11px] text-slate-300 mt-1 font-semibold">
                            {v.assigned_officer} (#{v.assigned_badge})
                          </div>
                        </div>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-tactical-800 text-slate-400 border border-tactical-700 text-[10px]">
                          AVAILABLE IN POOL
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {canManageAssets && (
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => openModal('vehicle', v)}
                          className="p-1.5 rounded bg-tactical-800 hover:bg-tactical-700 text-slate-300 hover:text-cyan-300"
                          title="Edit Cruiser"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem('vehicle', v.veh_id, `Unit ${v.unit_number}`)}
                          className="p-1.5 rounded bg-tactical-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300"
                          title="Delete Cruiser"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. Bodycams Tab */}
      {activeSubTab === 'bodycams' && (
        <div className="rounded-xl border border-tactical-700/80 bg-tactical-900 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-tactical-950 text-slate-400 uppercase tracking-wider border-b border-tactical-800">
                <tr>
                  <th className="px-4 py-3">BWC ID (bwc_id)</th>
                  <th className="px-4 py-3">Hardware Model & Device</th>
                  <th className="px-4 py-3">Armory Dock Locator</th>
                  <th className="px-4 py-3">WiFi / BLE MAC Address</th>
                  <th className="px-4 py-3">Assigned Officer</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-tactical-800 text-slate-200">
                {bodycams.map((b) => (
                  <tr key={b.bwc_id} className="hover:bg-tactical-800/60 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-700 flex items-center justify-center text-cyan-300 font-bold">
                          #{b.bwc_id}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-100">{b.Model || 'Coreforce Body 3'}</div>
                      <div className="text-[10px] text-slate-400">{b.Device || 'BWC'}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {b.Locator || 'Equipment Dock'}
                    </td>
                    <td className="px-4 py-3 text-cyan-400 text-[11px]">
                      {b.wifi_mac_address || 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      {b.assigned_enumber ? (
                        <div>
                          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                            CHECKED OUT
                          </span>
                          <div className="text-[11px] text-slate-300 mt-1 font-semibold">
                            {b.assigned_officer} (#{b.assigned_badge})
                          </div>
                        </div>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-tactical-800 text-slate-400 border border-tactical-700 text-[10px]">
                          DOCKED IN ARMORY
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {canManageAssets && (
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => openModal('bwc', b)}
                          className="p-1.5 rounded bg-tactical-800 hover:bg-tactical-700 text-slate-300 hover:text-cyan-300"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem('bwc', b.bwc_id, `BWC #${b.bwc_id}`)}
                          className="p-1.5 rounded bg-tactical-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Cell Phones Tab */}
      {activeSubTab === 'phones' && (
        <div className="rounded-xl border border-tactical-700/80 bg-tactical-900 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-tactical-950 text-slate-400 uppercase tracking-wider border-b border-tactical-800">
                <tr>
                  <th className="px-4 py-3">Phone ID & Short ID</th>
                  <th className="px-4 py-3">Phone Number</th>
                  <th className="px-4 py-3">Make & Model</th>
                  <th className="px-4 py-3">IMEI Serial</th>
                  <th className="px-4 py-3">Assigned Officer</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-tactical-800 text-slate-200">
                {cellphones.map((p) => (
                  <tr key={p.phone_id} className="hover:bg-tactical-800/60 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-bold text-cyan-300">ID #{p.phone_id}</span>
                      <span className="text-slate-500 text-[10px] ml-2">Short: {p.id_short || '--'}</span>
                    </td>
                    <td className="px-4 py-3 font-bold text-white">
                      {p.phone_num}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-slate-200">{p.make} {p.model}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-[11px]">
                      {p.imei_num || 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      {p.assigned_enumber ? (
                        <div>
                          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                            ASSIGNED
                          </span>
                          <div className="text-[11px] text-slate-300 mt-1 font-semibold">
                            {p.assigned_officer} (#{p.assigned_badge})
                          </div>
                        </div>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-tactical-800 text-slate-400 border border-tactical-700 text-[10px]">
                          IN COMMUNICATIONS INVENTORY
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {canManageAssets && (
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => openModal('phone', p)}
                          className="p-1.5 rounded bg-tactical-800 hover:bg-tactical-700 text-slate-300 hover:text-cyan-300"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem('phone', p.phone_id, p.phone_num)}
                          className="p-1.5 rounded bg-tactical-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Assignments / Sectors Tab */}
      {activeSubTab === 'assignments' && (
        <div className="rounded-xl border border-tactical-700/80 bg-tactical-900 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-tactical-950 text-slate-400 uppercase tracking-wider border-b border-tactical-800">
                <tr>
                  <th className="px-4 py-3">Assignment ID</th>
                  <th className="px-4 py-3">Sector Code (assn_id)</th>
                  <th className="px-4 py-3">Sector / Location Name</th>
                  <th className="px-4 py-3">Current Staffing</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-tactical-800 text-slate-200">
                {assignments.map((a) => (
                  <tr key={a.assignment_id} className="hover:bg-tactical-800/60 transition-colors">
                    <td className="px-4 py-3 font-bold text-cyan-300">
                      #{a.assignment_id}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {a.assn_id || 'N/A'}
                    </td>
                    <td className="px-4 py-3 font-bold text-white">
                      {a.location_name}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-600/40 text-[10px] font-bold">
                        {a.officer_count || 0} Officers Assigned
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {canManageAssets && (
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => openModal('assignment', a)}
                          className="p-1.5 rounded bg-tactical-800 hover:bg-tactical-700 text-slate-300 hover:text-cyan-300"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem('assignment', a.assignment_id, a.location_name)}
                          className="p-1.5 rounded bg-tactical-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Asset Add/Edit Modal */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl bg-tactical-950 border-2 border-tactical-700 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-tactical-800 pb-3">
              <h3 className="text-base font-bold font-mono text-white">
                {editItem ? `EDIT ${modalType.toUpperCase()}` : `ADD NEW ${modalType.toUpperCase()}`}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-500/60 text-rose-200 text-xs font-mono">
                {error}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-3 text-xs font-mono">
              {/* Vehicle Form Fields */}
              {modalType === 'vehicle' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">veh_id (Primary Key)*</label>
                      <input
                        type="number"
                        value={formData.veh_id || ''}
                        onChange={(e) => setFormData({ ...formData, veh_id: e.target.value })}
                        disabled={Boolean(editItem)}
                        required
                        className="w-full px-3 py-2 bg-tactical-900 border border-tactical-700 rounded text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Unit Number*</label>
                      <input
                        type="number"
                        value={formData.unit_number || ''}
                        onChange={(e) => setFormData({ ...formData, unit_number: e.target.value })}
                        required
                        className="w-full px-3 py-2 bg-tactical-900 border border-tactical-700 rounded text-slate-200"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Year</label>
                      <input
                        type="number"
                        value={formData.year || ''}
                        onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                        className="w-full px-3 py-2 bg-tactical-900 border border-tactical-700 rounded text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Make</label>
                      <input
                        type="text"
                        value={formData.make || ''}
                        onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                        className="w-full px-3 py-2 bg-tactical-900 border border-tactical-700 rounded text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Model</label>
                      <input
                        type="text"
                        value={formData.model || ''}
                        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                        className="w-full px-3 py-2 bg-tactical-900 border border-tactical-700 rounded text-slate-200"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Color / Livery</label>
                      <input
                        type="text"
                        value={formData.color || ''}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="w-full px-3 py-2 bg-tactical-900 border border-tactical-700 rounded text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">License Plate</label>
                      <input
                        type="text"
                        value={formData.lp_number || ''}
                        onChange={(e) => setFormData({ ...formData, lp_number: e.target.value })}
                        className="w-full px-3 py-2 bg-tactical-900 border border-tactical-700 rounded text-slate-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">VIN Number</label>
                    <input
                      type="text"
                      value={formData.vin || ''}
                      onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
                      className="w-full px-3 py-2 bg-tactical-900 border border-tactical-700 rounded text-slate-200"
                    />
                  </div>

                  <div className="flex items-center space-x-2 pt-1">
                    <input
                      type="checkbox"
                      id="decalsCheckbox"
                      checked={Boolean(formData.decals)}
                      onChange={(e) => setFormData({ ...formData, decals: e.target.checked ? 1 : 0 })}
                      className="rounded border-tactical-700 bg-tactical-900 text-cyan-600 focus:ring-cyan-500"
                    />
                    <label htmlFor="decalsCheckbox" className="text-slate-300">Marked Police Decals & Lightbar (decals = 1)</label>
                  </div>
                </>
              )}

              {/* BWC Form Fields */}
              {modalType === 'bwc' && (
                <>
                  <div>
                    <label className="block text-slate-400 mb-1">bwc_id (Primary Key)*</label>
                    <input
                      type="number"
                      value={formData.bwc_id || ''}
                      onChange={(e) => setFormData({ ...formData, bwc_id: e.target.value })}
                      disabled={Boolean(editItem)}
                      required
                      className="w-full px-3 py-2 bg-tactical-900 border border-tactical-700 rounded text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Model</label>
                    <input
                      type="text"
                      value={formData.Model || ''}
                      onChange={(e) => setFormData({ ...formData, Model: e.target.value })}
                      className="w-full px-3 py-2 bg-tactical-900 border border-tactical-700 rounded text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Device Name / Serial</label>
                    <input
                      type="text"
                      value={formData.Device || ''}
                      onChange={(e) => setFormData({ ...formData, Device: e.target.value })}
                      className="w-full px-3 py-2 bg-tactical-900 border border-tactical-700 rounded text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Dock Locator / Locker Location</label>
                    <input
                      type="text"
                      value={formData.Locator || ''}
                      onChange={(e) => setFormData({ ...formData, Locator: e.target.value })}
                      className="w-full px-3 py-2 bg-tactical-900 border border-tactical-700 rounded text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">WiFi / Bluetooth MAC Address</label>
                    <input
                      type="text"
                      value={formData.wifi_mac_address || ''}
                      onChange={(e) => setFormData({ ...formData, wifi_mac_address: e.target.value })}
                      className="w-full px-3 py-2 bg-tactical-900 border border-tactical-700 rounded text-slate-200"
                    />
                  </div>
                </>
              )}

              {/* Phone Form Fields */}
              {modalType === 'phone' && (
                <>
                  <div>
                    <label className="block text-slate-400 mb-1">Phone Number*</label>
                    <input
                      type="text"
                      value={formData.phone_num || ''}
                      onChange={(e) => setFormData({ ...formData, phone_num: e.target.value })}
                      required
                      placeholder="555-014-4020"
                      className="w-full px-3 py-2 bg-tactical-900 border border-tactical-700 rounded text-slate-200"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Make</label>
                      <input
                        type="text"
                        value={formData.make || ''}
                        onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                        placeholder="Samsung"
                        className="w-full px-3 py-2 bg-tactical-900 border border-tactical-700 rounded text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Model</label>
                      <input
                        type="text"
                        value={formData.model || ''}
                        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                        placeholder="Galaxy XCover6"
                        className="w-full px-3 py-2 bg-tactical-900 border border-tactical-700 rounded text-slate-200"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Short ID (id_short)</label>
                      <input
                        type="number"
                        value={formData.id_short || ''}
                        onChange={(e) => setFormData({ ...formData, id_short: e.target.value })}
                        className="w-full px-3 py-2 bg-tactical-900 border border-tactical-700 rounded text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">IMEI Serial Number</label>
                      <input
                        type="text"
                        value={formData.imei_num || ''}
                        onChange={(e) => setFormData({ ...formData, imei_num: e.target.value })}
                        className="w-full px-3 py-2 bg-tactical-900 border border-tactical-700 rounded text-slate-200"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Assignment Form Fields */}
              {modalType === 'assignment' && (
                <>
                  <div>
                    <label className="block text-slate-400 mb-1">Sector Code (assn_id)</label>
                    <input
                      type="number"
                      value={formData.assn_id || ''}
                      onChange={(e) => setFormData({ ...formData, assn_id: e.target.value })}
                      placeholder="101"
                      className="w-full px-3 py-2 bg-tactical-900 border border-tactical-700 rounded text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Sector / Location Name*</label>
                    <input
                      type="text"
                      value={formData.location_name || ''}
                      onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
                      required
                      placeholder="e.g. Sector 4 - West Harbor Perimeter"
                      className="w-full px-3 py-2 bg-tactical-900 border border-tactical-700 rounded text-slate-200"
                    />
                  </div>
                </>
              )}

              <div className="pt-3 border-t border-tactical-800 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded bg-tactical-800 text-slate-300 hover:bg-tactical-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
                >
                  {isSubmitting ? 'Saving...' : 'Save Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
