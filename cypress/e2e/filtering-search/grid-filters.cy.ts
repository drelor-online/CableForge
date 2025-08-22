describe('Grid Filtering & Search', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.seedDatabase('cables');
    cy.waitForGrid();
  });

  context('Column Filters', () => {
    it('should filter by text in description column', () => {
      cy.get('[col-id="description"] .ag-header-cell-menu-button').click();
      cy.get('.ag-menu-option-text').contains('Filter').click();
      
      cy.get('.ag-filter-filter input').type('Control');
      cy.get('.ag-filter-apply-panel button').contains('Apply').click();
      
      // Should show only control cables
      cy.get('.ag-row').should('have.length', 1);
      cy.get('.ag-center-cols-container').should('contain', 'Control Cable');
      cy.get('.ag-center-cols-container').should('not.contain', 'Power Feed');
    });

    it('should filter by voltage range', () => {
      cy.get('[col-id="voltage"] .ag-header-cell-menu-button').click();
      cy.get('.ag-menu-option-text').contains('Filter').click();
      
      // Set range filter: voltage >= 400
      cy.get('.ag-filter-condition select').select('greaterThanOrEqual');
      cy.get('.ag-filter-filter input').type('400');
      cy.get('.ag-filter-apply-panel button').contains('Apply').click();
      
      // Should show only high voltage cables
      cy.get('.ag-row').should('have.length', 2);
      cy.getCell(0, 'voltage').should('contain', '480');
      cy.getCell(1, 'voltage').should('contain', '480');
    });

    it('should filter by multiple conditions with AND logic', () => {
      cy.get('[col-id="function"] .ag-header-cell-menu-button').click();
      cy.get('.ag-menu-option-text').contains('Filter').click();
      
      cy.get('.ag-filter-filter select').select('Power');
      cy.get('.ag-filter-apply-panel button').contains('Apply').click();
      
      // Add voltage filter
      cy.get('[col-id="voltage"] .ag-header-cell-menu-button').click();
      cy.get('.ag-menu-option-text').contains('Filter').click();
      cy.get('.ag-filter-condition select').select('equals');
      cy.get('.ag-filter-filter input').type('480');
      cy.get('.ag-filter-apply-panel button').contains('Apply').click();
      
      // Should show only Power cables with 480V
      cy.get('.ag-row').should('have.length', 2);
      cy.get('.ag-center-cols-container').should('contain', 'Main Power Feed');
      cy.get('.ag-center-cols-container').should('contain', 'Motor Power Cable');
    });

    it('should show filter indicators when active', () => {
      cy.get('[col-id="function"] .ag-header-cell-menu-button').click();
      cy.get('.ag-menu-option-text').contains('Filter').click();
      cy.get('.ag-filter-filter select').select('Control');
      cy.get('.ag-filter-apply-panel button').contains('Apply').click();
      
      // Column should show filter indicator
      cy.get('[col-id="function"] .ag-header-cell').should('have.class', 'ag-header-cell-filtered');
      cy.get('[col-id="function"] .ag-filter-icon').should('be.visible');
    });

    it('should clear individual column filters', () => {
      // Apply filter
      cy.get('[col-id="voltage"] .ag-header-cell-menu-button').click();
      cy.get('.ag-menu-option-text').contains('Filter').click();
      cy.get('.ag-filter-filter input').type('24');
      cy.get('.ag-filter-apply-panel button').contains('Apply').click();
      
      cy.get('.ag-row').should('have.length', 2); // Filtered state
      
      // Clear filter
      cy.get('[col-id="voltage"] .ag-header-cell-menu-button').click();
      cy.get('.ag-menu-option-text').contains('Filter').click();
      cy.get('.ag-filter-apply-panel button').contains('Clear').click();
      
      cy.get('.ag-row').should('have.length', 5); // All rows visible
      cy.get('[col-id="voltage"] .ag-filter-icon').should('not.exist');
    });
  });

  context('Quick Filter (Global Search)', () => {
    it('should search across all columns with quick filter', () => {
      cy.get('[data-testid="quick-filter"]').type('MCC');
      
      // Should show cables with MCC in any field
      cy.get('.ag-row').should('have.length', 1);
      cy.get('.ag-center-cols-container').should('contain', 'CBL-001');
      cy.get('.ag-center-cols-container').should('contain', 'MCC-1');
    });

    it('should search by tag number', () => {
      cy.get('[data-testid="quick-filter"]').type('CBL-003');
      
      cy.get('.ag-row').should('have.length', 1);
      cy.getCell(0, 'tag').should('contain', 'CBL-003');
      cy.getCell(0, 'description').should('contain', 'Instrumentation');
    });

    it('should search by partial matches', () => {
      cy.get('[data-testid="quick-filter"]').type('valve');
      
      // Should find cable going to VALVE-01
      cy.get('.ag-row').should('have.length', 1);
      cy.get('.ag-center-cols-container').should('contain', 'VALVE-01');
    });

    it('should be case insensitive', () => {
      cy.get('[data-testid="quick-filter"]').type('CONTROL');
      cy.get('.ag-row').should('have.length', 1);
      
      cy.get('[data-testid="quick-filter"]').clear().type('control');
      cy.get('.ag-row').should('have.length', 1);
      
      cy.get('[data-testid="quick-filter"]').clear().type('Control');
      cy.get('.ag-row').should('have.length', 1);
    });

    it('should clear search results when input is cleared', () => {
      cy.get('[data-testid="quick-filter"]').type('nonexistent');
      cy.get('.ag-row').should('have.length', 0);
      
      cy.get('[data-testid="quick-filter"]').clear();
      cy.get('.ag-row').should('have.length', 5);
    });

    it('should show "no results" message for empty searches', () => {
      cy.get('[data-testid="quick-filter"]').type('xyz123notfound');
      
      cy.get('.ag-overlay-no-rows-wrapper').should('be.visible');
      cy.get('.ag-overlay-no-rows-center').should('contain', 'No cables match your search');
    });
  });

  context('Advanced Filter Panel', () => {
    it('should open advanced filter panel', () => {
      cy.get('[data-testid="advanced-filter-btn"]').click();
      cy.get('[data-testid="advanced-filter-panel"]').should('be.visible');
      cy.get('h3').should('contain', 'Advanced Filters');
    });

    it('should build complex filter conditions', () => {
      cy.get('[data-testid="advanced-filter-btn"]').click();
      
      // First condition: Function = Power
      cy.get('[data-testid="filter-field-0"]').select('function');
      cy.get('[data-testid="filter-operator-0"]').select('equals');
      cy.get('[data-testid="filter-value-0"]').select('Power');
      
      // Add second condition with OR logic
      cy.get('[data-testid="add-filter-condition"]').click();
      cy.get('[data-testid="filter-logic-1"]').select('OR');
      cy.get('[data-testid="filter-field-1"]').select('function');
      cy.get('[data-testid="filter-operator-1"]').select('equals');
      cy.get('[data-testid="filter-value-1"]').select('Communication');
      
      cy.get('[data-testid="apply-advanced-filter"]').click();
      
      // Should show Power and Communication cables
      cy.get('.ag-row').should('have.length', 4);
      cy.get('.ag-center-cols-container').should('contain', 'Power');
      cy.get('.ag-center-cols-container').should('contain', 'Communication');
      cy.get('.ag-center-cols-container').should('not.contain', 'Control');
    });

    it('should save and load filter presets', () => {
      cy.get('[data-testid="advanced-filter-btn"]').click();
      
      // Create filter for high voltage cables
      cy.get('[data-testid="filter-field-0"]').select('voltage');
      cy.get('[data-testid="filter-operator-0"]').select('greaterThan');
      cy.get('[data-testid="filter-value-0"]').type('100');
      
      // Save as preset
      cy.get('[data-testid="save-preset"]').click();
      cy.get('[data-testid="preset-name"]').type('High Voltage Cables');
      cy.get('[data-testid="confirm-save-preset"]').click();
      
      cy.verifyToast('Filter preset saved');
      
      // Clear filters
      cy.get('[data-testid="clear-all-filters"]').click();
      cy.get('.ag-row').should('have.length', 5);
      
      // Load preset
      cy.get('[data-testid="advanced-filter-btn"]').click();
      cy.get('[data-testid="load-preset"]').select('High Voltage Cables');
      cy.get('[data-testid="apply-advanced-filter"]').click();
      
      cy.get('.ag-row').should('have.length', 2); // Only 480V cables
    });
  });

  context('Filter Performance', () => {
    it('should handle large datasets efficiently', () => {
      // Load large dataset
      cy.seedDatabase('bulk_edit_test');
      cy.visit('/');
      cy.waitForGrid();
      
      const startTime = Date.now();
      cy.get('[data-testid="quick-filter"]').type('CBL-01');
      
      cy.get('.ag-row').should('have.length', 3).then(() => {
        const endTime = Date.now();
        expect(endTime - startTime).to.be.lessThan(1000); // Should filter in under 1 second
      });
    });

    it('should debounce rapid typing in search', () => {
      let requestCount = 0;
      cy.intercept('GET', '/api/cables*', () => {
        requestCount++;
      });
      
      cy.get('[data-testid="quick-filter"]')
        .type('C')
        .type('B')
        .type('L')
        .type('-')
        .type('0')
        .type('0')
        .type('1');
      
      cy.wait(600).then(() => {
        // Should not make a request for every keystroke
        expect(requestCount).to.be.lessThan(7);
      });
    });
  });

  context('Filter State Persistence', () => {
    it('should maintain filters during navigation', () => {
      cy.get('[data-testid="quick-filter"]').type('Control');
      cy.get('.ag-row').should('have.length', 1);
      
      // Navigate to settings and back
      cy.get('[data-testid="settings-btn"]').click();
      cy.get('[data-testid="back-to-grid"]').click();
      
      // Filter should be preserved
      cy.get('[data-testid="quick-filter"]').should('have.value', 'Control');
      cy.get('.ag-row').should('have.length', 1);
    });

    it('should restore filters on page refresh', () => {
      cy.get('[col-id="function"] .ag-header-cell-menu-button').click();
      cy.get('.ag-menu-option-text').contains('Filter').click();
      cy.get('.ag-filter-filter select').select('Power');
      cy.get('.ag-filter-apply-panel button').contains('Apply').click();
      
      cy.reload();
      cy.waitForGrid();
      
      // Filter should be restored
      cy.get('.ag-row').should('have.length', 3);
      cy.get('[col-id="function"] .ag-filter-icon').should('be.visible');
    });
  });

  context('Export Filtered Data', () => {
    it('should export only filtered results', () => {
      cy.get('[data-testid="quick-filter"]').type('Power');
      cy.get('.ag-row').should('have.length', 3);
      
      cy.get('[data-testid="export-btn"]').click();
      cy.get('[data-testid="export-filtered"]').click();
      
      // Should download file with only filtered cables
      cy.readFile('cypress/downloads/cables-filtered.csv').then(content => {
        expect(content).to.contain('CBL-001');
        expect(content).to.contain('CBL-004');
        expect(content).not.to.contain('CBL-002'); // Control cable
      });
    });
  });

  context('Accessibility', () => {
    it('should announce filter results to screen readers', () => {
      cy.get('[data-testid="quick-filter"]').type('Control');
      
      cy.get('[aria-live="polite"]').should('contain', '1 cable found');
    });

    it('should be keyboard accessible', () => {
      // Focus search input with keyboard shortcut
      cy.get('body').type('{ctrl}f');
      cy.get('[data-testid="quick-filter"]').should('be.focused');
      
      // Navigate to filter menu with keyboard
      cy.get('[col-id="voltage"]').focus();
      cy.focused().type('{alt}{downarrow}'); // Open menu
      cy.focused().type('{downarrow}'); // Navigate to Filter option
      cy.focused().type('{enter}'); // Select Filter
      
      cy.get('.ag-filter-filter input').should('be.focused');
    });

    it('should pass accessibility audit', () => {
      cy.get('[data-testid="advanced-filter-btn"]').click();
      cy.checkA11y('[data-testid="advanced-filter-panel"]');
    });
  });

  context('Error Handling', () => {
    it('should handle filter API errors gracefully', () => {
      cy.intercept('GET', '/api/cables*', { statusCode: 500, body: 'Server Error' });
      
      cy.get('[data-testid="quick-filter"]').type('test');
      
      cy.verifyToast('Failed to apply filter. Please try again.', 'error');
      cy.get('.ag-overlay-no-rows-center').should('contain', 'Error loading cables');
    });

    it('should recover from temporary network issues', () => {
      let attemptCount = 0;
      cy.intercept('GET', '/api/cables*', (req) => {
        attemptCount++;
        if (attemptCount === 1) {
          req.reply({ forceNetworkError: true });
        } else {
          req.continue();
        }
      });
      
      cy.get('[data-testid="quick-filter"]').type('test');
      cy.get('[data-testid="retry-filter"]').click();
      
      cy.get('.ag-row').should('be.visible'); // Should eventually load
    });
  });
});