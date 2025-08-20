/**
 * Tauri Database Service - Desktop Native Implementation
 * Uses Tauri IPC commands to communicate with Rust SQLite backend
 */

import { invoke } from '@tauri-apps/api/core';
import { Cable, Project, IOPoint, PLCCard, IOType, SignalType } from '../types';

export interface TauriCable {
  id?: number;
  project_id: number;
  revision_id: number;
  tag: string;
  description?: string;
  function?: string;
  voltage?: number;
  cable_type?: string;
  size?: string;
  cores?: number;
  segregation_class?: string;
  from_location?: string;
  from_equipment?: string;
  to_location?: string;
  to_equipment?: string;
  length?: number;
  spare_percentage?: number;
  calculated_length?: number;
  route?: string;
  manufacturer?: string;
  part_number?: string;
  outer_diameter?: number;
  voltage_drop_percentage?: number;
  segregation_warning: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface TauriProject {
  id?: number;
  name: string;
  description?: string;
  client?: string;
  engineer?: string;
  major_revision: string;
  minor_revision: number;
  created_at: string;
  updated_at: string;
}

export interface NewCableData {
  tag: string;
  description?: string;
  function?: string;
  voltage?: number;
  cable_type?: string;
  size?: string;
  cores?: number;
  segregation_class?: string;
  from_location?: string;
  from_equipment?: string;
  to_location?: string;
  to_equipment?: string;
  length?: number;
  spare_percentage?: number;
  route?: string;
  manufacturer?: string;
  part_number?: string;
  outer_diameter?: number;
  notes?: string;
}

export interface UpdateCableData {
  tag?: string;
  description?: string;
  function?: string;
  voltage?: number;
  cable_type?: string;
  size?: string;
  cores?: number;
  segregation_class?: string;
  from_location?: string;
  from_equipment?: string;
  to_location?: string;
  to_equipment?: string;
  length?: number;
  spare_percentage?: number;
  route?: string;
  manufacturer?: string;
  part_number?: string;
  outer_diameter?: number;
  voltage_drop_percentage?: number;
  segregation_warning?: boolean;
  notes?: string;
}

export interface TauriIOPoint {
  id?: number;
  project_id: number;
  revision_id: number;
  tag: string;
  description?: string;
  signal_type?: string;
  io_type?: string;
  plc_name?: string;
  rack?: number;
  slot?: number;
  channel?: number;
  terminal_block?: string;
  cable_id?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface NewIOPointData {
  tag: string;
  description?: string;
  signal_type?: string;
  io_type?: string;
  plc_name?: string;
  rack?: number;
  slot?: number;
  channel?: number;
  terminal_block?: string;
  cable_id?: number;
  notes?: string;
}

export interface UpdateIOPointData {
  tag?: string;
  description?: string;
  signal_type?: string;
  io_type?: string;
  plc_name?: string;
  rack?: number;
  slot?: number;
  channel?: number;
  terminal_block?: string;
  cable_id?: number;
  notes?: string;
}

export interface TauriPLCCard {
  id?: number;
  project_id: number;
  revision_id: number;
  name: string;
  plc_name: string;
  rack: number;
  slot: number;
  card_type: string;
  io_type: string;
  total_channels: number;
  signal_type?: string;
  used_channels: number;
  available_channels: number;
  manufacturer?: string;
  part_number?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface NewPLCCardData {
  name: string;
  plc_name: string;
  rack: number;
  slot: number;
  card_type: string;
  io_type: string;
  total_channels: number;
  signal_type?: string;
  manufacturer?: string;
  part_number?: string;
  notes?: string;
}

export interface UpdatePLCCardData {
  name?: string;
  plc_name?: string;
  rack?: number;
  slot?: number;
  card_type?: string;
  io_type?: string;
  total_channels?: number;
  signal_type?: string;
  used_channels?: number;
  available_channels?: number;
  manufacturer?: string;
  part_number?: string;
  notes?: string;
}

export class TauriDatabaseService {
  private static instance: TauriDatabaseService;
  private initialized = false;
  
  // Mock data storage for development (until Rust backend implements these)
  private mockIOPoints: IOPoint[] = [];
  private mockPLCCards: PLCCard[] = [];
  private nextIOPointId = 1;
  private nextPLCCardId = 1;

