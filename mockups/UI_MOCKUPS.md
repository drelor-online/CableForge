# CableForge UI Mockups

## 1. Main Application Window

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ CableForge - Project: Compressor Station Alpha [Modified*]                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ File  Edit  View  Tools  Help                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ 📁 New  💾 Save  📥 Import  📤 Export  🔧 Settings     [Project: Rev 2.3]    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ┌─[Cables]─┐ ┌─[I/O List]─┐ ┌─[Conduits]─┐ ┌─[Loads]─┐ ┌─[Reports]─┐      │
│ │ •••••••• │ │           │ │            │ │         │ │           │      │
│ └──────────┘ └───────────┘ └────────────┘ └─────────┘ └───────────┘      │
│                                                                             │
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │
│ ┃                         CABLES TABLE                                   ┃ │
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ Cables: 247 | I/O Points: 89 | Conduits: 15 | Fill Warnings: 3 | Ready    │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 2. Cables Table View (Detailed)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🔍 Search: [                    ] 📋 Add Cable  📚 Add from Library        │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌─Tag────┐ ┌─Description──────┐ ┌─Function┐ ┌─From─────┐ ┌─To───────┐ ▼    │
│ │ ▼ □    │ │ ▼               │ │ ▼       │ │ ▼       │ │ ▼       │     │
│ ├─────────┼─────────────────────┼──────────┼──────────┼──────────┼─────┤
│ │☑ C-001  │ Control Power      │ Power    │ MCC-1    │ PLC-1    │ ... │
│ │☑ C-002  │ 4-20mA Signal      │ Signal   │ FT-001   │ PLC-1    │ ... │
│ │  C-003  │ Temperature RTD    │ Signal   │ TT-002   │ PLC-1    │ ⚠️   │
│ │  C-004  │ Motor Power        │ Power    │ MCC-2    │ M-001    │ ... │
│ │  C-005  │ Spare             │ Spare    │ -        │ -        │ ... │
│ │  ...    │ ...               │ ...      │ ...      │ ...      │ ... │
│ └─────────┴─────────────────────┴──────────┴──────────┴──────────┴─────┘
│                                                                             │
│ ┌─Size──┐ ┌─Cores┐ ┌─Length┐ ┌─Route─────┐ ┌─V.Drop┐ ┌─Notes────────┐    │
│ │ ▼     │ │ ▼    │ │ ▼     │ │ ▼        │ │ ▼     │ │ ▼           │    │
│ ├───────┼──────┼────────┼───────────┼────────┼──────────────┤
│ │ 14AWG │ 2    │ 120'   │ C01,C05   │ 1.2%   │ Control power│
│ │ 18AWG │ 2    │ 85'    │ C01,C02   │ -      │ Shielded     │
│ │ 16AWG │ 3    │ 95'    │ C01,C02   │ -      │ RTD extension│
│ │ 4/0   │ 3    │ 200'   │ C10       │ 2.8%   │ Motor feeder │
│ │ -     │ -    │ -      │ -         │ -      │ Future use   │
│ │ ...   │ ...  │ ...    │ ...       │ ...    │ ...          │
│ └───────┴──────┴────────┴───────────┴────────┴──────────────┘
│                                                                             │
│ Selected: 2 rows | Right-click for options | Ctrl+A: Select All            │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 3. I/O List Table View

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🔍 Search: [signal]           📋 Add I/O Point  📚 Add from Library         │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌─Tag────┐ ┌─Description──────┐ ┌─Type┐ ┌─Signal───┐ ┌─PLC──┐ ┌─Rack┐ ▼     │
│ │ ▼ □    │ │ ▼               │ │ ▼   │ │ ▼        │ │ ▼    │ │ ▼   │       │
│ ├─────────┼─────────────────────┼──────┼───────────┼───────┼──────┼─────┤
│ │☑ FT-001│ Gas Flow Meter     │ AI   │ 4-20mA    │ PLC-1 │ 1    │ ... │
│ │  PT-002│ Inlet Pressure     │ AI   │ 4-20mA    │ PLC-1 │ 1    │ ... │
│ │  TT-003│ Gas Temperature    │ AI   │ RTD       │ PLC-1 │ 2    │ ... │
│ │  XV-004│ Shutdown Valve     │ DO   │ 24VDC     │ PLC-1 │ 3    │ ... │
│ │  ZS-005│ Valve Position     │ DI   │ Dry Cont. │ PLC-1 │ 3    │ ⚠️   │
│ │  ...   │ ...                │ ... │ ...       │ ...   │ ... │ ... │
│ └─────────┴─────────────────────┴──────┴───────────┴───────┴──────┴─────┘
│                                                                             │
│ ┌─Slot─┐ ┌─Chan┐ ┌─Cable───┐ ┌─Terminal─┐ ┌─Notes──────────────────┐        │
│ │ ▼    │ │ ▼   │ │ ▼       │ │ ▼        │ │ ▼                     │        │
│ ├──────┼──────┼──────────┼───────────┼────────────────────────┤
│ │ 4    │ 1    │ C-002    │ TB-01-05  │ Compensated flow       │
│ │ 4    │ 2    │ C-006    │ TB-01-06  │ Upstream pressure      │
│ │ 8    │ 1    │ C-003    │ TB-02-01  │ 3-wire RTD            │
│ │ 12   │ 1    │ C-015    │ TB-03-05  │ Emergency shutdown     │
│ │ 16   │ 1    │ C-018    │ TB-04-02  │ CONFLICT! ⚠️          │
│ │ ...  │ ...  │ ...      │ ...       │ ...                   │
│ └──────┴──────┴──────────┴───────────┴────────────────────────┘
│                                                                             │
│ PLC-1: 28/64 channels used | Next available: Rack 2, Slot 8, Chan 3        │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 4. Conduits Table View

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🔍 Search: [              ] 📋 Add Conduit                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌─Tag──┐ ┌─Type─┐ ┌─Size─┐ ┌─From─────┐ ┌─To───────┐ ┌─Fill%┐ ┌─Status┐ ▼   │
│ │ ▼ □  │ │ ▼    │ │ ▼    │ │ ▼        │ │ ▼        │ │ ▼    │ │ ▼     │     │
│ ├──────┼───────┼───────┼───────────┼───────────┼───────┼────────┼───┤
│ │☑ C01 │ EMT   │ 1"    │ MCC-1     │ JB-01     │ 35%   │ ✓ OK   │...│
│ │  C02 │ EMT   │ 3/4"  │ JB-01     │ PLC-1     │ 42%   │ ⚠️ FULL │...│
│ │  C03 │ EMT   │ 2"    │ JB-01     │ Field     │ 28%   │ ✓ OK   │...│
│ │  C04 │ PVC   │ 4"    │ MCC-2     │ M-001     │ 65%   │ ❌ OVER │...│
│ │  C05 │ EMT   │ 1.5"  │ Field     │ PLC-1     │ 22%   │ ✓ OK   │...│
│ │  ... │ ...   │ ...   │ ...       │ ...       │ ...   │ ...    │...│
│ └──────┴───────┴───────┴───────────┴───────────┴───────┴────────┴───┘
│                                                                             │
│ Double-click conduit to see cable list:                                    │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ Conduit C02 (3/4" EMT) - Fill: 42% (⚠️ Near Limit)                     │ │
│ │ ┌─Cable─┐ ┌─Description────┐ ┌─Size──┐ ┌─OD────┐ ┌─Area───┐          │ │
│ │ │ C-002  │ 4-20mA Signal   │ 18AWG  │ 0.25"  │ 0.049"² │          │ │
│ │ │ C-003  │ RTD Signal      │ 16AWG  │ 0.32"  │ 0.080"² │          │ │
│ │ │ C-007  │ Digital Input   │ 18AWG  │ 0.25"  │ 0.049"² │          │ │
│ │ │ C-012  │ Control Power   │ 14AWG  │ 0.45"  │ 0.159"² │          │ │
│ │ └────────┴─────────────────┴────────┴────────┴─────────┘          │ │
│ │ Total Cable Area: 0.337"² | Conduit Area: 0.8"² | Fill: 42%       │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ Total: 15 conduits | 3 over capacity | 5 near capacity (>35%)              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 5. Library Browser Modal

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Select from Cable Library                                              ✕    │
├─────────────────────────────────────────────────────────────────────────────┤
│ Library: [C:\Libraries\StandardCables.cfl ▼] [Browse...]                   │
│                                                                             │
│ 🔍 Search: [XLPE]                    Filter by: [All Types ▼]              │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ ┌─Name─────────────────┐ ┌─Size─┐ ┌─Type──┐ ┌─Voltage┐ ┌─Mfr──────┐   │ │
│ │ │ ▼                    │ │ ▼    │ │ ▼     │ │ ▼      │ │ ▼        │   │ │
│ │ ├──────────────────────┼───────┼────────┼─────────┼───────────┤   │ │
│ │ │☑ 600V XLPE 3/C+Gnd  │ 14AWG │ XLPE   │ 600V    │ Southwire │   │ │
│ │ │  600V XLPE 3/C+Gnd  │ 12AWG │ XLPE   │ 600V    │ Southwire │   │ │
│ │ │  600V XLPE 3/C+Gnd  │ 10AWG │ XLPE   │ 600V    │ Southwire │   │ │
│ │ │  IS Signal Cable     │ 18AWG │ IS     │ 300V    │ Belden    │   │ │
│ │ │  Control Cable       │ 16AWG │ THHN   │ 600V    │ General   │   │ │
│ │ │  ...                 │ ...   │ ...    │ ...     │ ...       │   │ │
│ │ └──────────────────────┴───────┴────────┴─────────┴───────────┘   │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ Selected: 600V XLPE 3/C+Gnd, 14AWG                                         │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ Part Number: SW-XLPE-3C14                                               │ │
│ │ Outer Diameter: 0.52"                                                   │ │
│ │ Ampacity: 25A (90°C rating)                                            │ │
│ │ Cores: 3 + Ground                                                       │ │
│ │ Temperature Rating: 90°C                                                │ │
│ │ Notes: Suitable for wet/dry locations, direct burial with protection   │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│                                        [Cancel]  [Use Selected]            │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 6. Export Template Builder

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Export Template Builder - Cable Schedule                              ✕    │
├─────────────────────────────────────────────────────────────────────────────┤
│ Template Name: [Client ABC Cable Schedule                    ] [Save As...] │
│                                                                             │
│ Available Fields:                    Export Columns:                       │
│ ┌─────────────────────────┐        ┌─────────────────────────────────────┐ │
│ │ □ tag                   │        │ 1. Cable Tag        [tag]           │ │
│ │ □ description           │ ──────→ │ 2. Description      [description]   │ │
│ │ □ function              │        │ 3. From Equipment   [from_equipment]│ │
│ │ □ voltage_level         │        │ 4. To Equipment     [to_equipment]  │ │
│ │ □ cable_type            │        │ 5. Cable Type       [cable_type]    │ │
│ │ □ size                  │        │ 6. Size             [size]          │ │
│ │ □ cores                 │        │ 7. Length (ft)      [length]        │ │
│ │ □ from_location         │        │ 8. Routing          [route]         │ │
│ │ □ from_equipment        │ ←────── │ 9. Notes            [notes]         │ │
│ │ □ to_location           │        │                     [↑] [↓] [✕]     │ │
│ │ □ to_equipment          │        └─────────────────────────────────────┘ │
│ │ □ length                │                                                │ │
│ │ □ calculated_length     │        Column Formatting:                      │ │
│ │ □ route                 │        ┌─────────────────────────────────────┐ │
│ │ □ voltage_drop_percent  │        │ Header Style: [Bold, Centered]      │ │
│ │ □ segregation_class     │        │ Column Width: [Auto-fit ▼]          │ │
│ │ □ manufacturer          │        │ Number Format: [General ▼]          │ │
│ │ □ part_number           │        │ Border Style: [All Borders ▼]       │ │
│ │ □ notes                 │        │ Background: [Light Gray ▼]          │ │
│ │ □ created_at            │        └─────────────────────────────────────┘ │
│ │ □ updated_at            │                                                │ │
│ └─────────────────────────┘        Filters & Sorting:                      │
│                                    ┌─────────────────────────────────────┐ │
│ Client Templates:                  │ ☑ Exclude spare cables              │ │
│ • ABC Standard Cable Sched         │ ☑ Sort by cable tag                 │ │
│ • XYZ Instrument Schedule          │ □ Group by function                  │ │
│ • DEF Combined Schedule            │ □ Include summary totals             │ │
│                                    └─────────────────────────────────────┘ │
│                                                                             │
│ [Preview Export]                              [Cancel]  [Save]  [Export]   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 7. Revision Comparison View

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Revision Comparison: v2.1 → v2.3                                      ✕    │
├─────────────────────────────────────────────────────────────────────────────┤
│ Base: Rev 2.1 (60% Review - 2024-08-15)  Compare: Rev 2.3 (Current)        │
│                                                                             │
│ Summary: 15 changes (3 added, 8 modified, 4 deleted)                       │
│                                                                             │
│ ┌─Type─┐ ┌─Tag──┐ ┌─Field────────┐ ┌─Old Value────┐ ┌─New Value────┐       │
│ │ ▼    │ │ ▼    │ │ ▼            │ │ ▼            │ │ ▼            │       │
│ ├──────┼───────┼───────────────┼───────────────┼───────────────┤
│ │ ➕ADD │ C-025 │ (new cable)   │              │ Motor Control  │
│ │ ➕ADD │ C-026 │ (new cable)   │              │ Signal Cable   │
│ │ ➕ADD │ C-027 │ (new cable)   │              │ Spare Cable    │
│ │ ✏️MOD │ C-003 │ length        │ 85'          │ 95'            │
│ │ ✏️MOD │ C-003 │ route         │ C01,C02      │ C01,C02,C08    │
│ │ ✏️MOD │ C-007 │ cable_type    │ THHN         │ XLPE           │
│ │ ✏️MOD │ C-012 │ from_location │ MCC-1        │ MCC-2          │
│ │ ✏️MOD │ C-015 │ size          │ 16AWG        │ 14AWG          │
│ │ ✏️MOD │ C-018 │ description   │ Flow Signal  │ Pressure Sig.  │
│ │ ✏️MOD │ C-021 │ spare_percent │ 10%          │ 15%            │
│ │ ✏️MOD │ C-023 │ segregation   │ Signal       │ IS Signal      │
│ │ ❌DEL │ C-008 │ (deleted)     │ Temp Signal  │                │
│ │ ❌DEL │ C-014 │ (deleted)     │ Control Pwr  │                │
│ │ ❌DEL │ C-019 │ (deleted)     │ Spare        │                │
│ │ ❌DEL │ C-022 │ (deleted)     │ Motor Power  │                │
│ └──────┴───────┴───────────────┴───────────────┴───────────────┘
│                                                                             │
│ Filter: [All Changes ▼]              Export Change Report: [Excel] [PDF]   │
│                                                                             │
│                                                   [Close]                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 8. Project Settings Dialog

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Project Settings                                                       ✕    │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌─General─┐ ┌─Calculations─┐ ┌─Validation─┐ ┌─Export─┐ ┌─Libraries─┐        │
│ │ •••••••• │ │            │ │           │ │        │ │           │        │
│ └──────────┘ └────────────┘ └───────────┘ └────────┘ └───────────┘        │
│                                                                             │
│ Project Information:                                                        │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ Project Name: [Compressor Station Alpha                          ]      │ │
│ │ Description:  [Main compressor station for Pipeline XYZ         ]      │ │
│ │ Client:       [ABC Gas Company                                   ]      │ │
│ │ Engineer:     [John Smith, PE                                    ]      │ │
│ │ Created:      2024-08-01                                                │ │
│ │ Modified:     2024-08-20                                                │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ Auto-Numbering:                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ Cable Prefix:   [C-    ] Starting Number: [001] Increment: [1]          │ │
│ │ I/O Prefix:     [IO-   ] Starting Number: [001] Increment: [1]          │ │
│ │ Conduit Prefix: [C     ] Starting Number: [01 ] Increment: [1]          │ │
│ │                                                                         │ │
│ │ Sample: C-001, C-002, C-003...                                          │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ Revision Control:                                                           │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ Current Major Revision: [IFC        ]                                   │ │
│ │ Auto-save interval: [30] seconds                                        │ │
│ │ Keep minor revisions: [50] (0 = unlimited)                             │ │
│ │ ☑ Create checkpoint on major revision                                   │ │
│ │ ☑ Track field-level changes                                             │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│                                         [Cancel]  [Apply]  [OK]            │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Key UI Design Principles

### 1. Excel-like Familiarity
- Inline cell editing with double-click
- Column headers for sorting and filtering
- Multi-select with checkboxes and Ctrl+click
- Copy/paste functionality
- Right-click context menus

### 2. Progressive Disclosure
- Main tabs for major sections (Cables, I/O, Conduits)
- Expandable details for complex items
- Collapsible panels for advanced features
- Optional fields hidden by default

### 3. Visual Feedback
- Color coding for warnings and errors
- Status indicators (✓ ⚠️ ❌)
- Progress bars for fill percentages
- Highlight modified fields

### 4. Efficiency Features
- Keyboard shortcuts for common operations
- Bulk edit capabilities
- Auto-complete and dropdowns
- Quick search and filter
- Recent items lists

### 5. Professional Appearance
- Clean, modern design
- Consistent spacing and typography
- Professional color scheme
- Clear hierarchy and organization
- Minimal distractions

## Next Steps

These mockups serve as the foundation for the actual UI implementation. Each view should be built as a React component with the following considerations:

1. **Responsive design** - Works on different screen sizes
2. **Accessibility** - Proper ARIA labels and keyboard navigation
3. **Performance** - Virtual scrolling for large datasets
4. **State management** - Consistent data flow with Zustand
5. **Testing** - Each component should have unit tests

The actual implementation will use AG-Grid for the table components and Tailwind CSS for styling, providing a professional and efficient user experience.