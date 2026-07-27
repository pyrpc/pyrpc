# Publishing pyRPC 0.9.0

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
