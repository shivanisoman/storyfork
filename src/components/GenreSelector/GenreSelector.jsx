import { useEffect, useRef, useState } from 'react';
import { GENRES, GENRE_THEMES, MAX_TURNS } from '../../config/gameConfig';
import { applyTheme, previewTheme, resetTheme } from '../../utils/theme';
import styles from './GenreSelector.module.css';

const PRESET_GENRES = GENRES.filter(g => g.id !== 'custom');
const CUSTOM_GENRE  = GENRES.find(g => g.id === 'custom');

export default function GenreSelector({ onGenreSelect }) {
  const didSelectRef = useRef(false);
  const resetTimerRef = useRef(null);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [vibe, setVibe] = useState('');
  const [scenario, setScenario] = useState('');

  // Reset theme on unmount only if no genre was selected (e.g. back navigation).
  // If a genre was selected, we want to keep the theme for the game screen.
  useEffect(() => {
    return () => {
      clearTimeout(resetTimerRef.current);
      if (!didSelectRef.current) resetTheme();
    };
  }, []);

  function handleMouseEnter(genreId, el) {
    clearTimeout(resetTimerRef.current);
    previewTheme(genreId);
    const theme = GENRE_THEMES[genreId];
    if (theme && el) {
      el.style.setProperty('--font-display', theme['--font-display']);
      el.style.setProperty('--font-body',    theme['--font-body']);
    }
  }

  function handleMouseLeave(el) {
    el.style.removeProperty('--font-display');
    el.style.removeProperty('--font-body');
    resetTimerRef.current = setTimeout(resetTheme, 150);
  }

  function handleSelect(genreId) {
    if (genreId === 'custom') {
      clearTimeout(resetTimerRef.current);
      previewTheme('custom');
      setShowCustomForm(true);
      return;
    }
    didSelectRef.current = true;
    applyTheme(genreId);
    onGenreSelect(genreId);
  }

  function handleBack() {
    setShowCustomForm(false);
    setVibe('');
    setScenario('');
    resetTheme();
  }

  function handleBegin(e) {
    e.preventDefault();
    if (!vibe.trim()) return;
    didSelectRef.current = true;
    onGenreSelect('custom', { vibe: vibe.trim(), scenario: scenario.trim() });
  }

  return (
    <div className={styles.container}>
      <div className={styles.inkBleed} aria-hidden="true" />
      <header className={styles.header}>
        <h1 className={styles.title}>Storyfork</h1>
        <p className={styles.subtitle}>choose your fate</p>
      </header>

      {showCustomForm ? (
        <form className={styles.customForm} onSubmit={handleBegin}>
          <div className={styles.customField}>
            <label className={styles.customLabel} htmlFor="vibe">vibe / genre</label>
            <input
              id="vibe"
              className={styles.customInput}
              type="text"
              placeholder="e.g. cyberpunk heist thriller"
              value={vibe}
              onChange={e => setVibe(e.target.value)}
              autoFocus
              maxLength={80}
              required
            />
          </div>
          <div className={styles.customField}>
            <label className={styles.customLabel} htmlFor="scenario">
              opening scenario <span className={styles.customOptional}>(optional)</span>
            </label>
            <textarea
              id="scenario"
              className={styles.customTextarea}
              placeholder="describe your opening scene, or leave blank for a surprise"
              value={scenario}
              onChange={e => setScenario(e.target.value)}
              rows={4}
              maxLength={400}
            />
          </div>
          <div className={styles.customActions}>
            <button type="button" className={styles.customBack} onClick={handleBack}>
              ← back
            </button>
            <button
              type="submit"
              className={styles.customBegin}
              disabled={!vibe.trim()}
            >
              Begin
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className={styles.grid}>
            {PRESET_GENRES.map(genre => (
              <button
                key={genre.id}
                className={styles.card}
                style={{ '--card-color': genre.color }}
                onMouseEnter={e => handleMouseEnter(genre.id, e.currentTarget)}
                onMouseLeave={e => handleMouseLeave(e.currentTarget)}
                onClick={() => handleSelect(genre.id)}
                aria-label={`Play ${genre.label} — ${genre.description}`}
              >
                <div className={styles.seal}>
                  <span className={styles.icon}>{genre.icon}</span>
                </div>
                <span className={styles.genreLabel}>{genre.label}</span>
                <span className={styles.genreDesc}>{genre.description}</span>
              </button>
            ))}
          </div>
          <div className={styles.customRow}>
            <button
              className={styles.customCard}
              style={{ '--card-color': CUSTOM_GENRE.color }}
              onMouseEnter={e => handleMouseEnter(CUSTOM_GENRE.id, e.currentTarget)}
              onMouseLeave={e => handleMouseLeave(e.currentTarget)}
              onClick={() => handleSelect(CUSTOM_GENRE.id)}
              aria-label="Play Custom — your story, your rules"
            >
              <span className={styles.customCardIcon}>{CUSTOM_GENRE.icon}</span>
              <span className={styles.customCardLabel}>{CUSTOM_GENRE.label}</span>
              <span className={styles.customCardDesc}>{CUSTOM_GENRE.description}</span>
            </button>
          </div>
        </>
      )}

      <footer className={styles.footer}>
        <span>a tale in {MAX_TURNS} choices</span>
      </footer>
    </div>
  );
}
