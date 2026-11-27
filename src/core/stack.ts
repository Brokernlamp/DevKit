import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { DEVKIT_OWNED_PATHS } from '../config/constants.js';
import { readTextIfExists, pathExists, listDirectories } from '../utils/fs.js';
import { redactSecrets } from './redact.js';

export interface StackInfo {
  projectName: string;
  languages: string[];
  frameworks: string[];
  packageManager?: string;
  scripts: string[];
  manifests: string[];
  entryPoints: string[];
  directories: string[];
  documentation: string[];
  readmeExcerpt?: string;
}

interface PackageJsonInfo {
  name?: string;
  main?: string;
  bin: string[];
  scripts: string[];
  dependencies: string[];
}

const MANIFEST_FILES = [
  'package.json',
  'tsconfig.json',
  'pyproject.toml',
  'requirements.txt',
  'setup.py',
  'go.mod',
  'Cargo.toml',
  'pom.xml',
  'build.gradle',
  'build.gradle.kts',
  'Gemfile',
  'composer.json',
];

const LOCKFILES: ReadonlyArray<readonly [string, string]> = [
  ['pnpm-lock.yaml', 'pnpm'],
  ['yarn.lock', 'yarn'],
  ['bun.lockb', 'bun'],
  ['bun.lock', 'bun'],
  ['package-lock.json', 'npm'],
];

const JS_FRAMEWORKS: ReadonlyArray<readonly [string, string]> = [
  ['react', 'React'],
  ['next', 'Next.js'],
  ['vue', 'Vue'],
  ['svelte', 'Svelte'],
  ['@angular/core', 'Angular'],
  ['express', 'Express'],
  ['fastify', 'Fastify'],
  ['@nestjs/core', 'NestJS'],
  ['vite', 'Vite'],
  ['electron', 'Electron'],
  ['tailwindcss', 'Tailwind CSS'],
];

const PYTHON_FRAMEWORKS: ReadonlyArray<readonly [string, string]> = [
  ['django', 'Django'],
  ['flask', 'Flask'],
  ['fastapi', 'FastAPI'],
];

const DOCUMENTATION_FILES = [
  'README.md',
  'CONTRIBUTING.md',
  'CHANGELOG.md',
  'LICENSE',
  'AGENTS.md',
  'CLAUDE.md',
  '.cursorrules',
  '.github/copilot-instructions.md',
];

const ENTRY_POINT_CANDIDATES = [
  'src/index.ts',
  'src/index.tsx',
  'src/index.js',
  'src/main.ts',
  'src/main.tsx',
  'src/App.tsx',
  'index.ts',
  'index.js',
  'server.js',
  'server.ts',
  'main.py',
  'app.py',
  'main.go',
  'src/main.rs',
];

const IGNORED_DIRECTORIES = new Set([
  'node_modules',
  'dist',
  'build',
  'out',
  'coverage',
  'target',
  'vendor',
  '__pycache__',
]);

const MAX_LISTED_DIRECTORIES = 30;

export async function detectStack(root: string): Promise<StackInfo> {
  const manifests = await existingFiles(root, MANIFEST_FILES);
  const packageJson = manifests.includes('package.json')
    ? parsePackageJson(await readTextIfExists(path.join(root, 'package.json')))
    : undefined;
  const dependencies = packageJson?.dependencies ?? [];
  const isTypeScript = manifests.includes('tsconfig.json') || dependencies.includes('typescript');

  const pythonText = (
    await Promise.all(
      ['pyproject.toml', 'requirements.txt'].map((file) =>
        readTextIfExists(path.join(root, file)),
      ),
    )
  )
    .join('\n')
    .toLowerCase();

  return {
    projectName: packageJson?.name ?? path.basename(root),
    languages: detectLanguages(manifests, isTypeScript, packageJson !== undefined),
    frameworks: [
      ...JS_FRAMEWORKS.filter(([dep]) => dependencies.includes(dep)).map(([, label]) => label),
      ...PYTHON_FRAMEWORKS.filter(([dep]) => pythonText.includes(dep)).map(([, label]) => label),
    ],
    packageManager: await detectPackageManager(root, packageJson !== undefined),
    scripts: packageJson?.scripts ?? [],
    manifests,
    entryPoints: await detectEntryPoints(root, packageJson),
    directories: (await listDirectories(root))
      .filter((name) => !name.startsWith('.') && !IGNORED_DIRECTORIES.has(name))
      .sort()
      .slice(0, MAX_LISTED_DIRECTORIES),
    documentation: (await existingFiles(root, [...DOCUMENTATION_FILES, ...(await docsFiles(root))])).filter(
      (file) => !DEVKIT_OWNED_PATHS.some((owned) => file === owned || file.startsWith(owned)),
    ),
    readmeExcerpt: await readReadmeExcerpt(root),
  };
}

