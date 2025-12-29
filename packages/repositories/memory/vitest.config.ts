import type { UserConfig } from 'vitest/config';

const config: UserConfig = {
  test: {
    coverage: {
      provider: 'istanbul',
    },
    globals: true,
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    pool: 'vmThreads',
  },
};

export default config;
