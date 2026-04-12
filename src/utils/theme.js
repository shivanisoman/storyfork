import { GENRE_THEMES } from '../config/gameConfig';

const ROOT = document.documentElement;

const THEME_PROPS = [
  '--bg-primary',
  '--bg-parchment',
  '--text-primary',
  '--text-muted',
  '--border-ink',
  '--accent-gold',
  '--font-display',
  '--font-body',
];

const FONT_PROPS = new Set(['--font-display', '--font-body']);

/**
 * Apply a genre's full theme to :root (colors + fonts).
 * Used when committing a genre selection for the game screen.
 */
export function applyTheme(genreId) {
  const theme = GENRE_THEMES[genreId];
  if (!theme) return;
  Object.entries(theme).forEach(([prop, value]) => {
    ROOT.style.setProperty(prop, value);
  });
}

/**
 * Apply only the color/spacing vars for a hover preview — intentionally
 * skips font vars so the page title and other cards don't change typeface.
 */
export function previewTheme(genreId) {
  const theme = GENRE_THEMES[genreId];
  if (!theme) return;
  Object.entries(theme).forEach(([prop, value]) => {
    if (!FONT_PROPS.has(prop)) ROOT.style.setProperty(prop, value);
  });
}

/**
 * Remove all theme overrides, reverting every CSS custom property back to
 * the :root defaults declared in App.css.
 */
export function resetTheme() {
  THEME_PROPS.forEach(prop => ROOT.style.removeProperty(prop));
}