  static getInstance(): TauriDatabaseService {
    if (!TauriDatabaseService.instance) {
      TauriDatabaseService.instance = new TauriDatabaseService();
    }
    return TauriDatabaseService.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('TauriDatabaseService: Already initialized');
      return;
    }

    console.log('TauriDatabaseService: Calling initialize_app command');
    try {
      const result = await invoke('initialize_app');
      console.log('TauriDatabaseService: initialize_app result:', result);
      this.initialized = true;
      console.log('TauriDatabaseService: Initialized successfully');
    } catch (error) {
      console.error('TauriDatabaseService: initialize_app error:', error);
      throw new Error(`Failed to initialize database: ${error}`);
    }
  }

  async close(): Promise<void> {
    // Tauri handles cleanup automatically
    this.initialized = false;
  }

  // Project operations
  async createProject(name: string, description?: string): Promise<Project> {
    try {
      const tauriProject: TauriProject = await invoke('create_project', {
        name,
        description,
      });
      return this.mapTauriProjectToProject(tauriProject);
    } catch (error) {
      throw new Error(`Failed to create project: ${error}`);
    }
  }

  async openProject(filePath: string): Promise<Project> {
    try {
      const tauriProject: TauriProject = await invoke('open_project', {
        filePath,
      });
      return this.mapTauriProjectToProject(tauriProject);
    } catch (error) {
      throw new Error(`Failed to open project: ${error}`);
    }
  }

  async saveProject(filePath?: string): Promise<string> {
    try {
      const savedPath: string = await invoke('save_project', {
        filePath,
      });
      return savedPath;
    } catch (error) {
      throw new Error(`Failed to save project: ${error}`);
    }
  }

  async getProjects(): Promise<Project[]> {
    try {
      const tauriProjects: TauriProject[] = await invoke('get_projects');
      return tauriProjects.map(p => this.mapTauriProjectToProject(p));
    } catch (error) {
      throw new Error(`Failed to get projects: ${error}`);
    }
  }

  // Cable operations
  async createCable(cableData: Partial<Cable>): Promise<Cable> {
    if (!cableData.tag || cableData.tag.trim() === '') {
      throw new Error('Cable tag is required');
    }

    try {
      const newCableData: NewCableData = {
        tag: cableData.tag,
        description: cableData.description,
        function: cableData.function,
        voltage: cableData.voltage,
        cable_type: cableData.cableType,
        size: cableData.size,
        cores: cableData.cores,
        segregation_class: cableData.segregationClass,
        from_location: cableData.fromLocation,
        from_equipment: cableData.fromEquipment,
        to_location: cableData.toLocation,
        to_equipment: cableData.toEquipment,
        length: cableData.length,
        spare_percentage: cableData.sparePercentage,
        route: cableData.route,
        manufacturer: cableData.manufacturer,
        part_number: cableData.partNumber,
        outer_diameter: cableData.outerDiameter,
        notes: cableData.notes,
      };

      const tauriCable: TauriCable = await invoke('create_cable', {
        cableData: newCableData,
      });
      
      return this.mapTauriCableToCable(tauriCable);
    } catch (error) {
      throw new Error(`Failed to create cable: ${error}`);
    }
  }

  async getCables(): Promise<Cable[]> {
    console.log('TauriDatabaseService: Calling get_cables command');
    try {
      const tauriCables: TauriCable[] = await invoke('get_cables');
      console.log('TauriDatabaseService: get_cables returned:', tauriCables);
      const mappedCables = tauriCables.map(c => this.mapTauriCableToCable(c));
      console.log('TauriDatabaseService: mapped cables:', mappedCables);
      return mappedCables;
    } catch (error) {
      console.error('TauriDatabaseService: get_cables error:', error);
      throw new Error(`Failed to get cables: ${error}`);
    }
  }

  async updateCable(id: number, updates: Partial<Cable>): Promise<Cable> {
    try {
      const updateData: UpdateCableData = {
        tag: updates.tag,
        description: updates.description,
        function: updates.function,
        voltage: updates.voltage,
        cable_type: updates.cableType,
        size: updates.size,
        cores: updates.cores,
        segregation_class: updates.segregationClass,
        from_location: updates.fromLocation,
        from_equipment: updates.fromEquipment,
        to_location: updates.toLocation,
        to_equipment: updates.toEquipment,
        length: updates.length,
        spare_percentage: updates.sparePercentage,
        route: updates.route,
        manufacturer: updates.manufacturer,
        part_number: updates.partNumber,
        outer_diameter: updates.outerDiameter,
        voltage_drop_percentage: updates.voltageDropPercentage,
        segregation_warning: updates.segregationWarning,
        notes: updates.notes,
      };

      const tauriCable: TauriCable = await invoke('update_cable', {
        id,
        updates: updateData,
      });
      
      return this.mapTauriCableToCable(tauriCable);
    } catch (error) {
      throw new Error(`Failed to update cable: ${error}`);
    }
  }

