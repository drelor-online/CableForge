import React from 'react';
import { Edit2, Trash2, Download, CheckCircle, Copy, X } from 'lucide-react';
import { Icon } from '../common/Icon';
import Button from '../ui/Button';
import { theme, colors } from '../../theme';

interface BulkActionsBarProps {
  selectedCount: number;
  entityName?: string;
  onBulkEdit?: () => void;
  onBulkDelete?: () => void;
  onBulkExport?: () => void;
  onBulkValidate?: () => void;
  onBulkDuplicate?: () => void;
  onBulkCalculation?: () => Promise<void>;
  onDuplicateCheck?: () => void;
  onClearSelection?: () => void;
  calculationInProgress?: boolean;
  isLoading?: boolean;
}

const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  selectedCount,
  entityName = 'item',
  onBulkEdit,
  onBulkDelete,
  onBulkExport,
  onBulkValidate,
  onBulkDuplicate,
  onBulkCalculation,
  onDuplicateCheck,
  onClearSelection,
  calculationInProgress = false,
  isLoading = false
}) => {
  if (selectedCount === 0) return null;

  return (
    <div style={{
      position: 'sticky',
      bottom: 0,
      zIndex: theme.zIndex.docked,
      backgroundColor: colors.slate[700],
      borderTop: `1px solid ${colors.slate[600]}`,
      boxShadow: theme.shadows.lg
    }}>
      <div style={{ padding: `${theme.spacing[2]} ${theme.spacing[4]}` }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Selection info */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing[3]
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing[2]
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                backgroundColor: colors.blue[400],
                borderRadius: '50%'
              }} />
              <span style={{
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                color: colors.text.inverse
              }}>
                {selectedCount} {entityName}{selectedCount !== 1 ? 's' : ''} selected
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              disabled={isLoading}
              style={{
                fontSize: theme.typography.fontSize.xs,
                color: 'rgba(255, 255, 255, 0.6)',
                textDecoration: 'underline',
                padding: 0,
                height: 'auto'
              }}
            >
              Clear selection
            </Button>
          </div>

          {/* Bulk actions */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing[2]
          }}>
            <Button
              variant="ghost"
              size="sm"
              icon={Edit2}
              iconPosition="left"
              onClick={onBulkEdit}
              disabled={isLoading}
              style={{
                color: colors.text.inverse,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                fontSize: theme.typography.fontSize.xs
              }}
            >
              Edit
            </Button>

            {onBulkDuplicate && (
              <Button
                variant="ghost"
                size="sm"
                icon={Copy}
                iconPosition="left"
                onClick={onBulkDuplicate}
                disabled={isLoading}
                style={{
                  color: colors.text.inverse,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  fontSize: theme.typography.fontSize.xs
                }}
              >
                Duplicate
              </Button>
            )}

            {onBulkCalculation && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBulkCalculation}
                disabled={isLoading || calculationInProgress}
                style={{
                  color: colors.text.inverse,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  fontSize: theme.typography.fontSize.xs
                }}
              >
                {calculationInProgress ? 'Calculating...' : 'Calculate'}
              </Button>
            )}

            {onDuplicateCheck && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDuplicateCheck}
                disabled={isLoading}
                style={{
                  color: colors.text.inverse,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  fontSize: theme.typography.fontSize.xs
                }}
              >
                Check Duplicates
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              icon={Download}
              iconPosition="left"
              onClick={onBulkExport}
              disabled={isLoading}
              style={{
                color: colors.text.inverse,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                fontSize: theme.typography.fontSize.xs
              }}
            >
              Export
            </Button>

            {onBulkValidate && (
              <Button
                variant="ghost"
                size="sm"
                icon={CheckCircle}
                iconPosition="left"
                onClick={onBulkValidate}
                disabled={isLoading}
                style={{
                  color: colors.text.inverse,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  fontSize: theme.typography.fontSize.xs
                }}
              >
                Validate
              </Button>
            )}

            {/* Destructive action - visually separated */}
            <div style={{
              marginLeft: theme.spacing[2],
              paddingLeft: theme.spacing[2],
              borderLeft: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <Button
                variant="danger"
                size="sm"
                icon={Trash2}
                iconPosition="left"
                onClick={onBulkDelete}
                disabled={isLoading}
                style={{
                  fontSize: theme.typography.fontSize.xs,
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  color: '#fca5a5',
                  border: '1px solid rgba(239, 68, 68, 0.2)'
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>

        {/* Action hint */}
        <div style={{
          marginTop: theme.spacing[1],
          fontSize: theme.typography.fontSize.xs,
          color: 'rgba(255, 255, 255, 0.6)'
        }}>
          Use Shift+click to select ranges, Ctrl/Cmd+click for individual selection, Ctrl/Cmd+A to select all
        </div>
      </div>
    </div>
  );
};

export default BulkActionsBar;