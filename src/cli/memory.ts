import type { Command } from 'commander';
import { MEMORY_DIR } from '../config/constants.js';
import { findProjectRoot } from '../core/project-root.js';
import { runMemoryDoctor, type DoctorCheck } from '../modules/memory/doctor.js';
import {
  getMemoryStatus,
  getNextTasks,
  readMemoryFile,
  resolveMemoryFile,
  type MemoryStatus,
} from '../modules/memory/reports.js';
import { applyMemorySync, planMemorySync, type PlannedFile, type SyncMode } from '../modules/memory/sync.js';
import { MEMORY_FILES } from '../modules/memory/templates.js';
import type { Task } from '../modules/memory/tasks.js';
import type { CliContext } from './context.js';

const LABELS: Record<DoctorCheck['level'], string> = {
  pass: '[PASS]',
  warn: '[WARN]',
  fail: '[FAIL]',
  info: '[INFO]',
};

export function registerMemoryCommands(program: Command, context: CliContext): void {
  const memory = program
    .command('memory')
    .description('Keep shared project memory for AI coding agents');

  memory
    .command('init')
    .description(`Create ${MEMORY_DIR}/ and AGENTS.md. Safe to run again; existing text is kept.`)
    .action(() => runSync(context, 'init'));

  memory
    .command('update')
    .description('Refresh generated sections from the current repository state')
    .option('--summary <text>', 'handoff summary to store in SESSION.md')
    .action((options: { summary?: string }) => runSync(context, 'update', options.summary));

  memory
    .command('status')
    .description('Show a short overview of project memory and the repository')
    .action(() => runStatus(context));

  memory
    .command('next')
    .description('List tasks that are ready to start')
    .action(() => runNext(context));

  memory
    .command('doctor')
    .description('Check project memory for problems. Exits with 1 when errors are found')
    .action(() => runDoctor(context));

  memory
    .command('show')
    .description('Print a memory file, or all of them')
    .argument('[file]', `one of: ${MEMORY_FILES.join(', ')} (case-insensitive, .md optional)`)
    .action((file?: string) => runShow(context, file));
}

async function runSync(context: CliContext, mode: SyncMode, summary?: string): Promise<void> {
  const root = await findProjectRoot(context.cwd);
  const plan = await planMemorySync(root, { mode, summary });
  const written = await applyMemorySync(plan);

  if (written.length === 0) {
    context.write(`Project memory is up to date (${MEMORY_DIR}/ and AGENTS.md). Nothing changed.\n`);
    return;
  }

  context.write(`${mode === 'init' ? 'Project memory initialized.' : 'Project memory updated.'}\n`);
  for (const file of written) {
    context.write(`  ${describeAction(file)} ${file.path}\n`);
  }
  context.write('Next: review the files, then run "devkit-ai memory doctor".\n');
}

function describeAction(file: PlannedFile): string {
  return file.action === 'create' ? 'created' : 'updated';
}

async function runStatus(context: CliContext): Promise<void> {
  const root = await findProjectRoot(context.cwd);
  const status = await getMemoryStatus(root);
  context.write(`${renderStatus(status)}\n`);
}

function renderStatus(status: MemoryStatus): string {
  const lines: string[] = [];

  if (!status.initialized) {
    lines.push(`Project memory: not initialized. Run "devkit-ai memory init".`);
  } else {
    lines.push(`Project memory: ${MEMORY_DIR}/ found.`);
  }

  if (status.git.isRepository) {
    const branch = status.git.branch ?? 'detached HEAD';
    const commit = status.git.latestCommit ?? 'no commits yet';
    lines.push(`Git: branch ${branch}, latest commit ${commit}, ${status.git.changedFiles.length} uncommitted change(s).`);
  } else {
    lines.push('Git: not a Git repository.');
  }

  const counts = status.taskCounts;
  lines.push(
    `Tasks: ${counts.todo} todo, ${counts['in-progress']} in progress, ${counts.done} done, ${counts.blocked} blocked.`,
  );
  lines.push(`Ready to start: ${status.readyTasks.length}.`);

  if (status.readyTasks[0]) {
    lines.push(`Suggested next: ${formatTask(status.readyTasks[0])}`);
  }
  if (status.initialized && status.missingFiles.length > 0) {
    lines.push(`Missing files: ${status.missingFiles.join(', ')}. Run "devkit-ai memory update".`);
  }
  if (status.staleFiles.length > 0) {
    lines.push(`Out of date: ${status.staleFiles.join(', ')}. Run "devkit-ai memory update".`);
  }
  if (status.taskProblemCount > 0) {
    lines.push(`NEXT.md has ${status.taskProblemCount} problem(s). Run "devkit-ai memory doctor".`);
  }
  return lines.join('\n');
}

async function runNext(context: CliContext): Promise<void> {
  const root = await findProjectRoot(context.cwd);
  const tasks = await getNextTasks(root);

  if (tasks.length === 0) {
    context.write('No tasks are ready to start. Check NEXT.md for blocked or unfinished dependencies.\n');
    return;
  }
  context.write('Ready to start (in order):\n');
  for (const task of tasks) {
    context.write(`  ${formatTask(task)}\n`);
    if (task.acceptance) {
      context.write(`      Done when: ${task.acceptance}\n`);
    }
  }
}

function formatTask(task: Task): string {
  const files = task.files.length > 0 ? ` (${task.files.join(', ')})` : '';
  return `${task.id} [${task.priority}, ${task.status}] ${task.title}${files}`;
}

async function runDoctor(context: CliContext): Promise<void> {
  const root = await findProjectRoot(context.cwd);
  const report = await runMemoryDoctor(root);

  for (const check of report.checks) {
    context.write(`${LABELS[check.level]} ${check.message}\n`);
  }
  context.write(`Result: ${report.errors} error(s), ${report.warnings} warning(s).\n`);

  if (report.errors > 0) {
    context.exitCode = 1;
  }
}

async function runShow(context: CliContext, file: string | undefined): Promise<void> {
  const root = await findProjectRoot(context.cwd);

  if (file !== undefined) {
    const name = resolveMemoryFile(file);
    if (!name) {
      context.writeError(`[FAIL] Unknown memory file "${file}". Use one of: ${MEMORY_FILES.join(', ')}.\n`);
      context.exitCode = 1;
      return;
    }
    const text = await readMemoryFile(root, name);
    if (text === undefined) {
      context.writeError(`[FAIL] ${MEMORY_DIR}/${name} does not exist. Run "devkit-ai memory init".\n`);
      context.exitCode = 1;
      return;
    }
    context.write(text.endsWith('\n') ? text : `${text}\n`);
    return;
  }

  for (const name of MEMORY_FILES) {
    const text = await readMemoryFile(root, name);
    context.write(`=== ${MEMORY_DIR}/${name} ===\n`);
    context.write(text === undefined ? '(missing)\n\n' : `${text.trimEnd()}\n\n`);
  }
}
