import path from 'node:path';
import { MEMORY_DIR } from '../../config/constants.js';
import { findManagedBlockProblems } from '../../core/managed-blocks.js';
import { findSecrets } from '../../core/redact.js';
import { pathExists, readTextIfExists } from '../../utils/fs.js';
import { getReadyTasks, parseTasks } from './tasks.js';
import { MEMORY_FILES, type MemoryFile } from './templates.js';
import { planMemorySync } from './sync.js';

export type CheckLevel = 'pass' | 'warn' | 'fail' | 'info';

export interface DoctorCheck {
  level: CheckLevel;
  message: string;
}

export interface DoctorReport {
  checks: DoctorCheck[];
  errors: number;
  warnings: number;
}

// Read-only checks. Never writes files.
export async function runMemoryDoctor(root: string): Promise<DoctorReport> {
  const checks: DoctorCheck[] = [];
  const memoryDir = path.join(root, MEMORY_DIR);

  if (!(await pathExists(memoryDir))) {
    checks.push({ level: 'fail', message: `No ${MEMORY_DIR}/ folder. Run "devkit-ai memory init".` });
    return summarize(checks);
  }

  const texts = new Map<MemoryFile, string>();
  for (const name of MEMORY_FILES) {
    const text = await readTextIfExists(path.join(memoryDir, name));
    if (text === undefined) {
      checks.push({ level: 'fail', message: `${MEMORY_DIR}/${name} is missing.` });
    } else {
      texts.set(name, text);
    }
  }
  if (texts.size === MEMORY_FILES.length) {
    checks.push({ level: 'pass', message: `All ${MEMORY_FILES.length} memory files are present.` });
  }

  for (const [name, text] of texts) {
    for (const problem of findManagedBlockProblems(text)) {
      checks.push({ level: 'fail', message: `${name}: managed block "${problem.name}" ${problem.message}.` });
    }
    for (const finding of findSecrets(text)) {
      checks.push({
        level: 'fail',
        message: `${name} line ${finding.line} may contain a secret (${finding.rule}). Remove it.`,
      });
    }
  }

  const nextText = texts.get('NEXT.md');
  if (nextText !== undefined) {
    checks.push(...(await checkTasks(root, nextText)));
  }

  checks.push(...(await checkStaleSections(root)));
  return summarize(checks);
}

async function checkTasks(root: string, nextText: string): Promise<DoctorCheck[]> {
  const checks: DoctorCheck[] = [];
  const { tasks, problems } = parseTasks(nextText);

  for (const problem of problems) {
    const where = problem.line === undefined ? '' : ` line ${problem.line}`;
    checks.push({ level: 'fail', message: `NEXT.md${where}: ${problem.message}` });
  }

  const statusById = new Map(tasks.map((task) => [task.id, task.status]));
  for (const task of tasks.filter((item) => item.status === 'done')) {
    const openDependencies = task.dependsOn.filter((dependency) => statusById.get(dependency) !== 'done');
    if (openDependencies.length > 0) {
      checks.push({
        level: 'warn',
        message: `${task.id} is done but depends on unfinished task(s): ${openDependencies.join(', ')}.`,
      });
    }
    for (const file of task.files) {
      if (!(await pathExists(path.join(root, file)))) {
        checks.push({ level: 'warn', message: `${task.id} is done but its file ${file} does not exist.` });
      }
    }
  }

  if (tasks.length === 0) {
    checks.push({ level: 'info', message: 'NEXT.md has no tasks yet.' });
  } else if (problems.length === 0) {
    checks.push({
      level: 'pass',
      message: `NEXT.md has ${tasks.length} task(s); ${getReadyTasks(tasks).length} ready to start.`,
    });
  }
  return checks;
}

async function checkStaleSections(root: string): Promise<DoctorCheck[]> {
  try {
    const plan = await planMemorySync(root, { mode: 'update' });
    return plan.files.flatMap((file): DoctorCheck[] => {
      if (file.action === 'update') {
        return [{ level: 'warn', message: `${file.path} is out of date. Run "devkit-ai memory update".` }];
      }
      if (file.action === 'create' && file.path === 'AGENTS.md') {
        return [{ level: 'warn', message: 'AGENTS.md is missing. Run "devkit-ai memory update".' }];
      }
      return [];
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return [{ level: 'fail', message: `Cannot check managed sections: ${message}` }];
  }
}

function summarize(checks: DoctorCheck[]): DoctorReport {
  return {
    checks,
    errors: checks.filter((check) => check.level === 'fail').length,
    warnings: checks.filter((check) => check.level === 'warn').length,
  };
}
