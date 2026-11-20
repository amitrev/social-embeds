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
    clean: true,
  },
  {
    ...shared,
    entry: { element: 'src/element/index.ts' },
    clean: false,
    minify: true,
  },
]);
