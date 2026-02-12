# Repository Guidelines

## Testbook Policy

Before merge, run and pass:

- `yarn harness:verify`

`yarn harness:verify` is the mandatory offline gate for core and includes:

- `yarn testbook`
- `yarn test:tui-compat`
- `yarn test:web-compat`

## Consumer Compatibility Policy

Before considering core features rollout-ready for web, run and pass:

- `yarn test:tui-compat`
- `yarn test:web-compat`

Compatibility gates validate TUI and web consumer contracts against the current core commit.

## Harness Policy

- If you make the same architecture decision twice, codify it in docs/invariants/tests.
- Run nightly legibility checks with `yarn harness:audit`.
- Triage nightly `harness-audit` issue updates and keep invariants actionable.

## Skill Usage

Prefer invoking `$test-tui` when the task involves cross-repo TUI compatibility validation.
Skill location: `.agents/skills/test-tui/SKILL.md` (mirror: `.codex/skills/test-tui`).
Prefer invoking `$harness-ops` for invariant audits and cross-repo harness verification.
Skill location: `.agents/skills/harness-ops/SKILL.md` (mirror: `.codex/skills/harness-ops`).

## Rollout Rule

A core change is rollout-ready only when all conditions are true:

1. `yarn harness:verify` passes.
2. `yarn test:tui-compat` passes.
3. `yarn test:web-compat` passes.