  async deleteCable(id: number): Promise<void> {
    try {
      await invoke('delete_cable', { id });
    } catch (error) {
      throw new Error(`Failed to delete cable: ${error}`);
    }
  }

  async getNextCableTag(prefix = 'C'): Promise<string> {
    try {
      const nextTag: string = await invoke('get_next_cable_tag', { prefix });
      return nextTag;
    } catch (error) {
      throw new Error(`Failed to get next cable tag: ${error}`);
    }
  }

  // Additional project operations
  async newProject(name?: string): Promise<Project> {
    try {
      const tauriProject: TauriProject = await invoke('new_project', { name });
      return this.mapTauriProjectToProject(tauriProject);
    } catch (error) {
      throw new Error(`Failed to create new project: ${error}`);
    }
  }

  async saveProjectAs(filePath: string): Promise<string> {
    try {
      const savedPath: string = await invoke('save_project_as', { filePath });
      return savedPath;
    } catch (error) {
      throw new Error(`Failed to save project as: ${error}`);
    }
  }

  async getCurrentProjectInfo(): Promise<{ project: Project; filePath?: string } | null> {
    try {
      const result: [TauriProject, string | null] | null = await invoke('get_current_project_info');
      if (result) {
        const [tauriProject, filePath] = result;
        return {
          project: this.mapTauriProjectToProject(tauriProject),
          filePath: filePath || undefined,
        };
      }
      return null;
    } catch (error) {
      throw new Error(`Failed to get current project info: ${error}`);
    }
  }

  // File dialog operations
  async showOpenDialog(): Promise<string | null> {
    try {
      const result: string | null = await invoke('show_open_dialog');
      return result;
    } catch (error) {
      throw new Error(`Failed to show open dialog: ${error}`);
    }
  }

  async showSaveDialog(defaultName?: string): Promise<string | null> {
    try {
      const result: string | null = await invoke('show_save_dialog', { defaultName });
      return result;
    } catch (error) {
      throw new Error(`Failed to show save dialog: ${error}`);
    }
  }

  // Export/Import operations (placeholder)
  async exportProject(): Promise<Uint8Array> {
    throw new Error('Export not yet implemented for Tauri backend');
  }

  async importProject(data: Uint8Array): Promise<void> {
    throw new Error('Import not yet implemented for Tauri backend');
  }

  // I/O Point operations (mock implementation for development)
  async getIOPoints(): Promise<IOPoint[]> {
    try {
      // Try to call Rust backend first
      const result: TauriIOPoint[] = await invoke('get_io_points');
      return result.map(tauriIO => this.mapTauriIOPointToIOPoint(tauriIO));
    } catch (error) {
      // Fall back to mock data for development
      console.log('Using mock I/O points data for development');
      return [...this.mockIOPoints];
    }
  }

  async createIOPoint(data: Partial<IOPoint>): Promise<IOPoint> {
    try {
      // Try to call Rust backend first
      const completeData: Omit<IOPoint, 'id' | 'createdAt' | 'updatedAt'> = {
        tag: data.tag || `IO-${Date.now()}`,
        revisionId: 1,
        description: data.description,
        signalType: data.signalType,
        ioType: data.ioType || IOType.DI,
        plcName: data.plcName,
        rack: data.rack,
        slot: data.slot,
        channel: data.channel,
        terminalBlock: data.terminalBlock,
        cableId: data.cableId,
        notes: data.notes,
      };
      const tauriData = this.mapIOPointToTauriIOPointData(completeData);
      const result: TauriIOPoint = await invoke('create_io_point', { data: tauriData });
      return this.mapTauriIOPointToIOPoint(result);
    } catch (error) {
      // Fall back to mock implementation for development
      console.log('Using mock I/O point creation for development');
      const now = new Date();
      const newIOPoint: IOPoint = {
        id: this.nextIOPointId++,
        tag: data.tag || `IO-${this.nextIOPointId.toString().padStart(3, '0')}`,
        revisionId: 1,
        description: data.description,
        signalType: data.signalType,
        ioType: data.ioType,
        plcName: data.plcName,
        rack: data.rack,
        slot: data.slot,
        channel: data.channel,
        terminalBlock: data.terminalBlock,
        cableId: data.cableId,
        notes: data.notes,
        createdAt: now,
        updatedAt: now
      };
      this.mockIOPoints.push(newIOPoint);
      return newIOPoint;
    }
  }

