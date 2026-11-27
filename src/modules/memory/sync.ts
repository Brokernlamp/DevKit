import path from 'node:path';
import { AGENTS_FILE, DEVKIT_OWNED_PATHS, MEMORY_DIR } from '../../config/constants.js';
import { readManagedBlock, upsertManagedBlock } from '../../core/managed-blocks.js';
import { redactSecrets } from '../../core/redact.js';
import { detectStack, type StackInfo } from '../../core/stack.js';
import { getGitSnapshot, type GitSnapshot } from '../../utils/git.js';
import { pathExists, readTextIfExists, writeFileAtomic } from '../../utils/fs.js';
import { MEMORY_FILES, readTemplate, type MemoryFile } from './templates.js';

export type SyncMode = 'init' | 'update';

export interface SyncOptions {
  mode: SyncMode;
  summary?: string;
}

export interface PlannedFile {
  path: string;
  absolutePath: string;
  content: string;
  action: 'create' | 'update' | 'unchanged';
}

export interface SyncPlan {
  root: string;
  files: PlannedFile[];
}

const AGENTS_HEADING = '# Agent instructions\n\n';
const AGENTS_BLOCK = 'agent-instructions';
const SUMMARY_BLOCK = 'session-summary';
const NO_SUMMARY = 'No session summary recorded yet.';
const DEFAULT_PURPOSE = 'Describe what this project does and who it is for.';

// Builds every planned file in memory. Nothing is written here, so a malformed
// marker or other error stops the run before any file changes.
export async function planMemorySync(root: string, options: SyncOptions): Promise<SyncPlan> {
  const memoryDir = path.join(root, MEMORY_DIR);
  if (options.mode === 'update' && !(await pathExists(memoryDir))) {
    throw new Error(`No project memory found at ${MEMORY_DIR}/. Run "devkit-ai memory init" first.`);
  }

  const [stack, git] = await Promise.all([
    detectStack(root),
    getGitSnapshot(root, { ignorePaths: DEVKIT_OWNED_PATHS, recentCommitLimit: 5 }),
  ]);

  const files: PlannedFile[] = [];
  for (const name of MEMORY_FILES) {
    const absolutePath = path.join(memoryDir, name);
    const existing = await readTextIfExists(absolutePath);
    const base = existing ?? (await renderNewMemoryFile(name, stack));
    const content = applyMemoryBlocks(name, base, stack, git, options.summary);
    files.push(toPlannedFile(root, absolutePath, existing, content));
  }

  const agentsPath = path.join(root, AGENTS_FILE);
  const existingAgents = await readTextIfExists(agentsPath);
  const agentsBody = await readTemplate('agents/AGENTS.md');
  const agentsContent = upsertManagedBlock(
    existingAgents ?? AGENTS_HEADING,
    AGENTS_BLOCK,
    agentsBody,
  );
  files.push(toPlannedFile(root, agentsPath, existingAgents, agentsContent));

  return { root, files };
}

// Writes only files whose content changed. Returns the files that were written.
export async function applyMemorySync(plan: SyncPlan): Promise<PlannedFile[]> {
  const written: PlannedFile[] = [];
  for (const file of plan.files) {
    if (file.action === 'unchanged') {
      continue;
    }
    await writeFileAtomic(file.absolutePath, file.content);
    written.push(file);
  }
  return written;
}

function toPlannedFile(
  root: string,
  absolutePath: string,
  existing: string | undefined,
  content: string,
): PlannedFile {
  const action = existing === undefined ? 'create' : existing === content ? 'unchanged' : 'update';
  return {
    path: path.relative(root, absolutePath).split(path.sep).join('/'),
    absolutePath,
    content,
    action,
  };
}

async function renderNewMemoryFile(name: MemoryFile, stack: StackInfo): Promise<string> {
  const template = await readTemplate(`memory/${name}`);
  if (name !== 'PROJECT.md') {
    return template;
  }
  const purpose = stack.readmeExcerpt ?? DEFAULT_PURPOSE;
  return template
    .replace('{{PROJECT_NAME}}', () => stack.projectName)
    .replace('{{PURPOSE}}', () => purpose);
}

function applyMemoryBlocks(
  name: MemoryFile,
  base: string,
  stack: StackInfo,
  git: GitSnapshot,
  summary: string | undefined,
): string {
  const bodies: Array<[string, string]> = [];

  if (name === 'PROJECT.md') {
    bodies.push(['stack', renderStack(stack)]);
    bodies.push(['structure', renderStructure(stack)]);
    bodies.push(['important-files', renderImportantFiles(stack)]);
  } else if (name === 'STATUS.md') {
    bodies.push(['git-snapshot', renderGitSnapshot(git)]);
  } else if (name === 'SESSION.md') {
    bodies.push(['changed-files', renderChangedFiles(git)]);
    const summaryBody = summary?.trim() || readManagedBlock(base, SUMMARY_BLOCK) || NO_SUMMARY;
    bodies.push([SUMMARY_BLOCK, summaryBody]);
  }

  return bodies.reduce(
    (content, [block, body]) => upsertManagedBlock(content, block, redactSecrets(body)),
    base,
  );
}

function renderStack(stack: StackInfo): string {
  return [
    `- Languages: ${listOrNone(stack.languages)}`,
    `- Frameworks: ${listOrNone(stack.frameworks)}`,
    `- Package manager: ${stack.packageManager ?? 'none detected'}`,
    `- Manifests: ${listOrNone(stack.manifests)}`,
    `- Scripts: ${listOrNone(stack.scripts)}`,
  ].join('\n');
}

function renderStructure(stack: StackInfo): string {
  if (stack.directories.length === 0) {
    return 'No top-level folders detected.';
  }
  return stack.directories.map((directory) => `- \`${directory}/\``).join('\n');
}

function renderImportantFiles(stack: StackInfo): string {
  return [
    `- Entry points: ${listOrNone(stack.entryPoints)}`,
    `- Documentation: ${listOrNone(stack.documentation)}`,
  ].join('\n');
}

function renderGitSnapshot(git: GitSnapshot): string {
  if (!git.isRepository) {
    return 'Not a Git repository. Git details are unavailable.';
  }
  const lines = [
    `- Branch: ${git.branch ?? 'detached HEAD'}`,
    `- Latest commit: ${git.latestCommit ?? 'none yet'}`,
    `- Uncommitted changes: ${git.changedFiles.length}`,
  ];
  if (git.recentCommits.length > 0) {
    lines.push('- Recent commits:', ...git.recentCommits.map((commit) => `  - ${commit}`));
  }
  return lines.join('\n');
}

function renderChangedFiles(git: GitSnapshot): string {
  if (!git.isRepository) {
    return 'Not a Git repository. Changed files are unavailable.';
  }
  if (git.changedFiles.length === 0) {
    return 'No uncommitted changes outside DevKit files.';
  }
  return git.changedFiles.map((file) => `- \`${file}\``).join('\n');
}

function listOrNone(items: readonly string[]): string {
  return items.length > 0 ? items.join(', ') : 'none detected';
}
