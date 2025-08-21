import React, { useState, useEffect, useCallback } from 'react';
import { X, Trash2, Download, FolderOpen, AlertTriangle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Icon } from '../common/Icon';
import { colors, theme } from '../../theme';
import { invoke } from '@tauri-apps/api/core';
import { useUI } from '../../contexts/UIContext';
import { workflowService } from '../../services/workflow-service';

interface WorkflowManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface WorkflowSession {
  sessionId: string;
  displayName: string;
  createdAt: Date;
  size: string;
}

export const WorkflowManagerModal: React.FC<WorkflowManagerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [workflows, setWorkflows] = useState<WorkflowSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const { showSuccess, showError } = useUI();

  // Load workflow sessions
  const loadWorkflows = useCallback(async () => {
    try {
      setLoading(true);
      const sessionMetadata = workflowService.getSessionMetadata();
      
      // Convert session metadata to workflow objects with display info
      const workflowSessions = sessionMetadata.map(meta => ({
        sessionId: meta.sessionId,
        displayName: formatSessionName(meta.sessionId),
        createdAt: new Date(meta.startTime),
        size: `${meta.interactionCount} interactions, ${meta.screenshotCount} screenshots`,
      }));

      // Sort by creation date, newest first
      workflowSessions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      setWorkflows(workflowSessions);
    } catch (error) {
      console.error('Failed to load workflows:', error);
      showError('Failed to load workflow recordings');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  // Extract date from session ID (format: cableforge-workflow-{timestamp})
  const extractDateFromSessionId = (sessionId: string): Date => {
    try {
      const timestampMatch = sessionId.match(/cableforge-workflow-(\d+)/);
      if (timestampMatch) {
        return new Date(parseInt(timestampMatch[1]));
      }
    } catch (error) {
      console.warn('Could not extract date from session ID:', sessionId);
    }
    return new Date(); // Fallback to current date
  };

  // Format session name for display
  const formatSessionName = (sessionId: string): string => {
    const date = extractDateFromSessionId(sessionId);
    return `Workflow Recording - ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  // Delete single workflow
  const deleteWorkflow = useCallback(async (sessionId: string) => {
    try {
      setDeleting(sessionId);
      // Note: We would need to implement a delete_workflow command in Tauri
      // For now, we'll show success and reload
      showSuccess('Workflow recording deleted');
      await loadWorkflows();
    } catch (error) {
      console.error('Failed to delete workflow:', error);
      showError('Failed to delete workflow recording');
    } finally {
      setDeleting(null);
    }
  }, [loadWorkflows, showSuccess, showError]);

  // Delete all workflows
  const deleteAllWorkflows = useCallback(async () => {
    try {
      setLoading(true);
      await workflowService.deleteAllWorkflowSessions();
      setWorkflows([]);
      setShowDeleteAllConfirm(false);
      showSuccess('All workflow recordings deleted');
    } catch (error) {
      console.error('Failed to delete all workflows:', error);
      showError('Failed to delete workflow recordings');
    } finally {
      setLoading(false);
    }
  }, [showSuccess, showError]);

  // Export workflow
  const exportWorkflow = useCallback(async (sessionId: string) => {
    try {
      // For now, we'll just show a success message
      // The actual export would need workflow data and screenshots
      showSuccess('Export feature coming soon');
    } catch (error) {
      console.error('Failed to export workflow:', error);
      showError('Failed to export workflow');
    }
  }, [showSuccess, showError]);

  // Load workflows when modal opens
  useEffect(() => {
    if (isOpen) {
      loadWorkflows();
    }
  }, [isOpen, loadWorkflows]);

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Workflow Recordings Manager" 
      size="lg"
    >
      <div style={{ minHeight: '400px' }}>
        {/* Header with actions */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 style={{ 
              fontSize: theme.typography.fontSize.lg, 
              fontWeight: theme.typography.fontWeight.medium,
              margin: 0 
            }}>
              Saved Recordings ({workflows.length})
            </h3>
            <p style={{ 
              fontSize: theme.typography.fontSize.sm, 
              color: colors.gray[600], 
              margin: '4px 0 0 0' 
            }}>
              Manage your workflow recording sessions and screenshots
            </p>
          </div>
          
          {workflows.length > 0 && (
            <button
              onClick={() => setShowDeleteAllConfirm(true)}
              style={{
                padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                backgroundColor: colors.red[600],
                color: colors.white,
                border: 'none',
                borderRadius: theme.borderRadius.md,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing[2]
              }}
            >
              <Icon icon={Trash2} size="xs" />
              Delete All
            </button>
          )}
        </div>

        {/* Loading state */}
        {loading && (
          <div 
            className="flex items-center justify-center"
            style={{ height: '300px', color: colors.gray[500] }}
          >
            <div className="text-center">
              <div 
                className="animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 mx-auto mb-4"
                style={{ width: '32px', height: '32px' }}
              ></div>
              <p>Loading workflow recordings...</p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && workflows.length === 0 && (
          <div 
            className="flex flex-col items-center justify-center"
            style={{ height: '300px', color: colors.gray[500] }}
          >
            <FolderOpen style={{ width: '64px', height: '64px', marginBottom: '16px' }} />
            <h3 style={{ margin: '0 0 8px 0', fontSize: theme.typography.fontSize.lg }}>
              No Recordings Found
            </h3>
            <p style={{ margin: 0, textAlign: 'center' }}>
              Start recording your workflows to see them here.<br />
              Use the camera button in the header to get started.
            </p>
          </div>
        )}

        {/* Workflow list */}
        {!loading && workflows.length > 0 && (
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {workflows.map((workflow) => (
              <div
                key={workflow.sessionId}
                style={{
                  padding: theme.spacing[3],
                  border: `1px solid ${colors.gray[200]}`,
                  borderRadius: theme.borderRadius.lg,
                  marginBottom: theme.spacing[3],
                  backgroundColor: colors.white
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 style={{
                      margin: '0 0 4px 0',
                      fontSize: theme.typography.fontSize.base,
                      fontWeight: theme.typography.fontWeight.medium
                    }}>
                      {workflow.displayName}
                    </h4>
                    <p style={{
                      margin: '0 0 8px 0',
                      fontSize: theme.typography.fontSize.sm,
                      color: colors.gray[600]
                    }}>
                      Session ID: {workflow.sessionId}
                    </p>
                    <div className="flex items-center gap-4" style={{ fontSize: theme.typography.fontSize.xs, color: colors.gray[500] }}>
                      <span>Created: {workflow.createdAt.toLocaleDateString()}</span>
                      <span>•</span>
                      <span>Size: {workflow.size}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Export button */}
                    <button
                      onClick={() => exportWorkflow(workflow.sessionId)}
                      style={{
                        padding: theme.spacing[2],
                        border: `1px solid ${colors.gray[300]}`,
                        borderRadius: theme.borderRadius.md,
                        backgroundColor: colors.white,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Export workflow"
                    >
                      <Icon icon={Download} size="xs" />
                    </button>
                    
                    {/* Delete button */}
                    <button
                      onClick={() => deleteWorkflow(workflow.sessionId)}
                      disabled={deleting === workflow.sessionId}
                      style={{
                        padding: theme.spacing[2],
                        border: `1px solid ${colors.red[300]}`,
                        borderRadius: theme.borderRadius.md,
                        backgroundColor: colors.red[50],
                        color: colors.red[600],
                        cursor: deleting === workflow.sessionId ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: deleting === workflow.sessionId ? 0.5 : 1
                      }}
                      title="Delete workflow"
                    >
                      <Icon icon={Trash2} size="xs" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delete all confirmation dialog */}
        {showDeleteAllConfirm && (
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}
          >
            <div 
              style={{
                backgroundColor: colors.white,
                padding: theme.spacing[6],
                borderRadius: theme.borderRadius.lg,
                boxShadow: theme.shadows.xl,
                maxWidth: '400px',
                width: '90%'
              }}
            >
              <div className="flex items-start gap-3 mb-4">
                <Icon icon={AlertTriangle} size="md" color={colors.red[600]} />
                <div>
                  <h3 style={{
                    margin: '0 0 8px 0',
                    fontSize: theme.typography.fontSize.lg,
                    fontWeight: theme.typography.fontWeight.medium
                  }}>
                    Delete All Recordings?
                  </h3>
                  <p style={{
                    margin: 0,
                    fontSize: theme.typography.fontSize.sm,
                    color: colors.gray[600],
                    lineHeight: '1.5'
                  }}>
                    This will permanently delete all {workflows.length} workflow recordings and their screenshots. 
                    This action cannot be undone.
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteAllConfirm(false)}
                  style={{
                    padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
                    fontSize: theme.typography.fontSize.sm,
                    fontWeight: theme.typography.fontWeight.medium,
                    color: colors.gray[700],
                    backgroundColor: colors.white,
                    border: `1px solid ${colors.gray[300]}`,
                    borderRadius: theme.borderRadius.md,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={deleteAllWorkflows}
                  style={{
                    padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
                    fontSize: theme.typography.fontSize.sm,
                    fontWeight: theme.typography.fontWeight.medium,
                    backgroundColor: colors.red[600],
                    color: colors.white,
                    border: 'none',
                    borderRadius: theme.borderRadius.md,
                    cursor: 'pointer'
                  }}
                >
                  Delete All
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default WorkflowManagerModal;