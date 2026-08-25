import Link from 'next/link'

export default function McpWithoutALauncher() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    MCP Without a Launcher: The npx pyrpc mcp Pattern
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 25, 2026</time>
                    <span>&middot;</span>
                    <span>7 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    Every AI coding agent has its own config format. Cursor uses .cursor/mcp.json, Claude Desktop uses .mcp.json, Windsurf has its own, and opencode.json looks nothing like either. If you want your MCP server to work across agents, you face a choice: ship a launcher that writes all these files, or find a better way.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The config format problem</h2>
                <p>
                    The MCP ecosystem has at least 19 recognized agent config formats. They differ in location, syntax, nesting depth, and how they reference server commands. A launcher that writes them all must track each format, handle version drift, and cope with agents that reorganize their configs between releases. That is a maintenance surface disguised as a convenience.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">What npx pyrpc mcp actually wraps</h2>
                <p>
                    The distribution CLI calls add-mcp@2.3.0, an Apache-2.0 ESM package whose sole job is understanding all 19 agent config formats. It detects which agents are installed, presents a multiselect, and calls upsertServer() per agent to update config files atomically. pyRPC does not shell out to the add-mcp CLI, maintain its own agent database, or handle any protocol details.
                </p>

                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto"><code>{`npx pyrpc mcp
  -> detects installed agents (Cursor, Claude, Windsurf, ...)
  -> multiselect prompt
  -> upsertServer() per selected agent
  -> config files updated in place`}</code></pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">What the wrapper adds</h2>
                <p>
                    The 50-line cli.ts that wraps add-mcp adds only things that matter for user experience: a branded banner so you know which tool ran, scope selection so you choose which agents to configure, per-agent result reporting so you see exactly what changed, and failure remediation hints when a config path is unexpected or a file is unwritable. None of that is protocol code.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">What it does not do</h2>
                <p>
                    The wrapper does not parse JSON-RPC, manage stdio transports, serialize tool schemas, or track agent protocol versions. It delegates all of that to add-mcp for agent configs and to the MCP SDK for the server itself. The separation is deliberate: the wrapper is a thin UX layer, not a second implementation.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The code walkthrough</h2>
                <p>
                    The entire flow fits in 50 lines. The CLI entry point imports add-mcp programmatically, calls detectAgents() to find installed clients, prompts for selection, calls upsertServer() for each, and reports results. Error handling wraps each upsert in a try-catch that prints the failing agent name and a remediation hint. There are no abstractions, no interfaces, no plugin system. It is a script.
                </p>

                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto"><code>{`import { detectAgents, upsertServer } from "add-mcp";

const agents = await detectAgents();
const selected = await promptMultiselect(agents);

for (const agent of selected) {
  try {
    await upsertServer(agent, {
      name: "pyrpc",
      command: "npx pyrpc mcp",
    });
    report(agent, "updated");
  } catch (e) {
    report(agent, "failed", remediationHint(e));
  }
}`}</code></pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Why this beats a custom launcher</h2>
                <p>
                    A custom launcher means zero protocol code, zero client-specific code, and upstream handles all agent complexity. When add-mcp adds support for a new agent, pyRPC gets it for free. When an agent changes its config format, add-mcp fixes it, and the wrapper keeps working without a release. The alternative, maintaining a 19-format config writer inside pyRPC, would mean versioned releases for config changes that have nothing to do with RPC or MCP protocol.
                </p>
                <p>
                    The pattern generalizes: if your tool needs to register into agent configs, depend on the package that knows the formats, and wrap it with UX. Do not rewrite it.
                </p>
            </section>
        </article>
    )
}
