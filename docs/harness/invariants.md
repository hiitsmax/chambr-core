# Chambr Core Harness Invariants

## INV-CORE-CONTRACT-SCHEMA

Canonical v3 fixtures and runtime outputs must validate against core-owned schemas.

- Enforced by: `src/v3/contracts.schema.test.ts`
- CI job: `core-testbook`
- Failure artifact: `coverage/junit.xml`, `coverage/vitest-report.json`

## INV-CORE-TUI-COMPAT

Changes in `chambr-core` must not break TUI consumer compatibility.

- Enforced by: `scripts/testbook/run-tui-compat.mjs`
- CI job: `tui-consumer-compat`
- Failure artifact: `coverage/tui-consumer-compat-report.json`

## INV-CORE-WEB-COMPAT

Changes in `chambr-core` must not break web consumer compatibility.

- Enforced by: `scripts/testbook/run-web-compat.mjs`
- CI job: `web-consumer-compat`
- Failure artifact: `coverage/web-consumer-compat-report.json`
