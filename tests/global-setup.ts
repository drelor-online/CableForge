import { chromium, type FullConfig } from '@playwright/test';
import path from 'path';
import fs from 'fs';

async function globalSetup(config: FullConfig) {
  console.log('Starting global test setup...');

  // Create test fixtures directory
  const fixturesDir = path.join(__dirname, 'fixtures');
  if (!fs.existsSync(fixturesDir)) {
    fs.mkdirSync(fixturesDir, { recursive: true });
  }

  // Create temp directory for test files
  const tempDir = path.join(__dirname, 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  // Create sample test data files
  await createTestFixtures(fixturesDir);

  // Start a browser instance for global setup if needed
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // You could use this to:
  // - Pre-warm the application
  // - Create test data
  // - Verify the app starts correctly
  
  await browser.close();

  console.log('Global test setup completed.');
}

async function createTestFixtures(fixturesDir: string) {
  // Create sample CSV import data
  const csvData = `tag,description,function,voltage,size,cores,from_location,to_location,length
C-001,Control Power,Power,120,14 AWG,2,MCC-1,PLC-1,150
C-002,Flow Signal,Signal,24,18 AWG,2,FT-001,PLC-1,85
C-003,Temperature RTD,Signal,24,16 AWG,3,TT-002,PLC-1,95
C-004,Pressure Signal,Signal,24,18 AWG,2,PT-003,PLC-1,110`;

  fs.writeFileSync(path.join(fixturesDir, 'sample_cables.csv'), csvData);

  // Create sample I/O import data
  const ioData = `tag,description,signal_type,io_type,plc_name,rack,slot,channel
FT-001,Gas Flow Transmitter,4-20mA,AI,PLC-1,1,4,1
PT-003,Inlet Pressure,4-20mA,AI,PLC-1,1,4,2
TT-002,Gas Temperature,RTD,AI,PLC-1,2,8,1
XV-004,Shutdown Valve,24VDC,DO,PLC-1,3,12,1`;

  fs.writeFileSync(path.join(fixturesDir, 'sample_io.csv'), ioData);

  // Create sample export template
  const exportTemplate = {
    name: 'Standard Cable Schedule',
    description: 'Standard cable schedule format',
    sheets: [
      {
        name: 'Cable Schedule',
        columns: [
          { header: 'Cable Tag', field: 'tag', width: 15 },
          { header: 'Description', field: 'description', width: 25 },
          { header: 'From', field: 'from_equipment', width: 20 },
          { header: 'To', field: 'to_equipment', width: 20 },
          { header: 'Cable Type', field: 'cable_type', width: 15 },
          { header: 'Size', field: 'size', width: 10 },
          { header: 'Length (ft)', field: 'length', width: 12 },
          { header: 'Routing', field: 'route', width: 20 },
          { header: 'Notes', field: 'notes', width: 30 }
        ],
        filters: [
          { field: 'function', operator: 'ne', value: 'Spare' }
        ],
        sort: [
          { field: 'tag', direction: 'asc' }
        ]
      }
    ]
  };

  fs.writeFileSync(
    path.join(fixturesDir, 'standard_template.cft'),
    JSON.stringify(exportTemplate, null, 2)
  );

  console.log('Test fixtures created successfully.');
}

export default globalSetup;