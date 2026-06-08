import type { ComponentProps, ReactNode } from 'react';
import type { I18nConfig } from 'fumadocs-core/i18n';
import type { LinkItemType } from './link-item';
import Link from 'fumadocs-core/link';

export interface NavOptions {
  enabled: boolean;
  component: ReactNode;

  title?: ReactNode | ((props: ComponentProps<'a'>) => ReactNode);

  /**
   * Redirect url of title
   * @defaultValue '/'
   */
  url?: string;

  /**
   * Use transparent background
   *
   * @defaultValue none
   */
  transparentMode?: 'always' | 'top' | 'none';

  children?: ReactNode;
}

export interface BaseLayoutProps {
  themeSwitch?: {
    enabled?: boolean;
    component?: ReactNode;
    mode?: 'light-dark' | 'light-dark-system';
  };

  searchToggle?: Partial<{
    enabled: boolean;
    components: Partial<{
      sm: ReactNode;
      lg: ReactNode;
    }>;
  }>;

  /**
   * I18n options
   *
   * @defaultValue false
   */
  i18n?: boolean | I18nConfig;

  /**
   * GitHub url
   */
  githubUrl?: string;

  links?: LinkItemType[];
  /**
   * Replace or disable navbar
   */
  nav?: Partial<NavOptions>;

  children?: ReactNode;
}

export function renderTitleNav(
  { title, url = '/' }: Partial<NavOptions>,
  props: ComponentProps<'a'>,
) {
  if (typeof title === 'function') return title({ href: url, ...props });
  return (
    <Link href={url} {...props}>
      {title}
    </Link>
  );
}

export type * from './link-item';
