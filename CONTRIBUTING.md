# Contributing to pyRPC

Thank you for considering contributing to pyRPC. This guide will help you get started.

## Development Setup

### Prerequisites

- **Python** >= 3.11
- **Node.js** >= 20
- **npm** (with workspaces; the repo has a package-lock.json)
- **uv** or **pip** (Python package manager)

### Repository Structure

```
pyrpc/
├── packages/
│   ├── client/          # TypeScript client (@pyrpc/client)
│   ├── types/           # TypeScript type declarations (@pyrpc/types)
│   ├── react/           # React adapter (@pyrpc/react)
│   ├── next/            # Next.js adapter (@pyrpc/next)
│   ├── vue/             # Vue adapter (@pyrpc/vue)
│   ├── svelte/          # Svelte adapter (@pyrpc/svelte)
│   ├── pyrpc-core/      # Python runtime + CLI (dev, watch, serve, codegen, pull, inspect)
│   ├── pyrpc-codegen/   # Python codegen library (pure, standalone)
│   ├── pyrpc-fastapi/   # FastAPI adapter
│   ├── pyrpc-flask/     # Flask adapter
│   └── pyrpc-django-adapter/ # Django adapter
├── docs/                # Documentation site (Next.js + fumadocs)
├── examples/            # Example projects (12 framework combinations)
└── scripts/             # Release and utility scripts
```

### Python Setup

```bash
uv sync
# or
pip install -e packages/pyrpc-core -e packages/pyrpc-codegen -e packages/pyrpc-flask -e packages/pyrpc-fastapi -e packages/pyrpc-django-adapter
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

## Scope Your Change

PRs should be scoped to one subsystem. A single PR touching core, adapters, and codegen is hard to review and easy to break.

| Subsystem | Path | Review focus |
|-----------|------|-------------|
| Core | `packages/pyrpc-core/` | Protocol behavior, validation invariants, router semantics |
| Adapter | `packages/pyrpc-fastapi/`, `packages/pyrpc-flask/`, `packages/pyrpc-django-adapter/` | Correct HTTP translation, error mapping, framework integration |
| Client | `packages/client/`, `packages/types/` | TypeScript ergonomics, type inference, API surface |
| Codegen | `packages/pyrpc-codegen/` | Type mapping accuracy, output correctness, introspection alignment |
| Docs | `docs/` | Accuracy, build output |
| Release | `scripts/`, root config | Version consistency, tag discipline |

## Branches

Branch off main. Use these prefixes (kebab-case):

| Prefix | Use for |
|--------|---------|
| `feat/` | New feature |
| `fix/` | Bug fix |
| `chore/` | Refactor, tooling, config, dependencies |
| `docs/` | Docs-only changes |
| `perf/` | Performance work |
| `security/` | Security fix or hardening |

## Commits and PRs

The PR title becomes the squash commit for most PRs. Multi-commit PRs with well-crafted atomic commits may be merged with a merge commit at the maintainer's discretion (security audits, multi-step refactors). Title must follow Conventional Commits:

```
feat(core): add named parameters support
fix(client): prevent null reference on timeout
chore(deps): bump pydantic to 2.x
security(codegen): tighten path traversal guard
```

Types: `feat`, `fix`, `chore`, `docs`, `perf`, `refactor`, `test`, `build`, `ci`, `security`.

Common scopes: `core`, `adapter`, `client`, `codegen`, `docs`, `release`, `cli`.

Within a PR, individual commit messages can be free-form (they get squashed or grouped).

Fill out the PR template. Include: what changed, why, how you tested. Screenshots/GIFs for UI changes. "Tested manually by ..." is the bare minimum.

Open a draft PR early if you want feedback mid-flight. Mark "Ready for review" when done.

### Required checks

Merging into `main` requires the `Test` workflow jobs to pass. Branch protection requires the `test-python` and `test-ts` checks (matched by check-run job name, not `Test / <job>`). The Python suite itself runs as a `test-python-matrix` job (OS x Python version); the plain `test-python` job is an aggregate gate over it, which is what keeps the protected name stable no matter how the matrix expands. If you rename or restructure jobs in `test.yml`, keep that pattern or update the branch-protection required checks to match exactly, otherwise every PR will silently fail to merge.

The same workflow also runs these informational (non-required) jobs: `lint-docs`, `lint-python` (ruff), `typecheck-python` (mypy), `coverage`, `examples-smoke`, and `docs-code`. Treat red as a review blocker even where protection does not.

### Quality gates (local equivalents)

| Gate | Command |
|------|---------|
| Lint (Python) | `uv run ruff check .` |
| Types (Python) | `uv run mypy` |
| Tests + coverage floor | `uv run pytest --cov=pyrpc_core --cov=pyrpc_codegen --cov=pyrpc_fastapi --cov=pyrpc_flask --cov=pyrpc_django --cov-fail-under=78` |
| Types (packages) | `npm run typecheck --workspaces --if-present` |
| Lint (packages) | `npm run lint:packages` |
| Examples | `uv pip install flask-cors django-cors-headers && uv run python scripts/verify_examples.py` |
| Docs code blocks | `uv run python scripts/check_docs_code.py` |

Notes for contributors:

- Ruff's configured rule set is enforced in CI (`lint-python`). Line length (E501) and single-line compound statements (E701/E702) are currently accepted style, encoded as documented ignores rather than silent exceptions.
- mypy runs against every package's `src/`; tests are not yet type-checked.
- Coverage has a hard floor of 78% on the five Python packages; raise it when adding code, never lower it to make a PR pass.
- Docs fences: every ```python block is syntax-checked; blocks marked ```python test are executed in CI and must be self-contained. Pseudo-code must opt out explicitly with ```python nocheck.
- Dependency updates come from Dependabot (pip/npm/docs/actions, weekly, grouped minor+patch).

