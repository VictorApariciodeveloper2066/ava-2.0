// Environment configuration for the mobile app
// Change this to your server URL

// For local development, use your computer's IP address
// (not localhost, because the mobile app runs on a separate device/emulator)
export const API_BASE_URL = 'http://192.168.1.100:5000/api';

// For production/remote server, use:
// export const API_BASE_URL = 'https://your-server.com/api';

// AsyncStorage keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: '@ava_access_token',
  REFRESH_TOKEN: '@ava_refresh_token',
  USER_DATA: '@ava_user_data',
};

// App configuration
export const APP_CONFIG = {
  NAME: 'AVA - Sistema de Asistencia',
  VERSION: '2.0.0',
};