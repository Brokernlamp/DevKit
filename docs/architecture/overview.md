# Architecture overview

DevKit is a TypeScript command-line tool published as an ES module. It has three layers, and each layer depends only on the layers below it.

```text
cli  ->  modules  ->  core  ->  utils / config
```

## Layers

- **`src/cli/`**: Commander command definitions and output formatting. `runCli()` takes argv and returns an exit code. It never calls `process.exit`, so tests can run it directly. `index.ts` is the only file that touches `process`.
- **`src/modules/`**: features. Version 0.1 has one module, `memory/`.
  - `templates.ts`: loads the templates in `templates/`.
  - `tasks.ts`: parses and validates `NEXT.md` tasks and picks the ready ones.
  - `sync.ts`: plans all changes to memory files and `AGENTS.md` in memory, then applies them. Nothing is written if planning fails.
  - `doctor.ts`: read-only checks.
  - `reports.ts`: data for `status`, `next`, and `show`.
- **`src/core/`**: shared logic with no CLI code.
  - `project-root.ts`: finds the nearest folder with `.project-memory/` or `.git/`.
  - `stack.ts`: reads `package.json` and the README (never `.env`) to describe the project.
  - `redact.ts`: secret patterns. `findSecrets` returns rule names and line numbers only.
  - `managed-blocks.ts`: reads and replaces the sections between DevKit markers.
- **`src/utils/`**: file system helpers (atomic writes) and a read-only git snapshot.
- **`src/config/`**: constants, including the list of paths DevKit owns.

## Key design decisions

1. **Plan, then apply.** `planMemorySync` builds every file in memory first. A broken marker or a failed check stops the run before any file changes.
2. **Managed blocks.** DevKit only rewrites text between its own markers. Everything outside them belongs to the user.
3. **Idempotent output.** Each file is compared with its planned content. Unchanged files are skipped, so repeated runs produce no diffs.
4. **Owned paths are excluded.** The git snapshot and stack detection ignore `.project-memory/` and `AGENTS.md`, so DevKit's own files never make the output unstable.
5. **Local and safe.** No network access. No `.env` reads. Secrets are redacted before writing and never printed.

## Data flow for `memory update`

1. `findProjectRoot` picks the root.
2. `planMemorySync` reads the existing files, detects the stack, takes the git snapshot, and builds the new content.
3. `runMemoryDoctor` and `getMemoryStatus` reuse the same planning step to report stale sections.
4. `applyMemorySync` writes only the files whose content changed.

## Template markers

Generated sections use markers in this form:

```text
<!-- devkit:begin <name> -->
...generated content...
<!-- devkit:end <name> -->
```

Known names are `stack`, `structure`, `important-files`, `git-snapshot`, `changed-files`, `session-summary`, and `agent-instructions`.

## Testing

- `tests/unit/`: pure logic (redaction, managed blocks, task parsing and ordering).
- `tests/integration/`: runs `runCli` against a temporary project.
