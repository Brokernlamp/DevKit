# Changelog

All notable changes to this project are listed here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/).

## [0.1.0] - Unreleased

### Added

- `devkit-ai memory init`: creates `.project-memory/` (PROJECT, STATUS, NEXT, DECISIONS, SESSION, KNOWN_ISSUES) and a cross-agent `AGENTS.md`. Safe to run again.
- `devkit-ai memory update [--summary]`: refreshes generated sections and stores a session handoff summary.
- `devkit-ai memory status`: shows memory state, git state, task counts, and the next task.
- `devkit-ai memory next`: lists tasks that are ready to start.
- `devkit-ai memory doctor`: checks memory files and exits with `1` on errors.
- `devkit-ai memory show [file]`: prints one or all memory files.
- Secret redaction for generated content, and secret detection in `doctor` that never prints values.
- Atomic file writes and managed, idempotently updated sections.
- Unit and integration tests (Vitest) and GitHub Actions CI.
