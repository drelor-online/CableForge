import React, { useEffect, useRef } from 'react';
import { theme, colors } from '../../theme';
import { Icon } from '../common/Icon';
import { X } from 'lucide-react';
import Button from './Button';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  children,
  footer,
  className = '',
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Size variants
  const sizeStyles: Record<ModalProps['size'] & string, React.CSSProperties> = {
    sm: {
      maxWidth: '24rem', // 384px
      width: '90%',
      maxHeight: '80vh',
    },
    md: {
      maxWidth: '32rem', // 512px
      width: '90%',
      maxHeight: '80vh',
    },
    lg: {
      maxWidth: '48rem', // 768px
      width: '90%',
      maxHeight: '85vh',
    },
    xl: {
      maxWidth: '64rem', // 1024px
      width: '95%',
      maxHeight: '90vh',
    },
    full: {
      width: '95vw',
      height: '95vh',
      maxWidth: 'none',
      maxHeight: 'none',
    }
  };

  // Overlay styles
  const overlayStyles: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background.overlay,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: theme.zIndex.modal,
    padding: theme.spacing[4],
  };

  // Modal content styles
  const modalContentStyles: React.CSSProperties = {
    backgroundColor: colors.background.primary,
    borderRadius: theme.borderRadius.lg,
    boxShadow: theme.shadows.xl,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    position: 'relative',
    outline: 'none',
    ...sizeStyles[size],
  };

  // Header styles
  const headerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${theme.spacing[4]} ${theme.spacing[6]}`,
    borderBottom: `1px solid ${colors.border.light}`,
    flexShrink: 0,
  };

  // Title styles
  const titleStyles: React.CSSProperties = {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: colors.text.primary,
    margin: 0,
  };

  // Body styles
  const bodyStyles: React.CSSProperties = {
    flex: 1,
    padding: theme.spacing[6],
    overflow: 'auto',
    minHeight: 0, // Allows flex child to shrink
  };

  // Footer styles
  const footerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: theme.spacing[3],
    padding: `${theme.spacing[4]} ${theme.spacing[6]}`,
    borderTop: `1px solid ${colors.border.light}`,
    flexShrink: 0,
  };

  // Close button styles
  const closeButtonStyles: React.CSSProperties = {
    padding: theme.spacing[2],
    color: colors.text.tertiary,
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: theme.borderRadius.md,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: theme.transitions.colors,
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (closeOnEscape && event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Store the previously focused element
      previousFocusRef.current = document.activeElement as HTMLElement;
      
      // Focus the modal
      setTimeout(() => {
        modalRef.current?.focus();
      }, 0);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      // Restore focus when modal closes
      if (!isOpen && previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen, closeOnEscape, onClose]);

  // Handle body scroll lock
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  // Handle overlay click
  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnOverlayClick && event.target === event.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      style={overlayStyles}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        ref={modalRef}
        style={modalContentStyles}
        className={`cableforge-modal ${className}`}
        tabIndex={-1}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div style={headerStyles}>
            {title && (
              <h2 id="modal-title" style={titleStyles}>
                {title}
              </h2>
            )}
            
            {showCloseButton && (
              <button
                onClick={onClose}
                style={closeButtonStyles}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.gray[100];
                  e.currentTarget.style.color = colors.text.secondary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = colors.text.tertiary;
                }}
                aria-label="Close modal"
                title="Close modal"
              >
                <Icon icon={X} size="sm" />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div style={bodyStyles}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div style={footerStyles}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

// Common footer configurations
export const ModalFooter: React.FC<{
  onCancel?: () => void;
  onConfirm?: () => void;
  cancelLabel?: string;
  confirmLabel?: string;
  confirmVariant?: 'primary' | 'danger';
  isLoading?: boolean;
  additionalActions?: React.ReactNode;
}> = ({
  onCancel,
  onConfirm,
  cancelLabel = 'Cancel',
  confirmLabel = 'Confirm',
  confirmVariant = 'primary',
  isLoading = false,
  additionalActions,
}) => {
  return (
    <>
      {additionalActions}
      {onCancel && (
        <Button
          variant="secondary"
          onClick={onCancel}
          disabled={isLoading}
        >
          {cancelLabel}
        </Button>
      )}
      {onConfirm && (
        <Button
          variant={confirmVariant}
          onClick={onConfirm}
          loading={isLoading}
          disabled={isLoading}
        >
          {confirmLabel}
        </Button>
      )}
    </>
  );
};

export default Modal;