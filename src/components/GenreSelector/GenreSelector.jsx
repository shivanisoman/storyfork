import { useEffect, useRef } from 'react';
import { GENRES, MAX_TURNS } from '../../config/gameConfig';
import { applyTheme, resetTheme } from '../../utils/theme';
import styles from './GenreSelector.module.css';

export default function GenreSelector({ onGenreSelect }) {
  const didSelectRef = useRef(false);
  const resetTimerRef = useRef(null);

  // Reset theme on unmount only if no genre was selected (e.g. back navigation).
  // If a genre was selected, we want to keep the theme for the game screen.
  useEffect(() => {
    return () => {
      clearTimeout(resetTimerRef.current);
      if (!didSelectRef.current) resetTheme();
    };
  }, []);

  function handleMouseEnter(genreId) {
    clearTimeout(resetTimerRef.current);
    applyTheme(genreId);
  }

  function handleMouseLeave() {
    resetTimerRef.current = setTimeout(resetTheme, 150);
  }

  function handleSelect(genreId) {
    didSelectRef.current = true;
    applyTheme(genreId);
    onGenreSelect(genreId);
  }

  return (
    <div className={styles.container}>
      <div className={styles.inkBleed} aria-hidden="true" />
      <header className={styles.header}>
        <h1 className={styles.title}>Chronicles</h1>
        <p className={styles.subtitle}>choose your fate</p>
      </header>
      <div className={styles.grid}>
        {GENRES.map(genre => (
          <button
            key={genre.id}
            className={styles.card}
            style={{ '--card-color': genre.color }}
            onMouseEnter={() => handleMouseEnter(genre.id)}
            onMouseLeave={handleMouseLeave}
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
      <footer className={styles.footer}>
        <span>a tale in {MAX_TURNS} choices</span>
      </footer>
    </div>
  );
}
