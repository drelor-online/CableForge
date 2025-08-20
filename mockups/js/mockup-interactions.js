// CableForge Mockup Interactions

document.addEventListener('DOMContentLoaded', function() {
    initializeTabs();
    initializeTableInteractions();
    initializeToolbarActions();
    initializeStatusUpdates();
});

// Tab System
function initializeTabs() {
    const tabs = document.querySelectorAll('.tab');
    const panels = document.querySelectorAll('.tab-panel');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetPanel = tab.dataset.tab;
            
            // Remove active class from all tabs and panels
            tabs.forEach(t => t.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding panel
            tab.classList.add('active');
            const panel = document.getElementById(`${targetPanel}-panel`);
            if (panel) {
                panel.classList.add('active');
            }
            
            // Update status bar for different tabs
            updateStatusBarForTab(targetPanel);
        });
    });
}

// Table Interactions
function initializeTableInteractions() {
    initializeRowSelection();
    initializeColumnSorting();
    initializeInlineEditing();
    initializeCellActions();
}

function initializeRowSelection() {
    const selectAllCheckbox = document.querySelector('thead input[type="checkbox"]');
    const rowCheckboxes = document.querySelectorAll('tbody input[type="checkbox"]');
    
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function() {
            rowCheckboxes.forEach(checkbox => {
                checkbox.checked = this.checked;
                updateRowSelection(checkbox);
            });
            updateSelectionCount();
        });
    }
    
    rowCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            updateRowSelection(this);
            updateSelectAllState();
            updateSelectionCount();
        });
    });
}

function updateRowSelection(checkbox) {
    const row = checkbox.closest('tr');
    if (checkbox.checked) {
        row.classList.add('selected');
    } else {
        row.classList.remove('selected');
    }
}

function updateSelectAllState() {
    const selectAllCheckbox = document.querySelector('thead input[type="checkbox"]');
    const rowCheckboxes = document.querySelectorAll('tbody input[type="checkbox"]');
    const checkedBoxes = document.querySelectorAll('tbody input[type="checkbox"]:checked');
    
    if (selectAllCheckbox) {
        selectAllCheckbox.checked = checkedBoxes.length === rowCheckboxes.length;
        selectAllCheckbox.indeterminate = checkedBoxes.length > 0 && checkedBoxes.length < rowCheckboxes.length;
    }
}

function updateSelectionCount() {
    const checkedBoxes = document.querySelectorAll('tbody input[type="checkbox"]:checked');
    const countElements = document.querySelectorAll('.table-stats span:first-child');
    
    countElements.forEach(element => {
        element.textContent = `${checkedBoxes.length} cables selected`;
    });
}

function initializeColumnSorting() {
    const sortableHeaders = document.querySelectorAll('.sortable');
    
    sortableHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const sortField = this.dataset.sort;
            const currentSort = this.classList.contains('sorted');
            const isAsc = this.querySelector('.sort-indicator').classList.contains('asc');
            
            // Remove sorting from all headers
            sortableHeaders.forEach(h => {
                h.classList.remove('sorted');
                h.querySelector('.sort-indicator').className = 'sort-indicator';
            });
            
            // Add sorting to clicked header
            this.classList.add('sorted');
            const indicator = this.querySelector('.sort-indicator');
            
            if (!currentSort || !isAsc) {
                indicator.classList.add('asc');
            } else {
                indicator.classList.add('desc');
            }
            
            // Simulate table sorting (in real implementation, this would sort data)
            simulateTableSort(sortField, indicator.classList.contains('asc'));
        });
    });
}

function simulateTableSort(field, ascending) {
    // In a real implementation, this would sort the table data
    console.log(`Sorting by ${field} ${ascending ? 'ascending' : 'descending'}`);
    
    // Add brief loading state
    const table = document.querySelector('.data-table');
    table.style.opacity = '0.6';
    setTimeout(() => {
        table.style.opacity = '1';
    }, 200);
}

function initializeInlineEditing() {
    const editableCells = document.querySelectorAll('.editable-cell');
    
    editableCells.forEach(cell => {
        cell.addEventListener('dblclick', function() {
            startCellEdit(this);
        });
    });
}

