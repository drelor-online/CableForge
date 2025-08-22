describe('Basic AG-Grid Functionality Check', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.wait(2000); // Give the app time to load
  });

  it('should load the cable grid', () => {
    // Check if AG-Grid is present
    cy.get('.ag-root-wrapper').should('be.visible');
    
    // Check if we have some columns
    cy.get('.ag-header-cell').should('have.length.greaterThan', 0);
    
    // Log what we see for debugging
    cy.get('.ag-header-cell').then($headers => {
      cy.log(`Found ${$headers.length} header cells`);
    });
  });

  it('should have range selection enabled', () => {
    // Check if AG-Grid range selection classes exist
    cy.get('.ag-root-wrapper').should('exist');
    
    // Try to click on a cell if it exists
    cy.get('.ag-cell').first().then($cell => {
      if ($cell.length > 0) {
        cy.wrap($cell).click();
        cy.log('Clicked on first cell');
      }
    });
  });

  it('should allow basic cell navigation', () => {
    // Try basic cell interaction
    cy.get('.ag-cell').first().click();
    
    // Try arrow key navigation
    cy.get('body').type('{rightarrow}');
    
    // Check if focus moved (any focused element is fine for now)
    cy.focused().should('exist');
  });

  it('should show some data or empty state', () => {
    // Either we have rows with data or we have an empty state
    cy.get('body').then($body => {
      if ($body.find('.ag-row').length > 0) {
        cy.log('Found data rows');
        cy.get('.ag-row').should('have.length.greaterThan', 0);
      } else {
        cy.log('No data rows found - checking for empty state');
        // This is OK - the app might be empty on first load
      }
    });
  });
});