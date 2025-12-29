import path from 'node:path';
import type { UserConfig } from 'vitest/config';

const config: UserConfig = {
  test: {
    coverage: {
      provider: 'istanbul',
    },
    environment: 'node',
    include: ['__tests__/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@qwery/extensions-sdk': path.resolve(
        __dirname,
        '../extensions-sdk/src',
      ),
    },
  },
};

export default config;

