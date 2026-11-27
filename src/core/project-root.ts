import path from 'node:path';
import { MEMORY_DIR } from '../config/constants.js';
import { pathExists } from '../utils/fs.js';

// Walks up from startDir to the nearest folder that has project memory or a Git repo.
// Falls back to startDir when neither exists.
export async function findProjectRoot(startDir: string): Promise<string> {
  const start = path.resolve(startDir);
  let current = start;

  for (;;) {
    if (
      (await pathExists(path.join(current, MEMORY_DIR))) ||
      (await pathExists(path.join(current, '.git')))
    ) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) {
      return start;
    }
    current = parent;
  }
}
