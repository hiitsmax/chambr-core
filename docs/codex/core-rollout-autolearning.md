# Core Rollout Autolearning Notes

## What Changed

- Added `yarn testbook` pipeline and coverage-enabled Vitest config.
- Added v3 contract tests for event parsing/capping and engine fallback/repair behavior.
- Added `scripts/testbook/preflight.mjs` for environment checks.
- Added `scripts/testbook/run-tui-compat.mjs` to enforce consumer compatibility with `chambr-tui`.
- Updated CI to require both `core-testbook` and `tui-consumer-compat`.

## Reliability Learnings

1. Core-only checks are insufficient for rollout safety when consumers have local contract expectations.
2. Keeping compatibility logic in a script (not only in workflow YAML) makes local repro straightforward.
3. Coverage artifacts plus compatibility reports reduce diagnosis time for cross-repo regressions.

## Next Automations

1. Add nightly compatibility matrix (core main vs tui main and latest release tag).
2. Add report diffing to highlight which contract assertions changed.
3. Add optional web-facing consumer snapshot tests once web CI is ready to consume this gate.
