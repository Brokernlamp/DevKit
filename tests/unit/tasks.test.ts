import { describe, expect, it } from 'vitest';
import { getReadyTasks, parseTasks, validateTasks, type Task } from '../../src/modules/memory/tasks.js';

function taskBlock(id: string, fields: Partial<Record<string, string>> = {}): string {
  const values = {
    Status: 'todo',
    Priority: 'P2',
    Origin: 'confirmed',
    'Depends on': 'none',
    Files: 'src/a.ts',
    Acceptance: 'It works.',
    ...fields,
  };
  const lines = Object.entries(values).map(([key, value]) => `- ${key}: ${value}`);
  return [`### ${id}: Task ${id}`, ...lines, ''].join('\n');
}

function makeTask(overrides: Partial<Task> & { id: string }): Task {
  return {
    title: overrides.id,
    status: 'todo',
    priority: 'P2',
    origin: 'confirmed',
    dependsOn: [],
    files: [],
    acceptance: 'done',
    line: 1,
    ...overrides,
  };
}

describe('parseTasks', () => {
  it('ignores the format example inside an HTML comment', () => {
    const text = ['<!--', taskBlock('T-000', { Status: 'blocked' }), '-->', taskBlock('T-001')].join('\n');
    const report = parseTasks(text);

    expect(report.tasks.map((task) => task.id)).toEqual(['T-001']);
    expect(report.problems).toEqual([]);
  });

  it('reports an invalid status and falls back to the default', () => {
    const report = parseTasks(taskBlock('T-001', { Status: 'maybe' }));

    expect(report.tasks[0]?.status).toBe('todo');
    expect(report.problems.some((problem) => problem.message.includes('Status'))).toBe(true);
  });
});

describe('validateTasks', () => {
  it('finds duplicate IDs, unknown dependencies and cycles', () => {
    const problems = validateTasks([
      makeTask({ id: 'T-001' }),
      makeTask({ id: 'T-001' }),
      makeTask({ id: 'T-002', dependsOn: ['T-999'] }),
      makeTask({ id: 'T-003', dependsOn: ['T-004'] }),
      makeTask({ id: 'T-004', dependsOn: ['T-003'] }),
    ]);
    const messages = problems.map((problem) => problem.message).join('\n');

    expect(messages).toMatch(/duplicate/i);
    expect(messages).toContain('T-999');
    expect(messages).toMatch(/cycle/i);
  });
});

describe('getReadyTasks', () => {
  it('skips tasks with unfinished dependencies and puts in-progress tasks first', () => {
    const ready = getReadyTasks([
      makeTask({ id: 'T-001', priority: 'P0', dependsOn: ['T-003'] }),
      makeTask({ id: 'T-002', priority: 'P2' }),
      makeTask({ id: 'T-003', status: 'blocked' }),
      makeTask({ id: 'T-004', status: 'in-progress', priority: 'P3' }),
    ]);

    expect(ready.map((task) => task.id)).toEqual(['T-004', 'T-002']);
  });
});
