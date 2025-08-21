import React from 'react';
import { ColDef } from 'ag-grid-community';
import { ColumnDefinition } from '../services/column-service';
import { Cable, CableFunction } from '../types';
import CableTypeBadge from '../components/ui/CableTypeBadge';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export function createColumnDef(column: ColumnDefinition): ColDef {
  const baseColDef: ColDef = {
    headerName: column.headerName,
    field: column.field,
    width: column.width || 100,
    pinned: column.pinned ? 'left' : undefined,
    hide: !column.visible,
    sortable: true,
    resizable: true,
    filter: true,
  };

  // Field-specific configurations
  switch (column.field) {
    case 'tag':
      return {
        ...baseColDef,
        pinned: 'left',
        lockPosition: 'left',
        suppressMovable: true,
        cellClass: (params: any) => {
          let baseClass = '';
          
          if (params.data.id === -1 && !params.value) {
            baseClass = 'font-mono font-semibold text-gray-400 italic';
          } else {
            baseClass = params.data.id === -1 
              ? 'font-mono font-semibold text-gray-400 italic' 
              : 'font-mono font-semibold text-blue-600';
          }
          
          // Add validation styling
          if (params.data.id !== -1) {
            if (!params.value || params.value.trim() === '') {
              baseClass += ' validation-error-cell';
            }
          }
          
          return baseClass;
        },
        editable: true,
        cellEditor: 'agTextCellEditor',
        cellRenderer: (params: any) => {
          if (params.data.id === -1 && !params.value) {
            return 'Enter cable tag...';
          }
          return params.value || '';
        }
      };

    case 'description':
      return {
        ...baseColDef,
        editable: true,
        cellEditor: 'agTextCellEditor',
        cellClass: (params: any) => {
          if (params.data.id === -1 && !params.value) {
            return 'text-gray-400 italic';
          }
          return '';
        },
        cellRenderer: (params: any) => {
          if (params.data.id === -1 && !params.value) {
            return 'Enter description...';
          }
          return params.value || '';
        }
      };

    case 'function':
      return {
        ...baseColDef,
        editable: true,
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: {
          values: ['Power', 'Signal', 'Control', 'Lighting', 'Communication', 'Spare']
        },
        cellClass: (params: any) => {
          if (params.data.id === -1 && !params.value) {
            return 'text-gray-400 italic';
          }
          return '';
        },
        cellRenderer: (params: any) => {
          if (params.data.id === -1 && !params.value) {
            return 'Select function...';
          }
          return params.value || '';
        }
      };

    case 'cableType':
      return {
        ...baseColDef,
        editable: true,
        cellEditor: 'agTextCellEditor',
        cellRenderer: (params: any) => {
          if (!params.value) return '-';
          return React.createElement(CableTypeBadge, { type: params.value });
        }
      };

    case 'size':
      return {
        ...baseColDef,
        editable: true,
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: {
          values: [
            '22 AWG', '20 AWG', '18 AWG', '16 AWG', '14 AWG', '12 AWG', '10 AWG',
            '8 AWG', '6 AWG', '4 AWG', '2 AWG', '1 AWG', '1/0 AWG', '2/0 AWG',
            '3/0 AWG', '4/0 AWG', '250 MCM', '300 MCM', '350 MCM', '400 MCM',
            '500 MCM', '600 MCM', '750 MCM', '1000 MCM'
          ]
        }
      };

    case 'voltage':
    case 'current':
    case 'cores':
    case 'length':
    case 'sparePercentage':
    case 'calculatedLength':
    case 'outerDiameter':
    case 'voltageDropPercentage':
      return {
        ...baseColDef,
        editable: true,
        type: 'numericColumn',
        cellEditor: 'agNumberCellEditor',
        cellEditorParams: {
          min: 0,
          max: column.field === 'voltage' ? 50000 : 
               column.field === 'sparePercentage' || column.field === 'voltageDropPercentage' ? 100 : 
               999999,
          precision: column.field === 'length' || column.field === 'calculatedLength' ? 1 : 0
        }
      };

    case 'fromEquipment':
    case 'toEquipment':
      return {
        ...baseColDef,
        editable: true,
        cellEditor: 'agTextCellEditor',
        cellClass: (params: any) => {
          if (params.data.id === -1 && !params.value) {
            return 'text-gray-400 italic';
          }
          return '';
        },
        cellRenderer: (params: any) => {
          if (params.data.id === -1 && !params.value) {
            return column.field === 'fromEquipment' ? 'From equipment...' : 'To equipment...';
          }
          return params.value || '';
        }
      };

    case 'route':
      return {
        ...baseColDef,
        editable: true,
        cellEditor: 'agTextCellEditor',
        cellClass: (params: any) => {
          if (params.data.id === -1 && !params.value) {
            return 'text-gray-400 italic';
          }
          return '';
        },
        cellRenderer: (params: any) => {
          if (params.data.id === -1 && !params.value) {
            return 'Enter route...';
          }
          return params.value || '';
        }
      };

    case 'segregationClass':
      return {
        ...baseColDef,
        editable: true,
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: {
          values: ['Class A', 'Class B', 'Class C', 'Class D']
        }
      };

    case 'segregationWarning':
      return {
        ...baseColDef,
        cellRenderer: (params: any) => {
          if (params.value) {
            return '⚠️ Warning';
          }
          return '';
        }
      };

    case 'notes':
      return {
        ...baseColDef,
        editable: true,
        cellEditor: 'agLargeTextCellEditor',
        cellEditorParams: {
          maxLength: 500,
          rows: 3
        },
        cellRenderer: (params: any) => {
          if (!params.value) return '';
          const text = params.value.toString();
          return text.length > 50 ? text.substring(0, 50) + '...' : text;
        }
      };

    case 'voltageDropPercentage':
      return {
        ...baseColDef,
        editable: false,
        filter: 'agNumberColumnFilter',
        cellClass: (params: any) => {
          if (!params.value && params.value !== 0) return '';
          
          const voltageDropPercent = Number(params.value);
          if (voltageDropPercent <= 3.0) {
            return 'text-green-600 font-medium';
          } else if (voltageDropPercent <= 5.0) {
            return 'text-yellow-600 font-medium';
          } else {
            return 'text-red-600 font-medium';
          }
        },
        cellRenderer: (params: any) => {
          if (!params.value && params.value !== 0) {
            return React.createElement('span', { className: 'text-gray-400 italic' }, 'Not calculated');
          }
          
          const voltageDropPercent = Number(params.value);
          const formatted = voltageDropPercent.toFixed(1) + '%';
          
          let icon;
          let statusText;
          
          if (voltageDropPercent <= 3.0) {
            icon = React.createElement(CheckCircle, { 
              size: 16, 
              className: 'inline mr-1 text-green-600' 
            });
            statusText = 'Compliant';
          } else if (voltageDropPercent <= 5.0) {
            icon = React.createElement(AlertTriangle, { 
              size: 16, 
              className: 'inline mr-1 text-yellow-600' 
            });
            statusText = 'High';
          } else {
            icon = React.createElement(XCircle, { 
              size: 16, 
              className: 'inline mr-1 text-red-600' 
            });
            statusText = 'Exceeds limit';
          }
          
          return React.createElement('div', 
            { 
              className: 'flex items-center',
              title: `${formatted} - ${statusText} (NEC: ≤3% recommended, ≤5% acceptable)`
            },
            icon,
            React.createElement('span', null, formatted)
          );
        }
      };

    default:
      return {
        ...baseColDef,
        editable: true,
        cellEditor: 'agTextCellEditor'
      };
  }
}

export function createSelectionColumn(): ColDef {
  return {
    headerName: '',
    field: 'selection',
    width: 50,
    pinned: 'left',
    lockPosition: 'left',
    suppressMovable: true,
    checkboxSelection: true,
    headerCheckboxSelection: true,
    sortable: false,
    filter: false,
    resizable: false,
  };
}