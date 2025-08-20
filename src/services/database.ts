/**
 * Database Service - SQLite Implementation
 * Handles all database operations for CableForge
 */

import initSqlJs, { Database } from 'sql.js';
import { Cable, CableFunction, Project } from '../types';

export class DatabaseService {
  private db: Database | null = null;
  private SQL: any = null;

  async initialize(): Promise<void> {
    // Initialize sql.js
    this.SQL = await initSqlJs({
      // Use local file in tests, CDN in production
      locateFile: (file: string) => {
        if (process.env.NODE_ENV === 'test') {
          return require.resolve('sql.js/dist/' + file);
        }
        return `https://sql.js.org/dist/${file}`;
      }
    });

    // Create new database
    this.db = new this.SQL.Database();

    // Create schema
    await this.createSchema();
    await this.createDefaultProject();
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  private async createSchema(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Projects table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        major_revision TEXT DEFAULT 'Draft',
        minor_revision INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Revisions table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS revisions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        major_revision TEXT NOT NULL,
        minor_revision INTEGER NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects (id)
      )
    `);

    // Cables table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS cables (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL DEFAULT 1,
        revision_id INTEGER NOT NULL DEFAULT 1,
        tag TEXT NOT NULL,
        description TEXT,
        function TEXT,
        voltage REAL,
        size TEXT,
        cores INTEGER,
        from_equipment TEXT,
        to_equipment TEXT,
        length REAL,
        spare_percentage REAL,
        route TEXT,
        voltage_drop_percentage REAL,
        segregation_warning BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects (id),
        FOREIGN KEY (revision_id) REFERENCES revisions (id),
        UNIQUE(project_id, tag)
      )
    `);

