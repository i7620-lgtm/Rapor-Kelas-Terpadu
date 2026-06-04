async function main() {
  const T = await import('tesseract.js');
  console.log(Object.keys(T));
  console.log(typeof T.createWorker);
  console.log(typeof T.default?.createWorker);
}
main();
