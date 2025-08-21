import React, { useEffect, useCallback, useRef } from 'react';
import { X } from 'lucide-react';
import { ModalProps } from '../../types/common';
import { Icon } from './Icon';

interface ModalComponentProps extends ModalProps {
  children: React.ReactNode;
  className?: string;
  headerContent?: React.ReactNode;
  footerContent?: React.ReactNode;
  showCloseButton?: boolean;
}

export const Modal: React.FC<ModalComponentProps> = ({
  isOpen,
  onClose,
  title,
  size = 'md',
  closeOnEscape = true,
  closeOnOverlayClick = true,
  children,
  className = '',
  headerContent,
  footerContent,
  showCloseButton = true,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<Element | null>(null);

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'max-w-md';
      case 'md':
        return 'max-w-lg';
      case 'lg':
        return 'max-w-2xl';
      case 'xl':
        return 'max-w-4xl';
      case 'full':
        return 'max-w-7xl mx-4';
      default:
        return 'max-w-lg';
    }
  };

  const handleEscape = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape' && closeOnEscape) {
      onClose();
    }
  }, [closeOnEscape, onClose]);

  const handleOverlayClick = useCallback((event: React.MouseEvent) => {
    if (event.target === event.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  }, [closeOnOverlayClick, onClose]);

  useEffect(() => {
    if (isOpen) {
      // Store the previously focused element
      previousActiveElement.current = document.activeElement;
      
      // Focus the modal
      if (modalRef.current) {
        modalRef.current.focus();
      }
      
      // Add escape key listener
      document.addEventListener('keydown', handleEscape);
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    } else {
      // Restore focus to the previously focused element
      if (previousActiveElement.current instanceof HTMLElement) {
        previousActiveElement.current.focus();
      }
      
      // Remove escape key listener
      document.removeEventListener('keydown', handleEscape);
      
      // Restore body scroll
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        ref={modalRef}
        className={`
          bg-white rounded-lg shadow-xl w-full ${getSizeClasses()} 
          max-h-[90vh] flex flex-col ${className}
        `}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || headerContent || showCloseButton) && (
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center">
              {title && (
                <h2 id="modal-title" className="text-xl font-semibold text-gray-900">
                  {title}
                </h2>
              )}
              {headerContent}
            </div>
            
            {showCloseButton && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close modal"
              >
                <Icon icon={X} size="md" />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>

        {/* Footer */}
        {footerContent && (
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
            {footerContent}
          </div>
        )}
      </div>
    </div>
  );
};

// Pre-configured modal for confirmations
export const ConfirmationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'info',
  loading = false,
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white';
      case 'warning':
        return 'bg-yellow-600 hover:bg-yellow-700 text-white';
      case 'info':
        return 'bg-blue-600 hover:bg-blue-700 text-white';
      default:
        return 'bg-blue-600 hover:bg-blue-700 text-white';
    }
  };

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footerContent={
        <>
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`px-4 py-2 rounded disabled:opacity-50 ${getVariantClasses()}`}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </>
      }
    >
      <p className="text-gray-600">{message}</p>
    </Modal>
  );
};

// Pre-configured modal for forms
export const FormModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  title: string;
  children: React.ReactNode;
  submitText?: string;
  cancelText?: string;
  isValid?: boolean;
  loading?: boolean;
  size?: ModalProps['size'];
}> = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  children,
  submitText = 'Save',
  cancelText = 'Cancel',
  isValid = true,
  loading = false,
  size = 'md',
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid && !loading) {
      onSubmit();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size={size}
      footerContent={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="submit"
            form="modal-form"
            disabled={!isValid || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : submitText}
          </button>
        </>
      }
    >
      <form id="modal-form" onSubmit={handleSubmit}>
        {children}
      </form>
    </Modal>
  );
};

export default Modal;