function startCellEdit(cell) {
    if (cell.classList.contains('editing')) return;
    
    const originalValue = cell.textContent.trim();
    cell.classList.add('editing');
    
    const input = document.createElement('input');
    input.type = 'text';
    input.value = originalValue;
    input.className = 'cell-editor';
    
    cell.innerHTML = '';
    cell.appendChild(input);
    input.focus();
    input.select();
    
    function finishEdit(save = true) {
        if (save && input.value !== originalValue) {
            cell.textContent = input.value;
            // Add modified indicator
            const indicator = document.createElement('div');
            indicator.className = 'cell-status modified';
            cell.appendChild(indicator);
            
            // Update save status
            updateSaveStatus('saving');
            setTimeout(() => {
                updateSaveStatus('saved');
            }, 1000);
        } else {
            cell.textContent = originalValue;
        }
        
        cell.classList.remove('editing');
    }
    
    input.addEventListener('blur', () => finishEdit(true));
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            finishEdit(true);
        } else if (e.key === 'Escape') {
            finishEdit(false);
        }
    });
}

function initializeCellActions() {
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('cell-action-btn')) {
            const action = e.target.title.toLowerCase();
            const row = e.target.closest('tr');
            const cableTag = row.querySelector('.col-tag').textContent;
            
            switch(action) {
                case 'edit':
                    console.log(`Edit cable ${cableTag}`);
                    break;
                case 'delete':
                    if (confirm(`Delete cable ${cableTag}?`)) {
                        row.remove();
                        updateSelectionCount();
                    }
                    break;
            }
        }
    });
}

// Toolbar Actions
function initializeToolbarActions() {
    document.addEventListener('click', function(e) {
        if (e.target.closest('.btn')) {
            const btn = e.target.closest('.btn');
            const text = btn.textContent.trim();
            
            // Add loading state
            const originalContent = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<span class="loading-spinner"></span> ' + text;
            
            setTimeout(() => {
                btn.disabled = false;
                btn.innerHTML = originalContent;
                handleToolbarAction(text);
            }, 500);
        }
    });
}

function handleToolbarAction(action) {
    switch(action.toLowerCase()) {
        case 'new':
            console.log('Create new project');
            break;
        case 'save':
            updateSaveStatus('saving');
            setTimeout(() => updateSaveStatus('saved'), 1000);
            break;
        case 'open':
            console.log('Open project');
            break;
        case 'import':
            console.log('Import data');
            break;
        case 'export':
            console.log('Export data');
            break;
        case 'add cable':
            addNewCableRow();
            break;
        case 'add from library':
            showLibraryModal();
            break;
        case 'bulk edit':
            console.log('Bulk edit selected cables');
            break;
    }
}

function addNewCableRow() {
    const tbody = document.querySelector('.data-table tbody');
    const newRow = document.createElement('tr');
    newRow.classList.add('editing');
    
    newRow.innerHTML = `
        <td class="row-select">
            <input type="checkbox">
        </td>
        <td class="editable-cell col-tag">C-XXX</td>
        <td class="editable-cell">New Cable</td>
        <td class="editable-cell">
            <span class="cable-type-badge signal">Signal</span>
        </td>
        <td class="editable-cell">-</td>
        <td class="editable-cell">-</td>
        <td class="editable-cell col-numeric">-</td>
        <td class="editable-cell col-numeric">-</td>
        <td class="editable-cell col-route">-</td>
        <td class="col-numeric">-</td>
        <td>
            <div class="cell-actions">
                <button class="cell-action-btn" title="Edit">✏️</button>
                <button class="cell-action-btn" title="Delete">🗑️</button>
            </div>
        </td>
    `;
    
    tbody.appendChild(newRow);
    
    // Start editing the tag cell
    const tagCell = newRow.querySelector('.col-tag');
    setTimeout(() => startCellEdit(tagCell), 100);
    
    updateSelectionCount();
}

