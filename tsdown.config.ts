import { defineConfig } from 'tsdown';

const shared = {
  format: 'esm',
  platform: 'neutral',
  target: 'es2022',
  dts: true,
  fixedExtension: false,
} as const;

export default defineConfig([
  {
    ...shared,
    entry: { index: 'src/index.ts', parser: 'src/parser/index.ts' },
    // One file per module, so bundlers drop the parsers a per-platform component never imports (docs/decisions.md D103).
    unbundle: true,
    clean: true,
  },
  {
    ...shared,
    entry: { element: 'src/element/index.ts' },
    clean: false,
    minify: true,
  },
]);
