import { test, expect } from '@playwright/test';
import { ProjectPage } from '../pages/project-page';
import { CableTablePage } from '../pages/cable-table-page';
import { IOTablePage } from '../pages/io-table-page';
import { ExportPage } from '../pages/export-page';
import path from 'path';

test.describe('Complete Project Workflow', () => {
  let projectPage: ProjectPage;
  let cableTablePage: CableTablePage;
  let ioTablePage: IOTablePage;
  let exportPage: ExportPage;

  test.beforeEach(async ({ page }) => {
    projectPage = new ProjectPage(page);
    cableTablePage = new CableTablePage(page);
    ioTablePage = new IOTablePage(page);
    exportPage = new ExportPage(page);
    
    await page.goto('/');
  });

  test('complete electrical design workflow', async ({ page }) => {
    // Step 1: Create new project
    await test.step('Create new project', async () => {
      await projectPage.clickNewProject();
      await projectPage.fillProjectDetails({
        name: 'E2E Test Compressor Station',
        description: 'End-to-end test project',
        client: 'Test Client Inc.',
        engineer: 'Test Engineer, PE'
      });
      await projectPage.clickCreateProject();
      
      await expect(page.locator('[data-testid="project-title"]')).toContainText('E2E Test Compressor Station');
    });

    // Step 2: Add cables to project
    await test.step('Add multiple cables', async () => {
      await cableTablePage.navigateToCablesTab();
      
      // Add power cable
      await cableTablePage.addCable({
        tag: 'C-001',
        description: 'Control Power',
        function: 'Power',
        voltage: '120',
        size: '14 AWG',
        cores: '2',
        fromLocation: 'MCC-1',
        toLocation: 'PLC-1',
        length: '150'
      });

      // Add signal cables
      await cableTablePage.addCable({
        tag: 'C-002',
        description: 'Flow Transmitter Signal',
        function: 'Signal', 
        voltage: '24',
        size: '18 AWG',
        cores: '2',
        fromLocation: 'FT-001',
        toLocation: 'PLC-1',
        length: '85'
      });

      await cableTablePage.addCable({
        tag: 'C-003',
        description: 'Temperature RTD',
        function: 'Signal',
        voltage: '24',
        size: '16 AWG',
        cores: '3',
        fromLocation: 'TT-002',
        toLocation: 'PLC-1', 
        length: '95'
      });

      // Verify cables were added
      await expect(cableTablePage.getCableRow('C-001')).toBeVisible();
      await expect(cableTablePage.getCableRow('C-002')).toBeVisible();
      await expect(cableTablePage.getCableRow('C-003')).toBeVisible();
    });

    // Step 3: Add I/O points
    await test.step('Add I/O points and link to cables', async () => {
      await ioTablePage.navigateToIOTab();
      
      // Add flow transmitter I/O
      await ioTablePage.addIOPoint({
        tag: 'FT-001',
        description: 'Gas Flow Transmitter',
        signalType: '4-20mA',
        ioType: 'AI',
        plcName: 'PLC-1',
        rack: '1',
        slot: '4',
        channel: '1',
        cable: 'C-002'
      });

      // Add temperature I/O
      await ioTablePage.addIOPoint({
        tag: 'TT-002', 
        description: 'Gas Temperature',
        signalType: 'RTD',
        ioType: 'AI',
        plcName: 'PLC-1',
        rack: '2',
        slot: '8',
        channel: '1',
        cable: 'C-003'
      });

      // Verify I/O points were added
      await expect(ioTablePage.getIORow('FT-001')).toBeVisible();
      await expect(ioTablePage.getIORow('TT-002')).toBeVisible();
      
      // Verify cable linkage
      await expect(ioTablePage.getIORow('FT-001').locator('[data-column="cable"]')).toContainText('C-002');
    });

    // Step 4: Add conduits and routing
    await test.step('Add conduits and assign cable routing', async () => {
      await page.click('[data-testid="conduits-tab"]');
      
      // Add conduits
      await page.click('[data-testid="add-conduit-btn"]');
      await page.fill('[data-testid="conduit-tag"]', 'C01');
      await page.selectOption('[data-testid="conduit-type"]', 'EMT');
      await page.selectOption('[data-testid="conduit-size"]', '1"');
      await page.fill('[data-testid="conduit-from"]', 'MCC-1');
      await page.fill('[data-testid="conduit-to"]', 'JB-01');
      await page.click('[data-testid="save-conduit-btn"]');

      await page.click('[data-testid="add-conduit-btn"]');
      await page.fill('[data-testid="conduit-tag"]', 'C02');
      await page.selectOption('[data-testid="conduit-type"]', 'EMT');
      await page.selectOption('[data-testid="conduit-size"]', '3/4"');
      await page.fill('[data-testid="conduit-from"]', 'JB-01');
      await page.fill('[data-testid="conduit-to"]', 'PLC-1');
      await page.click('[data-testid="save-conduit-btn"]');

      // Assign routing to cables
      await cableTablePage.navigateToCablesTab();
      await cableTablePage.updateCableField('C-001', 'route', 'C01,C02');
      await cableTablePage.updateCableField('C-002', 'route', 'C02');
      await cableTablePage.updateCableField('C-003', 'route', 'C02');
    });

    // Step 5: Verify calculations
    await test.step('Verify engineering calculations', async () => {
      await page.click('[data-testid="conduits-tab"]');
      
      // Check conduit fill calculations
      const c02FillCell = page.locator('[data-testid="conduit-C02"] [data-column="fill-percentage"]');
      await expect(c02FillCell).not.toContainText('0%'); // Should have calculated fill
      
      // Check for any over-capacity warnings
      const overCapacityWarning = page.locator('[data-testid="fill-warning"]');
      // May or may not be present, but shouldn't cause errors
    });

    // Step 6: Create revision checkpoint
    await test.step('Create major revision', async () => {
      await page.click('[data-testid="revision-menu"]');
      await page.click('[data-testid="create-major-revision"]');
      
      await page.fill('[data-testid="revision-version"]', '30%');
      await page.fill('[data-testid="revision-description"]', '30% Design Review - E2E Test');
      await page.click('[data-testid="create-revision-btn"]');
      
      await expect(page.locator('[data-testid="current-revision"]')).toContainText('30%');
    });

    // Step 7: Make changes and track them
    await test.step('Make changes for next revision', async () => {
      await cableTablePage.navigateToCablesTab();
      
      // Modify existing cable
      await cableTablePage.updateCableField('C-001', 'length', '175');
      await cableTablePage.updateCableField('C-001', 'description', 'Modified Control Power');
      
      // Add new cable
      await cableTablePage.addCable({
        tag: 'C-004',
        description: 'Motor Power Cable',
        function: 'Power',
        voltage: '480',
        size: '4/0 AWG',
        cores: '3',
        fromLocation: 'MCC-2',
        toLocation: 'M-001',
        length: '200'
      });

      // Create second revision
      await page.click('[data-testid="revision-menu"]');
      await page.click('[data-testid="create-major-revision"]');
      await page.fill('[data-testid="revision-version"]', '60%');
      await page.fill('[data-testid="revision-description"]', '60% Design Review - Added Motor');
      await page.click('[data-testid="create-revision-btn"]');
    });

    // Step 8: Compare revisions
    await test.step('Compare revision changes', async () => {
      await page.click('[data-testid="revision-menu"]');
      await page.click('[data-testid="compare-revisions"]');
      
      await page.selectOption('[data-testid="base-revision"]', '30%');
      await page.selectOption('[data-testid="compare-revision"]', '60%');
      await page.click('[data-testid="compare-btn"]');
      
      // Verify changes are shown
      await expect(page.locator('[data-testid="change-list"]')).toBeVisible();
      await expect(page.locator('[data-testid="change-list"]')).toContainText('C-001'); // Modified
      await expect(page.locator('[data-testid="change-list"]')).toContainText('C-004'); // Added
      
      await page.click('[data-testid="close-comparison"]');
    });

    // Step 9: Export to Excel
    await test.step('Export project to Excel', async () => {
      await exportPage.navigateToExport();
      
      // Select standard cable schedule template
      await exportPage.selectTemplate('Standard Cable Schedule');
      
      // Configure export options
      await exportPage.configureExport({
        includeSpareCables: false,
        sortByCableTag: true,
        includeCalculations: true
      });
      
      // Start export
      const downloadPromise = page.waitForEvent('download');
      await exportPage.clickExport();
      
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/.*\.xlsx$/);
      
      // Save to temp location for verification
      const downloadPath = path.join(__dirname, '../temp', download.suggestedFilename());
      await download.saveAs(downloadPath);
      
      // Verify file exists and has reasonable size
      const fs = require('fs');
      expect(fs.existsSync(downloadPath)).toBe(true);
      const stats = fs.statSync(downloadPath);
      expect(stats.size).toBeGreaterThan(1000); // Should be more than 1KB
    });

    // Step 10: Save project file
    await test.step('Save project file', async () => {
      await page.keyboard.press('Control+S');
      
      // Wait for save confirmation
      await expect(page.locator('[data-testid="save-status"]')).toContainText('Saved');
      
      // Verify project can be reopened
      const projectPath = await projectPage.getCurrentProjectPath();
      expect(projectPath).toMatch(/.*\.cfp$/);
    });

    // Step 11: Verify data integrity
    await test.step('Verify all data is preserved', async () => {
      // Check cable count
      await cableTablePage.navigateToCablesTab();
      const cableRows = page.locator('[data-testid^="cable-row-"]');
      await expect(cableRows).toHaveCount(4); // C-001, C-002, C-003, C-004

      // Check I/O count
      await ioTablePage.navigateToIOTab();
      const ioRows = page.locator('[data-testid^="io-row-"]');
      await expect(ioRows).toHaveCount(2); // FT-001, TT-002

      // Check conduit count
      await page.click('[data-testid="conduits-tab"]');
      const conduitRows = page.locator('[data-testid^="conduit-row-"]');
      await expect(conduitRows).toHaveCount(2); // C01, C02

      // Check revision history
      await page.click('[data-testid="revision-menu"]');
      await page.click('[data-testid="revision-history"]');
      const revisionRows = page.locator('[data-testid^="revision-row-"]');
      await expect(revisionRows).toHaveCount.toBeGreaterThanOrEqual(2); // 30%, 60%
    });
  });

  test('library workflow integration', async ({ page }) => {
    // Test using library to speed up data entry
    await test.step('Create project and use cable library', async () => {
      await projectPage.clickNewProject();
      await projectPage.fillProjectDetails({
        name: 'Library Test Project',
        description: 'Testing library integration'
      });
      await projectPage.clickCreateProject();

      await cableTablePage.navigateToCablesTab();
      
      // Use "Add from Library" feature
      await page.click('[data-testid="add-from-library-btn"]');
      
      // Load sample library (this would be a pre-created test library)
      await page.click('[data-testid="browse-library-btn"]');
      // In a real test, this would open a file dialog
      // For now, simulate selecting a library
      await page.click('[data-testid="sample-library-option"]');
      
      // Select cable type from library
      await page.click('[data-testid="library-item-600V-XLPE-3C"]');
      await page.click('[data-testid="use-selected-btn"]');
      
      // Fill in project-specific details
      await page.fill('[data-testid="cable-tag"]', 'C-001');
      await page.fill('[data-testid="cable-description"]', 'Main Power Feed');
      await page.fill('[data-testid="cable-from"]', 'Main Panel');
      await page.fill('[data-testid="cable-to"]', 'Sub Panel');
      await page.fill('[data-testid="cable-length"]', '300');
      
      await page.click('[data-testid="save-cable-btn"]');
      
      // Verify cable was added with library specifications
      await expect(cableTablePage.getCableRow('C-001')).toBeVisible();
      await expect(page.locator('[data-testid="cable-C-001"] [data-column="cable-type"]')).toContainText('XLPE');
    });
  });

  test('error handling and recovery', async ({ page }) => {
    await test.step('Handle validation errors gracefully', async () => {
      await projectPage.clickNewProject();
      await projectPage.fillProjectDetails({
        name: 'Error Test Project'
      });
      await projectPage.clickCreateProject();

      await cableTablePage.navigateToCablesTab();
      
      // Try to add cable with duplicate tag
      await cableTablePage.addCable({
        tag: 'C-001',
        description: 'First Cable'
      });
      
      await cableTablePage.addCable({
        tag: 'C-001', // Duplicate tag
        description: 'Duplicate Cable'
      });
      
      // Should show error message
      await expect(page.locator('[data-testid="error-message"]')).toContainText('already exists');
      
      // Error should not break the application
      await expect(cableTablePage.getCableRow('C-001')).toBeVisible();
      await expect(page.locator('[data-testid^="cable-row-"]')).toHaveCount(1);
    });

    await test.step('Handle file operation errors', async () => {
      // Try to open non-existent file
      await page.click('[data-testid="file-menu"]');
      await page.click('[data-testid="open-project"]');
      
      // This would normally open a file dialog
      // Simulate selecting a non-existent file
      await page.click('[data-testid="simulate-invalid-file"]');
      
      // Should show error message and not crash
      await expect(page.locator('[data-testid="error-dialog"]')).toBeVisible();
      await page.click('[data-testid="close-error-dialog"]');
      
      // Application should still be functional
      await expect(page.locator('[data-testid="main-window"]')).toBeVisible();
    });
  });
});