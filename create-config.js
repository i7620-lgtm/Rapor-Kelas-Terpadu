const fs = require('fs');

console.log('Generating config.js for Vercel deployment...');

const clientId = process.env.CLIENT_ID;

if (!clientId) {
  console.error('ERROR: CLIENT_ID environment variable is not set in Vercel.');
  // Fail the build if the environment variable is missing
  process.exit(1); 
}

const content = `window.RKT_CONFIG = {
  GOOGLE_CLIENT_ID: "${clientId}"
};
`;

try {
  fs.writeFileSync('config.js', content);
  console.log('config.js generated successfully!');
} catch (error) {
  console.error('Error writing config.js:', error);
  process.exit(1);
}
