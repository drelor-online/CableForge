/**
 * Workflow recording type definitions for CableForge
 */

export interface InteractionEvent {
  type: 'click' | 'input' | 'select' | 'navigation' | 'screenshot' | 'step_change' | 'note';
  selector: string;
  value?: string;
  timestamp: string;
  screenshot?: string;
  elementText?: string;
  elementTag?: string;
  elementAttributes?: Record<string, string>;
  step?: string;
  finalValue?: string; // For debounced inputs
  noteText?: string; // For note interactions
  isPriority?: boolean; // Mark notes as priority interactions
}

export interface WorkflowSession {
  sessionId: string;
  startTime: string;
  endTime?: string;
  interactions: InteractionEvent[];
  screenshots: string[];
}

export interface WorkflowMetadata {
  userAgent: string;
  url: string;
  timestamp: string;
  totalInteractions: number;
  totalScreenshots: number;
}

export interface WorkflowExportData {
  session: WorkflowSession;
  metadata: WorkflowMetadata;
}

// CableForge specific workflow steps
export type CableForgeWorkflowStep = 
  | 'dashboard'
  | 'cable-management'
  | 'cable-editing'
  | 'validation-review'
  | 'file-operations'
  | 'io-management'
  | 'conduit-management'
  | 'reports'
  | 'unknown';

export interface StepIndicator {
  selector: string;
  step: CableForgeWorkflowStep;
  description?: string;
}