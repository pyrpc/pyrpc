import { source } from '@/lib/source';
import { DocsLayout } from '@/components/layout/docs';
import { baseOptions } from '@/lib/layout.shared';
import type { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  const { links, ...options } = baseOptions();

  return (
    <DocsLayout
      tree={source.getPageTree()}
      {...options}
      nav={{
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
