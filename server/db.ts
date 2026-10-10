import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import initSqlJs from 'sql.js';
import bcrypt from 'bcryptjs';
import { config } from './config.js';

export interface DatabaseStatus {
  engine: 'mysql' | 'sqlite';
  connected: boolean;
  host: string;
  database: string;
  error?: string;
  tablesCount: number;
}

let mysqlPool: mysql.Pool | null = null;
let sqliteDb: any = null;
let activeEngine: 'mysql' | 'sqlite' = 'sqlite';
let dbStatus: DatabaseStatus = {
  engine: 'sqlite',
  connected: false,
  host: 'local',
  database: config.db.database,
  tablesCount: 0,
};

// Ensure directories exist
if (!fs.existsSync(config.uploadsDir)) {
  fs.mkdirSync(config.uploadsDir, { recursive: true });
}
if (!fs.existsSync(config.sqliteDataDir)) {
  fs.mkdirSync(config.sqliteDataDir, { recursive: true });
}

function persistSqlite() {
  if (sqliteDb && activeEngine === 'sqlite') {
    try {
      const data = sqliteDb.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(config.sqliteFile, buffer);
    } catch (err) {
      console.error('[DB] Failed to persist SQLite data:', err);
    }
  }
}

export async function initDatabase(): Promise<DatabaseStatus> {
  // If MySQL host is provided in environment variables, prioritize MySQL 8
  if (config.db.host && config.db.user) {
    try {
      console.log(`[DB] Attempting connection to MySQL 8 on ${config.db.host}:${config.db.port}...`);
      mysqlPool = mysql.createPool({
        host: config.db.host,
        port: config.db.port,
        user: config.db.user,
        password: config.db.password,
        database: config.db.database,
        waitForConnections: config.db.waitForConnections,
        connectionLimit: config.db.connectionLimit,
        queueLimit: config.db.queueLimit,
        connectTimeout: config.db.connectTimeout,
      });

      // Test connection
      const connection = await mysqlPool.getConnection();
      await connection.ping();
      connection.release();

      activeEngine = 'mysql';
      dbStatus = {
        engine: 'mysql',
        connected: true,
        host: `${config.db.host}:${config.db.port}`,
        database: config.db.database,
        tablesCount: 5,
      };

      console.log(`[DB] Successfully connected to MySQL 8 (${config.db.database}) at ${config.db.host}`);
      await seedMysqlTables();
      return dbStatus;
    } catch (err: any) {
      console.error(`[DB] MySQL 8 connection failed: ${err.message}`);
      dbStatus.error = `MySQL 8 connection failed: ${err.message}. Defaulting to resilient local SQLite storage.`;
      // Fallback to SQLite engine
      mysqlPool = null;
    }
  }

  // SQLite Engine via sql.js
  try {
    activeEngine = 'sqlite';
    const SQL = await initSqlJs();
    
    if (fs.existsSync(config.sqliteFile)) {
      const fileBuffer = fs.readFileSync(config.sqliteFile);
      sqliteDb = new SQL.Database(fileBuffer);
      console.log(`[DB] Loaded existing SQLite database from ${config.sqliteFile}`);
    } else {
      sqliteDb = new SQL.Database();
      console.log(`[DB] Created fresh SQLite database`);
    }

    await createSqliteSchemaAndSeed();
    persistSqlite();

    dbStatus = {
      engine: 'sqlite',
      connected: true,
      host: 'localhost (embedded)',
      database: config.db.database,
      tablesCount: 5,
      error: dbStatus.error,
    };

    console.log('[DB] Relational database initialized successfully (5 normalized tables ready)');
    return dbStatus;
  } catch (err: any) {
    console.error('[DB] SQLite initialization failed:', err);
    dbStatus = {
      engine: 'sqlite',
      connected: false,
      host: 'none',
      database: config.db.database,
      error: `Database initialization error: ${err.message}`,
      tablesCount: 0,
    };
    return dbStatus;
  }
}

async function seedMysqlTables() {
  if (!mysqlPool) return;
  // Read schema.sql and execute
  try {
    const schemaPath = path.resolve(process.cwd(), 'database', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf-8');
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--') && !s.toLowerCase().startsWith('create database') && !s.toLowerCase().startsWith('use '));
      
      for (const statement of statements) {
        try {
          await mysqlPool.query(statement);
        } catch (e: any) {
          // ignore already exists
        }
      }
    }
    await seedDefaultData();
  } catch (err) {
    console.error('[DB] Error verifying MySQL schema:', err);
  }
}

