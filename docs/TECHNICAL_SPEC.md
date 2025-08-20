# CableForge Technical Specification

## Architecture Overview

CableForge uses a desktop-first architecture with a React/TypeScript frontend and Rust/Tauri backend. Each project is stored as a self-contained SQLite database file.

### Technology Stack

#### Frontend
- **React 18** - Component-based UI framework
- **TypeScript** - Type safety and development experience
- **Tailwind CSS** - Utility-first styling
- **AG-Grid Community** - Excel-like data grid
- **Zustand** - Lightweight state management
- **React Hook Form** - Form handling and validation
- **Zod** - Runtime type validation

#### Backend
- **Tauri 2.0** - Rust-based desktop app framework
- **Rust** - System programming language
- **SQLite** - Embedded database
- **Diesel** - ORM and query builder
- **Serde** - Serialization framework
- **Tokio** - Async runtime

#### Development Tools
- **Vite** - Fast build tool
- **Vitest** - Unit testing framework
- **Playwright** - End-to-end testing
- **ESLint + Prettier** - Code formatting and linting

## File Formats

### Project Files (.cfp)
CableForge Project files are SQLite databases containing:
- All project data (cables, I/O, conduits, etc.)
- Revision history and change tracking
- Project metadata and settings
- Embedded calculation results

### Library Files (.cfl)
CableForge Library files are SQLite databases containing:
- Reusable cable type definitions
- I/O card specifications
- Instrument templates
- No project-specific data

### Template Files (.cft)
CableForge Template files are JSON configurations containing:
- Export column mappings
- Formatting preferences
- Client-specific layouts

## Database Schema

### Core Tables

#### Projects Table
```sql
CREATE TABLE projects (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    major_revision TEXT DEFAULT '0',
    minor_revision INTEGER DEFAULT 0
);
```

#### Cables Table
```sql
CREATE TABLE cables (
    id INTEGER PRIMARY KEY,
    tag TEXT NOT NULL UNIQUE,
    revision_id INTEGER NOT NULL,
    
    -- Description fields
    description TEXT,
    function TEXT, -- power, signal, lighting, etc.
    
    -- Electrical specifications
    voltage_level TEXT,
    cable_type TEXT,
    size TEXT,
    cores INTEGER,
    segregation_class TEXT,
    
    -- Routing information
    from_location TEXT,
    from_equipment TEXT,
    to_location TEXT,
    to_equipment TEXT,
    length REAL,
    spare_percentage REAL DEFAULT 10.0,
    calculated_length REAL GENERATED ALWAYS AS (length * (1 + spare_percentage/100.0)),
    route TEXT, -- "C01, C05, C06"
    
    -- Physical properties
    manufacturer TEXT,
    part_number TEXT,
    outer_diameter REAL, -- mm, for fill calculations
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (revision_id) REFERENCES revisions(id)
);
```

#### IO_Points Table
```sql
CREATE TABLE io_points (
    id INTEGER PRIMARY KEY,
    tag TEXT NOT NULL UNIQUE,
    revision_id INTEGER NOT NULL,
    
    -- Description
    description TEXT,
    
    -- Signal characteristics
    signal_type TEXT, -- 4-20mA, HART, Digital, etc.
    io_type TEXT, -- AI, AO, DI, DO
    
    -- PLC assignment
    plc_name TEXT,
    rack INTEGER,
    slot INTEGER,
    channel INTEGER,
    terminal_block TEXT,
    
    -- Relationships
    cable_id INTEGER,
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (revision_id) REFERENCES revisions(id),
    FOREIGN KEY (cable_id) REFERENCES cables(id),
    UNIQUE(plc_name, rack, slot, channel) -- Prevent channel conflicts
);
```

