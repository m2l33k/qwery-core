import registry from '../public/extensions/registry.json';

type DatasourceMetadata = {
  id: string;
  name: string;
  description: string;
  logo: string;
  tags?: string[];
  drivers: Array<{
    id: string;
    name: string;
    description?: string;
    runtime?: string;
  }>;
};

/**
 * Build-time constant containing all datasources from registry.json
 * This is imported at build time and bundled with the app for zero runtime cost
 */
export const DATASOURCES: DatasourceMetadata[] = (
  registry as {
    datasources: Array<{
      id: string;
      name: string;
      description?: string;
      icon?: string;
      packageName: string;
      drivers: Array<{
        id: string;
        name: string;
        description?: string;
        runtime?: string;
      }>;
    }>;
  }
).datasources.map((ds) => ({
  id: ds.id,
  name: ds.name,
  description: ds.description || '',
  logo: ds.icon || '',
  tags: [],
  drivers: ds.drivers,
}));
