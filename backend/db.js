import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, 'police_dept.db');
const db = new Database(dbPath, {
  // verbose: console.log
});

// Enable foreign key constraints
db.pragma('foreign_keys = ON');

export function initSchema() {
  db.exec(`
    -- 1. assignments
    CREATE TABLE IF NOT EXISTS assignments (
      assignment_id INTEGER PRIMARY KEY AUTOINCREMENT,
      assn_id INTEGER,
      location_name TEXT NOT NULL
    );

    -- 2. bodycams
    CREATE TABLE IF NOT EXISTS bodycams (
      bwc_id INTEGER PRIMARY KEY,
      Device TEXT,
      Locator TEXT,
      Model TEXT,
      wifi_mac_address TEXT
    );

    -- 3. police_vehicle
    CREATE TABLE IF NOT EXISTS police_vehicle (
      veh_id INTEGER PRIMARY KEY,
      unit_number INTEGER NOT NULL,
      color TEXT,
      year INTEGER,
      make TEXT,
      model TEXT,
      decals BOOLEAN DEFAULT 1,
      vin TEXT,
      lp_number TEXT
    );

    -- 4. cell_phones
    CREATE TABLE IF NOT EXISTS cell_phones (
      phone_id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_short INTEGER,
      phone_num TEXT NOT NULL,
      imei_num TEXT,
      make TEXT,
      model TEXT
    );

    -- 5. employees
    CREATE TABLE IF NOT EXISTS employees (
      enumber INTEGER PRIMARY KEY,
      badge INTEGER UNIQUE,
      positionNumber INTEGER UNIQUE,
      pid INTEGER UNIQUE,
      dob DATE,
      last_name TEXT NOT NULL,
      first_name TEXT NOT NULL,
      assignment_id INTEGER,
      bwc_id INTEGER,
      veh_id INTEGER,
      cellphone_id INTEGER,
      FOREIGN KEY (assignment_id) REFERENCES assignments (assignment_id) ON DELETE SET NULL,
      FOREIGN KEY (bwc_id) REFERENCES bodycams (bwc_id) ON DELETE SET NULL,
      FOREIGN KEY (veh_id) REFERENCES police_vehicle (veh_id) ON DELETE SET NULL,
      FOREIGN KEY (cellphone_id) REFERENCES cell_phones (phone_id) ON DELETE SET NULL
    );

    -- 6. absences
    CREATE TABLE IF NOT EXISTS absences (
      absence_id INTEGER PRIMARY KEY AUTOINCREMENT,
      enumber INTEGER NOT NULL,
      assignment TEXT,
      covering_emp_id INTEGER,
      date_of_entry DATETIME DEFAULT CURRENT_TIMESTAMP,
      notes TEXT,
      FOREIGN KEY (enumber) REFERENCES employees (enumber) ON DELETE CASCADE,
      FOREIGN KEY (covering_emp_id) REFERENCES employees (enumber) ON DELETE SET NULL
    );

    -- 7. emergency_alerts
    CREATE TABLE IF NOT EXISTS emergency_alerts (
      alert_id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      priority INTEGER NOT NULL CHECK(priority IN (1, 2, 3)),
      message TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 8. important_notices
    CREATE TABLE IF NOT EXISTS important_notices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      datetime_start DATETIME NOT NULL,
      datetime_end DATETIME NOT NULL,
      message TEXT NOT NULL,
      user_id INTEGER,
      FOREIGN KEY (user_id) REFERENCES employees (enumber) ON DELETE SET NULL
    );

    -- 9. RBAC: roles
    CREATE TABLE IF NOT EXISTS roles (
      role_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      is_system BOOLEAN DEFAULT 0,
      permissions TEXT NOT NULL DEFAULT '[]'
    );

    -- 10. RBAC: users
    CREATE TABLE IF NOT EXISTS users (
      user_id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      display_name TEXT NOT NULL,
      badge INTEGER,
      role_id TEXT NOT NULL,
      is_super_admin BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (role_id) REFERENCES roles (role_id) ON DELETE RESTRICT,
      FOREIGN KEY (badge) REFERENCES employees (badge) ON DELETE SET NULL
    );

    -- Indexes for performance and query optimization
    CREATE INDEX IF NOT EXISTS idx_emp_assignment ON employees (assignment_id);
    CREATE INDEX IF NOT EXISTS idx_emp_bwc ON employees (bwc_id);
    CREATE INDEX IF NOT EXISTS idx_emp_veh ON employees (veh_id);
    CREATE INDEX IF NOT EXISTS idx_emp_phone ON employees (cellphone_id);
    CREATE INDEX IF NOT EXISTS idx_absences_emp ON absences (enumber);
    CREATE INDEX IF NOT EXISTS idx_alerts_created ON emergency_alerts (created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_notices_dates ON important_notices (datetime_start, datetime_end);
    CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users (role_id);
  `);

  console.log('✅ SQLite Schema initialized with strict foreign keys & RBAC tables.');
}

export default db;
