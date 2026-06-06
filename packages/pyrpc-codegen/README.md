# pyrpc-codegen

Code generation utilities for [pyRPC](https://pyrpc.com). Generates TypeScript type definitions from Python procedure schemas.

## What it does

- `generate_typescript_client(schemas)` - generates TypeScript interface source code from a schema dict
- `save_typescript_client(schemas, output_path)` - generates and writes TypeScript types to a file
- `DEFAULT_OUTPUT` - default output filename constant

## Installation

Installed automatically as a dependency of `pyrpc-core`:

```bash
uv add pyrpc-core
```

## License

MIT
