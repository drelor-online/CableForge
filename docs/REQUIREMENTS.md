# CableForge Requirements Specification

## Overview

CableForge is a desktop application for electrical engineers designing oil & gas and natural gas facilities. It focuses on cable schedule and I/O list development with engineering calculations and template-based exports.

## Core Principles

1. **Maintain Focus** - Avoid feature creep that has plagued previous attempts
2. **Flexibility First** - Accommodate different engineering workflows
3. **Portable Files** - Projects must be shareable without library dependencies
4. **Template-Driven** - Support various client deliverable formats

## Project Scale & Workflow

### Typical Project Sizes
- **Small:** 10-50 cables (automated valve facilities)
- **Medium:** 100-500 cables 
- **Large:** 1000+ cables (compressor stations)

### Engineering Workflow
1. Review P&IDs to identify I/O points
2. Create I/O list
3. Locate instruments on site plans
4. Plan cable routes through junction boxes, pull boxes, panels
5. Plan power distribution separately (motors, loads)
6. Generate deliverable schedules

### Data Sources
- **I/O:** P&ID markups and instrument specifications
- **Power:** Load lists and power distribution plans
- **Import formats:** Typically manual entry from drawings

## Core Features

### 1. Cable Management

#### Cable Data Fields
**Required Fields:**
- `tag` (only required field - allows gradual data entry)

**Optional Fields:**
- `description` - Cable function/purpose
- `function` - power, signal, lighting, etc.
- `voltage_level` - Operating voltage
- `cable_type` - Construction type
- `size` - AWG/MCM size
- `cores` - Number of conductors
- `from_location` - Starting location
- `from_equipment` - Starting equipment
- `to_location` - Ending location  
- `to_equipment` - Ending equipment
- `length` - Physical length
- `spare_percentage` - Spare length factor
- `route` - Routing path (e.g., "C01, C05, C06")
- `conduits` - Conduit/tray assignments
- `segregation_class` - NEC segregation category
- `manufacturer` - Cable manufacturer
- `part_number` - Manufacturer part number
- `outer_diameter` - For fill calculations
- `notes` - Additional comments

#### Cable Operations
- **Inline editing** - Excel-like table editing
- **Auto-numbering** - Generate cable tags (C-001, C-002) with custom prefixes
- **Bulk operations** - Duplicate with increment, find/replace, bulk edits
- **Filtering** - Excel-like filtering on any column
- **Spare tracking** - List spare cables (tagged "SPARE")

### 2. Conduit & Tray Management

#### Conduit Data Fields
- `tag` - Conduit identifier
- `type` - Conduit type/material
- `size` - Internal diameter
- `from_location` - Starting point
- `to_location` - Ending point
- `fill_percentage` - Calculated fill
- `max_fill` - NEC maximum allowed
- `notes` - Comments

#### Routing Methods
**Option A - Route Field:** Cable contains route string ("C01, C05, C06")
**Option B - Conduit Schedule:** List all cables within each conduit/tray

*Support both methods based on client preferences*

### 3. I/O Management

#### I/O Point Data Fields
**Required:**
- `tag` - I/O point identifier

**Optional:**
- `description` - Function description
- `signal_type` - 4-20mA, HART, digital, etc.
- `io_type` - AI, AO, DI, DO
- `plc_name` - PLC/RTU identifier
- `rack` - Rack number
- `slot` - Slot assignment
- `channel` - Channel number
- `cable_id` - Associated cable
- `terminal_block` - Terminal assignment
- `notes` - Comments

#### I/O Operations
- **Auto-assignment** - Find next available PLC channel
- **Conflict detection** - Warn of duplicate channel assignments
- **I/O summaries** - Count by type and PLC
- **Cable linking** - Associate I/O points with cables

### 4. Segregation & Compliance

#### Segregation Classes (NEC-based)
- **IS Signal** - Intrinsically safe signals
- **Non-IS Signal** - Regular instrument signals
- **24VDC Power** - Low voltage DC power
- **120VAC Power** - Standard AC power
- **480VAC Power** - Higher voltage AC power
- **Custom** - User-defined classes

#### Segregation Rules
- **Default warnings** for incompatible cable combinations
- **Override capability** - User can suppress warnings when justified
- **Special cases** - 24VDC power with signals (sometimes acceptable)
- **Strict separation** - 120VAC+ power from signals

### 5. Equipment & Location Management

#### Flexible Approach
**Method A:** Free-text entry in from/to fields
**Method B:** Equipment list with dropdown selection

*Support both - some engineers prefer copy/paste, others like structured lists*

#### Equipment Types
- Instruments
- Junction boxes
- Pull boxes
- Panels
- Motors
- Other loads

### 6. Load Management (Optional Feature)

#### Load List Integration
- **Optional table** for power loads
- **Load calculations** - HP, kW, FLA
- **Cable generation** - Create power cables from loads
- **Feeder support** - Handle non-direct load cables
- **Manual override** - Not all power cables feed specific loads

### 7. Engineering Calculations

#### Conduit Fill Calculations
- **NEC compliance** - Standard fill percentages
- **Cable OD required** - Alert when OD unavailable
- **Real-time updates** - Calculate as cables assigned
- **Warning thresholds** - Visual alerts for exceeded limits

