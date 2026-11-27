import { mkdtemp, mkdir, readFile, rm, writeFile, access } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { runCli } from '../../src/cli/program.js';

const SECRET_ENV = 'DEVKIT_TEST_SECRET=supersecretvalue123';

interface CliRun {
  code: number;
  out: string;
  err: string;
}

let root: string;

async function run(...args: string[]): Promise<CliRun> {
  let out = '';
  let err = '';
  const code = await runCli(args, {
    cwd: root,
    stdout: (text) => {
      out += text;
    },
    stderr: (text) => {
      err += text;
    },
  });
  return { code, out, err };
}

async function exists(relPath: string): Promise<boolean> {
  return access(path.join(root, relPath)).then(
    () => true,
    () => false,
  );
}

beforeEach(async () => {
  root = await mkdtemp(path.join(os.tmpdir(), 'devkit-test-'));
  await writeFile(path.join(root, 'package.json'), JSON.stringify({ name: 'demo-app', scripts: { test: 'vitest' } }));
  await writeFile(path.join(root, 'README.md'), '# Demo\n\nA small demo app.\n');
  await writeFile(path.join(root, '.env'), `${SECRET_ENV}\n`);
  await mkdir(path.join(root, 'src'));
  await writeFile(path.join(root, 'src', 'index.ts'), 'export {};\n');
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe('memory init', () => {
  it('creates memory files, keeps the README, and never copies .env values', async () => {
    const result = await run('memory', 'init');

    expect(result.code).toBe(0);
    expect(await exists('.project-memory/NEXT.md')).toBe(true);
    expect(await exists('AGENTS.md')).toBe(true);
    expect(await readFile(path.join(root, 'README.md'), 'utf8')).toBe('# Demo\n\nA small demo app.\n');

    const written = await readFile(path.join(root, '.project-memory', 'PROJECT.md'), 'utf8');
    expect(written).toContain('A small demo app.');
    expect(written).not.toContain('supersecretvalue123');
  });

  it('reports no changes when run a second time', async () => {
    await run('memory', 'init');
    const second = await run('memory', 'init');

    expect(second.code).toBe(0);
    expect(second.out).toMatch(/up to date/);
  });
});

describe('memory update', () => {
  it('fails when memory has not been initialized', async () => {
    const result = await run('memory', 'update');

    expect(result.code).toBe(1);
    expect(result.err).toContain('[FAIL]');
  });
});

describe('memory doctor', () => {
  it('exits 1 and hides the value when NEXT.md contains a secret', async () => {
    await run('memory', 'init');
    const nextPath = path.join(root, '.project-memory', 'NEXT.md');
    const original = await readFile(nextPath, 'utf8');
    await writeFile(nextPath, `${original}\nclient_token = abcdef123456789\n`);

    const result = await run('memory', 'doctor');

    expect(result.code).toBe(1);
    expect(result.out).toContain('may contain a secret');
    expect(result.out).not.toContain('abcdef123456789');
  });
});

describe('memory next', () => {
  it('lists the seeded task as ready to start', async () => {
    await run('memory', 'init');
    const result = await run('memory', 'next');

    expect(result.code).toBe(0);
    expect(result.out).toContain('T-001');
  });
});
