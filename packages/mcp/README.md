# pyrpc (setup CLI)

Connect your AI coding agent to the **pyRPC documentation MCP**:

```bash
npx @pyrpc/mcp mcp
```

This configures your agent to use the hosted, read-only pyRPC docs server at
`https://mcp.pyrpc.com/mcp` (Streamable HTTP). It is a thin, branded wrapper
around the excellent [add-mcp](https://github.com/neon-solutions/add-mcp)
configuration engine, which owns all client-specific behavior across its 19
supported agents.

## Commands

```bash
npx @pyrpc/mcp mcp                 # interactive agent selection
npx @pyrpc/mcp mcp --agent cursor  # configure one agent directly
npx @pyrpc/mcp mcp --agent claude-code --global
npx @pyrpc/mcp mcp --list          # supported agents
```

Looking for the **local project MCP** instead (introspection, call validation,
and codegen against your actual pyRPC backend)?

```bash
uv add "pyrpc-core[mcp]"
pyrpc mcp
```

That is a different product surface shipped in the Python package; this npm
CLI never starts an MCP server.
