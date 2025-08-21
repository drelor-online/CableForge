import React from 'react';
import { theme, colors } from '../../theme';
import { Icon } from '../common/Icon';
import { LucideIcon } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  fullWidth?: boolean;
  children?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  fullWidth = false,
  disabled,
  className = '',
  children,
  style,
  ...props
}) => {
  // Base styles that apply to all buttons
  const baseStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: children && icon ? '8px' : '0',
    fontFamily: theme.typography.fontFamily.sans.join(', '),
    fontWeight: theme.typography.fontWeight.medium,
    borderRadius: theme.borderRadius.md,
    border: '1px solid transparent',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: theme.transitions.colors,
    outline: 'none',
    textDecoration: 'none',
    userSelect: 'none',
    position: 'relative',
    width: fullWidth ? '100%' : 'auto',
    opacity: disabled || loading ? 0.5 : 1,
    ...style
  };

  // Size variants
  const sizeStyles: Record<ButtonProps['size'] & string, React.CSSProperties> = {
    sm: {
      height: theme.heights.buttonSm,
      paddingLeft: theme.spacing[3],
      paddingRight: theme.spacing[3],
      fontSize: theme.typography.fontSize.sm,
      lineHeight: theme.typography.lineHeight.tight,
    },
    md: {
      height: theme.heights.button,
      paddingLeft: theme.spacing[4],
      paddingRight: theme.spacing[4],
      fontSize: theme.typography.fontSize.base,
      lineHeight: theme.typography.lineHeight.normal,
    },
    lg: {
      height: theme.heights.buttonLg,
      paddingLeft: theme.spacing[6],
      paddingRight: theme.spacing[6],
      fontSize: theme.typography.fontSize.lg,
      lineHeight: theme.typography.lineHeight.normal,
    }
  };

  // Color variants
  const getVariantStyles = (variant: ButtonProps['variant'] & string): React.CSSProperties => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: colors.primary[600],
          color: colors.text.inverse,
          borderColor: colors.primary[600],
        };
      
      case 'secondary':
        return {
          backgroundColor: colors.gray[100],
          color: colors.text.primary,
          borderColor: colors.gray[300],
        };
      
      case 'outline':
        return {
          backgroundColor: 'transparent',
          color: colors.primary[600],
          borderColor: colors.primary[600],
        };
      
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          color: colors.text.primary,
          borderColor: 'transparent',
        };
      
      case 'danger':
        return {
          backgroundColor: colors.error[600],
          color: colors.text.inverse,
          borderColor: colors.error[600],
        };
      
      default:
        return {
          backgroundColor: colors.primary[600],
          color: colors.text.inverse,
          borderColor: colors.primary[600],
        };
    }
  };

  // Hover styles
  const getHoverStyles = (variant: ButtonProps['variant'] & string): React.CSSProperties => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: colors.primary[700],
          borderColor: colors.primary[700],
        };
      
      case 'secondary':
        return {
          backgroundColor: colors.gray[200],
          borderColor: colors.gray[400],
        };
      
      case 'outline':
        return {
          backgroundColor: colors.primary[50],
          borderColor: colors.primary[700],
        };
      
      case 'ghost':
        return {
          backgroundColor: colors.gray[100],
        };
      
      case 'danger':
        return {
          backgroundColor: colors.error[700],
          borderColor: colors.error[700],
        };
      
      default:
        return {
          backgroundColor: colors.primary[700],
          borderColor: colors.primary[700],
        };
    }
  };

  // Focus styles
  const getFocusStyles = (): React.CSSProperties => {
    return {
      boxShadow: `0 0 0 2px ${colors.primary[500]}40`, // 40 is 25% opacity in hex
    };
  };

  // Active styles
  const getActiveStyles = (variant: ButtonProps['variant'] & string): React.CSSProperties => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: colors.primary[800],
          borderColor: colors.primary[800],
        };
      
      case 'secondary':
        return {
          backgroundColor: colors.gray[300],
          borderColor: colors.gray[500],
        };
      
      case 'outline':
        return {
          backgroundColor: colors.primary[100],
          borderColor: colors.primary[800],
        };
      
      case 'ghost':
        return {
          backgroundColor: colors.gray[200],
        };
      
      case 'danger':
        return {
          backgroundColor: colors.error[800],
          borderColor: colors.error[800],
        };
      
      default:
        return {
          backgroundColor: colors.primary[800],
          borderColor: colors.primary[800],
        };
    }
  };

  const combinedStyles = {
    ...baseStyles,
    ...sizeStyles[size],
    ...getVariantStyles(variant),
  };

  const iconSize = size === 'sm' ? 'xs' : size === 'lg' ? 'md' : 'sm';

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`cableforge-button ${className}`}
      style={combinedStyles}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          Object.assign(e.currentTarget.style, getHoverStyles(variant));
        }
        props.onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        if (!disabled && !loading) {
          Object.assign(e.currentTarget.style, getVariantStyles(variant));
        }
        props.onMouseLeave?.(e);
      }}
      onFocus={(e) => {
        if (!disabled && !loading) {
          Object.assign(e.currentTarget.style, {
            ...getVariantStyles(variant),
            ...getFocusStyles(),
          });
        }
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        if (!disabled && !loading) {
          Object.assign(e.currentTarget.style, getVariantStyles(variant));
        }
        props.onBlur?.(e);
      }}
      onMouseDown={(e) => {
        if (!disabled && !loading) {
          Object.assign(e.currentTarget.style, getActiveStyles(variant));
        }
        props.onMouseDown?.(e);
      }}
      onMouseUp={(e) => {
        if (!disabled && !loading) {
          Object.assign(e.currentTarget.style, getHoverStyles(variant));
        }
        props.onMouseUp?.(e);
      }}
    >
      {loading ? (
        <div
          style={{
            width: '16px',
            height: '16px',
            border: '2px solid transparent',
            borderTop: `2px solid ${variant === 'primary' || variant === 'danger' ? colors.text.inverse : colors.text.primary}`,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Icon icon={icon} size={iconSize} />
          )}
          {children}
          {icon && iconPosition === 'right' && (
            <Icon icon={icon} size={iconSize} />
          )}
        </>
      )}
    </button>
  );
};

export default Button;