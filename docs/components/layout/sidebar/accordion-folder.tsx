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
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import { CustomIcon } from '../../custom-icon';
import { useTreeContext } from 'fumadocs-ui/contexts/tree';

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
  const { root } = useTreeContext();
  const [openId, setOpenId] = useState<string | null>(() => {
    const slug = pathname.replace(/^\/docs\/?/, '').split('/')[0];
    if (slug) return slug;
    // fall back to the first section marked `defaultOpen` in meta.json
    const folder = root.children.find(
      (node): node is PageTree.Folder => node.type === 'folder' && node.defaultOpen === true,
    );
    return folder?.index?.url?.match(/\/docs\/([^/?#]+)/)?.[1] ?? null;
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

  const iconValue = item.icon;

  const open = ctx !== null && ctx.openId === folderId;
  const setOpen = useCallback(
    (next: boolean | ((prev: boolean) => boolean)) => {
      if (!ctx) return;
      const currentOpen = ctx.openId === folderId;
      const value = typeof next === 'function' ? next(currentOpen) : next;
      ctx.setOpenId(value ? folderId : null);
    },
    [ctx, folderId],
  );
  const folderContextValue = useMemo(
    () =>
      isSectionLevel && ctx
        ? { open, setOpen, depth, collapsible: item.collapsible ?? true }
        : null,
    [open, setOpen, depth, item.collapsible, isSectionLevel, ctx],
  );

  if (isSectionLevel && ctx) {
    return (
      <Collapsible
        open={open}
        onOpenChange={setOpen}
        disabled={item.collapsible === false}
        className="group/collapsible"
      >
        <Base.FolderContext value={folderContextValue}>

          {item.index ? (
            <Base.SidebarFolderLink href={item.index.url} external={item.index.external}>
              <CustomIcon icon={iconValue} className="size-4" />
              {item.name}
            </Base.SidebarFolderLink>
          ) : (
            <CollapsibleTrigger
              className={cn(itemVariants({ variant: 'button' }), 'w-full')}
              style={{ paddingInlineStart: getItemOffset(depth - 1) }}
            >
              <CustomIcon icon={iconValue} className="size-4" />
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
          <CustomIcon icon={iconValue} className="size-4" />
          {item.name}
        </Base.SidebarFolderLink>
      ) : (
        <Base.SidebarFolderTrigger>
          <CustomIcon icon={iconValue} className="size-4" />
          {item.name}
        </Base.SidebarFolderTrigger>
      )}
      <Base.SidebarFolderContent>{children}</Base.SidebarFolderContent>
    </Base.SidebarFolder>
  );
}
