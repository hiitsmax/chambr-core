---
name: harness-ops
description: Run Chambr harness verification and nightly audit workflows for core compatibility and invariant enforcement.
---

# Harness Operations Skill

Use this skill when validating harness gates, compatibility, and invariant coverage.

## Core workflow

1. Run merge gate verification:
   `yarn harness:verify`
2. Run legibility/invariant audit:
   `yarn harness:audit`

## Compatibility checks

- TUI consumer gate: `yarn test:tui-compat`
- Web consumer gate: `yarn test:web-compat`

## Artifacts

- `coverage/tui-consumer-compat-report.json`
- `coverage/web-consumer-compat-report.json`
- `coverage/harness-audit-report.json`