Approvals are not enforced by branch protection, but maintainers review contributor PRs and may ask for changes before merging.

## What gets merged faster

- Clear problem statement
- Small, focused diff
- Follows existing patterns (read 2-3 nearby files before writing yours)
- All type-checks / lints / tests pass
- Manual testing notes describing the steps you took

## What gets bounced back

- Mixed-concern PRs
- Large architectural PRs without prior discussion
- New dependencies without justification
- Breaking changes without migration notes
- Incidental reformatting unrelated to the change
- AI-generated code that obviously wasn't read by the author

## Code style

Follow existing patterns. Read 2-3 adjacent files before adding new ones.

- **TypeScript:** no `any` unless you really mean it. Strict mode is on.
- **Python:** follow existing patterns in the package you're modifying.
- **Comments:** only for _why_, not _what_. Code should explain itself. No multi-paragraph docstrings.
- No emojis in code or commit messages.
- **No em-dashes** in prose, docs, blog posts, or user-facing copy. Use commas, colons, or parentheses instead.
- American English in user-facing strings.

## FAQ

**Q: Should I ask before fixing a typo or obvious bug?**

A: No, open a PR directly.

**Q: I have an idea for a new feature.**

A: Open a GitHub issue or bring it to the community. Don't open a PR without prior discussion.

**Q: My PR was closed without detailed feedback.**

A: Usually means it didn't align with project direction, or scope was too large to review responsibly. This is normal for a solo project. Reopen is welcome if you want to take another pass at a smaller scope.

**Q: Can I work on an open issue?**

A: Comment first to confirm it's still relevant and nobody else is on it. For anything non-trivial, discuss approach before implementing.

**Q: I noticed cleaner code I could write while working on my fix.**

A: Focus on your stated goal. Submit cleanup as a separate PR after discussion if it matters.

**Q: How long does review take?**

A: Depends. Small bug fix or docs: usually within a few days. Larger feature: maybe a week or two. Pre-discussed work moves faster.

**Q: My PR conflicts after main moved. Should I rebase?**

A: If the change is still relevant and reasonably small, yes. If it's a large stale PR, expect it to be closed with an offer to reopen after rebase. Rotting velocity is real, not personal.

## Security Issues

Do not file security issues as public issues. See [SECURITY.md](./SECURITY.md) for the reporting process.

## Code of Conduct

Be respectful and constructive. We're all here to build something great.
