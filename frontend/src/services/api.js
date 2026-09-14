const API_BASE = '/api';

let activeAuthToken = localStorage.getItem('pd_auth_token') || '';

export function setAuthToken(token) {
  activeAuthToken = token;
  if (token) {
    localStorage.setItem('pd_auth_token', token);
  } else {
    localStorage.removeItem('pd_auth_token');
  }
}

export function getAuthToken() {
  return activeAuthToken;
}

async function request(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(activeAuthToken ? { Authorization: `Bearer ${activeAuthToken}`, 'x-user-id': activeAuthToken } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
  }
  return data;
}

export const api = {
  // Authentication & RBAC
  login: (username, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  getMe: () => request('/auth/me'),
  getPermissionsList: () => request('/auth/permissions-list'),
  getRoles: () => request('/auth/roles'),
  createRole: (data) => request('/auth/roles', { method: 'POST', body: JSON.stringify(data) }),
  updateRole: (roleId, data) => request(`/auth/roles/${roleId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRole: (roleId) => request(`/auth/roles/${roleId}`, { method: 'DELETE' }),
  getUsers: () => request('/auth/users'),
  updateUserRole: (userId, roleId) => request(`/auth/users/${userId}/role`, { method: 'PUT', body: JSON.stringify({ role_id: roleId }) }),

  // Stats
  getStats: () => request('/stats'),

  // Employees (Roster)
  getEmployees: () => request('/employees'),
  getEmployee: (enumber) => request(`/employees/${enumber}`),
  createEmployee: (data) => request('/employees', { method: 'POST', body: JSON.stringify(data) }),
  updateEmployee: (enumber, data) => request(`/employees/${enumber}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteEmployee: (enumber) => request(`/employees/${enumber}`, { method: 'DELETE' }),

  // Assignments
  getAssignments: () => request('/assignments'),
  createAssignment: (data) => request('/assignments', { method: 'POST', body: JSON.stringify(data) }),
  updateAssignment: (id, data) => request(`/assignments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAssignment: (id) => request(`/assignments/${id}`, { method: 'DELETE' }),

  // Bodycams
  getBodycams: () => request('/bodycams'),
  createBodycam: (data) => request('/bodycams', { method: 'POST', body: JSON.stringify(data) }),
  updateBodycam: (id, data) => request(`/bodycams/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBodycam: (id) => request(`/bodycams/${id}`, { method: 'DELETE' }),

  // Vehicles
  getVehicles: () => request('/vehicles'),
  createVehicle: (data) => request('/vehicles', { method: 'POST', body: JSON.stringify(data) }),
  updateVehicle: (id, data) => request(`/vehicles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteVehicle: (id) => request(`/vehicles/${id}`, { method: 'DELETE' }),

  // Cell Phones
  getCellphones: () => request('/cellphones'),
  createCellphone: (data) => request('/cellphones', { method: 'POST', body: JSON.stringify(data) }),
  updateCellphone: (id, data) => request(`/cellphones/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCellphone: (id) => request(`/cellphones/${id}`, { method: 'DELETE' }),

  // Absences & Coverage
  getAbsences: () => request('/absences'),
  createAbsence: (data) => request('/absences', { method: 'POST', body: JSON.stringify(data) }),
  deleteAbsence: (id) => request(`/absences/${id}`, { method: 'DELETE' }),

  // Alerts
  getAlerts: () => request('/alerts'),
  createAlert: (data) => request('/alerts', { method: 'POST', body: JSON.stringify(data) }),

  // Notices
  getNotices: (onlyActive = false) => request(`/notices${onlyActive ? '?active=true' : ''}`),
  createNotice: (data) => request('/notices', { method: 'POST', body: JSON.stringify(data) }),
  updateNotice: (id, data) => request(`/notices/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteNotice: (id) => request(`/notices/${id}`, { method: 'DELETE' }),

  // System
  reseed: () => request('/reseed', { method: 'POST' }),
};
