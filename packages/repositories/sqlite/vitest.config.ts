import type { UserConfig } from 'vitest/config';
import path from 'node:path';

const config: UserConfig = {
  test: {
    coverage: {
      provider: 'istanbul',
    },
    globals: true,
    environment: 'node',
    testTimeout: 60000,
    hookTimeout: 120000,
  },
  resolve: {
    alias: {
      src: path.resolve(__dirname, './src'),
    },
  },
};

export default config;
