/**
 * WorkflowRecorder Component
 * Records user interactions, takes screenshots, and manages workflow documentation for CableForge
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { 
  InteractionEvent, 
  WorkflowSession, 
  CableForgeWorkflowStep,
  StepIndicator 
} from '../../types/workflow';

interface WorkflowRecorderProps {
  onClose?: () => void;
}

export const WorkflowRecorder: React.FC<WorkflowRecorderProps> = ({ onClose }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [session, setSession] = useState<WorkflowSession | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [currentStep, setCurrentStep] = useState<CableForgeWorkflowStep>('dashboard');
  
  const dragRef = useRef<{ 
    startX: number; 
    startY: number; 
    startPosX: number; 
    startPosY: number 
  }>({ startX: 0, startY: 0, startPosX: 0, startPosY: 0 });
  const screenshotCounter = useRef(0);
  const inputDebounceTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const lastInputValues = useRef<Map<string, string>>(new Map());

  // CableForge-specific step indicators
  const stepIndicators: StepIndicator[] = [
    { selector: '[data-testid="new-project-btn"]', step: 'dashboard', description: 'Project Dashboard' },
    { selector: '[data-testid="open-project-btn"]', step: 'file-operations', description: 'File Operations' },
    { selector: '[data-testid="save-project-btn"]', step: 'file-operations', description: 'File Operations' },
    { selector: '.ag-theme-cableforge', step: 'cable-management', description: 'Cable Management' },
    { selector: '[data-testid="add-cable-btn"]', step: 'cable-editing', description: 'Cable Editing' },
    { selector: '.validation-error', step: 'validation-review', description: 'Validation Review' },
    { selector: '.validation-warning', step: 'validation-review', description: 'Validation Review' },
    { selector: '[data-tab="io"]', step: 'io-management', description: 'I/O Management' },
    { selector: '[data-tab="conduits"]', step: 'conduit-management', description: 'Conduit Management' },
    { selector: '[data-tab="reports"]', step: 'reports', description: 'Reports & Export' },
  ];

  // Generate unique selector for an element
  const getElementSelector = useCallback((element: Element): string => {
    // Priority: data-testid > id > class > tag with position
    const testId = element.getAttribute('data-testid');
    if (testId) return `[data-testid="${testId}"]`;

    const id = element.id;
    if (id) return `#${id}`;

    const className = element.className;
    if (className && typeof className === 'string') {
      const validClasses = className.split(' ').filter(cls => cls && !cls.includes(' '));
      if (validClasses.length > 0) {
        return `.${validClasses[0]}`;
      }
    }

    // Fallback to tag with position
    const tagName = element.tagName.toLowerCase();
    const parent = element.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(child => child.tagName === element.tagName);
      const index = siblings.indexOf(element);
      if (siblings.length > 1) {
        return `${tagName}:nth-of-type(${index + 1})`;
      }
    }

    return tagName;
  }, []);

  // Get element attributes for context
  const getElementAttributes = useCallback((element: Element): Record<string, string> => {
    const attrs: Record<string, string> = {};
    const importantAttrs = ['placeholder', 'type', 'name', 'value', 'href', 'title', 'alt'];
    
    importantAttrs.forEach(attr => {
      const value = element.getAttribute(attr);
      if (value) attrs[attr] = value;
    });

    return attrs;
  }, []);

  // Take screenshot using Tauri backend
  const takeScreenshot = useCallback(async (): Promise<string | null> => {
    try {
      screenshotCounter.current += 1;
      const filename = `cableforge-screenshot-${screenshotCounter.current}-${Date.now()}.png`;
      
      const screenshotPath = await invoke<string>('take_screenshot', { filename });
      return screenshotPath;
    } catch (error) {
      console.error('Screenshot failed:', error);
      return null;
    }
  }, []);

  // Detect current CableForge workflow step
  const detectWorkflowStep = useCallback((): CableForgeWorkflowStep => {
    try {
      // Check for specific step indicators
      for (const indicator of stepIndicators) {
        if (document.querySelector(indicator.selector)) {
          return indicator.step;
        }
      }
      
      // Check page URL patterns
      const url = window.location.href;
      const path = window.location.pathname;
      
      if (path.includes('dashboard') || url.includes('#dashboard')) {
        return 'dashboard';
      }
      
      // Check for visible tabs
      const activeTab = document.querySelector('[data-tab].active, .tab.active');
      if (activeTab) {
        const tabName = activeTab.getAttribute('data-tab') || activeTab.textContent?.toLowerCase();
        switch (tabName) {
          case 'cables':
            return 'cable-management';
          case 'io':
            return 'io-management';
          case 'conduits':
            return 'conduit-management';
          case 'reports':
            return 'reports';
        }
      }
      
      // Check for validation-related UI
      if (document.querySelector('.validation-error, .validation-warning')) {
        return 'validation-review';
      }
      
      // Check for file operation dialogs
      if (document.querySelector('[data-testid*="file-"], .file-dialog, .save-dialog')) {
        return 'file-operations';
      }
      
      return 'unknown';
    } catch (error) {
      console.warn('[WorkflowRecorder] Error detecting step:', error);
      return 'unknown';
    }
  }, [stepIndicators]);

  // Record interaction with step tracking
  const recordInteraction = useCallback(async (
    type: InteractionEvent['type'], 
    element: Element, 
    value?: string
  ) => {
    if (!isRecording || !session) return;

    const selector = getElementSelector(element);
    const elementText = element.textContent?.trim().slice(0, 100) || undefined;
    const elementTag = element.tagName.toLowerCase();
    const elementAttributes = getElementAttributes(element);
    const newStep = detectWorkflowStep();
    
    // Detect step changes
    if (newStep !== currentStep) {
      setCurrentStep(newStep);
      
      // Record step change as separate interaction
      const stepChangeInteraction: InteractionEvent = {
        type: 'step_change',
        selector: 'workflow-step',
        timestamp: new Date().toISOString(),
        step: newStep,
        value: newStep
      };
      
      setSession(prev => prev ? {
        ...prev,
        interactions: [...prev.interactions, stepChangeInteraction]
      } : null);
    }

    // Take screenshot for important interactions
    let screenshot: string | undefined;
    if (type === 'click' || type === 'screenshot' || type === 'step_change') {
      screenshot = await takeScreenshot() || undefined;
      if (screenshot) {
        setSession(prev => prev ? {
          ...prev,
          screenshots: [...prev.screenshots, screenshot!]
        } : null);
      }
    }

    const interaction: InteractionEvent = {
      type,
      selector,
      value,
      timestamp: new Date().toISOString(),
      screenshot,
      elementText,
      elementTag,
      elementAttributes,
      step: newStep
    };

    setSession(prev => prev ? {
      ...prev,
      interactions: [...prev.interactions, interaction]
    } : null);
  }, [isRecording, session, getElementSelector, getElementAttributes, detectWorkflowStep, currentStep, takeScreenshot]);

  // Debounced input recording to avoid too many input events
  const recordDebouncedInput = useCallback((element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement) => {
    const selector = getElementSelector(element);
    const currentValue = element.value;
    
    // Clear existing timer for this element
    const existingTimer = inputDebounceTimers.current.get(selector);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    
    // Set new debounced timer
    const timer = setTimeout(async () => {
      const lastValue = lastInputValues.current.get(selector);
      if (lastValue !== currentValue) {
        lastInputValues.current.set(selector, currentValue);
        await recordInteraction('input', element, currentValue);
      }
    }, 1000); // 1 second debounce
    
    inputDebounceTimers.current.set(selector, timer);
  }, [getElementSelector, recordInteraction]);

  // Event handlers for recording
  useEffect(() => {
    if (!isRecording) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as Element;
      if (target && !target.closest('.workflow-recorder')) {
        recordInteraction('click', target);
      }
    };

    const handleInput = (e: Event) => {
      const target = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
      if (target && !target.closest('.workflow-recorder')) {
        recordDebouncedInput(target);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // F10 for manual screenshot
      if (e.key === 'F10') {
        e.preventDefault();
        const activeElement = document.activeElement;
        if (activeElement) {
          recordInteraction('screenshot', activeElement);
        }
      }
      // F9 to toggle recording
      if (e.key === 'F9') {
        e.preventDefault();
        if (isRecording) {
          stopRecording();
        } else {
          startRecording();
        }
      }
      // F11 to add note
      if (e.key === 'F11') {
        e.preventDefault();
        setShowNoteModal(true);
      }
    };

    document.addEventListener('click', handleClick);
    document.addEventListener('input', handleInput);
    document.addEventListener('change', handleInput);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('input', handleInput);
      document.removeEventListener('change', handleInput);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isRecording, recordInteraction, recordDebouncedInput]);

  // Auto-save workflow JSON
  const autoSaveWorkflowJSON = useCallback(async (sessionData: WorkflowSession) => {
    try {
      const exportData = {
        session: sessionData,
        metadata: {
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: new Date().toISOString(),
          totalInteractions: sessionData.interactions.length,
          totalScreenshots: sessionData.screenshots.length,
        }
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      
      await invoke('save_workflow_json', { 
        sessionId: sessionData.sessionId, 
        workflowData: dataStr 
      });
      
      console.log('✅ Workflow JSON auto-saved');
    } catch (error) {
      console.warn('⚠️ Auto-save workflow JSON failed:', error);
    }
  }, []);

  // Periodic auto-save during recording
  useEffect(() => {
    if (!isRecording || !session) return;

    const autoSaveInterval = setInterval(async () => {
      if (session && session.interactions.length > 0) {
        await autoSaveWorkflowJSON(session);
      }
    }, 30000); // Auto-save every 30 seconds

    return () => {
      clearInterval(autoSaveInterval);
    };
  }, [isRecording, session, autoSaveWorkflowJSON]);

  const startRecording = useCallback(() => {
    const sessionId = `cableforge-workflow-${Date.now()}`;
    const newSession: WorkflowSession = {
      sessionId,
      startTime: new Date().toISOString(),
      interactions: [],
      screenshots: []
    };
    
    setSession(newSession);
    setIsRecording(true);
    screenshotCounter.current = 0;
    setCurrentStep(detectWorkflowStep());
  }, [detectWorkflowStep]);

  const stopRecording = useCallback(async () => {
    if (!session) return;

    setIsRecording(false);
    
    const finalSession: WorkflowSession = {
      ...session,
      endTime: new Date().toISOString()
    };
    
    setSession(finalSession);
    
    // Final auto-save
    await autoSaveWorkflowJSON(finalSession);
  }, [session, autoSaveWorkflowJSON]);

  const addNote = useCallback(async () => {
    if (!noteText.trim() || !isRecording) return;

    const activeElement = document.activeElement || document.body;
    
    const noteInteraction: InteractionEvent = {
      type: 'note',
      selector: getElementSelector(activeElement),
      timestamp: new Date().toISOString(),
      noteText: noteText.trim(),
      step: currentStep,
      isPriority: true
    };

    setSession(prev => prev ? {
      ...prev,
      interactions: [...prev.interactions, noteInteraction]
    } : null);

    setNoteText('');
    setShowNoteModal(false);
  }, [noteText, isRecording, getElementSelector, currentStep]);

  const exportWorkflow = useCallback(async () => {
    if (!session) return;

    setIsExporting(true);
    try {
      const exportData = {
        session,
        metadata: {
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: new Date().toISOString(),
          totalInteractions: session.interactions.length,
          totalScreenshots: session.screenshots.length,
        }
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      
      const zipPath = await invoke<string>('export_workflow_zip', {
        sessionId: session.sessionId,
        workflowData: dataStr,
        screenshotPaths: session.screenshots
      });

      alert(`Workflow exported to: ${zipPath}`);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed: ' + error);
    } finally {
      setIsExporting(false);
    }
  }, [session]);

  // Dragging functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMinimized) return;
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: position.x,
      startPosY: position.y
    };
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - dragRef.current.startX;
    const deltaY = e.clientY - dragRef.current.startY;
    
    setPosition({
      x: dragRef.current.startPosX + deltaX,
      y: dragRef.current.startPosY + deltaY
    });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const recorderStyle: React.CSSProperties = {
    position: 'fixed',
    top: position.y,
    left: position.x,
    zIndex: 9999,
    backgroundColor: 'white',
    border: '2px solid #1e40af',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    padding: isMinimized ? '8px' : '12px',
    minWidth: isMinimized ? 'auto' : '280px',
    cursor: isDragging ? 'grabbing' : 'grab',
    userSelect: 'none',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: '14px'
  };

  return (
    <>
      <div className="workflow-recorder" style={recorderStyle} onMouseDown={handleMouseDown}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isMinimized ? 0 : '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              backgroundColor: isRecording ? '#dc2626' : '#6b7280' 
            }} />
            <span style={{ fontWeight: '600', color: '#1f2937' }}>
              {isMinimized ? '📹' : 'Workflow Recorder'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}
              title={isMinimized ? 'Expand' : 'Minimize'}
            >
              {isMinimized ? '📖' : '📋'}
            </button>
            {onClose && (
              <button
                onClick={onClose}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}
                title="Close"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {!isMinimized && (
          <>
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                Current Step: <strong>{currentStep}</strong>
              </div>
              {session && (
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  Interactions: {session.interactions.length} | Screenshots: {session.screenshots.length}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={isRecording ? stopRecording : startRecording}
                style={{
                  padding: '6px 12px',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  backgroundColor: isRecording ? '#dc2626' : '#059669',
                  color: 'white'
                }}
              >
                {isRecording ? 'Stop' : 'Start'}
              </button>
              
              {isRecording && (
                <>
                  <button
                    onClick={() => setShowNoteModal(true)}
                    style={{
                      padding: '6px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      backgroundColor: 'white'
                    }}
                    title="Add Note (F11)"
                  >
                    📝 Note
                  </button>
                  
                  <button
                    onClick={async () => {
                      const activeElement = document.activeElement || document.body;
                      await recordInteraction('screenshot', activeElement);
                    }}
                    style={{
                      padding: '6px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      backgroundColor: 'white'
                    }}
                    title="Take Screenshot (F10)"
                  >
                    📸
                  </button>
                </>
              )}
              
              {session && session.interactions.length > 0 && (
                <button
                  onClick={exportWorkflow}
                  disabled={isExporting}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    cursor: isExporting ? 'not-allowed' : 'pointer',
                    backgroundColor: isExporting ? '#f3f4f6' : 'white'
                  }}
                >
                  {isExporting ? '⏳ Exporting...' : '📦 Export'}
                </button>
              )}
            </div>

            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '8px' }}>
              Shortcuts: F9 (Toggle) | F10 (Screenshot) | F11 (Note)
            </div>
          </>
        )}
      </div>

      {/* Note Modal */}
      {showNoteModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            minWidth: '400px'
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>
              Add Workflow Note
            </h3>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Describe what you're doing or add observations..."
              style={{
                width: '100%',
                height: '100px',
                padding: '8px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowNoteModal(false);
                  setNoteText('');
                }}
                style={{
                  padding: '6px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  backgroundColor: 'white'
                }}
              >
                Cancel
              </button>
              <button
                onClick={addNote}
                style={{
                  padding: '6px 12px',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  backgroundColor: '#1e40af',
                  color: 'white'
                }}
              >
                Add Note
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};