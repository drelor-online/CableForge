import React, { useState, useEffect, useCallback } from 'react';
import { RevisionSummary } from '../../types';
import { revisionService } from '../../services/revision-service';

interface RevisionControlsProps {
  onShowHistory: () => void;
  onCreateCheckpoint: () => void;
  className?: string;
}

const RevisionControls: React.FC<RevisionControlsProps> = ({
  onShowHistory,
  onCreateCheckpoint,
  className = '',
}) => {
  const [currentRevision, setCurrentRevision] = useState<RevisionSummary | null>(null);
  const [autoSaveCountdown, setAutoSaveCountdown] = useState<number>(0);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string>('');
  const [showTooltip, setShowTooltip] = useState(false);

  // Load current revision info
  const loadCurrentRevision = useCallback(async () => {
    try {
      const history = await revisionService.getRevisionHistory(1);
      if (history.length > 0) {
        setCurrentRevision(history[0]);
        setLastSaved(formatLastSavedTime(history[0].createdAt));
      }
    } catch (error) {
      console.error('Failed to load current revision:', error);
    }
  }, []);

  // Format last saved time
  const formatLastSavedTime = useCallback((dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffSeconds = Math.floor(diffMs / 1000);

    if (diffSeconds < 60) return 'Just saved';
    if (diffMinutes < 60) return `Saved ${diffMinutes}m ago`;
    return `Saved at ${date.toLocaleTimeString()}`;
  }, []);

  // Auto-save countdown timer
  useEffect(() => {
    const settings = revisionService.getSettings();
    if (settings.autoSaveInterval <= 0) return;

    const intervalMs = settings.autoSaveInterval * 60 * 1000;
    let timeRemaining = intervalMs;

    const timer = setInterval(() => {
      timeRemaining -= 1000;
      setAutoSaveCountdown(Math.ceil(timeRemaining / 1000));

      if (timeRemaining <= 0) {
        setIsAutoSaving(true);
        // The actual auto-save is handled by the revision service
        setTimeout(() => {
          setIsAutoSaving(false);
          loadCurrentRevision();
          timeRemaining = intervalMs;
        }, 1000);
      }
    }, 1000);

    // Initial countdown
    setAutoSaveCountdown(Math.ceil(intervalMs / 1000));

    return () => clearInterval(timer);
  }, [loadCurrentRevision]);

  // Update last saved time periodically
  useEffect(() => {
    const timer = setInterval(() => {
      if (currentRevision) {
        setLastSaved(formatLastSavedTime(currentRevision.createdAt));
      }
    }, 30000); // Update every 30 seconds

    return () => clearInterval(timer);
  }, [currentRevision, formatLastSavedTime]);

  // Load initial data
  useEffect(() => {
    loadCurrentRevision();
  }, [loadCurrentRevision]);

  // Format countdown display
  const formatCountdown = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  // Handle checkpoint creation
  const handleCreateCheckpoint = useCallback(async () => {
    try {
      setIsAutoSaving(true);
      await onCreateCheckpoint();
      await loadCurrentRevision();
    } catch (error) {
      console.error('Failed to create checkpoint:', error);
    } finally {
      setIsAutoSaving(false);
    }
  }, [onCreateCheckpoint, loadCurrentRevision]);

  // Get revision display text
  const getRevisionDisplayText = useCallback((): string => {
    if (!currentRevision) return 'No revision';
    return revisionService.formatRevisionName(currentRevision);
  }, [currentRevision]);

  // Get status color based on revision state
  const getStatusColor = useCallback((): string => {
    if (isAutoSaving) return 'text-blue-400';
    if (!currentRevision) return 'text-gray-400';
    if (currentRevision.isCheckpoint) return 'text-green-400';
    return 'text-yellow-400';
  }, [isAutoSaving, currentRevision]);

  // Get status icon
  const getStatusIcon = useCallback((): string => {
    if (isAutoSaving) return '💾';
    if (!currentRevision) return '❓';
    if (currentRevision.isCheckpoint) return '📌';
    return '📝';
  }, [isAutoSaving, currentRevision]);

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Current Revision Status */}
      <div 
        className="relative flex items-center gap-2 text-white/80"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <span className="text-xs">{getStatusIcon()}</span>
        <div className="flex flex-col">
          <span className={`text-xs font-medium ${getStatusColor()}`}>
            {getRevisionDisplayText()}
          </span>
          <span className="text-xs text-white/60">
            {isAutoSaving ? 'Saving...' : lastSaved}
          </span>
        </div>

        {/* Tooltip */}
        {showTooltip && (
          <div className="absolute bottom-full left-0 mb-2 p-2 bg-black text-white text-xs rounded shadow-lg whitespace-nowrap z-50">
            <div>Current: {getRevisionDisplayText()}</div>
            {currentRevision && (
              <>
                <div>Changes: {currentRevision.changeCount}</div>
                {currentRevision.userName && <div>By: {currentRevision.userName}</div>}
                <div>Created: {new Date(currentRevision.createdAt).toLocaleString()}</div>
              </>
            )}
            <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black"></div>
          </div>
        )}
      </div>

      {/* Auto-save Countdown */}
      {autoSaveCountdown > 0 && !isAutoSaving && (
        <div className="flex items-center gap-1 text-white/60">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs font-mono">
            {formatCountdown(autoSaveCountdown)}
          </span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-1">
        {/* History Button */}
        <button
          onClick={onShowHistory}
          className="p-1.5 text-xs font-medium bg-white/10 text-white border border-white/20 rounded hover:bg-white/20 transition-colors"
          title="Show revision history"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>

        {/* Checkpoint Button */}
        <button
          onClick={handleCreateCheckpoint}
          disabled={isAutoSaving}
          className="p-1.5 text-xs font-medium bg-white/10 text-white border border-white/20 rounded hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Create checkpoint"
        >
          {isAutoSaving ? (
            <div className="w-4 h-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

export default RevisionControls;