use rusqlite::{Connection, Result};
use std::path::Path;

pub mod models;
pub mod commands;

pub struct Database {
    connection: Connection,
}

impl Database {
    pub fn new(db_path: &Path) -> Result<Self> {
        let connection = Connection::open(db_path)?;
        let db = Database { connection };
        db.create_tables()?;
        Ok(db)
    }

    pub fn in_memory() -> Result<Self> {
        let connection = Connection::open_in_memory()?;
        let db = Database { connection };
        db.create_tables()?;
        Ok(db)
    }

    fn create_tables(&self) -> Result<()> {
        // Projects table
        self.connection.execute(
            "CREATE TABLE IF NOT EXISTS projects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                client TEXT,
                engineer TEXT,
                major_revision TEXT NOT NULL DEFAULT 'Draft',
                minor_revision INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )",
            [],
        )?;

        // Revisions table
        self.connection.execute(
            "CREATE TABLE IF NOT EXISTS revisions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id INTEGER NOT NULL,
                major_revision TEXT NOT NULL,
                minor_revision INTEGER NOT NULL,
                description TEXT,
                is_checkpoint INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                FOREIGN KEY (project_id) REFERENCES projects (id),
                UNIQUE(project_id, major_revision, minor_revision)
            )",
            [],
        )?;

        // Cables table
        self.connection.execute(
            "CREATE TABLE IF NOT EXISTS cables (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id INTEGER NOT NULL,
                revision_id INTEGER NOT NULL,
                tag TEXT NOT NULL,
                description TEXT,
                function TEXT,
                voltage REAL,
                current REAL,
                cable_type TEXT,
                size TEXT,
                cores INTEGER,
                segregation_class TEXT,
                from_location TEXT,
                from_equipment TEXT,
                to_location TEXT,
                to_equipment TEXT,
                length REAL,
                spare_percentage REAL,
                calculated_length REAL,
                route TEXT,
                manufacturer TEXT,
                part_number TEXT,
                outer_diameter REAL,
                voltage_drop_percentage REAL,
                segregation_warning INTEGER DEFAULT 0,
                notes TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (project_id) REFERENCES projects (id),
                FOREIGN KEY (revision_id) REFERENCES revisions (id),
                UNIQUE(project_id, tag)
            )",
            [],
        )?;

        // I/O Points table
        self.connection.execute(
            "CREATE TABLE IF NOT EXISTS io_points (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id INTEGER NOT NULL,
                revision_id INTEGER NOT NULL,
                tag TEXT NOT NULL,
                description TEXT,
                signal_type TEXT,
                io_type TEXT,
                plc_name TEXT,
                rack INTEGER,
                slot INTEGER,
                channel INTEGER,
                terminal_block TEXT,
                cable_id INTEGER,
                notes TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (project_id) REFERENCES projects (id),
                FOREIGN KEY (revision_id) REFERENCES revisions (id),
                FOREIGN KEY (cable_id) REFERENCES cables (id),
                UNIQUE(project_id, tag)
            )",
            [],
        )?;

        // Conduits table
        self.connection.execute(
            "CREATE TABLE IF NOT EXISTS conduits (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id INTEGER NOT NULL,
                revision_id INTEGER NOT NULL,
                tag TEXT NOT NULL,
                type TEXT,
                size TEXT,
                internal_diameter REAL,
                fill_percentage REAL DEFAULT 0,
                max_fill_percentage REAL DEFAULT 40,
                from_location TEXT,
                to_location TEXT,
                notes TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (project_id) REFERENCES projects (id),
                FOREIGN KEY (revision_id) REFERENCES revisions (id),
                UNIQUE(project_id, tag)
            )",
            [],
        )?;

        // Create indices for better performance
        self.connection.execute("CREATE INDEX IF NOT EXISTS idx_cables_project ON cables(project_id)", [])?;
        self.connection.execute("CREATE INDEX IF NOT EXISTS idx_cables_tag ON cables(tag)", [])?;
        self.connection.execute("CREATE INDEX IF NOT EXISTS idx_io_points_project ON io_points(project_id)", [])?;
        self.connection.execute("CREATE INDEX IF NOT EXISTS idx_conduits_project ON conduits(project_id)", [])?;

        Ok(())
    }

}