import type { ViteUserConfig } from 'vitest/config';
import path from 'path';

const config: ViteUserConfig = {
  test: {
    coverage: {
      provider: 'istanbul',
    },
    globals: true,
    environment: 'node',
    testTimeout: 120000, // 2 minutes for tests with containers
    hookTimeout: 180000, // 3 minutes for container startup
  },
  resolve: {
    alias: {
      src: path.resolve(__dirname, './src'),
    },
  },
};

export default config;
