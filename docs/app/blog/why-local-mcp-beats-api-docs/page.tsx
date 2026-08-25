import Link from 'next/link'

export default function WhyLocalMcpBeatsApiDocs() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    Why Local MCP Beats API Docs for AI Agents
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 25, 2026</time>
                    <span>&middot;</span>
                    <span>7 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    You already have API docs. OpenAPI spec sitting in your repo, README files describing every endpoint, maybe even a generated reference site. So why would an agent need something else? Because API docs were written for humans who can infer, interpret, and guess, and agents need facts.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">API docs are static, MCP is live</h2>
                <p>
                    Documentation describes what the API looked like when someone last updated the file. Between that moment and now, you might have added a parameter, changed a default, renamed a field, or deprecated a route. The docs still say the old thing, and the agent trusts them. MCP introspect_procedures, by contrast, imports your actual code and walks the live registry. The answer an agent receives is the answer your server would give. There is no gap between documented and real.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">API docs describe the ideal, MCP describes yours</h2>
                <p>
                    A generic OpenAPI spec for a FastAPI app might show a request body with a string field called name. Your actual app might validate that name against a regex, cap it at 50 characters, default it to "unnamed", and mark it as required. That information lives in your pydantic model, not in the spec. The MCP returns it directly: parameter name, type, requiredness, default value, docstring, and the full JSON schema including constraints. The agent does not have to guess what the constraints are.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Structured data, not prose</h2>
                <p>
                    Reading an API doc page is an act of interpretation. The agent parses human-written text, identifies parameter names, infers types from descriptions, and constructs an internal model. Every step is a potential mistake. MCP returns a JSON object with the same structure every time: the procedure name, a list of parameters each carrying name, type, required, default, description, and schema. No parsing, no interpretation, no ambiguity. The data is ready to use.
                </p>

                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto"><code>{`{
  "name": "create_user",
  "parameters": [
    {
      "name": "email",
      "type": "string",
      "required": true,
      "default": null,
      "description": "Valid email address",
      "schema": {
        "type": "string",
        "format": "email",
        "maxLength": 320
      }
    },
    {
      "name": "role",
      "type": "string",
      "required": false,
      "default": "viewer",
      "description": "Initial role assignment",
      "schema": {
        "type": "string",
        "enum": ["admin", "editor", "viewer"]
      }
    }
  ]
}`}</code></pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The information flow</h2>
                <p>
                    The difference becomes clear when you trace how each path reaches working code:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto"><code>{`API Docs path:
  OpenAPI text  ->  agent parses  ->  agent interprets  ->  agent guesses types
  ->  agent writes code  ->  runtime rejects  ->  agent fixes  ->  retries

MCP path:
  introspect_procedures  ->  structured data  ->  agent writes code
  ->  check_call validates  ->  (if invalid) agent fixes  ->  retries`}</code></pre>
                <p>
                    The MCP path has fewer steps, fewer chances for misinterpretation, and includes a validation checkpoint before anything runs. The agent gets the facts, writes the call, verifies it, and only then executes.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The ground truth principle</h2>
                <p>
                    Agents work better with facts than with interpretations. This is not a subtle preference. When an agent receives a structured JSON schema, it can generate code that type-checks on the first attempt. When it parses prose, it frequently gets parameter names wrong, misses optional fields, or assumes the wrong type. Ground truth from the live registry eliminates an entire class of agent error.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The maintenance advantage</h2>
                <p>
                    API docs drift. Every time a developer changes a procedure signature and forgets to update the README, the docs and reality diverge. MCP cannot drift because it is derived from the same code that runs the server. Add a new procedure and the MCP discovers it automatically. Remove one and it disappears from the schema. There is no second source of truth to keep in sync.
                </p>
                <p>
                    This is not a minor convenience. It is the difference between an agent that works on day one and an agent that works on day one hundred. The moment your docs and your code diverge, the agent starts generating calls to APIs that do not exist, passing arguments that are not accepted, and producing errors that waste everyone's time. MCP makes that divergence structurally impossible.
                </p>
            </section>
        </article>
    )
}
