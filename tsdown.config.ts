import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: { index: 'src/index.ts', parser: 'src/parser/index.ts' },
  format: 'esm',
  platform: 'neutral',
  target: 'es2022',
  dts: true,
  fixedExtension: false,
  clean: true,
});
