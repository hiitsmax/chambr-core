---
name: test-tui
description: Validate chambr-core compatibility with chambr-tui using the required consumer contract gate.
---

# Core-to-TUI Compatibility Skill

Use this skill when verifying that changes in `chambr-core` are safe for `chambr-tui` consumers.

## Default workflow

1. Run core offline gate:
   `yarn testbook`
2. Run TUI compatibility gate:
   `yarn test:tui-compat`

## Expected setup

The TUI repo should be available as sibling path `../chambr-tui`.

You can override with:

- `TUI_REPO_PATH=/absolute/path/to/chambr-tui yarn test:tui-compat`

## Output artifact

Compatibility report:

- `coverage/tui-consumer-compat-report.json`
