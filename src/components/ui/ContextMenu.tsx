import React, { useEffect, useRef, useState } from 'react';
import { theme, colors } from '../../theme';
import { Icon } from '../common/Icon';
import { LucideIcon } from 'lucide-react';

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'danger';
  divider?: boolean; // Show divider after this item
}

export interface ContextMenuProps {
  items: ContextMenuItem[];
  x: number;
  y: number;
  onClose: () => void;
  isOpen: boolean;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  items,
  x,
  y,
  onClose,
  isOpen,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x, y });

  // Menu container styles
  const menuStyles: React.CSSProperties = {
    position: 'fixed',
    left: position.x,
    top: position.y,
    backgroundColor: colors.background.primary,
    border: `1px solid ${colors.border.medium}`,
    borderRadius: theme.borderRadius.md,
    boxShadow: theme.shadows.lg,
    padding: `${theme.spacing[1]} 0`,
    minWidth: '180px',
    maxWidth: '240px',
    zIndex: theme.zIndex.popover,
    overflow: 'hidden',
  };

  // Menu item styles
  const getItemStyles = (item: ContextMenuItem): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing[3],
      padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
      fontSize: theme.typography.fontSize.sm,
      cursor: item.disabled ? 'not-allowed' : 'pointer',
      transition: theme.transitions.colors,
      border: 'none',
      background: 'none',
      width: '100%',
      textAlign: 'left',
      opacity: item.disabled ? 0.5 : 1,
    };

    if (item.variant === 'danger') {
      return {
        ...baseStyles,
        color: item.disabled ? colors.text.muted : colors.error[600],
      };
    }

    return {
      ...baseStyles,
      color: item.disabled ? colors.text.muted : colors.text.primary,
    };
  };

  const getHoverStyles = (item: ContextMenuItem): React.CSSProperties => {
    if (item.disabled) return {};

    if (item.variant === 'danger') {
      return {
        backgroundColor: colors.error[50],
        color: colors.error[700],
      };
    }

    return {
      backgroundColor: colors.gray[50],
      color: colors.text.primary,
    };
  };

  // Divider styles
  const dividerStyles: React.CSSProperties = {
    height: '1px',
    backgroundColor: colors.border.light,
    margin: `${theme.spacing[1]} 0`,
  };

  // Position adjustment to keep menu on screen
  useEffect(() => {
    if (!isOpen || !menuRef.current) return;

    const menu = menuRef.current;
    const menuRect = menu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let adjustedX = x;
    let adjustedY = y;

    // Adjust horizontal position if menu would go off right edge
    if (x + menuRect.width > viewportWidth) {
      adjustedX = viewportWidth - menuRect.width - 10;
    }

    // Adjust vertical position if menu would go off bottom edge
    if (y + menuRect.height > viewportHeight) {
      adjustedY = viewportHeight - menuRect.height - 10;
    }

    // Ensure menu doesn't go off left or top edge
    adjustedX = Math.max(10, adjustedX);
    adjustedY = Math.max(10, adjustedY);

    if (adjustedX !== position.x || adjustedY !== position.y) {
      setPosition({ x: adjustedX, y: adjustedY });
    }
  }, [isOpen, x, y, position.x, position.y]);

  // Handle clicks outside menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      
      // Focus the menu for keyboard navigation
      setTimeout(() => {
        menuRef.current?.focus();
      }, 0);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      const enabledItems = items.filter(item => !item.disabled);
      if (enabledItems.length === 0) return;

      const focusedElement = document.activeElement;
      const menuItems = menuRef.current?.querySelectorAll('[role="menuitem"]:not([disabled])');
      
      if (!menuItems) return;

      const currentIndex = Array.from(menuItems).indexOf(focusedElement as HTMLElement);

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          const nextIndex = currentIndex < menuItems.length - 1 ? currentIndex + 1 : 0;
          (menuItems[nextIndex] as HTMLElement).focus();
          break;
          
        case 'ArrowUp':
          event.preventDefault();
          const prevIndex = currentIndex > 0 ? currentIndex - 1 : menuItems.length - 1;
          (menuItems[prevIndex] as HTMLElement).focus();
          break;
          
        case 'Enter':
        case ' ':
          event.preventDefault();
          if (currentIndex >= 0) {
            const item = enabledItems.find((_, index) => index === currentIndex);
            if (item) {
              item.onClick();
              onClose();
            }
          }
          break;
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, items, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleItemClick = (item: ContextMenuItem) => {
    if (item.disabled) return;
    
    item.onClick();
    onClose();
  };

  return (
    <div
      ref={menuRef}
      style={menuStyles}
      role="menu"
      tabIndex={-1}
      className="cableforge-context-menu"
    >
      {items.map((item, index) => (
        <React.Fragment key={item.id}>
          <button
            role="menuitem"
            disabled={item.disabled}
            style={getItemStyles(item)}
            onClick={() => handleItemClick(item)}
            onMouseEnter={(e) => {
              if (!item.disabled) {
                Object.assign(e.currentTarget.style, getHoverStyles(item));
              }
            }}
            onMouseLeave={(e) => {
              if (!item.disabled) {
                Object.assign(e.currentTarget.style, getItemStyles(item));
              }
            }}
            tabIndex={item.disabled ? -1 : 0}
          >
            {item.icon && (
              <Icon 
                icon={item.icon} 
                size="sm" 
                color={item.disabled ? colors.text.muted : 
                       item.variant === 'danger' ? colors.error[600] : 
                       colors.text.secondary
                } 
              />
            )}
            <span>{item.label}</span>
          </button>
          
          {item.divider && index < items.length - 1 && (
            <div style={dividerStyles} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

// Hook for managing context menu state
export const useContextMenu = () => {
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    items: ContextMenuItem[];
  }>({
    isOpen: false,
    x: 0,
    y: 0,
    items: [],
  });

  const showContextMenu = (
    event: React.MouseEvent,
    items: ContextMenuItem[]
  ) => {
    event.preventDefault();
    setContextMenu({
      isOpen: true,
      x: event.clientX,
      y: event.clientY,
      items,
    });
  };

  const hideContextMenu = () => {
    setContextMenu(prev => ({
      ...prev,
      isOpen: false,
    }));
  };

  return {
    contextMenu,
    showContextMenu,
    hideContextMenu,
  };
};

export default ContextMenu;