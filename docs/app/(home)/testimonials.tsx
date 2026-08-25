"use client";

import { motion } from 'framer-motion';

/**
 * Testimonials, Supabase-style tweet wall: a masonry of flat, bordered
 * quote cards with a dashed meta rule. Swap the SAMPLE entries below with
 * real posts as they come in. Each entry:
 *   quote, the post text
 *   name, display name
 *   role, "@handle" or "Title, Company"
 *   profileUrl / postUrl, render a source badge (LinkedIn profile / X post)
 *   avatar, optional photo path; falls back to initials
 */
type Testimonial = {
  quote: string;
  name: string;
  role: string;
  profileUrl?: string;
  postUrl?: string;
  avatar?: string;
};

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "Dude, love this. As someone who uses FastAPI a lot, I'm gonna try this.",
    name: 'Sanku',
    role: '@sankalpa_02',
    profileUrl: 'https://x.com/sankalpa_02',
    postUrl: 'https://x.com/sankalpa_02/status/2066596650127446074',
    avatar: '/avatars/sanku.jpg',
  },
  {
    quote:
      'We deleted our whole hand-written API layer. After running pyrpc dev, every procedure shows up fully typed in VS Code autocomplete, with no more stale wrappers or outdated docs to keep in sync.',
    name: 'Amer Abdulquem',
    role: 'Full-Stack Developer',
    profileUrl: 'https://www.linkedin.com/in/amer-al-ali/',
    avatar: '/avatars/Amer.jpg',
  },
  {
    quote: 'Nice seems like a cool project.',
    name: 'Frectonz',
    role: 'Developer, evpin.com',
    profileUrl: 'https://evpin.com',
    avatar: '/avatars/frectonz.jpg',
  },
  {
    quote:
      'Renaming a Python procedure flagged every call site in our frontend before we even ran the build. This is what API development should feel like.',
    name: 'Brook Teklebrhan',
    role: 'Mobile Developer',
    profileUrl: 'https://www.linkedin.com/in/brook-teklebrhan-687b11241',
    avatar: '/avatars/Brook.jpg',
  },
  {
    quote: 'Bro this is so fkn cool 🔥',
    name: 'Seefun',
    role: 'Backend Developer',
    avatar: '/avatars/seefun.jpeg',
  },
  {
    quote:
      'Ayyy this is veryy dope fr!\nSmooth and well functional amazing work brother! 👏\nyou gotta push it well fr',
    name: 'Cyber Guardians',
    role: 'Full-Stack Developer',
    avatar: '/avatars/cyber_guardians.jpg',
  },
  {
    quote:
      'pyRPC is basically tRPC for Python. Set it up in an afternoon and the schema drift meetings just disappeared.',
    name: 'Nate',
    role: 'AI/ML Engineer',
    avatar: '/avatars/nate.jpg',
  },
  {
    quote: 'Good work 👏',
    name: 'ኢዮብ z ሽቱ',
    role: '@kilopal_',
    profileUrl: 'https://x.com/kilopal_',
    postUrl: 'https://x.com/kilopal_/status/2066953429700747546',
    avatar: '/avatars/kilopal.jpg',
  },
];

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('');
}

export default function TestimonialsSection() {
  return (
    <div className="mt-10 w-full border-t border-neutral-200 pt-8 dark:border-white/[0.1] md:mt-12 md:pt-10">
      <div className="mx-auto max-w-[1200px] px-6 md:px-10">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.4 }}
          className="text-xl font-semibold tracking-tight leading-snug text-neutral-900 dark:text-[var(--heading-dark)]"
        >
          What builders say.
        </motion.h2>

        {/* Masonry wall, flat cards, dashed meta rules */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.05 }}
          transition={{ duration: 0.5 }}
          className="mt-10 columns-1 gap-5 sm:columns-2 lg:columns-3"
        >
          {TESTIMONIALS.map((t) => {
            /* Badge: X post link wins; otherwise a LinkedIn profile badge */
            const isLinkedIn = !t.postUrl && !!t.profileUrl?.includes('linkedin.com');
            const badgeHref = t.postUrl ?? (isLinkedIn ? t.profileUrl : undefined);

            return (
              <figure
                key={`${t.name}-${t.role}`}
                className="mb-5 break-inside-avoid rounded-md border border-neutral-200 bg-white p-6 transition-colors hover:border-neutral-300 dark:border-[#292524] dark:bg-[#0c0c0c] dark:hover:border-[#3f3a36]"
              >
                <blockquote className="whitespace-pre-line text-sm leading-relaxed text-neutral-700 dark:text-white/85">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>

                <figcaption className="mt-5 flex items-center gap-3 border-t border-dashed border-neutral-200 pt-4 dark:border-white/[0.12]">
                  {t.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element -- tiny avatar, no optimization needed
                    <img
                      src={t.avatar}
                      alt={t.name}
                      width={32}
                      height={32}
                      loading="lazy"
                      className="h-8 w-8 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-900 font-mono text-[11px] font-medium text-white dark:bg-white dark:text-black">
                      {initials(t.name)}
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-medium tracking-tight text-neutral-900 dark:text-white">
                      {t.name}
                    </span>
                    <span className="block truncate font-mono text-[11px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                      {t.role}
                    </span>
                  </span>
                  {badgeHref && (
                    <a
                      href={badgeHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={
                        isLinkedIn
                          ? `View ${t.name}'s profile on LinkedIn`
                          : `View ${t.name}'s post on X`
                      }
                      className="ml-auto shrink-0 p-1 text-neutral-300 transition-colors hover:text-neutral-900 dark:text-neutral-600 dark:hover:text-white"
                    >
                      {isLinkedIn ? (
                        <LinkedInIcon className="h-[15px] w-[15px]" />
                      ) : (
                        <XIcon className="h-[15px] w-[15px]" />
                      )}
                    </a>
                  )}
                </figcaption>
              </figure>
            );
          })}

          {/* Join card, fills the last column, invites real submissions */}
          <figure className="mb-5 flex break-inside-avoid flex-col rounded-md border border-dashed border-neutral-300 p-6 dark:border-white/[0.14]">
            <blockquote className="flex-1 text-sm leading-relaxed text-neutral-500 dark:text-white/50">
              Built something with pyRPC?
            </blockquote>
            <figcaption className="mt-5 flex items-center justify-between border-t border-dashed border-neutral-200 pt-4 dark:border-white/[0.12]">
              <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                We&rsquo;d love to hear it
              </span>
              <a
                href="https://x.com/pyrpc_dev"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[13px] font-medium tracking-tight text-neutral-900 transition-colors hover:text-neutral-500 dark:text-white dark:hover:text-neutral-400"
              >
                Post it on
                <XIcon className="h-[13px] w-[13px]" />
              </a>
            </figcaption>
          </figure>
        </motion.div>
      </div>
    </div>
  );
}
