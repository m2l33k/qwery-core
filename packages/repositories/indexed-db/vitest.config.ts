import type { UserConfig } from 'vitest/config';
import path from 'path';

const config: UserConfig = {
  test: {
    coverage: {
      provider: 'istanbul',
    },
    globals: true,
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    testTimeout: 60000,
    hookTimeout: 120000,
    pool: 'vmThreads',
  },
  resolve: {
    alias: {
      src: path.resolve(__dirname, './src'),
    },
  },
};

export default config;
