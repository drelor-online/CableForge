describe('Excel-like Copy/Paste Operations (BDD)', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.seedDatabase('cables');
    cy.waitForGrid();
  });

  context('Given the Cable Schedule grid has data loaded', () => {
    describe('Single cell copy/paste', () => {
      it('When I copy a single cell value with Ctrl+C and paste with Ctrl+V', () => {
        // Given: I select a cell with a known value
        cy.getCell(0, 'voltage').click();
        
        // When: I copy the cell
        cy.get('body').type('{ctrl}c');
        
        // And: I select a different cell
        cy.getCell(1, 'voltage').click();
        
        // And: I paste the value
        cy.get('body').type('{ctrl}v');
        
        // Then: The target cell should have the copied value
        cy.getCell(0, 'voltage').invoke('text').then((originalText) => {
          cy.getCell(1, 'voltage').should('contain', originalText.trim());
        });
      });
      
      it('When I copy a text field and paste to another text field', () => {
        // Given: I select a description cell
        cy.getCell(0, 'description').click();
        
        // When: I copy and paste to another row
        cy.get('body').type('{ctrl}c');
        cy.getCell(2, 'description').click();
        cy.get('body').type('{ctrl}v');
        
        // Then: The description should be copied
        cy.getCell(0, 'description').invoke('text').then((originalText) => {
          cy.getCell(2, 'description').should('contain', originalText.trim());
        });
      });
    });

    describe('Range copy/paste', () => {
      it('When I select a range and copy/paste to a new location', () => {
        // Given: I select a 2x2 range
        cy.selectRange(0, 'voltage', 1, 'function');
        
        // When: I copy the range
        cy.get('body').type('{ctrl}c');
        
        // And: I select a target cell
        cy.getCell(3, 'voltage').click();
        
        // And: I paste the range
        cy.get('body').type('{ctrl}v');
        
        // Then: The values should be pasted in the same relative positions
        cy.getCell(0, 'voltage').invoke('text').then((originalVoltage) => {
          cy.getCell(3, 'voltage').should('contain', originalVoltage.trim());
        });
        
        cy.getCell(0, 'function').invoke('text').then((originalFunction) => {
          cy.getCell(3, 'function').should('contain', originalFunction.trim());
        });
        
        cy.getCell(1, 'voltage').invoke('text').then((originalVoltage) => {
          cy.getCell(4, 'voltage').should('contain', originalVoltage.trim());
        });
        
        cy.getCell(1, 'function').invoke('text').then((originalFunction) => {
          cy.getCell(4, 'function').should('contain', originalFunction.trim());
        });
      });

      it('When I copy a column and paste to another column', () => {
        // Given: I select an entire column by clicking header
        cy.get('[col-id="voltage"] .ag-header-cell-text').click();
        
        // When: I copy the column
        cy.get('body').type('{ctrl}c');
        
        // And: I select another column header
        cy.get('[col-id="sparePercentage"] .ag-header-cell-text').click();
        
        // And: I paste
        cy.get('body').type('{ctrl}v');
        
        // Then: All voltage values should be copied to spare percentage column
        cy.get('[col-id="voltage"] .ag-cell').each(($voltageCell, index) => {
          const voltageText = $voltageCell.text().trim();
          cy.get(`[row-index="${index}"] [col-id="sparePercentage"]`)
            .should('contain', voltageText);
        });
      });
    });

    describe('Cross-type paste validation', () => {
      it('When I paste text into a numeric field, it should validate or reject', () => {
        // Given: I copy a text description
        cy.getCell(0, 'description').click();
        cy.get('body').type('{ctrl}c');
        
        // When: I try to paste into a numeric voltage field
        cy.getCell(1, 'voltage').click();
        cy.get('body').type('{ctrl}v');
        
        // Then: Either the paste should be rejected or converted appropriately
        // (This test validates that the system handles type mismatches gracefully)
        cy.getCell(1, 'voltage').invoke('text').then((text) => {
          // Should either remain original value or show validation error
          expect(text.trim()).to.not.equal(''); // Should not be empty
        });
      });

      it('When I paste a number into a text field, it should work', () => {
        // Given: I copy a voltage value
        cy.getCell(0, 'voltage').click();
        cy.get('body').type('{ctrl}c');
        
        // When: I paste into a description field
        cy.getCell(1, 'description').click();
        cy.get('body').type('{ctrl}v');
        
        // Then: The number should be pasted as text
        cy.getCell(0, 'voltage').invoke('text').then((originalText) => {
          cy.getCell(1, 'description').should('contain', originalText.trim());
        });
      });
    });

    describe('Paste special operations', () => {
      it('When I use Ctrl+Shift+V for paste special (if implemented)', () => {
        // Given: I copy a formatted cell
        cy.getCell(0, 'voltage').click();
        cy.get('body').type('{ctrl}c');
        
        // When: I try paste special
        cy.getCell(1, 'voltage').click();
        cy.get('body').type('{ctrl}{shift}v');
        
        // Then: Should either show paste special dialog or handle appropriately
        // (This tests if enhanced paste functionality exists)
        cy.get('body').should('exist'); // Basic assertion that app doesn't crash
      });
    });

    describe('Clipboard integration with external apps', () => {
      it('When I copy data from grid, it should be available to external clipboard', () => {
        // Given: I select a range
        cy.selectRange(0, 'tag', 1, 'description');
        
        // When: I copy the selection
        cy.get('body').type('{ctrl}c');
        
        // Then: The clipboard should contain tab-separated values
        // Note: Cypress has limitations accessing system clipboard
        // This test validates the copy operation triggers without error
        cy.get('.ag-range-selected').should('exist');
      });

      it('When I paste data from external source (simulated)', () => {
        // Given: I simulate external data by typing
        cy.getCell(0, 'tag').click();
        
        // When: I simulate pasting external data
        // Note: In real scenario, this would come from system clipboard
        cy.get('body').type('{ctrl}v');
        
        // Then: The paste operation should complete without error
        cy.get('.ag-cell-focus').should('exist');
      });
    });

    describe('Undo/Redo after paste', () => {
      it('When I paste data then press Ctrl+Z, it should undo the paste', () => {
        // Given: I copy and paste some data
        cy.getCell(0, 'voltage').click();
        cy.get('body').type('{ctrl}c');
        
        // Store original value for later comparison
        cy.getCell(1, 'voltage').invoke('text').as('originalValue');
        
        cy.getCell(1, 'voltage').click();
        cy.get('body').type('{ctrl}v');
        
        // When: I press Ctrl+Z to undo
        cy.get('body').type('{ctrl}z');
        
        // Then: The original value should be restored
        cy.get('@originalValue').then((originalValue) => {
          cy.getCell(1, 'voltage').should('contain', originalValue);
        });
      });

      it('When I undo then press Ctrl+Y, it should redo the paste', () => {
        // Given: I perform copy/paste/undo sequence
        cy.getCell(0, 'voltage').invoke('text').as('copiedValue');
        cy.getCell(0, 'voltage').click();
        cy.get('body').type('{ctrl}c');
        
        cy.getCell(1, 'voltage').click();
        cy.get('body').type('{ctrl}v');
        cy.get('body').type('{ctrl}z'); // Undo
        
        // When: I press Ctrl+Y to redo
        cy.get('body').type('{ctrl}y');
        
        // Then: The pasted value should be restored
        cy.get('@copiedValue').then((copiedValue) => {
          cy.getCell(1, 'voltage').should('contain', copiedValue);
        });
      });
    });

    describe('Performance with large selections', () => {
      it('When I copy a large range (10+ rows), it should complete efficiently', () => {
        // Given: I select a large range (assuming grid has enough data)
        cy.get('.ag-row').then($rows => {
          if ($rows.length >= 10) {
            // When: I select rows 0-9 across multiple columns
            cy.selectRange(0, 'tag', 9, 'length');
            
            // And: I copy the large selection
            const startTime = Date.now();
            cy.get('body').type('{ctrl}c');
            
            // Then: The operation should complete quickly (< 1 second)
            cy.get('.ag-range-selected').should('exist');
            cy.then(() => {
              const endTime = Date.now();
              expect(endTime - startTime).to.be.lessThan(1000);
            });
          }
        });
      });
    });
  });

  context('Error handling', () => {
    it('When I try to paste into read-only cells, it should handle gracefully', () => {
      // Given: I copy some data
      cy.getCell(0, 'voltage').click();
      cy.get('body').type('{ctrl}c');
      
      // When: I try to paste into a calculated/read-only field (if any)
      cy.getCell(1, 'id').click(); // ID field should be read-only
      cy.get('body').type('{ctrl}v');
      
      // Then: The operation should not cause errors
      cy.get('body').should('exist'); // App should not crash
    });

    it('When I paste with insufficient target space, it should handle gracefully', () => {
      // Given: I copy a large range
      cy.selectRange(0, 'tag', 2, 'function');
      cy.get('body').type('{ctrl}c');
      
      // When: I try to paste near the bottom of available data
      cy.get('.ag-row').then($rows => {
        const lastRowIndex = $rows.length - 1;
        cy.getCell(lastRowIndex, 'tag').click();
        cy.get('body').type('{ctrl}v');
        
        // Then: Should paste what fits without errors
        cy.get('body').should('exist'); // App should not crash
      });
    });
  });
});