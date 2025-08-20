import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ProjectManager } from '@/lib/project/project-manager';
import { Cable, IOPoint, Conduit, Project } from '@/types';
import fs from 'fs';
import path from 'path';

describe('Project Save/Load Integration', () => {
  let projectManager: ProjectManager;
  let testProjectPath: string;
  let tempDir: string;

  beforeEach(async () => {
    projectManager = new ProjectManager();
    tempDir = path.join(__dirname, '../../../temp');
    
    // Create temp directory if it doesn't exist
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    testProjectPath = path.join(tempDir, `test-project-${Date.now()}.cfp`);
  });

  afterEach(async () => {
    // Clean up test files
    if (fs.existsSync(testProjectPath)) {
      fs.unlinkSync(testProjectPath);
    }
  });

  describe('createProject', () => {
    it('should create new project file with proper schema', async () => {
      const projectData = {
        name: 'Test Compressor Station',
        description: 'Integration test project',
        client: 'Test Client',
        engineer: 'Test Engineer'
      };

      const project = await projectManager.createProject(testProjectPath, projectData);

      expect(project.id).toBeDefined();
      expect(project.name).toBe(projectData.name);
      expect(project.description).toBe(projectData.description);
      expect(fs.existsSync(testProjectPath)).toBe(true);

      // Verify database schema was created
      const loadedProject = await projectManager.openProject(testProjectPath);
      expect(loadedProject.name).toBe(projectData.name);
    });

    it('should initialize with empty tables', async () => {
      const projectData = {
        name: 'Empty Project Test',
        description: 'Test empty initialization'
      };

      await projectManager.createProject(testProjectPath, projectData);
      
      const cables = await projectManager.getCables(testProjectPath);
      const ioPoints = await projectManager.getIOPoints(testProjectPath);
      const conduits = await projectManager.getConduits(testProjectPath);

      expect(cables).toHaveLength(0);
      expect(ioPoints).toHaveLength(0);
      expect(conduits).toHaveLength(0);
    });
  });

  describe('saveAndLoadData', () => {
    it('should save and load cables correctly', async () => {
      await projectManager.createProject(testProjectPath, {
        name: 'Cable Test Project'
      });

      const testCables: Partial<Cable>[] = [
        {
          tag: 'C-001',
          description: 'Control Power Cable',
          function: 'Power',
          voltage: 120,
          size: '14 AWG',
          cores: 2,
          fromLocation: 'MCC-1',
          toLocation: 'PLC-1',
          length: 150,
          route: 'C01,C02'
        },
        {
          tag: 'C-002', 
          description: 'Flow Signal Cable',
          function: 'Signal',
          voltage: 24,
          size: '18 AWG',
          cores: 2,
          fromLocation: 'FT-001',
          toLocation: 'PLC-1',
          length: 85
        }
      ];

      // Save cables
      for (const cable of testCables) {
        await projectManager.addCable(testProjectPath, cable);
      }

      // Load and verify
      const loadedCables = await projectManager.getCables(testProjectPath);
      expect(loadedCables).toHaveLength(2);
      
      const cable1 = loadedCables.find(c => c.tag === 'C-001');
      expect(cable1?.description).toBe('Control Power Cable');
      expect(cable1?.voltage).toBe(120);
      expect(cable1?.route).toBe('C01,C02');
      
      const cable2 = loadedCables.find(c => c.tag === 'C-002');
      expect(cable2?.description).toBe('Flow Signal Cable');
      expect(cable2?.length).toBe(85);
    });

    it('should save and load I/O points correctly', async () => {
      await projectManager.createProject(testProjectPath, {
        name: 'IO Test Project'
      });

      const testIOPoints: Partial<IOPoint>[] = [
        {
          tag: 'FT-001',
          description: 'Gas Flow Transmitter',
          signalType: '4-20mA',
          ioType: 'AI',
          plcName: 'PLC-1',
          rack: 1,
          slot: 4,
          channel: 1
        },
        {
          tag: 'XV-002',
          description: 'Shutdown Valve',
          signalType: '24VDC',
          ioType: 'DO', 
          plcName: 'PLC-1',
          rack: 1,
          slot: 12,
          channel: 1
        }
      ];

      // Save I/O points
      for (const ioPoint of testIOPoints) {
        await projectManager.addIOPoint(testProjectPath, ioPoint);
      }

      // Load and verify
      const loadedIOPoints = await projectManager.getIOPoints(testProjectPath);
      expect(loadedIOPoints).toHaveLength(2);
      
      const ft001 = loadedIOPoints.find(io => io.tag === 'FT-001');
      expect(ft001?.signalType).toBe('4-20mA');
      expect(ft001?.ioType).toBe('AI');
      expect(ft001?.rack).toBe(1);
      expect(ft001?.slot).toBe(4);
      expect(ft001?.channel).toBe(1);
    });

    it('should maintain referential integrity between cables and I/O', async () => {
      await projectManager.createProject(testProjectPath, {
        name: 'Relationship Test Project'
      });

      // Add cable first
      const cable = await projectManager.addCable(testProjectPath, {
        tag: 'C-001',
        description: 'Signal Cable'
      });

      // Add I/O point linked to cable
      const ioPoint = await projectManager.addIOPoint(testProjectPath, {
        tag: 'FT-001',
        description: 'Flow Transmitter',
        cableId: cable.id
      });

      // Verify relationship
      const loadedIOPoints = await projectManager.getIOPoints(testProjectPath);
      const loadedIOPoint = loadedIOPoints.find(io => io.tag === 'FT-001');
      expect(loadedIOPoint?.cableId).toBe(cable.id);

      // Verify reverse lookup
      const cableIOPoints = await projectManager.getIOPointsForCable(testProjectPath, cable.id!);
      expect(cableIOPoints).toHaveLength(1);
      expect(cableIOPoints[0].tag).toBe('FT-001');
    });
  });

  describe('revisionTracking', () => {
    it('should track revisions on data changes', async () => {
      await projectManager.createProject(testProjectPath, {
        name: 'Revision Test Project'
      });

      // Create initial revision
      await projectManager.createMajorRevision(testProjectPath, {
        version: '30%',
        description: '30% Design Review'
      });

      // Add some data
      await projectManager.addCable(testProjectPath, {
        tag: 'C-001',
        description: 'Original Cable'
      });

      // Create another revision
      await projectManager.createMajorRevision(testProjectPath, {
        version: '60%', 
        description: '60% Design Review'
      });

      // Modify the cable
      const cables = await projectManager.getCables(testProjectPath);
      const cable = cables[0];
      await projectManager.updateCable(testProjectPath, cable.id!, {
        description: 'Modified Cable'
      });

      // Verify revision history
      const revisions = await projectManager.getRevisions(testProjectPath);
      expect(revisions.length).toBeGreaterThan(1);
      
      const revision30 = revisions.find(r => r.majorVersion === '30%');
      const revision60 = revisions.find(r => r.majorVersion === '60%');
      
      expect(revision30).toBeDefined();
      expect(revision60).toBeDefined();
      expect(revision60!.createdAt > revision30!.createdAt).toBe(true);
    });

    it('should allow comparison between revisions', async () => {
      await projectManager.createProject(testProjectPath, {
        name: 'Comparison Test Project'
      });

      // Create baseline
      const rev1 = await projectManager.createMajorRevision(testProjectPath, {
        version: 'v1.0',
        description: 'Initial version'
      });

      await projectManager.addCable(testProjectPath, {
        tag: 'C-001',
        description: 'Original Description'
      });

      // Create second revision
      const rev2 = await projectManager.createMajorRevision(testProjectPath, {
        version: 'v2.0', 
        description: 'Modified version'
      });

      // Modify existing cable
      const cables = await projectManager.getCables(testProjectPath);
      await projectManager.updateCable(testProjectPath, cables[0].id!, {
        description: 'Modified Description'
      });

      // Add new cable
      await projectManager.addCable(testProjectPath, {
        tag: 'C-002',
        description: 'New Cable'
      });

      // Compare revisions
      const comparison = await projectManager.compareRevisions(testProjectPath, rev1.id, rev2.id);
      
      expect(comparison.changes.length).toBeGreaterThan(0);
      expect(comparison.changes.some(c => c.changeType === 'UPDATE')).toBe(true);
      expect(comparison.changes.some(c => c.changeType === 'INSERT')).toBe(true);
    });
  });

  describe('errorHandling', () => {
    it('should handle corrupted project files gracefully', async () => {
      // Create a corrupted file
      fs.writeFileSync(testProjectPath, 'This is not a valid SQLite file');

      await expect(projectManager.openProject(testProjectPath))
        .rejects
        .toThrow('Invalid or corrupted project file');
    });

    it('should handle non-existent files gracefully', async () => {
      const nonExistentPath = path.join(tempDir, 'does-not-exist.cfp');
      
      await expect(projectManager.openProject(nonExistentPath))
        .rejects
        .toThrow('Project file not found');
    });

    it('should handle duplicate tag entries', async () => {
      await projectManager.createProject(testProjectPath, {
        name: 'Duplicate Test Project'
      });

      await projectManager.addCable(testProjectPath, {
        tag: 'C-001',
        description: 'First Cable'
      });

      await expect(projectManager.addCable(testProjectPath, {
        tag: 'C-001',
        description: 'Duplicate Cable'
      })).rejects.toThrow('Cable tag C-001 already exists');
    });
  });

  describe('performance', () => {
    it('should handle large datasets efficiently', async () => {
      await projectManager.createProject(testProjectPath, {
        name: 'Performance Test Project'
      });

      const startTime = Date.now();
      
      // Add 1000 cables
      const cables: Partial<Cable>[] = [];
      for (let i = 1; i <= 1000; i++) {
        cables.push({
          tag: `C-${i.toString().padStart(3, '0')}`,
          description: `Test Cable ${i}`,
          function: i % 2 === 0 ? 'Power' : 'Signal',
          size: '14 AWG',
          length: 100 + (i % 200)
        });
      }

      // Batch insert for performance
      await projectManager.addCablesBatch(testProjectPath, cables);
      
      const insertTime = Date.now() - startTime;
      expect(insertTime).toBeLessThan(5000); // Should complete in under 5 seconds

      // Verify data was saved
      const loadedCables = await projectManager.getCables(testProjectPath);
      expect(loadedCables).toHaveLength(1000);
      
      const queryTime = Date.now() - startTime - insertTime;
      expect(queryTime).toBeLessThan(1000); // Query should be fast
    });
  });
});