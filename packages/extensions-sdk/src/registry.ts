// Legacy holder to keep API surface stable; not used for discovery.
const legacyExtensions = new Map<
  string,
  import('./types').DatasourceExtension
>();

export function registerExtension(
  extension: import('./types').DatasourceExtension,
): void {
  legacyExtensions.set(extension.id, extension);
}
