// Common type definitions for CableForge

// ===== STATUS AND STATE TYPES =====

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export type ValidationState = 'pending' | 'valid' | 'warning' | 'error';

export interface LoadingStatus {
  state: LoadingState;
  message?: string;
  progress?: number;
}

// ===== ERROR HANDLING TYPES =====

export interface AppError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ValidationError extends AppError {
  field?: string;
  value?: unknown;
  constraint?: string;
}

export interface ApiError extends AppError {
  statusCode?: number;
  endpoint?: string;
  method?: string;
}

// ===== ASYNC OPERATION TYPES =====

export interface AsyncOperationResult<T> {
  success: boolean;
  data?: T;
  error?: AppError;
  warnings?: ValidationError[];
}

export interface ProgressInfo {
  current: number;
  total: number;
  percentage: number;
  stage: string;
  estimatedTimeRemaining?: number;
}

// ===== FORM AND VALIDATION TYPES =====

export interface FormFieldError {
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface FormValidationResult {
  isValid: boolean;
  errors: FormFieldError[];
  warnings: FormFieldError[];
}

// ===== SELECTION AND FILTERING TYPES =====

export interface SelectionState<T = string> {
  selectedItems: Set<T>;
  selectAll: boolean;
  indeterminate: boolean;
}

export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

// ===== MODAL AND UI TYPES =====

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnEscape?: boolean;
  closeOnOverlayClick?: boolean;
}

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// ===== UTILITY TYPES =====

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// ===== SERVICE RESPONSE TYPES =====

export interface ServiceResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: AppError[];
  warnings?: ValidationError[];
  metadata?: {
    timestamp: Date;
    requestId?: string;
    version?: string;
  };
}

export interface PaginatedResponse<T> extends ServiceResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

// ===== HOOK RETURN TYPES =====

export interface UseAsyncResult<T> {
  data: T | null;
  loading: boolean;
  error: AppError | null;
  execute: (...args: any[]) => Promise<void>;
  reset: () => void;
}

export interface UseLocalStorageResult<T> {
  value: T;
  setValue: (value: T | ((prev: T) => T)) => void;
  removeValue: () => void;
  loading: boolean;
  error: AppError | null;
}

export interface UseFormValidationResult {
  errors: Record<string, string[]>;
  warnings: Record<string, string[]>;
  isValid: boolean;
  hasWarnings: boolean;
  validateField: (field: string, value: unknown) => void;
  validateAll: () => boolean;
  clearFieldErrors: (field: string) => void;
  clearAllErrors: () => void;
}