    // I/O Points table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS io_points (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL DEFAULT 1,
        revision_id INTEGER NOT NULL DEFAULT 1,
        tag TEXT NOT NULL,
        description TEXT,
        type TEXT,
        plc_name TEXT,
        slot_number INTEGER,
        channel_number INTEGER,
        signal_type TEXT,
        engineering_units TEXT,
        range_min REAL,
        range_max REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects (id),
        FOREIGN KEY (revision_id) REFERENCES revisions (id),
        UNIQUE(project_id, tag)
      )
    `);

    // Conduits table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS conduits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL DEFAULT 1,
        tag TEXT NOT NULL,
        description TEXT,
        size REAL,
        type TEXT,
        fill_percentage REAL DEFAULT 0,
        max_fill_percentage REAL DEFAULT 40,
        from_location TEXT,
        to_location TEXT,
        length REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects (id),
        UNIQUE(project_id, tag)
      )
    `);

    // Loads table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS loads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL DEFAULT 1,
        tag TEXT NOT NULL,
        description TEXT,
        type TEXT,
        power_rating REAL,
        voltage REAL,
        current REAL,
        power_factor REAL,
        efficiency REAL,
        location TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects (id),
        UNIQUE(project_id, tag)
      )
    `);
  }

  private async createDefaultProject(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      INSERT INTO projects (name, description)
      VALUES (?, ?)
    `);
    
    stmt.run(['New CableForge Project', 'Created with CableForge']);
    stmt.free();

    // Create default revision
    const revStmt = this.db.prepare(`
      INSERT INTO revisions (project_id, major_revision, minor_revision, description)
      VALUES (1, 'Draft', 0, 'Initial revision')
    `);
    revStmt.run();
    revStmt.free();
  }

  async getTables(): Promise<string[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = this.db.exec(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `);

    if (result.length === 0) return [];
    return result[0].values.flat() as string[];
  }

  async getProjects(): Promise<Project[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = this.db.exec(`
      SELECT id, name, description, major_revision, minor_revision, 
             created_at, updated_at
      FROM projects
      ORDER BY created_at DESC
    `);

    if (result.length === 0) return [];

    return result[0].values.map(row => ({
      id: row[0] as number,
      name: row[1] as string,
      description: row[2] as string,
      majorRevision: row[3] as string,
      minorRevision: row[4] as number,
      createdAt: new Date(row[5] as string),
      updatedAt: new Date(row[6] as string)
    }));
  }

  async createCable(cableData: Partial<Cable>): Promise<Cable> {
    if (!this.db) throw new Error('Database not initialized');

    // Validation
    if (!cableData.tag || cableData.tag.trim() === '') {
      throw new Error('Cable tag is required');
    }

    // Check for duplicate tags
    const existingCable = this.db.exec(`
      SELECT id FROM cables WHERE tag = ? AND project_id = 1
    `, [cableData.tag]);

    if (existingCable.length > 0 && existingCable[0].values.length > 0) {
      throw new Error('Cable tag must be unique');
    }

    const now = new Date().toISOString();
    
    // Use simpler insert approach to avoid parameter binding issues
    const insertSql = `
      INSERT INTO cables (
        tag, description, function, voltage, size, cores,
        from_equipment, to_equipment, length, spare_percentage,
        route, voltage_drop_percentage, segregation_warning,
        created_at, updated_at
      ) VALUES (
        '${cableData.tag}',
        ${cableData.description ? `'${cableData.description.replace(/'/g, "''")}'` : 'NULL'},
        ${cableData.function ? `'${cableData.function}'` : 'NULL'},
        ${cableData.voltage ?? 'NULL'},
        ${cableData.size ? `'${cableData.size.replace(/'/g, "''")}'` : 'NULL'},
        ${cableData.cores ?? 'NULL'},
        ${cableData.fromEquipment ? `'${cableData.fromEquipment.replace(/'/g, "''")}'` : 'NULL'},
        ${cableData.toEquipment ? `'${cableData.toEquipment.replace(/'/g, "''")}'` : 'NULL'},
        ${cableData.length ?? 'NULL'},
        ${cableData.sparePercentage ?? 'NULL'},
        ${cableData.route ? `'${cableData.route.replace(/'/g, "''")}'` : 'NULL'},
        ${cableData.voltageDropPercentage ?? 'NULL'},
        ${(cableData.segregationWarning ?? false) ? 1 : 0},
        '${now}',
        '${now}'
      )
    `;
    
    const result = this.db.exec(insertSql);
    
    // Get the last inserted row ID
    const lastIdResult = this.db.exec('SELECT last_insert_rowid() as id');
    const insertedId = lastIdResult[0].values[0][0] as number;

    // Return the created cable
    return this.getCableById(insertedId);
  }

  async getCables(): Promise<Cable[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = this.db.exec(`
      SELECT id, tag, description, function, voltage, size, cores,
             from_equipment, to_equipment, length, spare_percentage,
             route, voltage_drop_percentage, segregation_warning,
             created_at, updated_at, revision_id
      FROM cables
      WHERE project_id = 1
      ORDER BY tag
    `);

    if (result.length === 0) return [];

    return result[0].values.map(row => ({
      id: row[0] as number,
      tag: row[1] as string,
      description: row[2] as string || undefined,
      function: row[3] as CableFunction || undefined,
      voltage: row[4] as number || undefined,
      size: row[5] as string || undefined,
      cores: row[6] as number || undefined,
      fromEquipment: row[7] as string || undefined,
      toEquipment: row[8] as string || undefined,
      length: row[9] as number || undefined,
      sparePercentage: row[10] as number || undefined,
      route: row[11] as string || undefined,
      voltageDropPercentage: row[12] as number || undefined,
      segregationWarning: Boolean(row[13] as number),
      createdAt: new Date(row[14] as string),
      updatedAt: new Date(row[15] as string),
      revisionId: row[16] as number
    }));
  }

  private async getCableById(id: number): Promise<Cable> {
    if (!this.db) throw new Error('Database not initialized');

    const result = this.db.exec(`
      SELECT id, tag, description, function, voltage, size, cores,
             from_equipment, to_equipment, length, spare_percentage,
             route, voltage_drop_percentage, segregation_warning,
             created_at, updated_at, revision_id
      FROM cables
      WHERE id = ?
    `, [id]);

    if (result.length === 0 || result[0].values.length === 0) {
      throw new Error('Cable not found');
    }

    const row = result[0].values[0];
    return {
      id: row[0] as number,
      tag: row[1] as string,
      description: row[2] as string || undefined,
      function: row[3] as CableFunction || undefined,
      voltage: row[4] as number || undefined,
      size: row[5] as string || undefined,
      cores: row[6] as number || undefined,
      fromEquipment: row[7] as string || undefined,
      toEquipment: row[8] as string || undefined,
      length: row[9] as number || undefined,
      sparePercentage: row[10] as number || undefined,
      route: row[11] as string || undefined,
      voltageDropPercentage: row[12] as number || undefined,
      segregationWarning: Boolean(row[13] as number),
      createdAt: new Date(row[14] as string),
      updatedAt: new Date(row[15] as string),
      revisionId: row[16] as number
    };
  }

  async updateCable(id: number, updates: Partial<Cable>): Promise<Cable> {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      UPDATE cables 
      SET description = ?, function = ?, voltage = ?, size = ?, cores = ?,
          from_equipment = ?, to_equipment = ?, length = ?, spare_percentage = ?,
          route = ?, voltage_drop_percentage = ?, segregation_warning = ?,
          updated_at = ?
      WHERE id = ?
    `);

    // Get current cable to merge with updates
    const currentCable = await this.getCableById(id);

    stmt.run([
      updates.description !== undefined ? (updates.description ?? null) : (currentCable.description ?? null),
      updates.function !== undefined ? (updates.function ?? null) : (currentCable.function ?? null),
      updates.voltage !== undefined ? (updates.voltage ?? null) : (currentCable.voltage ?? null),
      updates.size !== undefined ? (updates.size ?? null) : (currentCable.size ?? null),
      updates.cores !== undefined ? (updates.cores ?? null) : (currentCable.cores ?? null),
      updates.fromEquipment !== undefined ? (updates.fromEquipment ?? null) : (currentCable.fromEquipment ?? null),
      updates.toEquipment !== undefined ? (updates.toEquipment ?? null) : (currentCable.toEquipment ?? null),
      updates.length !== undefined ? (updates.length ?? null) : (currentCable.length ?? null),
      updates.sparePercentage !== undefined ? (updates.sparePercentage ?? null) : (currentCable.sparePercentage ?? null),
      updates.route !== undefined ? (updates.route ?? null) : (currentCable.route ?? null),
      updates.voltageDropPercentage !== undefined ? (updates.voltageDropPercentage ?? null) : (currentCable.voltageDropPercentage ?? null),
      updates.segregationWarning !== undefined ? (updates.segregationWarning ? 1 : 0) : (currentCable.segregationWarning ? 1 : 0),
      now,
      id
    ]);

    stmt.free();

    return this.getCableById(id);
  }

  async deleteCable(id: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare('DELETE FROM cables WHERE id = ?');
    stmt.run([id]);
    stmt.free();
  }

  async getNextCableTag(prefix: string = 'C'): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const result = this.db.exec(`
      SELECT tag FROM cables 
      WHERE tag LIKE ? AND project_id = 1
      ORDER BY tag DESC
      LIMIT 1
    `, [`${prefix}-%`]);

    if (result.length === 0 || result[0].values.length === 0) {
      return `${prefix}-001`;
    }

    const lastTag = result[0].values[0][0] as string;
    const numberPart = lastTag.split('-')[1];
    const nextNumber = parseInt(numberPart) + 1;
    
    return `${prefix}-${nextNumber.toString().padStart(3, '0')}`;
  }

  async exportProject(): Promise<Uint8Array> {
    if (!this.db) throw new Error('Database not initialized');
    
    return this.db.export();
  }

  async importProject(data: Uint8Array): Promise<void> {
    try {
      // Close current database
      if (this.db) {
        this.db.close();
      }

      // Load database from binary data
      this.db = new this.SQL.Database(data);
      
      // Verify it's a valid CableForge database by checking for required tables
      const tables = await this.getTables();
      const requiredTables = ['projects', 'cables', 'io_points', 'conduits', 'loads', 'revisions'];
      
      for (const table of requiredTables) {
        if (!tables.includes(table)) {
          throw new Error('Invalid project file format');
        }
      }
    } catch (error) {
      throw new Error('Invalid project file format');
    }
  }
}