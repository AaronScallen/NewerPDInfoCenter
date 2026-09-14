import React, { useMemo, useState } from 'react';
import { KeyRound, X, ShieldCheck, Users, Lock, Save, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { useAuth, PERMISSION_METADATA, ALL_APP_PERMISSIONS } from '../services/AuthContext';

// Fixed 5-tier role hierarchy (display order, top-down)
const ROLE_ORDER = ['super_admin', 'command', 'supervisor', 'dispatcher', 'viewer'];

// Group permissions by category, preserving PERMISSION_METADATA declaration order
function groupPermissionsByCategory() {
  const groups = {};
  for (const key of ALL_APP_PERMISSIONS) {
    const meta = PERMISSION_METADATA[key];
    const category = meta?.category || 'Other';
    if (!groups[category]) groups[category] = [];
    groups[category].push(key);
  }
  return groups;
}

export default function RoleManagerModal({ isOpen, onClose }) {
  const { currentUser, isSuperAdmin, isCommandOrAbove, roles, users, refreshAuth } = useAuth();
  const [activeView, setActiveView] = useState('permissions'); // 'permissions' | 'assignments'
  const [selectedRoleId, setSelectedRoleId] = useState('command');
  const [draftPermissions, setDraftPermissions] = useState(null);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [assignmentError, setAssignmentError] = useState(null);
  const [savingUserId, setSavingUserId] = useState(null);

  const permissionGroups = useMemo(() => groupPermissionsByCategory(), []);

  if (!isOpen) return null;

  // Defense-in-depth: this UI is only reachable via a gated Navbar entry, but guard render too.
  if (!isCommandOrAbove) return null;

  const orderedRoles = ROLE_ORDER
    .map((id) => roles.find((r) => r.role_id === id))
    .filter(Boolean);

  const selectedRole = orderedRoles.find((r) => r.role_id === selectedRoleId) || orderedRoles[0];

  const isSuperAdminRole = selectedRole?.role_id === 'super_admin';
  const isCommandRole = selectedRole?.role_id === 'command';
  // Super Admin's permission set is fixed (always all). Command's own permission set can only be
  // changed by the Super Administrator to prevent Command self-escalation.
  const canEditSelectedRole =
    selectedRole && !isSuperAdminRole && (!isCommandRole || isSuperAdmin);

  const activePermissions = draftPermissions || selectedRole?.permissions || [];

  const handleSelectRole = (roleId) => {
    setSelectedRoleId(roleId);
    setDraftPermissions(null);
    setStatusMessage(null);
  };

  const togglePermission = (permKey) => {
    if (!canEditSelectedRole) return;
    const current = draftPermissions || selectedRole?.permissions || [];
    const next = current.includes(permKey)
      ? current.filter((p) => p !== permKey)
      : [...current, permKey];
    setDraftPermissions(next);
  };

  const handleSaveRole = async () => {
    if (!selectedRole || !canEditSelectedRole) return;
    setSaving(true);
    setStatusMessage(null);
    try {
      await api.updateRole(selectedRole.role_id, {
        name: selectedRole.name,
        description: selectedRole.description,
        permissions: draftPermissions || selectedRole.permissions
      });
      setDraftPermissions(null);
      setStatusMessage({ type: 'success', text: `Permissions saved for ${selectedRole.name}.` });
      await refreshAuth();
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to save role permissions.' });
    } finally {
      setSaving(false);
    }
  };

  const handleAssignRole = async (userId, roleId) => {
    setAssignmentError(null);
    setSavingUserId(userId);
    try {
      await api.updateUserRole(userId, roleId);
      await refreshAuth();
    } catch (err) {
      setAssignmentError(err.message || 'Failed to update user role.');
    } finally {
      setSavingUserId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-5xl rounded-2xl bg-tactical-950 border-2 border-tactical-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-tactical-800 bg-tactical-900">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-lg bg-indigo-950/60 border border-indigo-700/60 flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Role & Access Management</h2>
              <p className="text-xs text-slate-400">Super Admin &amp; Command Staff clearance required</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-tactical-800 text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center space-x-1 px-5 pt-3 bg-tactical-950 border-b border-tactical-800">
          <button
            onClick={() => setActiveView('permissions')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-colors ${
              activeView === 'permissions'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            Feature Permissions
          </button>
          <button
            onClick={() => setActiveView('assignments')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-colors ${
              activeView === 'assignments'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            User Role Assignments
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {activeView === 'permissions' && (
            <div className="flex flex-col md:flex-row">
              {/* Role list */}
              <div className="md:w-56 flex-shrink-0 border-b md:border-b-0 md:border-r border-tactical-800 p-3 space-y-1">
                {orderedRoles.map((role) => (
                  <button
                    key={role.role_id}
                    onClick={() => handleSelectRole(role.role_id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-between transition-colors ${
                      selectedRoleId === role.role_id
                        ? 'bg-cyan-600/20 text-cyan-200 border border-cyan-600/40'
                        : 'text-slate-300 hover:bg-tactical-800 border border-transparent'
                    }`}
                  >
                    <span>{role.name}</span>
                    {role.role_id === 'super_admin' && <Lock className="w-3.5 h-3.5 text-slate-500" />}
                    {role.role_id === 'command' && !isSuperAdmin && <Lock className="w-3.5 h-3.5 text-slate-500" />}
                  </button>
                ))}
              </div>

              {/* Permission checkboxes */}
              <div className="flex-1 p-5">
                {selectedRole && (
                  <>
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <h3 className="text-sm font-bold text-white">{selectedRole.name}</h3>
                        <p className="text-xs text-slate-400 mt-0.5 max-w-xl">{selectedRole.description}</p>
                      </div>
                      {!canEditSelectedRole && (
                        <span className="flex items-center space-x-1.5 text-[11px] text-amber-300/90 bg-amber-500/10 border border-amber-500/30 rounded-full px-2.5 py-1">
                          <Lock className="w-3 h-3" />
                          <span>
                            {isSuperAdminRole
                              ? 'Fixed — always full clearance'
                              : 'Only Super Admin may edit Command permissions'}
                          </span>
                        </span>
                      )}
                    </div>

                    <div className="mt-4 space-y-5">
                      {Object.entries(permissionGroups).map(([category, keys]) => (
                        <div key={category}>
                          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">{category}</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {keys.map((permKey) => {
                              const meta = PERMISSION_METADATA[permKey];
                              const checked = isSuperAdminRole || activePermissions.includes(permKey);
                              return (
                                <label
                                  key={permKey}
                                  className={`flex items-start space-x-2.5 p-2.5 rounded-lg border transition-colors ${
                                    canEditSelectedRole
                                      ? 'border-tactical-800 hover:bg-tactical-900 cursor-pointer'
                                      : 'border-tactical-900 opacity-70 cursor-not-allowed'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    disabled={!canEditSelectedRole}
                                    onChange={() => togglePermission(permKey)}
                                    className="mt-0.5 w-4 h-4 accent-cyan-500"
                                  />
                                  <span>
                                    <span className="block text-xs font-semibold text-slate-200">{meta?.label || permKey}</span>
                                    <span className="block text-[11px] text-slate-500">{meta?.desc}</span>
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>

                    {statusMessage && (
                      <div
                        className={`mt-4 flex items-center space-x-2 rounded-lg px-3 py-2 text-xs border ${
                          statusMessage.type === 'success'
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                            : 'bg-red-500/10 border-red-500/30 text-red-300'
                        }`}
                      >
                        {statusMessage.type === 'success' ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <AlertCircle className="w-4 h-4" />
                        )}
                        <span>{statusMessage.text}</span>
                      </div>
                    )}

                    {canEditSelectedRole && (
                      <div className="mt-5 flex justify-end">
                        <button
                          onClick={handleSaveRole}
                          disabled={saving || !draftPermissions}
                          className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold transition-colors"
                        >
                          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          <span>Save Permissions</span>
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {activeView === 'assignments' && (
            <div className="p-5">
              {assignmentError && (
                <div className="mb-3 flex items-center space-x-2 rounded-lg px-3 py-2 text-xs border bg-red-500/10 border-red-500/30 text-red-300">
                  <AlertCircle className="w-4 h-4" />
                  <span>{assignmentError}</span>
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-tactical-800">
                      <th className="py-2 pr-3">User</th>
                      <th className="py-2 pr-3">Username</th>
                      <th className="py-2 pr-3">Current Role</th>
                      <th className="py-2 pr-3">Assign Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => {
                      const isTargetSuperAdmin = Boolean(u.is_super_admin);
                      const isTargetCommand = u.role_id === 'command';
                      // Only Super Admin can move a user to/from Command, or touch the Super Admin account.
                      const rowLocked = isTargetSuperAdmin && !isSuperAdmin;
                      return (
                        <tr key={u.user_id} className="border-b border-tactical-900/80">
                          <td className="py-2.5 pr-3 text-slate-200 font-medium flex items-center space-x-2">
                            {isTargetSuperAdmin && <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />}
                            <span>{u.display_name}</span>
                          </td>
                          <td className="py-2.5 pr-3 text-slate-400 font-mono text-xs">{u.username}</td>
                          <td className="py-2.5 pr-3 text-slate-300">{u.role_name}</td>
                          <td className="py-2.5 pr-3">
                            <select
                              value={u.role_id}
                              disabled={rowLocked || savingUserId === u.user_id}
                              onChange={(e) => handleAssignRole(u.user_id, e.target.value)}
                              className="bg-tactical-900 border border-tactical-700 rounded-md px-2 py-1.5 text-xs text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-cyan-500"
                            >
                              {orderedRoles.map((role) => {
                                // Only Super Admin can assign/remove the Command role.
                                const optionDisabled = role.role_id === 'command' && !isSuperAdmin && !isTargetCommand;
                                const optionHiddenForSuperAdminSlot = role.role_id === 'super_admin' && !isTargetSuperAdmin;
                                if (optionHiddenForSuperAdminSlot) return null;
                                return (
                                  <option key={role.role_id} value={role.role_id} disabled={optionDisabled}>
                                    {role.name}
                                  </option>
                                );
                              })}
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="mt-4 text-[11px] text-slate-500 flex items-center space-x-1.5">
                <Lock className="w-3 h-3" />
                <span>Only the Super Administrator may grant or revoke the Command role.</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
