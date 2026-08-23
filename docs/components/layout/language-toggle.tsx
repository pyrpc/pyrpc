'use client';
import type { ComponentProps } from 'react';
import { useI18n } from 'fumadocs-ui/contexts/i18n';
import { useTranslations } from '@fuma-translate/react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { cn } from '@/lib/cn';
import { buttonVariants } from '../ui/button';

export type LanguageSelectProps = ComponentProps<'button'>;

export function LanguageToggle(props: LanguageSelectProps): React.ReactElement {
  const context = useI18n();
  const t = useTranslations({ note: 'language switcher' });
  if (!context.locales) throw new Error('Missing `<I18nProvider />`');

  return (
    <Popover>
      <PopoverTrigger
        aria-label={t('Choose a language')}
        {...props}
        className={cn(
          buttonVariants({
            color: 'ghost',
            className: 'gap-1.5 p-1.5',
          }),
          props.className,
        )}
      >
        {props.children}
      </PopoverTrigger>
      <PopoverContent className="flex flex-col overflow-x-hidden p-0">
        <p className="mb-1 p-2 text-xs font-medium text-fd-muted-foreground">
          {t('Choose a language')}
        </p>
        {context.locales.map((item) => (
          <button
            key={item.locale}
            type="button"
            className={cn(
              'p-2 text-start text-sm',
              item.locale === context.locale
                ? 'bg-fd-primary/10 font-medium text-fd-primary'
                : 'hover:bg-fd-accent hover:text-fd-accent-foreground',
            )}
            onClick={() => {
              context.onChange?.(item.locale);
            }}
          >
            {item.name}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

export function LanguageToggleText(props: ComponentProps<'span'>) {
  const context = useI18n();
  const text = context.locales?.find((item) => item.locale === context.locale)?.name;

  return <span {...props}>{text}</span>;
}
