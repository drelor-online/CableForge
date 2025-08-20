/**
 * IndexedDB Database Service - Browser-Native Implementation
 * Uses Dexie.js for simplified IndexedDB operations
 */

import Dexie, { Table } from 'dexie';
import { Cable, CableFunction, Project } from '../types';

// IndexedDB schema interfaces
interface DBProject {
  id?: number;
  name: string;
  description?: string;
  majorRevision: string;
  minorRevision: number;
  createdAt: Date;
  updatedAt: Date;
}

interface DBCable {
  id?: number;
  projectId: number;
  revisionId: number;
  tag: string;
  description?: string;
  function?: CableFunction;
  voltage?: number;
  size?: string;
  cores?: number;
  fromEquipment?: string;
  toEquipment?: string;
  length?: number;
  sparePercentage?: number;
  route?: string;
  voltageDropPercentage?: number;
  segregationWarning?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface DBRevision {
  id?: number;
  projectId: number;
  majorRevision: string;
  minorRevision: number;
  description?: string;
  createdAt: Date;
}

class CableForgeDB extends Dexie {
  projects!: Table<DBProject>;
  revisions!: Table<DBRevision>;
  cables!: Table<DBCable>;

  constructor() {
    super('CableForgeDB');
    
    this.version(1).stores({
      projects: '++id, name, createdAt',
      revisions: '++id, projectId, [projectId+majorRevision+minorRevision]',
      cables: '++id, projectId, revisionId, tag, [projectId+tag]'
    });
  }
}

export class IndexedDBService {
  private db: CableForgeDB;
  private currentProjectId = 1;
  private currentRevisionId = 1;

  constructor() {
    this.db = new CableForgeDB();
  }

  async initialize(): Promise<void> {
    await this.db.open();
    
    // Create default project if none exists
    const projectCount = await this.db.projects.count();
    if (projectCount === 0) {
      await this.createDefaultProject();
    }
  }

  async close(): Promise<void> {
    this.db.close();
  }

  private async createDefaultProject(): Promise<void> {
    const now = new Date();
    
    const projectId = await this.db.projects.add({
      name: 'New CableForge Project',
      description: 'Created with CableForge',
      majorRevision: 'Draft',
      minorRevision: 0,
      createdAt: now,
      updatedAt: now
    });

    const revisionId = await this.db.revisions.add({
      projectId: projectId as number,
      majorRevision: 'Draft',
      minorRevision: 0,
      description: 'Initial revision',
      createdAt: now
    });

    this.currentProjectId = projectId as number;
    this.currentRevisionId = revisionId as number;
  }

  async getTables(): Promise<string[]> {
    // Return table names for compatibility with tests
    return ['projects', 'cables', 'revisions'];
  }

  async getProjects(): Promise<Project[]> {
    const projects = await this.db.projects.toArray();
    return projects.map(p => ({
      id: p.id!,
      name: p.name,
      description: p.description,
      majorRevision: p.majorRevision,
      minorRevision: p.minorRevision,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt
    }));
  }

  async createCable(cableData: Partial<Cable>): Promise<Cable> {
    // Validation
    if (!cableData.tag || cableData.tag.trim() === '') {
      throw new Error('Cable tag is required');
    }

    // Check for duplicate tags
    const existingCable = await this.db.cables
      .where('[projectId+tag]')
      .equals([this.currentProjectId, cableData.tag])
      .first();

    if (existingCable) {
      throw new Error('Cable tag must be unique');
    }

    const now = new Date();
    const cableToCreate: DBCable = {
      projectId: this.currentProjectId,
      revisionId: this.currentRevisionId,
      tag: cableData.tag,
      description: cableData.description,
      function: cableData.function,
      voltage: cableData.voltage,
      size: cableData.size,
      cores: cableData.cores,
      fromEquipment: cableData.fromEquipment,
      toEquipment: cableData.toEquipment,
      length: cableData.length,
      sparePercentage: cableData.sparePercentage,
      route: cableData.route,
      voltageDropPercentage: cableData.voltageDropPercentage,
      segregationWarning: cableData.segregationWarning || false,
      createdAt: now,
      updatedAt: now
    };

    const id = await this.db.cables.add(cableToCreate);
    return this.getCableById(id as number);
  }

