import { beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock Tauri APIs for testing
beforeAll(() => {
  // Mock window.__TAURI__ object
  Object.defineProperty(window, '__TAURI__', {
    value: {
      invoke: vi.fn(),
      event: {
        listen: vi.fn(),
        emit: vi.fn(),
      },
      fs: {
        readTextFile: vi.fn(),
        writeTextFile: vi.fn(),
        exists: vi.fn(),
        createDir: vi.fn(),
      },
      path: {
        join: vi.fn((...paths: string[]) => paths.join('/')),
        dirname: vi.fn((path: string) => path.split('/').slice(0, -1).join('/')),
        basename: vi.fn((path: string) => path.split('/').pop() || ''),
      },
      dialog: {
        open: vi.fn(),
        save: vi.fn(),
        message: vi.fn(),
        ask: vi.fn(),
      },
    },
    writable: true,
  });

  // Mock ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock IntersectionObserver
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // Deprecated
      removeListener: vi.fn(), // Deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

// Clean up mocks after each test
afterEach(() => {
  vi.clearAllMocks();
});

// Global test utilities
declare global {
  var testUtils: {
    createMockCable: (overrides?: Partial<any>) => any;
    createMockIOPoint: (overrides?: Partial<any>) => any;
    createMockConduit: (overrides?: Partial<any>) => any;
    createMockProject: (overrides?: Partial<any>) => any;
  };
}

global.testUtils = {
  createMockCable: (overrides = {}) => ({
    id: 1,
    tag: 'C-001',
    description: 'Test Cable',
    function: 'Signal',
    voltage: 24,
    size: '18 AWG',
    cores: 2,
    fromLocation: 'Source',
    toLocation: 'Destination',
    length: 100,
    sparePercentage: 10,
    route: 'C01',
    segregationClass: 'NonISSignal',
    manufacturer: 'Test Mfg',
    partNumber: 'TEST-001',
    outerDiameter: 0.25,
    notes: '',
    revisionId: 1,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  }),

  createMockIOPoint: (overrides = {}) => ({
    id: 1,
    tag: 'FT-001',
    description: 'Flow Transmitter',
    signalType: '4-20mA',
    ioType: 'AI',
    plcName: 'PLC-1',
    rack: 1,
    slot: 4,
    channel: 1,
    terminalBlock: 'TB-01-05',
    cableId: 1,
    notes: '',
    revisionId: 1,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  }),

  createMockConduit: (overrides = {}) => ({
    id: 1,
    tag: 'C01',
    type: 'EMT',
    size: '1"',
    internalDiameter: 1.049,
    fillPercentage: 25,
    maxFillPercentage: 40,
    fromLocation: 'Panel A',
    toLocation: 'Panel B',
    notes: '',
    revisionId: 1,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    cables: [],
    ...overrides,
  }),

  createMockProject: (overrides = {}) => ({
    id: 1,
    name: 'Test Project',
    description: 'Test Description',
    client: 'Test Client',
    engineer: 'Test Engineer',
    majorRevision: 'IFC',
    minorRevision: 0,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  }),
};