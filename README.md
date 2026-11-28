# DevKit

DevKit is a small, local-first command-line toolkit that helps AI coding agents (and the people working with them) understand a project quickly and continue work across sessions.

Version 0.1 ships **Project Memory**: a set of plain Markdown files in your repository that describe the project, its current state, and the next steps. Any AI agent that reads `AGENTS.md` can pick up where the last session stopped.

## The problem it solves

- Every new AI agent session starts from zero. It has to rediscover the stack, the layout, and what was going on.
- Handoff notes are scattered across chat logs, tickets, and memory.
- Work lists go stale, and it is unclear what to do next.
- Notes sometimes contain secrets by accident.

DevKit keeps this context in your repository, in files you can read and review, and it never sends your code anywhere.

## Installation

DevKit needs **Node.js 20 or newer** and **Git** (Git is optional, but the status features use it).

### Option A: install from npm

The npm package is named `devkit-ai-cli`. It installs a command called `devkit-ai`.

```bash
npm install -g devkit-ai-cli
devkit-ai --help
```

### Troubleshooting a global install permission error

On macOS or Linux, this error can occur when npm tries to write packages into a system folder:

```text
EACCES: permission denied
```

Do not use `sudo npm install -g`. It can create more permission problems.

Use a folder in your home directory instead:

```bash
mkdir -p ~/.npm-global
npm config set prefix ~/.npm-global
echo 'export PATH="$HOME/.npm-global/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
npm install -g devkit-ai-cli
devkit-ai --help
```

If you use a shell other than Zsh, add this line to that shell's configuration file instead:

```bash
export PATH="$HOME/.npm-global/bin:$PATH"
```

You can also avoid a global install by running DevKit inside a project with:

```bash
npx --package devkit-ai-cli devkit-ai --help
```

### Option B: run from a local copy (step by step)

1. Open a terminal and go to the DevKit folder:
   ```bash
   cd /path/to/devkit
   ```
2. Install the dependencies:
   ```bash
   npm install
   ```
3. Build the CLI:
   ```bash
   npm run build
   ```
4. Make the `devkit-ai` command available on your computer:
   ```bash
   npm link
   ```
5. Check that it works:
   ```bash
   devkit-ai --help
   ```

To remove the link later, run `npm unlink -g devkit-ai-cli` from the same folder.

## Quick start

Run these commands in the root of any project (it does not have to be a DevKit project):

```bash
cd /path/to/your-project
devkit-ai memory init        # create the memory files and AGENTS.md
devkit-ai memory doctor      # check that everything is correct
devkit-ai memory next        # see the tasks that are ready to start
```

Then commit the new files so every teammate and every agent can use them:

```bash
git add AGENTS.md .project-memory
git commit -m "Add project memory"
```

## Commands

| Command | What it does |
| --- | --- |
| `devkit-ai memory init` | Creates `.project-memory/` and `AGENTS.md`. Safe to run again. Your own text is kept. |
| `devkit-ai memory update [--summary "<text>"]` | Refreshes the generated sections (stack, structure, git state, changed files). With `--summary`, it saves a handoff note in `SESSION.md`. |
| `devkit-ai memory status` | Shows whether memory exists, the git branch, uncommitted changes, task counts, and the next task. |
| `devkit-ai memory next` | Lists tasks that are ready to start, in order of status and priority. |
| `devkit-ai memory doctor` | Checks memory files for missing files, broken markers, bad tasks, possible secrets, and stale sections. Exits with `1` when it finds errors. |
| `devkit-ai memory show [file]` | Prints one memory file (for example `NEXT.md`), or all of them. |

Output uses `[PASS]`, `[WARN]`, `[FAIL]`, and `[INFO]` labels.

## What gets created

```text
AGENTS.md                      Instructions that any AI agent reads first
.project-memory/
  PROJECT.md                   Purpose, stack, structure, important files, conventions
  STATUS.md                    Current state and git snapshot
  NEXT.md                      Task queue with checklists
  DECISIONS.md                 Decisions and the reasons behind them
  SESSION.md                   Latest handoff summary and changed files
  KNOWN_ISSUES.md              Known problems that are not yet fixed
```

Your files are never overwritten as a whole. DevKit only changes the sections it manages, which are wrapped in markers like `<!-- devkit:begin stack -->` and `<!-- devkit:end stack -->`. Anything you write outside those markers stays as it is.

## Writing tasks in NEXT.md

Each task is a heading followed by a short list:

```markdown
### T-002: Add login form
- Status: todo | in-progress | done | blocked
- Priority: P0 | P1 | P2 | P3
- Origin: confirmed | inferred | optional
- Depends on: none | T-001
- Files: src/login.tsx
- Acceptance: What "done" means.
```

`devkit-ai memory next` only shows tasks that are `todo` or `in-progress` and whose dependencies are `done`. `doctor` flags unknown IDs, duplicate IDs, and dependency cycles.

## Safety

- **Local only.** DevKit reads and writes files on your machine. It does not send anything over the network.
- **No secrets.** DevKit never reads `.env` files. It redacts common secret patterns (API keys, tokens, private keys) before writing, and `doctor` reports the line number of anything that looks like a secret. It never prints the value.
- **Idempotent.** Running `init` or `update` twice with no changes reports "up to date" and writes nothing.
- **Atomic.** Files are written through a temporary file and then renamed, so a failure does not leave half-written files.

## Supported environments

| Item | Supported |
| --- | --- |
| Node.js | 20 and 22 |
| Operating systems | macOS, Linux, Windows (tested in CI) |
| AI agents | Any agent that reads `AGENTS.md` |
| Project types | Any folder. Stack detection is best for JavaScript and TypeScript projects with `package.json`. |

## Architecture

```text
src/
  cli/           Commander wiring and output (no business logic)
  core/          Shared logic: project root, stack detection, redaction, managed blocks
  modules/memory/ Project Memory: templates, tasks, sync, doctor, reports
  utils/         File system and git helpers
  config/        Constants and package info
templates/       Markdown templates used by init
tests/           Unit and integration tests
```

Read more in [docs/architecture/overview.md](docs/architecture/overview.md).

## Examples

See [docs/guides/usage.md](docs/guides/usage.md) for step-by-step examples, including a handoff at the end of a session.

## Roadmap

- **v0.1 (this release): Project Memory.** `init`, `update`, `status`, `next`, `doctor`, `show`.
- **Later:** more modules, such as a richer context pack for agents and a Model Context Protocol (MCP) server. Each module will ship only when it works end to end.

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) first. Please keep changes small and focused, and run the tests before you open a pull request.

## License

MIT. See [LICENSE](LICENSE).
