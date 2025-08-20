import { type FullConfig } from '@playwright/test';
import path from 'path';
import fs from 'fs';

async function globalTeardown(config: FullConfig) {
  console.log('Starting global test teardown...');

  // Clean up temp directory
  const tempDir = path.join(__dirname, 'temp');
  if (fs.existsSync(tempDir)) {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
      console.log('Temp directory cleaned up.');
    } catch (error) {
      console.warn('Failed to clean up temp directory:', error);
    }
  }

  // Clean up any test databases or files that might have been created
  const testFiles = [
    'test-project-*.cfp',
    'temp-*.cfp',
    '*.tmp'
  ];

  for (const pattern of testFiles) {
    // In a real implementation, you'd use glob or similar to find matching files
    // For now, just log the cleanup intention
    console.log(`Would clean up files matching pattern: ${pattern}`);
  }

  // If you had any persistent test data or connections, clean them up here
  
  console.log('Global test teardown completed.');
}

export default globalTeardown;