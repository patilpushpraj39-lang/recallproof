import { createInterface } from 'node:readline';
import { Writable } from 'node:stream';
import { createRecallServer } from './server.mjs';

async function readPrivateKey() {
  if (process.env.GEMINI_API_KEY?.trim()) return process.env.GEMINI_API_KEY.trim();
  if (!process.stdin.isTTY) throw new Error('Run npm start in an interactive terminal to enter your API key.');
  const silentOutput = new Writable({ write(_chunk, _encoding, done) { done(); } });
  const reader = createInterface({ input: process.stdin, output: silentOutput, terminal: true });
  process.stdout.write('Paste your Google API key (hidden), then press Enter: ');
  try {
    return await new Promise((resolve, reject) => {
      reader.on('SIGINT', () => reject(new Error('Cancelled. No API key was saved.')));
      reader.question('', key => resolve(key.trim()));
    });
  } finally { reader.close(); process.stdout.write('\n'); }
}

try {
  const apiKey = await readPrivateKey();
  if (!apiKey) throw new Error('No API key entered. Run npm start to try again.');
  const server = createRecallServer({ apiKey });
  server.on('error', error => {
    console.error(error.code === 'EADDRINUSE'
      ? 'Port 4173 is already in use. Stop the other RecallProof process first.'
      : 'Could not start the local server.');
    process.exitCode = 1;
  });
  server.listen(4173, '127.0.0.1', () => {
    console.log('\nRecallProof is ready: http://127.0.0.1:4173');
    console.log('The key is held in memory. Press Ctrl+C to stop.\n');
  });
} catch (error) { console.error(error.message); process.exitCode = 1; }
