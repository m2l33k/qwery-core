import * as path from 'path';
import type { UserConfig } from 'vitest/config';

const config: UserConfig = {
  test: {
    coverage: {
      provider: 'istanbul',
    },
    environment: 'node',
  },
  resolve: {
    alias: {
      '@qwery/extensions-loader': path.resolve(__dirname, './src'),
    },
  },
};

export default config;
