// Managed blocks are sections that DevKit rewrites. They sit between
// `<!-- devkit:begin NAME -->` and `<!-- devkit:end NAME -->` markers.
// Everything outside the markers belongs to the user and is never touched.

const BLOCK_MARKER_PATTERN = /<!-- devkit:(begin|end) ([a-z0-9-]+) -->/g;

function markersFor(name: string): { begin: string; end: string } {
  return {
    begin: `<!-- devkit:begin ${name} -->`,
    end: `<!-- devkit:end ${name} -->`,
  };
}

export function readManagedBlock(document: string, name: string): string | undefined {
  const { begin, end } = markersFor(name);
  const start = document.indexOf(begin);
  const stop = document.indexOf(end);
  if (start === -1 || stop === -1 || stop < start) {
    return undefined;
  }
  return document.slice(start + begin.length, stop).trim();
}

// Replaces the block's body if the block exists. Otherwise appends a new block.
// Throws on malformed markers so the caller can keep the previous file intact.
export function upsertManagedBlock(document: string, name: string, body: string): string {
  const { begin, end } = markersFor(name);
  const content = body.trim();
  if (content.includes('<!-- devkit:')) {
    throw new Error(`Managed block "${name}" must not contain DevKit markers.`);
  }

  const block = content.length > 0 ? `${begin}\n${content}\n${end}` : `${begin}\n${end}`;
  const start = document.indexOf(begin);
  const stop = document.indexOf(end);

  if (start !== -1 || stop !== -1) {
    if (start === -1 || stop === -1 || stop < start) {
      throw new Error(`Managed block "${name}" has mismatched begin/end markers.`);
    }
    return document.slice(0, start) + block + document.slice(stop + end.length);
  }

  if (document.trim().length === 0) {
    return `${block}\n`;
  }
  const separator = document.endsWith('\n\n') ? '' : document.endsWith('\n') ? '\n' : '\n\n';
  return `${document}${separator}${block}\n`;
}

export interface ManagedBlockProblem {
  name: string;
  message: string;
}

export function findManagedBlockProblems(document: string): ManagedBlockProblem[] {
  const counts = new Map<string, { begin: number; end: number }>();
  for (const match of document.matchAll(BLOCK_MARKER_PATTERN)) {
    const kind = match[1] as 'begin' | 'end';
    const name = match[2] ?? '';
    const entry = counts.get(name) ?? { begin: 0, end: 0 };
    entry[kind] += 1;
    counts.set(name, entry);
  }

  const problems: ManagedBlockProblem[] = [];
  for (const [name, { begin, end }] of counts) {
    if (begin !== 1 || end !== 1) {
      problems.push({
        name,
        message: `expected one begin and one end marker, found ${begin} begin and ${end} end`,
      });
    }
  }
  return problems;
}
