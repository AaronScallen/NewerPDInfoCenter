import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, setAuthToken, getAuthToken } from './api';

const AuthContext = createContext(null);

export const ALL_APP_PERMISSIONS = [
  'dashboard_view',
  'dispatch_broadcast',
  'alert_ack',
  'alert_history_view',
  'roster_view',
  'roster_manage',
  'absences_view',
  'absences_manage',
  'assets_view',
  'assets_manage',
  'notices_view',
  'notices_manage',
  'system_reseed',
  'roles_manage'
];

export const PERMISSION_METADATA = {
  dashboard_view: { label: 'Command Center Dashboard', desc: 'View live telemetry, duty statistics, and operational overview widgets', category: 'Command & Telemetry' },
  dispatch_broadcast: { label: 'Emergency Alert Broadcast', desc: 'Transmit Priority 1, 2, and 3 emergency alerts across active consoles', category: 'Dispatch & Alerts' },
  alert_ack: { label: 'Acknowledge Emergency Broadcasts', desc: 'Acknowledge and dismiss real-time tactical alert overlays', category: 'Dispatch & Alerts' },
  alert_history_view: { label: 'View Alert History Archive', desc: 'Access archived logs of all historical incident dispatches', category: 'Dispatch & Alerts' },
  roster_view: { label: 'Department Roster (View)', desc: 'View complete personnel roster, assigned units, BWCs, and equipment', category: 'Personnel & Roster' },
  roster_manage: { label: 'Department Roster (Manage)', desc: 'Add new officers, edit badge/position details, or delete personnel', category: 'Personnel & Roster' },
  absences_view: { label: 'Shift Absence Tracker (View)', desc: 'View on-leave personnel, absence reasons, and active coverage', category: 'Shift & Absences' },
  absences_manage: { label: 'Shift Absence Tracker (Manage)', desc: 'Log new absences, assign covering officers, or restore to active duty', category: 'Shift & Absences' },
  assets_view: { label: 'Equipment & Fleet (View)', desc: 'View inventory of police vehicles, bodycams, cellphones, and sectors', category: 'Fleet & Equipment' },
  assets_manage: { label: 'Equipment & Fleet (Manage)', desc: 'Register, edit, or decommission vehicles, BWCs, phones, and assignments', category: 'Fleet & Equipment' },
  notices_view: { label: 'Tactical Notices (View)', desc: 'View active shift bulletins and tactical broadcast notices', category: 'Tactical Notices' },
  notices_manage: { label: 'Tactical Notices (Manage)', desc: 'Draft, schedule, publish, edit, or remove tactical bulletin notices', category: 'Tactical Notices' },
  system_reseed: { label: 'Database Reseed Utility', desc: 'Reset SQLite database to baseline law enforcement seed records', category: 'System Operations' },
  roles_manage: { label: 'Role & Permission RBAC Manager', desc: 'Modify role checkboxes and assign feature clearance (Super Admin & Command only)', category: 'System Operations' }
};

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAuthData = useCallback(async () => {
    try {
      const [meData, usersData, rolesData] = await Promise.all([
        api.getMe(),
        api.getUsers(),
        api.getRoles()
      ]);
      setCurrentUser(meData);
      setUsers(usersData);
      setRoles(rolesData);
      setError(null);
    } catch (err) {
      console.error('[AuthContext] Failed to load user session:', err);
      setError(err.message);
      setCurrentUser(null);
      setAuthToken('');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Only attempt to restore a session if a token was previously saved by a successful login.
    if (getAuthToken()) {
      fetchAuthData();
    } else {
      setLoading(false);
    }
  }, [fetchAuthData]);

  const login = async (username, password) => {
    const res = await api.login(username, password);
    setAuthToken(res.token);
    setCurrentUser(res.user);
    setLoading(true);
    await fetchAuthData();
    return res.user;
  };

  const logout = () => {
    setAuthToken('');
    setCurrentUser(null);
    setUsers([]);
    setRoles([]);
  };

  const isSuperAdmin = Boolean(currentUser?.is_super_admin);
  const isCommand = currentUser?.role_id === 'command';
  const isCommandOrAbove = isSuperAdmin || isCommand;

  const hasPermission = useCallback(
    (permKey) => {
      if (!currentUser) return false;
      if (currentUser.is_super_admin) return true;
      return Array.isArray(currentUser.permissions) && currentUser.permissions.includes(permKey);
    },
    [currentUser]
  );

  const value = {
    currentUser,
    users,
    roles,
    loading,
    error,
    isSuperAdmin,
    isCommand,
    isCommandOrAbove,
    hasPermission,
    login,
    logout,
    refreshAuth: fetchAuthData
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
