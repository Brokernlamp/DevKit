import { execFile } from 'node:child_process';

export interface GitSnapshot {
  isRepository: boolean;
  branch?: string;
  latestCommit?: string;
  changedFiles: string[];
  recentCommits: string[];
}

export interface GitSnapshotOptions {
  // Path prefixes (ending in "/") or exact paths to leave out of changedFiles.
  ignorePaths?: readonly string[];
  recentCommitLimit?: number;
}

// Reads Git state with fixed arguments. Never uses a shell.
// Returns an empty snapshot when Git is missing or the folder is not a repository.
export async function getGitSnapshot(
  cwd: string,
  options: GitSnapshotOptions = {},
): Promise<GitSnapshot> {
  const inside = await runGit(cwd, ['rev-parse', '--is-inside-work-tree']);
  if (inside?.trim() !== 'true') {
    return { isRepository: false, changedFiles: [], recentCommits: [] };
  }

  const commitLimit = options.recentCommitLimit ?? 10;
  const [branch, latestCommit, status, log] = await Promise.all([
    runGit(cwd, ['symbolic-ref', '--short', '-q', 'HEAD']),
    runGit(cwd, ['rev-parse', '--short', 'HEAD']),
    runGit(cwd, ['status', '--porcelain']),
    runGit(cwd, ['log', `-n${commitLimit}`, '--format=%h %s']),
  ]);

  const ignorePaths = options.ignorePaths ?? [];
  const changedFiles = lines(status)
    .map((line) => line.slice(3))
    .filter((filePath) => !isIgnored(filePath, ignorePaths));

  return {
    isRepository: true,
    branch: branch?.trim() || undefined,
    latestCommit: latestCommit?.trim() || undefined,
    changedFiles,
    recentCommits: lines(log),
  };
}

function isIgnored(filePath: string, ignorePaths: readonly string[]): boolean {
  return ignorePaths.some((ignored) =>
    ignored.endsWith('/') ? filePath.startsWith(ignored) : filePath === ignored,
  );
}

function lines(output: string | undefined): string[] {
  return (output ?? '')
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0);
}

function runGit(cwd: string, args: string[]): Promise<string | undefined> {
  return new Promise((resolve) => {
    execFile(
      'git',
      args,
      { cwd, maxBuffer: 1024 * 1024, windowsHide: true },
      (error, stdout) => resolve(error ? undefined : stdout),
    );
  });
}
