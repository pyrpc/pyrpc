import { PerspectiveGrid } from '@/components/ui/perspective-grid';
import Link from 'next/link';
import AnimatedButton from '@/components/ui/animated-button';

export default function DemoPage() {
    return (
        <div className="flex flex-col min-h-screen bg-background">
            <section className="relative w-full overflow-hidden border-b bg-background py-24 md:py-32 flex flex-col items-center">
                <PerspectiveGrid className="absolute inset-0 z-0" />
                <div className="relative z-10 max-w-5xl mx-auto px-6 text-center space-y-8">
                    <div className="inline-flex items-center px-3 py-1 border border-primary/20 bg-primary/5 rounded-none text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-4 font-mono">
                        pRPC Infrastructure
                    </div>
                    <h1 className="text-4xl md:text-7xl font-extrabold tracking-tighter text-foreground">
                        Live Demo
                    </h1>
                    <p className="max-w-2xl mx-auto text-lg md:text-xl text-fd-muted-foreground/80 leading-relaxed tracking-tight">
                        Experience the bridge between Python and Next.js.
                        Real-time, type-safe, and blisteringly fast.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8">
                        <Link href="/" className="group">
                            <AnimatedButton
                                as="div"
                                className="px-8 py-3 text-sm font-bold rounded-none min-w-[180px] uppercase tracking-widest font-mono"
                            >
                                Back to Home
                            </AnimatedButton>
                        </Link>
                    </div>
                </div>
            </section>

            <section className="py-24 px-6 relative z-10">
                <div className="max-w-5xl mx-auto border border-edge bg-muted/20 p-12 text-center space-y-6">
                    <h2 className="text-2xl font-bold uppercase tracking-widest font-mono">Interactive Showcase Coming Soon</h2>
                    <p className="text-fd-muted-foreground font-mono uppercase tracking-tight max-w-xl mx-auto">
                        We are building a live environment where you can prototype Python RPCs and see immediate TypeScript definitions.
                    </p>
                    <div className="flex justify-center pt-4">
                        <div className="w-24 h-1 bg-edge animate-pulse" />
                    </div>
                </div>
            </section>
        </div>
    );
}
