# @pyrpc/types

TypeScript type definitions for [pyRPC](https://pyrpc.dev). Ships a `postinstall` script that configures type generation based on your distribution mode.

## Distribution modes

When you `npm install @pyrpc/types`, the `postinstall` script prompts you to choose a distribution mode:

### Workspace mode
Types are written directly by the server-side `pyrpc dev` / `pyrpc codegen` commands into `node_modules/@pyrpc/types/src/index.ts`. The postinstall creates `pyrpc-client.json` with `distribution: "workspace"` and types are generated during development.

### Server mode
Types are fetched from a running pyRPC server. The postinstall prompts for a `server_url`, fetches the schema from `{server_url}/rpc`, generates types immediately, and creates `pyrpc-client.json`.

CI / non-TTY environments skip the prompt silently (assumes workspace mode, no config created).

## License

MIT
