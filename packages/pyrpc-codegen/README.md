# pyrpc-codegen

Code generation and template utilities for [pyRPC](https://pyrpc.dev). Used internally by `pyrpc-core` for TypeScript type generation and schema serialization.

## What it does

- Generates TypeScript interfaces from Python procedure schemas
- Serializes RPC schema to JSON for distribution
- Provides Jinja2 templates used by the `pyrpc codegen` and `pyrpc pull` commands

## Installation

Installed automatically as a dependency of `pyrpc-core`:

```bash
uv add pyrpc-core
```

## License

MIT
