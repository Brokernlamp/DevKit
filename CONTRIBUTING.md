# Contributing to DevKit

Thank you for helping. DevKit is meant to stay small, reliable, and easy to understand, so changes should be focused.

## Ground rules

- Keep changes small and focused on one thing.
- Do not add placeholder modules or features that do not work end to end.
- Never commit secrets, real `.env` files, or generated output (`dist/`, `node_modules/`).
- Keep the CLI thin. Business logic belongs in `src/core/` or `src/modules/`.
- Add tests for behavior you change. Prefer a few clear tests over many small ones.

## Set up

You need Node.js 20 or newer and Git.

1. Fork and clone the repository.
2. Install the dependencies:
   ```bash
   npm install
   ```
3. Check that everything passes:
   ```bash
   npm run typecheck
   npm run build
   npm test
   ```

## Project layout

See [docs/architecture/overview.md](docs/architecture/overview.md). In short:

- `src/cli/`: command definitions and output.
- `src/core/`: shared logic (redaction, managed blocks, stack detection).
- `src/modules/memory/`: Project Memory.
- `templates/`: the Markdown files that `init` creates.
- `tests/unit/` and `tests/integration/`: tests.

## Making a change

1. Create a branch from `main`.
2. Make your change and add or update tests.
3. Run `npm run typecheck`, `npm run build`, and `npm test`.
4. Update the docs if the behavior changed (README, guides, or CHANGELOG).
5. Open a pull request. Fill in the pull request template.

## Commit messages

Use short, clear messages in the imperative mood, for example `Fix doctor exit code for empty NEXT.md`.

## Adding a memory template

Templates live in `templates/memory/`. Keep them short. Any section that DevKit refreshes must be wrapped in `<!-- devkit:begin NAME -->` and `<!-- devkit:end NAME -->` markers, and the body must not contain DevKit markers.

## Reporting bugs and ideas

Use the issue templates on GitHub. For security problems, do not open a public issue. Contact the maintainers privately first.

## License

By contributing, you agree that your work is released under the MIT license in [LICENSE](LICENSE).
