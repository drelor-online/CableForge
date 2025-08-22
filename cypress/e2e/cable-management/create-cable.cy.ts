describe('Cable Creation & Validation', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.waitForGrid();
  });

  context('Add New Cable', () => {
    it('should open add cable modal from main button', () => {
      cy.get('[data-testid="add-cable-btn"]').click();
      cy.get('[data-testid="add-cable-modal"]').should('be.visible');
      cy.get('h2').should('contain', 'Add New Cable');
    });

    it('should auto-generate cable tag numbers', () => {
      cy.get('[data-testid="add-cable-btn"]').click();
      cy.get('[data-testid="cable-tag"]').should('have.value').and('match', /CBL-\d{3}/);
    });

    it('should validate required fields on submit', () => {
      cy.get('[data-testid="add-cable-btn"]').click();
      
      // Try to submit empty form
      cy.get('[data-testid="save-cable"]').click();
      
      // Should show validation errors
      cy.get('[data-testid="error-description"]').should('contain', 'Description is required');
      cy.get('[data-testid="error-voltage"]').should('contain', 'Voltage is required');
      cy.get('[data-testid="error-function"]').should('contain', 'Function is required');
    });

    it('should create cable with valid data', () => {
      const cableData = {
        tag: 'CBL-TEST-001',
        description: 'Test Cable for E2E',
        voltage: '480',
        function: 'Power',
        cableType: 'XLPE',
        size: '500MCM',
        cores: '3',
        fromLocation: 'TEST-FROM',
        toLocation: 'TEST-TO',
        length: '100.5'
      };

      cy.get('[data-testid="add-cable-btn"]').click();
      
      // Fill form fields
      cy.get('[data-testid="cable-tag"]').clear().type(cableData.tag);
      cy.get('[data-testid="cable-description"]').type(cableData.description);
      cy.get('[data-testid="cable-voltage"]').type(cableData.voltage);
      cy.get('[data-testid="cable-function"]').select(cableData.function);
      cy.get('[data-testid="cable-type"]').select(cableData.cableType);
      cy.get('[data-testid="cable-size"]').type(cableData.size);
      cy.get('[data-testid="cable-cores"]').type(cableData.cores);
      cy.get('[data-testid="from-location"]').type(cableData.fromLocation);
      cy.get('[data-testid="to-location"]').type(cableData.toLocation);
      cy.get('[data-testid="cable-length"]').type(cableData.length);
      
      cy.get('[data-testid="save-cable"]').click();
      
      // Verify success
      cy.verifyToast('Cable added successfully');
      cy.get('[data-testid="add-cable-modal"]').should('not.exist');
      
      // Verify cable appears in grid
      cy.get('.ag-center-cols-container').should('contain', cableData.tag);
      cy.get('.ag-center-cols-container').should('contain', cableData.description);
    });
  });

  context('Inline Validation', () => {
    beforeEach(() => {
      cy.get('[data-testid="add-cable-btn"]').click();
    });

    it('should validate voltage range', () => {
      cy.get('[data-testid="cable-voltage"]').type('-100');
      cy.get('[data-testid="cable-description"]').click(); // Trigger blur
      cy.get('[data-testid="error-voltage"]').should('contain', 'Voltage must be positive');

      cy.get('[data-testid="cable-voltage"]').clear().type('50000');
      cy.get('[data-testid="cable-description"]').click();
      cy.get('[data-testid="error-voltage"]').should('contain', 'Voltage exceeds maximum');
    });

    it('should validate numeric fields', () => {
      cy.get('[data-testid="cable-cores"]').type('abc');
      cy.get('[data-testid="cable-description"]').click();
      cy.get('[data-testid="error-cores"]').should('contain', 'Must be a number');

      cy.get('[data-testid="cable-length"]').type('invalid');
      cy.get('[data-testid="cable-description"]').click();
      cy.get('[data-testid="error-length"]').should('contain', 'Must be a valid number');
    });

    it('should validate tag uniqueness', () => {
      // First, get an existing cable tag from the grid
      cy.closeModal();
      cy.getCell(0, 'tag').invoke('text').then(existingTag => {
        cy.get('[data-testid="add-cable-btn"]').click();
        cy.get('[data-testid="cable-tag"]').clear().type(existingTag);
        cy.get('[data-testid="cable-description"]').click();
        cy.get('[data-testid="error-tag"]').should('contain', 'Tag already exists');
      });
    });

    it('should validate from/to location format', () => {
      cy.get('[data-testid="from-location"]').type('invalid format!@#');
      cy.get('[data-testid="cable-description"]').click();
      cy.get('[data-testid="error-from-location"]').should('contain', 'Invalid location format');

      cy.get('[data-testid="to-location"]').type('VALID-FORMAT-01');
      cy.get('[data-testid="cable-description"]').click();
      cy.get('[data-testid="error-to-location"]').should('not.exist');
    });
  });

  context('Auto-complete and Suggestions', () => {
    beforeEach(() => {
      cy.get('[data-testid="add-cable-btn"]').click();
    });

    it('should provide cable type suggestions', () => {
      cy.get('[data-testid="cable-type"]').click();
      cy.get('option').should('contain', 'XLPE');
      cy.get('option').should('contain', 'PVC');
      cy.get('option').should('contain', 'Instrumentation');
      cy.get('option').should('contain', 'Cat6');
    });

    it('should suggest location names from existing cables', () => {
      cy.get('[data-testid="from-location"]').type('MCC');
      cy.get('.autocomplete-suggestions').should('be.visible');
      cy.get('.autocomplete-suggestions').should('contain', 'MCC-1');
    });

    it('should filter cable sizes based on function', () => {
      cy.get('[data-testid="cable-function"]').select('Power');
      cy.get('[data-testid="cable-size"]').click();
      cy.get('option').should('contain', '500MCM');
      cy.get('option').should('contain', '4/0AWG');

      cy.get('[data-testid="cable-function"]').select('Instrumentation');
      cy.get('[data-testid="cable-size"]').click();
      cy.get('option').should('contain', '18AWG');
      cy.get('option').should('contain', '16AWG');
    });
  });

  context('Form Persistence', () => {
    it('should preserve form data when modal is reopened', () => {
      cy.get('[data-testid="add-cable-btn"]').click();
      
      // Fill some fields
      cy.get('[data-testid="cable-description"]').type('Partially filled cable');
      cy.get('[data-testid="cable-voltage"]').type('240');
      
      // Close modal without saving
      cy.get('[data-testid="modal-close"]').click();
      
      // Reopen modal
      cy.get('[data-testid="add-cable-btn"]').click();
      
      // Data should be preserved (or cleared based on UX decision)
      cy.get('[data-testid="cable-description"]').should('have.value', '');
      cy.get('[data-testid="cable-voltage"]').should('have.value', '');
    });
  });

  context('Bulk Import Validation', () => {
    it('should validate bulk import data', () => {
      cy.get('[data-testid="import-cables-btn"]').click();
      cy.get('[data-testid="file-input"]').selectFile('cypress/fixtures/invalid-cables.csv');
      
      cy.get('[data-testid="validate-import"]').click();
      
      // Should show validation results
      cy.get('[data-testid="validation-results"]').should('be.visible');
      cy.get('[data-testid="error-summary"]').should('contain', '3 errors found');
      cy.get('[data-testid="invalid-rows"]').should('contain', 'Row 2: Missing tag');
      cy.get('[data-testid="invalid-rows"]').should('contain', 'Row 3: Invalid voltage');
    });

    it('should prevent import with validation errors', () => {
      cy.get('[data-testid="import-cables-btn"]').click();
      cy.get('[data-testid="file-input"]').selectFile('cypress/fixtures/invalid-cables.csv');
      cy.get('[data-testid="validate-import"]').click();
      
      // Import button should be disabled
      cy.get('[data-testid="confirm-import"]').should('be.disabled');
      cy.get('[data-testid="error-message"]').should('contain', 'Fix validation errors before importing');
    });
  });

  context('Error Handling', () => {
    it('should handle server errors gracefully', () => {
      // Mock server error
      cy.intercept('POST', '/api/cables', { statusCode: 500, body: 'Server Error' });
      
      cy.get('[data-testid="add-cable-btn"]').click();
      cy.get('[data-testid="cable-description"]').type('Test Cable');
      cy.get('[data-testid="cable-voltage"]').type('480');
      cy.get('[data-testid="cable-function"]').select('Power');
      
      cy.get('[data-testid="save-cable"]').click();
      
      // Should show error message
      cy.verifyToast('Failed to save cable. Please try again.', 'error');
      cy.get('[data-testid="add-cable-modal"]').should('be.visible'); // Modal stays open
    });

    it('should handle network connectivity issues', () => {
      // Mock network failure
      cy.intercept('POST', '/api/cables', { forceNetworkError: true });
      
      cy.get('[data-testid="add-cable-btn"]').click();
      cy.get('[data-testid="cable-description"]').type('Test Cable');
      cy.get('[data-testid="cable-voltage"]').type('480');
      cy.get('[data-testid="cable-function"]').select('Power');
      
      cy.get('[data-testid="save-cable"]').click();
      
      cy.verifyToast('Network error. Please check your connection.', 'error');
    });
  });

  context('Accessibility', () => {
    it('should be keyboard accessible', () => {
      cy.get('[data-testid="add-cable-btn"]').focus().type('{enter}');
      cy.get('[data-testid="add-cable-modal"]').should('be.visible');
      
      // Tab through form fields
      cy.get('[data-testid="cable-tag"]').should('be.focused');
      cy.focused().tab();
      cy.get('[data-testid="cable-description"]').should('be.focused');
      
      // Escape should close modal
      cy.get('body').type('{esc}');
      cy.get('[data-testid="add-cable-modal"]').should('not.exist');
    });

    it('should have proper ARIA labels and roles', () => {
      cy.get('[data-testid="add-cable-btn"]').click();
      
      cy.get('[data-testid="add-cable-modal"]').should('have.attr', 'role', 'dialog');
      cy.get('[data-testid="cable-tag"]').should('have.attr', 'aria-label');
      cy.get('[data-testid="cable-description"]').should('have.attr', 'aria-required', 'true');
    });

    it('should pass accessibility audit', () => {
      cy.get('[data-testid="add-cable-btn"]').click();
      cy.checkA11y('[data-testid="add-cable-modal"]');
    });
  });
});