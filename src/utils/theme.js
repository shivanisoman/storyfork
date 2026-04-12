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

/**
 * Apply a genre's full theme to :root by setting CSS custom properties
 * directly on document.documentElement. These override the :root defaults
 * in App.css. All themed components pick up the change automatically.
 */
export function applyTheme(genreId) {
  const theme = GENRE_THEMES[genreId];
  if (!theme) return;
  Object.entries(theme).forEach(([prop, value]) => {
    ROOT.style.setProperty(prop, value);
  });
}

/**
 * Remove all theme overrides, reverting every CSS custom property back to
 * the :root defaults declared in App.css.
 */
export function resetTheme() {
  THEME_PROPS.forEach(prop => ROOT.style.removeProperty(prop));
}
