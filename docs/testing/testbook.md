# Chambr Core Testbook

This testbook defines required validation for `@chambr/engine-core` and its TUI consumer contract.

## Required Core Pipeline

Run from `/Users/mx/Documents/Progetti/mine/active/chambr/chambr-core`:

```bash
yarn testbook
```

`testbook` runs:

1. `yarn testbook:preflight`
2. `yarn lint`
3. `yarn test:ci`
4. `yarn build`

## Required TUI Consumer Compatibility Gate

Run from `/Users/mx/Documents/Progetti/mine/active/chambr/chambr-core`:

```bash
yarn test:tui-compat
```

This command validates that current core changes still pass the TUI-side contract suite (`chambr-tui` `test:core-compat`).

## CI Contract

Two required jobs:

1. `core-testbook`
2. `tui-consumer-compat`

Core features are not considered rollout-ready for web unless both pass.

## Artifacts

Generated under `coverage/`:

- `preflight-report.json`
- `junit.xml`
- `vitest-report.json`
- `coverage-summary.json`
- `lcov.info`
- `tui-consumer-compat-report.json`
