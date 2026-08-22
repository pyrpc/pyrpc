export default function Page() {
  return (
    <article style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px', fontFamily: 'system-ui, sans-serif', lineHeight: 1.7 }}>
      <p style={{ color: '#666', fontSize: 14 }}>Engineering · v0.10.0</p>
      <h1>How pyrpc dev detects your frontend framework</h1>
      <p style={{ color: '#666' }}>
        The first-run wizard is smarter than it looks, here's the detection logic and what it does when it can't find anything.
      </p>
      <hr />

      <h2>The detection strategy</h2>
      <p>
        When <code>pyrpc dev</code> runs for the first time, the wizard tries to pre-fill the framework
        question so you just confirm instead of typing. It does this by scanning for well-known framework
        config files.
      </p>
      <p>The scan happens in three passes, from most to least specific:</p>
      <ol>
        <li><strong>Project root</strong>, scans the directory where you ran <code>pyrpc dev</code></li>
        <li><strong>Known frontend subdirectories</strong>, checks <code>frontend/</code>, <code>client/</code>, <code>web/</code>, <code>ui/</code></li>
        <li><strong>Fallback</strong>, if nothing is found, asks you directly</li>
      </ol>

      <h2>What it looks for</h2>
      <pre style={{ background: '#f4f4f4', padding: 16, borderRadius: 6, overflow: 'auto' }}><code>{`next.config.ts / .js / .mjs  → Next.js
nuxt.config.ts / .js         → Nuxt
svelte.config.js / .ts       → Svelte / SvelteKit
vite.config.ts / .js         → Vite (React, Vue, etc.)
astro.config.mjs             → Astro`}</code></pre>

      <h2>When you set up the server first</h2>
      <p>
        A common setup order: write the Python server first, then scaffold the frontend. If you run{' '}
        <code>pyrpc dev</code> before the frontend exists, no config file is found. The wizard falls back
        to asking you directly:
      </p>
      <pre style={{ background: '#f4f4f4', padding: 16, borderRadius: 6, overflow: 'auto' }}><code>{`pyRPC setup (runs once, saved to pyrpc.json)

? Entry module  › main
? Frontend framework  › Next.js
? Output path for generated types  › src/__pyrpc.d.ts
  (relative to this directory, e.g. src/__pyrpc.d.ts or frontend/src/__pyrpc.d.ts)

  ✓ pyrpc.json created`}</code></pre>
      <p>
        The third question only appears when detection fails. Once you answer it,{' '}
        <code>pyrpc.json</code> is written and it never asks again.
      </p>

      <h2>Changing the output path later</h2>
      <p>
        If your output path was wrong (or you scaffolded the frontend after the first run), just edit{' '}
        <code>pyrpc.json</code>:
      </p>
      <pre style={{ background: '#f4f4f4', padding: 16, borderRadius: 6, overflow: 'auto' }}><code>{`{
  "module": "main",
  "framework": "Next.js",
  "output": "frontend/src/__pyrpc.d.ts"
}`}</code></pre>
      <p>
        <code>pyrpc dev</code> watches <code>pyrpc.json</code> and re-wires the watcher automatically when
        the file changes. No restart needed.
      </p>

      <h2>The src/ detection</h2>
      <p>
        Once a framework is detected, pyRPC checks whether a <code>src/</code> directory exists. If the
        project uses a flat structure (no <code>src/</code>), the output path drops the prefix:
      </p>
      <pre style={{ background: '#f4f4f4', padding: 16, borderRadius: 6, overflow: 'auto' }}><code>{`# With src/ directory:  src/__pyrpc.d.ts
# Without src/:         __pyrpc.d.ts`}</code></pre>
      <p>
        This handles both the default <code>create-next-app --src-dir</code> layout and the legacy
        root-level layout without any configuration.
      </p>
    </article>
  );
}
