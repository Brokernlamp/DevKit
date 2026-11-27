// Makes the CLI entry point executable after build. A no-op on Windows,
// where npm creates the bin shim instead.
import { chmodSync } from 'node:fs';

chmodSync(new URL('../dist/cli/index.js', import.meta.url), 0o755);
