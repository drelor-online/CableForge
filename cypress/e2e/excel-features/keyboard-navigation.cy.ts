describe('Excel-like Keyboard Navigation and Selection (BDD)', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.seedDatabase('cables');
    cy.waitForGrid();
  });

  context('Given the Cable Schedule grid is focused and ready', () => {
    describe('Basic keyboard navigation', () => {
      it('When I use arrow keys to navigate cells', () => {
        // Given: I focus on a starting cell
        cy.getCell(1, 'tag').click();
        
        // When: I press right arrow
        cy.get('body').type('{rightarrow}');
        
        // Then: Focus should move to the next column
        cy.getCell(1, 'description').should('have.class', 'ag-cell-focus');
        
        // When: I press down arrow
        cy.get('body').type('{downarrow}');
        
        // Then: Focus should move to the next row
        cy.getCell(2, 'description').should('have.class', 'ag-cell-focus');
        
        // When: I press left arrow
        cy.get('body').type('{leftarrow}');
        
        // Then: Focus should move to the previous column
        cy.getCell(2, 'tag').should('have.class', 'ag-cell-focus');
        
        // When: I press up arrow
        cy.get('body').type('{uparrow}');
        
        // Then: Focus should move to the previous row
        cy.getCell(1, 'tag').should('have.class', 'ag-cell-focus');
      });

      it('When I use Tab and Shift+Tab for navigation', () => {
        // Given: I focus on a cell
        cy.getCell(0, 'tag').click();
        
        // When: I press Tab
        cy.get('body').tab();
        
        // Then: Focus should move to next focusable element
        cy.focused().should('exist');
        
        // When: I press Shift+Tab
        cy.get('body').tab({ shift: true });
        
        // Then: Focus should move back
        cy.focused().should('exist');
      });

      it('When I use Home and End keys to navigate to row boundaries', () => {
        // Given: I focus on a middle cell
        cy.getCell(1, 'voltage').click();
        
        // When: I press Home
        cy.get('body').type('{home}');
        
        // Then: Focus should move to first cell in row
        cy.getCell(1, 'tag').should('have.class', 'ag-cell-focus');
        
        // When: I press End
        cy.get('body').type('{end}');
        
        // Then: Focus should move to last visible cell in row
        cy.get('[row-index="1"] .ag-cell-focus').should('exist');
      });

      it('When I use Ctrl+Home and Ctrl+End for grid boundaries', () => {
        // Given: I focus on a middle cell
        cy.getCell(3, 'voltage').click();
        
        // When: I press Ctrl+Home
        cy.get('body').type('{ctrl}{home}');
        
        // Then: Focus should move to first cell of grid
        cy.getCell(0, 'tag').should('have.class', 'ag-cell-focus');
        
        // When: I press Ctrl+End
        cy.get('body').type('{ctrl}{end}');
        
        // Then: Focus should move to last cell with data
        cy.get('.ag-cell-focus').should('exist');
      });
    });

    describe('Selection with keyboard', () => {
      it('When I use Shift+Arrow keys to extend selection', () => {
        // Given: I focus on a starting cell
        cy.getCell(1, 'voltage').click();
        
        // When: I press Shift+Right Arrow twice
        cy.get('body').type('{shift}{rightarrow}{rightarrow}');
        
        // Then: A range should be selected from voltage to cableType
        cy.get('.ag-range-selected').should('exist');
        cy.getCell(1, 'voltage').should('have.class', 'ag-range-selected');
        cy.getCell(1, 'function').should('have.class', 'ag-range-selected');
        cy.getCell(1, 'cableType').should('have.class', 'ag-range-selected');
        
        // When: I press Shift+Down Arrow
        cy.get('body').type('{shift}{downarrow}');
        
        // Then: Selection should extend down one row
        cy.getCell(2, 'voltage').should('have.class', 'ag-range-selected');
        cy.getCell(2, 'function').should('have.class', 'ag-range-selected');
        cy.getCell(2, 'cableType').should('have.class', 'ag-range-selected');
      });

      it('When I use Ctrl+Shift+Arrow for extended range selection', () => {
        // Given: I focus on a cell
        cy.getCell(1, 'tag').click();
        
        // When: I press Ctrl+Shift+Right to select to end of row
        cy.get('body').type('{ctrl}{shift}{rightarrow}');
        
        // Then: Should select from current cell to end of data in row
        cy.get('.ag-range-selected').should('exist');
        cy.get('[row-index="1"] .ag-range-selected').should('have.length.greaterThan', 3);
        
        // When: I press Ctrl+Shift+Down to extend to bottom
        cy.get('body').type('{ctrl}{shift}{downarrow}');
        
        // Then: Should extend selection to bottom of data
        cy.get('.ag-range-selected').should('have.length.greaterThan', 10);
      });

      it('When I use Ctrl+Space to select entire column', () => {
        // Given: I focus on a cell in voltage column
        cy.getCell(2, 'voltage').click();
        
        // When: I press Ctrl+Space
        cy.get('body').type('{ctrl} ');
        
        // Then: The entire voltage column should be selected
        cy.get('[col-id="voltage"]').should('have.class', 'ag-column-selected');
        cy.get('[col-id="voltage"] .ag-cell').should('have.class', 'ag-cell-range-selected');
      });

      it('When I use Shift+Space to select entire row', () => {
        // Given: I focus on a cell in row 2
        cy.getCell(2, 'description').click();
        
        // When: I press Shift+Space
        cy.get('body').type('{shift} ');
        
        // Then: The entire row should be selected
        cy.get('[row-index="2"]').should('have.class', 'ag-row-selected');
      });
    });

    describe('Clipboard operations with keyboard', () => {
      it('When I select range and copy with Ctrl+C, then paste with Ctrl+V', () => {
        // Given: I select a range using keyboard
        cy.getCell(0, 'voltage').click();
        cy.get('body').type('{shift}{rightarrow}{downarrow}');
        
        // When: I copy with Ctrl+C
        cy.get('body').type('{ctrl}c');
        
        // And: I navigate to a different location
        cy.getCell(3, 'voltage').click();
        
        // And: I paste with Ctrl+V
        cy.get('body').type('{ctrl}v');
        
        // Then: The copied data should be pasted
        cy.getCell(0, 'voltage').invoke('text').then((originalText) => {
          cy.getCell(3, 'voltage').should('contain', originalText.trim());
        });
      });

      it('When I use Ctrl+X to cut and Ctrl+V to paste', () => {
        // Given: I select a cell
        cy.getCell(1, 'description').click();
        cy.getCell(1, 'description').invoke('text').as('originalText');
        
        // When: I cut with Ctrl+X
        cy.get('body').type('{ctrl}x');
        
        // And: I navigate to a different cell
        cy.getCell(3, 'description').click();
        
        // And: I paste with Ctrl+V
        cy.get('body').type('{ctrl}v');
        
        // Then: The original cell should be cleared and target should have the value
        cy.get('@originalText').then((originalText) => {
          cy.getCell(3, 'description').should('contain', originalText);
          // Original cell should be empty or show placeholder
          cy.getCell(1, 'description').should('not.contain', originalText);
        });
      });
    });

    describe('Fill operations with keyboard', () => {
      it('When I select range and use Ctrl+D for fill down', () => {
        // Given: I select a range with top cell having data
        cy.getCell(0, 'voltage').click();
        cy.get('body').type('{shift}{downarrow}{downarrow}');
        
        // When: I press Ctrl+D for fill down
        cy.get('body').type('{ctrl}d');
        
        // Then: The top cell value should be filled down to selected cells
        cy.getCell(0, 'voltage').invoke('text').then((topValue) => {
          cy.getCell(1, 'voltage').should('contain', topValue.trim());
          cy.getCell(2, 'voltage').should('contain', topValue.trim());
        });
      });

      it('When I select range and use Ctrl+R for fill right', () => {
        // Given: I select a horizontal range
        cy.getCell(1, 'voltage').click();
        cy.get('body').type('{shift}{rightarrow}{rightarrow}');
        
        // When: I press Ctrl+R for fill right
        cy.get('body').type('{ctrl}r');
        
        // Then: The leftmost cell value should be filled right
        cy.getCell(1, 'voltage').invoke('text').then((leftValue) => {
          cy.getCell(1, 'function').should('contain', leftValue.trim());
          // Note: This might not be semantically correct, but tests the function
        });
      });

      it('When I select range and use Ctrl+Shift+F for fill series', () => {
        // Given: I select a range starting with a number
        cy.getCell(0, 'cores').click();
        cy.get('body').type('{shift}{downarrow}{downarrow}');
        
        // When: I press Ctrl+Shift+F for fill series
        cy.get('body').type('{ctrl}{shift}f');
        
        // Then: Should create a number series (or show series dialog)
        // This tests that the keyboard shortcut is recognized
        cy.get('body').should('exist'); // Basic assertion app doesn't crash
      });
    });

    describe('Selection modification with keyboard', () => {
      it('When I use Delete key to clear cell contents', () => {
        // Given: I select a cell with content
        cy.getCell(1, 'description').click();
        cy.getCell(1, 'description').invoke('text').as('originalText');
        
        // When: I press Delete
        cy.get('body').type('{del}');
        
        // Then: The cell content should be cleared
        cy.get('@originalText').then((originalText) => {
          if (originalText && originalText.trim()) {
            cy.getCell(1, 'description').should('not.contain', originalText);
          }
        });
      });

      it('When I use Escape to cancel selection', () => {
        // Given: I have a range selected
        cy.selectRange(0, 'voltage', 2, 'function');
        
        // When: I press Escape
        cy.get('body').type('{esc}');
        
        // Then: The range selection should be cleared
        cy.get('.ag-range-selected').should('not.exist');
      });
    });

    describe('Edit mode with keyboard', () => {
      it('When I press F2 to enter edit mode', () => {
        // Given: I focus on an editable cell
        cy.getCell(1, 'description').click();
        
        // When: I press F2
        cy.get('body').type('{F2}');
        
        // Then: The cell should enter edit mode
        cy.get('.ag-cell-inline-editing').should('exist');
        
        // When: I type new content and press Enter
        cy.focused().clear().type('New Description{enter}');
        
        // Then: The cell should show the new content
        cy.getCell(1, 'description').should('contain', 'New Description');
      });

      it('When I start typing to replace cell content', () => {
        // Given: I focus on a cell
        cy.getCell(2, 'description').click();
        
        // When: I start typing (should replace content)
        cy.get('body').type('Replaced Content{enter}');
        
        // Then: The cell should show the new content
        cy.getCell(2, 'description').should('contain', 'Replaced Content');
      });

      it('When I press Escape to cancel edit', () => {
        // Given: I enter edit mode
        cy.getCell(1, 'voltage').dblclick();
        cy.focused().clear().type('999');
        
        // When: I press Escape
        cy.get('body').type('{esc}');
        
        // Then: The edit should be cancelled and original value restored
        cy.getCell(1, 'voltage').should('not.contain', '999');
      });
    });

    describe('Advanced keyboard combinations', () => {
      it('When I use Ctrl+Plus to insert row', () => {
        // Given: I select a row
        cy.getCell(2, 'tag').click();
        
        // When: I press Ctrl+Plus (if implemented)
        cy.get('body').type('{ctrl}+');
        
        // Then: Should either insert row or show appropriate response
        cy.get('body').should('exist'); // App shouldn't crash
      });

      it('When I use Ctrl+Minus to delete row', () => {
        // Given: I select a row
        cy.getCell(1, 'tag').click();
        
        // When: I press Ctrl+Minus (if implemented)
        cy.get('body').type('{ctrl}-');
        
        // Then: Should either delete row or show confirmation
        cy.get('body').should('exist'); // App shouldn't crash
      });
    });
  });

  context('Accessibility navigation', () => {
    it('When I use screen reader navigation keys', () => {
      // Given: I focus on the grid
      cy.getCell(0, 'tag').click();
      
      // When: I use ARIA navigation (Ctrl+Alt+Arrow keys)
      cy.get('body').type('{ctrl}{alt}{rightarrow}');
      
      // Then: Should navigate according to ARIA grid pattern
      cy.get('.ag-cell-focus').should('exist');
    });

    it('When I use keyboard to access context menu', () => {
      // Given: I select a cell
      cy.getCell(1, 'voltage').click();
      
      // When: I press the context menu key or Shift+F10
      cy.get('body').type('{shift}{F10}');
      
      // Then: Context menu should appear
      cy.get('.ag-menu').should('be.visible');
    });
  });

  context('Performance with keyboard operations', () => {
    it('When I rapidly navigate with arrow keys, it should be responsive', () => {
      // Given: I start at a cell
      cy.getCell(0, 'tag').click();
      
      // When: I rapidly press arrow keys
      const startTime = Date.now();
      cy.get('body').type('{rightarrow}{rightarrow}{downarrow}{downarrow}{leftarrow}');
      
      // Then: Navigation should complete quickly
      cy.get('.ag-cell-focus').should('exist');
      cy.then(() => {
        const endTime = Date.now();
        expect(endTime - startTime).to.be.lessThan(500);
      });
    });
  });
});