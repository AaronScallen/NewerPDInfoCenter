import bcrypt from 'bcryptjs';
import db, { initSchema } from './db.js';

// Synchronous hash is fine for one-off seed script runs.
const hashPassword = (plain) => bcrypt.hashSync(plain, 10);

export function seedDatabase() {
  initSchema();

  // Disable FKs temporarily during clean wipe to avoid cycle issues on re-seeding
  db.pragma('foreign_keys = OFF');

  const wipe = db.transaction(() => {
    db.prepare('DELETE FROM users').run();
    db.prepare('DELETE FROM roles').run();
    db.prepare('DELETE FROM important_notices').run();
    db.prepare('DELETE FROM emergency_alerts').run();
    db.prepare('DELETE FROM absences').run();
    db.prepare('DELETE FROM employees').run();
    db.prepare('DELETE FROM cell_phones').run();
    db.prepare('DELETE FROM police_vehicle').run();
    db.prepare('DELETE FROM bodycams').run();
    db.prepare('DELETE FROM assignments').run();
  });
  wipe();

  db.pragma('foreign_keys = ON');

  const insertRole = db.prepare(`
    INSERT INTO roles (role_id, name, description, is_system, permissions)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertUser = db.prepare(`
    INSERT INTO users (username, password_hash, display_name, badge, role_id, is_super_admin)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertAssignment = db.prepare(`
    INSERT INTO assignments (assignment_id, assn_id, location_name)
    VALUES (?, ?, ?)
  `);

  const insertBWC = db.prepare(`
    INSERT INTO bodycams (bwc_id, Device, Locator, Model, wifi_mac_address)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertVehicle = db.prepare(`
    INSERT INTO police_vehicle (veh_id, unit_number, color, year, make, model, decals, vin, lp_number)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertCellPhone = db.prepare(`
    INSERT INTO cell_phones (phone_id, id_short, phone_num, imei_num, make, model)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertEmployee = db.prepare(`
    INSERT INTO employees (enumber, badge, positionNumber, pid, dob, last_name, first_name, assignment_id, bwc_id, veh_id, cellphone_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertAbsence = db.prepare(`
    INSERT INTO absences (enumber, assignment, covering_emp_id, date_of_entry, notes)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertAlert = db.prepare(`
    INSERT INTO emergency_alerts (title, priority, message, created_at)
    VALUES (?, ?, ?, ?)
  `);

  const insertNotice = db.prepare(`
    INSERT INTO important_notices (datetime_start, datetime_end, message, user_id)
    VALUES (?, ?, ?, ?)
  `);

  const seedAll = db.transaction(() => {
    // 1. Assignments
    const assignmentsData = [
      [1, 101, 'Sector 1 - Downtown Central Patrol'],
      [2, 102, 'Sector 2 - North River Precinct'],
      [3, 103, 'Sector 3 - Industrial Corridor & Harbor'],
      [4, 201, 'Traffic Enforcement & Highway Interdiction'],
      [5, 301, 'Criminal Investigation Division (Major Crimes)'],
      [6, 401, 'Special Operations & Tactical Response (SWAT)'],
      [7, 501, 'K-9 Interdiction & Search Unit'],
      [8, 601, 'Communications & 911 Dispatch Operations']
    ];
    for (const a of assignmentsData) insertAssignment.run(...a);

    // 2. Bodycams (including 17916)
    const bwcData = [
      [17916, 'BWC-ALPHA-01', 'Dock Bay 4 - East Wing', 'Coreforce Body 3', '00:1A:79:B4:17:91'],
      [17917, 'BWC-ALPHA-02', 'Dock Bay 4 - East Wing', 'Coreforce Body 3', '00:1A:79:B4:17:92'],
      [17918, 'BWC-ALPHA-03', 'Dock Bay 5 - East Wing', 'Coreforce Body 4', '00:1A:79:C8:22:11'],
      [17919, 'BWC-ALPHA-04', 'Dock Bay 5 - East Wing', 'Coreforce Body 4', '00:1A:79:C8:22:12'],
      [18001, 'BWC-BRAVO-01', 'Dock Bay 1 - North Wing', 'Coreforce Body 3', '00:1A:79:B4:33:01'],
      [18002, 'BWC-BRAVO-02', 'Dock Bay 1 - North Wing', 'Coreforce Body 3', '00:1A:79:B4:33:02'],
      [18003, 'BWC-K9-01', 'K-9 Operations Lockbox', 'Coreforce Body 4', '00:1A:79:C8:44:99'],
      [18004, 'BWC-SWAT-01', 'Armory Tactical Locker A', 'Coreforce Body 4', '00:1A:79:C8:55:01'],
      [18005, 'BWC-SWAT-02', 'Armory Tactical Locker B', 'Coreforce Body 4', '00:1A:79:C8:55:02'],
      [18006, 'BWC-RESERVE-01', 'Equipment Room Shelf 3', 'Coreforce Body 3', '00:1A:79:B4:88:10']
    ];
    for (const b of bwcData) insertBWC.run(...b);

    // 3. Police Vehicles (including unit 805009)
    const vehicleData = [
      [805009, 805009, 'Black & White', 2024, 'Ford', 'Police Interceptor Utility AWD', 1, '1FAHP2MK8R1805009', 'PD-80509'],
      [805010, 805010, 'Black & White', 2023, 'Ford', 'Police Interceptor Utility AWD', 1, '1FAHP2MK7P1805010', 'PD-80510'],
      [805011, 805011, 'All-Black Tactical', 2024, 'Chevrolet', 'Tahoe PPV 4WD', 1, '1GNSKCKD4R1805011', 'PD-80511'],
      [805012, 805012, 'Silver Unmarked', 2023, 'Dodge', 'Charger Pursuit V8', 0, '2C3CDXAT5P1805012', 'UNM-4402'],
      [805013, 805013, 'Black & White', 2022, 'Ford', 'F-150 Police Responder', 1, '1FTFW1E84N1805013', 'PD-80513'],
      [805014, 805014, 'Midnight Blue', 2024, 'Ford', 'Explorer Interceptor', 1, '1FAHP2MK9R1805014', 'PD-80514'],
      [805015, 805015, 'Matte Gray Armor', 2023, 'Lenco', 'BearCat G3 Armored', 1, '4V4NC9EJ8N1805015', 'TAC-01'],
      [805016, 805016, 'White Fleet', 2021, 'Ford', 'Transit Prisoner Transport', 1, '1FTNE3Y89M1805016', 'VAN-03']
    ];
    for (const v of vehicleData) insertVehicle.run(...v);

    // 4. Cell Phones
    const cellPhonesData = [
      [1, 101, '555-014-4020', '354892091240201', 'Samsung', 'Galaxy XCover6 Pro Tactical'],
      [2, 102, '555-014-4031', '354892091240202', 'Samsung', 'Galaxy XCover6 Pro Tactical'],
      [3, 103, '555-014-4045', '354892091240203', 'Apple', 'iPhone 15 Pro Enterprise'],
      [4, 104, '555-014-4088', '354892091240204', 'Sonim', 'XP8 Ultra-Rugged PTT'],
      [5, 105, '555-014-4099', '354892091240205', 'Apple', 'iPhone 15 Pro Enterprise'],
      [6, 106, '555-014-4110', '354892091240206', 'Samsung', 'Galaxy S24 FirstNet Edition'],
      [7, 107, '555-014-4122', '354892091240207', 'Samsung', 'Galaxy S24 FirstNet Edition'],
      [8, 108, '555-014-4135', '354892091240208', 'Sonim', 'XP10 Mission Critical']
    ];
    for (const c of cellPhonesData) insertCellPhone.run(...c);

    // 5. Employees (including Badge 402, BWC 17916, Vehicle 805009)
    const employeesData = [
      [
        1001, 402, 900402, 18402, '1988-04-12', 'Miller', 'Marcus',
        1, 17916, 805009, 1
      ],
      [
        1002, 403, 900403, 18403, '1992-09-24', 'Vance', 'Sarah',
        1, 17917, 805010, 2
      ],
      [
        1003, 215, 900215, 18215, '1981-01-15', 'Ramirez', 'Carlos',
        4, 17918, 805012, 3
      ],
      [
        1004, 512, 900512, 18512, '1990-11-03', 'O\'Connor', 'Devon',
        7, 18003, 805013, 4
      ],
      [
        1005, 108, 900108, 18108, '1979-06-30', 'Blackwood', 'Elena',
        5, 17919, null, 5
      ],
      [
        1006, 601, 900601, 18601, '1985-08-19', 'Kowalski', 'David',
        6, 18004, 805015, 6
      ],
      [
        1007, 409, 900409, 18409, '1995-02-14', 'Chen', 'Maya',
        2, 18001, 805014, 7
      ],
      [
        1008, 410, 900410, 18410, '1993-07-22', 'Sterling', 'James',
        3, 18002, 805016, 8
      ],
      [
        1009, 101, 900101, 18101, '1974-12-05', 'Hawthorne', 'Arthur',
        8, null, null, null
      ]
    ];
    for (const e of employeesData) insertEmployee.run(...e);

    // 6. Absences & Coverage
    const absencesData = [
      [1007, 'Sector 2 - North River Precinct', 1002, '2026-09-08 07:00:00', 'Medical Leave (Post-Shift Injury) - Officer Vance providing Sector 2 overlap coverage'],
      [1003, 'Traffic Enforcement & Highway Interdiction', 1008, '2026-09-08 06:30:00', 'Mandatory Superior Court Subpoena appearance - Officer Sterling covering radar station']
    ];
    for (const ab of absencesData) insertAbsence.run(...ab);

    // 7. Emergency Alerts
    const alertsData = [
      [
        'CODE 3 - OFFICER IN DISTRESS (10-99)',
        1,
        'Officer reporting foot pursuit of armed suspect heading westbound into Sector 3 Industrial Rail Yard. All available units switch to TACTICAL CHANNEL 1 immediately.',
        '2026-09-08 15:45:10'
      ],
      [
        'URGENT BOLO - ARMED ROBBERY VEHICLE',
        2,
        'Dark gray Dodge Charger, missing rear plate, dark tinted windows, last seen exiting I-95 onto Route 4 North. Armed and dangerous suspects.',
        '2026-09-08 14:15:00'
      ],
      [
        'WEATHER WARNING - FLASH FLOOD ADVISORY',
        3,
        'Lower Harbor bypass road flooded under viaduct. Patrol units divert traffic to Summit Blvd.',
        '2026-09-08 11:20:00'
      ]
    ];
    for (const al of alertsData) insertAlert.run(...al);

    // 8. Important Notices (Active spanning current time 2026-09-08)
    const noticesData = [
      [
        '2026-09-01 00:00:00',
        '2026-09-30 23:59:59',
        'CRITICAL: All body-worn cameras must be docked by shift end for firmware update v4.12.0 patch sync.',
        1001
      ],
      [
        '2026-09-08 06:00:00',
        '2026-09-09 18:00:00',
        'TACTICAL NOTICE: Downtown Civic Parade security perimeter established tomorrow 07:00 hours. Sector 1 briefing at 06:15.',
        1009
      ],
      [
        '2026-09-05 08:00:00',
        '2026-09-15 20:00:00',
        'RADIO MAINTENANCE: Primary repeater tower undergoing maintenance between 02:00 and 04:00 daily. Use secondary channel.',
        1005
      ]
    ];
    for (const n of noticesData) insertNotice.run(...n);

    // 9. RBAC Roles
    const allPermissions = [
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

    const rolesData = [
      [
        'super_admin',
        'Super Administrator',
        'Lead System Engineer with absolute system authority and exclusive Command role assignment privileges.',
        1,
        JSON.stringify(allPermissions)
      ],
      [
        'command',
        'Command Staff',
        'Executive Leadership (Chief of Police, Captains). Full operational command & role permission delegation.',
        1,
        JSON.stringify(allPermissions)
      ],
      [
        'supervisor',
        'Shift Supervisor (Sergeant)',
        'Shift leadership with personnel management, dispatch broadcasts, absence logging, and notice creation.',
        1,
        JSON.stringify([
          'dashboard_view',
          'dispatch_broadcast',
          'alert_ack',
          'alert_history_view',
          'roster_view',
          'roster_manage',
          'absences_view',
          'absences_manage',
          'assets_view',
          'notices_view',
          'notices_manage'
        ])
      ],
      [
        'dispatcher',
        'Communications & Dispatcher',
        '911 Communications clearance. Priority alert broadcast, notice creation, and shift coverage tracking.',
        1,
        JSON.stringify([
          'dashboard_view',
          'dispatch_broadcast',
          'alert_ack',
          'alert_history_view',
          'roster_view',
          'absences_view',
          'absences_manage',
          'notices_view',
          'notices_manage'
        ])
      ],
      [
        'viewer',
        'Viewer',
        'Read-only clearance with visibility into department telemetry and records but no ability to modify data.',
        1,
        JSON.stringify([
          'dashboard_view',
          'alert_history_view',
          'roster_view',
          'absences_view',
          'assets_view',
          'notices_view'
        ])
      ]
    ];
    for (const r of rolesData) insertRole.run(...r);

    // 10. Users & Initial Role Assignments
    const usersData = [
      ['engineer', hashPassword('admin123'), 'System Engineer (Lead Dev)', null, 'super_admin', 1],
      ['chief_hawthorne', hashPassword('chief123'), 'Chief Arthur Hawthorne', 101, 'command', 0],
      ['commander_miller', hashPassword('miller123'), 'Capt. Marcus Miller', 402, 'command', 0],
      ['sgt_vance', hashPassword('vance123'), 'Sgt. Sarah Vance', 403, 'supervisor', 0],
      ['officer_ramirez', hashPassword('ramirez123'), 'Ofc. Carlos Ramirez', 215, 'viewer', 0],
      ['dispatcher_chen', hashPassword('chen123'), 'Disp. Maya Chen', 409, 'dispatcher', 0],
      ['cadet_oconnor', hashPassword('oconnor123'), 'Cadet Devon O\'Connor', 512, 'viewer', 0]
    ];
    for (const u of usersData) insertUser.run(...u);
  });

  seedAll();
  console.log('✅ Database seeded successfully with realistic law enforcement records.');
}

if (process.argv[1] && (process.argv[1].endsWith('seed.js') || process.argv[1].includes('seed.js'))) {
  seedDatabase();
}
