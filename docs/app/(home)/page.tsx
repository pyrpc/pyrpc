import Link from 'next/link';
import { StackedLogos } from '@/components/ui/stacked-logos';
import { PerspectiveGrid } from '@/components/ui/perspective-grid';
import AnimatedButton from '@/components/ui/animated-button';
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
    <div className="flex flex-col flex-1">
      {/* Hero Section */}
      <section className="relative w-full overflow-hidden border-b bg-background min-h-screen flex flex-col">
        <PerspectiveGrid className="absolute inset-0 z-0" />
        <div className="relative z-10 flex flex-col items-center justify-center py-32 md:py-48 px-6 text-center space-y-8 max-w-7xl mx-auto flex-1">
          <h1 className="text-6xl md:text-8xl font-extrabold tracking-tighter text-foreground">
            pRPC
          </h1>
          <div className="space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold text-fd-muted-foreground tracking-tight">
              Type-safe, Python-first RPC
            </h2>
            <p className="max-w-2xl mx-auto text-lg md:text-xl text-fd-muted-foreground/80 leading-relaxed">
              Build end-to-end typed APIs without OpenAPI pain, codegen, or boilerplate.
              The bridge between Python and Next.js.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-6 pt-4 shrink-0 transition-all">
            <Link href="/docs" className="group">
              <AnimatedButton
                as="div"
                className="px-10 py-4 text-lg font-bold rounded-none shadow-2xl shadow-fd-primary/20 min-w-[200px]"
              >
                Get started →
              </AnimatedButton>
            </Link>
            <Link
              href="https://github.com/pRPC-dev/prpc"
              className="px-10 py-4 text-lg font-bold rounded-none shadow-2xl min-w-[200px] bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-neutral-800/80 transition-colors"
            >
              GitHub
            </Link>
          </div>
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
      <section className="py-24 px-6 bg-muted/30 border-y">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">One definition. Fully typed.</h2>
            <p className="text-muted-foreground text-lg">No schema files, no codegen, just pure Python and TypeScript.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Server Code Window */}
            <div className="flex flex-col rounded-none overflow-hidden border border-neutral-800 bg-black shadow-2xl">
              <div className="flex items-center justify-between px-4 py-3 bg-neutral-900 border-b border-neutral-800">
                <div className="flex gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-neutral-700" />
                  <div className="w-2.5 h-2.5 rounded-full bg-neutral-700" />
                  <div className="w-2.5 h-2.5 rounded-full bg-neutral-700" />
                </div>
                <div className="text-xs font-medium text-neutral-400 font-mono tracking-wider">SERVER.PY</div>
                <div className="w-10" />
              </div>
              <div className="p-6 font-mono text-sm leading-relaxed overflow-x-auto">
                <pre>
                  <code className="text-white">
                    <span className="text-neutral-400 font-medium">@rpc</span>{'\n'}
                    <span className="text-white font-bold">async def</span> <span className="text-neutral-300">get_user</span>(user_id: <span className="text-neutral-400 text-xs uppercase tracking-widest font-bold">int</span>) <span className="text-white">-{'>'}</span> <span className="text-neutral-400 text-xs uppercase tracking-widest font-bold">User</span>:{'\n'}
                    {'    '}<span className="text-white font-bold">return await</span> db.users.<span className="text-neutral-300">get</span>(user_id)
                  </code>
                </pre>
              </div>
            </div>

            {/* Client Code Window */}
            <div className="flex flex-col rounded-none overflow-hidden border border-neutral-800 bg-black shadow-2xl">
              <div className="flex items-center justify-between px-4 py-3 bg-neutral-900 border-b border-neutral-800">
                <div className="flex gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-neutral-700" />
                  <div className="w-2.5 h-2.5 rounded-full bg-neutral-700" />
                  <div className="w-2.5 h-2.5 rounded-full bg-neutral-700" />
                </div>
                <div className="text-xs font-medium text-neutral-400 font-mono tracking-wider">CLIENT.TS</div>
                <div className="w-10" />
              </div>
              <div className="p-6 font-mono text-sm leading-relaxed overflow-x-auto">
                <pre>
                  <code className="text-white">
                    <span className="text-white font-bold">const</span> user = <span className="text-white font-bold">await</span> client.get_user.<span className="text-neutral-300">aio</span>({'{'} user_id: <span className="text-white font-medium">1</span> {'}'});{'\n'}
                    <span className="text-neutral-500 italic">// Fully typed result!</span>{'\n'}
                    <span className="text-neutral-300">console</span>.<span className="text-neutral-300">log</span>(user.<span className="text-neutral-300">name</span>);
                  </code>
                </pre>
              </div>
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
    </div>
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
