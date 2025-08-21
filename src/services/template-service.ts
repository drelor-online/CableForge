import { ProjectTemplate, ProjectTemplateData, CableLibraryItem, Project, Cable, IOPoint, Load, Conduit, Tray, CableFunction, ConduitType, TrayType } from '../types';
import { TauriDatabaseService } from './tauri-database';

export interface CreateTemplateOptions {
  name: string;
  description?: string;
  category: ProjectTemplate['category'];
  version?: string;
  isPublic?: boolean;
  tags?: string[];
  includeData?: boolean;
  includeColumnPresets?: boolean;
}

export interface TemplateSearchOptions {
  category?: ProjectTemplate['category'];
  tags?: string[];
  searchTerm?: string;
  includeBuiltin?: boolean;
  sortBy?: 'name' | 'category' | 'usageCount' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

class TemplateService {
  private static instance: TemplateService;
  private dbService: TauriDatabaseService | null = null;

  public static getInstance(): TemplateService {
    if (!TemplateService.instance) {
      TemplateService.instance = new TemplateService();
    }
    return TemplateService.instance;
  }

  /**
   * Initialize the service with database connection
   */
  public initialize(dbService: TauriDatabaseService): void {
    this.dbService = dbService;
    this.createBuiltinTemplates();
  }

  /**
   * Get all available templates
   */
  public async getTemplates(options: TemplateSearchOptions = {}): Promise<ProjectTemplate[]> {
    if (!this.dbService) {
      throw new Error('Template service not initialized');
    }

    try {
      // For now, return empty array until Rust commands are implemented
      // TODO: Implement get_project_templates command
      return [];
    } catch (error) {
      console.error('Failed to get templates:', error);
      return [];
    }
  }

  /**
   * Get a specific template by ID
   */
  public async getTemplate(id: number): Promise<ProjectTemplate | null> {
    if (!this.dbService) {
      throw new Error('Template service not initialized');
    }

    try {
      // TODO: Implement get_project_template command
      return null;
    } catch (error) {
      console.error('Failed to get template:', error);
      return null;
    }
  }

  /**
   * Create a new template from current project
   */
  public async createTemplateFromProject(
    project: Project,
    projectData: {
      cables: Cable[];
      ioPoints: IOPoint[];
      loads: Load[];
      conduits: Conduit[];
      trays: Tray[];
    },
    options: CreateTemplateOptions
  ): Promise<ProjectTemplate> {
    if (!this.dbService) {
      throw new Error('Template service not initialized');
    }

    const templateData: ProjectTemplateData = {
      projectInfo: {
        name: project.name,
        description: project.description,
        client: project.client,
        location: project.location,
      },
      defaultSettings: {
        voltages: this.extractUniqueValues(projectData.cables, 'voltage').filter(Boolean) as number[],
        cableFunctions: this.extractUniqueValues(projectData.cables, 'function').filter(Boolean) as string[],
        conduitTypes: this.extractUniqueValues(projectData.conduits, 'type').filter(Boolean) as string[],
        trayTypes: this.extractUniqueValues(projectData.trays, 'type').filter(Boolean) as string[],
        defaultSparePercentage: 20,
        defaultVoltageDropLimit: 3,
      },
    };

    // Include sample data if requested
    if (options.includeData) {
      templateData.sampleData = {
        cables: projectData.cables.slice(0, 10).map(this.sanitizeForTemplate),
        ioPoints: projectData.ioPoints.slice(0, 20).map(this.sanitizeForTemplate),
        loads: projectData.loads.slice(0, 10).map(this.sanitizeForTemplate),
        conduits: projectData.conduits.slice(0, 5).map(this.sanitizeForTemplate),
        trays: projectData.trays.slice(0, 5).map(this.sanitizeForTemplate),
      };
    }

    const template: Omit<ProjectTemplate, 'id'> = {
      name: options.name,
      description: options.description,
      category: options.category,
      version: options.version || '1.0',
      createdBy: 'User', // TODO: Get from user settings
      isPublic: options.isPublic || false,
      isBuiltin: false,
      templateData,
      tags: options.tags,
      usageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      // TODO: Implement create_project_template command
      // const createdTemplate = await this.dbService.createProjectTemplate(template);
      // return createdTemplate;
      
      // For now, return the template with a mock ID
      return { ...template, id: Date.now() };
    } catch (error) {
      console.error('Failed to create template:', error);
      throw error;
    }
  }