#### Conduits Table
```sql
CREATE TABLE conduits (
    id INTEGER PRIMARY KEY,
    tag TEXT NOT NULL UNIQUE,
    revision_id INTEGER NOT NULL,
    
    -- Physical properties
    type TEXT, -- EMT, PVC, etc.
    size TEXT, -- 3/4", 1", etc.
    fill_percentage REAL DEFAULT 0.0,
    max_fill_percentage REAL DEFAULT 40.0, -- NEC standard
    
    -- Routing
    from_location TEXT,
    to_location TEXT,
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (revision_id) REFERENCES revisions(id)
);
```

#### Cable_Conduit_Mapping Table
```sql
CREATE TABLE cable_conduit_mapping (
    id INTEGER PRIMARY KEY,
    cable_id INTEGER NOT NULL,
    conduit_id INTEGER NOT NULL,
    sequence INTEGER NOT NULL, -- Order in routing path
    
    FOREIGN KEY (cable_id) REFERENCES cables(id) ON DELETE CASCADE,
    FOREIGN KEY (conduit_id) REFERENCES conduits(id) ON DELETE CASCADE,
    UNIQUE(cable_id, conduit_id, sequence)
);
```

#### Loads Table (Optional)
```sql
CREATE TABLE loads (
    id INTEGER PRIMARY KEY,
    tag TEXT NOT NULL UNIQUE,
    revision_id INTEGER NOT NULL,
    
    -- Load characteristics
    description TEXT,
    voltage REAL,
    hp_rating REAL,
    kw_rating REAL,
    fla REAL, -- Full load amps
    
    -- Relationships
    cable_id INTEGER,
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (revision_id) REFERENCES revisions(id),
    FOREIGN KEY (cable_id) REFERENCES cables(id)
);
```

### Revision Management Tables

#### Revisions Table
```sql
CREATE TABLE revisions (
    id INTEGER PRIMARY KEY,
    major_version TEXT NOT NULL, -- "30%", "60%", "IFC", etc.
    minor_version INTEGER NOT NULL,
    description TEXT,
    is_checkpoint BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(major_version, minor_version)
);
```

#### Revision_Changes Table
```sql
CREATE TABLE revision_changes (
    id INTEGER PRIMARY KEY,
    revision_id INTEGER NOT NULL,
    table_name TEXT NOT NULL,
    record_id INTEGER NOT NULL,
    change_type TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    old_values TEXT, -- JSON snapshot
    new_values TEXT, -- JSON snapshot
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (revision_id) REFERENCES revisions(id)
);
```

### Library Schema (for .cfl files)

