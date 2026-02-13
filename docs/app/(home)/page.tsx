import Link from 'next/link';
import { cn } from '@/lib/cn';
import { StackedLogos } from '@/components/ui/stacked-logos';
import { PerspectiveGrid } from '@/components/ui/perspective-grid';
import AnimatedButton from '@/components/ui/animated-button';
import { BackToTop } from '@/components/ui/back-to-top';
import {
  Marquee,
  MarqueeContent,
  MarqueeFade,
  MarqueeItem,
} from '@/components/ui/marquee';
import {
  Testimonial,
  TestimonialAuthor,
  TestimonialAuthorName,
  TestimonialAuthorTagline,
  TestimonialAvatar,
  TestimonialAvatarImg,
  TestimonialAvatarRing,
  TestimonialQuote,
  TestimonialVerifiedBadge,
} from '@/components/ui/testimonial';
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
        <div className="relative z-10 flex flex-col items-center justify-center py-32 md:py-48 px-6 text-center space-y-8 max-w-5xl mx-auto flex-1">
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
              className={cn(
                "group px-10 py-4 min-w-[200px] border border-edge bg-muted/50",
                "text-xs font-bold uppercase tracking-[0.2em] font-mono",
                "flex items-center justify-center gap-3 transition-colors duration-300",
                "hover:bg-foreground hover:text-background"
              )}
            >
              Star on GitHub
              <span className="flex items-center gap-1.5 px-2 py-0.5 border border-edge bg-muted/50 text-sm tracking-normal">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 16 16">
                  <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z" />
                </svg>
                1
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Why pRPC Section */}
      <section className="py-24 px-6 bg-muted/30 border-t">
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

      {/* Code Example Section */}
      <section className="py-24 px-6 bg-muted/30">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">One definition. Fully typed.</h2>
            <p className="text-muted-foreground text-lg">No manual schema files, instant type safety, and pure Python-first RPC.</p>
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
                    <span className="text-white font-bold italic">class</span> <span className="text-neutral-300">User</span>(BaseModel):{'\n'}
                    {'    '}id: <span className="text-neutral-400">int</span>{'\n'}
                    {'    '}name: <span className="text-neutral-400">str</span>{'\n'}
                    {'\n'}
                    <span className="text-neutral-400 font-medium">@rpc</span>{'\n'}
                    <span className="text-white font-bold">async def</span> <span className="text-neutral-300">get_user</span>(id: <span className="text-neutral-400">int</span>) <span className="text-white">-{'>'}</span> <span className="text-neutral-300">User</span>:{'\n'}
                    {'    '}<span className="text-white font-bold">return</span> <span className="text-neutral-300">User</span>(id=id, name=<span className="text-neutral-400">"pRPC User"</span>){'\n'}
                    {'\n'}
                    <span className="text-neutral-400 font-medium">@rpc</span>{'\n'}
                    <span className="text-white font-bold">async def</span> <span className="text-neutral-300">update_user</span>(id: <span className="text-neutral-400">int</span>, name: <span className="text-neutral-400">str</span>):{'\n'}
                    {'    '}<span className="text-white font-bold">return await</span> db.users.<span className="text-neutral-300">update</span>(id, name=name)
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
                    <span className="text-white font-bold">const</span> user = <span className="text-white font-bold">await</span> client.<span className="text-neutral-300">get_user</span>(<span className="text-white font-medium">1</span>);{'\n'}
                    <span className="text-neutral-300">console</span>.<span className="text-neutral-300">log</span>(user.<span className="text-neutral-300">name</span>);{'\n'}
                    {'\n'}
                    <span className="text-neutral-500 italic">// Full type-safety on mutations!</span>{'\n'}
                    <span className="text-white font-bold">await</span> client.<span className="text-neutral-300">update_user</span>(<span className="text-white font-medium">1</span>, <span className="text-neutral-400">"New Name"</span>);
                  </code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 overflow-hidden bg-background">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="px-6 text-center space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Loved by developers</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Built for performance, reliability, and the best developer experience.
            </p>
          </div>
          <TestimonialsMarqueeSection />
        </div>
      </section>

      <Footer />
    </div>
  );
}

