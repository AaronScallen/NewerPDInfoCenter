import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';
const nodeCmd = isWindows ? 'node.exe' : 'node';

console.log('\x1b[36m%s\x1b[0m', '═══════════════════════════════════════════════════════════════════════════');
console.log('\x1b[36m%s\x1b[0m', '🚨 NISD POLICE DEPT - COMMAND & DISPATCH REAL-TIME SYSTEM (LAUNCHER) 🚨');
console.log('\x1b[36m%s\x1b[0m', '═══════════════════════════════════════════════════════════════════════════');

// Start Backend Server
console.log('\x1b[32m%s\x1b[0m', '▶ Starting Backend Server on http://localhost:5000 (ws://localhost:5000/ws)...');
const backend = spawn(nodeCmd, ['backend/server.js'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

// Start Frontend Dev Server
console.log('\x1b[34m%s\x1b[0m', '▶ Starting Vite Frontend on http://localhost:5173...');
const frontend = spawn(npmCmd, ['run', 'dev'], {
  cwd: path.resolve(__dirname, 'frontend'),
  stdio: 'inherit',
  shell: true
});

function cleanup() {
  console.log('\n\x1b[33m%s\x1b[0m', 'Shutting down Police Department servers...');
  backend.kill();
  frontend.kill();
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
