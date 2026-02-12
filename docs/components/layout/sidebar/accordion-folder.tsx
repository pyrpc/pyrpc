'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { usePathname } from 'fumadocs-core/framework';
import { useTreePath } from 'fumadocs-ui/contexts/tree';
import type * as PageTree from 'fumadocs-core/page-tree';
import * as Base from './base';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../../ui/collapsible';
import { ChevronDown, Server, Laptop, Plug, Library, LayoutGrid, Users, BookOpen } from 'lucide-react';
import { cn } from '../../../lib/cn';
import { CustomIcon } from '../../custom-icon';

const ICONS: Record<string, React.ElementType> = {
  'server': Server,
  'client': Laptop,
  'plugins': Plug,
  'reference': Library,
  'extra': LayoutGrid,
  'community': Users,
  'concepts': BookOpen,
};

const SECTION_DEPTH = 1; // Get Started, Concepts, etc. are top-level sections (depth 1)

const AccordionContext = createContext<{
  openId: string | null;
  setOpenId: (id: string | null) => void;
} | null>(null);

function useAccordion() {
  return useContext(AccordionContext);
}

export function AccordionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [openId, setOpenId] = useState<string | null>(() => {
    const slug = pathname.replace(/^\/docs\/?/, '').split('/')[0];
    return slug || null;
  });
  useEffect(() => {
    const slug = pathname.replace(/^\/docs\/?/, '').split('/')[0];
    setOpenId(slug || null);
  }, [pathname]);
  const value = useMemo(() => ({ openId, setOpenId }), [openId]);
  return (
    <AccordionContext.Provider value={value}>
      {children}
    </AccordionContext.Provider>
  );
}

const itemVariants = (opts: { variant?: 'link' | 'button' }) =>
  cn(
    'relative flex flex-row items-center gap-2 rounded-lg p-2 text-start text-fd-muted-foreground wrap-anywhere [&_svg]:size-4 [&_svg]:shrink-0',
    opts.variant === 'button' &&
    'transition-colors hover:bg-fd-accent/50 hover:text-fd-accent-foreground/80',
  );

function getItemOffset(depth: number) {
  return `calc(${2 + 3 * depth} * var(--spacing))`;
}

export function AccordionFolder({
  item,
  children,
}: {
  item: PageTree.Folder;
  children: ReactNode;
}) {
  const path = useTreePath();
  const ctx = useAccordion();
  const parentDepth = Base.useFolderDepth();
  const depth = parentDepth + 1;
  const isSectionLevel = depth === SECTION_DEPTH;
  const folderId =
    (item.index?.url?.match(/\/docs\/([^/?#]+)/)?.[1]) ??
    (typeof item.name === 'string' ? item.name.toLowerCase().replace(/\s+/g, '-') : '') ??
    item.$id ??
    '';

  const active = path.includes(item);
  const defaultOpen = item.defaultOpen ?? active;

  // Debug icon resolution
  const fallbackIcon = ICONS[folderId] ?? (typeof item.name === 'string' ? ICONS[item.name.toLowerCase()] : undefined);
  const Icon = fallbackIcon ? (fallbackIcon as React.ElementType) : CustomIcon;
  const iconProps = fallbackIcon ? { className: 'size-4' } : { icon: item.icon, className: 'size-4' };

  if (isSectionLevel && ctx) {
    const open = ctx.openId === folderId;
    const setOpen = useCallback(
      (next: boolean | ((prev: boolean) => boolean)) => {
        const currentOpen = ctx.openId === folderId;
        const value = typeof next === 'function' ? next(currentOpen) : next;
        ctx.setOpenId(value ? folderId : null);
      },
      [ctx, folderId],
    );
    return (
      <Collapsible
        open={open}
        onOpenChange={setOpen}
        disabled={item.collapsible === false}
        className="group/collapsible"
      >
        <Base.FolderContext
          value={useMemo(
            () => ({ open, setOpen, depth, collapsible: item.collapsible ?? true }),
            [open, setOpen, depth, item.collapsible],
          )}
        >

          {item.index ? (
            <Base.SidebarFolderLink href={item.index.url} external={item.index.external}>
              {/* @ts-ignore */}
              <Icon {...iconProps} />
              {item.name}
            </Base.SidebarFolderLink>
          ) : (
            <CollapsibleTrigger
              className={cn(itemVariants({ variant: 'button' }), 'w-full')}
              style={{ paddingInlineStart: getItemOffset(depth - 1) }}
            >
              {/* @ts-ignore */}
              <Icon {...iconProps} />
              {item.name}
              <ChevronDown
                data-icon
                className={cn('ms-auto transition-transform', !open && '-rotate-90')}
              />
            </CollapsibleTrigger>
          )}
          <CollapsibleContent className={cn('relative', depth === 1 && "before:content-[''] before:absolute before:w-px before:inset-y-1 before:bg-fd-border before:start-2.5")}>
            {children}
          </CollapsibleContent>
        </Base.FolderContext>
      </Collapsible>
    );
  }

  return (
    <Base.SidebarFolder
      collapsible={item.collapsible}
      active={active}
      defaultOpen={defaultOpen}
    >
      {item.index ? (
        <Base.SidebarFolderLink href={item.index.url} external={item.index.external}>
          {/* @ts-ignore */}
          <Icon {...iconProps} />
          {item.name}
        </Base.SidebarFolderLink>
      ) : (
        <Base.SidebarFolderTrigger>
          {/* @ts-ignore */}
          <Icon {...iconProps} />
          {item.name}
        </Base.SidebarFolderTrigger>
      )}
      <Base.SidebarFolderContent>{children}</Base.SidebarFolderContent>
    </Base.SidebarFolder>
  );
}
