export const shikiThemes = {
  light: 'github-light',
  dark: 'one-dark-pro',
} as const;

export const shikiHighlightOptions = {
  themes: shikiThemes,
  defaultColor: false,
} as const;
