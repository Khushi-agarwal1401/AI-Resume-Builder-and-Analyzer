# Scripts

Utility scripts for development and maintenance. All commands run from the
repository root.

## Conventions

- `.mjs` scripts are plain Node ESM — no build step required.
- Scripts must never require secrets to be hardcoded; read from environment.
- Keep output deterministic so regenerated files produce minimal diffs.
