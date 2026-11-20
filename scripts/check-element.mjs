// dist/element.js must be self-contained and small (docs/decisions.md).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { stdout } from 'node:process';
import { gzipSync } from 'node:zlib';
import { findImports } from './find-imports.mjs';

const LIMIT = 30_720;
const file = join(import.meta.dirname, '..', 'dist', 'element.js');
const code = readFileSync(file, 'utf8');

const specifiers = await findImports(code);
if (specifiers.length > 0) {
  throw new Error(
    `dist/element.js must have no imports, found: ${specifiers.join(', ')}`,
  );
}

const size = gzipSync(code).length;
if (size > LIMIT) {
  throw new Error(`dist/element.js is ${size} bytes gzipped, limit ${LIMIT}`);
}
stdout.write(`dist/element.js: ${size} bytes gzipped (limit ${LIMIT})` + '\n');
