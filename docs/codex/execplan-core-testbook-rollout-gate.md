# Core Testbook + TUI Consumer Rollout Gate

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

This document follows execution-plan requirements from `~/.agents/PLANS.md`.

## Purpose / Big Picture

After this change, `chambr-core` has a complete self-test workflow and a required compatibility gate against `chambr-tui`, ensuring core features do not move toward web rollout if consumer contracts break.

## Progress

- [x] (2026-02-12 20:38Z) Added core testbook scripts and Vitest CI config.
- [x] (2026-02-12 20:40Z) Added core v3 contract tests for events and engine fallback/repair behavior.
- [x] (2026-02-12 20:41Z) Added testbook preflight and TUI compatibility runner scripts.
- [x] (2026-02-12 20:42Z) Replaced CI with required `core-testbook` and `tui-consumer-compat` jobs.
- [ ] Run local validation after dependency install and lock updates.

## Surprises & Discoveries

- Observation: core previously had no automated test suite configured.
  Evidence: `package.json` lacked `test` scripts and CI only ran lint/build.

- Observation: compatibility gate requires explicit sibling checkout of `chambr-tui`.
  Evidence: `chambr-tui` depends on sibling core path and runs consumer contract tests against local core commit.

## Decision Log

- Decision: Keep compatibility runner in core repo (`scripts/testbook/run-tui-compat.mjs`) instead of embedding shell-only logic in workflow.
  Rationale: local and CI execution paths stay identical and easier to debug.
  Date/Author: 2026-02-12 / Codex

- Decision: Make compatibility gate required for merge.
  Rationale: user requirement explicitly blocks rollout when core breaks TUI contract.
  Date/Author: 2026-02-12 / Codex

## Outcomes & Retrospective

Core now enforces both internal correctness and downstream compatibility, reducing regression risk before web rollout.

## Context and Orientation

- Core v3 runtime logic: `src/v3/engine.ts`, `src/v3/events.ts`
- Testbook scripts: `scripts/testbook/*`
- CI enforcement: `.github/workflows/ci.yml`

## Plan of Work

Add deterministic contract tests, then wire testbook scripts and compatibility runner, then enforce both in CI.

## Concrete Steps

From `/Users/mx/Documents/Progetti/mine/active/chambr/chambr-core`:

1. `yarn install`
2. `yarn testbook`
3. `yarn test:tui-compat`

## Validation and Acceptance

Acceptance criteria:

1. `yarn testbook` passes.
2. `yarn test:tui-compat` passes against sibling `chambr-tui`.
3. CI blocks merges when either required job fails.

## Idempotence and Recovery

All steps are repeatable. On compatibility failures, inspect `coverage/tui-consumer-compat-report.json` and rerun `yarn test:tui-compat` after fixes.

## Artifacts and Notes

Key artifact files:

- `coverage/preflight-report.json`
- `coverage/tui-consumer-compat-report.json`

## Interfaces and Dependencies

New/updated dev dependencies:

- `vitest`
- `@vitest/coverage-v8`

Revision note (2026-02-12): created for the full core testbook and rollout compatibility gate implementation.
