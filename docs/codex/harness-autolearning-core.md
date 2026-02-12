# Core Harness Autolearning

## What Improved

- Compatibility gates are now executable contracts, not just documentation.
- Core owns canonical fixtures/schemas consumed by both TUI and web.
- Nightly audits keep invariant references from drifting.

## Repeatable Pattern

1. Add invariant ID in `docs/harness/invariants.md`.
2. Add enforcing test/script with same ID in code.
3. Wire invariant into CI and nightly `harness:audit`.
4. Publish failure artifact path in invariants doc.

## Next Iteration

- Add schema version migration tests (v1 -> v2 transition checks).
- Add compat matrix for `main` vs release tag in nightly audits.
