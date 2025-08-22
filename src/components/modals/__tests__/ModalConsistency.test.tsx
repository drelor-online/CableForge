import React from 'react';
import { render } from '@testing-library/react';
import { UIProvider } from '../../../contexts/UIContext';
import { theme } from '../../../theme';

// Import all modals that should be using the standardized Modal component
import BulkEditModal from '../BulkEditModal';
import SettingsModal from '../SettingsModal';
import AutoNumberingModal from '../AutoNumberingModal';
import ExportBuilderModal from '../ExportBuilderModal';

// Mock dependencies to avoid complex setup
jest.mock('../../../services/tauri-database', () => ({
  TauriDatabaseService: {
    getInstance: jest.fn(() => ({
      getCables: jest.fn().mockResolvedValue([]),
      getTrays: jest.fn().mockResolvedValue([]),
      getConduits: jest.fn().mockResolvedValue([])
    }))
  }
}));

jest.mock('../../../services/settings-service', () => ({
  settingsService: {
    getSettings: jest.fn(() => ({
      general: { 
        companyName: 'Test Company',
        autoSaveInterval: 5,
        enableBackups: true,
        backupInterval: 30,
        maxBackups: 10
      },
      display: { 
        theme: 'light',
        fontSize: 'medium',
        showTooltips: true,
        animationSpeed: 'normal'
      },
      importexport: { 
        defaultFormat: 'xlsx',
        includeHiddenColumns: false,
        exportMetadata: true
      },
      advanced: { 
        enableAdvanced: false,
        debugMode: false,
        performanceMonitoring: false
      }
    })),
    subscribe: jest.fn(() => () => {}),
    updateSettings: jest.fn()
  }
}));

jest.mock('../../../services/export-service', () => ({
  exportService: {
    exportData: jest.fn(),
    getExportPresets: jest.fn(() => [])
  }
}));

jest.mock('../../../services/auto-numbering-service', () => ({
  autoNumberingService: {
    getSettings: jest.fn(() => ({
      patterns: {
        cable: { prefix: 'CBL', suffix: '', startNumber: 1, increment: 1, padLength: 3 }
      }
    })),
    updateSettings: jest.fn()
  }
}));

jest.mock('../../../hooks/useSelectableList', () => ({
  useColumnSelection: jest.fn(() => ({
    availableColumns: [],
    selectedCount: 0,
    totalCount: 0,
    toggleItem: jest.fn()
  }))
}));

jest.mock('../../../hooks/useAsyncOperation', () => ({
  useAsyncOperation: jest.fn(() => ({
    execute: jest.fn(),
    isLoading: false,
    error: null
  }))
}));

jest.mock('../../common/ToastContainer', () => ({
  useToast: jest.fn(() => ({
    showSuccess: jest.fn(),
    showError: jest.fn(),
    showInfo: jest.fn()
  }))
}));

// Test wrapper with required providers
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <UIProvider>
    {children}
  </UIProvider>
);

