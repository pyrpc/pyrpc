export default function Page() {
  return (
    <article style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px', fontFamily: 'system-ui, sans-serif', lineHeight: 1.7 }}>
      <p style={{ color: '#666', fontSize: 14 }}>Engineering · v0.10.0</p>
      <h1>pyrpc.json v2: three fields, no ceremony</h1>
      <p style={{ color: '#666' }}>
        The old pyrpc.json had six fields. The new one has three. Here's why every field that was removed was the right call.
      </p>
      <hr />

      <h2>What the old pyrpc.json looked like</h2>
      <pre style={{ background: '#f4f4f4', padding: 16, borderRadius: 6, overflow: 'auto' }}><code>{`{
  "version": 1,
  "framework": "fastapi",
  "entrypoint": "server",
  "client_root": "../frontend",
  "distribution": "workspace"
}`}</code></pre>
      <p>Five fields, a version number, and two concepts (<em>distribution mode</em> and <em>client root</em>) that
      required reading documentation to understand.</p>

      <h2>What it looks like now</h2>
      <pre style={{ background: '#f4f4f4', padding: 16, borderRadius: 6, overflow: 'auto' }}><code>{`{
  "module": "main",
  "framework": "Next.js",
  "output": "src/__pyrpc.d.ts"
}`}</code></pre>
      <p>Three fields. Self-explanatory. Written by the wizard in 10 seconds, never touched again in most projects.</p>

      <h2>What was removed and why</h2>

      <h3>distribution</h3>
      <p>
        This controlled whether types were written to <code>node_modules</code> ("workspace") or fetched
        over HTTP by the client ("server"). Both modes are gone. pyRPC is now monorepo-first: types are
        always generated to your source tree. If you need a remote type fetch, run{' '}
        <code>pyrpc codegen http://your-server</code> — no config needed.
      </p>

      <h3>client_root</h3>
      <p>
        This was a directory path that pyrpc used to compute where to write{' '}
        <code>node_modules/@pyrpc/types/src/index.ts</code>. With types now going to a user-owned file,
        the relevant concept is <code>output</code> — the full path to the <code>.d.ts</code> file. More
        explicit, more honest.
      </p>

      <h3>entrypoint vs module</h3>
      <p>
        <code>entrypoint</code> was renamed to <code>module</code> because that's the Python term —
        it's a module you import, not an entry point in the build-tool sense. <code>main</code>,
        <code>app.server</code>, <code>backend.main</code> — these are all Python modules.
      </p>

      <h3>version</h3>
      <p>
        The version field triggered migration prompts when the schema changed. With a three-field file
        that almost never changes, this is unnecessary overhead.
      </p>

      <h2>What pyrpc.json is watched for</h2>
      <p>
        <code>pyrpc dev</code> watches <code>pyrpc.json</code> in real time. If you change{' '}
        <code>module</code>, it re-imports the new module and restarts uvicorn. If you change{' '}
        <code>output</code>, it re-wires the type watcher to the new path. The <code>framework</code>{' '}
        field is informational — used by the wizard to set defaults, not acted on at runtime.
      </p>
    </article>
  );
}
