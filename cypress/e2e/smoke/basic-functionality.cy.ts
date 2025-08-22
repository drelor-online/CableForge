describe('Smoke Tests - Basic Functionality', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  context('Application Loading', () => {
    it('should load the application successfully', () => {
      cy.get('[data-testid="app-container"]').should('be.visible');
      cy.get('h1').should('contain', 'CableForge');
    });

    it('should load without JavaScript errors', () => {
      cy.window().then((win) => {
        cy.wrap(win.console).its('error').should('not.have.been.called');
      });
    });

    it('should have working navigation', () => {
      cy.get('[data-testid="nav-menu"]').should('be.visible');
      cy.get('[data-testid="nav-cables"]').should('be.visible');
      cy.get('[data-testid="nav-settings"]').should('be.visible');
    });
  });

  context('Core Features', () => {
    it('should display the cable grid', () => {
      cy.waitForGrid();
      cy.get('.ag-root-wrapper').should('be.visible');
      cy.get('.ag-header-row').should('be.visible');
    });

    it('should be able to add a new cable', () => {
      cy.get('[data-testid="add-cable-btn"]').should('be.visible').click();
      cy.get('[data-testid="add-cable-modal"]').should('be.visible');
      cy.get('[data-testid="modal-close"]').click();
    });

    it('should be able to search/filter cables', () => {
      cy.waitForGrid();
      cy.get('[data-testid="quick-filter"]').should('be.visible');
      cy.get('[data-testid="quick-filter"]').type('test');
      cy.get('[data-testid="quick-filter"]').clear();
    });

    it('should be able to export data', () => {
      cy.get('[data-testid="export-btn"]').should('be.visible').click();
      cy.get('[data-testid="export-options"]').should('be.visible');
    });
  });

  context('Responsive Design', () => {
    it('should work on desktop viewport', () => {
      cy.viewport(1280, 720);
      cy.get('.ag-root-wrapper').should('be.visible');
      cy.get('[data-testid="sidebar"]').should('be.visible');
    });

    it('should work on tablet viewport', () => {
      cy.viewport(768, 1024);
      cy.get('.ag-root-wrapper').should('be.visible');
      // Sidebar might be collapsed on tablet
    });

    it('should work on mobile viewport', () => {
      cy.viewport(375, 667);
      cy.get('.ag-root-wrapper').should('be.visible');
      // Grid should adapt to mobile view
    });
  });

  context('Performance', () => {
    it('should load within acceptable time', () => {
      const startTime = Date.now();
      cy.visit('/');
      cy.waitForGrid().then(() => {
        const loadTime = Date.now() - startTime;
        expect(loadTime).to.be.lessThan(5000); // Should load in under 5 seconds
      });
    });

    it('should handle large datasets without crashing', () => {
      cy.seedDatabase('bulk_edit_test');
      cy.visit('/');
      cy.waitForGrid();
      cy.get('.ag-row').should('have.length.greaterThan', 0);
    });
  });

  context('Error Handling', () => {
    it('should handle network errors gracefully', () => {
      cy.intercept('GET', '/api/cables', { forceNetworkError: true });
      cy.visit('/');
      
      cy.get('[data-testid="error-message"]').should('be.visible');
      cy.get('[data-testid="retry-button"]').should('be.visible');
    });

    it('should show 404 for invalid routes', () => {
      cy.visit('/invalid-route', { failOnStatusCode: false });
      cy.get('[data-testid="404-page"]').should('be.visible');
      cy.get('[data-testid="back-home-btn"]').should('be.visible');
    });
  });

  context('Browser Compatibility', () => {
    it('should work in different browsers', () => {
      // This test runs in the CI pipeline across different browsers
      cy.get('[data-testid="app-container"]').should('be.visible');
      cy.waitForGrid();
      cy.get('.ag-root-wrapper').should('be.visible');
    });
  });

  context('Accessibility Basics', () => {
    it('should have proper page title', () => {
      cy.title().should('contain', 'CableForge');
    });

    it('should have main landmarks', () => {
      cy.get('main').should('exist');
      cy.get('[role="navigation"]').should('exist');
    });

    it('should be keyboard navigable', () => {
      cy.get('body').tab();
      cy.focused().should('be.visible');
    });

    it('should pass basic accessibility audit', () => {
      cy.injectAxe();
      cy.checkA11y(null, {
        rules: {
          'color-contrast': { enabled: false }, // Skip color contrast for smoke test
        }
      });
    });
  });
});