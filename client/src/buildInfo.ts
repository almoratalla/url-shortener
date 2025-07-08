// This file helps with debugging build issues
console.log('Build info loaded');

// Add buildInfo to window for debugging
declare global {
  interface Window {
    buildInfo: {
      buildTime: string;
      apiUrl: string;
      env: string;
    };
  }
}

window.buildInfo = {
  buildTime: '${new Date().toISOString()}',
  apiUrl: import.meta.env.VITE_API_URL || 'Not set',
  env: import.meta.env.MODE || 'unknown'
};
