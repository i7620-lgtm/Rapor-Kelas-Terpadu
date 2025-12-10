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
  if (!fs.existsSync(src)) return;
  
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
    console.log(`Cleaning existing directory: ${outDir}`);
    fs.rmSync(outDirPath, { recursive: true, force: true });
  }
  fs.mkdirSync(outDirPath, { recursive: true });

  // 2. Copy directories
  for (const dir of dirsToCopy) {
    const srcPath = path.join(rootDir, dir);
    const destPath = path.join(outDirPath, dir);
    if (fs.existsSync(srcPath)) {
      console.log(`Copying directory: ${dir}`);
      copyDirSync(srcPath, destPath);
    } else {
      console.log(`Note: Directory ${dir} not found, skipping.`);
    }
  }

  // 3. Copy files
  for (const file of filesToCopy) {
    const srcPath = path.join(rootDir, file);
    const destPath = path.join(outDirPath, file);
    
    // Special handling for index.js vs index.tsx
    if (file === 'index.js' && !fs.existsSync(srcPath)) {
        const tsxPath = path.join(rootDir, 'index.tsx');
        if (fs.existsSync(tsxPath)) {
            console.log(`Copying index.tsx as index.js`);
            fs.copyFileSync(tsxPath, destPath);
            continue;
        }
    }

    if (fs.existsSync(srcPath)) {
      console.log(`Copying file: ${file}`);
      fs.copyFileSync(srcPath, destPath);
    } else {
      console.warn(`Warning: Source file not found: ${file} (Skipping)`);
    }
  }

  // 4. Copy TP files (using glob-like logic)
  try {
      const allFiles = fs.readdirSync(rootDir);
      const tpFiles = allFiles.filter(f => f.startsWith('tp') && f.endsWith('.json'));
      
      for (const file of tpFiles) {
         const srcPath = path.join(rootDir, file);
         const destPath = path.join(outDirPath, file);
         console.log(`Copying TP file: ${file}`);
         fs.copyFileSync(srcPath, destPath);
      }
  } catch (err) {
      console.warn('Warning: Could not list TP files:', err.message);
  }

  // 5. Generate config.js
  console.log('Generating config.js...');
  const clientId = process.env.RKT_GOOGLE_CLIENT_ID;

  let configContent;
  if (!clientId) {
    // Log as warning, NOT error, to prevent some strict CI form failing
    console.warn('WARNING: RKT_GOOGLE_CLIENT_ID environment variable is not set. Google Sign-In will be disabled.');
    configContent = `window.RKT_CONFIG = { GOOGLE_CLIENT_ID: null }; console.warn('RKT Config: No Client ID provided.');`;
  } else {
    configContent = `window.RKT_CONFIG = {
  GOOGLE_CLIENT_ID: "${clientId}"
};`;
  }
  
  const configPath = path.join(outDirPath, 'config.js');
  fs.writeFileSync(configPath, configContent);
  console.log('config.js generated.');

  console.log('Build process completed successfully.');

} catch (error) {
  console.error('FATAL: Build process failed:', error);
  process.exit(1);
}
