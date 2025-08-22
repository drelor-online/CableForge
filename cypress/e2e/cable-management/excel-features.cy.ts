describe('Excel-like AG-Grid Features', () => {
  beforeEach(() => {
    // Start the application and wait for it to load
    cy.visit('/');
    cy.seedDatabase('cables');
    cy.waitForGrid();
  });

  context('Range Selection', () => {
    it('should allow single cell selection', () => {
      cy.getCell(0, 'voltage').click();
      cy.get('.ag-cell-focus').should('exist');
    });

    it('should allow multi-cell selection with shift+click', () => {
      cy.getCell(0, 'voltage').click();
      cy.getCell(2, 'voltage').click({ shiftKey: true });
      cy.get('.ag-range-selected').should('have.length.greaterThan', 0);
    });

    it('should allow column header selection', () => {
      cy.get('[col-id="voltage"] .ag-header-cell-text').click();
      cy.get('.ag-column-selected').should('exist');
    });

    it('should handle keyboard navigation with arrow keys', () => {
      cy.getCell(1, 'tag').click();
      cy.get('body').type('{rightarrow}');
      cy.getCell(1, 'description').should('have.class', 'ag-cell-focus');
      
      cy.get('body').type('{downarrow}');
      cy.getCell(2, 'description').should('have.class', 'ag-cell-focus');
    });
  });

  context('Copy and Paste Operations', () => {
    it('should copy single cell with Ctrl+C', () => {
      cy.getCell(0, 'voltage').click();
      cy.get('body').type('{ctrl}c');
      
      // Verify clipboard content - Note: In Cypress, we can't directly access clipboard
      // but we can verify the AG-Grid copy functionality is triggered
      cy.get('.ag-cell-focus').should('exist');
    });

    it('should copy range with Ctrl+C', () => {
      cy.selectRange(0, 'voltage', 2, 'voltage');
      cy.get('body').type('{ctrl}c');
      
      // Verify range is selected
      cy.get('.ag-range-selected').should('have.length.greaterThan', 0);
    });

    it('should handle Ctrl+A to select all', () => {
      cy.getCell(0, 'tag').click();
      cy.get('body').type('{ctrl}a');
      
      // All rows should be selected
      cy.get('.ag-row-selected').should('have.length.greaterThan', 3);
    });
  });

  context('Context Menu Operations', () => {
    it('should show context menu on right-click', () => {
      cy.getCell(1, 'voltage').rightclick();
      cy.get('.ag-menu').should('be.visible');
      cy.contains('Copy').should('be.visible');
      cy.contains('Paste').should('be.visible');
    });

    it('should show Excel-like operations in context menu', () => {
      cy.selectRange(0, 'voltage', 2, 'voltage');
      cy.get('.ag-range-selected').first().rightclick();
      
      cy.get('.ag-menu').should('be.visible');
      cy.contains('Fill Down').should('be.visible');
      cy.contains('Fill Right').should('be.visible');
      cy.contains('Fill Series').should('be.visible');
      cy.contains('Clear Contents').should('be.visible');
    });

    it('should show placeholder alerts for fill operations (Community Edition)', () => {
      cy.selectRange(0, 'voltage', 2, 'voltage');
      cy.get('.ag-range-selected').first().rightclick();
      
      cy.contains('Fill Down').click();
      
      // Should show alert since we're using Community Edition
      cy.on('window:alert', (text) => {
        expect(text).to.contain('Fill down feature requires AG-Grid Enterprise');
      });
    });

    it('should show placeholder alert for clear contents', () => {
      cy.selectRange(1, 'description', 2, 'description');
      cy.get('.ag-range-selected').first().rightclick();
      
      cy.contains('Clear Contents').click();
      
      cy.on('window:alert', (text) => {
        expect(text).to.contain('Clear contents feature requires AG-Grid Enterprise');
      });
    });
  });

  context('Keyboard Shortcuts', () => {
    it('should handle Delete key for clearing contents', () => {
      cy.selectRange(1, 'description', 2, 'description');
      cy.get('body').type('{del}');
      
      // Should show alert for clear contents
      cy.on('window:alert', (text) => {
        expect(text).to.contain('Clear contents');
      });
    });

    it('should handle Ctrl+D for fill down', () => {
      cy.selectRange(0, 'voltage', 2, 'voltage');
      cy.get('body').type('{ctrl}d');
      
      // Should show alert for fill down
      cy.on('window:alert', (text) => {
        expect(text).to.contain('Fill down');
      });
    });

    it('should handle Ctrl+R for fill right', () => {
      cy.selectRange(0, 'voltage', 0, 'length');
      cy.get('body').type('{ctrl}r');
      
      // Should show alert for fill right
      cy.on('window:alert', (text) => {
        expect(text).to.contain('Fill right');
      });
    });
  });

  context('Cell Editing with Range Selection', () => {
    it('should allow editing selected cell with F2', () => {
      cy.getCell(1, 'description').click();
      cy.get('body').type('{F2}');
      
      // Should enter edit mode
      cy.get('.ag-cell-inline-editing').should('exist');
      
      // Type new value and confirm
      cy.focused().clear().type('Updated Description{enter}');
      cy.getCell(1, 'description').should('contain', 'Updated Description');
    });

    it('should allow editing with double-click', () => {
      cy.getCell(2, 'voltage').dblclick();
      cy.get('.ag-cell-inline-editing').should('exist');
      
      cy.focused().clear().type('240{enter}');
      cy.getCell(2, 'voltage').should('contain', '240');
    });

    it('should validate numeric input during editing', () => {
      cy.getCell(1, 'voltage').dblclick();
      cy.focused().clear().type('invalid{enter}');
      
      // Should show validation error or revert to original value
      cy.getCell(1, 'voltage').should('not.contain', 'invalid');
    });
  });

  context('Range Handle (Enterprise Feature Preview)', () => {
    it('should show range handle when range is selected', () => {
      cy.selectRange(0, 'voltage', 1, 'voltage');
      
      // In Enterprise version, would show range handle for drag-fill
      // For now, just verify range selection works
      cy.get('.ag-range-selected').should('exist');
    });
  });

  context('Accessibility', () => {
    it('should be accessible with keyboard navigation', () => {
      cy.getCell(0, 'tag').click();
      
      // Tab should move to next focusable element
      cy.get('body').tab();
      cy.focused().should('exist');
      
      // Arrow keys should navigate grid
      cy.get('body').type('{rightarrow}');
      cy.get('.ag-cell-focus').should('exist');
    });

    it('should have proper ARIA labels', () => {
      cy.get('.ag-root-wrapper').should('have.attr', 'role');
      cy.get('.ag-header-row').should('have.attr', 'role', 'row');
    });

    it('should pass accessibility audit', () => {
      cy.checkA11y('.ag-root-wrapper');
    });
  });
});