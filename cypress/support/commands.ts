/// <reference types="cypress" />

// Custom commands for CableForge testing
// AG-Grid specific commands for table interactions

// Get a specific cell in AG-Grid
Cypress.Commands.add('getCell', (row: number, colId: string) => {
  return cy.get(`[row-index="${row}"] [col-id="${colId}"]`);
});

// Select a range of cells in AG-Grid
Cypress.Commands.add('selectRange', (startRow: number, startCol: string, endRow: number, endCol: string) => {
  cy.getCell(startRow, startCol).click();
  cy.getCell(endRow, endCol).click({ shiftKey: true });
});

// Select multiple rows by indices
Cypress.Commands.add('selectRows', (rowIndices: number[]) => {
  rowIndices.forEach((rowIndex, index) => {
    const modifierKey = index === 0 ? {} : { ctrlKey: true };
    cy.get(`[row-index="${rowIndex}"] .ag-selection-checkbox`).click(modifierKey);
  });
});

// Seed the database with test data
Cypress.Commands.add('seedDatabase', (fixture: string) => {
  cy.fixture(fixture).then(data => {
    cy.window().its('indexedDB').then(indexedDB => {
      // Clear existing data and seed with test data
      cy.task('seedTestData', data);
    });
  });
});

// Wait for AG-Grid to be fully loaded and rendered
Cypress.Commands.add('waitForGrid', () => {
  cy.get('.ag-root-wrapper').should('be.visible');
  cy.get('.ag-row').should('have.length.greaterThan', 0);
});

// Open a specific modal by data-testid
Cypress.Commands.add('openModal', (modalTestId: string) => {
  cy.get(`[data-testid="${modalTestId}-trigger"]`).click();
  cy.get(`[data-testid="${modalTestId}"]`).should('be.visible');
});

// Close any open modal
Cypress.Commands.add('closeModal', () => {
  cy.get('[data-testid="modal-close"]').click();
  cy.get('.fixed.inset-0').should('not.exist');
});

// Type into a filter input and wait for results
Cypress.Commands.add('filterBy', (field: string, value: string) => {
  cy.get(`[data-field="${field}"] input`).clear().type(value);
  cy.wait(500); // Debounce delay
});

// Verify toast notification appears
Cypress.Commands.add('verifyToast', (message: string, type: 'success' | 'error' | 'info' = 'success') => {
  cy.get(`[data-testid="toast-${type}"]`).should('contain', message);
});

// Test accessibility with axe
Cypress.Commands.add('checkA11y', (selector?: string) => {
  cy.injectAxe();
  cy.checkA11y(selector);
});

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Get a specific cell in AG-Grid by row index and column ID
       * @param row Row index (0-based)
       * @param colId Column ID
       */
      getCell(row: number, colId: string): Chainable<JQuery<HTMLElement>>;
      
      /**
       * Select a range of cells in AG-Grid
       * @param startRow Starting row index
       * @param startCol Starting column ID
       * @param endRow Ending row index  
       * @param endCol Ending column ID
       */
      selectRange(startRow: number, startCol: string, endRow: number, endCol: string): Chainable<void>;
      
      /**
       * Select multiple rows by their indices
       * @param rowIndices Array of row indices to select
       */
      selectRows(rowIndices: number[]): Chainable<void>;
      
      /**
       * Seed the database with test data from a fixture
       * @param fixture Name of the fixture file
       */
      seedDatabase(fixture: string): Chainable<void>;
      
      /**
       * Wait for AG-Grid to be fully loaded and rendered
       */
      waitForGrid(): Chainable<void>;
      
      /**
       * Open a modal by its test ID
       * @param modalTestId The data-testid of the modal
       */
      openModal(modalTestId: string): Chainable<void>;
      
      /**
       * Close any open modal
       */
      closeModal(): Chainable<void>;
      
      /**
       * Filter the grid by a specific field and value
       * @param field Field name to filter by
       * @param value Value to filter with
       */
      filterBy(field: string, value: string): Chainable<void>;
      
      /**
       * Verify a toast notification appears with the given message
       * @param message Expected toast message
       * @param type Type of toast (success, error, info)
       */
      verifyToast(message: string, type?: 'success' | 'error' | 'info'): Chainable<void>;
      
      /**
       * Check accessibility using axe-core
       * @param selector Optional selector to scope the check
       */
      checkA11y(selector?: string): Chainable<void>;
    }
  }
}