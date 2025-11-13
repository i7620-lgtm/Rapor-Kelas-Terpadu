const fs = require('fs');
const path = require('path');

const outDir = 'public';
const rootDir = __dirname;
const outDirPath = path.join(rootDir, outDir);

const filesToCopy = [
  'index.html',
  'App.js',
  'constants.js',
  'index.js',
  'sw.js',
  'manifest.json',
  'icon.svg',
  'terms.html',
  'privacy.html',
  'presets.json',
  'metadata.json',
];

const dirsToCopy = [
  'components',
  'hooks',
];

// Function to copy directory recursively
function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  let entries = fs.readdirSync(src, { withFileTypes: true });

  for (let entry of entries) {
    let srcPath = path.join(src, entry.name);
    let destPath = path.join(dest, entry.name);

    entry.isDirectory() ?
      copyDirSync(srcPath, destPath) :
      fs.copyFileSync(srcPath, destPath);
  }
}

try {
  console.log('Starting build process...');

  // 1. Clean and create output directory
  if (fs.existsSync(outDirPath)) {
    console.log(`Removing existing directory: ${outDir}`);
    fs.rmSync(outDirPath, { recursive: true, force: true });
  }
  console.log(`Creating directory: ${outDir}`);
  fs.mkdirSync(outDirPath);

  // 2. Copy directories
  for (const dir of dirsToCopy) {
    const srcPath = path.join(rootDir, dir);
    const destPath = path.join(outDirPath, dir);
    if (fs.existsSync(srcPath)) {
      console.log(`Copying directory: ${dir} -> ${destPath}`);
      copyDirSync(srcPath, destPath);
    } else {
      console.warn(`Warning: Source directory not found: ${srcPath}`);
    }
  }

  // 3. Copy files
  for (const file of filesToCopy) {
    const srcPath = path.join(rootDir, file);
    const destPath = path.join(outDirPath, file);
     if (fs.existsSync(srcPath)) {
      console.log(`Copying file: ${file} -> ${destPath}`);
      fs.copyFileSync(srcPath, destPath);
    } else {
      console.warn(`Warning: Source file not found: ${srcPath}`);
    }
  }

  // 4. Copy TP files (using glob-like logic)
  const tpFiles = fs.readdirSync(rootDir).filter(f => f.startsWith('tp') && f.endsWith('.json'));
  for (const file of tpFiles) {
     const srcPath = path.join(rootDir, file);
     const destPath = path.join(outDirPath, file);
     console.log(`Copying TP file: ${file} -> ${destPath}`);
     fs.copyFileSync(srcPath, destPath);
  }


  // 5. Generate config.js
  console.log('Generating config.js for Vercel deployment...');
  const clientId = process.env.RKT_GOOGLE_CLIENT_ID;

  if (!clientId) {
    console.error('ERROR: RKT_GOOGLE_CLIENT_ID environment variable is not set in Vercel.');
    // Log available env vars for debugging
    console.log('Available environment variables that might be relevant:');
    Object.keys(process.env).forEach(key => {
        // Log keys that might be relevant to help the user spot a typo
        if (key.includes('RKT') || key.includes('CLIENT') || key.includes('GOOGLE')) {
             console.log(`- ${key}`);
        }
    });

    const configContent = `window.RKT_CONFIG = { GOOGLE_CLIENT_ID: null }; console.error('Build Warning: GOOGLE_CLIENT_ID was not provided during build.');`;
    const configPath = path.join(outDirPath, 'config.js');
    fs.writeFileSync(configPath, configContent);
    console.warn('Warning: config.js generated with a null GOOGLE_CLIENT_ID. Please set RKT_GOOGLE_CLIENT_ID in Vercel project settings.');
  } else {
    const configContent = `window.RKT_CONFIG = {
  GOOGLE_CLIENT_ID: "${clientId}"
};
`;
    const configPath = path.join(outDirPath, 'config.js');
    fs.writeFileSync(configPath, configContent);
    console.log(`${outDir}/config.js generated successfully!`);
  }

  console.log('Build process completed successfully.');

} catch (error) {
  console.error('Build process failed:', error);
  process.exit(1);
}
