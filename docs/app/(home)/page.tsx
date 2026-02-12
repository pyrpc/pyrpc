import Link from 'next/link';
import { StackedLogos } from '@/components/ui/stacked-logos';
import {
  Database,
  ShieldCheck,
  Zap,
  Cpu,
  Globe,
  Layers,
  Cloud,
  Lock,
  Search,
  Settings,
  Terminal,
  Code
} from 'lucide-react';

export default function HomePage() {
  return (
    <main className="flex flex-col flex-1">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center py-20 px-6 text-center space-y-6">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-foreground">
          pRPC
        </h1>
        <h2 className="text-3xl md:text-4xl font-bold text-muted-foreground">
          Type-safe, Python-first RPC for modern APIs
        </h2>
        <p className="max-w-2xl text-lg text-muted-foreground/80">
          Build end-to-end typed APIs without OpenAPI pain, codegen, or boilerplate.
        </p>
        <div className="flex flex-row gap-4 pt-4">
          <Link
            href="/docs"
            className="px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors"
          >
            Get started →
          </Link>
          <Link
            href="https://github.com/pRPC-dev/prpc"
            className="px-6 py-3 bg-secondary text-secondary-foreground font-semibold rounded-lg hover:bg-secondary/90 transition-colors"
          >
            GitHub
          </Link>
        </div>
      </section>

      {/* Why pRPC Section */}
      <section className="py-24 px-6 bg-muted/30 border-y">
        <div className="max-w-5xl mx-auto space-y-16">
          <div className="space-y-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Why pRPC?</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Built for performance, developer experience, and safety.
            </p>
          </div>

          <div className="flex justify-center w-full">
            <FeaturesSection />
          </div>
        </div>
      </section>

      {/* Comparison Block */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto space-y-12 overflow-hidden">
          <h2 className="text-3xl font-bold text-center">Modern RPC for Python</h2>
          <div className="relative overflow-x-auto rounded-xl border">
            <table className="w-full text-left">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="p-4 font-semibold">Problem</th>
                  <th className="p-4 font-semibold text-muted-foreground">REST / OpenAPI</th>
                  <th className="p-4 font-semibold text-muted-foreground">gRPC</th>
                  <th className="p-4 font-semibold text-primary">pRPC</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="p-4 font-medium">Boilerplate</td>
                  <td className="p-4">High</td>
                  <td className="p-4">High</td>
                  <td className="p-4 font-bold text-primary">Low</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">Python DX</td>
                  <td className="p-4">Medium</td>
                  <td className="p-4">Poor</td>
                  <td className="p-4 font-bold text-primary">Excellent</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">Type safety</td>
                  <td className="p-4">Partial</td>
                  <td className="p-4">Strong</td>
                  <td className="p-4 font-bold text-primary">Strong</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">Flexibility</td>
                  <td className="p-4">Medium</td>
                  <td className="p-4">Low</td>
                  <td className="p-4 font-bold text-primary">High</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Code Example Section */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-4xl mx-auto space-y-8 text-center">
          <h2 className="text-3xl font-bold">One definition. Fully typed. No schema files.</h2>
          <div className="grid md:grid-cols-2 gap-4 text-left">
            <div className="p-6 bg-card rounded-xl border border-border">
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">server.py</h3>
              <pre className="text-sm font-mono text-primary">
                <code>{`@rpc
async def get_user(user_id: int) -> User:
    return await db.users.get(user_id)`}</code>
              </pre>
            </div>
            <div className="p-6 bg-card rounded-xl border border-border">
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">client.py</h3>
              <pre className="text-sm font-mono text-primary">
                <code>{`user = await client.get_user.aio(user_id=1)
# Fully typed result!`}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t text-center space-y-4">
        <div className="flex justify-center gap-6">
          <Link href="/docs" className="text-muted-foreground hover:text-foreground">Docs</Link>
          <Link href="https://github.com/AtnatewosH/prpc" className="text-muted-foreground hover:text-foreground">GitHub</Link>
        </div>
        <p className="text-sm text-muted-foreground">Built in public</p>
      </footer>
    </main>
  );
}

function FeaturesSection() {
  const group1 = [
    <div key="native" className="flex flex-col items-center text-center space-y-4 p-8 w-full h-full">
      <div className="p-3 bg-primary/10 rounded-2xl">
        <Zap className="w-10 h-10 text-primary" />
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-bold text-primary">Python-native</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Built for asyncio, Pydantic, and modern Python — not a port of a legacy protocol.
        </p>
      </div>
    </div>
  ];

  const group2 = [
    <div key="typed" className="flex flex-col items-center text-center space-y-4 p-8 w-full h-full">
      <div className="p-3 bg-primary/10 rounded-2xl">
        <ShieldCheck className="w-10 h-10 text-primary" />
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-bold text-primary">End-to-end typing</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Request, response, and errors stay in sync without schemas or generators.
        </p>
      </div>
    </div>
  ];

  const group3 = [
    <div key="plugins" className="flex flex-col items-center text-center space-y-4 p-8 w-full h-full">
      <div className="p-3 bg-primary/10 rounded-2xl">
        <Layers className="w-10 h-10 text-primary" />
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-bold text-primary">Plugin-driven</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Auth, caching, observability, and transports as composable plugins.
        </p>
      </div>
    </div>
  ];

  return (
    <div className="w-full max-w-5xl border bg-background/50 overflow-hidden mx-auto">
      <StackedLogos
        logoGroups={[group1, group2, group3]}
        disableAnimation
        logoWidth="33.333%"
        className="w-full"
      />
    </div>
  );
}
