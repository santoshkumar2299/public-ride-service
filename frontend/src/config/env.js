// Environment configuration
export const config = {
  // API Configuration
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
  
  
  // App Configuration
  appName: import.meta.env.VITE_APP_NAME || 'Ride Share MVP',
  appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
  
  // Feature Flags
  enableMaps: import.meta.env.VITE_ENABLE_MAPS === 'true',
  enableNotifications: import.meta.env.VITE_ENABLE_NOTIFICATIONS === 'true',
  enableGPS: import.meta.env.VITE_ENABLE_GPS === 'true',
  
  // Development
  debugMode: import.meta.env.VITE_DEBUG_MODE === 'true',
  logLevel: import.meta.env.VITE_LOG_LEVEL || 'warn',
  
  // Polling Configuration
  pollingInterval: parseInt(import.meta.env.VITE_POLLING_INTERVAL) || 5000,
  
  // Map Configuration
  defaultMapCenter: {
    lat: parseFloat(import.meta.env.VITE_DEFAULT_MAP_CENTER_LAT) || 37.7749,
    lng: parseFloat(import.meta.env.VITE_DEFAULT_MAP_CENTER_LNG) || -122.4194
  },
  defaultMapZoom: parseInt(import.meta.env.VITE_DEFAULT_MAP_ZOOM) || 12,
  
  // Location Settings
  defaultWalkDistance: parseInt(import.meta.env.VITE_DEFAULT_WALK_DISTANCE) || 1000,
  maxWalkDistance: parseInt(import.meta.env.VITE_MAX_WALK_DISTANCE) || 2000,

  // Routing API
  orsApiKey: import.meta.env.VITE_ORS_API_KEY || ''
};

// Utility functions
export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;

// Debug logger
export const logger = {
  debug: (...args) => config.debugMode && console.log('[DEBUG]', ...args),
  info: (...args) => console.info('[INFO]', ...args),
  warn: (...args) => console.warn('[WARN]', ...args),
  error: (...args) => console.error('[ERROR]', ...args)
};