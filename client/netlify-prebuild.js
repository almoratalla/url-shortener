// This file will be run at the beginning of the build
console.log('====================================');
console.log('Starting Netlify build process');
console.log('Using build command from:', process.env.NETLIFY ? 'Netlify UI' : 'netlify.toml');
console.log('Current directory:', process.cwd());
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('VITE_API_URL:', process.env.VITE_API_URL || 'Not set');
console.log('====================================');

// Don't do anything else - this is just for logging