function detectLanguages(manifests: string[], isTypeScript: boolean, hasPackageJson: boolean): string[] {
  const languages: string[] = [];
  if (isTypeScript) {
    languages.push('TypeScript');
  } else if (hasPackageJson) {
    languages.push('JavaScript');
  }
  const byManifest: ReadonlyArray<readonly [string[], string]> = [
    [['pyproject.toml', 'requirements.txt', 'setup.py'], 'Python'],
    [['go.mod'], 'Go'],
    [['Cargo.toml'], 'Rust'],
    [['pom.xml', 'build.gradle', 'build.gradle.kts'], 'Java'],
    [['Gemfile'], 'Ruby'],
    [['composer.json'], 'PHP'],
  ];
  for (const [files, language] of byManifest) {
    if (files.some((file) => manifests.includes(file))) {
      languages.push(language);
    }
  }
  return languages;
}

async function detectPackageManager(root: string, hasPackageJson: boolean): Promise<string | undefined> {
  for (const [lockfile, manager] of LOCKFILES) {
    if (await pathExists(path.join(root, lockfile))) {
      return manager;
    }
  }
  return hasPackageJson ? 'not detected (no lockfile found)' : undefined;
}

async function detectEntryPoints(root: string, packageJson: PackageJsonInfo | undefined): Promise<string[]> {
  const declared = [packageJson?.main, ...(packageJson?.bin ?? [])].filter(
    (entry): entry is string => Boolean(entry),
  );
  const found = await existingFiles(root, ENTRY_POINT_CANDIDATES);
  return [...new Set([...declared, ...found])];
}

async function docsFiles(root: string): Promise<string[]> {
  try {
    const entries = await readdir(path.join(root, 'docs'), { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
      .map((entry) => `docs/${entry.name}`);
  } catch {
    return [];
  }
}

async function readReadmeExcerpt(root: string): Promise<string | undefined> {
  const text = await readTextIfExists(path.join(root, 'README.md'));
  if (!text) {
    return undefined;
  }

  const paragraph: string[] = [];
  let inCodeBlock = false;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) {
      continue;
    }
    const isSkippable =
      line.startsWith('#') || line.startsWith('![') || line.startsWith('[![') || line.startsWith('<');
    if (line.length === 0 || isSkippable) {
      if (paragraph.length > 0) {
        break;
      }
      continue;
    }
    paragraph.push(line);
  }

  const excerpt = paragraph.join(' ');
  if (excerpt.length === 0) {
    return undefined;
  }
  const shortened = excerpt.length > 300 ? `${excerpt.slice(0, 297)}...` : excerpt;
  return redactSecrets(shortened);
}

function parsePackageJson(text: string | undefined): PackageJsonInfo | undefined {
  if (text === undefined) {
    return undefined;
  }
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return undefined;
  }
  if (!isRecord(data)) {
    return undefined;
  }

  const bin = data.bin;
  const binEntries =
    typeof bin === 'string' ? [bin] : isRecord(bin) ? Object.values(bin).filter(isString) : [];

  return {
    name: isString(data.name) ? data.name : undefined,
    main: isString(data.main) ? data.main : undefined,
    bin: binEntries,
    scripts: isRecord(data.scripts) ? Object.keys(data.scripts) : [],
    dependencies: [
      ...(isRecord(data.dependencies) ? Object.keys(data.dependencies) : []),
      ...(isRecord(data.devDependencies) ? Object.keys(data.devDependencies) : []),
    ],
  };
}

async function existingFiles(root: string, files: readonly string[]): Promise<string[]> {
  const checks = await Promise.all(
    files.map(async (file) => ((await pathExists(path.join(root, file))) ? file : undefined)),
  );
  return checks.filter((file): file is string => file !== undefined);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}
