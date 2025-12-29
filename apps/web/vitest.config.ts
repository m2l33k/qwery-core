import type { Plugin, ViteUserConfig } from 'vitest/config';

export default async (): Promise<ViteUserConfig> => {
  const dynamicImport = new Function('m', 'return import(m)') as (
    m: string,
  ) => Promise<{ default: () => Plugin }>;

  const [{ default: react }, { default: tsconfigPaths }] = await Promise.all([
    dynamicImport('@vitejs/plugin-react'),
    dynamicImport('vite-tsconfig-paths'),
  ]);

  return {
    plugins: [react(), tsconfigPaths()],
    resolve: {
      dedupe: ['react', 'react-dom'],
    },
    test: {
      clearMocks: true,
      coverage: {
        provider: 'istanbul',
        exclude: [
          '**/node_modules/**',
          '**/dist/**',
          '**/__tests__/**',
          '**/__mocks__/**',
          '__mocks__',
          'config',
          'server',
          '**/**stories**',
        ],
        reporter: 'lcovonly',
      },
      environment: 'happy-dom',
      setupFiles: [
        '__tests__/globals.ts',
        '__tests__/globalsProviders.tsx',
        'setupTests.ts',
      ],
      globals: true,
      include: ['__tests__/**/*.test.{ts,tsx}'],
      exclude: [
        '__tests__/utils',
        '__tests__/globals.ts',
        '__tests__/globalsProviders.tsx',
        '**/__snapshots__/**',
      ],
      server: {
        deps: {
          inline: ['@qwery/ui', 'react', 'react-dom'],
        },
      },
      pool: 'vmThreads',
    },
  };
};
