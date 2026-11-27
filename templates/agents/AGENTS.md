## Project memory

This project keeps shared context for AI coding agents in `.project-memory/`.

Before you start work:
1. Read `.project-memory/PROJECT.md`, `STATUS.md`, `NEXT.md`, and `SESSION.md`.
2. Run `devkit-ai memory status` to check whether memory matches the repository.
3. Pick a task with `devkit-ai memory next`, or from `.project-memory/NEXT.md`.

While you work:
- Keep `NEXT.md` current. Set a task to `in-progress` when you start it and to `done` when its acceptance criteria pass.
- Set each task's `Origin` to `confirmed` (from the user or a spec), `inferred` (from the code), or `optional`.
- Record significant choices in `DECISIONS.md` and bugs you cannot fix in `KNOWN_ISSUES.md`.
- Never write secrets, tokens, or `.env` contents into any memory file.
- Do not hand-edit sections that DevKit manages. They are wrapped in comments named `devkit:begin` and `devkit:end`, and DevKit rewrites them.

At the end of a session:
1. Run `devkit-ai memory update --summary "<short handoff for the next agent>"`.
2. Run `devkit-ai memory doctor` and fix any errors it reports.