async function createSqliteSchemaAndSeed() {
  if (!sqliteDb) return;

  sqliteDb.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      mobile TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'citizen',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      code TEXT NOT NULL UNIQUE,
      contact_email TEXT,
      head_officer TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS complaints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      complaint_code TEXT NOT NULL UNIQUE,
      citizen_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT 'Medium',
      address TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      image_url TEXT,
      status TEXT NOT NULL DEFAULT 'Submitted',
      department_id INTEGER,
      assigned_to TEXT,
      resolution_notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (citizen_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS complaint_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      complaint_id INTEGER NOT NULL,
      department_id INTEGER NOT NULL,
      assigned_by INTEGER NOT NULL,
      assigned_officer TEXT NOT NULL,
      notes TEXT,
      assigned_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
      FOREIGN KEY (department_id) REFERENCES departments(id),
      FOREIGN KEY (assigned_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS complaint_status_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      complaint_id INTEGER NOT NULL,
      previous_status TEXT,
      new_status TEXT NOT NULL,
      changed_by INTEGER NOT NULL,
      remarks TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
      FOREIGN KEY (changed_by) REFERENCES users(id)
    );
  `);

  await seedDefaultData();
}

async function seedDefaultData() {
  // Check if users exist
  const existingUsers = await dbQuery<{ count: number }>(`SELECT COUNT(*) as count FROM users`);
  if (existingUsers[0]?.count === 0) {
    console.log('[DB] Seeding initial admin and citizen accounts...');
    const hashedAdminPass = await bcrypt.hash('Admin@2026', 10);
    const hashedCitizenPass = await bcrypt.hash('Citizen@2026', 10);

    await dbExecute(
      `INSERT INTO users (name, email, mobile, password_hash, role) VALUES (?, ?, ?, ?, ?)`,
      ['Civic Central Admin', 'admin@smartcivic.gov.in', '+919876543210', hashedAdminPass, 'admin']
    );

    const citizenResult = await dbExecute(
      `INSERT INTO users (name, email, mobile, password_hash, role) VALUES (?, ?, ?, ?, ?)`,
      ['Rahul Sharma', 'citizen.rahul@smartcivic.gov.in', '+919811223344', hashedCitizenPass, 'citizen']
    );

    // Seed departments
    const departments = [
      ['Public Works Department (PWD)', 'PWD', 'pwd-roads@smartcivic.gov.in', 'Er. Rajesh Varma'],
      ['Solid Waste Management', 'SWM', 'waste-sanitation@smartcivic.gov.in', 'Smt. Sunita Rao'],
      ['Water Supply & Sewerage Board', 'WSSB', 'water-support@smartcivic.gov.in', 'Er. K. Natarajan'],
      ['Stormwater Drainage & Flood Control', 'DRAIN', 'drainage-cell@smartcivic.gov.in', 'Shri A. Sen'],
      ['Electricity & Street Lighting Board', 'ESLB', 'power-lights@smartcivic.gov.in', 'Er. Meenakshi Sundaram'],
      ['Urban Health & Public Sanitation', 'UHPS', 'public-health@smartcivic.gov.in', 'Dr. Arvind Deshmukh']
    ];

    for (const [name, code, email, officer] of departments) {
      await dbExecute(
        `INSERT INTO departments (name, code, contact_email, head_officer) VALUES (?, ?, ?, ?)`,
        [name, code, email, officer]
      );
    }

    // Seed initial complaints
    const citizenId = citizenResult.insertId || 2;
    const c1 = await dbExecute(
      `INSERT INTO complaints (complaint_code, citizen_id, title, description, category, priority, address, latitude, longitude, status, department_id, assigned_to, resolution_notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'SC-2026-00001',
        citizenId,
        'Hazardous deep pothole near Metro Station Gate 3',
        'A 2-foot wide pothole has opened up in the middle lane causing severe traffic slowdown and hazard for two-wheelers.',
        'Road/Pothole',
        'High',
        'MG Road near Metro Pillar 142, Central Zone',
        28.6139391,
        77.2090212,
        'In Progress',
        1,
        'Er. Rajesh Varma',
        'Road asphalt mix repair crew dispatched for hot mix patching.'
      ]
    );

    await dbExecute(
      `INSERT INTO complaint_status_history (complaint_id, previous_status, new_status, changed_by, remarks) VALUES (?, ?, ?, ?, ?)`,
      [c1.insertId || 1, null, 'Submitted', citizenId, 'Complaint registered by citizen with location coordinates.']
    );
    await dbExecute(
      `INSERT INTO complaint_status_history (complaint_id, previous_status, new_status, changed_by, remarks) VALUES (?, ?, ?, ?, ?)`,
      [c1.insertId || 1, 'Submitted', 'Under Review', 1, 'Inspected by central intake officer. High priority road hazard verified.']
    );
    await dbExecute(
      `INSERT INTO complaint_status_history (complaint_id, previous_status, new_status, changed_by, remarks) VALUES (?, ?, ?, ?, ?)`,
      [c1.insertId || 1, 'Under Review', 'In Progress', 1, 'Assigned to Public Works Department road patching brigade.']
    );

    const c2 = await dbExecute(
      `INSERT INTO complaints (complaint_code, citizen_id, title, description, category, priority, address, latitude, longitude, status, department_id, assigned_to, resolution_notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'SC-2026-00002',
        citizenId,
        'Overflowing community garbage dumpster near Market Complex',
        'Garbage bin has not been cleared for 3 consecutive days. Waste is spilling over pedestrian sidewalk causing foul odor.',
        'Garbage',
        'Medium',
        'Sector 14 Main Commercial Complex, Market Gate',
        28.6219000,
        77.2140000,
        'Resolved',
        2,
        'Smt. Sunita Rao',
        'Compactor truck deployed. Area cleared, sanitized with lime powder and geo-tagged inspection complete.'
      ]
    );

    await dbExecute(
      `INSERT INTO complaint_status_history (complaint_id, previous_status, new_status, changed_by, remarks) VALUES (?, ?, ?, ?, ?)`,
      [c2.insertId || 2, null, 'Submitted', citizenId, 'Initial complaint registered by citizen.']
    );
    await dbExecute(
      `INSERT INTO complaint_status_history (complaint_id, previous_status, new_status, changed_by, remarks) VALUES (?, ?, ?, ?, ?)`,
      [c2.insertId || 2, 'Submitted', 'Assigned', 1, 'Routed to Solid Waste Management zonal supervisor.']
    );
    await dbExecute(
      `INSERT INTO complaint_status_history (complaint_id, previous_status, new_status, changed_by, remarks) VALUES (?, ?, ?, ?, ?)`,
      [c2.insertId || 2, 'Assigned', 'Resolved', 1, 'Zonal truck cleared waste at 08:30 AM. Bleaching powder spread.']
    );

    const c3 = await dbExecute(
      `INSERT INTO complaints (complaint_code, citizen_id, title, description, category, priority, address, latitude, longitude, status, department_id, assigned_to, resolution_notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'SC-2026-00003',
        citizenId,
        'Broken water pipeline causing continuous clean water flooding',
        'Underground mainline burst is leaking thousands of liters of clean municipal drinking water onto the street.',
        'Water Supply',
        'Emergency',
        '7th Cross Road, Indira Nagar Colony',
        28.6289000,
        77.2050000,
        'Assigned',
        3,
        'Er. K. Natarajan',
        null
      ]
    );

    await dbExecute(
      `INSERT INTO complaint_status_history (complaint_id, previous_status, new_status, changed_by, remarks) VALUES (?, ?, ?, ?, ?)`,
      [c3.insertId || 3, null, 'Submitted', citizenId, 'High emergency pipeline leakage logged.']
    );
    await dbExecute(
      `INSERT INTO complaint_status_history (complaint_id, previous_status, new_status, changed_by, remarks) VALUES (?, ?, ?, ?, ?)`,
      [c3.insertId || 3, 'Submitted', 'Assigned', 1, 'Assigned to Water Supply zonal engineer for immediate main valve shutoff.']
    );

    persistSqlite();
    console.log('[DB] Default seed data committed successfully.');
  }
}

