import React, { useState, useMemo, useCallback } from 'react';
import { ColumnDefinition } from '../../services/column-service';
import { FilterCondition, filterService } from '../../services/filter-service';
import { FilterConfigService } from '../../config/filter-types';
import { Filter, X, ChevronDown, ChevronUp, Save, FolderOpen } from 'lucide-react';
import { colors, theme, spacing, typography } from '../../theme';
import { Icon } from '../common/Icon';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import FilterDropdown from './FilterDropdown';

interface CompactFilterBarProps {
  columns: ColumnDefinition[];
  data: any[];
  onFiltersChange: (filters: FilterCondition[]) => void;
  className?: string;
}

interface FilterPreset {
  id: string;
  name: string;
  description?: string;
  filters: FilterCondition[];
  createdAt: Date;
}

const CompactFilterBar: React.FC<CompactFilterBarProps> = ({
  columns,
  data,
  onFiltersChange,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPresetMenu, setShowPresetMenu] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const { value: filterPresets, setValue: setFilterPresets } = useLocalStorage<FilterPreset[]>('filter-presets', []);
  
  const filterState = filterService.getFilterState();
  const activeFilters = filterState.activeFilters;

  // Get filterable columns
  const filterableColumns = useMemo(() => {
    return columns.filter(col => 
      col.visible && 
      col.field !== 'actions' && 
      col.field !== 'selection'
    );
  }, [columns]);

  // Get field type for filtering using centralized configuration
  const getFieldType = (field: string): FilterCondition['type'] => {
    return FilterConfigService.getFieldType(field);
  };

  // Handle filter change
  const handleFilterChange = useCallback((field: string, filter: FilterCondition | null) => {
    let newFilters: FilterCondition[];
    
    if (filter) {
      newFilters = activeFilters.filter(f => f.field !== field);
      newFilters.push(filter);
    } else {
      newFilters = activeFilters.filter(f => f.field !== field);
    }
    
    filterService.setActiveFilters(newFilters);
    onFiltersChange(newFilters);
  }, [activeFilters, onFiltersChange]);

  // Clear all filters
  const handleClearAllFilters = useCallback(() => {
    filterService.clearAllFilters();
    onFiltersChange([]);
  }, [onFiltersChange]);

  // Get current filter for a field
  const getCurrentFilter = useCallback((field: string): FilterCondition | undefined => {
    return activeFilters.find(f => f.field === field);
  }, [activeFilters]);

  // Save current filters as preset
  const handleSavePreset = useCallback(() => {
    if (!presetName.trim() || activeFilters.length === 0) return;

    const newPreset: FilterPreset = {
      id: `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: presetName.trim(),
      filters: [...activeFilters],
      createdAt: new Date()
    };

    setFilterPresets(prev => [...prev, newPreset]);
    setPresetName('');
    setShowSaveDialog(false);
  }, [presetName, activeFilters, setFilterPresets]);

  // Load preset
  const handleLoadPreset = useCallback((preset: FilterPreset) => {
    filterService.setActiveFilters(preset.filters);
    onFiltersChange(preset.filters);
    setShowPresetMenu(false);
  }, [onFiltersChange]);

  // Delete preset
  const handleDeletePreset = useCallback((presetId: string) => {
    setFilterPresets(prev => prev.filter(p => p.id !== presetId));
  }, [setFilterPresets]);

  const hasActiveFilters = activeFilters.length > 0;
  const filteredCount = hasActiveFilters ? filterService.applyFilters(data).length : data.length;

  return (
    <div className={className} style={{ borderBottom: `1px solid ${colors.gray[200]}` }}>
      {/* Compact Header Bar */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: `${spacing[2]} ${spacing[4]}`,
          backgroundColor: colors.gray[50],
          cursor: 'pointer',
          minHeight: theme.heights.tableRow,
          transition: 'background-color 0.2s ease'
        }}
        onClick={() => setIsExpanded(!isExpanded)}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.gray[100]}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.gray[50]}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing[4] }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
            <Icon icon={Filter} size="sm" color={colors.gray[600]} />
            <span style={{
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.medium,
              color: colors.gray[700]
            }}>
              {hasActiveFilters ? `${filteredCount} of ${data.length} rows` : `All ${data.length} rows`}
            </span>
          </div>
          
          {hasActiveFilters && (
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
              {activeFilters.slice(0, 3).map(filter => {
                const column = filterableColumns.find(col => col.field === filter.field);
                return (
                  <div
                    key={filter.field}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: spacing[1],
                      padding: `${spacing[1]} ${spacing[2]}`,
                      borderRadius: theme.borderRadius.sm,
                      backgroundColor: colors.blue[100],
                      color: colors.blue[800],
                      fontSize: typography.fontSize.xs
                    }}
                  >
                    <span style={{ fontWeight: typography.fontWeight.medium }}>
                      {column?.headerName || filter.field}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFilterChange(filter.field, null);
                      }}
                      style={{
                        marginLeft: spacing[1],
                        padding: spacing[1],
                        borderRadius: theme.borderRadius.sm,
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: colors.blue[600],
                        cursor: 'pointer',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.blue[200]}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <Icon icon={X} size="xs" />
                    </button>
                  </div>
                );
              })}
              {activeFilters.length > 3 && (
                <span style={{
                  fontSize: typography.fontSize.xs,
                  color: colors.gray[500]
                }}>
                  +{activeFilters.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
          {hasActiveFilters && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClearAllFilters();
              }}
              style={{
                fontSize: typography.fontSize.xs,
                padding: `${spacing[1]} ${spacing[2]}`,
                borderRadius: theme.borderRadius.sm,
                backgroundColor: 'transparent',
                border: 'none',
                color: colors.red[600],
                cursor: 'pointer',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.red[50]}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              Clear All
            </button>
          )}
          
          <div style={{ position: 'relative' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowPresetMenu(!showPresetMenu);
              }}
              style={{
                fontSize: typography.fontSize.xs,
                padding: `${spacing[1]} ${spacing[2]}`,
                borderRadius: theme.borderRadius.sm,
                backgroundColor: 'transparent',
                border: 'none',
                color: colors.gray[600],
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: spacing[1],
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.gray[200]}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <Icon icon={FolderOpen} size="xs" />
              Presets
            </button>
            
            {showPresetMenu && (
              <div 
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  marginTop: spacing[1],
                  backgroundColor: colors.background.primary,
                  borderRadius: theme.borderRadius.md,
                  boxShadow: theme.shadows.lg,
                  zIndex: 50,
                  minWidth: '192px',
                  border: `1px solid ${colors.gray[200]}`
                }}
              >
                <div style={{ padding: spacing[2] }}>
                  <div style={{
                    fontSize: typography.fontSize.xs,
                    fontWeight: typography.fontWeight.medium,
                    color: colors.gray[700],
                    marginBottom: spacing[2]
                  }}>Filter Presets</div>
                  
                  {hasActiveFilters && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowSaveDialog(true);
                        setShowPresetMenu(false);
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: `${spacing[1]} ${spacing[2]}`,
                        fontSize: typography.fontSize.xs,
                        borderRadius: theme.borderRadius.sm,
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: colors.green[600],
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: spacing[1],
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.gray[50]}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <Icon icon={Save} size="xs" />
                      Save Current Filters
                    </button>
                  )}
                  
                  {filterPresets.length > 0 && (
                    <>
                      <div style={{
                        borderTop: `1px solid ${colors.gray[200]}`,
                        margin: `${spacing[2]} 0`
                      }}></div>
                      {filterPresets.map(preset => (
                        <div key={preset.id} style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <button
                            onClick={() => handleLoadPreset(preset)}
                            style={{
                              flex: 1,
                              textAlign: 'left',
                              padding: `${spacing[1]} ${spacing[2]}`,
                              fontSize: typography.fontSize.xs,
                              borderRadius: theme.borderRadius.sm,
                              backgroundColor: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              transition: 'background-color 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.gray[50]}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <div style={{ fontWeight: typography.fontWeight.medium }}>{preset.name}</div>
                            <div style={{ color: colors.gray[500] }}>{preset.filters.length} filters</div>
                          </button>
                          <button
                            onClick={() => handleDeletePreset(preset.id)}
                            style={{
                              opacity: 0,
                              padding: spacing[1],
                              backgroundColor: 'transparent',
                              border: 'none',
                              borderRadius: theme.borderRadius.sm,
                              color: colors.red[600],
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = colors.red[50];
                              e.currentTarget.style.opacity = '1';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.opacity = '0';
                            }}
                            onFocus={(e) => e.currentTarget.style.opacity = '1'}
                            onBlur={(e) => e.currentTarget.style.opacity = '0'}
                          >
                            <Icon icon={X} size="xs" />
                          </button>
                        </div>
                      ))}
                    </>
                  )}
                  
                  {filterPresets.length === 0 && !hasActiveFilters && (
                    <div style={{
                      fontSize: typography.fontSize.xs,
                      color: colors.gray[500],
                      textAlign: 'center',
                      padding: spacing[2]
                    }}>
                      No presets saved yet
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div style={{ width: '16px', height: '16px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isExpanded ? (
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke={colors.gray[500]} 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                style={{ flexShrink: 0 }}
              >
                <path d="m18 15-6-6-6 6"/>
              </svg>
            ) : (
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke={colors.gray[500]} 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                style={{ flexShrink: 0 }}
              >
                <path d="m6 9 6 6 6-6"/>
              </svg>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Filter Panel */}
      {isExpanded && (
        <div style={{
          backgroundColor: colors.background.primary,
          borderTop: `1px solid ${colors.gray[200]}`
        }}>
          <div style={{ padding: spacing[6] }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: spacing[6]
            }}>
              {filterableColumns.map(column => {
                const fieldType = getFieldType(column.field);
                const currentFilter = getCurrentFilter(column.field);
                
                return (
                  <div key={column.field}>
                    <label style={{
                      display: 'block',
                      fontSize: typography.fontSize.xs,
                      fontWeight: typography.fontWeight.medium,
                      color: colors.gray[700],
                      marginBottom: spacing[1]
                    }}>
                      {column.headerName}
                    </label>
                    <FilterDropdown
                      field={column.field}
                      headerName={column.headerName}
                      type={fieldType}
                      data={data}
                      currentFilter={currentFilter}
                      onFilterChange={(filter) => handleFilterChange(column.field, filter)}
                      className="w-full"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Save Preset Dialog */}
      {showSaveDialog && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50
        }}>
          <div 
            style={{
              backgroundColor: colors.background.primary,
              borderRadius: theme.borderRadius.lg,
              boxShadow: theme.shadows.xl,
              padding: spacing[6],
              width: '320px',
              border: `1px solid ${colors.gray[200]}`
            }}
          >
            <h3 style={{
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.medium,
              color: colors.gray[900],
              marginBottom: spacing[4]
            }}>Save Filter Preset</h3>
            <input
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="Enter preset name"
              style={{
                width: '100%',
                padding: `${spacing[2]} ${spacing[4]}`,
                fontSize: typography.fontSize.sm,
                border: `1px solid ${colors.gray[300]}`,
                borderRadius: theme.borderRadius.md,
                outline: 'none',
                transition: 'border-color 0.2s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = colors.blue[500];
                e.target.style.boxShadow = `0 0 0 1px ${colors.blue[500]}`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = colors.gray[300];
                e.target.style.boxShadow = 'none';
              }}
              autoFocus
            />
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: spacing[2],
              marginTop: spacing[6]
            }}>
              <button
                onClick={() => {
                  setShowSaveDialog(false);
                  setPresetName('');
                }}
                style={{
                  padding: `${spacing[1]} ${spacing[4]}`,
                  fontSize: typography.fontSize.xs,
                  color: colors.gray[600],
                  border: `1px solid ${colors.gray[300]}`,
                  borderRadius: theme.borderRadius.sm,
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.gray[50]}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                Cancel
              </button>
              <button
                onClick={handleSavePreset}
                disabled={!presetName.trim()}
                style={{
                  padding: `${spacing[1]} ${spacing[4]}`,
                  fontSize: typography.fontSize.xs,
                  color: colors.text.inverse,
                  backgroundColor: colors.blue[600],
                  border: 'none',
                  borderRadius: theme.borderRadius.sm,
                  cursor: 'pointer',
                  opacity: presetName.trim() ? 1 : 0.5,
                  transition: 'opacity 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (presetName.trim()) {
                    e.currentTarget.style.opacity = '0.9';
                  }
                }}
                onMouseLeave={(e) => {
                  if (presetName.trim()) {
                    e.currentTarget.style.opacity = '1';
                  }
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompactFilterBar;