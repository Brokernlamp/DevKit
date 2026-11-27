import { Command, CommanderError } from 'commander';
import { PACKAGE_NAME } from '../config/constants.js';
import { VERSION } from '../config/package-info.js';
import type { CliContext } from './context.js';
import { registerMemoryCommands } from './memory.js';

export interface RunCliOptions {
  cwd?: string;
  stdout?: (text: string) => void;
  stderr?: (text: string) => void;
}

// Runs the CLI and returns the exit code. Errors are printed, never thrown.
export async function runCli(argv: readonly string[], options: RunCliOptions = {}): Promise<number> {
  const context: CliContext = {
    cwd: options.cwd ?? process.cwd(),
    write: options.stdout ?? ((text) => process.stdout.write(text)),
    writeError: options.stderr ?? ((text) => process.stderr.write(text)),
    exitCode: 0,
  };

  const program = new Command()
    .name(PACKAGE_NAME)
    .description('Developer utilities for AI coding agents. Local-first and CLI-first.')
    .version(VERSION)
    .exitOverride()
    .configureOutput({
      writeOut: (text) => context.write(text),
      writeErr: (text) => context.writeError(text),
    });

  registerMemoryCommands(program, context);

  try {
    await program.parseAsync([...argv], { from: 'user' });
    return context.exitCode;
  } catch (error) {
    if (error instanceof CommanderError) {
      return error.exitCode;
    }
    const message = error instanceof Error ? error.message : String(error);
    context.writeError(`[FAIL] ${message}\n`);
    return 1;
  }
}