  async updateIOPoint(id: number, updates: Partial<IOPoint>): Promise<IOPoint> {
    try {
      // Try to call Rust backend first
      const tauriData = this.mapPartialIOPointToTauriIOPointData(updates);
      const result: TauriIOPoint = await invoke('update_io_point', { id, data: tauriData });
      return this.mapTauriIOPointToIOPoint(result);
    } catch (error) {
      // Fall back to mock implementation for development
      console.log('Using mock I/O point update for development');
      const index = this.mockIOPoints.findIndex(io => io.id === id);
      if (index === -1) {
        throw new Error(`I/O point with id ${id} not found`);
      }
      
      const now = new Date();
      this.mockIOPoints[index] = {
        ...this.mockIOPoints[index],
        ...updates,
        updatedAt: now
      };
      return this.mockIOPoints[index];
    }
  }

  async deleteIOPoint(id: number): Promise<void> {
    try {
      // Try to call Rust backend first
      await invoke('delete_io_point', { id });
    } catch (error) {
      // Fall back to mock implementation for development
      console.log('Using mock I/O point deletion for development');
      const index = this.mockIOPoints.findIndex(io => io.id === id);
      if (index === -1) {
        throw new Error(`I/O point with id ${id} not found`);
      }
      this.mockIOPoints.splice(index, 1);
    }
  }

  // PLC Card operations (mock implementation for development)
  async getPLCCards(): Promise<PLCCard[]> {
    try {
      // Try to call Rust backend first
      const result: TauriPLCCard[] = await invoke('get_plc_cards');
      return result.map(tauriCard => this.mapTauriPLCCardToPLCCard(tauriCard));
    } catch (error) {
      // Fall back to mock data for development
      console.log('Using mock PLC cards data for development');
      return [...this.mockPLCCards];
    }
  }

  async createPLCCard(data: Partial<PLCCard>): Promise<PLCCard> {
    try {
      // Try to call Rust backend first
      const completeData: Omit<PLCCard, 'id' | 'createdAt' | 'updatedAt'> = {
        name: data.name || `Card-${Date.now()}`,
        revisionId: 1,
        plcName: data.plcName || 'PLC-1',
        rack: data.rack || 1,
        slot: data.slot || 1,
        cardType: data.cardType || 'Generic',
        ioType: data.ioType || IOType.DI,
        totalChannels: data.totalChannels || 16,
        signalType: data.signalType,
        usedChannels: data.usedChannels || 0,
        availableChannels: data.availableChannels || (data.totalChannels || 16),
        manufacturer: data.manufacturer,
        partNumber: data.partNumber,
        notes: data.notes,
      };
      const tauriData = this.mapPLCCardToTauriPLCCardData(completeData);
      const result: TauriPLCCard = await invoke('create_plc_card', { data: tauriData });
      return this.mapTauriPLCCardToPLCCard(result);
    } catch (error) {
      // Fall back to mock implementation for development
      console.log('Using mock PLC card creation for development');
      const now = new Date();
      const newPLCCard: PLCCard = {
        id: this.nextPLCCardId++,
        name: data.name || `Card-${this.nextPLCCardId}`,
        revisionId: 1,
        plcName: data.plcName || 'PLC-1',
        rack: data.rack || 1,
        slot: data.slot || 1,
        cardType: data.cardType || 'Generic',
        ioType: data.ioType || IOType.DI,
        totalChannels: data.totalChannels || 16,
        signalType: data.signalType,
        usedChannels: 0,
        availableChannels: data.totalChannels || 16,
        manufacturer: data.manufacturer,
        partNumber: data.partNumber,
        notes: data.notes,
        createdAt: now,
        updatedAt: now
      };
      this.mockPLCCards.push(newPLCCard);
      return newPLCCard;
    }
  }

