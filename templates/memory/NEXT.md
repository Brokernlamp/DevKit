# Next

Work queue for people and AI agents. Each task uses the format below.

<!--
Task format (this comment is ignored by the parser):

### T-001: Short title
- Status: todo | in-progress | done | blocked
- Priority: P0 | P1 | P2 | P3
- Origin: confirmed | inferred | optional
- Depends on: none | T-000, T-002
- Files: src/example.ts
- Acceptance: What "done" means.
-->

### T-001: Review and complete project memory
- Status: todo
- Priority: P2
- Origin: inferred
- Depends on: none
- Files: .project-memory/PROJECT.md
- Acceptance: PROJECT.md describes the purpose, stack, and conventions, and STATUS.md reflects the current state.
