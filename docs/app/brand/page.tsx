import Image from 'next/image';
import { cn } from '@/lib/cn';
import { ColorPalette } from './color-palette';
import { ButtonSamples, ContextMenuDemo } from './components-showcase';

export default function BrandPage() {
  return (
    <div className="relative min-h-[calc(100svh-6.5rem)] pt-14 md:pt-24 pb-20 overflow-hidden">
      <div className="relative mx-auto max-w-[1200px] px-6">
        <div className="mb-16">
          <h1 className="text-2xl font-semibold tracking-tight leading-tight text-fd-foreground">
            Brand
          </h1>
          <p className="mt-4 text-sm text-fd-muted-foreground leading-relaxed max-w-xl">
            The visual language, tokens, and design motifs that power the pyRPC ecosystem. These elements maintain consistency across our documentation and product interfaces.
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-24 min-w-0 pb-16">
            
            {/* Foundations */}
            <section id="foundations" className="scroll-mt-24 space-y-8">
              <div className="flex items-baseline justify-between border-b border-fd-border pb-3">
                <h2 className="text-lg md:text-xl font-medium tracking-tight text-fd-foreground">Foundations</h2>
                <span className="text-[11px] font-mono text-fd-muted-foreground/60">01</span>
              </div>
              
              <div className="space-y-12">
                {/* Color */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-fd-foreground">Color</h3>
                    <p className="text-[13px] text-fd-muted-foreground leading-relaxed max-w-prose">
                      The palette that makes up every surface in the product. Click a swatch to copy its hex.
                    </p>
                  </div>
                  <ColorPalette />
                </div>

                {/* Typography */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-fd-foreground">Typography</h3>
                    <p className="text-[13px] text-fd-muted-foreground leading-relaxed max-w-prose">
                      We utilize <strong>Geist Sans</strong> for all primary UI text to ensure crisp readability, paired with <strong>Geist Mono</strong> for code snippets, CLI commands, and technical metadata.
                    </p>
                  </div>
                  <div className="divide-y divide-fd-border border border-fd-border rounded-lg">
                    <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-4 p-5">
                      <div className="space-y-1">
                        <p className="text-[12px] font-medium text-fd-foreground">Geist Sans · H1</p>
                        <p className="text-[10px] font-mono text-fd-muted-foreground">text-4xl tracking-tight</p>
                      </div>
                      <div className="text-4xl tracking-tight font-semibold text-fd-foreground">Type-Safe APIs.</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-4 p-5">
                      <div className="space-y-1">
                        <p className="text-[12px] font-medium text-fd-foreground">Geist Sans · Body</p>
                        <p className="text-[10px] font-mono text-fd-muted-foreground">text-sm leading-relaxed</p>
                      </div>
                      <div className="text-sm leading-relaxed text-fd-muted-foreground">
                        Define procedures in Python. Consume them in TypeScript with full type safety. No schema drift, no codegen pipelines.
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-4 p-5">
                      <div className="space-y-1">
                        <p className="text-[12px] font-medium text-fd-foreground">Geist Mono · Code</p>
                        <p className="text-[10px] font-mono text-fd-muted-foreground">font-mono text-sm</p>
                      </div>
                      <div className="font-mono text-sm text-fd-foreground">
                        const api = createClient&lt;Types&gt;();
                      </div>
                    </div>
                  </div>
                </div>

                {/* Radius */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-fd-foreground">Radius</h3>
                    <p className="text-[13px] text-fd-muted-foreground leading-relaxed max-w-prose">
                      Radii are kept deliberately tight. Containers default to <code className="font-mono text-[12px]">lg</code>, controls sit one step below at <code className="font-mono text-[12px]">md</code>, avatars and badges break to <code className="font-mono text-[12px]">full</code>. Code and editor surfaces stay sharp for a more editorial feel.
                    </p>
                  </div>
                  <div className="divide-y divide-fd-border border border-fd-border rounded-lg">
                    {[
                      { name: 'sharp · code', token: 'rounded-none', cls: 'rounded-none', usage: 'Code blocks, editors, terminal windows' },
                      { name: 'md · controls', token: 'rounded-md', cls: 'rounded-md', usage: 'Buttons, inputs, chips, inline callouts' },
                      { name: 'lg (default)', token: 'rounded-lg', cls: 'rounded-lg', usage: 'Cards, panels, windows, page surfaces' },
                      { name: 'full', token: 'rounded-full', cls: 'rounded-full', usage: 'Avatars, pills, badges' },
                    ].map((row) => (
                      <div key={row.name} className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-4 p-5">
                        <div className="space-y-1">
                          <p className="text-[12px] font-medium text-fd-foreground">{row.name}</p>
                          <p className="text-[10px] font-mono text-fd-muted-foreground">{row.token}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 justify-between">
                          <span
                            className={cn(
                              'inline-flex h-10 w-28 items-center justify-center border border-fd-border bg-neutral-50 dark:bg-white/[0.04]',
                              row.cls,
                            )}
                          />
                          <span className="text-[12px] text-fd-muted-foreground">{row.usage}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Motifs */}
            <section id="motifs" className="scroll-mt-24 space-y-8">
              <div className="flex items-baseline justify-between border-b border-fd-border pb-3">
                <h2 className="text-lg md:text-xl font-medium tracking-tight text-fd-foreground">Motifs</h2>
                <span className="text-[11px] font-mono text-fd-muted-foreground/60">02</span>
              </div>

              <p className="text-[13px] text-fd-muted-foreground leading-relaxed max-w-prose">
                Repeating patterns used across our surfaces, quiet structure instead of ornament.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border border-fd-border rounded-lg overflow-hidden flex flex-col">
                  <div className="h-40 w-full bg-grid text-fd-foreground/20 relative" />
                  <div className="flex items-baseline justify-between border-t border-fd-border bg-fd-background px-4 py-3">
                    <p className="text-[12px] font-medium text-fd-foreground">Grid Pattern</p>
                    <p className="text-[10px] font-mono text-fd-muted-foreground">.bg-grid</p>
                  </div>
                </div>
                <div className="border border-fd-border rounded-lg overflow-hidden flex flex-col">
                  <div className="h-40 w-full bg-dot text-fd-foreground/30 relative" />
                  <div className="flex items-baseline justify-between border-t border-fd-border bg-fd-background px-4 py-3">
                    <p className="text-[12px] font-medium text-fd-foreground">Dot Pattern</p>
                    <p className="text-[10px] font-mono text-fd-muted-foreground">.bg-dot</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Components */}
            <section id="components" className="scroll-mt-24 space-y-8">
              <div className="flex items-baseline justify-between border-b border-fd-border pb-3">
                <h2 className="text-lg md:text-xl font-medium tracking-tight text-fd-foreground">Components</h2>
                <span className="text-[11px] font-mono text-fd-muted-foreground/60">03</span>
              </div>

              <div className="space-y-12">
                {/* Buttons */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-fd-foreground">Buttons</h3>
                    <p className="text-[13px] text-fd-muted-foreground leading-relaxed max-w-prose">
                      Three variants, three sizes.
                    </p>
                  </div>
                  <ButtonSamples />
                </div>

                {/* Context Menu */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-fd-foreground">Context Menu</h3>
                    <p className="text-[13px] text-fd-muted-foreground leading-relaxed max-w-prose">
                      Right-click affordances. The header logo opens this menu; the Resources nav dropdown shares the same treatment.
                    </p>
                  </div>
                  <ContextMenuDemo />
                </div>

                {/* Card */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-fd-foreground">Card</h3>
                    <p className="text-[13px] text-fd-muted-foreground leading-relaxed max-w-prose">
                      Flat border, no shadow. Uses dashed footer rules for meta.
                    </p>
                  </div>
                  <div className="max-w-md border border-fd-border rounded-lg bg-fd-background">
                    <div className="p-5 space-y-1.5">
                      <p className="text-sm font-medium text-fd-foreground">get_user</p>
                      <p className="text-[13px] text-fd-muted-foreground leading-relaxed">
                        The canonical query unit, typed input, typed return, inferred end to end.
                      </p>
                    </div>
                    <div className="flex items-center justify-between border-t border-dashed border-fd-border px-5 py-2.5">
                      <span className="font-mono text-[10px] text-fd-muted-foreground">query</span>
                      <span className="font-mono text-[10px] text-fd-muted-foreground">User</span>
                    </div>
                  </div>
                </div>

                {/* Fixed values */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-fd-foreground">Fixed values</h3>
                    <p className="text-[13px] text-fd-muted-foreground leading-relaxed max-w-prose">
                      Literal values used on marketing surfaces and code windows, outside the theme. Surfaces stay flat; elevation is reserved for overlays.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-fd-border/50 border border-fd-border rounded-lg overflow-hidden">
                    {[
                      { name: 'Signal', hex: '#97c983' },
                      { name: 'Surface', hex: '#0a0a0a' },
                      { name: 'Surface Raised', hex: '#101010' },
                      { name: 'Hairline Strong', hex: '#262626' },
                    ].map((color) => (
                      <div key={color.name} className="bg-fd-background p-4 space-y-3">
                        <div
                          className="h-12 w-full rounded-md border border-fd-border/50"
                          style={{ backgroundColor: color.hex }}
                        />
                        <div className="space-y-1">
                          <p className="text-[12px] font-medium text-fd-foreground">{color.name}</p>
                          <p className="font-mono text-[10px] text-fd-muted-foreground">{color.hex}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Logo */}
            <section id="logo" className="scroll-mt-24 space-y-8">
              <div className="flex items-baseline justify-between border-b border-fd-border pb-3">
                <h2 className="text-lg md:text-xl font-medium tracking-tight text-fd-foreground">Logo</h2>
                <span className="text-[11px] font-mono text-fd-muted-foreground/60">04</span>
              </div>
              
              <div className="space-y-4">
                <p className="text-[13px] text-fd-muted-foreground leading-relaxed max-w-prose">
                  Use the mark at 24px minimum. Prefer the wordmark when the brand needs to read at a distance.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Mark Dark (Dark BG) */}
                  <div className="border border-[#262626] rounded-lg overflow-hidden flex flex-col group bg-black">
                    <div className="h-40 flex items-center justify-center">
                      <Image src="/branding/png/pyrpc-mark-bg-dark.png" alt="Mark Dark" width={64} height={64} className="h-12 w-12" />
                    </div>
                    <div className="flex items-center justify-between border-t border-[#262626] bg-black px-4 py-3">
                      <p className="text-[11px] font-semibold tracking-wide text-white">Mark · Dark</p>
                      <a href="/branding/png/pyrpc-mark-bg-dark.png" download className="text-[10px] font-mono text-neutral-500 hover:text-white transition-colors">.png ↓</a>
                    </div>
                  </div>

                  {/* Mark Light (Light BG) */}
                  <div className="border border-[#262626] rounded-lg overflow-hidden flex flex-col group bg-black">
                    <div className="h-40 flex items-center justify-center bg-white">
                      <Image src="/branding/png/pyrpc-mark-bg-light.png" alt="Mark Light" width={64} height={64} className="h-12 w-12" />
                    </div>
                    <div className="flex items-center justify-between border-t border-[#262626] bg-black px-4 py-3">
                      <p className="text-[11px] font-semibold tracking-wide text-white">Mark · Light</p>
                      <a href="/branding/png/pyrpc-mark-bg-light.png" download className="text-[10px] font-mono text-neutral-500 hover:text-white transition-colors">.png ↓</a>
                    </div>
                  </div>

                  {/* Wordmark Dark (Dark BG) */}
                  <div className="border border-[#262626] rounded-lg overflow-hidden flex flex-col group bg-black">
                    <div className="h-40 flex items-center justify-center">
                      <Image src="/branding/png/pyrpc-wordmark-bg-dark.png" alt="Wordmark Dark" width={160} height={40} className="h-8 w-auto px-4" />
                    </div>
                    <div className="flex items-center justify-between border-t border-[#262626] bg-black px-4 py-3">
                      <p className="text-[11px] font-semibold tracking-wide text-white">Wordmark · Dark</p>
                      <a href="/branding/png/pyrpc-wordmark-bg-dark.png" download className="text-[10px] font-mono text-neutral-500 hover:text-white transition-colors">.png ↓</a>
                    </div>
                  </div>

                  {/* Wordmark Light (Light BG) */}
                  <div className="border border-[#262626] rounded-lg overflow-hidden flex flex-col group bg-black">
                    <div className="h-40 flex items-center justify-center bg-white">
                      <Image src="/branding/png/pyrpc-wordmark-bg-light.png" alt="Wordmark Light" width={160} height={40} className="h-8 w-auto px-4" />
                    </div>
                    <div className="flex items-center justify-between border-t border-[#262626] bg-black px-4 py-3">
                      <p className="text-[11px] font-semibold tracking-wide text-white">Wordmark · Light</p>
                      <a href="/branding/png/pyrpc-wordmark-bg-light.png" download className="text-[10px] font-mono text-neutral-500 hover:text-white transition-colors">.png ↓</a>
                    </div>
                  </div>
                </div>
              </div>
            </section>

        </div>
      </div>
    </div>
  );
}
