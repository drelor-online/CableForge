# CableForge Icon System

## Overview
CableForge uses Lucide React for consistent, professional icons throughout the application. This document outlines our icon standards and usage guidelines.

## Icon Library
We use **Lucide React** as our primary icon library:
- Clean, minimal design perfect for engineering UIs
- Consistent stroke width and style
- Tree-shakeable (only imports icons you use)
- Over 1000+ icons available
- Perfect for data/engineering applications

## Icon Sizing System

### CSS Classes Available
```css
.icon-xs     /* h-3 w-3  - 12px - Small inline icons */
.icon-sm     /* h-4 w-4  - 16px - Secondary actions, table cells */
.icon-md     /* h-5 w-5  - 20px - Primary buttons, form elements */
.icon-lg     /* h-6 w-6  - 24px - Close buttons, prominent actions */
.icon-xl     /* h-8 w-8  - 32px - Primary CTAs, hero actions */
.icon-hero   /* h-12 w-12 - 48px - Upload areas, empty states */
.icon-jumbo  /* h-16 w-16 - 64px - Large empty states */
```

### Usage Examples
```tsx
import { Search, Settings, Download } from 'lucide-react';

// Small inline icon
<Search className="icon-xs" />

// Standard form icon
<Search className="icon-sm" />

// Button icon
<Download className="icon-md" />

// Close button
<X className="icon-lg" />

// Hero action
<Upload className="icon-xl" />

// Empty state
<FolderOpen className="icon-hero" />
```

## Color System

### CSS Classes Available
```css
.icon-default  /* text-gray-600 - Default state */
.icon-muted    /* text-gray-400 - Disabled/muted */
.icon-primary  /* text-blue-600 - Primary actions */
.icon-success  /* text-green-500 - Success states */
.icon-warning  /* text-yellow-500 - Warning states */
.icon-danger   /* text-red-500 - Error/danger states */
.icon-info     /* text-blue-500 - Info states */
```

### Interactive States
```css
.icon-interactive  /* Adds hover transition */
```

## Common Icon Mappings

### File Operations
- `FolderPlus` - New project
- `FolderOpen` - Open project
- `Save` - Save
- `FileDown` - Save As
- `Upload` - Import
- `Download` - Export/Download
- `ClipboardList` - Save as Template

### Actions
- `Edit2` - Edit
- `Trash2` - Delete
- `Copy` - Duplicate
- `Search` - Search
- `Settings` - Settings/Configuration
- `Plus` / `PlusCircle` - Add new

### Status & Validation
- `CheckCircle` - Success/Valid
- `AlertTriangle` - Warning
- `XCircle` - Error
- `Info` - Information
- `Zap` - Electrical/Power

### Navigation
- `ChevronDown` - Dropdown
- `ChevronUp` - Collapse
- `ChevronLeft` - Back
- `ChevronRight` - Forward
- `X` - Close

### Engineering Specific
- `Cable` - Physical cable properties
- `Zap` - Electrical properties
- `MapPin` - Routing/Location
- `BarChart3` - Analysis/Metadata
- `Database` - Multi-sheet export
- `FileText` - Single document

## Implementation Examples

### CompactHeader.tsx
```tsx
import { Search, Settings, Download, Upload, ChevronDown } from 'lucide-react';

// Search button
<Search className="h-4 w-4" />

// Settings button  
<Settings className="h-4 w-4" />

// Export dropdown
<Download className="h-4 w-4" />
<ChevronDown className="h-3 w-3 ml-1" />
```

### Table Actions
```tsx
import { Edit2, Trash2, Copy } from 'lucide-react';

// Edit action
<Edit2 className="h-4 w-4" />

// Delete action  
<Trash2 className="h-4 w-4" />

// Duplicate action
<Copy className="h-4 w-4" />
```

### Modal Headers
```tsx
import { X } from 'lucide-react';

// Close button
<X className="h-5 w-5" />
```

## Best Practices

### 1. Consistent Sizing
- Use CSS classes for sizing: `icon-sm`, `icon-md`, etc.
- Don't mix Tailwind classes with our icon classes
- Match icon size to context (small for inline, medium for buttons)

### 2. Semantic Icons
- Choose icons that clearly represent the action
- Use consistent icons for the same actions across the app
- `Edit2` for edit, `Trash2` for delete, `Search` for search

### 3. Color Usage
- Use semantic colors: red for danger, green for success
- Default gray for most actions
- Primary blue for important actions

### 4. Accessibility
- Icons inherit text color for screen readers
- Use proper ARIA labels when needed
- Ensure sufficient contrast ratios

### 5. Performance
- Import only the icons you use
- Tree-shaking eliminates unused icons from the bundle

## Migration Notes

### From Inline SVGs
**Before:**
```tsx
<svg className="w-4 h-4" fill="none" stroke="currentColor">
  <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5"/>
</svg>
```

**After:**
```tsx
import { Edit2 } from 'lucide-react';
<Edit2 className="h-4 w-4" />
```

### From Emojis
**Before:**
```tsx
<span>✏️</span>
```

**After:**
```tsx
import { Edit2 } from 'lucide-react';
<Edit2 className="h-4 w-4" />
```

## Future Enhancements

### Planned Additions
- Dark mode icon variants
- Loading/spinner states
- Animation utilities
- Brand-specific engineering icons
- Icon button components

### Custom Icons
If we need custom engineering icons not available in Lucide:
1. Create SVG icons following Lucide's style guide
2. 24x24 viewBox
3. 2px stroke width
4. Consistent style with existing icons