// Only the default entry may carry 'use client' (docs/decisions.md D2).
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const DIRECTIVE = /^\s*(['"])use client\1/;
const dist = join(import.meta.dirname, '..', 'dist');

for (const file of readdirSync(dist, { recursive: true })) {
  if (!file.endsWith('.js')) continue;
  const has = DIRECTIVE.test(readFileSync(join(dist, file), 'utf8'));
  if (file === 'index.js' && !has) {
    throw new Error('dist/index.js must start with "use client"');
  }
  if (file !== 'index.js' && has) {
    throw new Error(`dist/${file} must not carry "use client"`);
  }
}
