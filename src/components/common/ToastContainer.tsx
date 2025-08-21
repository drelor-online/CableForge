import React, { useState, useCallback, useEffect } from 'react';
import { ToastNotification } from '../../types/common';
import { errorService } from '../../services/error-service';
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react';

interface ToastProps {
  toast: ToastNotification;
  onDismiss: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Animate in
    const enterTimer = setTimeout(() => setIsVisible(true), 50);
    
    // Auto-dismiss if duration is set
    let dismissTimer: NodeJS.Timeout;
    if (toast.duration && toast.duration > 0) {
      dismissTimer = setTimeout(() => {
        handleDismiss();
      }, toast.duration);
    }

    return () => {
      clearTimeout(enterTimer);
      if (dismissTimer) clearTimeout(dismissTimer);
    };
  }, [toast.duration]);

  const handleDismiss = useCallback(() => {
    setIsLeaving(true);
    setTimeout(() => {
      onDismiss(toast.id);
    }, 200); // Match animation duration
  }, [toast.id, onDismiss]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
      default:
        return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  const getBackgroundClass = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getTitleClass = () => {
    switch (toast.type) {
      case 'success':
        return 'text-green-800';
      case 'error':
        return 'text-red-800';
      case 'warning':
        return 'text-yellow-800';
      case 'info':
        return 'text-blue-800';
      default:
        return 'text-gray-800';
    }
  };

  const getMessageClass = () => {
    switch (toast.type) {
      case 'success':
        return 'text-green-700';
      case 'error':
        return 'text-red-700';
      case 'warning':
        return 'text-yellow-700';
      case 'info':
        return 'text-blue-700';
      default:
        return 'text-gray-700';
    }
  };

  return (
    <div
      className={`
        transform transition-all duration-200 ease-in-out
        ${isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        max-w-sm w-full ${getBackgroundClass()} shadow-lg rounded-lg border pointer-events-auto
      `}
      role="alert"
      aria-live="polite"
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="ml-3 w-0 flex-1">
            <p className={`text-sm font-medium ${getTitleClass()}`}>
              {toast.title}
            </p>
            {toast.message && (
              <p className={`mt-1 text-sm ${getMessageClass()}`}>
                {toast.message}
              </p>
            )}
            {toast.action && (
              <div className="mt-3">
                <button
                  onClick={toast.action.onClick}
                  className={`text-sm font-medium underline hover:no-underline ${getTitleClass()}`}
                >
                  {toast.action.label}
                </button>
              </div>
            )}
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={handleDismiss}
              className={`rounded-md inline-flex focus:outline-none focus:ring-2 focus:ring-offset-2 ${getTitleClass()} hover:opacity-75`}
            >
              <span className="sr-only">Close</span>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const addToast = useCallback((toast: ToastNotification) => {
    setToasts(prev => [toast, ...prev]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  useEffect(() => {
    // Register with error service to receive toast notifications
    errorService.registerToastCallback(addToast);
    
    return () => {
      errorService.unregisterToastCallback(addToast);
    };
  }, [addToast]);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
      aria-live="assertive"
      className="fixed inset-0 flex items-end justify-end px-4 py-6 pointer-events-none sm:p-6 z-50"
    >
      <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            toast={toast}
            onDismiss={removeToast}
          />
        ))}
      </div>
    </div>
  );
};

// Hook for manually showing toasts
export const useToast = () => {
  const showToast = useCallback((toast: Omit<ToastNotification, 'id'>) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullToast: ToastNotification = { ...toast, id };
    
    // Use error service to show the toast
    errorService.registerToastCallback(() => {});
    errorService.showSuccess(fullToast.message || '', fullToast.title);
  }, []);

  const showSuccess = useCallback((message: string, title = 'Success') => {
    errorService.showSuccess(message, title);
  }, []);

  const showError = useCallback((message: string, title = 'Error') => {
    const toast: ToastNotification = {
      id: `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'error',
      title,
      message,
      duration: 8000,
    };
    showToast(toast);
  }, [showToast]);

  const showWarning = useCallback((message: string, title = 'Warning') => {
    errorService.showWarning(message, title);
  }, []);

  const showInfo = useCallback((message: string, title = 'Information') => {
    errorService.showInfo(message, title);
  }, []);

  return {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};