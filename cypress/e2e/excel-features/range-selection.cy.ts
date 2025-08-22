describe('Excel-like Range Selection (BDD)', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.seedDatabase('cables');
    cy.waitForGrid();
  });

  context('Given the Cable Schedule grid is loaded with sample data', () => {
    describe('Multi-cell drag selection', () => {
      it('When I drag from cell at row 2, column "Voltage" to row 4, column "Size"', () => {
        // Given: Grid is loaded (from beforeEach)
        
        // When: I drag from voltage cell at row 2 to size cell at row 4
        cy.getCell(2, 'voltage')
          .trigger('mousedown', { which: 1 })
          .trigger('mousemove')
          .then(() => {
            cy.getCell(4, 'size')
              .trigger('mousemove')
              .trigger('mouseup');
          });

        // Then: All cells in that rectangle should be highlighted
        cy.get('.ag-range-selected').should('have.length.greaterThan', 6); // Expecting multiple cells
        
        // And: The range should include all cells between start and end
        cy.getCell(2, 'voltage').should('have.class', 'ag-range-selected');
        cy.getCell(3, 'voltage').should('have.class', 'ag-range-selected'); 
        cy.getCell(4, 'voltage').should('have.class', 'ag-range-selected');
        cy.getCell(2, 'cableType').should('have.class', 'ag-range-selected');
        cy.getCell(3, 'cableType').should('have.class', 'ag-range-selected');
        cy.getCell(4, 'cableType').should('have.class', 'ag-range-selected');
        cy.getCell(2, 'size').should('have.class', 'ag-range-selected');
        cy.getCell(3, 'size').should('have.class', 'ag-range-selected');
        cy.getCell(4, 'size').should('have.class', 'ag-range-selected');
      });

      it('When I drag from cell at row 0, column "Tag" to row 2, column "Length"', () => {
        // When: I drag select a different rectangular range
        cy.getCell(0, 'tag')
          .trigger('mousedown', { which: 1 })
          .trigger('mousemove')
          .then(() => {
            cy.getCell(2, 'length')
              .trigger('mousemove') 
              .trigger('mouseup');
          });

        // Then: The range should be properly selected
        cy.get('.ag-range-selected').should('have.length.greaterThan', 12); // 3 rows x 4+ columns
        
        // And: Corner cells should be selected
        cy.getCell(0, 'tag').should('have.class', 'ag-range-selected');
        cy.getCell(2, 'length').should('have.class', 'ag-range-selected');
        
        // And: Middle cells should be selected
        cy.getCell(1, 'description').should('have.class', 'ag-range-selected');
        cy.getCell(1, 'voltage').should('have.class', 'ag-range-selected');
      });
    });

    describe('Column selection', () => {
      it('When I click on the voltage column header', () => {
        // When: I click the voltage column header
        cy.get('[col-id="voltage"] .ag-header-cell-text').click();

        // Then: The entire voltage column should be selected
        cy.get('[col-id="voltage"]').should('have.class', 'ag-column-selected');
        
        // And: All cells in that column should be highlighted
        cy.get('[col-id="voltage"] .ag-cell').each($cell => {
          cy.wrap($cell).should('have.class', 'ag-cell-range-selected');
        });
      });

      it('When I Ctrl+click multiple column headers', () => {
        // When: I click voltage column, then Ctrl+click function column
        cy.get('[col-id="voltage"] .ag-header-cell-text').click();
        cy.get('[col-id="function"] .ag-header-cell-text').click({ ctrlKey: true });

        // Then: Both columns should be selected
        cy.get('[col-id="voltage"]').should('have.class', 'ag-column-selected');
        cy.get('[col-id="function"]').should('have.class', 'ag-column-selected');
        
        // And: Cells in both columns should be highlighted
        cy.get('[col-id="voltage"] .ag-cell').should('have.class', 'ag-cell-range-selected');
        cy.get('[col-id="function"] .ag-cell').should('have.class', 'ag-cell-range-selected');
      });
    });

    describe('Row selection with checkboxes', () => {
      it('When I click row checkboxes to select multiple rows', () => {
        // When: I click checkboxes for rows 1, 3, and 5
        cy.get('[row-index="1"] .ag-selection-checkbox').click();
        cy.get('[row-index="3"] .ag-selection-checkbox').click();
        cy.get('[row-index="5"] .ag-selection-checkbox').click();

        // Then: Those rows should be selected
        cy.get('[row-index="1"]').should('have.class', 'ag-row-selected');
        cy.get('[row-index="3"]').should('have.class', 'ag-row-selected');
        cy.get('[row-index="5"]').should('have.class', 'ag-row-selected');
        
        // And: Other rows should not be selected
        cy.get('[row-index="0"]').should('not.have.class', 'ag-row-selected');
        cy.get('[row-index="2"]').should('not.have.class', 'ag-row-selected');
        cy.get('[row-index="4"]').should('not.have.class', 'ag-row-selected');
      });

      it('When I click the header checkbox to select all rows', () => {
        // When: I click the header checkbox
        cy.get('.ag-header-select-all .ag-checkbox-input').click();

        // Then: All rows should be selected
        cy.get('.ag-row').each($row => {
          cy.wrap($row).should('have.class', 'ag-row-selected');
        });
      });
    });

    describe('Shift+click range selection', () => {
      it('When I click one cell then Shift+click another cell', () => {
        // When: I click cell at row 1, voltage, then Shift+click row 3, size
        cy.getCell(1, 'voltage').click();
        cy.getCell(3, 'size').click({ shiftKey: true });

        // Then: A rectangular range should be selected
        cy.get('.ag-range-selected').should('have.length.greaterThan', 6);
        
        // And: Corner cells should be selected
        cy.getCell(1, 'voltage').should('have.class', 'ag-range-selected');
        cy.getCell(3, 'size').should('have.class', 'ag-range-selected');
        
        // And: Intermediate cells should be selected
        cy.getCell(2, 'voltage').should('have.class', 'ag-range-selected');
        cy.getCell(2, 'cableType').should('have.class', 'ag-range-selected');
      });
    });

    describe('Select all functionality', () => {
      it('When I press Ctrl+A in the grid', () => {
        // Given: I focus on a cell first
        cy.getCell(0, 'tag').click();
        
        // When: I press Ctrl+A
        cy.get('body').type('{ctrl}a');

        // Then: All rows should be selected
        cy.get('.ag-row').should('have.class', 'ag-row-selected');
        
        // And: The selection count should match total rows
        cy.get('.ag-row-selected').should('have.length.greaterThan', 0);
      });
    });
  });

  context('Error scenarios', () => {
    it('When I try to select beyond grid boundaries', () => {
      // When: I try to drag select past the last row
      cy.getCell(0, 'tag')
        .trigger('mousedown', { which: 1 })
        .trigger('mousemove')
        .then(() => {
          // Try to select way beyond available rows
          cy.get('.ag-body-viewport')
            .trigger('mousemove', { clientX: 1000, clientY: 2000 })
            .trigger('mouseup');
        });

      // Then: Selection should be limited to available data
      cy.get('.ag-range-selected').should('exist');
      // Should not cause any errors or infinite selection
    });
  });

  context('Selection persistence', () => {
    it('When I select a range then scroll, the selection should persist', () => {
      // When: I select a range
      cy.selectRange(0, 'tag', 2, 'voltage');
      
      // And: I scroll the grid
      cy.get('.ag-body-viewport').scrollTo(0, 100);
      
      // Then: The selection should still be active
      cy.get('.ag-range-selected').should('exist');
    });
  });
});