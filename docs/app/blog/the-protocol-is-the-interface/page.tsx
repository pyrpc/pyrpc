import Link from 'next/link'

export default function TheProtocolIsTheInterface() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    The Protocol Is the Interface
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 25, 2026</time>
                    <span>&middot;</span>
                    <span>8 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    Before MCP, every AI tool that wanted to integrate with your codebase needed a custom integration. VS Code extensions for Copilot, CLI wrappers for local agents, API clients for cloud-hosted models. Each integration meant understanding your tool's specific API, auth model, and data format. The result was N tools times M agents equals N times M integrations.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The protocol stack</h2>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto"><code>{`    +---------------------------+
    |     Your MCP Tools       |  (introspect, validate, codegen)
    +---------------------------+
    |      MCP Protocol        |  (tools/list, tools/call, resources)
    +---------------------------+
    |       JSON-RPC 2.0       |  (request, response, notification)
    +---------------------------+
    |      Transport Layer     |  (stdio or streamable HTTP)
    +---------------------------+`}</code></pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">JSON-RPC as the foundation</h2>
                <p>
                    MCP builds on JSON-RPC 2.0, a specification from 2010 that is well-understood, battle-tested, and language-agnostic. Every major language has a JSON-RPC library. The wire format is trivial to parse. Debugging tools read it natively. By choosing JSON-RPC as the foundation, MCP inherits a decade of tooling and avoids inventing a serialization format that would need its own ecosystem.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Streamable HTTP vs stdio</h2>
                <p>
                    MCP defines two transport layers: stdio for local servers and streamable HTTP for remote ones. stdio is the right choice when the server runs on the same machine as the agent, which is the case for pyRPC's local MCP. The server is spawned as a subprocess, communicates over stdin and stdout, and shuts down when the session ends. No ports, no firewalls, no auth tokens. Streamable HTTP is for remote servers where the agent connects over the network, authenticates once, and maintains a persistent session. The transport choice is not cosmetic; it determines the trust model.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">How pyRPC uses both</h2>
                <p>
                    pyRPC's local MCP server uses stdio for zero-config local operation. The agent spawns pyrpc mcp, gets a JSON-RPC session over pipes, and calls tools. No configuration, no port discovery, no auth. For remote scenarios, the same tools can be exposed over HTTP, where the server runs as a hosted endpoint and the agent connects with an API key. The tools are identical; only the transport changes.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The thin server principle</h2>
                <p>
                    pyRPC's MCP server does one thing: introspect your project. It exposes three tools, introspect_project for schemas, check_call for validation, and run_codegen for type generation. It does not manage your database, deploy your code, or execute arbitrary commands. The server is thin because a thin server is a trustworthy server. Every tool is read-only or narrowly scoped, which means the agent can use it without the kind of trust elevation that a full-featured server would require.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Why this matters for the ecosystem</h2>
                <p>
                    The protocol-as-interface model means any MCP-compatible agent works with any MCP server. Cursor, Claude Desktop, Windsurf, opencode, and every future agent all speak the same protocol. pyRPC does not need to write a Cursor plugin, a Claude extension, or a Windsurf integration. It writes one MCP server and gets all of them for free. The same is true in reverse: any future pyRPC tool, whether it validates code, generates types, or inspects schemas, works in every agent without changes.
                </p>
                <p>
                    This is the real win of protocol standardization: not fewer lines of code in your integration layer, but fewer integration layers in your entire ecosystem. N tools times M agents stops growing because M is handled by the protocol. The protocol is the interface.
                </p>
            </section>
        </article>
    )
}
