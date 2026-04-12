import { GENRES, ENDING_ICONS } from '../../config/gameConfig';
import styles from './GameOver.module.css';

export default function GameOver({ endingText, endingType, storySegments, genre, onPlayAgain }) {
  const choices = storySegments
    .filter(seg => seg.selectedChoice)
    .map(seg => seg.selectedChoice);

  const isGood = endingType !== 'bad';
  const flourish = isGood ? '✦' : '✗';
  const endingIcon = ENDING_ICONS[genre]?.[isGood ? 'good' : 'bad'] ?? (isGood ? '✦' : '✗');

  return (
    <div className={`${styles.overlay} ${isGood ? styles.goodEnding : styles.badEnding}`}>
      <div className={styles.container}>
        <div className={styles.headerSection}>
          <div className={styles.flourishTop} aria-hidden="true">— {flourish} —</div>
          <span className={`${styles.endingBadge} ${isGood ? styles.goodBadge : styles.badBadge}`}>
            {isGood ? 'Good Ending' : 'Bad Ending'}
          </span>
          <div className={styles.endingIcon} aria-hidden="true">{endingIcon}</div>
          <h1 className={styles.title}>The End</h1>
          <div className={styles.flourishBottom} aria-hidden="true">— {flourish} —</div>
        </div>

        <div className={styles.endingBox}>
          <p className={styles.endingText}>{endingText}</p>
        </div>

        {choices.length > 0 && (
          <div className={styles.timeline}>
            <h2 className={styles.timelineTitle}>Your Journey</h2>
            <ol className={styles.choiceList}>
              {choices.map((choice, i) => (
                <li key={i} className={styles.choiceItem}>
                  <span className={styles.choiceGlyph}>❧</span>
                  <span className={styles.choiceItemText}>{choice}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        <button className={styles.playAgainBtn} onClick={onPlayAgain}>
          Begin Again
        </button>
      </div>
    </div>
  );
}
