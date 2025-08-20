# CableForge User Stories

## Epic 1: Project Management

### Story 1.1: Create New Project
**As an** electrical engineer  
**I want** to create a new CableForge project  
**So that** I can start designing cable schedules for a facility

**Acceptance Criteria:**
- [ ] User can create a new project with a name
- [ ] Project creates a new .cfp file in chosen location
- [ ] Project opens automatically after creation
- [ ] Project contains empty tables for cables, I/O, and conduits
- [ ] Project metadata is initialized with creation date

### Story 1.2: Open Existing Project
**As an** electrical engineer  
**I want** to open an existing project file  
**So that** I can continue working on a previous design

**Acceptance Criteria:**
- [ ] User can browse and select .cfp files
- [ ] Project loads all cables, I/O points, and conduits
- [ ] Project loads revision history
- [ ] Recent projects list is updated
- [ ] Invalid/corrupted files show error message

### Story 1.3: Save Project
**As an** electrical engineer  
**I want** to save my project changes  
**So that** my work is not lost

**Acceptance Criteria:**
- [ ] Auto-save occurs every 30 seconds
- [ ] Manual save available via Ctrl+S
- [ ] Save creates new minor revision automatically
- [ ] Unsaved changes indicator in UI
- [ ] Backup copy created before overwriting

### Story 1.4: Share Project
**As an** electrical engineer  
**I want** to share my project file with colleagues  
**So that** they can review or continue the work

**Acceptance Criteria:**
- [ ] Project file contains all necessary data
- [ ] Recipient can open file without additional libraries
- [ ] All calculations work without external dependencies
- [ ] File size is reasonable for email attachment

## Epic 2: Cable Management

### Story 2.1: Add Cable Manually
**As an** electrical engineer  
**I want** to add a new cable to the schedule  
**So that** I can track electrical connections

**Acceptance Criteria:**
- [ ] Only cable tag is required to create entry
- [ ] All other fields are optional
- [ ] New cable appears in the main table
- [ ] Auto-numbering available for cable tags (C-001, C-002)
- [ ] Duplicate tag warning shown but can be overridden

### Story 2.2: Edit Cable Inline
**As an** electrical engineer  
**I want** to edit cable properties directly in the table  
**So that** I can quickly update information

**Acceptance Criteria:**
- [ ] Double-click cell to edit
- [ ] Tab moves to next cell
- [ ] Enter confirms edit
- [ ] Escape cancels edit
- [ ] Changes saved automatically
- [ ] Validation errors shown in cell

### Story 2.3: Cable Auto-Numbering
**As an** electrical engineer  
**I want** automatic cable tag generation  
**So that** I can quickly create multiple cables with consistent naming

**Acceptance Criteria:**
- [ ] User can set prefix (default "C-")
- [ ] User can set starting number (default 001)
- [ ] User can set increment (default 1)
- [ ] Existing tags are checked to avoid conflicts
- [ ] Next available number is suggested
- [ ] Format: PREFIX-NUMBER (e.g., "C-001", "PWR-100")

### Story 2.4: Bulk Cable Operations
**As an** electrical engineer  
**I want** to perform operations on multiple cables  
**So that** I can efficiently manage large schedules

**Acceptance Criteria:**
- [ ] Multi-select cables with Ctrl+click
- [ ] Select all cables with Ctrl+A
- [ ] Bulk delete selected cables
- [ ] Bulk edit properties of selected cables
- [ ] Duplicate cables with incremented tags
- [ ] Find and replace across selected cables

### Story 2.5: Cable Filtering and Sorting
**As an** electrical engineer  
**I want** to filter and sort the cable list  
**So that** I can find specific cables quickly

**Acceptance Criteria:**
- [ ] Click column header to sort
- [ ] Filter dropdowns on each column
- [ ] Text search across all fields
- [ ] Filter by voltage level
- [ ] Filter by cable function (power, signal, etc.)
- [ ] Save filter presets
- [ ] Clear all filters button

## Epic 3: Conduit and Routing Management

