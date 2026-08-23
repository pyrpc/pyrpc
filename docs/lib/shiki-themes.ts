import type { ThemeRegistrationRaw } from 'shiki';

/**
 * Custom syntax themes mirroring the hero code window's manual token
 * palette exactly, so every code surface on the site uses one voice:
 * monochrome-first ink, single muted green accent, no blue/purple casts.
 */

/* Light mode — near-ink monochrome, emerald accent */
export const pyrpcLight: ThemeRegistrationRaw = {
  name: 'pyrpc-light',
  type: 'light',
  colors: {
    'editor.background': '#ffffff',
    'editor.foreground': '#404040',
  },
  settings: [
    { settings: { foreground: '#404040' } },
    { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: '#a1a1a1', fontStyle: 'italic' } },
    {
      scope: [
        'keyword',
        'keyword.control',
        'storage',
        'storage.type',
        'modifier',
        'variable.language',
        'constant.language',
        'constant.numeric',
        'constant.character.escape',
        'entity.name.decorator',
        'meta.decorator variable.function',
      ],
      settings: { foreground: '#171717' },
    },
    {
      scope: ['string', 'string.quoted', 'string.template', 'string.regexp'],
      settings: { foreground: '#047857' },
    },
    {
      scope: [
        'entity.name.function',
        'support.function',
        'meta.function-call.generic',
        'meta.function-call.py',
        'variable.function',
      ],
      settings: { foreground: '#525252' },
    },
    {
      scope: [
        'entity.name.type',
        'entity.name.class',
        'support.type',
        'support.class',
        'entity.other.inherited-class',
        'entity.name.tag',
      ],
      settings: { foreground: '#737373', fontStyle: 'italic' },
    },
    { scope: ['punctuation', 'punctuation.definition', 'meta.brace', 'delimiter', 'meta.punctuation'], settings: { foreground: '#a3a3a3' } },
    { scope: ['variable', 'variable.other'], settings: { foreground: '#404040' } },
  ],
};

/* Dark mode — the Vesper-derived hero palette on the near-black surface */
export const pyrpcDark: ThemeRegistrationRaw = {
  name: 'pyrpc-dark',
  type: 'dark',
  colors: {
    'editor.background': '#050505',
    'editor.foreground': '#dcdcdc',
  },
  settings: [
    { settings: { foreground: '#dcdcdc' } },
    { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: '#6b6b6b', fontStyle: 'italic' } },
    {
      scope: [
        'keyword',
        'keyword.control',
        'storage',
        'storage.type',
        'modifier',
        'variable.language',
        'constant.language',
        'constant.numeric',
        'constant.character.escape',
        'entity.name.decorator',
        'meta.decorator variable.function',
      ],
      settings: { foreground: '#e8e8e8' },
    },
    {
      scope: ['string', 'string.quoted', 'string.template', 'string.regexp'],
      settings: { foreground: '#97c983' },
    },
    {
      scope: [
        'entity.name.function',
        'support.function',
        'meta.function-call.generic',
        'meta.function-call.py',
        'variable.function',
      ],
      settings: { foreground: '#c9c9c9' },
    },
    {
      scope: [
        'entity.name.type',
        'entity.name.class',
        'support.type',
        'support.class',
        'entity.other.inherited-class',
        'entity.name.tag',
      ],
      settings: { foreground: '#a3a3a3', fontStyle: 'italic' },
    },
    { scope: ['punctuation', 'punctuation.definition', 'meta.brace', 'delimiter', 'meta.punctuation'], settings: { foreground: '#7a7a7a' } },
    { scope: ['variable', 'variable.other'], settings: { foreground: '#dcdcdc' } },
  ],
};

/**
 * Dual-theme highlight options. Fumadocs' preset CSS flips token colors
 * via the generated --shiki-light / --shiki-dark variables under `.dark`.
 */
export const shikiHighlightOptions = {
  themes: {
    light: pyrpcLight,
    dark: pyrpcDark,
  },
} as const;
