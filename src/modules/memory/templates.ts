import { readFile } from 'node:fs/promises';

// Resolves to the package's templates/ folder from both src/ and dist/.
const TEMPLATE_ROOT = new URL('../../../templates/', import.meta.url);

export const MEMORY_FILES = [
  'PROJECT.md',
  'STATUS.md',
  'NEXT.md',
  'DECISIONS.md',
  'SESSION.md',
  'KNOWN_ISSUES.md',
] as const;

export type MemoryFile = (typeof MEMORY_FILES)[number];

export function readTemplate(relativePath: string): Promise<string> {
  return readFile(new URL(relativePath, TEMPLATE_ROOT), 'utf8');
}