### Story 3.1: Add Conduits
**As an** electrical engineer  
**I want** to add conduits to the project  
**So that** I can track cable routing paths

**Acceptance Criteria:**
- [ ] Create conduit with tag, type, and size
- [ ] Set from/to locations
- [ ] Set maximum fill percentage (default 40%)
- [ ] Conduit appears in conduit table
- [ ] Available for cable routing assignment

### Story 3.2: Assign Cables to Conduits
**As an** electrical engineer  
**I want** to assign cables to conduits  
**So that** I can track routing and calculate fills

**Acceptance Criteria:**
- [ ] Select conduit from dropdown in cable row
- [ ] Support multi-conduit routing (C01, C02, C03)
- [ ] Route field accepts comma-separated conduit list
- [ ] Conduit fill percentage updates automatically
- [ ] Warning when fill exceeds maximum

### Story 3.3: Conduit Fill Calculation
**As an** electrical engineer  
**I want** automatic conduit fill calculations  
**So that** I can ensure NEC compliance

**Acceptance Criteria:**
- [ ] Calculate based on cable outer diameters
- [ ] Use NEC standard fill factors (40% for >2 cables)
- [ ] Show warning when fill exceeds limit
- [ ] Display actual vs. allowable fill percentage
- [ ] Alert when cable OD is missing for calculation
- [ ] Update in real-time as cables are assigned

### Story 3.4: Conduit Schedule View
**As an** electrical engineer  
**I want** to see which cables are in each conduit  
**So that** I can verify routing assignments

**Acceptance Criteria:**
- [ ] Table view showing conduits and their cables
- [ ] Cable count per conduit
- [ ] Fill percentage per conduit
- [ ] Sort by fill percentage or cable count
- [ ] Export conduit schedule separately

## Epic 4: I/O List Management

### Story 4.1: Add I/O Points
**As an** electrical engineer  
**I want** to add instrument I/O points  
**So that** I can track control system connections

**Acceptance Criteria:**
- [ ] Create I/O point with tag (required only)
- [ ] Set signal type (4-20mA, HART, Digital, etc.)
- [ ] Set I/O type (AI, AO, DI, DO)
- [ ] All other fields optional for initial entry
- [ ] I/O point appears in I/O table

### Story 4.2: PLC Assignment
**As an** electrical engineer  
**I want** to assign I/O points to PLC channels  
**So that** I can track control system wiring

**Acceptance Criteria:**
- [ ] Select PLC/RTU from dropdown
- [ ] Enter rack, slot, and channel numbers
- [ ] Detect and warn of channel conflicts
- [ ] Auto-suggest next available channel
- [ ] Support multiple PLC systems in one project

### Story 4.3: Link I/O to Cables
**As an** electrical engineer  
**I want** to associate I/O points with cables  
**So that** I can trace connections

**Acceptance Criteria:**
- [ ] Select cable from dropdown in I/O row
- [ ] Cable dropdown filtered by signal-compatible types
- [ ] Bi-directional link (cable shows connected I/O)
- [ ] Support multiple I/O points per cable
- [ ] Validation that cable supports I/O signal type

### Story 4.4: I/O Summary Reports
**As an** electrical engineer  
**I want** to see I/O count summaries  
**So that** I can verify PLC capacity requirements

**Acceptance Criteria:**
- [ ] Count by I/O type (AI, AO, DI, DO)
- [ ] Count by PLC/rack/slot
- [ ] Show available vs. used channels
- [ ] Identify unassigned I/O points
- [ ] Export summary to Excel

## Epic 5: Engineering Calculations

### Story 5.1: Voltage Drop Calculation
**As an** electrical engineer  
**I want** automatic voltage drop calculations  
**So that** I can verify cable sizing is adequate

**Acceptance Criteria:**
- [ ] Calculate based on cable size, length, and load current
- [ ] Use NEC standard resistance values
- [ ] Support copper and aluminum conductors
- [ ] Show voltage drop as percentage
- [ ] Warning when drop exceeds 3% (or user setting)
- [ ] Real-time updates as parameters change

