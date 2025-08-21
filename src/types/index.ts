// CableForge Type Definitions

export interface Project {
  id?: number;
  name: string;
  description?: string;
  client?: string;
  engineer?: string;
  majorRevision: string;
  minorRevision: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Cable {
  id?: number;
  tag: string;
  revisionId: number;
  
  // Description fields
  description?: string;
  function?: CableFunction;
  
  // Electrical specifications
  voltage?: number;
  current?: number;
  cableType?: string;
  size?: string;
  cores?: number;
  segregationClass?: SegregationClass;
  
  // Routing information
  fromLocation?: string;
  fromEquipment?: string;
  toLocation?: string;
  toEquipment?: string;
  length?: number;
  sparePercentage?: number;
  calculatedLength?: number;
  route?: string;
  trayId?: number; // Reference to assigned tray
  conduitId?: number; // Reference to assigned conduit
  
  // Physical properties
  manufacturer?: string;
  partNumber?: string;
  outerDiameter?: number; // mm, for fill calculations
  
  // Calculated values
  voltageDropPercentage?: number;
  segregationWarning?: boolean;
  
  // Metadata
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOPoint {
  id?: number;
  tag: string;
  revisionId: number;
  
  description?: string;
  signalType?: SignalType;
  ioType?: IOType;
  
  // PLC assignment
  plcName?: string;
  rack?: number;
  slot?: number;
  channel?: number;
  terminalBlock?: string;
  
  // Relationships
  cableId?: number;
  
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Conduit {
  id?: number;
  tag: string;
  revisionId: number;
  
  // Physical properties
  type?: ConduitType;
  size?: string;
  internalDiameter?: number; // mm
  fillPercentage: number;
  maxFillPercentage: number;
  
  // Routing
  fromLocation?: string;
  toLocation?: string;
  
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tray {
  id?: number;
  tag: string;
  revisionId: number;
  
  // Physical properties
  type?: TrayType;
  width?: number; // mm
  height?: number; // mm (side rail height)
  length?: number; // meters
  fillPercentage: number;
  maxFillPercentage: number;
  
  // Material properties
  material?: TrayMaterial;
  finish?: string;
  
  // Routing
  fromLocation?: string;
  toLocation?: string;
  elevation?: number; // mm above floor
  
  // Installation details
  supportSpacing?: number; // mm
  loadRating?: number; // kg/m
  
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Load {
  id?: number;
  tag: string;
  revisionId: number;
  description?: string;
  loadType?: string;
  powerKw?: number;
  powerHp?: number;
  voltage?: number;
  current?: number;
  powerFactor?: number;
  efficiency?: number;
  demandFactor?: number;
  connectedLoadKw?: number;
  demandLoadKw?: number;
  cableId?: number;
  feederCable?: string;
  starterType?: string;
  protectionType?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum LoadType {
  Motor = 'Motor',
  Lighting = 'Lighting', 
  Heating = 'Heating',
  Power = 'Power',
  Variable = 'Variable',
  Other = 'Other'
}

export enum StarterType {
  DOL = 'DOL', // Direct On Line
  StarDelta = 'Star-Delta',
  SoftStart = 'Soft Start',
  VFD = 'VFD', // Variable Frequency Drive
  Manual = 'Manual',
  None = 'None'
}

export enum ProtectionType {
  MCB = 'MCB', // Miniature Circuit Breaker
  MCCB = 'MCCB', // Molded Case Circuit Breaker
  ACB = 'ACB', // Air Circuit Breaker
  Fuse = 'Fuse',
  Overload = 'Overload',
  Combined = 'Combined'
}

export interface Revision {
  id: number;
  majorVersion: string;
  minorVersion: number;
  description?: string;
  isCheckpoint: boolean;
  createdAt: Date;
}

export interface RevisionChange {
  id: number;
  revisionId: number;
  tableName: string;
  recordId: number;
  changeType: 'INSERT' | 'UPDATE' | 'DELETE';
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  createdAt: Date;
}

// Enums
export enum CableFunction {
  Power = 'Power',
  Signal = 'Signal',
  Control = 'Control',
  Lighting = 'Lighting',
  Communication = 'Communication',
  Spare = 'Spare'
}

export enum SegregationClass {
  ISSignal = 'IS Signal',
  NonISSignal = 'Non-IS Signal',
  ControlPower24VDC = 'Control Power 24VDC',
  Power120VAC = 'Power 120VAC',
  Power240VAC = 'Power 240VAC',
  Power480VAC = 'Power 480VAC',
  Power600VAC = 'Power 600VAC'
}

export enum SignalType {
  FourToTwentyMA = '4-20mA',
  HART = 'HART',
  Digital = 'Digital',
  RTD = 'RTD',
  Thermocouple = 'Thermocouple',
  TwentyFourVDC = '24VDC',
  DryContact = 'Dry Contact',
  Analog = 'Analog'
}

export enum IOType {
  AI = 'AI', // Analog Input
  AO = 'AO', // Analog Output
  DI = 'DI', // Digital Input
  DO = 'DO'  // Digital Output
}

export enum ConduitType {
  EMT = 'EMT',
  RMC = 'RMC',
  IMC = 'IMC',
  PVC = 'PVC',
  LFNC = 'LFNC',
  FMC = 'FMC',
  CableRun = 'Cable Run',
  CableLadder = 'Cable Ladder',
  CableTray = 'Cable Tray'
}

export enum TrayType {
  Ladder = 'Ladder',
  Solid = 'Solid Bottom',
  Ventilated = 'Ventilated Bottom',
  WireMesh = 'Wire Mesh',
  Channel = 'Channel',
  Spine = 'Spine'
}

export enum TrayMaterial {
  Aluminum = 'Aluminum',
  Steel = 'Steel',
  StainlessSteel = 'Stainless Steel',
  Fiberglass = 'Fiberglass',
  PVC = 'PVC'
}

export enum ConductorMaterial {
  Copper = 'Copper',
  Aluminum = 'Aluminum'
}

export type ConductorSize = 
  | '22 AWG' | '20 AWG' | '18 AWG' | '16 AWG' | '14 AWG' | '12 AWG' | '10 AWG'
  | '8 AWG' | '6 AWG' | '4 AWG' | '2 AWG' | '1 AWG' | '1/0 AWG' | '2/0 AWG'
  | '3/0 AWG' | '4/0 AWG' | '250 MCM' | '300 MCM' | '350 MCM' | '400 MCM'
  | '500 MCM' | '600 MCM' | '750 MCM' | '1000 MCM';

// Calculation interfaces
export interface VoltageDropCalculation {
  voltage: number;
  current: number;
  distance: number;
  conductorSize: ConductorSize;
  material: ConductorMaterial;
  powerFactor: number;
}

export interface VoltageDropResult {
  voltageDropVolts: number;
  voltageDropPercentage: number;
}

export interface ConduitFillCalculation {
  conduit: Conduit;
  cables: Cable[];
}

export interface SegregationViolation {
  id: string;
  type: 'IS_SEPARATION' | 'POWER_SIGNAL_SEPARATION' | 'VOLTAGE_LEVEL_SEPARATION' | 'LOW_VOLTAGE_SIGNAL_MIX';
  severity: 'ERROR' | 'WARNING';
  message: string;
  cableTags: string[];
  conduitTag?: string;
}

export interface SegregationValidationResult {
  isValid: boolean;
  violations: SegregationViolation[];
  overrides?: string[];
}

// Export template interfaces
export interface ExportTemplate {
  id?: number;
  name: string;
  description?: string;
  sheets: ExportSheet[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ExportSheet {
  name: string;
  columns: ExportColumn[];
  filters?: FilterExpression[];
  sort?: SortExpression[];
}

export interface ExportColumn {
  header: string;
  field: string;
  format?: FormatRule;
  width?: number;
  alignment?: 'left' | 'center' | 'right';
  conditionalFormat?: ConditionalFormat[];
}

export interface FilterExpression {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'startsWith' | 'endsWith';
  value: any;
}

export interface SortExpression {
  field: string;
  direction: 'asc' | 'desc';
}

export interface FormatRule {
  type: 'text' | 'number' | 'currency' | 'percentage' | 'date';
  precision?: number;
  prefix?: string;
  suffix?: string;
}

export interface ConditionalFormat {
  condition: FilterExpression;
  style: {
    backgroundColor?: string;
    textColor?: string;
    fontWeight?: 'normal' | 'bold';
    fontStyle?: 'normal' | 'italic';
  };
}

// Library interfaces
export interface CableTypeLibrary {
  id?: number;
  name: string;
  manufacturer?: string;
  partNumber?: string;
  description?: string;
  voltageRating?: number;
  cores?: number;
  size?: string;
  cableType?: string;
  outerDiameter?: number;
  weight?: number;
  temperatureRating?: number;
  isArmored?: boolean;
  isShielded?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IOCardTypeLibrary {
  id?: number;
  name: string;
  manufacturer?: string;
  partNumber?: string;
  description?: string;
  totalChannels?: number;
  channelType?: IOType;
  signalTypes?: SignalType[];
  slotsRequired?: number;
  powerConsumption?: number;
  createdAt?: Date;
}

export interface PLCCard {
  id?: number;
  name: string;
  revisionId: number;
  
  // Card specifications
  plcName: string;
  rack: number;
  slot: number;
  cardType: string;
  ioType: IOType;
  totalChannels: number;
  signalType?: SignalType;
  
  // Channel usage tracking
  usedChannels: number;
  availableChannels: number;
  
  // Physical properties
  manufacturer?: string;
  partNumber?: string;
  
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChannelAssignment {
  id?: number;
  plcCardId: number;
  ioPointId: number;
  channel: number;
  terminalBlock?: string;
  wireNumber?: string;
  isActive: boolean;
  createdAt: Date;
}

// UI State interfaces
export interface AppState {
  project: Project | null;
  activeTab: 'cables' | 'io' | 'conduits' | 'loads' | 'trays' | 'reports';
  isLoading: boolean;
  saveStatus: 'saved' | 'saving' | 'error';
  lastSaved?: Date;
}

export interface CableTableState {
  cables: Cable[];
  selectedCables: number[];
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  filters: Record<string, any>;
  isEditing: boolean;
  editingCell?: { rowId: number; field: string };
}

export interface IOTableState {
  ioPoints: IOPoint[];
  plcCards: PLCCard[];
  selectedIOPoints: number[];
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  filters: Record<string, any>;
  isEditing: boolean;
  editingCell?: { rowId: number; field: string };
}

export interface ValidationState {
  violations: SegregationViolation[];
  overrides: string[];
  showWarnings: boolean;
}

// Form validation schemas (Zod)
export interface CableFormData {
  tag: string;
  description?: string;
  function?: CableFunction;
  voltage?: number;
  current?: number;
  cableType?: string;
  size?: string;
  cores?: number;
  fromLocation?: string;
  fromEquipment?: string;
  toLocation?: string;
  toEquipment?: string;
  length?: number;
  sparePercentage?: number;
  route?: string;
  segregationClass?: SegregationClass;
  manufacturer?: string;
  partNumber?: string;
  outerDiameter?: number;
  notes?: string;
}

export interface IOPointFormData {
  tag: string;
  description?: string;
  signalType?: SignalType;
  ioType?: IOType;
  plcName?: string;
  rack?: number;
  slot?: number;
  channel?: number;
  terminalBlock?: string;
  cableId?: number;
  notes?: string;
}

export interface LoadFormData {
  tag: string;
  description?: string;
  loadType?: LoadType;
  powerKw?: number;
  powerHp?: number;
  voltage?: number;
  current?: number;
  powerFactor?: number;
  efficiency?: number;
  demandFactor?: number;
  connectedLoadKw?: number;
  demandLoadKw?: number;
  cableId?: number;
  feederCable?: string;
  starterType?: StarterType;
  protectionType?: ProtectionType;
  notes?: string;
}

export interface ConduitFormData {
  tag: string;
  description?: string;
  type?: ConduitType;
  size?: string;
  internalDiameter?: number;
  fromLocation?: string;
  toLocation?: string;
  notes?: string;
}

export interface TrayFormData {
  tag: string;
  description?: string;
  type?: TrayType;
  width?: number;
  height?: number;
  depth?: number;
  material?: TrayMaterial;
  fromLocation?: string;
  toLocation?: string;
  notes?: string;
}

// Revision Control Types
export interface Revision {
  id?: number;
  projectId: number;
  majorRevision: string;
  minorRevision: number;
  description?: string;
  isCheckpoint: boolean;
  isAutoSave: boolean;
  userName?: string;
  changeCount: number;
  parentRevisionId?: number;
  createdAt: string;
}

export interface RevisionSummary {
  id: number;
  majorRevision: string;
  minorRevision: number;
  description?: string;
  isCheckpoint: boolean;
  isAutoSave: boolean;
  userName?: string;
  changeCount: number;
  createdAt: string;
}

export interface RevisionChange {
  id?: number;
  revisionId: number;
  entityType: string; // 'cable', 'io_point', 'load', 'conduit', 'tray'
  entityId: number;
  entityTag?: string;
  changeType: 'create' | 'update' | 'delete';
  fieldName?: string; // null for create/delete
  oldValue?: string;
  newValue?: string;
  createdAt: string;
}

export interface RevisionSettings {
  autoSaveInterval: number; // minutes
  maxAutoSaveRevisions: number;
  enableChangeTracking: boolean;
  userName?: string;
}

// Project Template System Types
export interface ProjectTemplate {
  id?: number;
  name: string;
  description?: string;
  category: 'Oil & Gas' | 'Power' | 'Industrial' | 'Marine' | 'Custom';
  version: string;
  createdBy?: string;
  isPublic: boolean;
  isBuiltin: boolean;
  templateData: ProjectTemplateData;
  previewImage?: string;
  tags?: string[];
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectTemplateData {
  projectInfo: {
    name: string;
    description?: string;
    client?: string;
    location?: string;
    engineeringStandards?: string[];
  };
  defaultSettings: {
    voltages: number[];
    cableFunctions: string[];
    conduitTypes: string[];
    trayTypes: string[];
    defaultSparePercentage: number;
    defaultVoltageDropLimit: number;
  };
  sampleData?: {
    cables: Partial<Cable>[];
    ioPoints: Partial<IOPoint>[];
    loads: Partial<Load>[];
    conduits: Partial<Conduit>[];
    trays: Partial<Tray>[];
  };
  columnPresets?: {
    cables: any;
    ioPoints: any;
    loads: any;
    conduits: any;
    trays: any;
  };
}

export interface CableLibraryItem {
  id?: number;
  name: string;
  manufacturer?: string;
  partNumber?: string;
  cableType: string;
  size: string;
  cores: number;
  voltageRating?: number;
  currentRating?: number;
  outerDiameter?: number;
  weightPerMeter?: number;
  temperatureRating?: number;
  conductorMaterial: 'Copper' | 'Aluminum';
  insulationType?: string;
  jacketMaterial?: string;
  shielding?: string;
  armor?: string;
  fireRating?: string;
  category: 'Power' | 'Control' | 'Instrumentation' | 'Communication' | 'Fiber Optic';
  description?: string;
  specifications?: string;
  datasheetUrl?: string;
  costPerMeter?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}