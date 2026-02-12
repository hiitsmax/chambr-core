# Core Harness Rollout ExecPlan

## Goal

Promote `chambr-core` to canonical contract authority and enforce downstream compatibility for TUI and web before rollout.

## Completed Work

- Added canonical contract schemas and fixtures under `contracts/theatrical-v3/`.
- Added schema validation tests in `src/v3/contracts.schema.test.ts` (`INV-CORE-CONTRACT-SCHEMA`).
- Added required consumer gates:
  - `scripts/testbook/run-tui-compat.mjs` (`INV-CORE-TUI-COMPAT`)
  - `scripts/testbook/run-web-compat.mjs` (`INV-CORE-WEB-COMPAT`)
- Added harness scripts in `package.json`:
  - `test:web-compat`
  - `harness:verify`
  - `harness:audit`
- Added CI job `web-consumer-compat` and nightly harness workflow.
- Added harness map/invariants docs and `harness-ops` skill wiring.

## Acceptance

- `yarn harness:verify` passes.
- `yarn harness:audit` passes.
- CI contains required jobs: `core-testbook`, `tui-consumer-compat`, `web-consumer-compat`.
