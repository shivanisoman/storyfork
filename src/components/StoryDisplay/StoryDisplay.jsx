import { useEffect, useRef } from 'react';
import { useTypewriter } from '../../hooks/useTypewriter';
import styles from './StoryDisplay.module.css';

function PastSegment({ segment, index }) {
  return (
    <div className={styles.pastSegment}>
      <p className={styles.pastText}>{segment.text}</p>
      {segment.selectedChoice && (
        <p className={styles.pastChoice}>
          <span className={styles.choiceArrow}>›</span> {segment.selectedChoice}
        </p>
      )}
      <div className={styles.divider} aria-hidden="true">· · ·</div>
    </div>
  );
}

function ActiveSegment({ text, isLoading, onDone }) {
  const { displayedText, isDone } = useTypewriter(isLoading ? '' : text);

  useEffect(() => {
    if (isDone && onDone) onDone();
  }, [isDone, onDone]);

  if (isLoading) {
    return (
      <div className={styles.activeSegment}>
        <span className={styles.loadingDots}>
          <span>.</span><span>.</span><span>.</span>
        </span>
      </div>
    );
  }

  return (
    <div className={styles.activeSegment}>
      <p className={styles.activeText}>
        {displayedText}
        {!isDone && <span className={styles.cursor}>|</span>}
      </p>
    </div>
  );
}

export default function StoryDisplay({ storySegments, isLoading, onTypewriterDone }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [storySegments, isLoading]);

  const pastSegments = storySegments.slice(0, -1);
  const currentSegment = storySegments[storySegments.length - 1];

  return (
    <div className={styles.wrapper} ref={scrollRef}>
      <div className={styles.fadeTop} aria-hidden="true" />
      <div className={styles.inner}>
        {pastSegments.map((seg, i) => (
          <PastSegment key={i} segment={seg} index={i} />
        ))}
        {currentSegment && (
          <ActiveSegment
            text={currentSegment.text}
            isLoading={isLoading}
            onDone={onTypewriterDone}
          />
        )}
        {!currentSegment && isLoading && (
          <ActiveSegment text="" isLoading={true} onDone={null} />
        )}
      </div>
      <div className={styles.fadeBottom} aria-hidden="true" />
    </div>
  );
}
