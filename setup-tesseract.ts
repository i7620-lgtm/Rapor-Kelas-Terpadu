import fs from "fs";
import path from "path";
import https from "https";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function download(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        return download(response.headers.location, dest).then(resolve).catch(reject);
      }
      const file = fs.createWriteStream(dest);
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
}

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    // Only copy wasm, wasm.js and worker files
    if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.wasm') || entry.name.endsWith('.gz'))) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

async function main() {
  const publicTesseractDir = path.join(process.cwd(), "public", "tesseract");
  if (!fs.existsSync(publicTesseractDir)) fs.mkdirSync(publicTesseractDir, { recursive: true });

  console.log("Copying tesseract.js worker...");
  fs.copyFileSync(
    path.join(process.cwd(), "node_modules", "tesseract.js", "dist", "worker.min.js"),
    path.join(publicTesseractDir, "worker.min.js")
  );

  console.log("Copying tesseract.js-core files...");
  copyDir(
    path.join(process.cwd(), "node_modules", "tesseract.js-core"),
    publicTesseractDir
  );

  console.log("Downloading ind.traineddata.gz...");
  await download(
    'https://raw.githubusercontent.com/naptha/tessdata/gh-pages/4.0.0/ind.traineddata.gz',
    path.join(publicTesseractDir, 'ind.traineddata.gz')
  );

  console.log("Downloading eng.traineddata.gz...");
  await download(
    'https://raw.githubusercontent.com/naptha/tessdata/gh-pages/4.0.0/eng.traineddata.gz',
    path.join(publicTesseractDir, 'eng.traineddata.gz')
  );

  console.log("Tesseract setup complete.");
}

main().catch(console.error);