  async updatePLCCard(id: number, updates: Partial<PLCCard>): Promise<PLCCard> {
    try {
      // Try to call Rust backend first
      const tauriData = this.mapPartialPLCCardToTauriPLCCardData(updates);
      const result: TauriPLCCard = await invoke('update_plc_card', { id, data: tauriData });
      return this.mapTauriPLCCardToPLCCard(result);
    } catch (error) {
      // Fall back to mock implementation for development
      console.log('Using mock PLC card update for development');
      const index = this.mockPLCCards.findIndex(card => card.id === id);
      if (index === -1) {
        throw new Error(`PLC card with id ${id} not found`);
      }
      
      const now = new Date();
      this.mockPLCCards[index] = {
        ...this.mockPLCCards[index],
        ...updates,
        updatedAt: now
      };
      return this.mockPLCCards[index];
    }
  }

  async deletePLCCard(id: number): Promise<void> {
    try {
      // Try to call Rust backend first
      await invoke('delete_plc_card', { id });
    } catch (error) {
      // Fall back to mock implementation for development
      console.log('Using mock PLC card deletion for development');
      const index = this.mockPLCCards.findIndex(card => card.id === id);
      if (index === -1) {
        throw new Error(`PLC card with id ${id} not found`);
      }
      this.mockPLCCards.splice(index, 1);
    }
  }

  // I/O Point mapping functions
  private mapTauriIOPointToIOPoint(tauriIO: TauriIOPoint): IOPoint {
    return {
      id: tauriIO.id,
      tag: tauriIO.tag,
      revisionId: tauriIO.revision_id,
      description: tauriIO.description,
      signalType: tauriIO.signal_type as SignalType,
      ioType: tauriIO.io_type as IOType,
      plcName: tauriIO.plc_name,
      rack: tauriIO.rack,
      slot: tauriIO.slot,
      channel: tauriIO.channel,
      terminalBlock: tauriIO.terminal_block,
      cableId: tauriIO.cable_id,
      notes: tauriIO.notes,
      createdAt: new Date(tauriIO.created_at),
      updatedAt: new Date(tauriIO.updated_at),
    };
  }

  private mapIOPointToTauriIOPointData(ioPoint: Omit<IOPoint, 'id' | 'createdAt' | 'updatedAt'>): Omit<TauriIOPoint, 'id' | 'project_id' | 'revision_id' | 'created_at' | 'updated_at'> {
    return {
      tag: ioPoint.tag,
      description: ioPoint.description,
      io_type: ioPoint.ioType,
      signal_type: ioPoint.signalType,
      plc_name: ioPoint.plcName,
      rack: ioPoint.rack,
      slot: ioPoint.slot,
      channel: ioPoint.channel,
      terminal_block: ioPoint.terminalBlock,
      cable_id: ioPoint.cableId,
      notes: ioPoint.notes,
    };
  }

  private mapPartialIOPointToTauriIOPointData(ioPoint: Partial<IOPoint>): Partial<Omit<TauriIOPoint, 'id' | 'project_id' | 'revision_id' | 'created_at' | 'updated_at'>> {
    const result: Partial<Omit<TauriIOPoint, 'id' | 'project_id' | 'revision_id' | 'created_at' | 'updated_at'>> = {};
    
    if (ioPoint.tag !== undefined) result.tag = ioPoint.tag;
    if (ioPoint.description !== undefined) result.description = ioPoint.description;
    if (ioPoint.ioType !== undefined) result.io_type = ioPoint.ioType;
    if (ioPoint.signalType !== undefined) result.signal_type = ioPoint.signalType;
    if (ioPoint.plcName !== undefined) result.plc_name = ioPoint.plcName;
    if (ioPoint.rack !== undefined) result.rack = ioPoint.rack;
    if (ioPoint.slot !== undefined) result.slot = ioPoint.slot;
    if (ioPoint.channel !== undefined) result.channel = ioPoint.channel;
    if (ioPoint.terminalBlock !== undefined) result.terminal_block = ioPoint.terminalBlock;
    if (ioPoint.cableId !== undefined) result.cable_id = ioPoint.cableId;
    if (ioPoint.notes !== undefined) result.notes = ioPoint.notes;
    
    return result;
  }

