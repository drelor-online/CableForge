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
                is_auto_save INTEGER NOT NULL DEFAULT 0,
                user_name TEXT,
                change_count INTEGER NOT NULL DEFAULT 0,
                parent_revision_id INTEGER,
                created_at TEXT NOT NULL,
                FOREIGN KEY (project_id) REFERENCES projects (id),
                FOREIGN KEY (parent_revision_id) REFERENCES revisions (id),
                UNIQUE(project_id, major_revision, minor_revision)
            )",
            [],
        )?;

        // Revision changes table - tracks individual field changes
        self.connection.execute(
            "CREATE TABLE IF NOT EXISTS revision_changes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                revision_id INTEGER NOT NULL,
                entity_type TEXT NOT NULL, -- 'cable', 'io_point', 'load', 'conduit', 'tray'
                entity_id INTEGER NOT NULL,
                entity_tag TEXT, -- for easier reference
                change_type TEXT NOT NULL, -- 'create', 'update', 'delete'
                field_name TEXT, -- null for create/delete
                old_value TEXT,
                new_value TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (revision_id) REFERENCES revisions (id)
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
                tray_id INTEGER,
                conduit_id INTEGER,
                notes TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (project_id) REFERENCES projects (id),
                FOREIGN KEY (revision_id) REFERENCES revisions (id),
                FOREIGN KEY (tray_id) REFERENCES trays (id),
                FOREIGN KEY (conduit_id) REFERENCES conduits (id),
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

        // Loads table
        self.connection.execute(
            "CREATE TABLE IF NOT EXISTS loads (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id INTEGER NOT NULL,
                revision_id INTEGER NOT NULL,
                tag TEXT NOT NULL,
                description TEXT,
                load_type TEXT,
                power_kw REAL,
                power_hp REAL,
                voltage REAL,
                current REAL,
                power_factor REAL,
                efficiency REAL,
                demand_factor REAL,
                connected_load_kw REAL,
                demand_load_kw REAL,
                cable_id INTEGER,
                feeder_cable TEXT,
                starter_type TEXT,
                protection_type TEXT,
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

        // Trays table
        self.connection.execute(
            "CREATE TABLE IF NOT EXISTS trays (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id INTEGER NOT NULL,
                revision_id INTEGER NOT NULL,
                tag TEXT NOT NULL,
                type TEXT,
                material TEXT,
                width REAL,
                height REAL,
                length REAL,
                fill_percentage REAL DEFAULT 0,
                max_fill_percentage REAL DEFAULT 50,
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

        // Project templates table - stores template metadata
        self.connection.execute(
            "CREATE TABLE IF NOT EXISTS project_templates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                category TEXT DEFAULT 'Custom',
                version TEXT DEFAULT '1.0',
                created_by TEXT,
                is_public BOOLEAN DEFAULT 0,
                is_builtin BOOLEAN DEFAULT 0,
                template_data TEXT NOT NULL,
                preview_image TEXT,
                tags TEXT,
                usage_count INTEGER DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                UNIQUE(name, version)
            )",
            [],
        )?;

        // Cable library table - stores cable type specifications
        self.connection.execute(
            "CREATE TABLE IF NOT EXISTS cable_library (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                manufacturer TEXT,
                part_number TEXT,
                cable_type TEXT NOT NULL,
                size TEXT NOT NULL,
                cores INTEGER NOT NULL,
                voltage_rating REAL,
                current_rating REAL,
                outer_diameter REAL,
                weight_per_meter REAL,
                temperature_rating INTEGER,
                conductor_material TEXT DEFAULT 'Copper',
                insulation_type TEXT,
                jacket_material TEXT,
                shielding TEXT,
                armor TEXT,
                fire_rating TEXT,
                category TEXT DEFAULT 'Power',
                description TEXT,
                specifications TEXT,
                datasheet_url TEXT,
                cost_per_meter REAL,
                is_active BOOLEAN DEFAULT 1,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                UNIQUE(manufacturer, part_number)
            )",
            [],
        )?;

        // Create indices for better performance
        self.connection.execute("CREATE INDEX IF NOT EXISTS idx_cables_project ON cables(project_id)", [])?;
        self.connection.execute("CREATE INDEX IF NOT EXISTS idx_cables_tag ON cables(tag)", [])?;
        self.connection.execute("CREATE INDEX IF NOT EXISTS idx_cables_revision ON cables(revision_id)", [])?;
        self.connection.execute("CREATE INDEX IF NOT EXISTS idx_cables_tray ON cables(tray_id)", [])?;
        self.connection.execute("CREATE INDEX IF NOT EXISTS idx_cables_conduit ON cables(conduit_id)", [])?;
        self.connection.execute("CREATE INDEX IF NOT EXISTS idx_io_points_project ON io_points(project_id)", [])?;
        self.connection.execute("CREATE INDEX IF NOT EXISTS idx_io_points_revision ON io_points(revision_id)", [])?;
        self.connection.execute("CREATE INDEX IF NOT EXISTS idx_conduits_project ON conduits(project_id)", [])?;
        self.connection.execute("CREATE INDEX IF NOT EXISTS idx_conduits_revision ON conduits(revision_id)", [])?;
        self.connection.execute("CREATE INDEX IF NOT EXISTS idx_loads_project ON loads(project_id)", [])?;
        self.connection.execute("CREATE INDEX IF NOT EXISTS idx_loads_revision ON loads(revision_id)", [])?;
        self.connection.execute("CREATE INDEX IF NOT EXISTS idx_loads_cable ON loads(cable_id)", [])?;
        self.connection.execute("CREATE INDEX IF NOT EXISTS idx_trays_project ON trays(project_id)", [])?;
        self.connection.execute("CREATE INDEX IF NOT EXISTS idx_trays_revision ON trays(revision_id)", [])?;
        self.connection.execute("CREATE INDEX IF NOT EXISTS idx_revisions_project ON revisions(project_id)", [])?;
        self.connection.execute("CREATE INDEX IF NOT EXISTS idx_revisions_parent ON revisions(parent_revision_id)", [])?;
        self.connection.execute("CREATE INDEX IF NOT EXISTS idx_revision_changes_revision ON revision_changes(revision_id)", [])?;
        self.connection.execute("CREATE INDEX IF NOT EXISTS idx_revision_changes_entity ON revision_changes(entity_type, entity_id)", [])?;
        self.connection.execute("CREATE INDEX IF NOT EXISTS idx_templates_category ON project_templates(category)", [])?;
        self.connection.execute("CREATE INDEX IF NOT EXISTS idx_templates_builtin ON project_templates(is_builtin)", [])?;
        self.connection.execute("CREATE INDEX IF NOT EXISTS idx_cable_library_type ON cable_library(cable_type)", [])?;
        self.connection.execute("CREATE INDEX IF NOT EXISTS idx_cable_library_manufacturer ON cable_library(manufacturer)", [])?;
        self.connection.execute("CREATE INDEX IF NOT EXISTS idx_cable_library_category ON cable_library(category)", [])?;

        Ok(())
    }

}