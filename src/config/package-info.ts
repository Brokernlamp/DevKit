import { readFileSync } from 'node:fs';

interface PackageMetadata {
  name: string;
  version: string;
}

// Resolves to the package root both from src/config and from dist/config.
const packageJson = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
) as PackageMetadata;

export const VERSION: string = packageJson.version;
