# Publishing pyRPC

## Current release: v0.10.0

The branch `feat/cleanup-config-codegen` contains all v0.10.0 changes.
Merge the PR, then follow the steps below.

## npm

Packages to publish:

- `@pyrpc/types@0.10.0`
- `@pyrpc/client@0.10.0`
- `@pyrpc/react@0.10.0`
- `@pyrpc/next@0.10.0`
- `@pyrpc/vue@0.10.0`
- `@pyrpc/svelte@0.10.0`

## PyPI

Packages to publish:

- `pyrpc-core==0.10.0`
- `pyrpc-codegen==0.10.0`
- `pyrpc-fastapi==0.10.0`
- `pyrpc-flask==0.10.0`
- `pyrpc-django-adapter==0.10.0`

## npm (done for 0.9.0)

Published:

- `@pyrpc/types@0.9.0`
- `@pyrpc/client@0.9.0`
- `@pyrpc/react@0.9.0` *(new)*
- `@pyrpc/next@0.9.0` *(new)*
- `@pyrpc/vue@0.9.0` *(new)*
- `@pyrpc/svelte@0.9.0` *(new)*

Verify:

```bash
npm view @pyrpc/react version
npm view @pyrpc/next version
```

## PyPI (wheels built locally — upload still needed)

Artifacts are in `dist/` (`pyrpc_*-0.9.0*`). Twine needs a token (no credentials in this environment).

### Option A — GitHub Actions (preferred)

```bash
git add -A
git commit -m "chore: release v0.9.0"
git tag v0.9.0
git push origin HEAD
git push origin v0.9.0
```

CI (`.github/workflows/publish.yml`) publishes PyPI via OIDC and re-publishes npm (`skip-existing` / version already live is fine for npm if already published).

### Option B — Manual Twine

1. Create a PyPI API token: https://pypi.org/manage/account/token/
2. Upload:

```powershell
$env:TWINE_USERNAME = "__token__"
$env:TWINE_PASSWORD = "pypi-AgE..."   # your token
twine upload dist/*
```

Order in the built set already includes codegen + core + adapters.

## Future releases

```bash
node scripts/release.mjs X.Y.Z
# build JS workspaces
# commit + tag vX.Y.Z + push   # triggers CI
```

See also: [/blog/publishing-pyrpc-packages](https://pyrpc.com/blog/publishing-pyrpc-packages)
