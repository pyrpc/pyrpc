'use client';
import { useMemo, useState } from 'react';
import { Check, ChevronDown, Copy, ExternalLink, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useCopyButton } from 'fumadocs-ui/utils/use-copy-button';
import { Popover, PopoverContent, PopoverTrigger } from 'fumadocs-ui/components/ui/popover';

const cache = new Map<string, string>();

/**
 * Shared styling for the docs page actions:
 * small uppercase monospace-ish labels that sit quietly next to the title
 * and only reveal a hairline border on hover.
 */
const tocAction =
  'inline-flex items-center gap-1.5 px-2 py-1 text-[11px] uppercase tracking-wider whitespace-nowrap transition-all duration-200 text-fd-muted-foreground hover:text-fd-foreground border border-transparent hover:border-fd-border hover:bg-fd-foreground/5 cursor-pointer select-none [&_svg]:size-3';

function CopyMdLinkButton({ markdownUrl }: { markdownUrl: URL }) {
  const [checked, onClick] = useCopyButton(() => {
    return navigator.clipboard.writeText(markdownUrl.toString());
  });

  return (
    <button
      type="button"
      className="flex items-center gap-2.5 px-2.5 py-2 text-[12px] text-fd-muted-foreground hover:text-fd-foreground hover:bg-fd-foreground/5 transition-colors duration-150 [&_svg]:size-3.5 [&_svg]:shrink-0 w-full cursor-pointer"
      onClick={onClick}
    >
      {checked ? <Check /> : <Copy />}
      {checked ? 'Copied!' : 'Copy MD Link'}
    </button>
  );
}

export function LLMCopyButton({
  /**
   * A URL to fetch the raw Markdown/MDX content of page
   */
  markdownUrl,
}: {
  markdownUrl: string;
}) {
  const [isLoading, setLoading] = useState(false);
  const [checked, onClick] = useCopyButton(async () => {
    const cached = cache.get(markdownUrl);
    if (cached) return navigator.clipboard.writeText(cached);

    setLoading(true);

    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/plain': fetch(markdownUrl).then(async (res) => {
            const content = await res.text();
            cache.set(markdownUrl, content);

            return content;
          }),
        }),
      ]);
    } finally {
      setLoading(false);
    }
  });

  return (
    <button
      disabled={isLoading}
      className={cn(tocAction, checked && 'text-fd-foreground border-fd-border bg-fd-foreground/5')}
      onClick={onClick}
    >
      {checked ? <Check /> : <Copy />}
      {checked ? 'Copied' : 'Copy MD'}
    </button>
  );
}

export function ViewOptions({
  markdownUrl,
  githubUrl,
}: {
  /**
   * A URL to the raw Markdown/MDX content of page
   */
  markdownUrl: string;

  /**
   * Source file URL on GitHub
   */
  githubUrl: string;
}) {
  const markdownUrlAbs = useMemo(() => {
    return typeof window !== 'undefined'
      ? new URL(markdownUrl, window.location.origin)
      : new URL(markdownUrl, 'https://pyrpc.com');
  }, [markdownUrl]);

  return (
    <ViewOptionsInner
      markdownUrl={markdownUrlAbs}
      githubUrl={githubUrl}
    />
  );
}

