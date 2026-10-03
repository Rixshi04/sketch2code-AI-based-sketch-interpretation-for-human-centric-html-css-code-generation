const { execFileSync } = require('node:child_process');

try {
  execFileSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['prisma', 'generate'], { stdio: 'inherit' });
} catch (_) {
  console.warn('[predev] Prisma generate failed; continuing with the Next.js server.');
}
