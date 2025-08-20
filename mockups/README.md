# CableForge Interactive Mockups

## Overview

This directory contains interactive HTML/CSS/JavaScript mockups for CableForge that demonstrate the complete user interface and experience. These mockups serve as the foundation for the React implementation and allow for early user testing and validation.

## Mockup Files

### Main Application
- **`html/index.html`** - Main application interface with tabbed layout
  - Cable schedule table with Excel-like editing
  - I/O list management (placeholder)
  - Conduit management (placeholder) 
  - Load management (placeholder)
  - Reports section (placeholder)

### Modal Dialogs
- **`html/library-browser.html`** - Cable library browser modal
  - Search and filter functionality
  - Detailed cable specifications
  - Selection and preview interface

- **`html/export-builder.html`** - Export template builder
  - Drag-and-drop column builder
  - Template configuration options
  - Live preview of export format

## Design System

### CSS Architecture
- **`css/base.css`** - CSS reset and base styles
- **`css/theme.css`** - Design tokens (colors, spacing, typography)
- **`css/layout.css`** - Application layout system
- **`css/components.css`** - UI component styles
- **`css/tables.css`** - Data table specific styles

### Design Tokens
The design system uses CSS custom properties for consistency:

```css
/* Primary colors */
--color-primary: #1e40af;        /* Professional blue */
--color-success: #059669;        /* Green for success states */
--color-warning: #d97706;        /* Orange for warnings */
--color-error: #dc2626;          /* Red for errors */

/* Engineering-specific colors */
--cable-power: #dc2626;          /* Red for power cables */
--cable-signal: #2563eb;         /* Blue for signal cables */
--cable-control: #059669;        /* Green for control cables */
--cable-spare: #9ca3af;          /* Gray for spare cables */
--cable-is: #7c3aed;             /* Purple for IS cables */
```

## Interactive Features

### Cable Table
- **Row selection** - Checkbox selection with select all
- **Column sorting** - Click headers to sort (visual feedback only)
- **Inline editing** - Double-click cells to edit
- **Cell actions** - Edit/delete buttons on hover
- **Status indicators** - Color-coded status and warnings
- **Auto-numbering simulation** - Add new cables with incremented tags

### Tab System
- **Tab switching** - Click tabs to change views
- **Status bar updates** - Different stats for each tab
- **Loading states** - Simulated loading for actions

### Modal Interactions
- **Library browser** - Radio selection with details panel
- **Export builder** - Drag-and-drop column configuration
- **Form interactions** - Real-time updates and validation

## How to View

### Local Development Server
1. Install a simple HTTP server:
   ```bash
   npm install -g http-server
   ```

2. Navigate to the mockups directory:
   ```bash
   cd CableForge/mockups
   ```

3. Start the server:
   ```bash
   http-server -p 8080
   ```

4. Open in browser:
   ```
   http://localhost:8080/html/index.html
   ```

### Alternative: Python Server
```bash
cd CableForge/mockups
python -m http.server 8080
```

### Direct File Opening
You can also open the HTML files directly in a modern browser, though some features may be limited due to file:// protocol restrictions.

## Key Features Demonstrated

### 1. Professional Engineering Interface
- Clean, professional design suitable for engineering work
- Excel-like table interactions familiar to engineers
- Status indicators and warnings for validation
- Professional color scheme and typography

### 2. Excel-like Data Entry
- Inline cell editing with double-click
- Tab navigation between cells
- Row selection and bulk operations
- Column sorting and filtering

### 3. Cable Type Management
- Color-coded cable types (Power, Signal, Control, IS, Spare)
- Visual segregation warnings
- Route tracking with multi-conduit support
- Real-time calculation displays

### 4. Library System
- Browsable cable libraries
- Detailed specifications display
- Search and filter capabilities
- Copy-to-project workflow

### 5. Export Configuration
- Drag-and-drop template builder
- Column customization
- Format options and styling
- Live preview functionality

### 6. Status and Feedback
- Real-time save status indicators
- Validation warnings and errors
- Progress indicators for calculations
- Contextual help and tooltips

## Technical Implementation

### Responsive Design
- Mobile-friendly responsive layouts
- Flexible grid system
- Scalable typography and spacing
- Touch-friendly interaction targets

### Accessibility
- Semantic HTML structure
- ARIA labels and roles
- Keyboard navigation support
- High contrast color schemes
- Screen reader compatibility

### Performance
- Optimized CSS with custom properties
- Minimal JavaScript for interactions
- Efficient DOM manipulation
- Smooth animations and transitions

## Browser Compatibility

### Tested Browsers
- Chrome 90+
- Firefox 85+
- Safari 14+
- Edge 90+

### Required Features
- CSS Custom Properties
- CSS Grid and Flexbox
- ES6 JavaScript features
- HTML5 form elements

## Validation Notes

### Engineering Workflow Testing
These mockups demonstrate:
1. **Cable entry workflow** - Adding and editing cable information
2. **Library usage** - Selecting from pre-defined cable types
3. **Export generation** - Creating client-specific deliverables
4. **Data validation** - Visual feedback for errors and warnings
5. **Bulk operations** - Efficient handling of large datasets

### User Experience Testing
Key areas for feedback:
- Table interaction patterns
- Modal dialog workflows
- Visual hierarchy and organization
- Status communication
- Error handling and recovery

## Next Steps

### Phase 1: User Validation
1. Share mockups with electrical engineers
2. Gather feedback on workflows and interactions
3. Identify pain points and improvement opportunities
4. Validate design decisions against requirements

### Phase 2: React Migration
1. Convert HTML structure to React components
2. Implement state management with Zustand
3. Add TypeScript interfaces and validation
4. Integrate with Tauri backend APIs

### Phase 3: Enhanced Functionality
1. Real data integration
2. Advanced calculations
3. Complex validation rules
4. Performance optimizations

## File Organization

```
mockups/
├── README.md              # This file
├── html/                  # HTML mockup pages
│   ├── index.html         # Main application
│   ├── library-browser.html
│   └── export-builder.html
├── css/                   # Stylesheet system
│   ├── base.css           # Reset and base styles
│   ├── theme.css          # Design tokens
│   ├── layout.css         # Layout system
│   ├── components.css     # UI components
│   └── tables.css         # Data tables
├── js/                    # JavaScript interactions
│   └── mockup-interactions.js
└── assets/                # Images and icons (future)
```

## Contributing

When updating mockups:
1. Maintain the established design system
2. Test interactions across different browsers
3. Ensure accessibility standards are met
4. Document any new patterns or components
5. Keep the design consistent with engineering workflows

The mockups are designed to be a living reference that evolves as we learn more about user needs and refine the application design.