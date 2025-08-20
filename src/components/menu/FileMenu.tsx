import React, { useState, useRef, useEffect } from 'react';

interface FileMenuProps {
  onNewProject: () => void;
  onSaveProject: () => void;
  onSaveProjectAs: () => void;
  onOpenProject: () => void;
  onImportProject?: () => void;
  onExportProject?: () => void;
  isLoading: boolean;
}

export const FileMenu: React.FC<FileMenuProps> = ({
  onNewProject,
  onSaveProject,
  onSaveProjectAs,
  onOpenProject,
  onImportProject,
  onExportProject,
  isLoading
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleMenuClick = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  const menuItemClass = `
    flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 
    cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
  `;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded transition-colors"
      >
        File
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg">
          <div className="py-1">
            <div 
              className={menuItemClass}
              onClick={() => handleMenuClick(onNewProject)}
            >
              <span>📁</span>
              <span>New Project</span>
              <span className="ml-auto text-xs text-gray-400">Ctrl+N</span>
            </div>
            
            <div 
              className={menuItemClass}
              onClick={() => handleMenuClick(onOpenProject)}
            >
              <span>📂</span>
              <span>Open Project</span>
              <span className="ml-auto text-xs text-gray-400">Ctrl+O</span>
            </div>
            
            <div className="border-t border-gray-100 my-1"></div>
            
            <div 
              className={menuItemClass}
              onClick={() => handleMenuClick(onSaveProject)}
            >
              <span>💾</span>
              <span>Save</span>
              <span className="ml-auto text-xs text-gray-400">Ctrl+S</span>
            </div>
            
            <div 
              className={menuItemClass}
              onClick={() => handleMenuClick(onSaveProjectAs)}
            >
              <span>💾</span>
              <span>Save As...</span>
              <span className="ml-auto text-xs text-gray-400">Ctrl+Shift+S</span>
            </div>
            
            <div className="border-t border-gray-100 my-1"></div>
            
            {onImportProject && (
              <div 
                className={menuItemClass}
                onClick={() => handleMenuClick(onImportProject)}
              >
                <span>📥</span>
                <span>Import</span>
              </div>
            )}
            
            {onExportProject && (
              <div 
                className={menuItemClass}
                onClick={() => handleMenuClick(onExportProject)}
              >
                <span>📤</span>
                <span>Export</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};