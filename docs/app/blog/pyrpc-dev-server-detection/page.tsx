export default function Page() {
  return (
    <article style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px', fontFamily: 'system-ui, sans-serif', lineHeight: 1.7 }}>
      <p style={{ color: '#666', fontSize: 14 }}>Engineering · v0.10.0</p>
      <h1>pyrpc dev: attach or start</h1>
      <p style={{ color: '#666' }}>
        How pyrpc dev decides whether to start uvicorn or attach to a server you're already running.
      </p>
      <hr />

      <h2>The problem it solves</h2>
      <p>
        Before v0.10.0, if you ran <code>uvicorn main:app --reload</code> in one terminal
        and then <code>pyrpc dev</code> in another, pyrpc would try to start a second uvicorn on the same
        port — and fail with a port conflict. You had to know to use <code>--types-only</code>.
        That flag is gone. The detection is automatic.
      </p>

      <h2>How detection works</h2>
      <p>
        On startup, <code>pyrpc dev</code> sends a <code>GET</code> request to{' '}
        <code>http://{'<host>'}:{'<port>'}/rpc</code> with a 1-second timeout. Any HTTP response
        (including errors) means something is running on that port. A connection refusal means nothing is.
      </p>
      <pre style={{ background: '#f4f4f4', padding: 16, borderRadius: 6, overflow: 'auto' }}><code>{`# Server already running — pyrpc attaches the watcher only
$ pyrpc dev
  ○ server already running at http://127.0.0.1:8000/rpc — skipping uvicorn
  ✓ types generated (3 procs) → src/__pyrpc.d.ts
  pyrpc>

# No server running — pyrpc starts uvicorn
$ pyrpc dev
  ✓ types generated (3 procs) → src/__pyrpc.d.ts
  pyRPC dev  http://127.0.0.1:8000/rpc
  pyrpc>`}</code></pre>

      <h2>When pyrpc starts uvicorn</h2>
      <p>
        pyrpc starts uvicorn with <code>--reload</code> by default — the same behaviour you'd get running
        uvicorn directly for development. If you need to disable it:
      </p>
      <pre style={{ background: '#f4f4f4', padding: 16, borderRadius: 6, overflow: 'auto' }}><code>{`pyrpc dev --no-reload`}</code></pre>
      <p>
        The uvicorn process runs your <code>module:app</code> directly. No temp files, no wrapping.
        If you change <code>module</code> in <code>pyrpc.json</code> while pyrpc dev is running,
        it restarts uvicorn with the new module automatically.
      </p>

      <h2>pyrpc watch — watcher only, always</h2>
      <p>
        If you prefer to always manage your server yourself, use <code>pyrpc watch</code>. It reads
        <code>pyrpc.json</code>, generates types once, then watches for <code>.py</code> changes.
        No server management at all.
      </p>
      <pre style={{ background: '#f4f4f4', padding: 16, borderRadius: 6, overflow: 'auto' }}><code>{`# Terminal 1
uvicorn main:app --reload --host 0.0.0.0 --port 8080 --log-level debug

# Terminal 2
pyrpc watch`}</code></pre>
      <p>
        This is also the right choice if you're running your server via Docker Compose, a Makefile, or
        any process manager that pyrpc shouldn't own.
      </p>

      <h2>The interactive console</h2>
      <p>
        Both <code>pyrpc dev</code> scenarios drop you into an interactive console after startup.
        The <code>restart</code> command only works when pyrpc started the server itself — if you
        attached to an existing server, it tells you so instead of silently failing.
      </p>
      <pre style={{ background: '#f4f4f4', padding: 16, borderRadius: 6, overflow: 'auto' }}><code>{`pyrpc> restart
  ○  server not managed by pyrpc — restart it yourself.`}</code></pre>
    </article>
  );
}
