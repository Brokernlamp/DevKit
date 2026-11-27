import path from 'node:path';
import { DEVKIT_OWNED_PATHS, MEMORY_DIR } from '../../config/constants.js';
import { getGitSnapshot, type GitSnapshot } from '../../utils/git.js';
import { pathExists, readTextIfExists } from '../../utils/fs.js';
import { getReadyTasks, parseTasks, TASK_STATUSES, type Task, type TaskStatus } from './tasks.js';
import { MEMORY_FILES, type MemoryFile } from './templates.js';
import { planMemorySync } from './sync.js';

export interface MemoryStatus {
  initialized: boolean;
  missingFiles: string[];
  taskCounts: Record<TaskStatus, number>;
  readyTasks: Task[];
  taskProblemCount: number;
  staleFiles: string[];
  git: GitSnapshot;
}

export async function getMemoryStatus(root: string): Promise<MemoryStatus> {
  const memoryDir = path.join(root, MEMORY_DIR);
  const git = await getGitSnapshot(root, { ignorePaths: DEVKIT_OWNED_PATHS });
  const taskCounts = Object.fromEntries(TASK_STATUSES.map((status) => [status, 0])) as Record<TaskStatus, number>;

  if (!(await pathExists(memoryDir))) {
    return {
      initialized: false,
      missingFiles: [...MEMORY_FILES],
      taskCounts,
      readyTasks: [],
      taskProblemCount: 0,
      staleFiles: [],
      git,
    };
  }

  const missingFiles: string[] = [];
  for (const name of MEMORY_FILES) {
    if (!(await pathExists(path.join(memoryDir, name)))) {
      missingFiles.push(name);
    }
  }

  const nextText = await readTextIfExists(path.join(memoryDir, 'NEXT.md'));
  const report = parseTasks(nextText ?? '');
  for (const task of report.tasks) {
    taskCounts[task.status] += 1;
  }

  const plan = await planMemorySync(root, { mode: 'update' });
  return {
    initialized: true,
    missingFiles,
    taskCounts,
    readyTasks: getReadyTasks(report.tasks),
    taskProblemCount: report.problems.length,
    staleFiles: plan.files.filter((file) => file.action === 'update').map((file) => file.path),
    git,
  };
}

export async function getNextTasks(root: string): Promise<Task[]> {
  const text = await readTextIfExists(path.join(root, MEMORY_DIR, 'NEXT.md'));
  return getReadyTasks(parseTasks(text ?? '').tasks);
}

// Accepts "next", "NEXT", or "NEXT.md" in any case.
export function resolveMemoryFile(name: string): MemoryFile | undefined {
  const wanted = name.toLowerCase().replace(/\.md$/, '');
  return MEMORY_FILES.find((file) => file.toLowerCase().replace(/\.md$/, '') === wanted);
}

export async function readMemoryFile(root: string, name: MemoryFile): Promise<string | undefined> {
  return readTextIfExists(path.join(root, MEMORY_DIR, name));
}
