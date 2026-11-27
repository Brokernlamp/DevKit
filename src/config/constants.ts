export const PACKAGE_NAME = 'devkit-ai';

// Project memory lives in this folder at the project root.
export const MEMORY_DIR = '.project-memory';

// Shared entry point for AI coding agents.
export const AGENTS_FILE = 'AGENTS.md';

// Paths that DevKit itself creates. They are left out of the "changed files"
// list so that running `memory update` twice produces the same output.
export const DEVKIT_OWNED_PATHS = [`${MEMORY_DIR}/`, AGENTS_FILE] as const;
