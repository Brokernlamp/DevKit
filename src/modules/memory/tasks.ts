export const TASK_STATUSES = ['todo', 'in-progress', 'done', 'blocked'] as const;
export const TASK_PRIORITIES = ['P0', 'P1', 'P2', 'P3'] as const;
export const TASK_ORIGINS = ['confirmed', 'inferred', 'optional'] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];
export type TaskPriority = (typeof TASK_PRIORITIES)[number];
export type TaskOrigin = (typeof TASK_ORIGINS)[number];

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  origin: TaskOrigin;
  dependsOn: string[];
  files: string[];
  acceptance: string;
  line: number;
}

export interface TaskProblem {
  line?: number;
  message: string;
}

export interface TaskReport {
  tasks: Task[];
  problems: TaskProblem[];
}

const HEADING_PATTERN = /^###\s+(T-\d+):\s*(\S.*)$/;
const MALFORMED_HEADING_PATTERN = /^###\s+T-/;
const FIELD_PATTERN = /^-\s+([A-Za-z ]+):\s*(.*)$/;

const FIELD_NAMES: Record<string, string> = {
  status: 'status',
  priority: 'priority',
  origin: 'origin',
  'depends on': 'dependsOn',
  files: 'files',
  acceptance: 'acceptance',
};

// Blanks out HTML comments but keeps the newlines, so line numbers stay correct.
function stripComments(text: string): string {
  return text.replace(/<!--[\s\S]*?-->/g, (comment) => comment.replace(/[^\n]/g, ''));
}

function splitList(value: string): string[] {
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.toLowerCase() === 'none') {
    return [];
  }
  return trimmed
    .split(',')
    .map((item) => item.trim().replace(/^`|`$/g, ''))
    .filter((item) => item.length > 0);
}

interface RawTask {
  id: string;
  title: string;
  line: number;
  fields: Map<string, { value: string; line: number }>;
}

export function parseTasks(text: string): TaskReport {
  const problems: TaskProblem[] = [];
  const rawTasks: RawTask[] = [];
  let current: RawTask | undefined;

  stripComments(text)
    .split(/\r?\n/)
    .forEach((line, index) => {
      const lineNumber = index + 1;
      const heading = HEADING_PATTERN.exec(line.trim());
      if (heading) {
        current = {
          id: heading[1] ?? '',
          title: (heading[2] ?? '').trim(),
          line: lineNumber,
          fields: new Map(),
        };
        rawTasks.push(current);
        return;
      }
      if (MALFORMED_HEADING_PATTERN.test(line.trim())) {
        problems.push({ line: lineNumber, message: 'task heading must look like "### T-001: Title"' });
        current = undefined;
        return;
      }
      const field = FIELD_PATTERN.exec(line.trim());
      if (field && current) {
        const key = (field[1] ?? '').trim().toLowerCase();
        if (FIELD_NAMES[key] !== undefined) {
          current.fields.set(FIELD_NAMES[key] ?? key, { value: field[2] ?? '', line: lineNumber });
        }
      }
    });

  const tasks = rawTasks.map((raw) => buildTask(raw, problems));
  problems.push(...validateTasks(tasks));
  return { tasks, problems };
}

function buildTask(raw: RawTask, problems: TaskProblem[]): Task {
  const field = (name: string) => raw.fields.get(name);
  const fail = (name: string, message: string) => {
    problems.push({ line: field(name)?.line ?? raw.line, message: `${raw.id}: ${message}` });
  };

  const statusValue = (field('status')?.value ?? '').trim().toLowerCase();
  const status = pickOne(TASK_STATUSES, statusValue);
  if (!status) {
    fail('status', `Status must be one of ${TASK_STATUSES.join(', ')}`);
  }

  const priorityValue = (field('priority')?.value ?? '').trim().toUpperCase();
  const priority = pickOne(TASK_PRIORITIES, priorityValue);
  if (!priority) {
    fail('priority', `Priority must be one of ${TASK_PRIORITIES.join(', ')}`);
  }

  const originValue = (field('origin')?.value ?? '').trim().toLowerCase();
  const origin = pickOne(TASK_ORIGINS, originValue);
  if (!origin) {
    fail('origin', `Origin must be one of ${TASK_ORIGINS.join(', ')}`);
  }

  return {
    id: raw.id,
    title: raw.title,
    status: status ?? 'todo',
    priority: priority ?? 'P2',
    origin: origin ?? 'optional',
    dependsOn: splitList(field('dependsOn')?.value ?? ''),
    files: splitList(field('files')?.value ?? ''),
    acceptance: (field('acceptance')?.value ?? '').trim(),
    line: raw.line,
  };
}

function pickOne<T extends string>(allowed: readonly T[], value: string): T | undefined {
  return allowed.find((item) => item.toLowerCase() === value.toLowerCase());
}

export function validateTasks(tasks: readonly Task[]): TaskProblem[] {
  const problems: TaskProblem[] = [];
  const byId = new Map<string, Task>();

  for (const task of tasks) {
    if (byId.has(task.id)) {
      problems.push({ line: task.line, message: `duplicate task id ${task.id}` });
    } else {
      byId.set(task.id, task);
    }
  }

  for (const task of tasks) {
    for (const dependency of task.dependsOn) {
      if (!byId.has(dependency)) {
        problems.push({ line: task.line, message: `${task.id} depends on unknown task ${dependency}` });
      }
    }
  }

  problems.push(...findCycles(byId));
  return problems;
}

function findCycles(byId: Map<string, Task>): TaskProblem[] {
  const problems: TaskProblem[] = [];
  const visiting = new Set<string>();
  const done = new Set<string>();

  const visit = (id: string, trail: string[]): void => {
    if (done.has(id)) {
      return;
    }
    if (visiting.has(id)) {
      const cycleStart = trail.indexOf(id);
      const cycle = [...trail.slice(cycleStart), id].join(' -> ');
      problems.push({ line: byId.get(id)?.line, message: `dependency cycle: ${cycle}` });
      return;
    }
    const task = byId.get(id);
    if (!task) {
      return;
    }
    visiting.add(id);
    for (const dependency of task.dependsOn) {
      visit(dependency, [...trail, id]);
    }
    visiting.delete(id);
    done.add(id);
  };

  for (const id of byId.keys()) {
    visit(id, []);
  }
  return problems;
}

const PRIORITY_RANK: Record<TaskPriority, number> = { P0: 0, P1: 1, P2: 2, P3: 3 };

// Tasks you can start now: not done or blocked, and every dependency is done.
// Work already in progress comes first, then higher priority, then file order.
export function getReadyTasks(tasks: readonly Task[]): Task[] {
  const statusById = new Map(tasks.map((task) => [task.id, task.status]));
  return tasks
    .filter((task) => task.status === 'todo' || task.status === 'in-progress')
    .filter((task) => task.dependsOn.every((dependency) => statusById.get(dependency) === 'done'))
    .sort((a, b) => {
      const aActive = a.status === 'in-progress' ? 0 : 1;
      const bActive = b.status === 'in-progress' ? 0 : 1;
      return aActive - bActive || PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || a.line - b.line;
    });
}