  // PLC Card mapping functions
  private mapTauriPLCCardToPLCCard(tauriCard: TauriPLCCard): PLCCard {
    return {
      id: tauriCard.id,
      name: tauriCard.name,
      revisionId: tauriCard.revision_id,
      plcName: tauriCard.plc_name,
      rack: tauriCard.rack,
      slot: tauriCard.slot,
      cardType: tauriCard.card_type,
      ioType: tauriCard.io_type as IOType,
      totalChannels: tauriCard.total_channels,
      signalType: tauriCard.signal_type as SignalType,
      usedChannels: tauriCard.used_channels,
      availableChannels: tauriCard.available_channels,
      manufacturer: tauriCard.manufacturer,
      partNumber: tauriCard.part_number,
      notes: tauriCard.notes,
      createdAt: new Date(tauriCard.created_at),
      updatedAt: new Date(tauriCard.updated_at),
    };
  }

  private mapPLCCardToTauriPLCCardData(card: Omit<PLCCard, 'id' | 'createdAt' | 'updatedAt'>): Omit<TauriPLCCard, 'id' | 'project_id' | 'revision_id' | 'created_at' | 'updated_at'> {
    return {
      name: card.name,
      plc_name: card.plcName,
      rack: card.rack,
      slot: card.slot,
      card_type: card.cardType,
      io_type: card.ioType,
      total_channels: card.totalChannels,
      signal_type: card.signalType,
      used_channels: card.usedChannels,
      available_channels: card.availableChannels,
      manufacturer: card.manufacturer,
      part_number: card.partNumber,
      notes: card.notes,
    };
  }

  private mapPartialPLCCardToTauriPLCCardData(card: Partial<PLCCard>): Partial<Omit<TauriPLCCard, 'id' | 'project_id' | 'revision_id' | 'created_at' | 'updated_at'>> {
    const result: Partial<Omit<TauriPLCCard, 'id' | 'project_id' | 'revision_id' | 'created_at' | 'updated_at'>> = {};
    
    if (card.name !== undefined) result.name = card.name;
    if (card.plcName !== undefined) result.plc_name = card.plcName;
    if (card.rack !== undefined) result.rack = card.rack;
    if (card.slot !== undefined) result.slot = card.slot;
    if (card.cardType !== undefined) result.card_type = card.cardType;
    if (card.ioType !== undefined) result.io_type = card.ioType;
    if (card.totalChannels !== undefined) result.total_channels = card.totalChannels;
    if (card.signalType !== undefined) result.signal_type = card.signalType;
    if (card.usedChannels !== undefined) result.used_channels = card.usedChannels;
    if (card.availableChannels !== undefined) result.available_channels = card.availableChannels;
    if (card.manufacturer !== undefined) result.manufacturer = card.manufacturer;
    if (card.partNumber !== undefined) result.part_number = card.partNumber;
    if (card.notes !== undefined) result.notes = card.notes;
    
    return result;
  }

  // Project mapping functions
  private mapTauriProjectToProject(tauriProject: TauriProject): Project {
    return {
      id: tauriProject.id,
      name: tauriProject.name,
      description: tauriProject.description,
      client: tauriProject.client,
      engineer: tauriProject.engineer,
      majorRevision: tauriProject.major_revision,
      minorRevision: tauriProject.minor_revision,
      createdAt: new Date(tauriProject.created_at),
      updatedAt: new Date(tauriProject.updated_at),
    };
  }

  private mapTauriCableToCable(tauriCable: TauriCable): Cable {
    return {
      id: tauriCable.id,
      tag: tauriCable.tag,
      description: tauriCable.description,
      function: tauriCable.function as any,
      voltage: tauriCable.voltage,
      cableType: tauriCable.cable_type,
      size: tauriCable.size,
      cores: tauriCable.cores,
      segregationClass: tauriCable.segregation_class as any,
      fromLocation: tauriCable.from_location,
      fromEquipment: tauriCable.from_equipment,
      toLocation: tauriCable.to_location,
      toEquipment: tauriCable.to_equipment,
      length: tauriCable.length,
      sparePercentage: tauriCable.spare_percentage,
      calculatedLength: tauriCable.calculated_length,
      route: tauriCable.route,
      manufacturer: tauriCable.manufacturer,
      partNumber: tauriCable.part_number,
      outerDiameter: tauriCable.outer_diameter,
      voltageDropPercentage: tauriCable.voltage_drop_percentage,
      segregationWarning: tauriCable.segregation_warning,
      notes: tauriCable.notes,
      createdAt: new Date(tauriCable.created_at),
      updatedAt: new Date(tauriCable.updated_at),
      revisionId: tauriCable.revision_id,
    };
  }
}