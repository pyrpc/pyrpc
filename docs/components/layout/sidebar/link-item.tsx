import type { HTMLAttributes } from 'react';
import { CustomIcon } from '../../custom-icon';
import type * as Base from './base';
import type { LinkItemType } from '../link-item';

type InternalComponents = Pick<
  typeof Base,
  | 'SidebarFolder'
  | 'SidebarFolderLink'
  | 'SidebarFolderContent'
  | 'SidebarFolderTrigger'
  | 'SidebarItem'
>;

export function createLinkItemRenderer({
  SidebarFolder,
  SidebarFolderContent,
  SidebarFolderLink,
  SidebarFolderTrigger,
  SidebarItem,
}: InternalComponents) {
  /**
   * Render sidebar items from page tree
   */
  return function SidebarLinkItem({
    item,
    ...props
  }: HTMLAttributes<HTMLElement> & {
    item: Exclude<LinkItemType, { type: 'icon' }>;
  }) {
    if (item.type === 'custom') return <div {...props}>{item.children}</div>;

    if (item.type === 'menu')
      return (
        <SidebarFolder {...props}>
          {item.url ? (
            <SidebarFolderLink href={item.url} external={item.external}>
              {/* @ts-ignore */}
              <CustomIcon icon={item.icon} className="size-4" />
              {item.text}
            </SidebarFolderLink>
          ) : (
            <SidebarFolderTrigger>
              {/* @ts-ignore */}
              <CustomIcon icon={item.icon} className="size-4" />
              {item.text}
            </SidebarFolderTrigger>
          )}
          <SidebarFolderContent>
            {item.items.map((child, i) => (
              <SidebarLinkItem key={i} item={child} />
            ))}
          </SidebarFolderContent>
        </SidebarFolder>
      );

    return (
      <SidebarItem href={item.url} icon={
        // @ts-ignore
        <CustomIcon icon={item.icon} className="size-4" />
      } external={item.external} {...props}>
        {item.text}
      </SidebarItem>
    );
  };
}
