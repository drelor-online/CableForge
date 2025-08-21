import React, { useState, useEffect } from 'react';

interface ColumnDefinition {
  field: string;
  headerName: string;
  visible: boolean;
  pinned?: boolean;
  width?: number;
  category: 'core' | 'electrical' | 'physical' | 'routing' | 'metadata';
  required?: boolean;
}

interface ColumnManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (columns: ColumnDefinition[]) => void;
  currentColumns: ColumnDefinition[];
}

const defaultColumns: ColumnDefinition[] = [
  // Core fields (always visible)
  { field: 'tag', headerName: 'Tag', visible: true, pinned: true, width: 120, category: 'core', required: true },
  { field: 'description', headerName: 'Description', visible: true, width: 200, category: 'core' },
  
  // Electrical
  { field: 'function', headerName: 'Function', visible: true, width: 120, category: 'electrical' },
  { field: 'voltage', headerName: 'Voltage', visible: true, width: 100, category: 'electrical' },
  { field: 'current', headerName: 'Current', visible: false, width: 100, category: 'electrical' },
  { field: 'segregationClass', headerName: 'Segregation', visible: false, width: 120, category: 'electrical' },
  
  // Physical
  { field: 'cableType', headerName: 'Cable Type', visible: true, width: 120, category: 'physical' },
  { field: 'size', headerName: 'Size', visible: true, width: 100, category: 'physical' },
  { field: 'cores', headerName: 'Cores', visible: true, width: 80, category: 'physical' },
  { field: 'manufacturer', headerName: 'Manufacturer', visible: false, width: 140, category: 'physical' },
  { field: 'partNumber', headerName: 'Part Number', visible: false, width: 140, category: 'physical' },
  { field: 'outerDiameter', headerName: 'OD (mm)', visible: false, width: 100, category: 'physical' },
  
  // Routing
  { field: 'fromLocation', headerName: 'From Location', visible: false, width: 140, category: 'routing' },
  { field: 'fromEquipment', headerName: 'From Equipment', visible: true, width: 140, category: 'routing' },
  { field: 'toLocation', headerName: 'To Location', visible: false, width: 140, category: 'routing' },
  { field: 'toEquipment', headerName: 'To Equipment', visible: true, width: 140, category: 'routing' },
  { field: 'route', headerName: 'Route', visible: true, width: 100, category: 'routing' },
  { field: 'length', headerName: 'Length', visible: true, width: 100, category: 'routing' },
  { field: 'sparePercentage', headerName: 'Spare %', visible: false, width: 100, category: 'routing' },
  { field: 'calculatedLength', headerName: 'Calc. Length', visible: false, width: 120, category: 'routing' },
  
  // Metadata
  { field: 'notes', headerName: 'Notes', visible: false, width: 200, category: 'metadata' },
  { field: 'voltageDropPercentage', headerName: 'Voltage Drop %', visible: false, width: 130, category: 'metadata' },
  { field: 'segregationWarning', headerName: 'Segregation Warning', visible: false, width: 160, category: 'metadata' },
];

const categoryLabels = {
  core: 'Core Information',
  electrical: 'Electrical Properties',
  physical: 'Physical Properties', 
  routing: 'Routing & Installation',
  metadata: 'Analysis & Metadata'
};

const categoryIcons = {
  core: '📋',
  electrical: '⚡',
  physical: '🔌',
  routing: '🗺️',
  metadata: '📊'
};