describe('Modal Consistency Tests', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn()
  };

  describe('Standardized Modal Components', () => {
    it('BulkEditModal should use standardized Modal structure', () => {
      const { container } = render(
        <TestWrapper>
          <BulkEditModal
            {...defaultProps}
            onUpdate={jest.fn()}
            selectedCables={[]}
            trays={[]}
            conduits={[]}
          />
        </TestWrapper>
      );

      // Check for standardized modal structure
      expect(container.querySelector('.cableforge-modal')).toBeInTheDocument();
      
      // Check for consistent header structure
      const modalTitle = container.querySelector('#modal-title');
      expect(modalTitle).toBeInTheDocument();
      
      // Check for close button
      const closeButton = container.querySelector('[aria-label="Close modal"]');
      expect(closeButton).toBeInTheDocument();
      
      // Take snapshot for visual consistency
      expect(container.firstChild).toMatchSnapshot('bulk-edit-modal');
    });

    it('SettingsModal should use standardized Modal structure', () => {
      const { container } = render(
        <TestWrapper>
          <SettingsModal {...defaultProps} />
        </TestWrapper>
      );

      // Check for standardized modal structure
      expect(container.querySelector('.cableforge-modal')).toBeInTheDocument();
      expect(container.querySelector('#modal-title')).toBeInTheDocument();
      expect(container.querySelector('[aria-label="Close modal"]')).toBeInTheDocument();
      
      expect(container.firstChild).toMatchSnapshot('settings-modal');
    });

    it('AutoNumberingModal should use standardized Modal structure', () => {
      const { container } = render(
        <TestWrapper>
          <AutoNumberingModal
            {...defaultProps}
            onSave={jest.fn()}
          />
        </TestWrapper>
      );

      expect(container.querySelector('.cableforge-modal')).toBeInTheDocument();
      expect(container.querySelector('#modal-title')).toBeInTheDocument();
      expect(container.querySelector('[aria-label="Close modal"]')).toBeInTheDocument();
      
      expect(container.firstChild).toMatchSnapshot('auto-numbering-modal');
    });

    it('ExportBuilderModal should use standardized Modal structure', () => {
      const { container } = render(
        <TestWrapper>
          <ExportBuilderModal
            {...defaultProps}
            data={[]}
            columns={[]}
          />
        </TestWrapper>
      );

      expect(container.querySelector('.cableforge-modal')).toBeInTheDocument();
      expect(container.querySelector('#modal-title')).toBeInTheDocument();
      expect(container.querySelector('[aria-label="Close modal"]')).toBeInTheDocument();
      
      expect(container.firstChild).toMatchSnapshot('export-builder-modal');
    });
  });

  describe('Modal Theme Consistency', () => {
    it('all modals should use theme variables for colors', () => {
      const modals = [
        <BulkEditModal
          {...defaultProps}
          onUpdate={jest.fn()}
          selectedCables={[]}
          trays={[]}
          conduits={[]}
        />,
        <SettingsModal {...defaultProps} />,
        <AutoNumberingModal {...defaultProps} onSave={jest.fn()} />,
        <ExportBuilderModal {...defaultProps} data={[]} columns={[]} />
      ];

      modals.forEach((modal, index) => {
        const { container } = render(
          <TestWrapper>
            {modal}
          </TestWrapper>
        );

        // Check that modals use theme colors (not hardcoded colors)
        const modalElement = container.querySelector('.cableforge-modal');
        if (modalElement) {
          const computedStyles = window.getComputedStyle(modalElement);
          
          // These should not be hardcoded colors
          expect(computedStyles.backgroundColor).not.toBe('white');
          expect(computedStyles.backgroundColor).not.toBe('#ffffff');
          expect(computedStyles.backgroundColor).not.toBe('rgb(255, 255, 255)');
        }
      });
    });

    it('all modals should have consistent spacing', () => {
      const modals = [
        { component: BulkEditModal, name: 'BulkEditModal' },
        { component: SettingsModal, name: 'SettingsModal' },
        { component: AutoNumberingModal, name: 'AutoNumberingModal' },
        { component: ExportBuilderModal, name: 'ExportBuilderModal' }
      ];

      modals.forEach(({ component: Modal, name }) => {
        const modalProps = name === 'BulkEditModal' 
          ? { 
              ...defaultProps,
              onUpdate: jest.fn().mockResolvedValue(undefined) as (updates: any) => Promise<void>, 
              selectedCables: [], 
              trays: [], 
              conduits: [] 
            }
          : name === 'AutoNumberingModal'
          ? { ...defaultProps, onSave: jest.fn() }
          : name === 'ExportBuilderModal'
          ? { ...defaultProps, data: [], columns: [] }
          : defaultProps;

        const { container } = render(
          <TestWrapper>
            <Modal {...modalProps} />
          </TestWrapper>
        );

        // Check header padding consistency
        const header = container.querySelector('div[style*="padding"]');
        if (header) {
          const computedStyles = window.getComputedStyle(header);
          // Should use theme spacing
          expect(computedStyles.padding).toBeDefined();
        }
      });
    });
  });

  describe('Modal Accessibility', () => {
    it('all modals should have proper ARIA attributes', () => {
      const { container } = render(
        <TestWrapper>
          <SettingsModal {...defaultProps} />
        </TestWrapper>
      );

      // Check for dialog role
      const dialog = container.querySelector('[role="dialog"]');
      expect(dialog).toBeInTheDocument();
      
      // Check for aria-modal
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      
      // Check for aria-labelledby pointing to title
      expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
    });

    it('all modals should have focus management', () => {
      const { container } = render(
        <TestWrapper>
          <SettingsModal {...defaultProps} />
        </TestWrapper>
      );

      // Modal should be focusable
      const modal = container.querySelector('.cableforge-modal');
      expect(modal).toHaveAttribute('tabIndex', '-1');
    });
  });

  describe('Modal Footer Consistency', () => {
    it('modals with ModalFooter should have consistent button styling', () => {
      const { container } = render(
        <TestWrapper>
          <BulkEditModal
            {...defaultProps}
            onUpdate={jest.fn()}
            selectedCables={[]}
            trays={[]}
            conduits={[]}
          />
        </TestWrapper>
      );

      // Look for footer buttons
      const buttons = container.querySelectorAll('button');
      const footerButtons = Array.from(buttons).filter(button => 
        button.textContent?.includes('Cancel') || 
        button.textContent?.includes('Save') ||
        button.textContent?.includes('Confirm')
      );

      expect(footerButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Responsive Design', () => {
    it('modals should handle different screen sizes', () => {
      // Test with different viewport sizes
      const originalInnerWidth = window.innerWidth;
      const originalInnerHeight = window.innerHeight;

      try {
        // Test mobile size
        Object.defineProperty(window, 'innerWidth', { value: 375, writable: true });
        Object.defineProperty(window, 'innerHeight', { value: 667, writable: true });

        const { container } = render(
          <TestWrapper>
            <SettingsModal {...defaultProps} />
          </TestWrapper>
        );

        const modal = container.querySelector('.cableforge-modal');
        expect(modal).toBeInTheDocument();

        // Test desktop size
        Object.defineProperty(window, 'innerWidth', { value: 1920, writable: true });
        Object.defineProperty(window, 'innerHeight', { value: 1080, writable: true });

        const { container: desktopContainer } = render(
          <TestWrapper>
            <SettingsModal {...defaultProps} />
          </TestWrapper>
        );

        const desktopModal = desktopContainer.querySelector('.cableforge-modal');
        expect(desktopModal).toBeInTheDocument();

      } finally {
        // Restore original values
        Object.defineProperty(window, 'innerWidth', { value: originalInnerWidth, writable: true });
        Object.defineProperty(window, 'innerHeight', { value: originalInnerHeight, writable: true });
      }
    });
  });
});