function showLibraryModal() {
    // Create a simple modal for demonstration
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal" style="width: 600px;">
            <div class="modal-header">
                <h3 class="modal-title">Cable Library</h3>
                <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
            </div>
            <div class="modal-body">
                <p>Select a cable type from the library:</p>
                <div style="margin: 1rem 0;">
                    <div class="badge badge-info" style="margin: 0.5rem; cursor: pointer;" onclick="selectLibraryItem(this, '600V XLPE 3/C+Gnd, 14AWG')">600V XLPE 3/C+Gnd, 14AWG</div>
                    <div class="badge badge-info" style="margin: 0.5rem; cursor: pointer;" onclick="selectLibraryItem(this, 'IS Signal Cable, 18AWG')">IS Signal Cable, 18AWG</div>
                    <div class="badge badge-info" style="margin: 0.5rem; cursor: pointer;" onclick="selectLibraryItem(this, 'Control Cable, 16AWG')">Control Cable, 16AWG</div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                <button class="btn btn-primary">Use Selected</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function selectLibraryItem(element, itemName) {
    // Remove selection from other items
    element.parentElement.querySelectorAll('.badge').forEach(badge => {
        badge.classList.remove('badge-success');
        badge.classList.add('badge-info');
    });
    
    // Select this item
    element.classList.remove('badge-info');
    element.classList.add('badge-success');
    
    console.log('Selected library item:', itemName);
}

// Status Updates
function initializeStatusUpdates() {
    // Simulate periodic status updates
    setInterval(updateRandomWarnings, 5000);
}

function updateSaveStatus(status) {
    const saveStatus = document.querySelector('.save-status');
    const statusText = saveStatus.querySelector('span:last-child');
    const statusIcon = saveStatus.querySelector('.icon');
    
    saveStatus.className = `save-status ${status}`;
    
    switch(status) {
        case 'saving':
            statusIcon.textContent = '⏳';
            statusText.textContent = 'Saving...';
            break;
        case 'saved':
            statusIcon.textContent = '✓';
            statusText.textContent = 'Saved';
            break;
        case 'error':
            statusIcon.textContent = '❌';
            statusText.textContent = 'Error';
            break;
    }
}

function updateStatusBarForTab(tabName) {
    const statusLeft = document.querySelector('.status-left');
    
    // Mock different stats for different tabs
    const stats = {
        cables: {
            'Cables': 247,
            'I/O Points': 89,
            'Conduits': 15,
            'Fill Warnings': 3
        },
        io: {
            'I/O Points': 89,
            'Assigned': 76,
            'Unassigned': 13,
            'Conflicts': 2
        },
        conduits: {
            'Conduits': 15,
            'Over Capacity': 2,
            'Near Capacity': 3,
            'Total Fill': '67%'
        },
        loads: {
            'Loads': 23,
            'Connected': 18,
            'Unconnected': 5,
            'Total Power': '450kW'
        },
        reports: {
            'Templates': 5,
            'Last Export': '2:15 PM',
            'File Size': '2.3MB',
            'Status': 'Ready'
        }
    };
    
    const currentStats = stats[tabName] || stats.cables;
    
    statusLeft.innerHTML = Object.entries(currentStats).map(([key, value], index) => {
        const warningClass = (key.includes('Warning') || key.includes('Conflict') || key.includes('Over')) && value > 0 ? 'status-warning' : '';
        return `
            ${index > 0 ? '<div class="status-separator"></div>' : ''}
            <div class="status-item">
                <span class="${warningClass}">${key}: ${value}</span>
            </div>
        `;
    }).join('');
}

function updateRandomWarnings() {
    const warningElements = document.querySelectorAll('.status-warning');
    warningElements.forEach(element => {
        if (element.textContent.includes('Warnings')) {
            const currentCount = parseInt(element.textContent.match(/\d+/)[0]);
            const newCount = Math.max(0, currentCount + (Math.random() > 0.7 ? 1 : -1));
            element.textContent = element.textContent.replace(/\d+/, newCount);
        }
    });
}

// Utility Functions
function simulateCalculation(cell, value) {
    cell.innerHTML = '<span class="loading-spinner"></span>';
    setTimeout(() => {
        cell.textContent = value;
        cell.classList.add('status-ok');
    }, Math.random() * 1000 + 500);
}

// Add some sample data periodically for demonstration
setTimeout(() => {
    const tbody = document.querySelector('.data-table tbody');
    if (tbody.children.length < 10) {
        // Add more sample rows for scrolling demonstration
        for (let i = 6; i <= 15; i++) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="row-select">
                    <input type="checkbox">
                </td>
                <td class="editable-cell col-tag">C-${i.toString().padStart(3, '0')}</td>
                <td class="editable-cell">Sample Cable ${i}</td>
                <td class="editable-cell">
                    <span class="cable-type-badge ${i % 2 === 0 ? 'power' : 'signal'}">${i % 2 === 0 ? 'Power' : 'Signal'}</span>
                </td>
                <td class="editable-cell">SOURCE-${i}</td>
                <td class="editable-cell">DEST-${i}</td>
                <td class="editable-cell col-numeric">${i % 2 === 0 ? '12' : '18'} AWG</td>
                <td class="editable-cell col-numeric">${50 + i * 10}'</td>
                <td class="editable-cell col-route">C${(i % 3) + 1}</td>
                <td class="col-numeric">${i % 2 === 0 ? (i * 0.1).toFixed(1) + '%' : '-'}</td>
                <td>
                    <div class="cell-actions">
                        <button class="cell-action-btn" title="Edit">✏️</button>
                        <button class="cell-action-btn" title="Delete">🗑️</button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        }
    }
}, 2000);

console.log('CableForge mockup interactions initialized');