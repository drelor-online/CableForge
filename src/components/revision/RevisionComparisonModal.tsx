import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { RevisionSummary, RevisionChange } from '../../types';
import { revisionService } from '../../services/revision-service';

interface RevisionComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  revisionA: number | null;
  revisionB: number | null;
}

interface GroupedChanges {
  [entityType: string]: {
    [entityId: string]: RevisionChange[];
  };
}

const RevisionComparisonModal: React.FC<RevisionComparisonModalProps> = ({
  isOpen,
  onClose,
  revisionA,
  revisionB,
}) => {
  const [revisionDataA, setRevisionDataA] = useState<RevisionSummary | null>(null);
  const [revisionDataB, setRevisionDataB] = useState<RevisionSummary | null>(null);
  const [changesA, setChangesA] = useState<RevisionChange[]>([]);
  const [changesB, setChangesB] = useState<RevisionChange[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEntityType, setSelectedEntityType] = useState<string>('all');
  const [expandedEntities, setExpandedEntities] = useState<Set<string>>(new Set());

  // Load revision data and changes
  const loadRevisionData = useCallback(async () => {
    if (!revisionA || !revisionB || !isOpen) return;

    setIsLoading(true);
    try {
      const [dataA, dataB, changesAData, changesBData] = await Promise.all([
        revisionService.getRevisionById(revisionA),
        revisionService.getRevisionById(revisionB),
        revisionService.getRevisionChanges(revisionA),
        revisionService.getRevisionChanges(revisionB),
      ]);

      setRevisionDataA(dataA);
      setRevisionDataB(dataB);
      setChangesA(changesAData);
      setChangesB(changesBData);
    } catch (error) {
      console.error('Failed to load revision comparison data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [revisionA, revisionB, isOpen]);

  useEffect(() => {
    loadRevisionData();
  }, [loadRevisionData]);

  // Group changes by entity type and ID
  const groupedChangesA = useMemo((): GroupedChanges => {
    return changesA.reduce((acc, change) => {
      const entityKey = `${change.entityType}:${change.entityId}`;
      if (!acc[change.entityType]) acc[change.entityType] = {};
      if (!acc[change.entityType][entityKey]) acc[change.entityType][entityKey] = [];
      acc[change.entityType][entityKey].push(change);
      return acc;
    }, {} as GroupedChanges);
  }, [changesA]);

  const groupedChangesB = useMemo((): GroupedChanges => {
    return changesB.reduce((acc, change) => {
      const entityKey = `${change.entityType}:${change.entityId}`;
      if (!acc[change.entityType]) acc[change.entityType] = {};
      if (!acc[change.entityType][entityKey]) acc[change.entityType][entityKey] = [];
      acc[change.entityType][entityKey].push(change);
      return acc;
    }, {} as GroupedChanges);
  }, [changesB]);

  // Get all entity types from both revisions
  const allEntityTypes = useMemo(() => {
    const types = new Set([
      ...Object.keys(groupedChangesA),
      ...Object.keys(groupedChangesB)
    ]);
    return Array.from(types).sort();
  }, [groupedChangesA, groupedChangesB]);

  // Get filtered entity keys
  const filteredEntityKeys = useMemo(() => {
    if (selectedEntityType === 'all') {
      const allKeys = new Set();
      Object.values(groupedChangesA).forEach(entities => 
        Object.keys(entities).forEach(key => allKeys.add(key))
      );
      Object.values(groupedChangesB).forEach(entities => 
        Object.keys(entities).forEach(key => allKeys.add(key))
      );
      return Array.from(allKeys) as string[];
    } else {
      const keysA = Object.keys(groupedChangesA[selectedEntityType] || {});
      const keysB = Object.keys(groupedChangesB[selectedEntityType] || {});
      return Array.from(new Set([...keysA, ...keysB])).sort();
    }
  }, [selectedEntityType, groupedChangesA, groupedChangesB]);

  // Toggle entity expansion
  const toggleEntityExpansion = useCallback((entityKey: string) => {
    setExpandedEntities(prev => {
      const newSet = new Set(prev);
      if (newSet.has(entityKey)) {
        newSet.delete(entityKey);
      } else {
        newSet.add(entityKey);
      }
      return newSet;
    });
  }, []);

  // Get changes for entity key
  const getChangesForEntity = useCallback((entityKey: string, changes: GroupedChanges) => {
    const [entityType] = entityKey.split(':');
    return changes[entityType]?.[entityKey] || [];
  }, []);

  // Format entity display name
  const formatEntityName = useCallback((entityKey: string, changes: RevisionChange[]): string => {
    const [entityType, entityId] = entityKey.split(':');
    const firstChange = changes[0];
    if (firstChange?.entityTag) {
      return `${firstChange.entityTag} (${entityType})`;
    }
    return `${entityType} #${entityId}`;
  }, []);

  // Get comparison status for entity
  const getEntityStatus = useCallback((entityKey: string): 'added' | 'removed' | 'modified' | 'unchanged' => {
    const changesInA = getChangesForEntity(entityKey, groupedChangesA);
    const changesInB = getChangesForEntity(entityKey, groupedChangesB);

    if (changesInA.length > 0 && changesInB.length === 0) return 'removed';
    if (changesInA.length === 0 && changesInB.length > 0) return 'added';
    if (changesInA.length > 0 && changesInB.length > 0) return 'modified';
    return 'unchanged';
  }, [groupedChangesA, groupedChangesB, getChangesForEntity]);

  // Get status color
  const getStatusColor = useCallback((status: string): string => {
    switch (status) {
      case 'added': return 'text-green-600 bg-green-50';
      case 'removed': return 'text-red-600 bg-red-50';
      case 'modified': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  }, []);

  // Export comparison report
  const exportReport = useCallback(() => {
    const report = {
      comparisonDate: new Date().toISOString(),
      revisionA: revisionDataA,
      revisionB: revisionDataB,
      summary: {
        totalChangesA: changesA.length,
        totalChangesB: changesB.length,
        entityTypes: allEntityTypes,
        affectedEntities: filteredEntityKeys.length,
      },
      changes: filteredEntityKeys.map(entityKey => ({
        entityKey,
        status: getEntityStatus(entityKey),
        changesA: getChangesForEntity(entityKey, groupedChangesA),
        changesB: getChangesForEntity(entityKey, groupedChangesB),
      })),
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revision-comparison-${revisionA}-${revisionB}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [revisionDataA, revisionDataB, changesA, changesB, allEntityTypes, filteredEntityKeys, getEntityStatus, getChangesForEntity, groupedChangesA, groupedChangesB, revisionA, revisionB]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Revision Comparison</h2>
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
              {revisionDataA && (
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-red-200 rounded-full"></span>
                  <span>{revisionService.formatRevisionName(revisionDataA)}</span>
                </div>
              )}
              {revisionDataB && (
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-green-200 rounded-full"></span>
                  <span>{revisionService.formatRevisionName(revisionDataB)}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportReport}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Export Report
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Filter by entity type:</label>
            <select
              value={selectedEntityType}
              onChange={(e) => setSelectedEntityType(e.target.value)}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Types</option>
              {allEntityTypes.map(type => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}s
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <div className="h-full overflow-y-auto p-4">
              {filteredEntityKeys.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No changes found between these revisions.
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredEntityKeys.map(entityKey => {
                    const changesInA = getChangesForEntity(entityKey, groupedChangesA);
                    const changesInB = getChangesForEntity(entityKey, groupedChangesB);
                    const status = getEntityStatus(entityKey);
                    const isExpanded = expandedEntities.has(entityKey);
                    const entityName = formatEntityName(entityKey, [...changesInA, ...changesInB]);

                    return (
                      <div key={entityKey} className="border border-gray-200 rounded-lg">
                        {/* Entity Header */}
                        <button
                          onClick={() => toggleEntityExpansion(entityKey)}
                          className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(status)}`}>
                              {status}
                            </span>
                            <span className="font-medium text-gray-900">{entityName}</span>
                            <span className="text-sm text-gray-500">
                              ({changesInA.length} → {changesInB.length} changes)
                            </span>
                          </div>
                          <svg
                            className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>

                        {/* Expanded Change Details */}
                        {isExpanded && (
                          <div className="border-t border-gray-200 bg-gray-50">
                            <div className="grid grid-cols-2 gap-4 p-4">
                              {/* Left: Revision A */}
                              <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                  <span className="w-3 h-3 bg-red-200 rounded-full"></span>
                                  {revisionDataA && revisionService.formatRevisionName(revisionDataA)}
                                </h4>
                                {changesInA.length === 0 ? (
                                  <p className="text-sm text-gray-500 italic">No changes</p>
                                ) : (
                                  <div className="space-y-2">
                                    {changesInA.map((change, index) => (
                                      <div key={index} className="text-sm">
                                        <div className="font-medium text-gray-900">
                                          {revisionService.formatChangeDescription(change)}
                                        </div>
                                        {change.fieldName && (
                                          <div className="text-gray-600 mt-1">
                                            <span className="font-medium">{change.fieldName}:</span>
                                            {change.oldValue && (
                                              <div className="text-red-600">- {change.oldValue}</div>
                                            )}
                                            {change.newValue && (
                                              <div className="text-green-600">+ {change.newValue}</div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Right: Revision B */}
                              <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                  <span className="w-3 h-3 bg-green-200 rounded-full"></span>
                                  {revisionDataB && revisionService.formatRevisionName(revisionDataB)}
                                </h4>
                                {changesInB.length === 0 ? (
                                  <p className="text-sm text-gray-500 italic">No changes</p>
                                ) : (
                                  <div className="space-y-2">
                                    {changesInB.map((change, index) => (
                                      <div key={index} className="text-sm">
                                        <div className="font-medium text-gray-900">
                                          {revisionService.formatChangeDescription(change)}
                                        </div>
                                        {change.fieldName && (
                                          <div className="text-gray-600 mt-1">
                                            <span className="font-medium">{change.fieldName}:</span>
                                            {change.oldValue && (
                                              <div className="text-red-600">- {change.oldValue}</div>
                                            )}
                                            {change.newValue && (
                                              <div className="text-green-600">+ {change.newValue}</div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RevisionComparisonModal;