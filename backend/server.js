import express from 'express';
import cors from 'cors';
import http from 'http';
import bcrypt from 'bcryptjs';
import { WebSocketServer, WebSocket } from 'ws';
import db, { initSchema } from './db.js';
import { seedDatabase } from './seed.js';

// Ensure schema exists on boot
initSchema();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Create HTTP server & WebSocket server
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

// Active WebSocket Clients Tracker
const clients = new Set();

function broadcast(data) {
  const payload = JSON.stringify(data);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log(`[WS] Client connected. Total active connections: ${clients.size}`);

  // Send initial handshake and client count
  ws.send(JSON.stringify({
    type: 'CONNECTION_ESTABLISHED',
    activeClients: clients.size,
    timestamp: new Date().toISOString()
  }));

  broadcast({
    type: 'CLIENT_COUNT_UPDATE',
    activeClients: clients.size
  });

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      if (data.type === 'PING') {
        ws.send(JSON.stringify({ type: 'PONG', timestamp: new Date().toISOString() }));
      } else if (data.type === 'ACK_ALERT') {
        // Broadcast alert acknowledgment to all dispatch consoles
        broadcast({
          type: 'ALERT_ACKNOWLEDGED',
          alertId: data.alertId,
          badge: data.badge,
          officerName: data.officerName,
          timestamp: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error('[WS] Message parse error:', err);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log(`[WS] Client disconnected. Total active connections: ${clients.size}`);
    broadcast({
      type: 'CLIENT_COUNT_UPDATE',
      activeClients: clients.size
    });
  });

  ws.on('error', (err) => {
    console.error('[WS] Client error:', err);
    clients.delete(ws);
  });
});

