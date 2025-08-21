import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { RevisionSummary, RevisionChange } from '../../types';
import { revisionService } from '../../services/revision-service';

interface RevisionHistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onCompareRevisions?: (revisionA: number, revisionB: number) => void;
  onCreateCheckpoint?: () => void;
}

const RevisionHistoryPanel: React.FC<RevisionHistoryPanelProps> = ({
  isOpen,
  onClose,
  onCompareRevisions,
  onCreateCheckpoint,
}) => {
  const [revisions, setRevisions] = useState<RevisionSummary[]>([]);
  const [expandedRevisions, setExpandedRevisions] = useState<Set<number>>(new Set());
  const [selectedRevisions, setSelectedRevisions] = useState<number[]>([]);
  const [revisionChanges, setRevisionChanges] = useState<Map<number, RevisionChange[]>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'checkpoints' | 'auto-saves'>('all');

  // Load revision history
  const loadRevisions = useCallback(async () => {
    setIsLoading(true);
    try {
      const history = await revisionService.getRevisionHistory(50); // Last 50 revisions
      setRevisions(history);
    } catch (error) {
      console.error('Failed to load revision history:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load changes for a specific revision
  const loadRevisionChanges = useCallback(async (revisionId: number) => {
    try {
      const changes = await revisionService.getRevisionChanges(revisionId);
      setRevisionChanges(prev => new Map(prev.set(revisionId, changes)));
    } catch (error) {
      console.error(`Failed to load changes for revision ${revisionId}:`, error);
    }
  }, []);

  // Load initial data when panel opens
  useEffect(() => {
    if (isOpen) {
      loadRevisions();
    }
  }, [isOpen, loadRevisions]);

  // Filter revisions based on search and filter type
  const filteredRevisions = useMemo(() => {
    let filtered = revisions;

    // Apply type filter
    if (filterType === 'checkpoints') {
      filtered = filtered.filter(rev => rev.isCheckpoint);
    } else if (filterType === 'auto-saves') {
      filtered = filtered.filter(rev => rev.isAutoSave);
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(rev =>
        rev.description?.toLowerCase().includes(term) ||
        rev.userName?.toLowerCase().includes(term) ||
        revisionService.formatRevisionName(rev).toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [revisions, searchTerm, filterType]);

  // Handle revision selection for comparison
  const handleRevisionSelect = useCallback((revisionId: number) => {
    setSelectedRevisions(prev => {
      if (prev.includes(revisionId)) {
        return prev.filter(id => id !== revisionId);
      } else if (prev.length < 2) {
        return [...prev, revisionId];
      } else {
        // Replace oldest selection
        return [prev[1], revisionId];
      }
    });
  }, []);

  // Toggle revision expansion
  const toggleRevisionExpansion = useCallback(async (revisionId: number) => {
    const isExpanded = expandedRevisions.has(revisionId);
    
    if (isExpanded) {
      setExpandedRevisions(prev => {
        const newSet = new Set(prev);
        newSet.delete(revisionId);
        return newSet;
      });
    } else {
      setExpandedRevisions(prev => new Set(prev.add(revisionId)));
      
      // Load changes if not already loaded
      if (!revisionChanges.has(revisionId)) {
        await loadRevisionChanges(revisionId);
      }
    }
  }, [expandedRevisions, revisionChanges, loadRevisionChanges]);

  // Handle compare button click
  const handleCompare = useCallback(() => {
    if (selectedRevisions.length === 2 && onCompareRevisions) {
      onCompareRevisions(selectedRevisions[0], selectedRevisions[1]);
    }
  }, [selectedRevisions, onCompareRevisions]);

  // Format relative time
  const formatRelativeTime = useCallback((dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }, []);

  // Get revision type icon
  const getRevisionIcon = useCallback((revision: RevisionSummary): string => {
    if (revision.isCheckpoint) return '📌';
    if (revision.isAutoSave) return '💾';
    return '📝';
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-white border-l border-gray-200 shadow-lg z-30 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Revision History</h2>
          <p className="text-sm text-gray-500">{filteredRevisions.length} revision{filteredRevisions.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 p-1"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Controls */}
      <div className="p-4 border-b border-gray-200 space-y-3">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search revisions..."
            className="w-full pl-8 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <svg className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          {(['all', 'checkpoints', 'auto-saves'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                filterType === type
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {type === 'all' ? 'All' : type === 'checkpoints' ? 'Checkpoints' : 'Auto-saves'}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {onCreateCheckpoint && (
            <button
              onClick={onCreateCheckpoint}
              className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Create Checkpoint
            </button>
          )}
          {onCompareRevisions && (
            <button
              onClick={handleCompare}
              disabled={selectedRevisions.length !== 2}
              className="flex-1 px-3 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Compare ({selectedRevisions.length}/2)
            </button>
          )}
        </div>
      </div>

      {/* Revision List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">
            <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            Loading revisions...
          </div>
        ) : filteredRevisions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {searchTerm ? 'No revisions match your search.' : 'No revisions found.'}
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredRevisions.map((revision, index) => {
              const isExpanded = expandedRevisions.has(revision.id);
              const isSelected = selectedRevisions.includes(revision.id);
              const changes = revisionChanges.get(revision.id) || [];

              return (
                <div
                  key={revision.id}
                  className={`border rounded-lg transition-colors ${
                    isSelected ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {/* Revision Header */}
                  <div className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm">{getRevisionIcon(revision)}</span>
                          <span className="font-medium text-gray-900 text-sm">
                            {revisionService.formatRevisionName(revision)}
                          </span>
                          {revision.changeCount > 0 && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-gray-100 text-gray-800">
                              {revision.changeCount}
                            </span>
                          )}
                        </div>
                        
                        {revision.description && (
                          <p className="text-sm text-gray-600 mb-1 truncate" title={revision.description}>
                            {revision.description}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{formatRelativeTime(revision.createdAt)}</span>
                          {revision.userName && (
                            <>
                              <span>•</span>
                              <span>{revision.userName}</span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 ml-2">
                        <button
                          onClick={() => handleRevisionSelect(revision.id)}
                          className={`w-4 h-4 border-2 rounded ${
                            isSelected
                              ? 'border-blue-500 bg-blue-500'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          {isSelected && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                        
                        {revision.changeCount > 0 && (
                          <button
                            onClick={() => toggleRevisionExpansion(revision.id)}
                            className="text-gray-400 hover:text-gray-600 p-0.5"
                          >
                            <svg
                              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Change Details */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50">
                      {changes.length === 0 ? (
                        <div className="p-3 text-sm text-gray-500 text-center">
                          No detailed changes available
                        </div>
                      ) : (
                        <div className="max-h-48 overflow-y-auto">
                          {changes.map((change) => (
                            <div key={change.id} className="flex items-start gap-2 p-2 border-b border-gray-100 last:border-b-0">
                              <span className="text-xs mt-0.5" title={change.changeType}>
                                {revisionService.getChangeIcon(change)}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1">
                                  <span className="text-xs" title={change.entityType}>
                                    {revisionService.getEntityTypeIcon(change.entityType)}
                                  </span>
                                  <span className="text-xs font-medium text-gray-900 truncate">
                                    {change.entityTag || `${change.entityType} #${change.entityId}`}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-600 mt-0.5">
                                  {revisionService.formatChangeDescription(change)}
                                </p>
                                {change.fieldName && change.oldValue !== change.newValue && (
                                  <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                                    {change.oldValue && (
                                      <div className="truncate">
                                        <span className="text-red-600">- {change.oldValue}</span>
                                      </div>
                                    )}
                                    {change.newValue && (
                                      <div className="truncate">
                                        <span className="text-green-600">+ {change.newValue}</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default RevisionHistoryPanel;