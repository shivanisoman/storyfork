import { useState, useEffect, useRef } from 'react';
import { TYPEWRITER_SPEED_MS } from '../config/gameConfig';

export function useTypewriter(text, speed = TYPEWRITER_SPEED_MS) {
  const [displayedText, setDisplayedText] = useState('');
  const [isDone, setIsDone] = useState(false);
  const indexRef = useRef(0);

  useEffect(() => {
    if (!text) {
      setDisplayedText('');
      setIsDone(false);
      return;
    }

    // Reset when text changes
    setDisplayedText('');
    setIsDone(false);
    indexRef.current = 0;

    const interval = setInterval(() => {
      if (indexRef.current < text.length) {
        setDisplayedText(text.slice(0, indexRef.current + 1));
        indexRef.current += 1;
      } else {
        setIsDone(true);
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return { displayedText, isDone };
}
