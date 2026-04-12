import { useEffect, useState } from 'react';
import styles from './ChoiceButtons.module.css';

const CHOICE_KEYS = [
  { letter: 'A', key: 'a', field: 'choiceA', delay: '0ms' },
  { letter: 'B', key: 'b', field: 'choiceB', delay: '60ms' },
  { letter: 'C', key: 'c', field: 'choiceC', delay: '120ms' },
  { letter: 'D', key: 'd', field: 'choiceD', delay: '180ms' },
];

export default function ChoiceButtons({ choices, onChoiceSelect, isLoading, typewriterDone }) {
  const [selected, setSelected] = useState(null);
  const visible = typewriterDone && !isLoading && choices;

  // Reset selected state when new choices arrive
  useEffect(() => {
    setSelected(null);
  }, [choices]);

  // Keyboard shortcuts: A / B / C / D keys
  useEffect(() => {
    if (!visible || selected) return;

    function handleKey(e) {
      for (const c of CHOICE_KEYS) {
        if (e.key.toLowerCase() === c.key) {
          pick(c.letter, choices[c.field]);
          return;
        }
      }
    }

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [visible, selected, choices]);

  function pick(letter, text) {
    if (selected || !text) return;
    setSelected(letter);
    setTimeout(() => onChoiceSelect(text), 300);
  }

  if (!visible) return null;

  return (
    <div className={styles.container}>
      {CHOICE_KEYS.map(({ letter, field, delay }) => (
        <button
          key={letter}
          className={`${styles.choiceBtn} ${selected === letter ? styles.selected : ''} ${selected && selected !== letter ? styles.faded : ''}`}
          onClick={() => pick(letter, choices[field])}
          disabled={!!selected}
          aria-label={`Choice ${letter}: ${choices[field]}`}
          style={{ animationDelay: delay }}
        >
          <span className={styles.badge}>[{letter}]</span>
          <span className={styles.choiceText}>{choices[field]}</span>
        </button>
      ))}
    </div>
  );
}
