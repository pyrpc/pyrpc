import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="px-6 md:px-12 lg:px-20 pt-24 pb-40">
      <div className="max-w-[680px] mx-auto">
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/" className="text-fd-foreground/30 text-[11px] font-mono hover:text-fd-foreground/60 transition-all">pyRPC</Link>
            <span className="text-fd-foreground/20">/</span>
            <span className="text-fd-foreground/50 text-[11px] font-mono">Terms</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-fd-foreground mb-4">
            Terms of Use
          </h1>
          <p className="text-fd-foreground/50 text-sm leading-relaxed max-w-xl font-sans">
            Plain-language terms for using pyRPC. The software is governed by the MIT license; this page covers the website and the project overall.
          </p>
          <div className="mt-6 text-[11px] font-mono text-fd-foreground/30 tracking-wide">
            Last updated · May 2026
          </div>
        </div>

        <Section title="The short version">
          <ul className="space-y-2">
            <li><Bullet /> pyRPC is free, open source, and provided as-is.</li>
            <li><Bullet /> You are responsible for what you build with it.</li>
            <li><Bullet /> No warranty, no liability beyond what the MIT license allows.</li>
          </ul>
        </Section>

        <Section title="1. The software">
          <p>
            The pyRPC packages (Python and TypeScript) are licensed under the MIT License. The license text in the repository governs your use of the source code and distributed packages. These terms apply to the website at pyrpc.com and to anything not covered by the license.
          </p>
        </Section>

        <Section title="2. No warranty">
          <p>
            pyRPC is provided &ldquo;AS IS&rdquo;, without warranty of any kind, express or implied. We do not warrant that pyRPC will be error-free, secure, or uninterrupted, or that it will fit any particular purpose.
          </p>
        </Section>

        <Section title="3. Limitation of liability">
          <p>
            To the maximum extent permitted by law, in no event will pyRPC or its maintainers be liable for any indirect, incidental, special, consequential, or punitive damages arising out of your use of pyRPC. The MIT license&rsquo;s limitation of liability applies in full.
          </p>
        </Section>

        <Section title="4. Changes">
          <p>
            We may update these terms. Material changes will be reflected in the &ldquo;Last updated&rdquo; date at the top of this page.
          </p>
        </Section>

        <Section title="5. Contact">
          <p>
            Questions? <a href="mailto:info@pyrpc.com" className="text-fd-foreground/70 underline underline-offset-2 hover:text-fd-foreground transition-all">info@pyrpc.com</a>.
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
