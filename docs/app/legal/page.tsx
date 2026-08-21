import Link from 'next/link';
import { Shield, FileText, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/cn';

export default function LegalPage() {
  return (
    <div className="relative min-h-[calc(100svh-6.5rem)] pt-14 md:pt-24 pb-20 overflow-hidden">
      <div className="relative mx-auto max-w-2xl px-6">
        <div className="mb-16">
          <h1 className="text-2xl font-semibold tracking-tight leading-tight text-fd-foreground">
            Terms &amp; Policies
          </h1>
          <p className="mt-4 text-sm text-fd-muted-foreground leading-relaxed max-w-xl">
            Please read our legal documents carefully. They govern your use of pyRPC and its associated services,
            detailing your rights, our responsibilities, and how we handle your data.
          </p>
        </div>

        <div className="flex flex-col gap-6 border-t border-fd-border/50 pt-8">
          <Link
            href="/legal/privacy"
            className="group flex flex-col items-start"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <Shield className="h-4.5 w-4.5 text-fd-muted-foreground group-hover:text-fd-foreground transition-colors" />
              <h2 className="text-[15px] font-semibold tracking-tight text-fd-foreground group-hover:underline underline-offset-4 decoration-fd-muted-foreground/30">
                Privacy Policy
              </h2>
            </div>
            <p className="text-[12px] text-fd-muted-foreground/80 leading-relaxed pl-6">
              Understand how we collect, use, and protect your personal information when you use our services.
            </p>
          </Link>

          <Link
            href="/legal/terms"
            className="group flex flex-col items-start"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <FileText className="h-4.5 w-4.5 text-fd-muted-foreground group-hover:text-fd-foreground transition-colors" />
              <h2 className="text-[15px] font-semibold tracking-tight text-fd-foreground group-hover:underline underline-offset-4 decoration-fd-muted-foreground/30">
                Terms of Use
              </h2>
            </div>
            <p className="text-[12px] text-fd-muted-foreground/80 leading-relaxed pl-6">
              The rules, guidelines, and agreements that govern your access to and use of pyRPC.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
