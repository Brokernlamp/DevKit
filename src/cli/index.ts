#!/usr/bin/env node
import { runCli } from './program.js';

// Piping into a command such as `head` can close stdout early. That is not an error for the user.
process.stdout.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EPIPE') {
    process.exit(0);
  }
  throw error;
});

process.exitCode = await runCli(process.argv.slice(2));
