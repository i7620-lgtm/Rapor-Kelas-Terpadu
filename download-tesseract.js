import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';

function download(url, dest) {
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

async function main() {
  const dir = path.join(process.cwd(), 'public', 'tesseract');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  
  await download('https://unpkg.com/tesseract.js@5.0.5/dist/worker.min.js', path.join(dir, 'worker.min.js'));
  console.log('Worker downloaded');
  await download('https://unpkg.com/tesseract.js-core@5.0.0/tesseract-core.wasm.js', path.join(dir, 'tesseract-core.wasm.js'));
  console.log('Core downloaded');
  await download('https://raw.githubusercontent.com/naptha/tessdata/gh-pages/4.0.0/ind.traineddata.gz', path.join(dir, 'ind.traineddata.gz'));
  console.log('Lang data downloaded');
}

main().catch(console.error);
