import { useState } from 'react';
import { MAX_TURNS, GENRE_SCENARIOS, SCENARIO_MODIFIERS } from './config/gameConfig';
import { buildSystemPrompt, buildUserMessage, sendTurn } from './services/openai';
import { applyTheme, resetTheme } from './utils/theme';
import GenreSelector from './components/GenreSelector/GenreSelector';
import GameScreen from './components/GameScreen/GameScreen';
import GameOver from './components/GameOver/GameOver';
import './App.css';

const initialState = {
  phase: 'genre_select',
  genre: null,
  messages: [],
  storySegments: [],
  currentChoices: null,
  turnCount: 0,
  isLoading: false,
  error: null,
  endingText: null,
  endingType: null,
};

export default function App() {
  const [gameState, setGameState] = useState(initialState);

  async function handleGenreSelect(genreId) {
    applyTheme(genreId);  // commit genre theme for the full session
    const scenarios = GENRE_SCENARIOS[genreId];
    const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    const modifier = SCENARIO_MODIFIERS[Math.floor(Math.random() * SCENARIO_MODIFIERS.length)];
    const systemPrompt = buildSystemPrompt(genreId, MAX_TURNS, scenario, modifier);
    const initialMessages = [{ role: 'system', content: systemPrompt }];

    setGameState(s => ({
      ...s,
      phase: 'playing',
      genre: genreId,
      messages: initialMessages,
      isLoading: true,
      error: null,
    }));

    try {
      const { storyText, choiceA, choiceB } = await sendTurn(initialMessages);
      const assistantMessage = { role: 'assistant', content: `[STORY]\n${storyText}\n[/STORY]\n[CHOICE_A]\n${choiceA}\n[/CHOICE_A]\n[CHOICE_B]\n${choiceB}\n[/CHOICE_B]` };

      setGameState(s => ({
        ...s,
        messages: [...s.messages, assistantMessage],
        storySegments: [{ text: storyText, choiceA, choiceB, selectedChoice: null }],
        currentChoices: { choiceA, choiceB },
        turnCount: 1,
        isLoading: false,
      }));
    } catch (err) {
      setGameState(s => ({ ...s, isLoading: false, error: err.message }));
    }
  }

  async function handleChoiceSelect(choiceText) {
    const { messages, storySegments, turnCount } = gameState;
    const userMessage = buildUserMessage(choiceText, turnCount, MAX_TURNS);
    const updatedMessages = [...messages, { role: 'user', content: userMessage }];

    // Mark the selected choice on the last segment
    const updatedSegments = storySegments.map((seg, i) =>
      i === storySegments.length - 1 ? { ...seg, selectedChoice: choiceText } : seg
    );

    setGameState(s => ({
      ...s,
      messages: updatedMessages,
      storySegments: updatedSegments,
      currentChoices: null,
      isLoading: true,
      error: null,
    }));

    try {
      const { storyText, choiceA, choiceB, isEnding, endingType } = await sendTurn(updatedMessages);
      const assistantContent = isEnding
        ? `[STORY]\n${storyText}\n[/STORY]\n[END]`
        : `[STORY]\n${storyText}\n[/STORY]\n[CHOICE_A]\n${choiceA}\n[/CHOICE_A]\n[CHOICE_B]\n${choiceB}\n[/CHOICE_B]`;

      if (isEnding) {
        setGameState(s => ({
          ...s,
          messages: [...updatedMessages, { role: 'assistant', content: assistantContent }],
          storySegments: [...updatedSegments, { text: storyText, choiceA: null, choiceB: null, selectedChoice: null }],
          phase: 'game_over',
          endingText: storyText,
          endingType: endingType ?? 'bad',
          isLoading: false,
        }));
      } else {
        setGameState(s => ({
          ...s,
          messages: [...updatedMessages, { role: 'assistant', content: assistantContent }],
          storySegments: [...updatedSegments, { text: storyText, choiceA, choiceB, selectedChoice: null }],
          currentChoices: { choiceA, choiceB },
          turnCount: s.turnCount + 1,
          isLoading: false,
        }));
      }
    } catch (err) {
      setGameState(s => ({ ...s, isLoading: false, error: err.message }));
    }
  }

  function handlePlayAgain() {
    resetTheme();  // revert to neutral defaults before returning to genre select
    setGameState(initialState);
  }

  return (
    <div className="app">
      {gameState.phase === 'genre_select' && (
        <GenreSelector onGenreSelect={handleGenreSelect} />
      )}
      {gameState.phase === 'playing' && (
        <GameScreen gameState={gameState} onChoiceSelect={handleChoiceSelect} />
      )}
      {gameState.phase === 'game_over' && (
        <GameOver
          endingText={gameState.endingText}
          endingType={gameState.endingType}
          storySegments={gameState.storySegments}
          genre={gameState.genre}
          onPlayAgain={handlePlayAgain}
        />
      )}
    </div>
  );
}
