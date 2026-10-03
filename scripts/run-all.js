const { spawn } = require('node:child_process');
const isWin = process.platform === 'win32';
const npm = isWin ? 'npm.cmd' : 'npm';
const python = isWin ? 'python' : 'python3';
const children = [
  spawn(npm, ['run', 'next'], { stdio: 'inherit', env: process.env }),
  spawn(python, ['start_backend.py'], { stdio: 'inherit', env: process.env }),
];
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) { try { child.kill(); } catch (_) {} }
  process.exit(code);
}
for (const child of children) child.on('exit', (code) => { if (!stopping && (code ?? 0) !== 0) stop(code ?? 1); });
process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));