#### Cable_Types Table
```sql
CREATE TABLE cable_types (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    manufacturer TEXT,
    part_number TEXT,
    description TEXT,
    
    -- Electrical properties
    voltage_rating INTEGER,
    cores INTEGER,
    size TEXT,
    cable_type TEXT, -- THHN, XLPE, etc.
    
    -- Physical properties
    outer_diameter REAL, -- mm
    weight_per_foot REAL,
    
    -- Environmental
    temperature_rating INTEGER,
    is_armored BOOLEAN DEFAULT FALSE,
    is_shielded BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### IO_Card_Types Table
```sql
CREATE TABLE io_card_types (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    manufacturer TEXT,
    part_number TEXT,
    description TEXT,
    
    -- Card specifications
    total_channels INTEGER,
    channel_type TEXT, -- AI, AO, DI, DO
    signal_types TEXT, -- JSON array of supported signals
    
    -- Physical
    slots_required INTEGER DEFAULT 1,
    power_consumption REAL,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Instrument_Types Table
```sql
CREATE TABLE instrument_types (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    manufacturer TEXT,
    model TEXT,
    description TEXT,
    
    -- Signal characteristics
    signal_type TEXT,
    range_min REAL,
    range_max REAL,
    units TEXT,
    
    -- Installation
    mounting_type TEXT,
    environmental_rating TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Calculation Engines

### Conduit Fill Calculator

```rust
pub struct ConduitFillCalculator {
    conduit_size: f64,    // Internal diameter (inches)
    fill_factor: f64,     // NEC fill factor (0.4 for >2 conductors)
}

impl ConduitFillCalculator {
    pub fn calculate_fill_percentage(&self, cables: &[Cable]) -> f64 {
        let total_cable_area: f64 = cables
            .iter()
            .map(|cable| self.cable_cross_sectional_area(cable))
            .sum();
        
        let conduit_area = PI * (self.conduit_size / 2.0).powi(2);
        let allowable_area = conduit_area * self.fill_factor;
        
        (total_cable_area / allowable_area) * 100.0
    }
    
    fn cable_cross_sectional_area(&self, cable: &Cable) -> f64 {
        PI * (cable.outer_diameter / 2.0).powi(2)
    }
}
```

### Voltage Drop Calculator

```rust
pub struct VoltageDropCalculator;

impl VoltageDropCalculator {
    pub fn calculate_voltage_drop(
        &self,
        voltage: f64,
        current: f64,
        distance: f64,        // One-way distance in feet
        conductor_size: &str,
        material: ConductorMaterial,
    ) -> f64 {
        let resistance = self.get_conductor_resistance(conductor_size, material);
        let total_distance = distance * 2.0; // Round trip
        
        // V_drop = I × R × D / 1000
        current * resistance * total_distance / 1000.0
    }
    
    fn get_conductor_resistance(&self, size: &str, material: ConductorMaterial) -> f64 {
        // NEC Chapter 9, Table 8 values
        match (size, material) {
            ("12 AWG", ConductorMaterial::Copper) => 2.0,
            ("10 AWG", ConductorMaterial::Copper) => 1.2,
            // ... more entries
            _ => 0.0, // Unknown size
        }
    }
}
```

## State Management

### Frontend State Architecture

```typescript
// Zustand stores
interface ProjectStore {
  project: Project | null;
  cables: Cable[];
  ioPoints: IOPoint[];
  conduits: Conduit[];
  
  // Actions
  loadProject: (path: string) => Promise<void>;
  saveProject: () => Promise<void>;
  addCable: (cable: Partial<Cable>) => void;
  updateCable: (id: number, updates: Partial<Cable>) => void;
  deleteCable: (id: number) => void;
  
  // Calculations
  calculateConduitFill: (conduitId: number) => number;
  calculateVoltageDrops: () => Map<number, number>;
}

interface UIStore {
  selectedCables: number[];
  activeTab: 'cables' | 'io' | 'conduits' | 'loads';
  filters: FilterState;
  sortBy: SortState;
  
  // Actions
  setSelectedCables: (ids: number[]) => void;
  setActiveTab: (tab: string) => void;
  updateFilters: (filters: Partial<FilterState>) => void;
}
```

### Backend API Surface

```rust
// Tauri commands exposed to frontend
#[tauri::command]
async fn create_project(name: String, path: String) -> Result<(), Error> {
    // Create new SQLite database with schema
}

#[tauri::command]
async fn open_project(path: String) -> Result<Project, Error> {
    // Open existing project file
}

#[tauri::command]
async fn get_cables(project_path: String) -> Result<Vec<Cable>, Error> {
    // Query cables table
}

#[tauri::command]
async fn save_cable(project_path: String, cable: Cable) -> Result<Cable, Error> {
    // Insert or update cable
}

#[tauri::command]
async fn calculate_conduit_fill(
    project_path: String, 
    conduit_id: i32
) -> Result<f64, Error> {
    // Run fill calculation
}

#[tauri::command]
async fn export_to_excel(
    project_path: String,
    template_path: String,
    output_path: String
) -> Result<(), Error> {
    // Generate Excel export
}
```

## Data Validation

### Frontend Validation (Zod Schemas)

```typescript
const CableSchema = z.object({
  tag: z.string().min(1, "Tag is required"),
  description: z.string().optional(),
  voltage_level: z.string().optional(),
  size: z.string().optional(),
  cores: z.number().int().positive().optional(),
  from_location: z.string().optional(),
  to_location: z.string().optional(),
  length: z.number().positive().optional(),
  outer_diameter: z.number().positive().optional(),
});

const IOPointSchema = z.object({
  tag: z.string().min(1, "Tag is required"),
  signal_type: z.enum(["4-20mA", "HART", "Digital", "RTD", "TC"]).optional(),
  io_type: z.enum(["AI", "AO", "DI", "DO"]).optional(),
  plc_name: z.string().optional(),
  rack: z.number().int().optional(),
  slot: z.number().int().optional(),
  channel: z.number().int().optional(),
});
```

### Backend Validation

```rust
// Diesel models with validation
#[derive(Queryable, Insertable, Serialize, Deserialize)]
#[diesel(table_name = cables)]
pub struct Cable {
    pub id: Option<i32>,
    pub tag: String,
    pub revision_id: i32,
    pub description: Option<String>,
    pub voltage_level: Option<String>,
    // ... other fields
}

impl Cable {
    pub fn validate(&self) -> Result<(), ValidationError> {
        if self.tag.is_empty() {
            return Err(ValidationError::new("Tag cannot be empty"));
        }
        
        if let Some(cores) = self.cores {
            if cores < 1 {
                return Err(ValidationError::new("Cores must be positive"));
            }
        }
        
        Ok(())
    }
}
```

## Performance Considerations

### Database Optimization

- **Indexes** on frequently queried columns (tag, revision_id)
- **Batch operations** for bulk imports
- **Prepared statements** for repeated queries
- **Connection pooling** for concurrent operations

### Frontend Performance

- **Virtual scrolling** for large tables (AG-Grid handles this)
- **Debounced calculations** - Don't recalculate on every keystroke
- **Memoized components** - React.memo for expensive components
- **Lazy loading** - Load project data on demand

### File Size Management

- **Revision cleanup** - Allow removal of old revisions
- **VACUUM** SQLite database periodically
- **Compression** for archived projects

## Security Considerations

### File System Access

- **Sandboxed file operations** through Tauri APIs
- **Path validation** to prevent directory traversal
- **File type validation** for imports

### Data Integrity

- **Foreign key constraints** in database
- **Transaction safety** for multi-table operations
- **Backup on save** - Keep previous version temporarily

## Export System Architecture

### Template Engine

```typescript
interface ExportTemplate {
  name: string;
  description: string;
  sheets: ExportSheet[];
}

interface ExportSheet {
  name: string;
  columns: ExportColumn[];
  filters?: FilterExpression[];
  sort?: SortExpression[];
}

interface ExportColumn {
  header: string;
  field: string;        // Database field path
  format?: FormatRule;  // Number format, date format, etc.
  width?: number;
  conditional?: ConditionalFormat[];
}
```

### Export Process

1. **Load template** - Parse .cft file
2. **Query data** - Filter and sort based on template
3. **Transform data** - Apply formatting rules
4. **Generate Excel** - Use rust-xlsxwriter
5. **Apply styling** - Headers, borders, colors

## Testing Strategy

### Unit Tests
- Database operations (CRUD)
- Calculation functions
- Validation logic
- State management

### Integration Tests  
- File operations (save/load projects)
- Import/export workflows
- Template processing
- Revision management

### End-to-End Tests
- Complete user workflows
- Cross-platform compatibility
- Performance with large datasets
- Error handling and recovery

## Deployment Architecture

### Build Pipeline
- **Frontend build** - Vite production build
- **Backend compilation** - Rust release build
- **Asset bundling** - Icons, templates, etc.
- **Code signing** - For distribution

### Distribution
- **Installer packages** - Windows MSI, macOS DMG
- **Portable executables** - Single-file distribution
- **Auto-updater** - Tauri built-in update system

### Configuration
- **Settings file** - User preferences
- **Default templates** - Bundled export templates
- **Sample projects** - Example .cfp files