### Story 5.2: Cable Ampacity Calculations
**As an** electrical engineer  
**I want** cable ampacity calculations with derating  
**So that** I can ensure safe current-carrying capacity

**Acceptance Criteria:**
- [ ] Base ampacity from NEC tables
- [ ] Temperature derating factors
- [ ] Bundling derating for multiple cables
- [ ] Conduit fill derating
- [ ] Final ampacity vs. load current comparison
- [ ] Warning when load exceeds derated ampacity

### Story 5.3: Segregation Compliance
**As an** electrical engineer  
**I want** cable segregation validation  
**So that** I can ensure safety and signal integrity

**Acceptance Criteria:**
- [ ] Define segregation classes (IS, Non-IS, Power levels)
- [ ] Warning when incompatible cables in same conduit
- [ ] Allow override with justification note
- [ ] Highlight segregation violations in UI
- [ ] Report showing all segregation issues

## Epic 6: Library System

### Story 6.1: Cable Type Library
**As an** electrical engineer  
**I want** a library of common cable types  
**So that** I can quickly add standard cables

**Acceptance Criteria:**
- [ ] Create/edit cable type libraries (.cfl files)
- [ ] Include manufacturer, part number, specifications
- [ ] Import cable type into project (copy, not link)
- [ ] Search library by cable characteristics
- [ ] Share library files with colleagues

### Story 6.2: I/O Card Library
**As an** electrical engineer  
**I want** a library of PLC I/O cards  
**So that** I can quickly set up PLC configurations

**Acceptance Criteria:**
- [ ] Define I/O card types with channel counts
- [ ] Specify supported signal types per card
- [ ] Auto-populate PLC rack configuration
- [ ] Validate I/O assignments against card capabilities
- [ ] Standard cards from major manufacturers

### Story 6.3: Use Library Items
**As an** electrical engineer  
**I want** to quickly add items from libraries  
**So that** I don't have to re-enter common specifications

**Acceptance Criteria:**
- [ ] "Add from Library" button in cable/I/O tables
- [ ] Browse and search library items
- [ ] Preview item details before adding
- [ ] Copy item to project (no ongoing link)
- [ ] Edit copied item without affecting library

## Epic 7: Import/Export

### Story 7.1: CSV Import
**As an** electrical engineer  
**I want** to import cable data from CSV files  
**So that** I can use existing spreadsheet data

**Acceptance Criteria:**
- [ ] Map CSV columns to database fields
- [ ] Preview import before committing
- [ ] Option to append or replace existing data
- [ ] Validation errors shown for bad data
- [ ] Support for custom delimiters and encodings

### Story 7.2: Excel Export with Templates
**As an** electrical engineer  
**I want** to export data in client-specific Excel formats  
**So that** I can deliver professional schedules

**Acceptance Criteria:**
- [ ] Create export templates (.cft files)
- [ ] Map database fields to Excel columns
- [ ] Set column headers, widths, and formatting
- [ ] Support multiple sheets (cables, I/O, conduits)
- [ ] Include calculations and totals
- [ ] Save/load template configurations

### Story 7.3: Round-trip Editing
**As an** electrical engineer  
**I want** to export, edit in Excel, and re-import  
**So that** I can use familiar Excel editing features

**Acceptance Criteria:**
- [ ] Export project data to editable Excel format
- [ ] Import modified Excel back to project
- [ ] Smart merge: update existing, add new items
- [ ] Show preview of changes before applying
- [ ] Handle tag changes and deletions safely

## Epic 8: Revision Management

### Story 8.1: Manual Revision Control
**As an** electrical engineer  
**I want** to create major revisions (30%, 60%, IFC)  
**So that** I can track project milestones

**Acceptance Criteria:**
- [ ] Create major revision with description
- [ ] All current data tagged with revision
- [ ] Continue editing in new revision
- [ ] View/compare previous revisions
- [ ] Export specific revision data

### Story 8.2: Automatic Minor Revisions
**As an** electrical engineer  
**I want** automatic minor revision tracking  
**So that** I can see incremental changes

