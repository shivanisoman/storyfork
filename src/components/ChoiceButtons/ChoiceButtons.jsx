import { useEffect, useState } from 'react';
import styles from './ChoiceButtons.module.css';

export default function ChoiceButtons({ choices, onChoiceSelect, isLoading, typewriterDone }) {
  const [selected, setSelected] = useState(null);
  const visible = typewriterDone && !isLoading && choices;

  // Reset selected state when new choices arrive
  useEffect(() => {
    setSelected(null);
  }, [choices]);

  // Keyboard shortcuts: A / B keys
  useEffect(() => {
    if (!visible || selected) return;

    function handleKey(e) {
      if (e.key.toLowerCase() === 'a') pick('A', choices.choiceA);
      if (e.key.toLowerCase() === 'b') pick('B', choices.choiceB);
    }

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [visible, selected, choices]);

  function pick(letter, text) {
    if (selected) return;
    setSelected(letter);
    setTimeout(() => onChoiceSelect(text), 300);
  }

  if (!visible) return null;

  return (
    <div className={styles.container}>
      <button
        className={`${styles.choiceBtn} ${selected === 'A' ? styles.selected : ''} ${selected && selected !== 'A' ? styles.faded : ''}`}
        onClick={() => pick('A', choices.choiceA)}
        disabled={!!selected}
        aria-label={`Choice A: ${choices.choiceA}`}
        style={{ animationDelay: '0ms' }}
      >
        <span className={styles.badge}>[A]</span>
        <span className={styles.choiceText}>{choices.choiceA}</span>
      </button>
      <button
        className={`${styles.choiceBtn} ${selected === 'B' ? styles.selected : ''} ${selected && selected !== 'B' ? styles.faded : ''}`}
        onClick={() => pick('B', choices.choiceB)}
        disabled={!!selected}
        aria-label={`Choice B: ${choices.choiceB}`}
        style={{ animationDelay: '80ms' }}
      >
        <span className={styles.badge}>[B]</span>
        <span className={styles.choiceText}>{choices.choiceB}</span>
      </button>
    </div>
  );
}
