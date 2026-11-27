import { describe, expect, it } from 'vitest';
import {
  findManagedBlockProblems,
  readManagedBlock,
  upsertManagedBlock,
} from '../../src/core/managed-blocks.js';

describe('upsertManagedBlock', () => {
  it('appends a missing block and keeps the text outside it', () => {
    const doc = upsertManagedBlock('# Title\n', 'stack', '- TypeScript');

    expect(doc.startsWith('# Title\n')).toBe(true);
    expect(readManagedBlock(doc, 'stack')).toBe('- TypeScript');
  });

  it('replaces the body in place and is idempotent', () => {
    const first = upsertManagedBlock('# Title\n', 'stack', 'old');
    const second = upsertManagedBlock(first, 'stack', 'new');
    const third = upsertManagedBlock(second, 'stack', 'new');

    expect(readManagedBlock(second, 'stack')).toBe('new');
    expect(second).not.toContain('old');
    expect(third).toBe(second);
  });

  it('refuses a body that contains DevKit markers', () => {
    expect(() => upsertManagedBlock('', 'stack', '<!-- devkit:begin other -->')).toThrow(
      /must not contain DevKit markers/,
    );
  });

  it('throws when the existing markers are mismatched', () => {
    const broken = '<!-- devkit:end stack -->\n<!-- devkit:begin stack -->\n';

    expect(() => upsertManagedBlock(broken, 'stack', 'body')).toThrow(/mismatched/);
  });
});

describe('findManagedBlockProblems', () => {
  it('reports a block that appears twice', () => {
    const doc = upsertManagedBlock('', 'stack', 'a') + '\n<!-- devkit:begin stack -->\n<!-- devkit:end stack -->\n';
    const problems = findManagedBlockProblems(doc);

    expect(problems.map((problem) => problem.name)).toEqual(['stack']);
  });

  it('returns no problems for a well-formed document', () => {
    expect(findManagedBlockProblems(upsertManagedBlock('', 'stack', 'a'))).toEqual([]);
  });
});
