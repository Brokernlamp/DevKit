# Agent instructions for DevKit

This file guides AI coding agents that work on the DevKit repository itself.

## Before you change code

1. Read [README.md](README.md) and [docs/architecture/overview.md](docs/architecture/overview.md).
2. Keep the layers separate: `src/cli` only wires commands and prints output. Logic goes in `src/core` or `src/modules`.
3. Do not add placeholder modules or features that do not work end to end.

## Checks to run before you finish

```bash
npm run typecheck
npm run build
npm test
```

## Rules

- Never commit secrets, `.env` files, or generated output (`dist/`, `node_modules/`).
- Do not change the `devkit:begin` and `devkit:end` marker format without updating `src/core/managed-blocks.ts`, its tests, and the docs.
- Keep output labels (`[PASS]`, `[WARN]`, `[FAIL]`, `[INFO]`) consistent across commands.
- Update README, guides, or CHANGELOG when behavior changes.
