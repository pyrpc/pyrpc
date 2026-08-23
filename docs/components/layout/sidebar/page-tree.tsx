import { useTreeContext, useTreePath } from 'fumadocs-ui/contexts/tree';
import { type FC, type ReactNode, useMemo, Fragment } from 'react';
import type * as PageTree from 'fumadocs-core/page-tree';
import type * as Base from './base';
import { CustomIcon } from '../../custom-icon';

const PAGE_ICONS: Record<string, string> = {
  '/docs/get-started': 'Introduction',
  '/docs/get-started/comparison': 'Comparison',
  '/docs/get-started/installation': 'Installation',
  '/docs/get-started/quickstart': 'Quickstart',
  '/docs/concepts': 'LightbulbFill',
  '/docs/concepts/mental-model': 'MentalModel',
  '/docs/concepts/procedures': 'Procedures',
  '/docs/concepts/architecture': 'Blocks',
  '/docs/server/routers': 'Routers',
  '/docs/server/procedures': 'Procedures',
  '/docs/server/context': 'Context',
  '/docs/server/middleware': 'Middleware',
  '/docs/server/adapters': 'Plugs',
  '/docs/server/adapters/fastapi': 'FastAPI',
  '/docs/server/adapters/flask': 'Flask',
  '/docs/server/adapters/django': 'Django',
  '/docs/server/adapters/standalone': 'Cube',
  '/docs/server/adapters/community-adapters': 'Puzzle',
  '/docs/client/overview': 'BrowserWindow',
  '/docs/client/typescript': 'TypeScript',
  '/docs/client/vanilla': 'Python',
  '/docs/client/links/overview': 'LinkSimpleBox',
  '/docs/client/links/http-link': 'LinkBox',
  '/docs/client/links/http-batch-link': 'Layers',
  '/docs/client/adapters/react': 'React',
  '/docs/client/adapters/nextjs': 'NextJs',
  '/docs/client/adapters/vue': 'Vue',
  '/docs/client/adapters/svelte': 'Svelte',
  '/docs/client/advanced': 'Settings',
  '/docs/reference/prpc-core': 'TerminalWindow',
  '/docs/reference/prpc-client': 'Python',
  '/docs/reference/prpc-next': 'TypeScript',
  '/docs/reference/spec': 'Article',
  '/docs/reference/protocol-design': 'CompassFill',
  '/docs/reference/error-handling': 'WarningCircle',
  '/docs/reference/architecture': 'Network',
  '/docs/reference/faq': 'Faq',
  '/docs/reference/further-reading': 'FurtherReading',
  '/docs/ai-resources': 'AIRources',
  '/docs/ai-resources/llms-txt': 'ScrollText',
  '/docs/ai-resources/mcp': 'MCP',
  '/docs/ai-resources/skills': 'FileBox',
  '/docs/community/contributing': 'GitPullRequest',
  '/docs/community/sponsors': 'Heart',
};

export interface SidebarPageTreeComponents {
  Item: FC<{ item: PageTree.Item }>;
  Folder: FC<{ item: PageTree.Folder; children: ReactNode }>;
  Separator: FC<{ item: PageTree.Separator }>;
}

type InternalComponents = Pick<
  typeof Base,
  | 'SidebarSeparator'
  | 'SidebarFolder'
  | 'SidebarFolderLink'
  | 'SidebarFolderContent'
  | 'SidebarFolderTrigger'
  | 'SidebarItem'
>;

export function createPageTreeRenderer({
  SidebarFolder,
  SidebarFolderContent,
  SidebarFolderLink,
  SidebarFolderTrigger,
  SidebarSeparator,
  SidebarItem,
}: InternalComponents) {
  function PageTreeFolder({ item, children }: { item: PageTree.Folder; children: ReactNode }) {
    const path = useTreePath();

    return (
      <SidebarFolder
        collapsible={item.collapsible}
        active={path.includes(item)}
        defaultOpen={item.defaultOpen}
      >
        {item.index ? (
          <SidebarFolderLink href={item.index.url} external={item.index.external}>
            <CustomIcon icon={item.icon} className="size-4" />
            {item.name}
          </SidebarFolderLink>
        ) : (
          <SidebarFolderTrigger>
            <CustomIcon icon={item.icon} className="size-4" />
            {item.name}
          </SidebarFolderTrigger>
        )}
        <SidebarFolderContent>{children}</SidebarFolderContent>
      </SidebarFolder>
    );
  }

  /**
   * Render sidebar items from page tree
   */
  return function SidebarPageTree(components: Partial<SidebarPageTreeComponents>) {
    const { root } = useTreeContext();
    const { Separator, Item, Folder = PageTreeFolder } = components;

    return useMemo(() => {
      function renderSidebarList(items: PageTree.Node[]) {
        return items.map((item, i) => {

          if (item.type === 'separator') {
            if (Separator) return <Separator key={i} item={item} />;
            return (
              <SidebarSeparator key={i}>
                <CustomIcon icon={item.icon} className="size-4" />
                {item.name}
              </SidebarSeparator>
            );
          }

          if (item.type === 'folder') {
            return (
              <Folder key={i} item={item}>
                {renderSidebarList(item.children)}
              </Folder>
            );
          }

          if (Item) return <Item key={item.url} item={item} />;
          const pageIcon = PAGE_ICONS[item.url];
          return (
            <SidebarItem key={item.url} href={item.url} external={item.external} icon={
              pageIcon ?
                <CustomIcon icon={pageIcon} className="size-4" /> :
                <CustomIcon icon={item.icon} className="size-4" />
            }>
              {item.name}
            </SidebarItem>
          );
        });
      }

      return <Fragment key={root.$id}>{renderSidebarList(root.children)}</Fragment>;
    }, [Folder, Item, Separator, root]);
  };
}
