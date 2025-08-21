import React from 'react';
import { LucideIcon } from 'lucide-react';
import { theme } from '../../theme';

interface IconProps {
  icon: LucideIcon;
  size?: keyof typeof theme.iconSizes | number | string;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  'aria-label'?: string;
  'data-testid'?: string;
}

/**
 * Standardized Icon component that enforces consistent sizing and styling
 * across the application. Uses theme-based sizing by default.
 */
export const Icon: React.FC<IconProps> = ({
  icon: IconComponent,
  size = 'sm',
  color,
  className = '',
  style = {},
  onClick,
  'aria-label': ariaLabel,
  'data-testid': testId,
}) => {
  // Determine the actual size value
  const sizeValue = typeof size === 'string' && size in theme.iconSizes
    ? theme.iconSizes[size as keyof typeof theme.iconSizes]
    : size;

  // Calculate numeric size for lucide-react (expects a number)
  const numericSize = typeof sizeValue === 'string' 
    ? parseInt(sizeValue.replace('px', ''))
    : sizeValue;

  const iconStyle: React.CSSProperties = {
    color,
    cursor: onClick ? 'pointer' : undefined,
    // Prevent icon scaling issues
    maxWidth: typeof numericSize === 'number' ? `${numericSize}px` : '100%',
    maxHeight: typeof numericSize === 'number' ? `${numericSize}px` : '100%',
    flexShrink: 0,
    ...style,
  };

  return (
    <IconComponent
      size={numericSize}
      className={className}
      style={iconStyle}
      onClick={onClick}
      aria-label={ariaLabel}
      data-testid={testId}
    />
  );
};

// Common icon sizes as shortcuts
export const SmallIcon: React.FC<Omit<IconProps, 'size'>> = (props) => (
  <Icon {...props} size="sm" />
);

export const MediumIcon: React.FC<Omit<IconProps, 'size'>> = (props) => (
  <Icon {...props} size="md" />
);

export const LargeIcon: React.FC<Omit<IconProps, 'size'>> = (props) => (
  <Icon {...props} size="lg" />
);

// Button icon - sized appropriately for buttons
export const ButtonIcon: React.FC<Omit<IconProps, 'size'>> = (props) => (
  <Icon {...props} size="sm" />
);

// Header icon - sized appropriately for headers/toolbars
export const HeaderIcon: React.FC<Omit<IconProps, 'size'>> = (props) => (
  <Icon {...props} size="md" />
);

export default Icon;