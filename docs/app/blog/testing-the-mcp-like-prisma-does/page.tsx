import Link from 'next/link'

export default function TestingTheMcpLikePrismaDoes() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    Testing the MCP Like Prisma Does
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>August 25, 2026</time>
                    <span>&middot;</span>
                    <span>8 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    pyRPC has 197 tests total, 21 for MCP specifically. That ratio is deliberate: the MCP is a protocol server wearing your product name, and testing it as Python unit tests alone would miss exactly the classes of bugs that break real users.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The test pyramid</h2>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto"><code>{`            /  E2E  \\           (config discovery, both layers)
           /________\\
          / Integration \\        (stdio subprocess, 4 tests)
         /______________\\
        /    Unit Tests   \\      (in-memory protocol, 17 tests)
       /__________________\\`}</code></pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Layer one: in-memory protocol tests (17 tests)</h2>
                <p>
                    These use the official @modelcontextprotocol/sdk Client class, connecting via InMemoryTransport to the server object directly. No subprocess, no file system, no transport framing. The tests verify tool schemas match expected shapes, call results carry structured content, and error handling returns is_error with remediation text instead of exceptions. Because this is the same Client the SDK uses on itself, protocol drift gets caught upstream before it ever reaches pyRPC tests.
                </p>

                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto"><code>{`// In-memory: client connects directly to server object
const client = new Client({ name: "test" });
await client.connect(new InMemoryTransport(server));
const tools = await client.listTools();
// verify schema shapes, annotations, structured content`}</code></pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Layer two: stdio subprocess tests (4 tests)</h2>
                <p>
                    In-memory cannot catch framing bugs, buffering hazards, or lifecycle mistakes. The stdio suite spawns a real uv run pyrpc mcp process in a temporary project and speaks raw JSON-RPC over stdin and stdout. Every stdout line is parsed as protocol, proving stdout purity mechanically. Closing stdin must end the process with exit 0, because that is exactly how GUI clients terminate sessions. These tests also drive the official Client with StdioServerParameters, which is character-for-character how Cursor or Claude Desktop launches the server.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">What each layer catches</h2>
                <p>
                    In-memory tests catch protocol compliance: wrong tool names, missing annotations, malformed schemas, and incorrect error shapes. Stdio subprocess tests catch real process lifecycle: startup ordering, stdout contamination from print statements, clean shutdown behavior, and buffering edge cases. Both layers together catch config discovery: the subprocess tests verify the server finds the project registry the same way a real user session would.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The purity test</h2>
                <p>
                    Every subprocess test asserts two things beyond correctness: exit code 0 and no file writes. The purity assertion is a sentinel file created before the test and checked for absence after. If the MCP server ever accidentally mutates project state during a read-only introspection, the test fails with a message that explains itself. One stray write and the entire test suite turns red.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Mocking strategy</h2>
                <p>
                    vi.mock covers only the mutating API, upsertServer, leaving detection functions real. This is the Prisma-inspired approach: test the wire protocol against a real server, mock only the side effects that would touch your file system in ways you do not intend. The detection code that finds installed agents runs against the real file system because that is exactly what breaks when an agent updates its config format. Mocking it would defeat the purpose.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Why real integration tests matter</h2>
                <p>
                    add-mcp config file formats change. Merge logic evolves. Idempotency is critical because agents re-run registration on every startup. The only way to verify idempotency is to actually call upsertServer twice and assert the file is identical. The only way to catch format drift is to parse real config files. Unit tests that mock the config format are testing your mocks, not the format. Integration tests catch the thing that actually breaks in production: a new agent version that reorganized its JSON nesting.
                </p>
                <p>
                    The nine-leg matrix (three operating systems, three agent configs) caught a separator bug on Windows where ClientInfo paths carried native backslash separators while every other path in tool output used forward slashes. That inconsistency would have confused cross-platform agents forever. Only a real subprocess test on a real OS would surface it.
                </p>
            </section>
        </article>
    )
}