// Unified query helper
export async function dbQuery<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  if (activeEngine === 'mysql' && mysqlPool) {
    const [rows] = await mysqlPool.query(sql, params);
    return rows as T[];
  }

  if (activeEngine === 'sqlite' && sqliteDb) {
    try {
      const stmt = sqliteDb.prepare(sql);
      if (params && params.length > 0) {
        stmt.bind(params);
      }
      const results: T[] = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject() as unknown as T);
      }
      stmt.free();
      return results;
    } catch (err: any) {
      console.error('[DB Query Error]', err.message, 'SQL:', sql);
      throw err;
    }
  }

  throw new Error('No active database connection available.');
}

// Unified execute helper (INSERT, UPDATE, DELETE)
export async function dbExecute(sql: string, params: any[] = []): Promise<{ insertId: number; affectedRows: number }> {
  if (activeEngine === 'mysql' && mysqlPool) {
    const [result] = await mysqlPool.execute(sql, params);
    const r = result as mysql.ResultSetHeader;
    return {
      insertId: r.insertId,
      affectedRows: r.affectedRows,
    };
  }

  if (activeEngine === 'sqlite' && sqliteDb) {
    try {
      sqliteDb.run(sql, params);
      const res = sqliteDb.exec("SELECT last_insert_rowid() AS lastId, changes() AS affectedRows;");
      let insertId = 0;
      let affectedRows = 0;
      if (res && res[0] && res[0].values && res[0].values[0]) {
        insertId = Number(res[0].values[0][0]);
        affectedRows = Number(res[0].values[0][1]);
      }
      persistSqlite();
      return { insertId, affectedRows };
    } catch (err: any) {
      console.error('[DB Execute Error]', err.message, 'SQL:', sql);
      throw err;
    }
  }

  throw new Error('No active database connection available.');
}

export function getDatabaseStatus(): DatabaseStatus {
  return dbStatus;
}