function ViewOptionsInner({ markdownUrl, githubUrl }: { markdownUrl: URL; githubUrl: string }) {
  const q = `Read ${markdownUrl}, I want to ask questions about it.`;

  const items = [
    {
      title: 'GitHub',
      href: githubUrl,
      icon: (
        <svg fill="currentColor" role="img" viewBox="0 0 24 24">
          <title>GitHub</title>
          <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
        </svg>
      ),
    },
    {
      title: 'ChatGPT',
      href: `https://chatgpt.com/?${new URLSearchParams({
        hints: 'search',
        q,
      })}`,
      icon: (
        <svg role="img" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <title>OpenAI</title>
          <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" />
        </svg>
      ),
    },
    {
      title: 'Claude',
      href: `https://claude.ai/new?${new URLSearchParams({
        q,
      })}`,
      icon: (
        <svg fill="currentColor" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <title>Anthropic</title>
          <path d="M17.3041 3.541h-3.6718l6.696 16.918H24Zm-10.6082 0L0 20.459h3.7442l1.3693-3.5527h7.0052l1.3693 3.5528h3.7442L10.5363 3.5409Zm-.3712 10.2232 2.2914-5.9456 2.2914 5.9456Z" />
        </svg>
      ),
    },
    {
      title: 'T3 Chat',
      href: `https://t3.chat/new?${new URLSearchParams({
        q,
      })}`,
      icon: <MessageCircle />,
    },
    {
      title: 'Copilot',
      href: `https://copilot.microsoft.com/?${new URLSearchParams({
        q,
      })}`,
      icon: (
        <svg fill="currentColor" role="img" viewBox="0 0 1322.9 1147.5" xmlns="http://www.w3.org/2000/svg">
          <title>Microsoft</title>
          <path d="m711.19 265.2c-27.333 0-46.933 3.07-58.8 9.33 27.067-80.267 47.6-210.13 168-210.13 114.93 0 108.4 138.27 157.87 200.8zm107.33 112.93c-35.467 125.2-70 251.2-110.13 375.33-12.133 36.4-45.733 61.6-84 61.6h-136.27c9.3333-14 16.8-28.933 21.467-45.733 35.467-125.07 70-251.07 110.13-375.33 12.133-36.4 45.733-61.6 84-61.6h136.27c-9.3333 14-16.8 28.934-21.467 45.734m-316.13 704.8c-114.93 0-108.4-138.13-157.87-200.67h267.07c27.467 0 47.067-3.07 58.8-9.33-27.067 80.266-47.6 210-168 210m777.47-758.93h0.93c-32.667-38.266-82.267-57.866-146.67-57.866h-36.4c-34.533-2.8-65.333-26.134-76.533-58.8l-36.4-103.6c-21.463-61.737-80.263-103.74-145.73-103.74h-475.07c-175.6 0-251.2 225.07-292.27 361.33-38.267 127.07-126 341.73-24.267 462.13 46.667 55.067 116.67 57.867 183.07 57.867 34.533 2.8 65.333 26.133 76.533 58.8l36.4 103.6c21.467 61.733 80.267 103.73 145.6 103.73h475.2c175.47 0 251.07-225.07 292.27-361.33 30.8-100.8 68.133-224.93 66.267-324.8 0-50.534-11.2-100-42.933-137.33" />
        </svg>
      ),
    },
    {
      title: 'Cursor',
      icon: (
        <svg fill="currentColor" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <title>Cursor</title>
          <path d="M11.503.131 1.891 5.678a.84.84 0 0 0-.42.726v11.188c0 .3.162.575.42.724l9.609 5.55a1 1 0 0 0 .998 0l9.61-5.55a.84.84 0 0 0 .42-.724V6.404a.84.84 0 0 0-.42-.726L12.497.131a1.01 1.01 0 0 0-.996 0M2.657 6.338h18.55c.263 0 .43.287.297.515L12.23 22.918c-.062.107-.229.064-.229-.06V12.335a.59.59 0 0 0-.295-.51l-9.11-5.257c-.109-.063-.064-.23.061-.23" />
        </svg>
      ),
      href: `https://cursor.com/link/prompt?${new URLSearchParams({
        text: q,
      })}`,
    },
  ];

  return (
    <Popover>
      <PopoverTrigger className={cn(tocAction)}>
        Open in
        <ChevronDown />
      </PopoverTrigger>
      <PopoverContent className="flex flex-col p-1 min-w-[200px]">
        <CopyMdLinkButton markdownUrl={markdownUrl} />
        {items.map((item) => (
          <a
            key={item.href}
            href={item.href}
            rel="noreferrer noopener"
            target="_blank"
            className="flex items-center gap-2.5 px-2.5 py-2 text-[12px] text-fd-muted-foreground hover:text-fd-foreground hover:bg-fd-foreground/5 transition-colors duration-150 [&_svg]:size-3.5 [&_svg]:shrink-0"
          >
            {item.icon}
            {item.title}
            <ExternalLink className="size-3 text-fd-muted-foreground opacity-50 ms-auto" />
          </a>
        ))}
      </PopoverContent>
    </Popover>
  );
}
