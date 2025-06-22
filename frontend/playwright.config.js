// 🧪 Playwright E2E Testing Configuration
// Optimized for location-based transport application

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }]
  ],
  use: {
    // Base URL for all tests
    baseURL: 'http://localhost:5174',
    
    // Global test settings
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // Location permissions for transport app
    permissions: ['geolocation'],
    
    // Default Bangalore location for testing
    geolocation: { 
      latitude: 12.9716, 
      longitude: 77.5946 
    },
    
    // Timeout settings
    actionTimeout: 10000,
    navigationTimeout: 30000
  },

  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // High accuracy location for desktop testing
        geolocation: { 
          latitude: 12.9716, 
          longitude: 77.5946 
        }
      },
    },

    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        geolocation: { 
          latitude: 12.9716, 
          longitude: 77.5946 
        }
      },
    },

    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        geolocation: { 
          latitude: 12.9716, 
          longitude: 77.5946 
        }
      },
    },

    // Mobile testing with different locations
    {
      name: 'Mobile Chrome - Koramangala',
      use: { 
        ...devices['Pixel 5'],
        geolocation: { 
          latitude: 12.9352, 
          longitude: 77.6192 
        }
      },
    },

    {
      name: 'Mobile Safari - Electronic City',
      use: { 
        ...devices['iPhone 12'],
        geolocation: { 
          latitude: 12.8456, 
          longitude: 77.6603 
        }
      },
    },

    // Accessibility testing
    {
      name: 'accessibility',
      use: {
        ...devices['Desktop Chrome'],
        // Force prefers-reduced-motion for accessibility testing
        forcedColors: 'none',
        reducedMotion: 'reduce'
      },
    }
  ],

  // Test environment setup
  webServer: [
    {
      command: 'npm run dev',
      port: 5174,
      reuseExistingServer: !process.env.CI,
      cwd: '../frontend'
    },
    {
      command: 'node server.js',
      port: 3001,
      reuseExistingServer: !process.env.CI,
      cwd: '../backend'
    }
  ],

  // Global setup for seeding test data
  globalSetup: './tests/global-setup.js',
  
  // Global teardown for cleanup
  globalTeardown: './tests/global-teardown.js',

  // Test matching patterns
  testMatch: [
    'tests/e2e/**/*.spec.js',
    'tests/e2e/**/*.test.js'
  ],

  // Timeout configuration
  timeout: 30000,
  expect: {
    timeout: 5000
  }
});