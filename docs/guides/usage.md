# Usage guide

This guide shows common tasks with Project Memory. Each step is a command you can copy into a terminal. Run them from the root of your project.

## Start DevKit in an ongoing project

From the project's root:

```bash
cd /path/to/your-project
devkit-ai memory init
devkit-ai memory status
devkit-ai memory doctor
```

Open the project in an AI coding agent and ask it to:

```text
Read AGENTS.md and all files in .project-memory/.
Populate the memory from the existing code and documentation.
Do not invent work or decisions.
Add accurate tasks to NEXT.md and confirmed choices to DECISIONS.md.
Update SESSION.md with the current handoff.
Do not edit DevKit-managed sections marked devkit:begin/devkit:end.
Never include secret values.
Then run devkit-ai memory update --summary "Populated project memory", devkit-ai memory doctor, and devkit-ai memory status.
```

## Example 1: Set up memory in a new project

```bash
cd /path/to/your-project
devkit-ai memory init
```

You will see which files were created. Open `.project-memory/PROJECT.md` and replace the `Add team conventions here` text with your real conventions. DevKit keeps your text when it refreshes the rest.

Check the result:

```bash
devkit-ai memory doctor
```

## Example 2: Add your first tasks

Open `.project-memory/NEXT.md` and add a task at the bottom:

```markdown
### T-002: Add a login form
- Status: todo
- Priority: P1
- Origin: confirmed
- Depends on: T-001
- Files: src/login.tsx
- Acceptance: The form submits and shows errors for empty fields.
```

Then see which tasks are ready:

```bash
devkit-ai memory next
```

## Example 3: End a session with a handoff

When you finish working, record a short summary so the next session (or the next agent) knows where to continue:

```bash
devkit-ai memory update --summary "Finished the login form layout. Next: wire up validation (T-002)."
devkit-ai memory doctor
```

Then commit the change:

```bash
git add .project-memory AGENTS.md
git commit -m "Update project memory"
```

## Example 4: Start a new session

1. Open the project in your AI coding agent. The agent reads `AGENTS.md` first.
2. Ask it to read `.project-memory/STATUS.md`, `NEXT.md`, and `SESSION.md`.
3. Or run this yourself to see the current state:
   ```bash
   devkit-ai memory status
   devkit-ai memory show SESSION.md
   ```

## Example 5: Check the memory after a refactor

```bash
devkit-ai memory update
devkit-ai memory doctor
```

If `doctor` warns that a section is stale, `update` will refresh it. If it reports a `[FAIL]` line for a secret, remove the value from the file, then run `doctor` again. Do not paste the secret into any memory file.

## Example 6: Fix a broken marker

If `doctor` reports a managed block with mismatched markers, open the file and check that each `<!-- devkit:begin NAME -->` has exactly one matching `<!-- devkit:end NAME -->`. Then run:

```bash
devkit-ai memory update
```

## Troubleshooting

| Message | What to do |
| --- | --- |
| `No project memory found at .project-memory/. Run "devkit-ai memory init" first.` | Run `devkit-ai memory init` in the project root. |
| `Unknown memory file "X"` | Use one of the names listed in the message, for example `NEXT.md`. |
| `T-00X depends on unknown task` | Fix the ID in `Depends on`, or add the missing task. |
| `may contain a secret` | Remove the value from the file and use an environment variable or your secret store instead. |