#### Voltage Drop Calculations  
- **Single-point calculation** - Keep simple, no motor starting
- **NEC standards** - Standard calculation methods
- **Load-based** - Use actual load currents
- **Length-dependent** - Account for cable run distances

#### Tray Fill Calculations
- **Cross-sectional area** - Cable area vs tray area
- **Derating factors** - Temperature and bundling effects
- **NEC guidelines** - Standard practices

### 8. Library System

#### Library Types
- **Cable libraries** (.cfl files)
  - Manufacturer specifications
  - Part numbers
  - Physical properties (OD, cores, voltage rating)
  - Common cable types (1-3/C w/gnd, 10 pair IS/OAS, etc.)

- **I/O Card libraries**
  - PLC/RTU module specifications
  - Channel counts and types
  - Slot assignments

- **Instrument libraries**
  - Common instrument types
  - Signal characteristics
  - Manufacturer specifications

#### Library Operations
- **Copy-on-use** - No linking after selection
- **File-based sharing** - Email/network file sharing
- **No central database** - Avoid maintenance overhead
- **Import flexibility** - Use library OR manual entry

### 9. Import/Export System

#### Import Capabilities
- **CSV import** with preview
- **Append vs Replace** options  
- **Smart merge** for round-trip editing
- **Conflict resolution** - Preview changes before commit

#### Export Templates
- **Excel primary format** - Standard deliverable
- **Template builder** - Drag/drop column arrangement
- **Client presets** - Save common formats
- **Field mapping** - Database fields → Excel columns
- **Multi-sheet support** - Optional (or separate projects)

#### Template Flexibility
- **Conditional columns** - Only show populated fields
- **Custom formatting** - Client-specific styles
- **Standard templates** - Common industry formats

### 10. Revision Management

#### Revision Types
- **Major revisions** - User-controlled (30%, 60%, IFC, As-Built)
- **Minor revisions** - Auto-generated checkpoints
- **Manual checkpoints** - User-triggered minor revisions

#### Change Tracking
- **Diff views** - Compare revisions with color coding
- **Change log** - What changed between versions
- **Full history** - All revisions in project file
- **Cleanup option** - Remove old revisions to reduce file size

#### Revision Storage
- All revisions in single .cfp file
- Export old revisions if needed
- Revision comparison tools

## Data Validation & Quality

### Required Field Strategy
- **Minimal requirements** - Only tag field required
- **Progressive validation** - Warn only at export if fields missing
- **Template dependency** - Alert if export template needs empty fields
- **User responsibility** - Engineers control data completeness

### Validation Rules
- **Duplicate detection** - No duplicate tags
- **Segregation warnings** - Incompatible cable combinations
- **Fill calculations** - Conduit/tray capacity warnings
- **Channel conflicts** - PLC assignment collisions
- **Override capability** - User can suppress all warnings

## Performance Requirements

### Real-time Updates
- **Calculation updates** - As user types (debounced)
- **Fill percentages** - Update when cables assigned
- **Validation warnings** - Immediate feedback
- **Export preview** - Fast template preview

### Scalability
- **Large projects** - Handle 1000+ cables smoothly
- **Responsive UI** - No lag during editing
- **Memory efficient** - Reasonable resource usage
- **Fast exports** - Quick Excel generation

## User Interface Requirements

### Table-based Interface
- **Excel-like editing** - Inline cell editing
- **Column sorting** - Click headers to sort
- **Column filtering** - Dropdown filters per column
- **Row selection** - Multi-select for bulk operations
- **Copy/paste** - Standard clipboard operations

### Bulk Operations
- **Duplicate with increment** - Copy C-001 → C-002
- **Find and replace** - Global text replacement
- **Bulk edit** - Change multiple rows simultaneously
- **Import operations** - Bulk data loading

### Modern UI Standards
- **Responsive design** - Works on different screen sizes
- **Keyboard shortcuts** - Common operations
- **Context menus** - Right-click operations
- **Drag and drop** - Where appropriate

## Technical Constraints

### File Format Requirements
- **Portable projects** - Single .cfp file contains everything
- **No external dependencies** - Projects work without libraries
- **Shareable** - Email/transfer project files
- **Version independent** - Future versions open old files

### Standards Compliance
- **NEC only** - No IEC standards needed
- **No client-specific standards** - Handle via templates
- **Industry best practices** - Standard engineering approaches

### Platform Support
- **Desktop application** - Windows primary, cross-platform preferred
- **No web version** - Desktop-focused tool
- **Offline operation** - No cloud dependencies

## Non-Requirements (Out of Scope)

### Features to Avoid
- **Loop drawings** - Focus on schedules/lists only
- **CAD integration** - Separate tools handle drawings
- **Construction tracking** - Design focus only
- **Status workflows** - Simple design deliverables
- **Multi-user collaboration** - Single-user tool
- **Cloud storage** - Local files only
- **Complex visualizations** - Table/list focus
- **Individual core tracking** - Cable-level only

### Future Considerations
- Loop drawing generation
- P&ID import
- CAD tool integration
- Mobile companion app
- Cloud collaboration features

These features may be considered in future versions but should not influence initial design decisions.