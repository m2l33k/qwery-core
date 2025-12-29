import type { ViteUserConfig } from 'vitest/config';

const config: ViteUserConfig = {
  test: {
    coverage: {
      provider: 'istanbul',
    },
    globals: true,
    environment: 'node',
    testTimeout: 10000,
    hookTimeout: 10000,
    setupFiles: ['./vitest.setup.ts'],
  },
};

export default config;
