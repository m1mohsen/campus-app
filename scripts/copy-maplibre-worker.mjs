// کپی فایل‌های worker مپ‌لیبر به public — تا Turbopack/Next آن‌ها را درست سرو کند
// (با postinstall اجرا می‌شود تا همیشه هم‌نسخه‌ی maplibre-gl بمانند)
import { copyFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'node_modules', 'maplibre-gl', 'dist');
const publicDir = join(root, 'public');

// worker به shared هم import دارد — هر دو باید کنار هم باشند
const FILES = ['maplibre-gl-worker.mjs', 'maplibre-gl-shared.mjs'];

mkdirSync(publicDir, { recursive: true });
let copied = 0;
for (const f of FILES) {
  const src = join(dist, f);
  if (!existsSync(src)) {
    console.warn(`[copy-worker] ${f} not found — skipping (maplibre-gl not installed?)`);
    continue;
  }
  copyFileSync(src, join(publicDir, f));
  copied++;
}
console.log(`[copy-worker] ${copied} maplibre file(s) copied to public/`);
