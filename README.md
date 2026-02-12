# @chambr/engine-core

Core runtime engine for Chambr rooms.

## Install

```bash
yarn add @chambr/engine-core@git+https://github.com/hiitsmax/chambr-core.git#v0.1.1
```

## Development

```bash
yarn install
yarn testbook
yarn test:tui-compat
```

Core commands:

```bash
yarn testbook:preflight
yarn lint
yarn test:ci
yarn build
```

## Release (manual)

1. Bump `version` in `package.json`.
2. Commit and push to `main`.
3. Create and push a git tag `vX.Y.Z`.
4. Consumers update dependency ref to the new tag.
