import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="relative min-h-[calc(100svh-6.5rem)] pt-14 md:pt-24 pb-20 overflow-hidden">
      <div className="relative max-w-2xl mx-auto px-6">
        <div className="mb-16">
          <h1 className="text-2xl font-semibold tracking-tight leading-tight text-fd-foreground">
            Privacy Policy
          </h1>
          <p className="mt-4 text-sm text-fd-muted-foreground leading-relaxed max-w-xl">
            pyRPC is an open-source library, not a service. No accounts, no analytics, no backend.
          </p>
          <div className="mt-4 text-[10px] font-mono text-fd-foreground/30 tracking-wide">
            Last updated · August 2026
          </div>
        </div>

        <Section title="The short version">
          <ul className="space-y-2">
            <li><Bullet /> No accounts, no sign-up, no telemetry.</li>
            <li><Bullet /> The library runs entirely on your machine - no data is sent anywhere unless you explicitly trigger a command that makes a network request.</li>
          </ul>
        </Section>

        <Section title="Network requests">
          <p className="mb-4">
            pyRPC makes no network requests on its own. The CLI only reaches out when a command needs it, and always to destinations you configure:
          </p>
          <ul className="space-y-2">
            <li><Bullet /> <Code>pyrpc pull</Code> and local codegen introspect your Python module and write files locally. No network.</li>
            <li><Bullet /> <Code>pyrpc dev</Code> and <Code>pyrpc serve</Code> start a server on localhost (127.0.0.1 by default) and probe only that address to detect a running instance.</li>
            <li><Bullet /> Codegen can fetch an introspection schema from a server URL you explicitly pass (typically your own dev server).</li>
            <li><Bullet /> <Code>npm install @pyrpc/client</Code> and <Code>uv add pyrpc-core</Code> use standard package managers (npm, uv) which fetch from their respective registries.</li>
          </ul>
        </Section>

        <Section title="What we collect">
          <p className="mb-4">
            Nothing. pyRPC has no telemetry, no analytics, and no backend server. We don&rsquo;t run analytics on this site, don&rsquo;t set tracking cookies, and don&rsquo;t embed third-party trackers. The only data we see is what you voluntarily send: GitHub issues, PRs, or emails to the addresses below.
          </p>
          <p>
            The site loads static assets such as fonts and icons from public CDNs. Those providers see standard request metadata (IP address, user agent) for asset delivery; nothing identifying you is sent to us or stored by us.
          </p>
        </Section>

        <Section title="Changes">
          <p>
            If this policy changes, the &ldquo;Last updated&rdquo; date at the top of the page changes with it.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Privacy questions: <a href="mailto:info@pyrpc.com" className="text-fd-foreground/70 underline underline-offset-2 hover:text-fd-foreground transition-all">info@pyrpc.com</a>.
            Source: <a href="https://github.com/pyrpc/pyrpc" target="_blank" rel="noreferrer" className="text-fd-foreground/70 underline underline-offset-2 hover:text-fd-foreground transition-all">github.com/pyrpc/pyrpc</a>.
          </p>
        </Section>

      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="text-[14px] font-semibold text-fd-foreground mb-3">{title}</h2>
      <div className="text-fd-muted-foreground/80 text-[13px] leading-relaxed font-sans">
        {children}
      </div>
    </div>
  );
}

function Bullet() {
  return <span className="text-fd-foreground/20 mr-3">-</span>;
}

function Code({ children }: { children: React.ReactNode }) {
  return <code className="text-fd-foreground/70 text-[12px] font-mono bg-fd-foreground/5 px-1.5 py-0.5 rounded">{children}</code>;
}
