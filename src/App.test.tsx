import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';
import { UIProvider } from './contexts/UIContext';

// Mock the services to avoid initialization issues
jest.mock('./services/tauri-database', () => ({
  TauriDatabaseService: {
    getInstance: jest.fn(() => ({
      getCables: jest.fn().mockResolvedValue([]),
      getIOPoints: jest.fn().mockResolvedValue([]),
      getLoads: jest.fn().mockResolvedValue([]),
      getConduits: jest.fn().mockResolvedValue([]),
      getTrays: jest.fn().mockResolvedValue([])
    }))
  }
}));

jest.mock('./services/auto-numbering-service', () => ({
  autoNumberingService: {
    getNextTag: jest.fn().mockResolvedValue('CBL-001')
  }
}));

test('renders CableForge application', () => {
  render(
    <UIProvider>
      <App />
    </UIProvider>
  );
  
  // Test that the app renders without crashing
  // We don't need to test for specific content, just that it doesn't throw
  expect(document.body).toBeInTheDocument();
});
