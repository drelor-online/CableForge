/**
 * Database Service Tests
 * Following TDD methodology - write tests first, then implement functionality
 */

import { DatabaseService } from './database';
import { Cable, CableFunction } from '../types';

describe('DatabaseService', () => {
  let db: DatabaseService;

  beforeEach(async () => {
    // Create a fresh in-memory database for each test
    db = new DatabaseService();
    await db.initialize();
  });

  afterEach(async () => {
    await db.close();
  });

  describe('initialization', () => {
    test('should initialize database with correct schema', async () => {
      const tables = await db.getTables();
      expect(tables).toContain('projects');
      expect(tables).toContain('cables');
      expect(tables).toContain('io_points');
      expect(tables).toContain('conduits');
      expect(tables).toContain('loads');
      expect(tables).toContain('revisions');
    });

    test('should create default project on initialization', async () => {
      const projects = await db.getProjects();
      expect(projects).toHaveLength(1);
      expect(projects[0].name).toBe('New CableForge Project');
    });
  });

  describe('cable operations', () => {
    test('should create a new cable', async () => {
      const cable: Partial<Cable> = {
        tag: 'C-001',
        description: 'Test Cable',
        function: CableFunction.Signal,
        voltage: 24
      };

      const createdCable = await db.createCable(cable);
      
      expect(createdCable.id).toBeDefined();
      expect(createdCable.tag).toBe('C-001');
      expect(createdCable.description).toBe('Test Cable');
      expect(createdCable.function).toBe(CableFunction.Signal);
      expect(createdCable.createdAt).toBeInstanceOf(Date);
      expect(createdCable.updatedAt).toBeInstanceOf(Date);
    });

    test('should retrieve all cables', async () => {
      const cable1 = await db.createCable({ tag: 'C-001', description: 'Cable 1' });
      const cable2 = await db.createCable({ tag: 'C-002', description: 'Cable 2' });

      const cables = await db.getCables();
      
      expect(cables).toHaveLength(2);
      expect(cables.map(c => c.tag)).toContain('C-001');
      expect(cables.map(c => c.tag)).toContain('C-002');
    });

    test('should update an existing cable', async () => {
      const cable = await db.createCable({ tag: 'C-001', description: 'Original' });
      
      const updatedCable = await db.updateCable(cable.id!, { 
        description: 'Updated Description',
        voltage: 120 
      });

      expect(updatedCable.description).toBe('Updated Description');
      expect(updatedCable.voltage).toBe(120);
      expect(updatedCable.updatedAt.getTime()).toBeGreaterThan(cable.updatedAt.getTime());
    });

    test('should delete a cable', async () => {
      const cable = await db.createCable({ tag: 'C-001', description: 'To Delete' });
      
      await db.deleteCable(cable.id!);
      
      const cables = await db.getCables();
      expect(cables).toHaveLength(0);
    });

    test('should enforce unique cable tags within a project', async () => {
      await db.createCable({ tag: 'C-001', description: 'First' });
      
      await expect(
        db.createCable({ tag: 'C-001', description: 'Duplicate' })
      ).rejects.toThrow('Cable tag must be unique');
    });
  });

  describe('project file operations', () => {
    test('should export project as binary data', async () => {
      await db.createCable({ tag: 'C-001', description: 'Test Cable' });
      
      const binaryData = await db.exportProject();
      
      expect(binaryData).toBeInstanceOf(Uint8Array);
      expect(binaryData.length).toBeGreaterThan(0);
    });

    test('should import project from binary data', async () => {
      // Create initial data
      await db.createCable({ tag: 'C-001', description: 'Original Cable' });
      const exportedData = await db.exportProject();
      
      // Clear database and import
      await db.close();
      db = new DatabaseService();
      await db.initialize();
      await db.importProject(exportedData);
      
      const cables = await db.getCables();
      expect(cables).toHaveLength(1);
      expect(cables[0].tag).toBe('C-001');
      expect(cables[0].description).toBe('Original Cable');
    });

    test('should handle malformed project data gracefully', async () => {
      const invalidData = new Uint8Array([1, 2, 3, 4, 5]);
      
      await expect(
        db.importProject(invalidData)
      ).rejects.toThrow('Invalid project file format');
    });
  });

  describe('auto-numbering', () => {
    test('should generate next available cable tag', async () => {
      await db.createCable({ tag: 'C-001', description: 'First' });
      await db.createCable({ tag: 'C-002', description: 'Second' });
      
      const nextTag = await db.getNextCableTag();
      
      expect(nextTag).toBe('C-003');
    });

    test('should handle gaps in numbering', async () => {
      await db.createCable({ tag: 'C-001', description: 'First' });
      await db.createCable({ tag: 'C-005', description: 'Fifth' });
      
      const nextTag = await db.getNextCableTag();
      
      expect(nextTag).toBe('C-006');
    });

    test('should handle different prefixes', async () => {
      await db.createCable({ tag: 'PWR-001', description: 'Power Cable' });
      
      const nextTag = await db.getNextCableTag('PWR');
      
      expect(nextTag).toBe('PWR-002');
    });
  });

  describe('validation', () => {
    test('should require cable tag', async () => {
      await expect(
        db.createCable({ description: 'No Tag' })
      ).rejects.toThrow('Cable tag is required');
    });

    test('should validate cable tag format', async () => {
      await expect(
        db.createCable({ tag: '', description: 'Empty Tag' })
      ).rejects.toThrow('Cable tag is required');
    });

    test('should allow optional fields to be null', async () => {
      const cable = await db.createCable({ 
        tag: 'C-001',
        description: 'Minimal Cable'
      });
      
      expect(cable.voltage).toBeUndefined();
      expect(cable.size).toBeUndefined();
      expect(cable.fromEquipment).toBeUndefined();
    });
  });
});