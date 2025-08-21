import React, { forwardRef } from 'react';
import { theme, colors } from '../../theme';
import { Icon } from '../common/Icon';
import { ChevronDown, LucideIcon } from 'lucide-react';

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  variant?: 'default' | 'error' | 'success';
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: LucideIcon;
  label?: string;
  helperText?: string;
  error?: string;
  fullWidth?: boolean;
  placeholder?: string;
  options?: Array<{ value: string | number; label: string; disabled?: boolean }>;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  variant = 'default',
  size = 'md',
  leftIcon,
  label,
  helperText,
  error,
  fullWidth = false,
  placeholder,
  options = [],
  disabled,
  className = '',
  style,
  children,
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

  // Base select styles
  const baseSelectStyles: React.CSSProperties = {
    fontFamily: theme.typography.fontFamily.sans.join(', '),
    borderWidth: '1px',
    borderStyle: 'solid',
    borderRadius: theme.borderRadius.md,
    transition: theme.transitions.colors,
    outline: 'none',
    width: '100%',
    backgroundColor: disabled ? colors.gray[100] : colors.background.primary,
    color: disabled ? colors.text.muted : colors.text.primary,
    cursor: disabled ? 'not-allowed' : 'pointer',
    appearance: 'none', // Remove default arrow
    backgroundImage: 'none', // Ensure no background image interferes
    ...style
  };

  // Size variants
  const sizeStyles: Record<SelectProps['size'] & string, React.CSSProperties> = {
    sm: {
      height: theme.heights.controlSm,
      paddingLeft: leftIcon ? '32px' : theme.spacing[3],
      paddingRight: '32px', // Always leave space for chevron
      fontSize: theme.typography.fontSize.sm,
      lineHeight: theme.typography.lineHeight.tight,
    },
    md: {
      height: theme.heights.control,
      paddingLeft: leftIcon ? '40px' : theme.spacing[3],
      paddingRight: '40px', // Always leave space for chevron
      fontSize: theme.typography.fontSize.base,
      lineHeight: theme.typography.lineHeight.normal,
    },
    lg: {
      height: theme.heights.controlLg,
      paddingLeft: leftIcon ? '44px' : theme.spacing[4],
      paddingRight: '44px', // Always leave space for chevron
      fontSize: theme.typography.fontSize.lg,
      lineHeight: theme.typography.lineHeight.normal,
    }
  };

  // Variant styles
  const getVariantStyles = (variant: SelectProps['variant'] & string): React.CSSProperties => {
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
  const getFocusStyles = (variant: SelectProps['variant'] & string): React.CSSProperties => {
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
  const getHoverStyles = (variant: SelectProps['variant'] & string): React.CSSProperties => {
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

  const combinedSelectStyles = {
    ...baseSelectStyles,
    ...sizeStyles[size],
    ...getVariantStyles(effectiveVariant),
  };

  // Icon styles
  const getLeftIconStyles = (): React.CSSProperties => {
    return {
      position: 'absolute',
      top: '50%',
      transform: 'translateY(-50%)',
      left: size === 'sm' ? '8px' : size === 'lg' ? '12px' : '10px',
      pointerEvents: 'none',
      color: disabled ? colors.text.muted : colors.text.tertiary,
    };
  };

  const getChevronStyles = (): React.CSSProperties => {
    return {
      position: 'absolute',
      top: '50%',
      transform: 'translateY(-50%)',
      right: size === 'sm' ? '8px' : size === 'lg' ? '12px' : '10px',
      pointerEvents: 'none',
      color: disabled ? colors.text.muted : colors.text.tertiary,
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
          <div style={getLeftIconStyles()}>
            <Icon icon={leftIcon} size={iconSize} />
          </div>
        )}
        
        <select
          {...props}
          ref={ref}
          disabled={disabled}
          className={`cableforge-select ${className}`}
          style={combinedSelectStyles}
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
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          
          {options.length > 0 ? (
            options.map((option) => (
              <option
                key={String(option.value)}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))
          ) : (
            children
          )}
        </select>
        
        {/* Custom chevron icon */}
        <div style={getChevronStyles()}>
          <Icon icon={ChevronDown} size={iconSize} />
        </div>
      </div>
      
      {(helperText || error) && (
        <div style={helperTextStyles}>
          {error || helperText}
        </div>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;