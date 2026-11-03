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
          name: 'dom',
          environment: 'happy-dom',
          include: [
            'test/loader/**/*.test.ts',
            'test/components/**/*.test.{ts,tsx}',
          ],
          // Tests drive script load events themselves; nothing is fetched.
          environmentOptions: {
            happyDOM: {
              settings: {
                disableJavaScriptFileLoading: true,
                handleDisabledFileLoadingAsSuccess: true,
              },
            },
          },
        },
      },
    ],
  },
});