  async getCables(): Promise<Cable[]> {
    const cables = await this.db.cables
      .where('projectId')
      .equals(this.currentProjectId)
      .toArray();

    return cables.map(c => this.mapDBCableToCable(c));
  }

  private async getCableById(id: number): Promise<Cable> {
    const cable = await this.db.cables.get(id);
    if (!cable) {
      throw new Error('Cable not found');
    }
    return this.mapDBCableToCable(cable);
  }

  private mapDBCableToCable(dbCable: DBCable): Cable {
    return {
      id: dbCable.id!,
      tag: dbCable.tag,
      description: dbCable.description,
      function: dbCable.function,
      voltage: dbCable.voltage,
      size: dbCable.size,
      cores: dbCable.cores,
      fromEquipment: dbCable.fromEquipment,
      toEquipment: dbCable.toEquipment,
      length: dbCable.length,
      sparePercentage: dbCable.sparePercentage,
      route: dbCable.route,
      voltageDropPercentage: dbCable.voltageDropPercentage,
      segregationWarning: dbCable.segregationWarning || false,
      createdAt: dbCable.createdAt,
      updatedAt: dbCable.updatedAt,
      revisionId: dbCable.revisionId
    };
  }

  async updateCable(id: number, updates: Partial<Cable>): Promise<Cable> {
    const now = new Date();
    
    const updateData: Partial<DBCable> = {
      ...updates,
      updatedAt: now
    };

    const updated = await this.db.cables.update(id, updateData);
    if (!updated) {
      throw new Error('Cable not found');
    }

    return this.getCableById(id);
  }

  async deleteCable(id: number): Promise<void> {
    await this.db.cables.delete(id);
  }

  async getNextCableTag(prefix: string = 'C'): Promise<string> {
    const cables = await this.db.cables
      .where('projectId')
      .equals(this.currentProjectId)
      .and(cable => cable.tag.startsWith(prefix + '-'))
      .toArray();

    if (cables.length === 0) {
      return `${prefix}-001`;
    }

    // Extract numbers and find the highest
    const numbers = cables
      .map(cable => {
        const match = cable.tag.match(new RegExp(`^${prefix}-(\\d+)$`));
        return match ? parseInt(match[1]) : 0;
      })
      .filter(num => num > 0);

    const nextNumber = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
    return `${prefix}-${nextNumber.toString().padStart(3, '0')}`;
  }

  async exportProject(): Promise<Uint8Array> {
    // Export all project data as JSON
    const projectData = {
      projects: await this.db.projects.toArray(),
      revisions: await this.db.revisions.toArray(),
      cables: await this.db.cables.toArray(),
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };

    const jsonString = JSON.stringify(projectData, null, 2);
    return new TextEncoder().encode(jsonString);
  }

  async importProject(data: Uint8Array): Promise<void> {
    try {
      const jsonString = new TextDecoder().decode(data);
      const projectData = JSON.parse(jsonString);

      // Validate the data structure
      if (!projectData.projects || !projectData.cables || !projectData.revisions) {
        throw new Error('Invalid project file format');
      }

      // Clear existing data and import new data
      await this.db.transaction('rw', this.db.projects, this.db.revisions, this.db.cables, async () => {
        await this.db.projects.clear();
        await this.db.revisions.clear();
        await this.db.cables.clear();

        // Convert date strings back to Date objects
        const projects = projectData.projects.map((p: any) => ({
          ...p,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt)
        }));

        const revisions = projectData.revisions.map((r: any) => ({
          ...r,
          createdAt: new Date(r.createdAt)
        }));

        const cables = projectData.cables.map((c: any) => ({
          ...c,
          createdAt: new Date(c.createdAt),
          updatedAt: new Date(c.updatedAt)
        }));

        await this.db.projects.bulkAdd(projects);
        await this.db.revisions.bulkAdd(revisions);
        await this.db.cables.bulkAdd(cables);

        // Update current IDs
        if (projects.length > 0) {
          this.currentProjectId = projects[0].id;
        }
        if (revisions.length > 0) {
          this.currentRevisionId = revisions[0].id;
        }
      });
    } catch (error) {
      throw new Error('Invalid project file format');
    }
  }
}