# Repository Guidelines

## Testbook Policy

Before merge, run and pass:

- `yarn testbook`

This is the mandatory offline gate for core.

## Consumer Compatibility Policy

Before considering core features rollout-ready for web, run and pass:

- `yarn test:tui-compat`

The compatibility gate validates the TUI consumer contract against the current core commit.

## Skill Usage

Prefer invoking `$test-tui` when the task involves cross-repo TUI compatibility validation.
Skill location: `.agents/skills/test-tui/SKILL.md` (mirror: `.codex/skills/test-tui`).

## Rollout Rule

A core change is rollout-ready only when both conditions are true:

1. `yarn testbook` passes.
2. `yarn test:tui-compat` passes.
