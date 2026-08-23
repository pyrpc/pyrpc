import { docs } from 'fumadocs-mdx:collections/server';
import { type InferPageType, loader, type LoaderPlugin } from 'fumadocs-core/source';
import { createElement, type ComponentType, type ReactNode } from 'react';
import * as LucideIcons from 'lucide-react';
import { brandIcons } from '@/components/brand-icons';

/**
 * Resolve meta.json/frontmatter icon names. Brand SVGs are kept as strings so
 * `CustomIcon` renders them client-side; lucide names are resolved to elements
 * up front. Unknown names are dropped with a warning instead of silently
 * disappearing.
 */
function resolveIconNode<T extends { icon?: ReactNode }>(node: T): T {
  const icon = node.icon;
  if (typeof icon !== 'string') return node;

  if (!brandIcons[icon]) {
    const LucideComponent = (LucideIcons as unknown as Record<string, ComponentType>)[icon];
    if (LucideComponent) {
      node.icon = createElement(LucideComponent);
    } else {
      console.warn(`[pyrpc:icons] Unknown icon "${icon}" - skipping.`);
      node.icon = undefined;
    }
  }
  return node;
}

const brandIconPlugin: LoaderPlugin = {
  name: 'pyrpc:brand-icons',
  transformPageTree: {
    file: resolveIconNode,
    folder: resolveIconNode,
    separator: resolveIconNode,
  },
};

// See https://fumadocs.dev/docs/headless/source-api for more info
export const source = loader({
  baseUrl: '/docs',
  source: docs.toFumadocsSource(),
  plugins: [brandIconPlugin],
});

export function getPageImage(page: InferPageType<typeof source>) {
  const segments = [...page.slugs, 'image.png'];

  return {
    segments,
    url: `/og/docs/${segments.join('/')}`,
  };
}

export async function getLLMText(page: InferPageType<typeof source>) {
  const processed = await page.data.getText('processed');

  return `# ${page.data.title}

${processed}`;
}
