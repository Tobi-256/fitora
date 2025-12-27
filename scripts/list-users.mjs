import fs from 'fs';
import path from 'path';

// Detect `be` root whether we're running from project root or from inside `be`
const cwd = process.cwd();
const cwdBase = path.basename(cwd);
let beRoot;
if (cwdBase === 'be') {
  beRoot = cwd; // already inside be
} else {
  beRoot = path.resolve(cwd, 'be');
}

// Try to load .env from the backend folder first, then fallback to project root .env
const candidates = [
  path.resolve(beRoot, '.env'),
  path.resolve(cwd, '.env'),
];

for (const p of candidates) {
  try {
    if (fs.existsSync(p)) {
      // Lightweight .env parser to avoid relying on root's node_modules
      const content = fs.readFileSync(p, { encoding: 'utf8' });
      content.split(/\r?\n/).forEach(line => {
        line = line.trim();
        if (!line || line.startsWith('#')) return;
        const idx = line.indexOf('=');
        if (idx === -1) return;
        let key = line.substring(0, idx).trim();
        let val = line.substring(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.substring(1, val.length - 1);
        }
        val = val.replace(/\\n/g, '\n');
        if (!(key in process.env)) process.env[key] = val;
      });
      // stop at first found
      break;
    }
  } catch (e) {
    // ignore and continue
  }
}

(async () => {
  try {
    // Import Firebase config after dotenv has loaded env vars
    // Use an absolute file URL to avoid relative-resolution issues when running from the repo root
    const { pathToFileURL } = await import('url');
    const firebaseConfigPath = path.resolve(beRoot, 'src', 'config', 'firebase.js');
    if (!fs.existsSync(firebaseConfigPath)) {
      throw new Error(`Firebase config not found at ${firebaseConfigPath}`);
    }
    const mod = await import(pathToFileURL(firebaseConfigPath).href);
    const admin = mod.default;

    const db = admin.firestore();
    const q = await db.collection('users').limit(100).get();
    if (q.empty) {
      console.log('No users found');
      return;
    }
    q.forEach(doc => {
      console.log(doc.id, JSON.stringify(doc.data(), null, 2));
    });
  } catch (err) {
    console.error('Error listing users:', err && err.message ? err.message : err);
    process.exitCode = 1;
  }
})();
