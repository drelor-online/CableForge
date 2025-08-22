// Mock for @tauri-apps/api modules

export const invoke = jest.fn().mockResolvedValue({});

export const dialog = {
  open: jest.fn().mockResolvedValue(null),
  save: jest.fn().mockResolvedValue(null),
  message: jest.fn().mockResolvedValue(null),
  ask: jest.fn().mockResolvedValue(false),
  confirm: jest.fn().mockResolvedValue(false)
};

export const fs = {
  readTextFile: jest.fn().mockResolvedValue(''),
  writeTextFile: jest.fn().mockResolvedValue(undefined),
  exists: jest.fn().mockResolvedValue(false),
  createDir: jest.fn().mockResolvedValue(undefined),
  readDir: jest.fn().mockResolvedValue([]),
  removeFile: jest.fn().mockResolvedValue(undefined)
};

export const path = {
  join: jest.fn((...paths: string[]) => paths.join('/')),
  dirname: jest.fn((path: string) => path.split('/').slice(0, -1).join('/')),
  basename: jest.fn((path: string) => path.split('/').pop() || ''),
  extname: jest.fn((path: string) => {
    const ext = path.split('.').pop();
    return ext ? `.${ext}` : '';
  })
};

export const window = {
  getCurrent: jest.fn().mockReturnValue({
    setTitle: jest.fn(),
    minimize: jest.fn(),
    maximize: jest.fn(),
    close: jest.fn(),
    isMaximized: jest.fn().mockResolvedValue(false),
    toggleMaximize: jest.fn()
  })
};

export const app = {
  getName: jest.fn().mockResolvedValue('CableForge'),
  getVersion: jest.fn().mockResolvedValue('0.1.0'),
  exit: jest.fn()
};

// Default export for core module
export default {
  invoke,
  dialog,
  fs,
  path,
  window,
  app
};