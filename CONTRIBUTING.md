# Contributing to pyRPC

Thank you for considering contributing to pyRPC. This guide will help you get started.

## Development Setup

### Prerequisites

- **Python** >= 3.11
- **Node.js** >= 20
- **npm** or **pnpm**
- **uv** or **pip** (Python package manager)

### Repository Structure

```
pyrpc/
├── packages/
│   ├── client/          # TypeScript client (@pyrpc/client)
│   ├── pyrpc-core/      # Python core runtime
│   ├── pyrpc-codegen/   # Python codegen tools
│   ├── pyrpc-fastapi/   # FastAPI adapter
│   └── pyrpc-flask/     # Flask adapter
├── docs/                # Documentation site (Next.js + fumadocs)
├── examples/            # Example projects
└── scripts/             # Release and utility scripts
```

### Python Setup

```bash
uv sync
# or
pip install -e packages/pyrpc-core -e packages/pyrpc-codegen -e packages/pyrpc-fastapi -e packages/pyrpc-flask
```

### TypeScript Setup

```bash
npm install
```

### Docs Site

```bash
cd docs
npm run dev
```

## Making Changes

1. Create a new branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```

2. Make your changes following the existing code style.

3. Run the relevant tests:
   - Python: `uv run pytest` or `pytest`
   - TypeScript: `cd packages/client && npm test`

4. Ensure the docs site builds:
   ```bash
   cd docs && npm run build
   ```

## Pull Request Process

1. Push your branch and open a PR against `main`.
2. Ensure the title follows conventional commits (e.g. `feat:`, `fix:`, `chore:`).
3. Describe what your change does and why it's needed.
4. Link any related issues.
5. A maintainer will review your PR.

## Release Process

Releases are handled by maintainers via tags:

```bash
node scripts/release.mjs <version>
git commit -am "chore: release v<version>"
git tag v<version>
git push origin v<version> && git push
```

This publishes all Python packages to PyPI (via OIDC trusted publishing) and the TypeScript client to npm.

## Code of Conduct

Be respectful and constructive. We're all here to build something great.
