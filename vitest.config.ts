import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
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
