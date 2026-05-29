import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="px-6 md:px-12 lg:px-20 pt-24 pb-40">
      <div className="max-w-[680px] mx-auto">
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/" className="text-fd-foreground/30 text-[11px] font-mono hover:text-fd-foreground/60 transition-all">pyRPC</Link>
            <span className="text-fd-foreground/20">/</span>
            <span className="text-fd-foreground/50 text-[11px] font-mono">Privacy</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-fd-foreground mb-4">
            Privacy
          </h1>
          <p className="text-fd-foreground/50 text-sm leading-relaxed max-w-xl font-sans">
            pyRPC is an open-source library, not a service. No accounts, no analytics, no backend.
          </p>
          <div className="mt-6 text-[11px] font-mono text-fd-foreground/30 tracking-wide">
            Last updated · May 2026
          </div>
        </div>

        <Section title="The short version">
          <ul className="space-y-2">
            <li><Bullet /> No accounts, no sign-up, no telemetry.</li>
            <li><Bullet /> The library runs entirely on your machine — no data is sent anywhere unless you explicitly trigger a command that makes a network request.</li>
          </ul>
        </Section>

        <Section title="Network requests">
          <p className="mb-4">
            pyRPC itself makes no network requests. The CLI only reaches out when you run specific commands:
          </p>
          <ul className="space-y-2">
            <li><Bullet /> <Code>pyrpc pull</Code> introspects your local Python module — no network.</li>
            <li><Bullet /> <Code>npm install @pyrpc/client</Code> and <Code>uv add pyrpc-core</Code> use standard package managers (npm, uv) which fetch from their respective registries.</li>
          </ul>
        </Section>

        <Section title="What we collect">
          <p>
            Nothing. pyRPC has no telemetry, no analytics, and no backend server. We don't run analytics on this site, don't set tracking cookies, and don't embed third-party trackers. The only data we see is what you voluntarily send — GitHub issues, PRs, or emails to the addresses below.
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
    <div className="mb-12">
      <h2 className="text-lg font-bold tracking-tight text-fd-foreground mb-4">{title}</h2>
      <div className="text-fd-foreground/50 text-[14px] leading-relaxed font-sans">
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
