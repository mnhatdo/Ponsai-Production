export const environment = {
  production: false,
  // Use relative path for proxy mode, or full URL for direct mode
  // With proxy.conf.json, requests to /api will be forwarded to backend
  apiUrl: '/api/v1',
  apiTimeout: 30000,
  appName: 'Ponsai',
  version: '2.0.0',
  // Google Maps API key for shipping distance calculation
  googleMapsApiKey: 'YOUR_GOOGLE_MAPS_API_KEY_HERE'
};

