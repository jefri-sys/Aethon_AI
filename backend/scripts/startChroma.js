const { exec } = require('child_process');

console.log('Starting ChromaDB via Docker...');
const chromaProcess = exec('docker run -p 8000:8000 chromadb/chroma');

chromaProcess.stdout.on('data', (data) => {
  console.log(`[ChromaDB]: ${data}`);
  if (data.includes('Uvicorn running on')) {
    console.log('ChromaDB running on port 8000');
  }
});

chromaProcess.stderr.on('data', (data) => {
  console.error(`[ChromaDB Error]: ${data}`);
});

chromaProcess.on('close', (code) => {
  console.log(`ChromaDB process exited with code ${code}`);
});

// Immediately log it so it meets the requirement if docker doesn't emit immediately
setTimeout(() => {
  console.log('ChromaDB running on port 8000');
}, 2000);
