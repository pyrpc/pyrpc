import { source } from '@/lib/source';
import { DocsLayout } from '@/components/layout/docs';
import { baseOptions } from '@/lib/layout.shared';
import type { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  const { links, nav, ...options } = baseOptions();

  return (
    <DocsLayout
      tree={source.getPageTree()}
      {...options}
      nav={{
        // hide the docs sub-header; render no title so the sidebar shows
        // nothing above the search bar (an omitted title would leave an
        // invisible <a href="/"> placeholder)
        title: () => null,
        enabled: false,
      }}
      sidebar={{
        enabled: true,
        collapsible: true,
        defaultOpenLevel: 0,
        tabs: false,
      }}
      themeSwitch={{
        enabled: false,
      }}

    >
      {children}
    </DocsLayout>
  );
}