**Acceptance Criteria:**
- [ ] Create minor revision on save
- [ ] Option to mark "checkpoint" revisions
- [ ] Track what changed between revisions
- [ ] Limit minor revision history (e.g., last 50)
- [ ] Compress or remove old minor revisions

### Story 8.3: Revision Comparison
**As an** electrical engineer  
**I want** to compare different revisions  
**So that** I can see what has changed

**Acceptance Criteria:**
- [ ] Select two revisions to compare
- [ ] Show added/deleted/modified items
- [ ] Color-coded diff view
- [ ] Filter by change type
- [ ] Export change summary report

## Epic 9: User Interface and Experience

### Story 9.1: Modern Desktop Interface
**As an** electrical engineer  
**I want** a clean, professional interface  
**So that** I can work efficiently

**Acceptance Criteria:**
- [ ] Tabbed interface for cables/I/O/conduits
- [ ] Excel-like data grid with sorting/filtering
- [ ] Keyboard shortcuts for common operations
- [ ] Context menus for row/cell operations
- [ ] Status bar showing project statistics

### Story 9.2: Bulk Operations Interface
**As an** electrical engineer  
**I want** intuitive bulk editing capabilities  
**So that** I can efficiently manage large datasets

**Acceptance Criteria:**
- [ ] Multi-select with checkboxes or Ctrl+click
- [ ] Bulk edit dialog for selected items
- [ ] Find and replace with preview
- [ ] Bulk delete with confirmation
- [ ] Copy/paste from Excel

### Story 9.3: Real-time Validation
**As an** electrical engineer  
**I want** immediate feedback on data issues  
**So that** I can fix problems as I work

**Acceptance Criteria:**
- [ ] Inline validation errors in cells
- [ ] Warning icons for non-critical issues
- [ ] Tooltip explanations for warnings
- [ ] Validation summary panel
- [ ] Option to suppress specific warnings

## Epic 10: Performance and Reliability

### Story 10.1: Large Project Performance
**As an** electrical engineer  
**I want** the application to handle large projects smoothly  
**So that** I can work on major facilities without slowdowns

**Acceptance Criteria:**
- [ ] Handle 1000+ cables without lag
- [ ] Virtual scrolling for large tables
- [ ] Efficient filtering and sorting
- [ ] Reasonable memory usage
- [ ] Background calculations don't block UI

### Story 10.2: Data Recovery
**As an** electrical engineer  
**I want** protection against data loss  
**So that** my work is safe from crashes or corruption

**Acceptance Criteria:**
- [ ] Auto-save every 30 seconds
- [ ] Backup copy before major operations
- [ ] Recovery mode for corrupted files
- [ ] Export project data as failsafe
- [ ] Crash recovery with last saved state

### Story 10.3: Cross-Platform Compatibility
**As an** electrical engineer  
**I want** the application to work on different operating systems  
**So that** I can use it regardless of my computer setup

**Acceptance Criteria:**
- [ ] Windows (primary target)
- [ ] macOS compatibility
- [ ] Consistent UI across platforms
- [ ] File format compatibility
- [ ] Similar performance characteristics

## Testing Acceptance Criteria

Each user story must also meet these testing requirements:

**Unit Tests:**
- [ ] All business logic functions have unit tests
- [ ] Database operations are tested
- [ ] Calculation functions are validated
- [ ] Edge cases and error conditions are covered

**Integration Tests:**
- [ ] File operations (save/load) are tested
- [ ] Import/export workflows are validated
- [ ] Cross-component interactions work correctly
- [ ] Database schema migrations are tested

**End-to-End Tests:**
- [ ] Complete user workflows are automated
- [ ] Performance with large datasets is verified
- [ ] Error handling and recovery are tested
- [ ] Cross-platform functionality is validated

**User Acceptance Tests:**
- [ ] Real engineers can complete typical tasks
- [ ] Interface is intuitive without training
- [ ] Performance meets professional expectations
- [ ] Output matches industry standards