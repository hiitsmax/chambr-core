# Chambr Core Testbook

This testbook defines required validation for `@chambr/engine-core` and its TUI/web consumer contracts.

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

## Required Web Consumer Compatibility Gate

Run from `/Users/mx/Documents/Progetti/mine/active/chambr/chambr-core`:

```bash
yarn test:web-compat
```

This command validates that current core changes still pass the web-side contract suite (`chambr` `test:core-compat`).

## Required Harness Gate

Run from `/Users/mx/Documents/Progetti/mine/active/chambr/chambr-core`:

```bash
yarn harness:verify
```

`harness:verify` runs:

1. `yarn testbook`
2. `yarn test:tui-compat`
3. `yarn test:web-compat`

## CI Contract

Three required jobs:

1. `core-testbook`
2. `tui-consumer-compat`
3. `web-consumer-compat`

Core features are not considered rollout-ready for web unless all three pass.

## Artifacts

Generated under `coverage/`:

- `preflight-report.json`
- `junit.xml`
- `vitest-report.json`
- `coverage-summary.json`
- `lcov.info`
- `tui-consumer-compat-report.json`
- `web-consumer-compat-report.json`
- `harness-audit-report.json`
