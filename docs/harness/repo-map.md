# Chambr Core Harness Repo Map

## Runtime Core

- `src/v3/engine.ts`: theatrical v3 turn execution and fallback/repair logic.
- `src/v3/events.ts`: event parsing, sanitization, and budget capping.
- `src/v3/types.ts`: public v3 contract types.

## Canonical Contracts

- `contracts/theatrical-v3/events.schema.json`: canonical event schema for consumers.
- `contracts/theatrical-v3/run-envelope.schema.json`: canonical run envelope schema for consumers.
- `contracts/theatrical-v3/fixtures/*.json`: baseline fixtures used by core and consumer tests.

## Harness and Compatibility

- `scripts/testbook/preflight.mjs`: local/CI preflight checks.
- `scripts/testbook/run-tui-compat.mjs`: required TUI compatibility gate.
- `scripts/testbook/run-web-compat.mjs`: required web compatibility gate.
- `scripts/harness/nightly-audit.mjs`: legibility/invariant nightly audit.

## CI Entry Points

- `.github/workflows/ci.yml`: required merge gates.
- `.github/workflows/harness-nightly.yml`: scheduled harness audit and reporting.
