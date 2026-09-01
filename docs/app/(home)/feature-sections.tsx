"use client";

import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

export const LOGO = {
  nextjs: 'https://cdn.simpleicons.org/nextdotjs/black',
  react: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg',
  vuejs: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vuejs/vuejs-original.svg',
  svelte: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/svelte/svelte-original.svg',
  astro: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/astro/astro-original.svg',
  fastapi: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/fastapi/fastapi-original.svg',
  flask: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/flask/flask-original.svg',
  django: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/django/django-plain.svg',
  python: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg',
  typescript:
    'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg',
};

export const FRAMEWORKS = [
  { name: 'Next.js', src: LOGO.nextjs },
  { name: 'React', src: LOGO.react },
  { name: 'Vue', src: LOGO.vuejs },
  { name: 'Svelte', src: LOGO.svelte },
  { name: 'FastAPI', src: LOGO.fastapi },
  { name: 'Flask', src: LOGO.flask },
  { name: 'Django', src: LOGO.django },
];

const FEATURES: {
  index: string;
  title: string;
  description: string;
  href: string;
}[] = [
    {
      index: '01',
      title: 'Automatic typesafety.',
      description: 'Server-side changes surface as client errors before you even save the file.',
      href: '/docs/get-started/quickstart',
    },
    {
      index: '02',
      title: 'Works with your stack.',
      description: 'Adapters for every framework and runtime you already use.',
      href: '/docs/server/adapters',
    },
    {
      index: '03',
      title: 'Autocompletion.',
      description: "Your API behaves like a typed SDK, generated straight from your Python code.",
      href: '/docs/client/typescript',
    },
    {
      index: '04',
      title: 'Batteries included.',
      description: 'Validation, middleware, error handling, and links out of the box.',
      href: '/docs/server/overview',
    },
    {
      index: '05',
      title: 'Server Actions.',
      description: 'Call procedures directly from React Server Components and Actions.',
      href: '/docs/client/adapters/nextjs',
    },
    {
      index: '06',
      title: 'Typed errors.',
      description: 'Exceptions arrive in catch blocks as typed PyRPCError values.',
      href: '/docs/reference/error-handling',
    },
  ];

export default function FeatureSections() {
  return (
    <div className="mt-8 w-full md:mt-12">
      <div className="mx-auto max-w-[1200px] px-6 md:px-10">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.4 }}
          className="text-xl font-semibold tracking-tight leading-snug text-neutral-900 dark:text-[var(--heading-dark)]"
        >
          Features.
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.5 }}
          className="mt-8 grid grid-cols-1 gap-px overflow-hidden border border-foreground/[0.08] bg-foreground/[0.08] sm:grid-cols-2 lg:grid-cols-3"
        >
          {FEATURES.map((feature) => (
            <a
              key={feature.index}
              href={feature.href}
              className="group relative z-0 flex min-h-[150px] flex-col overflow-hidden bg-background p-6 transition-all duration-300 hover:z-10 hover:-translate-y-0.5 hover:bg-foreground/[0.02] hover:shadow-[inset_0_1px_0_0_rgba(128,128,128,0.1)] md:min-h-[160px]"
            >
              <ArrowUpRight className="absolute right-5 top-5 h-4 w-4 translate-y-1 text-fd-foreground/40 opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:text-fd-foreground group-hover:opacity-100" />
              <span className="mb-4 block font-mono text-[11px] uppercase tracking-wider text-fd-foreground/30 transition-colors group-hover:text-fd-foreground/50">
                {feature.index}
              </span>
              <h3 className="mb-1.5 font-sans text-sm font-medium tracking-tight text-fd-foreground">
                {feature.title}
              </h3>
              <p className="max-w-[38ch] text-sm leading-relaxed text-fd-foreground/60">
                {feature.description}
              </p>
            </a>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
