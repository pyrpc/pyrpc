export default function Page() {
  return (
    <article style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px', fontFamily: 'system-ui, sans-serif', lineHeight: 1.7 }}>
      <p style={{ color: '#666', fontSize: 14 }}>Engineering · v0.10.0</p>
      <h1>Zero config, one command: the new pyrpc dev</h1>
      <p style={{ color: '#666' }}>
        We rethought how pyRPC sets itself up, removing every config file the developer never asked to manage,
        and replacing them with a two-question wizard that runs exactly once.
      </p>

      <hr />

      <h2>What was wrong with the old setup</h2>
      <p>
        The original <code>pyrpc dev</code> asked five questions on first run: framework, distribution mode,
        entrypoint, client root path, and whether to install an adapter. It wrote a <code>pyrpc.json</code> with
        fields like <code>client_root</code>, <code>distribution</code>, and <code>entrypoint</code>. On the
        TypeScript side, <code>@pyrpc/client</code> ran a separate wizard at <code>npm install</code> time and
        wrote a <code>pyrpc-client.json</code>.
      </p>
      <p>
        That was two config files, two wizards, and five concepts the developer had to learn before writing a
        single line of application code. It worked, but it felt like configuration management, not a developer
        tool.
      </p>
      <p>
        We studied how tools at the quality bar we're aiming for, Prisma, GraphQL Code Generator, better-auth,
        tRPC, handle this. The pattern is consistent: a short one-time setup, a config file the developer owns,
        and day-to-day commands that read that config silently. No flags, no re-prompting, no surprises.
      </p>

      <h2>The new model</h2>
      <p>Two questions. One file. One command forever after.</p>

      <pre style={{ background: '#f4f4f4', padding: 16, borderRadius: 6, overflow: 'auto' }}><code>{`$ pyrpc dev

pyRPC setup (runs once, saved to pyrpc.json)

? Entry module  › main
? Frontend framework  › Next.js   ← auto-detected from next.config.ts

  ✓ pyrpc.json created
  ✓ types generated (3 procs) → src/__pyrpc.d.ts
  pyRPC dev  http://127.0.0.1:8000/rpc
  pyrpc>`}</code></pre>

      <p>
        That's the entire first-run experience. The wizard detects your frontend framework by scanning for
        <code>next.config.*</code>, <code>vite.config.*</code>, <code>svelte.config.*</code>, etc., so in most
        cases you just confirm the pre-filled answer. It writes a minimal <code>pyrpc.json</code>:
      </p>

      <pre style={{ background: '#f4f4f4', padding: 16, borderRadius: 6, overflow: 'auto' }}><code>{`{
  "module": "main",
  "framework": "Next.js",
  "output": "src/__pyrpc.d.ts"
}`}</code></pre>

      <p>
        Three fields. That is the entire configuration surface of pyRPC. Every subsequent <code>pyrpc dev</code>{' '}
        reads this file silently, no questions, no flags required.
      </p>

      <h2>How types get to TypeScript</h2>
      <p>
        The old approach wrote generated types directly into{' '}
        <code>node_modules/@pyrpc/types/src/index.ts</code>, a working hack, but one that meant types
        disappeared after every <code>npm install</code> and couldn't be committed to version control.
      </p>
      <p>
        The new approach generates to <code>src/__pyrpc.d.ts</code>, your file, in your source tree, committed
        to git. TypeScript resolves <code>import type {'{ Types }'} from "@pyrpc/types"</code> to that file via a
        tsconfig <code>paths</code> alias:
      </p>

      <pre style={{ background: '#f4f4f4', padding: 16, borderRadius: 6, overflow: 'auto' }}><code>{`"paths": { "@pyrpc/types": ["./src/__pyrpc.d.ts"] }`}</code></pre>

      <p>
        <strong>This entry is injected automatically</strong> by <code>@pyrpc/client</code>{`'`}s postinstall
        script, the developer never touches it. The import path stays <code>@pyrpc/types</code> (clean, familiar),
        but the content comes from their generated file, not the npm package stub.
      </p>
      <p>
        This is the same pattern TypeScript projects use for <code>@/*</code> aliases, standard, predictable,
        and survives reinstalls, CI rebuilds, and Docker builds.
      </p>

      <h2>Server detection and --reload</h2>
      <p>
        <code>pyrpc dev</code> checks if your server is already running on the target port before starting
        uvicorn. If it finds a live <code>/rpc</code> endpoint, it skips uvicorn entirely and just runs the type
        watcher, no port conflicts, no duplicate processes.
      </p>
      <p>
        When pyrpc does start uvicorn, it uses <code>--reload</code> by default (same as uvicorn{`'`}s own
        default for development). You can disable it with <code>--no-reload</code> if needed.
      </p>
      <p>
        <code>pyrpc dev</code> also watches <code>pyrpc.json</code> itself. If you change the module or output
        path, it reloads config, re-wires the watcher, and restarts uvicorn automatically, no manual restart.
      </p>

      <h2>pyrpc watch for advanced users</h2>
      <p>
        Some developers prefer to manage their server process themselves, running uvicorn in one terminal with
        custom flags, Docker, or a process manager. For them, <code>pyrpc watch</code> is the type-watcher-only
        variant:
      </p>

      <pre style={{ background: '#f4f4f4', padding: 16, borderRadius: 6, overflow: 'auto' }}><code>{`uvicorn main:app --reload   # terminal 1, your server
pyrpc watch                 # terminal 2, type watcher, reads pyrpc.json`}</code></pre>

      <p>No flags needed, both commands read <code>pyrpc.json</code>.</p>

      <h2>What was removed</h2>
      <ul>
        <li><code>pyrpc-client.json</code>, gone. No TypeScript-side config file.</li>
        <li><code>@pyrpc/client</code> postinstall wizard, replaced by silent tsconfig paths injection.</li>
        <li><code>npx pyrpc sync</code>, gone. Types come from your source tree, not a remote fetch.</li>
        <li>Distribution modes (workspace / server), gone. pyRPC is monorepo-first.</li>
        <li><code>client_root</code>, <code>entrypoint</code>, <code>distribution</code> in <code>pyrpc.json</code>, gone.</li>
        <li>Writing into <code>node_modules/@pyrpc/types</code>, gone.</li>
        <li><code>questionary</code> prompts on every config change, gone. The wizard runs once.</li>
      </ul>

      <h2>Upgrade</h2>
      <p>
        Delete your existing <code>pyrpc.json</code> and <code>pyrpc-client.json</code>. Run{' '}
        <code>npm install</code> to get the new postinstall (adds tsconfig paths). Run <code>pyrpc dev</code>{' '}
, the wizard creates the new <code>pyrpc.json</code> in about 10 seconds.
      </p>
      <p>
        The <code>@pyrpc/types</code> import path in your TypeScript code stays the same.
        The <code>api</code> object, hooks, and all framework adapters are unchanged.
      </p>
    </article>
  );
}