const ColumnManagerModal: React.FC<ColumnManagerModalProps> = ({
  isOpen,
  onClose,
  onApply,
  currentColumns
}) => {
  const [columns, setColumns] = useState<ColumnDefinition[]>(defaultColumns);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Initialize columns from current state when modal opens
  useEffect(() => {
    if (isOpen && currentColumns.length > 0) {
      setColumns(currentColumns);
    } else if (isOpen) {
      setColumns(defaultColumns);
    }
  }, [isOpen, currentColumns]);

  const handleColumnToggle = (field: string) => {
    setColumns(prev => prev.map(col => 
      col.field === field 
        ? { ...col, visible: col.required ? true : !col.visible }
        : col
    ));
  };

  const handleColumnPinToggle = (field: string) => {
    setColumns(prev => prev.map(col => 
      col.field === field 
        ? { ...col, pinned: !col.pinned }
        : col
    ));
  };

  const handleWidthChange = (field: string, width: number) => {
    setColumns(prev => prev.map(col => 
      col.field === field 
        ? { ...col, width: Math.max(50, Math.min(500, width)) }
        : col
    ));
  };

  const handleCategoryToggle = (category: keyof typeof categoryLabels) => {
    const categoryColumns = columns.filter(col => col.category === category);
    const allVisible = categoryColumns.every(col => col.visible || col.required);
    
    setColumns(prev => prev.map(col => 
      col.category === category && !col.required
        ? { ...col, visible: !allVisible }
        : col
    ));
  };

  const handlePreset = (preset: 'minimal' | 'standard' | 'detailed' | 'all') => {
    setColumns(prev => prev.map(col => {
      switch (preset) {
        case 'minimal':
          return { ...col, visible: col.required || ['description', 'function', 'fromEquipment', 'toEquipment'].includes(col.field) };
        case 'standard':
          return { ...col, visible: col.required || !['manufacturer', 'partNumber', 'outerDiameter', 'fromLocation', 'toLocation', 'sparePercentage', 'calculatedLength', 'notes', 'voltageDropPercentage', 'segregationWarning'].includes(col.field) };
        case 'detailed':
          return { ...col, visible: col.required || !['notes', 'voltageDropPercentage', 'segregationWarning'].includes(col.field) };
        case 'all':
          return { ...col, visible: true };
        default:
          return col;
      }
    }));
  };

  const handleReset = () => {
    setColumns(defaultColumns);
  };

  const handleApply = () => {
    onApply(columns);
    onClose();
  };

  const filteredColumns = columns.filter(col => {
    const matchesSearch = col.headerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         col.field.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || col.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedColumns = filteredColumns.reduce((groups, col) => {
    const category = col.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(col);
    return groups;
  }, {} as Record<string, ColumnDefinition[]>);

  const visibleCount = columns.filter(col => col.visible).length;
  const totalCount = columns.length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Column Manager
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Customize which columns are visible in the cable table
          </p>
        </div>

        {/* Controls */}
        <div className="px-6 py-4 border-b border-gray-200 space-y-4">
          {/* Search and Filter */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search columns:
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Search by column name..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by category:
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                {Object.entries(categoryLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Presets */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick presets:
            </label>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => handlePreset('minimal')}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
              >
                Minimal View
              </button>
              <button
                onClick={() => handlePreset('standard')}
                className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
              >
                Standard View
              </button>
              <button
                onClick={() => handlePreset('detailed')}
                className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
              >
                Detailed View
              </button>
              <button
                onClick={() => handlePreset('all')}
                className="px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors"
              >
                Show All
              </button>
              <button
                onClick={handleReset}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                Reset to Default
              </button>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-blue-50 p-3 rounded">
            <div className="text-sm text-blue-800">
              <span className="font-medium">{visibleCount}</span> of <span className="font-medium">{totalCount}</span> columns visible
            </div>
          </div>
        </div>

        {/* Column List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {Object.entries(groupedColumns).map(([category, categoryColumns]) => (
            <div key={category} className="mb-6">
              {/* Category Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{categoryIcons[category as keyof typeof categoryIcons]}</span>
                  <h4 className="text-sm font-medium text-gray-900">
                    {categoryLabels[category as keyof typeof categoryLabels]}
                  </h4>
                  <span className="text-xs text-gray-500">
                    ({categoryColumns.filter(col => col.visible).length}/{categoryColumns.length})
                  </span>
                </div>
                {category !== 'core' && (
                  <button
                    onClick={() => handleCategoryToggle(category as keyof typeof categoryLabels)}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Toggle All
                  </button>
                )}
              </div>

              {/* Columns in Category */}
              <div className="space-y-2">
                {categoryColumns.map(column => (
                  <div
                    key={column.field}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded border hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={column.visible}
                        onChange={() => handleColumnToggle(column.field)}
                        disabled={column.required}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 disabled:opacity-50"
                      />
                      
                      <div>
                        <div className="font-medium text-sm text-gray-900">
                          {column.headerName}
                          {column.required && (
                            <span className="ml-2 text-xs text-red-600 bg-red-100 px-1 rounded">
                              Required
                            </span>
                          )}
                          {column.pinned && (
                            <span className="ml-2 text-xs text-blue-600 bg-blue-100 px-1 rounded">
                              Pinned
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          Field: {column.field}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Width Control */}
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500">Width:</span>
                        <input
                          type="number"
                          value={column.width || 100}
                          onChange={(e) => handleWidthChange(column.field, parseInt(e.target.value) || 100)}
                          className="w-16 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          min="50"
                          max="500"
                          step="10"
                        />
                      </div>

                      {/* Pin Control */}
                      {!column.required && (
                        <button
                          onClick={() => handleColumnPinToggle(column.field)}
                          className={`p-1 rounded text-xs ${
                            column.pinned 
                              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                          title={column.pinned ? 'Unpin column' : 'Pin column to left'}
                        >
                          📌
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default ColumnManagerModal;