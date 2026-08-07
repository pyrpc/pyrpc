export default function Page() {
  return (
    <article style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px', fontFamily: 'system-ui, sans-serif', lineHeight: 1.7 }}>
      <p style={{ color: '#666', fontSize: 14 }}>Engineering · v0.10.0</p>
      <h1>Why generated types belong in your source tree, not node_modules</h1>
      <p style={{ color: '#666' }}>
        The old approach wrote into node_modules. The new one writes into src/__pyrpc.d.ts. Here's why that matters.
      </p>
      <hr />

      <h2>The old approach</h2>
      <p>
        The original pyRPC daemon wrote generated TypeScript types directly into{' '}
        <code>node_modules/@pyrpc/types/src/index.ts</code>. Every time a Python procedure changed, the
        watcher would overwrite this file. The TypeScript client imported from <code>@pyrpc/types</code>,
        which resolved to that path.
      </p>
      <p>
        This worked well in demos and local development. But it had a fundamental problem: the generated
        file lived in <code>node_modules</code>, which is gitignored in every project on earth.
      </p>

      <h2>What that meant in practice</h2>
      <ul>
        <li>
          <strong>After git clone + npm install:</strong> types are gone. The stub from the published
          package is empty — <code>Types = Record&lt;string, never&gt;</code>. The developer has to
          run <code>pyrpc dev</code> before TypeScript works.
        </li>
        <li>
          <strong>In CI:</strong> the build fails if it runs <code>tsc</code> before the Python server
          is running. Adding a server startup to CI just to generate types is heavyweight.
        </li>
        <li>
          <strong>In code review:</strong> type changes are invisible. Adding a new procedure to Python
          doesn't show up in the PR diff.
        </li>
        <li>
          <strong>After <code>npm ci</code>:</strong> completely wipes <code>node_modules</code>.
          The types are gone and need to be regenerated.
        </li>
      </ul>

      <h2>The new approach</h2>
      <p>
        <code>pyrpc dev</code> writes to <code>src/__pyrpc.d.ts</code> — a file in your source tree.
        This file is committed to git. It survives reinstalls, CI runs, and Docker builds. When a
        procedure changes, the diff shows up in your PR.
      </p>
      <p>
        TypeScript resolves <code>import type {'{ Types }'} from "@pyrpc/types"</code> to this file via
        a <code>tsconfig.json</code> paths alias that <code>@pyrpc/client</code> postinstall injects:
      </p>
      <pre style={{ background: '#f4f4f4', padding: 16, borderRadius: 6, overflow: 'auto' }}><code>{`"paths": { "@pyrpc/types": ["./src/__pyrpc.d.ts"] }`}</code></pre>
      <p>
        The <code>@pyrpc/types</code> package is still installed (satisfies peer deps and provides the
        fallback stub before first run), but TypeScript never actually uses it — the paths alias takes
        priority.
      </p>

      <h2>The precedent: Prisma</h2>
      <p>
        Prisma v7 made exactly this move. Their <code>output</code> field is now required in{' '}
        <code>schema.prisma</code>, and the generated client goes into the user's source tree
        (<code>./generated/prisma</code>). The reasoning is the same: generated code that you depend on
        should be visible, version-controlled, and not dependent on a running process to exist.
      </p>

      <h2>What to commit and what not to</h2>
      <p>
        <strong>Commit</strong> <code>src/__pyrpc.d.ts</code> — it's your generated API contract.
        When a teammate adds a procedure, their PR will show the type change.
      </p>
      <p>
        <strong>Don't gitignore it</strong> — unlike build artifacts, this file doesn't change on
        every build. It only changes when your Python procedures change. That's a meaningful diff.
      </p>
    </article>
  );
}
