export default function Page() {
  return (
    <article style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px', fontFamily: 'system-ui, sans-serif', lineHeight: 1.7 }}>
      <p style={{ color: '#666', fontSize: 14 }}>Engineering · v0.10.0</p>
      <h1>One install command per stack</h1>
      <p style={{ color: '#666' }}>
        How pyRPC uses Python extras and per-framework npm packages to keep install as simple as possible.
      </p>
      <hr />

      <h2>Python: extras, not separate packages</h2>
      <p>
        From v0.10.0, the recommended install always uses the extras syntax. You get the core, the CLI,
        and the framework adapter in a single command:
      </p>
      <pre style={{ background: '#f4f4f4', padding: 16, borderRadius: 6, overflow: 'auto' }}><code>{`pip install pyrpc-core[fastapi]   # FastAPI
pip install pyrpc-core[flask]     # Flask
pip install pyrpc-core[django]    # Django`}</code></pre>
      <p>
        The adapter packages (<code>pyrpc-fastapi</code>, <code>pyrpc-flask</code>,{' '}
        <code>pyrpc-django-adapter</code>) are still published to PyPI as standalone packages, but the extras
        approach is cleaner, one command, one version to track.
      </p>

      <h2>TypeScript: one command per framework</h2>
      <p>
        The TypeScript side ships separate packages because frameworks have very different peer dependency trees.
        Bundling everything into one npm package would pull in Next.js for a Vue project. The trade-off is
        explicit: you install exactly what you use.
      </p>
      <pre style={{ background: '#f4f4f4', padding: 16, borderRadius: 6, overflow: 'auto' }}><code>{`npm install @pyrpc/client @pyrpc/next    # Next.js App Router
npm install @pyrpc/client @pyrpc/react   # React (Vite, CRA, etc.)
npm install @pyrpc/client @pyrpc/vue     # Vue 3
npm install @pyrpc/client @pyrpc/svelte  # Svelte / SvelteKit`}</code></pre>
      <p>
        <code>@pyrpc/client</code> is always installed, it's the core transport. The framework package adds
        TanStack Query hooks on top. <code>@pyrpc/types</code> arrives automatically as a dependency of{' '}
        <code>@pyrpc/client</code>, you don't install it manually.
      </p>

      <h2>What happens on npm install</h2>
      <p>
        <code>@pyrpc/client</code> runs a silent postinstall that adds one entry to your{' '}
        <code>tsconfig.json</code>:
      </p>
      <pre style={{ background: '#f4f4f4', padding: 16, borderRadius: 6, overflow: 'auto' }}><code>{`"paths": { "@pyrpc/types": ["./src/__pyrpc.d.ts"] }`}</code></pre>
      <p>
        This wires TypeScript to resolve <code>import type {'{ Types }'} from "@pyrpc/types"</code> to your
        generated file instead of the npm stub. It runs once, preserves all your existing paths, and
        skips silently if the entry is already there.
      </p>

      <h2>Full stack in two commands</h2>
      <pre style={{ background: '#f4f4f4', padding: 16, borderRadius: 6, overflow: 'auto' }}><code>{`pip install pyrpc-core[fastapi]
npm install @pyrpc/client @pyrpc/next`}</code></pre>
      <p>That's it. Then <code>pyrpc dev</code> and you're running.</p>
    </article>
  );
}