function Footer() {
  return (
    <footer className="w-full bg-background border-t border-edge">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="flex flex-wrap justify-between gap-12 py-8">
          {/* Column 1: Product */}
          <div className="space-y-6">
            <h4 className="text-sm font-bold uppercase tracking-widest text-foreground font-mono">Product</h4>
            <ul className="space-y-4">
              <li><Link href="/docs/concepts" className="text-sm text-fd-muted-foreground hover:text-foreground transition-colors font-mono uppercase tracking-tight">Transports</Link></li>
              <li><Link href="/docs/concepts" className="text-sm text-fd-muted-foreground hover:text-foreground transition-colors font-mono uppercase tracking-tight">Type Safety</Link></li>
              <li><Link href="/docs/concepts" className="text-sm text-fd-muted-foreground hover:text-foreground transition-colors font-mono uppercase tracking-tight">Performance</Link></li>
              <li><Link href="/docs/concepts" className="text-sm text-fd-muted-foreground hover:text-foreground transition-colors font-mono uppercase tracking-tight">Security</Link></li>
            </ul>
          </div>

          {/* Column 2: Developers */}
          <div className="space-y-6">
            <h4 className="text-sm font-bold uppercase tracking-widest text-foreground font-mono">Developers</h4>
            <ul className="space-y-4">
              <li><Link href="/docs" className="text-sm text-fd-muted-foreground hover:text-foreground transition-colors font-mono uppercase tracking-tight">Documentation</Link></li>
              <li><Link href="/docs/backend" className="text-sm text-fd-muted-foreground hover:text-foreground transition-colors font-mono uppercase tracking-tight">API Reference</Link></li>
              <li><Link href="/docs/plugins" className="text-sm text-fd-muted-foreground hover:text-foreground transition-colors font-mono uppercase tracking-tight">Plugins</Link></li>
              <li><Link href="/docs" className="text-sm text-fd-muted-foreground hover:text-fd-accent-foreground transition-colors font-mono uppercase tracking-tight">Examples</Link></li>
            </ul>
          </div>

          {/* Column 3: Ecosystem */}
          <div className="space-y-6">
            <h4 className="text-sm font-bold uppercase tracking-widest text-foreground font-mono">Ecosystem</h4>
            <ul className="space-y-4">
              <li><Link href="https://github.com/pRPC-dev/prpc" className="text-sm text-fd-muted-foreground hover:text-foreground transition-colors font-mono uppercase tracking-tight">GitHub</Link></li>
              <li><Link href="https://github.com/pRPC-dev/prpc/discussions" className="text-sm text-fd-muted-foreground hover:text-foreground transition-colors font-mono uppercase tracking-tight">Community</Link></li>
              <li><Link href="https://github.com/pRPC-dev/prpc/issues" className="text-sm text-fd-muted-foreground hover:text-foreground transition-colors font-mono uppercase tracking-tight">Roadmap</Link></li>
              <li><Link href="/docs" className="text-sm text-fd-muted-foreground hover:text-foreground transition-colors font-mono uppercase tracking-tight">Blog</Link></li>
            </ul>
          </div>

          {/* Column 4: Company */}
          <div className="space-y-6">
            <h4 className="text-sm font-bold uppercase tracking-widest text-foreground font-mono">Company</h4>
            <ul className="space-y-4">
              <li><Link href="/docs" className="text-sm text-fd-muted-foreground hover:text-foreground transition-colors font-mono uppercase tracking-tight">Mission</Link></li>
              <li><Link href="/docs" className="text-sm text-fd-muted-foreground hover:text-foreground transition-colors font-mono uppercase tracking-tight">Engineering</Link></li>
              <li><Link href="/docs" className="text-sm text-fd-muted-foreground hover:text-foreground transition-colors font-mono uppercase tracking-tight">Brand</Link></li>
              <li><Link href="mailto:contact@prpc.dev" className="text-sm text-fd-muted-foreground hover:text-foreground transition-colors font-mono uppercase tracking-tight">Contact</Link></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="w-full border-t border-edge">
        <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col md:flex-row justify-between items-end gap-12">
          <div className="space-y-2">
            <h3 className="text-2xl font-black tracking-tighter uppercase">pRPC</h3>
            <p className="text-sm text-fd-muted-foreground uppercase tracking-widest font-mono">The bridge between Python and Next.js</p>
          </div>
          <div className="flex flex-col items-end gap-2 text-right">
            <p className="text-xs text-fd-muted-foreground uppercase tracking-[0.2em] font-mono tabular-nums leading-none">
              &copy; {new Date().getFullYear()} pRPC INFRASTRUCTURE
            </p>
            <p className="text-[10px] text-fd-muted-foreground/50 uppercase tracking-[0.3em] font-mono leading-none">
              Built for speed. Driven by types.
            </p>
          </div>
        </div>
      </div>
      <BackToTop />
    </footer>
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

  const group4 = [
    <div key="boilerplate" className="flex flex-col items-center text-center space-y-4 p-8 w-full h-full">
      <div className="p-3 bg-primary/10 rounded-2xl">
        <Code className="w-10 h-10 text-primary" />
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-bold text-primary">Zero Boilerplate</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Focus on your logic, not the glue. No OpenAPI pain, schema files, or manual codegen required.
        </p>
      </div>
    </div>
  ];

  const group5 = [
    <div key="dx" className="flex flex-col items-center text-center space-y-4 p-8 w-full h-full">
      <div className="p-3 bg-primary/10 rounded-2xl">
        <Terminal className="w-10 h-10 text-primary" />
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-bold text-primary">Superior DX</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          A developer experience that feels like local function calls, with full IDE support and auto-completion.
        </p>
      </div>
    </div>
  ];

  const group6 = [
    <div key="flexibility" className="flex flex-col items-center text-center space-y-4 p-8 w-full h-full">
      <div className="p-3 bg-primary/10 rounded-2xl">
        <Settings className="w-10 h-10 text-primary" />
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-bold text-primary">Extreme Flexibility</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Scale from simple scripts to complex microservices with support for multiple transports and protocols.
        </p>
      </div>
    </div>
  ];

  return (
    <div className="w-full max-w-5xl flex flex-col gap-0 mx-auto">
      <div className="w-full border border-b-0 bg-background/50 overflow-hidden">
        <StackedLogos
          logoGroups={[group1, group2, group3]}
          disableAnimation
          logoWidth="33.333%"
          className="w-full"
        />
      </div>
      <div className="w-full border bg-background/50 overflow-hidden">
        <StackedLogos
          logoGroups={[group4, group5, group6]}
          disableAnimation
          logoWidth="33.333%"
          className="w-full"
        />
      </div>
    </div>
  );
}

function TestimonialsMarqueeSection() {
  return (
    <div className="w-full space-y-0 bg-background [&_.rfm-initial-child-container]:items-stretch! [&_.rfm-marquee]:items-stretch!">
      {[TESTIMONIALS_1, TESTIMONIALS_2].map((list, index) => (
        <Marquee key={index} className={cn("border-x border-edge", index === 0 ? "border-y" : "border-b")}>
          <MarqueeFade side="left" />
          <MarqueeFade side="right" />

          <MarqueeContent direction={index % 2 === 1 ? "right" : "left"}>
            {list.map((item) => (
              <MarqueeItem
                key={item.authorName}
                className="mx-0 h-full w-[341px] border-r border-edge"
              >
                <div className="block h-full transition-[background-color] ease-out hover:bg-accent/20">
                  <Testimonial>
                    <TestimonialQuote>
                      <p className="text-sm">{item.quote}</p>
                    </TestimonialQuote>

                    <TestimonialAuthor>
                      <TestimonialAvatar>
                        <TestimonialAvatarImg src={item.authorAvatar} />
                        <TestimonialAvatarRing />
                      </TestimonialAvatar>

                      <TestimonialAuthorName>
                        {item.authorName}
                        <TestimonialVerifiedBadge />
                      </TestimonialAuthorName>

                      <TestimonialAuthorTagline>
                        {item.authorTagline}
                      </TestimonialAuthorTagline>
                    </TestimonialAuthor>
                  </Testimonial>
                </div>
              </MarqueeItem>
            ))}
          </MarqueeContent>
        </Marquee>
      ))}
    </div>
  )
}

const TESTIMONIALS_1 = [
  {
    authorAvatar: "https://unavatar.io/github/antfu",
    authorName: "Anthony Fu",
    authorTagline: "Vue/Vite Core Team",
    quote: "pRPC is exactly what I needed for my Python backends. The type safety is incredible.",
  },
  {
    authorAvatar: "https://unavatar.io/twitter/shuding_",
    authorName: "Shu Ding",
    authorTagline: "Designer at Vercel",
    quote: "The developer experience is beautiful. It feels like magic how types just flow through.",
  },
  {
    authorAvatar: "https://unavatar.io/github/tiangolo",
    authorName: "Sebastián Ramírez",
    authorTagline: "Creator of FastAPI",
    quote: "pRPC complements modern Python perfectly. The Pydantic integration is top-notch.",
  },
  {
    authorAvatar: "https://unavatar.io/github/shadcn",
    authorName: "shadcn",
    authorTagline: "Creator of shadcn/ui",
    quote: "Clean, minimal, and solves a real problem. This is how modern APIs should be built.",
  },
]

const TESTIMONIALS_2 = [
  {
    authorAvatar: "https://unavatar.io/github/leeerob",
    authorName: "Lee Robinson",
    authorTagline: "VP of Product @Vercel",
    quote: "Next.js + Python has never felt this integrated. pRPC is the missing link.",
  },
  {
    authorAvatar: "https://unavatar.io/github/delbaoliveira",
    authorName: "Delba de Oliveira",
    authorTagline: "Developer Advocate at Vercel",
    quote: "I love how it removes the need for OpenAPI codegen. Just pure, typed communication.",
  },
  {
    authorAvatar: "https://unavatar.io/github/mguay22",
    authorName: "Marc-André Guay",
    authorTagline: "Full-stack Developer",
    quote: "Zero boilerplate means more time spent on actual features. pRPC is a game changer.",
  },
  {
    authorAvatar: "https://unavatar.io/github/rauchg",
    authorName: "Guillermo Rauch",
    authorTagline: "CEO @Vercel",
    quote: "Shipping faster is all about reducing friction. pRPC removes the API friction entirely.",
  },
]