  /**
   * Create a new project from template
   */
  public async createProjectFromTemplate(template: ProjectTemplate, projectName: string): Promise<{
    project: Partial<Project>;
    data: ProjectTemplateData['sampleData'];
  }> {
    if (!this.dbService) {
      throw new Error('Template service not initialized');
    }

    const project: Partial<Project> = {
      name: projectName,
      description: template.templateData.projectInfo.description,
      client: template.templateData.projectInfo.client,
      location: template.templateData.projectInfo.location,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Increment usage count
    await this.incrementUsageCount(template.id!);

    return {
      project,
      data: template.templateData.sampleData,
    };
  }

  /**
   * Update a template
   */
  public async updateTemplate(id: number, updates: Partial<ProjectTemplate>): Promise<ProjectTemplate> {
    if (!this.dbService) {
      throw new Error('Template service not initialized');
    }

    try {
      // TODO: Implement update_project_template command
      // return await this.dbService.updateProjectTemplate(id, updates);
      throw new Error('Not implemented');
    } catch (error) {
      console.error('Failed to update template:', error);
      throw error;
    }
  }

  /**
   * Delete a template
   */
  public async deleteTemplate(id: number): Promise<void> {
    if (!this.dbService) {
      throw new Error('Template service not initialized');
    }

    try {
      // TODO: Implement delete_project_template command
      // await this.dbService.deleteProjectTemplate(id);
    } catch (error) {
      console.error('Failed to delete template:', error);
      throw error;
    }
  }

  /**
   * Get cable library items
   */
  public async getCableLibrary(category?: CableLibraryItem['category']): Promise<CableLibraryItem[]> {
    if (!this.dbService) {
      throw new Error('Template service not initialized');
    }

    try {
      // TODO: Implement get_cable_library command
      return [];
    } catch (error) {
      console.error('Failed to get cable library:', error);
      return [];
    }
  }

  /**
   * Add cable to library
   */
  public async addCableToLibrary(cable: Omit<CableLibraryItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<CableLibraryItem> {
    if (!this.dbService) {
      throw new Error('Template service not initialized');
    }

    try {
      // TODO: Implement add_cable_library_item command
      const libraryItem: CableLibraryItem = {
        ...cable,
        id: Date.now(),
        created_at: new Date(),
        updated_at: new Date(),
      };
      return libraryItem;
    } catch (error) {
      console.error('Failed to add cable to library:', error);
      throw error;
    }
  }

  /**
   * Private helper methods
   */
  private async incrementUsageCount(templateId: number): Promise<void> {
    try {
      // TODO: Implement increment_template_usage command
    } catch (error) {
      console.error('Failed to increment usage count:', error);
    }
  }

  private extractUniqueValues<T>(array: T[], field: keyof T): Array<T[keyof T]> {
    const values = array.map(item => item[field]).filter(value => value != null);
    return Array.from(new Set(values));
  }

  private sanitizeForTemplate<T extends Record<string, any>>(obj: T): Partial<T> {
    const sanitized = { ...obj };
    delete sanitized.id;
    delete sanitized.projectId;
    delete sanitized.revisionId;
    delete sanitized.createdAt;
    delete sanitized.updatedAt;
    return sanitized;
  }

  /**
   * Create built-in templates
   */
  private async createBuiltinTemplates(): Promise<void> {
    try {
      // Create default templates for common project types
      const builtinTemplates = [
        this.createOilGasTemplate(),
        this.createPowerTemplate(),
        this.createIndustrialTemplate(),
        this.createMarineTemplate(),
      ];

      // TODO: Check if built-in templates already exist and create if needed
      console.log('Built-in templates ready to be created:', builtinTemplates.length);
    } catch (error) {
      console.error('Failed to create built-in templates:', error);
    }
  }

  private createOilGasTemplate(): Omit<ProjectTemplate, 'id'> {
    return {
      name: 'Oil & Gas Facility',
      description: 'Standard template for oil and gas processing facilities',
      category: 'Oil & Gas',
      version: '1.0',
      createdBy: 'System',
      isPublic: true,
      isBuiltin: true,
      templateData: {
        projectInfo: {
          name: 'New Oil & Gas Project',
          description: 'Oil and gas processing facility electrical design',
        },
        defaultSettings: {
          voltages: [120, 240, 480, 4160, 13800],
          cableFunctions: ['Power', 'Control', 'Instrumentation', 'Communication', 'Lighting'],
          conduitTypes: ['Rigid Steel', 'EMT', 'PVC', 'HDPE', 'Flexible'],
          trayTypes: ['Ladder', 'Solid Bottom', 'Perforated', 'Wire Mesh'],
          defaultSparePercentage: 25,
          defaultVoltageDropLimit: 3,
        },
        sampleData: {
          cables: [
            { tag: 'PWR-001', description: 'Main Power Feeder', function: CableFunction.Power, voltage: 4160, cableType: 'XLPE', size: '500 MCM' },
            { tag: 'CTL-001', description: 'Pump Control Cable', function: CableFunction.Control, voltage: 120, cableType: 'THWN', size: '12 AWG' },
          ],
          loads: [
            { tag: 'P-001', description: 'Main Process Pump', loadType: 'Motor', powerKw: 500, voltage: 4160 },
            { tag: 'FAN-001', description: 'Cooling Fan', loadType: 'Motor', powerKw: 25, voltage: 480 },
          ],
          conduits: [
            { tag: 'C-001', type: ConduitType.RigidSteel, size: '4"', maxFillPercentage: 40 },
          ],
          trays: [
            { tag: 'T-001', type: TrayType.Ladder, width: 24, height: 4, maxFillPercentage: 50 },
          ],
          ioPoints: [],
        },
      },
      tags: ['oil', 'gas', 'processing', 'facility'],
      usageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private createPowerTemplate(): Omit<ProjectTemplate, 'id'> {
    return {
      name: 'Power Distribution',
      description: 'Standard template for power distribution systems',
      category: 'Power',
      version: '1.0',
      createdBy: 'System',
      isPublic: true,
      isBuiltin: true,
      templateData: {
        projectInfo: {
          name: 'New Power Distribution Project',
          description: 'Electrical power distribution system design',
        },
        defaultSettings: {
          voltages: [120, 208, 240, 277, 480, 4160, 13800],
          cableFunctions: ['Power', 'Control', 'Metering', 'Protection'],
          conduitTypes: ['EMT', 'Rigid Steel', 'PVC', 'Aluminum'],
          trayTypes: ['Ladder', 'Solid Bottom', 'Perforated'],
          defaultSparePercentage: 20,
          defaultVoltageDropLimit: 3,
        },
      },
      tags: ['power', 'distribution', 'electrical'],
      usageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private createIndustrialTemplate(): Omit<ProjectTemplate, 'id'> {
    return {
      name: 'Industrial Plant',
      description: 'Template for general industrial plant electrical systems',
      category: 'Industrial',
      version: '1.0',
      createdBy: 'System',
      isPublic: true,
      isBuiltin: true,
      templateData: {
        projectInfo: {
          name: 'New Industrial Project',
          description: 'Industrial plant electrical system design',
        },
        defaultSettings: {
          voltages: [120, 240, 480, 4160],
          cableFunctions: ['Power', 'Control', 'Instrumentation', 'Communication', 'Safety'],
          conduitTypes: ['EMT', 'Rigid Steel', 'Flexible', 'PVC'],
          trayTypes: ['Ladder', 'Solid Bottom', 'Wire Mesh'],
          defaultSparePercentage: 20,
          defaultVoltageDropLimit: 5,
        },
      },
      tags: ['industrial', 'manufacturing', 'plant'],
      usageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private createMarineTemplate(): Omit<ProjectTemplate, 'id'> {
    return {
      name: 'Marine Vessel',
      description: 'Template for marine vessel electrical systems',
      category: 'Marine',
      version: '1.0',
      createdBy: 'System',
      isPublic: true,
      isBuiltin: true,
      templateData: {
        projectInfo: {
          name: 'New Marine Project',
          description: 'Marine vessel electrical system design',
        },
        defaultSettings: {
          voltages: [24, 120, 240, 440, 480],
          cableFunctions: ['Power', 'Control', 'Navigation', 'Communication', 'Emergency'],
          conduitTypes: ['Marine EMT', 'Flexible', 'Liquid Tight'],
          trayTypes: ['Perforated', 'Solid Bottom', 'Ladder'],
          defaultSparePercentage: 30,
          defaultVoltageDropLimit: 5,
        },
      },
      tags: ['marine', 'vessel', 'ship', 'offshore'],
      usageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

export const templateService = TemplateService.getInstance();