import * as path from 'path';
import type { ViteUserConfig } from 'vitest/config';

const config: ViteUserConfig = {
  test: {
    coverage: {
      provider: 'istanbul',
    },
    environment: 'node',
  },
  resolve: {
    alias: {
      '@domain': path.resolve(__dirname, '../domain/src'),
      '@qwery/extensions-sdk': path.resolve(__dirname, './src'),
    },
  },
};

export default config;
