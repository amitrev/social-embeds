import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    passWithNoTests: true, // M1 only: no tests yet; removed in M2
    projects: [
      {
        test: {
          name: 'parser',
          environment: 'node',
          include: ['test/parser/**/*.test.ts'],
        },
      },
      {
        test: {
          name: 'components',
          environment: 'happy-dom',
          include: ['test/components/**/*.test.tsx'],
        },
      },
    ],
  },
});