// ==========================================
// RBAC & AUTHENTICATION CONFIGURATION
// ==========================================
const ALL_PERMISSIONS = [
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

function getUserFromTokenOrHeader(req) {
  const authHeader = req.headers['authorization'] || '';
  const xUserId = req.headers['x-user-id'] || '';
  let identifier = null;

  if (authHeader.startsWith('Bearer ')) {
    identifier = authHeader.substring(7).trim();
  } else if (xUserId) {
    identifier = xUserId.trim();
  }

  if (!identifier) {
    return null; // No session token supplied — treat as unauthenticated
  }

  let user = null;
  if (!isNaN(identifier) && Number(identifier) > 0) {
    user = db.prepare(`
      SELECT u.*, r.name as role_name, r.permissions as role_permissions
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.role_id
      WHERE u.user_id = ?
    `).get(Number(identifier));
  } else {
    user = db.prepare(`
      SELECT u.*, r.name as role_name, r.permissions as role_permissions
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.role_id
      WHERE u.username = ?
    `).get(identifier);
  }

  if (user) {
    let permissions = [];
    try {
      permissions = JSON.parse(user.role_permissions || '[]');
    } catch (e) {
      permissions = [];
    }
    if (user.is_super_admin) {
      permissions = [...ALL_PERMISSIONS];
    }
    return {
      user_id: user.user_id,
      username: user.username,
      display_name: user.display_name,
      badge: user.badge,
      role_id: user.role_id,
      role_name: user.role_name,
      is_super_admin: user.is_super_admin === 1,
      permissions
    };
  }

  return null;
}

function authenticate(req, res, next) {
  const user = getUserFromTokenOrHeader(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  req.user = user;
  next();
}

function requirePermission(permissionKey) {
  return (req, res, next) => {
    const user = req.user || getUserFromTokenOrHeader(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    req.user = user;

    if (user.is_super_admin || user.permissions.includes(permissionKey)) {
      return next();
    }
    return res.status(403).json({
      error: `Access Denied: Missing clearance '${permissionKey}'. Current Role: '${user.role_name || user.role_id}'.`
    });
  };
}

function requireRoleManagementClearance(req, res, next) {
  const user = req.user || getUserFromTokenOrHeader(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  req.user = user;

  // Only Super Admin and Command roles (or users with explicit roles_manage permission) can access role management
  if (user.is_super_admin || user.role_id === 'command' || user.permissions.includes('roles_manage')) {
    return next();
  }
  return res.status(403).json({
    error: 'Access Denied: Role & Permission Management is strictly restricted to Super Administrator and Command Staff.'
  });
}

// Global Auth Context Attachment
app.use((req, res, next) => {
  req.user = getUserFromTokenOrHeader(req);
  next();
});

// ==========================================
// REST API ROUTES
// ==========================================

// 0. RBAC & Authentication Routes
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = db.prepare(`
      SELECT u.*, r.name as role_name, r.permissions as role_permissions
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.role_id
      WHERE u.username = ?
    `).get(username.trim());

    if (!user || !user.password_hash || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    let permissions = [];
    try {
      permissions = JSON.parse(user.role_permissions || '[]');
    } catch (e) {
      permissions = [];
    }
    if (user.is_super_admin) {
      permissions = [...ALL_PERMISSIONS];
    }

    res.json({
      success: true,
      token: user.username,
      user: {
        user_id: user.user_id,
        username: user.username,
        display_name: user.display_name,
        badge: user.badge,
        role_id: user.role_id,
        role_name: user.role_name,
        is_super_admin: user.is_super_admin === 1,
        permissions
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/me', (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'No active session' });
    }
    res.json(req.user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/permissions-list', (req, res) => {
  res.json({
    permissions: ALL_PERMISSIONS,
    categories: {
      'Command & Overview': ['dashboard_view'],
      'Emergency Dispatch': ['dispatch_broadcast', 'alert_ack', 'alert_history_view'],
      'Personnel & Roster': ['roster_view', 'roster_manage'],
      'Shift & Absences': ['absences_view', 'absences_manage'],
      'Equipment & Fleet': ['assets_view', 'assets_manage'],
      'Tactical Notices': ['notices_view', 'notices_manage'],
      'Administration & System': ['system_reseed', 'roles_manage']
    }
  });
});

app.get('/api/auth/roles', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM roles ORDER BY is_system DESC, name ASC').all();
    const formatted = rows.map((r) => {
      let perms = [];
      try {
        perms = JSON.parse(r.permissions || '[]');
      } catch (e) {
        perms = [];
      }
      return {
        ...r,
        permissions: r.role_id === 'super_admin' ? [...ALL_PERMISSIONS] : perms
      };
    });
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/roles', requireRoleManagementClearance, (req, res) => {
  try {
    const { role_id, name, description, permissions } = req.body;
    if (!role_id || !name) {
      return res.status(400).json({ error: 'role_id and name are required' });
    }

    const sanitizedRoleId = role_id.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const existing = db.prepare('SELECT role_id FROM roles WHERE role_id = ?').get(sanitizedRoleId);
    if (existing) {
      return res.status(409).json({ error: 'Role with this ID already exists.' });
    }

    db.prepare(`
      INSERT INTO roles (role_id, name, description, is_system, permissions)
      VALUES (?, ?, ?, 0, ?)
    `).run(
      sanitizedRoleId,
      name.trim(),
      description ? description.trim() : '',
      JSON.stringify(permissions || [])
    );

    broadcast({ type: 'RBAC_UPDATED', action: 'ROLE_CREATED', role_id: sanitizedRoleId });
    res.status(201).json({ success: true, role_id: sanitizedRoleId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/auth/roles/:role_id', requireRoleManagementClearance, (req, res) => {
  try {
    const roleId = req.params.role_id;
    const role = db.prepare('SELECT * FROM roles WHERE role_id = ?').get(roleId);
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    // Super Admin role can only be modified by Super Admin
    if (roleId === 'super_admin' && !req.user.is_super_admin) {
      return res.status(403).json({ error: 'Only the Super Administrator can modify Super Admin permissions.' });
    }

    // The Command role's own permission set can only be modified by Super Admin (prevents Command self-escalation)
    if (roleId === 'command' && !req.user.is_super_admin) {
      return res.status(403).json({ error: 'Only the Super Administrator can modify Command role permissions.' });
    }

    const { name, description, permissions } = req.body;
    const cleanPerms = Array.isArray(permissions) ? permissions : [];

    db.prepare(`
      UPDATE roles
      SET name = COALESCE(?, name),
          description = COALESCE(?, description),
          permissions = ?
      WHERE role_id = ?
    `).run(
      name ? name.trim() : null,
      description !== undefined ? description.trim() : null,
      JSON.stringify(cleanPerms),
      roleId
    );

    broadcast({ type: 'RBAC_UPDATED', action: 'ROLE_PERMISSIONS_UPDATED', role_id: roleId });
    res.json({ success: true, message: `Permissions updated for role '${role.name}'` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/auth/roles/:role_id', requireRoleManagementClearance, (req, res) => {
  try {
    const roleId = req.params.role_id;
    const role = db.prepare('SELECT * FROM roles WHERE role_id = ?').get(roleId);
    if (!role) return res.status(404).json({ error: 'Role not found' });
    if (role.is_system) {
      return res.status(400).json({ error: 'Cannot delete built-in system role.' });
    }

    // Check if any users are assigned
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE role_id = ?').get(roleId).count;
    if (userCount > 0) {
      return res.status(409).json({ error: `Cannot delete role: ${userCount} user(s) currently assigned to this role.` });
    }

    db.prepare('DELETE FROM roles WHERE role_id = ?').run(roleId);
    broadcast({ type: 'RBAC_UPDATED', action: 'ROLE_DELETED', role_id: roleId });
    res.json({ success: true, message: 'Role deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/users', (req, res) => {
  try {
    const users = db.prepare(`
      SELECT
        u.user_id,
        u.username,
        u.display_name,
        u.badge,
        u.role_id,
        u.is_super_admin,
        u.created_at,
        r.name as role_name,
        r.description as role_description,
        e.first_name,
        e.last_name,
        a.location_name as assignment_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.role_id
      LEFT JOIN employees e ON u.badge = e.badge
      LEFT JOIN assignments a ON e.assignment_id = a.assignment_id
      ORDER BY u.is_super_admin DESC, (u.role_id = 'command') DESC, u.display_name ASC
    `).all();

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/auth/users/:user_id/role', requireRoleManagementClearance, (req, res) => {
  try {
    const targetUserId = Number(req.params.user_id);
    const targetUser = db.prepare('SELECT * FROM users WHERE user_id = ?').get(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { role_id } = req.body;
    if (!role_id) {
      return res.status(400).json({ error: 'role_id is required' });
    }

    const targetRole = db.prepare('SELECT * FROM roles WHERE role_id = ?').get(role_id);
    if (!targetRole) {
      return res.status(404).json({ error: 'Target role does not exist' });
    }

    // Protection 1: Super Admin user account can NEVER be modified by non-super admin
    if (targetUser.is_super_admin && !req.user.is_super_admin) {
      return res.status(403).json({ error: 'Security Violation: Cannot modify the Super Administrator user.' });
    }

    // Protection 2: Super Admin user account cannot be demoted from super_admin
    if (targetUser.is_super_admin && role_id !== 'super_admin') {
      return res.status(403).json({ error: 'Cannot demote the Super Administrator account.' });
    }

    // Protection 3: EXCLUSIVE SUPER ADMIN POWER OVER "COMMAND" ROLE
    // Non-Super Admins (e.g. Command staff) CANNOT grant or revoke the 'command' role!
    const isTargetCurrentlyCommand = targetUser.role_id === 'command';
    const isNewRoleCommand = role_id === 'command';

    if ((isTargetCurrentlyCommand || isNewRoleCommand) && !req.user.is_super_admin) {
      return res.status(403).json({
        error: 'Security Restriction: Only the Super Administrator is authorized to assign or revoke the "Command" role.'
      });
    }

    // Protection 4: The 'super_admin' role_id (which carries the full permission set) can only ever
    // be assigned to the one true Super Administrator account. Prevents privilege escalation via
    // role_id spoofing on a non-super-admin user.
    if (role_id === 'super_admin' && !targetUser.is_super_admin) {
      return res.status(403).json({
        error: 'Security Restriction: The Super Administrator role cannot be assigned to another account.'
      });
    }

    // Update user role
    db.prepare('UPDATE users SET role_id = ? WHERE user_id = ?').run(role_id, targetUserId);

    broadcast({
      type: 'RBAC_UPDATED',
      action: 'USER_ROLE_ASSIGNED',
      user_id: targetUserId,
      role_id,
      updated_by: req.user.username
    });

    res.json({
      success: true,
      message: `Updated role for '${targetUser.display_name}' to '${targetRole.name}'`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 1. Health & Status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Police Department Command & Dispatch API',
    uptime: process.uptime(),
    dbConnected: true,
    wsClients: clients.size,
    timestamp: new Date().toISOString()
  });
});

// 2. Department Telemetry / Stats
app.get('/api/stats', (req, res) => {
  try {
    const totalEmployees = db.prepare('SELECT COUNT(*) as count FROM employees').get().count;
    const totalVehicles = db.prepare('SELECT COUNT(*) as count FROM police_vehicle').get().count;
    const assignedVehicles = db.prepare('SELECT COUNT(*) as count FROM employees WHERE veh_id IS NOT NULL').get().count;
    const totalBWCs = db.prepare('SELECT COUNT(*) as count FROM bodycams').get().count;
    const assignedBWCs = db.prepare('SELECT COUNT(*) as count FROM employees WHERE bwc_id IS NOT NULL').get().count;
    const totalPhones = db.prepare('SELECT COUNT(*) as count FROM cell_phones').get().count;
    const assignedPhones = db.prepare('SELECT COUNT(*) as count FROM employees WHERE cellphone_id IS NOT NULL').get().count;

    const totalAbsences = db.prepare('SELECT COUNT(*) as count FROM absences').get().count;
    const onDuty = Math.max(0, totalEmployees - totalAbsences);

    const activeNoticesCount = db.prepare(`
      SELECT COUNT(*) as count FROM important_notices
      WHERE datetime('now', 'localtime') BETWEEN datetime(datetime_start) AND datetime(datetime_end)
    `).get().count;

    const totalAlerts = db.prepare('SELECT COUNT(*) as count FROM emergency_alerts').get().count;
    const recentCriticalAlerts = db.prepare('SELECT COUNT(*) as count FROM emergency_alerts WHERE priority = 1').get().count;

    res.json({
      totalEmployees,
      onDuty,
      onLeave: totalAbsences,
      vehicles: { total: totalVehicles, assigned: assignedVehicles, available: totalVehicles - assignedVehicles },
      bodycams: { total: totalBWCs, assigned: assignedBWCs, available: totalBWCs - assignedBWCs },
      cellphones: { total: totalPhones, assigned: assignedPhones, available: totalPhones - assignedPhones },
      activeNoticesCount,
      totalAlerts,
      recentCriticalAlerts,
      wsClients: clients.size
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Employees (Department Roster) - Full Join View
app.get('/api/employees', (req, res) => {
  try {
    const query = `
      SELECT
        e.enumber,
        e.badge,
        e.positionNumber,
        e.pid,
        e.dob,
        e.last_name,
        e.first_name,
        e.assignment_id,
        a.assn_id,
        a.location_name,
        e.bwc_id,
        b.Device AS bwc_device,
        b.Locator AS bwc_locator,
        b.Model AS bwc_model,
        b.wifi_mac_address AS bwc_mac,
        e.veh_id,
        v.unit_number AS veh_unit_number,
        v.make AS veh_make,
        v.model AS veh_model,
        v.year AS veh_year,
        v.color AS veh_color,
        v.lp_number AS veh_lp_number,
        v.decals AS veh_decals,
        v.vin AS veh_vin,
        e.cellphone_id,
        p.phone_num,
        p.id_short AS phone_id_short,
        p.make AS phone_make,
        p.model AS phone_model,
        p.imei_num AS phone_imei,
        CASE WHEN ab.absence_id IS NOT NULL THEN 1 ELSE 0 END AS is_absent,
        ab.absence_id,
        ab.notes AS absence_notes,
        ab.date_of_entry AS absence_date,
        ab.covering_emp_id,
        cov.first_name || ' ' || cov.last_name AS covering_officer_name,
        cov.badge AS covering_officer_badge
      FROM employees e
      LEFT JOIN assignments a ON e.assignment_id = a.assignment_id
      LEFT JOIN bodycams b ON e.bwc_id = b.bwc_id
      LEFT JOIN police_vehicle v ON e.veh_id = v.veh_id
      LEFT JOIN cell_phones p ON e.cellphone_id = p.phone_id
      LEFT JOIN absences ab ON e.enumber = ab.enumber
      LEFT JOIN employees cov ON ab.covering_emp_id = cov.enumber
      ORDER BY e.last_name ASC, e.first_name ASC
    `;
    const rows = db.prepare(query).all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Single employee detail
app.get('/api/employees/:enumber', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM employees WHERE enumber = ?').get(req.params.enumber);
    if (!row) return res.status(404).json({ error: 'Employee not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create employee
app.post('/api/employees', requirePermission('roster_manage'), (req, res) => {
  try {
    const {
      enumber,
      badge,
      positionNumber,
      pid,
      dob,
      last_name,
      first_name,
      assignment_id,
      bwc_id,
      veh_id,
      cellphone_id
    } = req.body;

    if (!enumber || !badge || !positionNumber || !pid || !last_name || !first_name) {
      return res.status(400).json({ error: 'enumber, badge, positionNumber, pid, last_name, and first_name are required' });
    }

    const stmt = db.prepare(`
      INSERT INTO employees (enumber, badge, positionNumber, pid, dob, last_name, first_name, assignment_id, bwc_id, veh_id, cellphone_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      Number(enumber),
      Number(badge),
      Number(positionNumber),
      Number(pid),
      dob || null,
      last_name.trim(),
      first_name.trim(),
      assignment_id ? Number(assignment_id) : null,
      bwc_id ? Number(bwc_id) : null,
      veh_id ? Number(veh_id) : null,
      cellphone_id ? Number(cellphone_id) : null
    );

    broadcast({ type: 'ROSTER_UPDATED', action: 'CREATE_EMPLOYEE', enumber });
    res.status(201).json({ success: true, message: 'Employee added successfully', enumber });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'Duplicate constraint error: Badge, PID, Position Number, or Employee Number already exists.' });
    }
    res.status(500).json({ error: err.message });
  }
});

// Update employee
app.put('/api/employees/:enumber', requirePermission('roster_manage'), (req, res) => {
  try {
    const enumber = Number(req.params.enumber);
    const {
      badge,
      positionNumber,
      pid,
      dob,
      last_name,
      first_name,
      assignment_id,
      bwc_id,
      veh_id,
      cellphone_id
    } = req.body;

    const stmt = db.prepare(`
      UPDATE employees
      SET badge = ?, positionNumber = ?, pid = ?, dob = ?, last_name = ?, first_name = ?,
          assignment_id = ?, bwc_id = ?, veh_id = ?, cellphone_id = ?
      WHERE enumber = ?
    `);

    const info = stmt.run(
      Number(badge),
      Number(positionNumber),
      Number(pid),
      dob || null,
      last_name.trim(),
      first_name.trim(),
      assignment_id ? Number(assignment_id) : null,
      bwc_id ? Number(bwc_id) : null,
      veh_id ? Number(veh_id) : null,
      cellphone_id ? Number(cellphone_id) : null,
      enumber
    );

    if (info.changes === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    broadcast({ type: 'ROSTER_UPDATED', action: 'UPDATE_EMPLOYEE', enumber });
    res.json({ success: true, message: 'Employee updated successfully' });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'Duplicate constraint error: Badge, PID, or Position Number already in use by another officer.' });
    }
    res.status(500).json({ error: err.message });
  }
});

// Delete employee
app.delete('/api/employees/:enumber', requirePermission('roster_manage'), (req, res) => {
  try {
    const enumber = Number(req.params.enumber);
    const info = db.prepare('DELETE FROM employees WHERE enumber = ?').run(enumber);
    if (info.changes === 0) return res.status(404).json({ error: 'Employee not found' });

    broadcast({ type: 'ROSTER_UPDATED', action: 'DELETE_EMPLOYEE', enumber });
    res.json({ success: true, message: 'Employee deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Assignments
app.get('/api/assignments', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT a.*, COUNT(e.enumber) as officer_count
      FROM assignments a
      LEFT JOIN employees e ON a.assignment_id = e.assignment_id
      GROUP BY a.assignment_id
      ORDER BY a.assn_id ASC
    `).all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/assignments', requirePermission('assets_manage'), (req, res) => {
  try {
    const { assn_id, location_name } = req.body;
    if (!location_name) return res.status(400).json({ error: 'location_name is required' });
    const info = db.prepare('INSERT INTO assignments (assn_id, location_name) VALUES (?, ?)').run(
      assn_id ? Number(assn_id) : null,
      location_name.trim()
    );
    res.status(201).json({ success: true, assignment_id: info.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/assignments/:id', requirePermission('assets_manage'), (req, res) => {
  try {
    const { assn_id, location_name } = req.body;
    const info = db.prepare('UPDATE assignments SET assn_id = ?, location_name = ? WHERE assignment_id = ?').run(
      assn_id ? Number(assn_id) : null,
      location_name.trim(),
      req.params.id
    );
    if (info.changes === 0) return res.status(404).json({ error: 'Assignment not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/assignments/:id', requirePermission('assets_manage'), (req, res) => {
  try {
    const info = db.prepare('DELETE FROM assignments WHERE assignment_id = ?').run(req.params.id);
    if (info.changes === 0) return res.status(404).json({ error: 'Assignment not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Bodycams
app.get('/api/bodycams', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT b.*,
             e.enumber AS assigned_enumber,
             e.badge AS assigned_badge,
             e.first_name || ' ' || e.last_name AS assigned_officer
      FROM bodycams b
      LEFT JOIN employees e ON b.bwc_id = e.bwc_id
      ORDER BY b.bwc_id ASC
    `).all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/bodycams', requirePermission('assets_manage'), (req, res) => {
  try {
    const { bwc_id, Device, Locator, Model, wifi_mac_address } = req.body;
    if (!bwc_id) return res.status(400).json({ error: 'bwc_id is required' });
    db.prepare(`
      INSERT INTO bodycams (bwc_id, Device, Locator, Model, wifi_mac_address)
      VALUES (?, ?, ?, ?, ?)
    `).run(Number(bwc_id), Device || null, Locator || null, Model || null, wifi_mac_address || null);
    res.status(201).json({ success: true, bwc_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/bodycams/:bwc_id', requirePermission('assets_manage'), (req, res) => {
  try {
    const { Device, Locator, Model, wifi_mac_address } = req.body;
    const info = db.prepare(`
      UPDATE bodycams SET Device = ?, Locator = ?, Model = ?, wifi_mac_address = ?
      WHERE bwc_id = ?
    `).run(Device || null, Locator || null, Model || null, wifi_mac_address || null, req.params.bwc_id);
    if (info.changes === 0) return res.status(404).json({ error: 'Bodycam not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/bodycams/:bwc_id', requirePermission('assets_manage'), (req, res) => {
  try {
    const info = db.prepare('DELETE FROM bodycams WHERE bwc_id = ?').run(req.params.bwc_id);
    if (info.changes === 0) return res.status(404).json({ error: 'Bodycam not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Police Vehicles
app.get('/api/vehicles', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT v.*,
             e.enumber AS assigned_enumber,
             e.badge AS assigned_badge,
             e.first_name || ' ' || e.last_name AS assigned_officer
      FROM police_vehicle v
      LEFT JOIN employees e ON v.veh_id = e.veh_id
      ORDER BY v.unit_number ASC
    `).all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/vehicles', requirePermission('assets_manage'), (req, res) => {
  try {
    const { veh_id, unit_number, color, year, make, model, decals, vin, lp_number } = req.body;
    if (!veh_id || !unit_number) return res.status(400).json({ error: 'veh_id and unit_number are required' });
    db.prepare(`
      INSERT INTO police_vehicle (veh_id, unit_number, color, year, make, model, decals, vin, lp_number)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      Number(veh_id),
      Number(unit_number),
      color || null,
      year ? Number(year) : null,
      make || null,
      model || null,
      decals !== undefined ? (decals ? 1 : 0) : 1,
      vin || null,
      lp_number || null
    );
    res.status(201).json({ success: true, veh_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/vehicles/:veh_id', requirePermission('assets_manage'), (req, res) => {
  try {
    const { unit_number, color, year, make, model, decals, vin, lp_number } = req.body;
    const info = db.prepare(`
      UPDATE police_vehicle
      SET unit_number = ?, color = ?, year = ?, make = ?, model = ?, decals = ?, vin = ?, lp_number = ?
      WHERE veh_id = ?
    `).run(
      Number(unit_number),
      color || null,
      year ? Number(year) : null,
      make || null,
      model || null,
      decals ? 1 : 0,
      vin || null,
      lp_number || null,
      req.params.veh_id
    );
    if (info.changes === 0) return res.status(404).json({ error: 'Vehicle not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/vehicles/:veh_id', requirePermission('assets_manage'), (req, res) => {
  try {
    const info = db.prepare('DELETE FROM police_vehicle WHERE veh_id = ?').run(req.params.veh_id);
    if (info.changes === 0) return res.status(404).json({ error: 'Vehicle not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Cell Phones
app.get('/api/cellphones', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT p.*,
             e.enumber AS assigned_enumber,
             e.badge AS assigned_badge,
             e.first_name || ' ' || e.last_name AS assigned_officer
      FROM cell_phones p
      LEFT JOIN employees e ON p.phone_id = e.cellphone_id
      ORDER BY p.phone_id ASC
    `).all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/cellphones', requirePermission('assets_manage'), (req, res) => {
  try {
    const { id_short, phone_num, imei_num, make, model } = req.body;
    if (!phone_num) return res.status(400).json({ error: 'phone_num is required' });
    const info = db.prepare(`
      INSERT INTO cell_phones (id_short, phone_num, imei_num, make, model)
      VALUES (?, ?, ?, ?, ?)
    `).run(id_short ? Number(id_short) : null, phone_num.trim(), imei_num || null, make || null, model || null);
    res.status(201).json({ success: true, phone_id: info.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/cellphones/:phone_id', requirePermission('assets_manage'), (req, res) => {
  try {
    const { id_short, phone_num, imei_num, make, model } = req.body;
    const info = db.prepare(`
      UPDATE cell_phones SET id_short = ?, phone_num = ?, imei_num = ?, make = ?, model = ?
      WHERE phone_id = ?
    `).run(id_short ? Number(id_short) : null, phone_num.trim(), imei_num || null, make || null, model || null, req.params.phone_id);
    if (info.changes === 0) return res.status(404).json({ error: 'Cell phone not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/cellphones/:phone_id', requirePermission('assets_manage'), (req, res) => {
  try {
    const info = db.prepare('DELETE FROM cell_phones WHERE phone_id = ?').run(req.params.phone_id);
    if (info.changes === 0) return res.status(404).json({ error: 'Cell phone not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Shift & Absence Tracker
app.get('/api/absences', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT
        ab.absence_id,
        ab.enumber,
        ab.assignment,
        ab.covering_emp_id,
        ab.date_of_entry,
        ab.notes,
        e.first_name || ' ' || e.last_name AS employee_name,
        e.badge AS employee_badge,
        cov.first_name || ' ' || cov.last_name AS covering_name,
        cov.badge AS covering_badge
      FROM absences ab
      JOIN employees e ON ab.enumber = e.enumber
      LEFT JOIN employees cov ON ab.covering_emp_id = cov.enumber
      ORDER BY ab.date_of_entry DESC
    `).all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/absences', requirePermission('absences_manage'), (req, res) => {
  try {
    const { enumber, assignment, covering_emp_id, date_of_entry, notes } = req.body;
    if (!enumber) return res.status(400).json({ error: 'enumber is required' });

    // Check if officer already has an active absence
    const existing = db.prepare('SELECT absence_id FROM absences WHERE enumber = ?').get(enumber);
    if (existing) {
      return res.status(400).json({ error: 'An active absence is already logged for this officer.' });
    }

    const info = db.prepare(`
      INSERT INTO absences (enumber, assignment, covering_emp_id, date_of_entry, notes)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      Number(enumber),
      assignment || null,
      covering_emp_id ? Number(covering_emp_id) : null,
      date_of_entry || new Date().toISOString().replace('T', ' ').substring(0, 19),
      notes || null
    );

    broadcast({
      type: 'ABSENCE_UPDATED',
      action: 'CREATE',
      absence_id: info.lastInsertRowid,
      enumber
    });

    res.status(201).json({ success: true, absence_id: info.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/absences/:id', requirePermission('absences_manage'), (req, res) => {
  try {
    const info = db.prepare('DELETE FROM absences WHERE absence_id = ?').run(req.params.id);
    if (info.changes === 0) return res.status(404).json({ error: 'Absence record not found' });

    broadcast({ type: 'ABSENCE_UPDATED', action: 'DELETE', absence_id: req.params.id });
    res.json({ success: true, message: 'Absence cleared (Officer returned to active duty)' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 9. Emergency Broadcast System (Real-Time Dispatch)
app.get('/api/alerts', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT * FROM emergency_alerts
      ORDER BY created_at DESC
      LIMIT 100
    `).all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/alerts', requirePermission('dispatch_broadcast'), (req, res) => {
  try {
    const { title, priority, message } = req.body;
    if (!title || !priority || !message) {
      return res.status(400).json({ error: 'title, priority (1, 2, or 3), and message are required' });
    }

    const prioNum = Number(priority);
    if (![1, 2, 3].includes(prioNum)) {
      return res.status(400).json({ error: 'priority must be 1 (Critical), 2 (Urgent), or 3 (Standard)' });
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const info = db.prepare(`
      INSERT INTO emergency_alerts (title, priority, message, created_at)
      VALUES (?, ?, ?, ?)
    `).run(title.trim(), prioNum, message.trim(), now);

    const newAlert = {
      alert_id: info.lastInsertRowid,
      title: title.trim(),
      priority: prioNum,
      message: message.trim(),
      created_at: now
    };

    // Instant WebSocket Broadcast to all connected terminals
    broadcast({
      type: 'EMERGENCY_ALERT_BROADCAST',
      alert: newAlert
    });

    console.log(`[ALERT BROADCAST] Priority ${prioNum}: ${title}`);
    res.status(201).json({ success: true, alert: newAlert });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/alerts/:id', requirePermission('dispatch_broadcast'), (req, res) => {
  try {
    const { title, priority, message } = req.body;
    if (typeof title !== 'string' || !title.trim() || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'title and message are required' });
    }

    const prioNum = Number(priority);
    if (![1, 2, 3].includes(prioNum)) {
      return res.status(400).json({ error: 'priority must be 1 (Critical), 2 (Urgent), or 3 (Standard)' });
    }

    const info = db.prepare(`
      UPDATE emergency_alerts
      SET title = ?, priority = ?, message = ?
      WHERE alert_id = ?
    `).run(title.trim(), prioNum, message.trim(), req.params.id);

    if (info.changes === 0) return res.status(404).json({ error: 'Alert not found' });

    const alert = db.prepare('SELECT * FROM emergency_alerts WHERE alert_id = ?').get(req.params.id);
    broadcast({ type: 'ALERT_HISTORY_UPDATED', action: 'UPDATE', alert });
    res.json({ success: true, alert });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/alerts/:id', requirePermission('dispatch_broadcast'), (req, res) => {
  try {
    const info = db.prepare('DELETE FROM emergency_alerts WHERE alert_id = ?').run(req.params.id);
    if (info.changes === 0) return res.status(404).json({ error: 'Alert not found' });

    broadcast({ type: 'ALERT_HISTORY_UPDATED', action: 'DELETE', alert_id: Number(req.params.id) });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 10. Important Notices
app.get('/api/notices', (req, res) => {
  try {
    const onlyActive = req.query.active === 'true';
    let query = `
      SELECT
        n.*,
        e.first_name || ' ' || e.last_name AS author_name,
        e.badge AS author_badge
      FROM important_notices n
      LEFT JOIN employees e ON n.user_id = e.enumber
    `;

    if (onlyActive) {
      query += ` WHERE datetime('now', 'localtime') BETWEEN datetime(n.datetime_start) AND datetime(n.datetime_end)`;
    }

    query += ` ORDER BY n.datetime_start DESC`;
    const rows = db.prepare(query).all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/notices', requirePermission('notices_manage'), (req, res) => {
  try {
    const { datetime_start, datetime_end, message, user_id } = req.body;
    if (!datetime_start || !datetime_end || !message) {
      return res.status(400).json({ error: 'datetime_start, datetime_end, and message are required' });
    }

    const info = db.prepare(`
      INSERT INTO important_notices (datetime_start, datetime_end, message, user_id)
      VALUES (?, ?, ?, ?)
    `).run(datetime_start, datetime_end, message.trim(), user_id ? Number(user_id) : null);

    broadcast({ type: 'NOTICES_UPDATED' });
    res.status(201).json({ success: true, id: info.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/notices/:id', requirePermission('notices_manage'), (req, res) => {
  try {
    const { datetime_start, datetime_end, message, user_id } = req.body;
    const info = db.prepare(`
      UPDATE important_notices
      SET datetime_start = ?, datetime_end = ?, message = ?, user_id = ?
      WHERE id = ?
    `).run(datetime_start, datetime_end, message.trim(), user_id ? Number(user_id) : null, req.params.id);

    if (info.changes === 0) return res.status(404).json({ error: 'Notice not found' });
    broadcast({ type: 'NOTICES_UPDATED' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/notices/:id', requirePermission('notices_manage'), (req, res) => {
  try {
    const info = db.prepare('DELETE FROM important_notices WHERE id = ?').run(req.params.id);
    if (info.changes === 0) return res.status(404).json({ error: 'Notice not found' });
    broadcast({ type: 'NOTICES_UPDATED' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 11. System Reseed Utility
app.post('/api/reseed', requirePermission('system_reseed'), (req, res) => {
  try {
    seedDatabase();
    broadcast({ type: 'SYSTEM_RESEEDED' });
    res.json({ success: true, message: 'Database reseeded successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

server.listen(PORT, () => {
  console.log(`🚨 Police Department Backend running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket Dispatch Server running on ws://localhost:${PORT}/ws`);
});
