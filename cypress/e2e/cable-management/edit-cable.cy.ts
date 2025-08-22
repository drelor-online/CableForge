describe('Cable Editing & Updates', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.seedDatabase('cables');
    cy.waitForGrid();
  });

  context('Inline Cell Editing', () => {
    it('should allow editing description field inline', () => {
      cy.getCell(1, 'description').dblclick();
      cy.get('.ag-cell-inline-editing').should('exist');
      
      cy.focused().clear().type('Updated Cable Description{enter}');
      cy.getCell(1, 'description').should('contain', 'Updated Cable Description');
      cy.verifyToast('Cable updated successfully');
    });

    it('should validate numeric fields during inline editing', () => {
      cy.getCell(1, 'voltage').dblclick();
      cy.focused().clear().type('invalid{enter}');
      
      // Should revert to original value or show error
      cy.getCell(1, 'voltage').should('not.contain', 'invalid');
      cy.verifyToast('Invalid voltage value', 'error');
    });

    it('should handle escape key to cancel editing', () => {
      const originalValue = 'Control Cable - PLC to Field Device';
      cy.getCell(1, 'description').should('contain', originalValue);
      
      cy.getCell(1, 'description').dblclick();
      cy.focused().clear().type('New Value{esc}');
      
      // Should revert to original value
      cy.getCell(1, 'description').should('contain', originalValue);
    });

    it('should prevent editing read-only calculated fields', () => {
      // ID field should not be editable
      cy.getCell(0, 'id').dblclick();
      cy.get('.ag-cell-inline-editing').should('not.exist');
    });
  });

  context('Edit Modal', () => {
    it('should open edit modal from context menu', () => {
      cy.getCell(1, 'tag').rightclick();
      cy.get('.ag-menu').should('be.visible');
      cy.contains('Edit Cable').click();
      
      cy.get('[data-testid="edit-cable-modal"]').should('be.visible');
      cy.get('h2').should('contain', 'Edit Cable');
    });

    it('should populate form with existing cable data', () => {
      cy.getCell(1, 'tag').rightclick();
      cy.contains('Edit Cable').click();
      
      cy.get('[data-testid="cable-tag"]').should('have.value', 'CBL-002');
      cy.get('[data-testid="cable-description"]').should('have.value', 'Control Cable - PLC to Field Device');
      cy.get('[data-testid="cable-voltage"]').should('have.value', '24');
      cy.get('[data-testid="cable-function"]').should('have.value', 'Control');
    });

    it('should save changes and update grid', () => {
      cy.getCell(1, 'tag').rightclick();
      cy.contains('Edit Cable').click();
      
      cy.get('[data-testid="cable-description"]').clear().type('Modified Control Cable');
      cy.get('[data-testid="cable-voltage"]').clear().type('48');
      
      cy.get('[data-testid="save-cable"]').click();
      
      cy.verifyToast('Cable updated successfully');
      cy.get('[data-testid="edit-cable-modal"]').should('not.exist');
      
      // Verify changes in grid
      cy.getCell(1, 'description').should('contain', 'Modified Control Cable');
      cy.getCell(1, 'voltage').should('contain', '48');
    });

    it('should validate changes before saving', () => {
      cy.getCell(1, 'tag').rightclick();
      cy.contains('Edit Cable').click();
      
      cy.get('[data-testid="cable-description"]').clear();
      cy.get('[data-testid="cable-voltage"]').clear().type('-50');
      
      cy.get('[data-testid="save-cable"]').click();
      
      // Should show validation errors
      cy.get('[data-testid="error-description"]').should('contain', 'Description is required');
      cy.get('[data-testid="error-voltage"]').should('contain', 'Voltage must be positive');
      cy.get('[data-testid="edit-cable-modal"]').should('be.visible'); // Modal stays open
    });
  });

  context('Bulk Editing', () => {
    it('should select multiple cables for bulk edit', () => {
      cy.selectRows([0, 1, 2]);
      cy.get('.ag-row-selected').should('have.length', 3);
      
      cy.get('[data-testid="bulk-edit-btn"]').should('be.enabled');
      cy.get('[data-testid="bulk-edit-btn"]').click();
      
      cy.get('[data-testid="bulk-edit-modal"]').should('be.visible');
      cy.get('[data-testid="selected-count"]').should('contain', '3 cables selected');
    });

    it('should show bulk edit options for common fields', () => {
      cy.selectRows([0, 1]);
      cy.get('[data-testid="bulk-edit-btn"]').click();
      
      // Should show checkboxes for fields to update
      cy.get('[data-testid="bulk-voltage-checkbox"]').should('exist');
      cy.get('[data-testid="bulk-function-checkbox"]').should('exist');
      cy.get('[data-testid="bulk-route-checkbox"]').should('exist');
      cy.get('[data-testid="bulk-segregation-checkbox"]').should('exist');
    });

    it('should apply bulk changes to selected cables', () => {
      cy.selectRows([1, 2]); // Control and Instrumentation cables
      cy.get('[data-testid="bulk-edit-btn"]').click();
      
      // Enable route field and set value
      cy.get('[data-testid="bulk-route-checkbox"]').check();
      cy.get('[data-testid="bulk-route-value"]').select('Conduit');
      
      // Enable segregation class and set value
      cy.get('[data-testid="bulk-segregation-checkbox"]').check();
      cy.get('[data-testid="bulk-segregation-value"]').select('LV');
      
      cy.get('[data-testid="apply-bulk-changes"]').click();
      
      cy.verifyToast('2 cables updated successfully');
      
      // Verify changes applied to both rows
      cy.getCell(1, 'route').should('contain', 'Conduit');
      cy.getCell(2, 'route').should('contain', 'Conduit');
      cy.getCell(1, 'segregationClass').should('contain', 'LV');
      cy.getCell(2, 'segregationClass').should('contain', 'LV');
    });

    it('should handle partial bulk update failures', () => {
      // Mock partial failure
      cy.intercept('PUT', '/api/cables/bulk', { 
        statusCode: 207, 
        body: { 
          success: ['CBL-002'], 
          failed: ['CBL-003'], 
          errors: { 'CBL-003': 'Validation failed' }
        }
      });
      
      cy.selectRows([1, 2]);
      cy.get('[data-testid="bulk-edit-btn"]').click();
      cy.get('[data-testid="bulk-route-checkbox"]').check();
      cy.get('[data-testid="bulk-route-value"]').select('Direct');
      cy.get('[data-testid="apply-bulk-changes"]').click();
      
      cy.verifyToast('1 cable updated, 1 failed', 'error');
      cy.get('[data-testid="bulk-results"]').should('contain', 'CBL-003: Validation failed');
    });
  });

  context('Change History & Audit', () => {
    it('should track changes in audit log', () => {
      cy.getCell(1, 'description').dblclick();
      cy.focused().clear().type('Audited Change{enter}');
      
      cy.getCell(1, 'tag').rightclick();
      cy.contains('View History').click();
      
      cy.get('[data-testid="audit-modal"]').should('be.visible');
      cy.get('[data-testid="change-log"]').should('contain', 'Description changed from');
      cy.get('[data-testid="change-log"]').should('contain', 'Control Cable - PLC to Field Device');
      cy.get('[data-testid="change-log"]').should('contain', 'Audited Change');
    });

    it('should show user and timestamp for changes', () => {
      cy.getCell(1, 'voltage').dblclick();
      cy.focused().clear().type('48{enter}');
      
      cy.getCell(1, 'tag').rightclick();
      cy.contains('View History').click();
      
      cy.get('[data-testid="change-entry"]').should('contain', 'Modified by: Test User');
      cy.get('[data-testid="change-entry"]').should('contain', new Date().toLocaleDateString());
    });

    it('should allow reverting to previous version', () => {
      const originalDescription = 'Control Cable - PLC to Field Device';
      
      // Make a change
      cy.getCell(1, 'description').dblclick();
      cy.focused().clear().type('Modified Description{enter}');
      
      // Revert change
      cy.getCell(1, 'tag').rightclick();
      cy.contains('View History').click();
      cy.get('[data-testid="revert-button"]').first().click();
      cy.get('[data-testid="confirm-revert"]').click();
      
      cy.verifyToast('Cable reverted successfully');
      cy.getCell(1, 'description').should('contain', originalDescription);
    });
  });

  context('Validation During Edit', () => {
    it('should prevent duplicate tag assignment', () => {
      cy.getCell(1, 'tag').rightclick();
      cy.contains('Edit Cable').click();
      
      // Try to use tag from first cable
      cy.get('[data-testid="cable-tag"]').clear().type('CBL-001');
      cy.get('[data-testid="save-cable"]').click();
      
      cy.get('[data-testid="error-tag"]').should('contain', 'Tag already exists');
      cy.get('[data-testid="edit-cable-modal"]').should('be.visible');
    });

    it('should validate related field dependencies', () => {
      cy.getCell(1, 'tag').rightclick();
      cy.contains('Edit Cable').click();
      
      // Change function to Power, should suggest appropriate cable types
      cy.get('[data-testid="cable-function"]').select('Power');
      cy.get('[data-testid="cable-type"]').click();
      cy.get('option').should('contain', 'XLPE');
      cy.get('option').should('not.contain', 'Cat6');
    });

    it('should validate length vs route consistency', () => {
      cy.getCell(1, 'tag').rightclick();
      cy.contains('Edit Cable').click();
      
      // Very long cable with direct route should warn
      cy.get('[data-testid="cable-length"]').clear().type('1000');
      cy.get('[data-testid="cable-route"]').select('Direct');
      
      cy.get('[data-testid="save-cable"]').click();
      cy.get('[data-testid="warning-length-route"]').should('contain', 'Long cable with direct route');
    });
  });

  context('Concurrent Editing', () => {
    it('should handle concurrent edit conflicts', () => {
      // Simulate another user editing the same cable
      cy.intercept('PUT', '/api/cables/2', { 
        statusCode: 409, 
        body: { error: 'Cable modified by another user' }
      });
      
      cy.getCell(1, 'description').dblclick();
      cy.focused().clear().type('Conflicted Edit{enter}');
      
      cy.verifyToast('Cable was modified by another user. Please refresh and try again.', 'error');
    });

    it('should show lock indicator for cables being edited', () => {
      // Mock websocket message about cable being edited
      cy.window().then(win => {
        win.dispatchEvent(new CustomEvent('cable-locked', { 
          detail: { cableId: 2, user: 'Other User' }
        }));
      });
      
      cy.getCell(1, 'tag').should('have.class', 'editing-locked');
      cy.getCell(1, 'tag').trigger('mouseover');
      cy.get('[data-testid="lock-tooltip"]').should('contain', 'Being edited by Other User');
    });
  });

  context('Error Recovery', () => {
    it('should recover from temporary save failures', () => {
      let attemptCount = 0;
      cy.intercept('PUT', '/api/cables/2', (req) => {
        attemptCount++;
        if (attemptCount === 1) {
          req.reply({ statusCode: 500, body: 'Temporary error' });
        } else {
          req.reply({ statusCode: 200, body: { success: true } });
        }
      });
      
      cy.getCell(1, 'description').dblclick();
      cy.focused().clear().type('Retry Test{enter}');
      
      // Should show retry option
      cy.verifyToast('Save failed. Retry?', 'error');
      cy.get('[data-testid="retry-save"]').click();
      
      cy.verifyToast('Cable updated successfully');
      cy.getCell(1, 'description').should('contain', 'Retry Test');
    });
  });

  context('Accessibility', () => {
    it('should announce changes to screen readers', () => {
      cy.getCell(1, 'description').dblclick();
      cy.focused().clear().type('Screen Reader Test{enter}');
      
      cy.get('[aria-live="polite"]').should('contain', 'Cable description updated');
    });

    it('should support keyboard navigation in edit modal', () => {
      cy.getCell(1, 'tag').focus().type('{enter}'); // Open context menu
      cy.focused().type('{enter}'); // Select first option (Edit)
      
      cy.get('[data-testid="edit-cable-modal"]').should('be.visible');
      cy.get('[data-testid="cable-tag"]').should('be.focused');
    });

    it('should pass accessibility audit during editing', () => {
      cy.getCell(1, 'tag').rightclick();
      cy.contains('Edit Cable').click();
      cy.checkA11y('[data-testid="edit-cable-modal"]');
    });
  });
});