import React, { forwardRef } from 'react';
import { theme, colors } from '../../theme';
import { Icon } from '../common/Icon';
import { LucideIcon } from 'lucide-react';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  variant?: 'default' | 'error' | 'success';
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
  label?: string;
  helperText?: string;
  error?: string;
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  variant = 'default',
  size = 'md',
  leftIcon,
  rightIcon,
  label,
  helperText,
  error,
  fullWidth = false,
  disabled,
  className = '',
  style,
  ...props
}, ref) => {
  // Determine the effective variant (error takes precedence)
  const effectiveVariant = error ? 'error' : variant;

  // Base container styles
  const containerStyles: React.CSSProperties = {
    position: 'relative',
    width: fullWidth ? '100%' : 'auto',
    fontFamily: theme.typography.fontFamily.sans.join(', '),
  };

  // Base input styles
  const baseInputStyles: React.CSSProperties = {
    fontFamily: theme.typography.fontFamily.sans.join(', '),
    borderWidth: '1px',
    borderStyle: 'solid',
    borderRadius: theme.borderRadius.md,
    transition: theme.transitions.colors,
    outline: 'none',
    width: '100%',
    backgroundColor: disabled ? colors.gray[100] : colors.background.primary,
    color: disabled ? colors.text.muted : colors.text.primary,
    cursor: disabled ? 'not-allowed' : 'text',
    ...style
  };

  // Size variants
  const sizeStyles: Record<InputProps['size'] & string, React.CSSProperties> = {
    sm: {
      height: theme.heights.controlSm,
      paddingLeft: leftIcon ? '32px' : theme.spacing[3],
      paddingRight: rightIcon ? '32px' : theme.spacing[3],
      fontSize: theme.typography.fontSize.sm,
      lineHeight: theme.typography.lineHeight.tight,
    },
    md: {
      height: theme.heights.control,
      paddingLeft: leftIcon ? '40px' : theme.spacing[3],
      paddingRight: rightIcon ? '40px' : theme.spacing[3],
      fontSize: theme.typography.fontSize.base,
      lineHeight: theme.typography.lineHeight.normal,
    },
    lg: {
      height: theme.heights.controlLg,
      paddingLeft: leftIcon ? '44px' : theme.spacing[4],
      paddingRight: rightIcon ? '44px' : theme.spacing[4],
      fontSize: theme.typography.fontSize.lg,
      lineHeight: theme.typography.lineHeight.normal,
    }
  };

  // Variant styles
  const getVariantStyles = (variant: InputProps['variant'] & string): React.CSSProperties => {
    switch (variant) {
      case 'error':
        return {
          borderColor: colors.error[600],
        };
      
      case 'success':
        return {
          borderColor: colors.success[600],
        };
      
      default:
        return {
          borderColor: colors.border.medium,
        };
    }
  };

  // Focus styles
  const getFocusStyles = (variant: InputProps['variant'] & string): React.CSSProperties => {
    switch (variant) {
      case 'error':
        return {
          borderColor: colors.error[600],
          boxShadow: `0 0 0 2px ${colors.error[600]}40`, // 40 is 25% opacity in hex
        };
      
      case 'success':
        return {
          borderColor: colors.success[600],
          boxShadow: `0 0 0 2px ${colors.success[600]}40`,
        };
      
      default:
        return {
          borderColor: colors.border.focus,
          boxShadow: `0 0 0 2px ${colors.primary[500]}40`,
        };
    }
  };

  // Hover styles
  const getHoverStyles = (variant: InputProps['variant'] & string): React.CSSProperties => {
    if (disabled) return {};
    
    switch (variant) {
      case 'error':
        return {
          borderColor: colors.error[700],
        };
      
      case 'success':
        return {
          borderColor: colors.success[700],
        };
      
      default:
        return {
          borderColor: colors.border.dark,
        };
    }
  };

  const combinedInputStyles = {
    ...baseInputStyles,
    ...sizeStyles[size],
    ...getVariantStyles(effectiveVariant),
  };

  // Icon styles
  const getIconStyles = (position: 'left' | 'right'): React.CSSProperties => {
    const baseIconSize = size === 'sm' ? 16 : size === 'lg' ? 20 : 18;
    const topOffset = size === 'sm' ? '6px' : size === 'lg' ? '10px' : '7px';
    
    return {
      position: 'absolute',
      top: '50%',
      transform: 'translateY(-50%)',
      [position]: size === 'sm' ? '8px' : size === 'lg' ? '12px' : '10px',
      pointerEvents: 'none',
      color: disabled ? colors.text.muted : colors.text.tertiary,
      width: `${baseIconSize}px`,
      height: `${baseIconSize}px`,
    };
  };

  // Label styles
  const labelStyles: React.CSSProperties = {
    display: 'block',
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: colors.text.secondary,
    marginBottom: theme.spacing[1],
  };

  // Helper text styles
  const helperTextStyles: React.CSSProperties = {
    marginTop: theme.spacing[1],
    fontSize: theme.typography.fontSize.xs,
    color: error ? colors.error[600] : colors.text.tertiary,
  };

  const iconSize = size === 'sm' ? 'xs' : size === 'lg' ? 'md' : 'sm';

  return (
    <div style={containerStyles}>
      {label && (
        <label style={labelStyles}>
          {label}
        </label>
      )}
      
      <div style={{ position: 'relative' }}>
        {leftIcon && (
          <div style={getIconStyles('left')}>
            <Icon icon={leftIcon} size={iconSize} />
          </div>
        )}
        
        <input
          {...props}
          ref={ref}
          disabled={disabled}
          className={`cableforge-input ${className}`}
          style={combinedInputStyles}
          onFocus={(e) => {
            if (!disabled) {
              Object.assign(e.currentTarget.style, getFocusStyles(effectiveVariant));
            }
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            if (!disabled) {
              Object.assign(e.currentTarget.style, getVariantStyles(effectiveVariant));
            }
            props.onBlur?.(e);
          }}
          onMouseEnter={(e) => {
            if (!disabled && document.activeElement !== e.currentTarget) {
              Object.assign(e.currentTarget.style, getHoverStyles(effectiveVariant));
            }
            props.onMouseEnter?.(e);
          }}
          onMouseLeave={(e) => {
            if (!disabled && document.activeElement !== e.currentTarget) {
              Object.assign(e.currentTarget.style, getVariantStyles(effectiveVariant));
            }
            props.onMouseLeave?.(e);
          }}
        />
        
        {rightIcon && (
          <div style={getIconStyles('right')}>
            <Icon icon={rightIcon} size={iconSize} />
          </div>
        )}
      </div>
      
      {(helperText || error) && (
        <div style={helperTextStyles}>
          {error || helperText}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;