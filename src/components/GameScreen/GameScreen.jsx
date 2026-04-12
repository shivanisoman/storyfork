import { useState } from 'react';
import { GENRES, ROMAN, MAX_TURNS } from '../../config/gameConfig';
import StoryDisplay from '../StoryDisplay/StoryDisplay';
import ChoiceButtons from '../ChoiceButtons/ChoiceButtons';
import styles from './GameScreen.module.css';

export default function GameScreen({ gameState, onChoiceSelect }) {
  const [typewriterDone, setTypewriterDone] = useState(false);
  const { genre, storySegments, currentChoices, turnCount, isLoading, error } = gameState;

  const genreData = GENRES.find(g => g.id === genre);

  // Reset typewriter gate when new segment arrives
  const segmentCount = storySegments.length;

  function handleTypewriterDone() {
    setTypewriterDone(true);
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.genreBadge}>
          <span className={styles.genreIcon}>{genreData?.icon}</span>
          <span className={styles.genreName}>{genreData?.label}</span>
        </div>
        <div className={styles.turnTracker} aria-label={`Turn ${turnCount} of ${MAX_TURNS}`}>
          {Array.from({ length: MAX_TURNS }, (_, i) => (
            <span
              key={i}
              className={`${styles.turnDot} ${i < turnCount ? styles.turnDone : ''} ${i === turnCount - 1 ? styles.turnCurrent : ''}`}
            >
              {ROMAN[i]}
            </span>
          ))}
        </div>
      </header>

      <main className={styles.main}>
        <StoryDisplay
          storySegments={storySegments}
          isLoading={isLoading}
          onTypewriterDone={handleTypewriterDone}
          key={segmentCount}
        />

        {error && (
          <div className={styles.error} role="alert">
            <span>✕</span> {error}
          </div>
        )}

        <ChoiceButtons
          choices={currentChoices}
          onChoiceSelect={(text) => {
            setTypewriterDone(false);
            onChoiceSelect(text);
          }}
          isLoading={isLoading}
          typewriterDone={typewriterDone}
        />
      </main>
    </div>
  );
}
