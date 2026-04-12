# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # start dev server at http://localhost:5173
npm run build    # production build (output to dist/)
npm run preview  # preview the production build locally
```

No test runner or linter is configured.

## Maintenance

After implementing any feature change, update `README.md` to reflect it before considering the task complete.

## Environment

Requires `VITE_OPENAI_API_KEY` in `.env` (Vite only exposes env vars prefixed with `VITE_` to the browser). The OpenAI client uses `dangerouslyAllowBrowser: true` — intentional for this dev POC.

## Architecture

### Game State Machine (`src/App.jsx`)

All game state lives in a single `useState` object in `App.jsx`. The app cycles through three phases:

```
genre_select → playing → game_over → genre_select
```

State shape:
```js
{ phase, genre, messages[], storySegments[], currentChoices, turnCount, isLoading, error, endingText, endingType }
```

- `messages` is the full OpenAI conversation history array sent verbatim every API call — no summarization
- `storySegments` mirrors the story for UI rendering: `[{ text, choiceA, choiceB, selectedChoice }]`
- `turnCount` starts at 1 after the first LLM response
- `endingType` is `'good'` or `'bad'` — parsed from LLM output on the final turn; drives GameOver styling
- The user message on the penultimate turn is prefixed with `"PENULTIMATE TURN\n"` to signal the LLM to begin setting up an ending
- The user message on the final turn (`turnCount >= MAX_TURNS`) is prefixed with `"FINAL TURN\n"` to signal the LLM to write an ending instead of more choices

### OpenAI Orchestration (`src/services/openai.js`)

The LLM is instructed via system prompt to use custom delimiters:
```
[STORY]...[/STORY]  [CHOICE_A]...[/CHOICE_A]  [CHOICE_B]...[/CHOICE_B]
```
`extractParsedResponse()` parses these with regex. On the final turn the LLM omits choice tags, appends `[END]`, and includes a `[OUTCOME]good[/OUTCOME]` or `[OUTCOME]bad[/OUTCOME]` tag to signal ending type. If mid-game parsing fails (LLM drops format), fallback placeholder choices are returned to prevent a crash.

API calls use `temperature: 0.85` and `max_tokens: 800`.

`buildSystemPrompt` accepts an optional fifth argument `toneOverride` — when provided (custom genre), it is used as both the genre label and the tone instruction instead of `GENRE_TONES[genreId]`.

### Configuration (`src/config/gameConfig.js`)

**Single source of truth for all tuneable values:**
- `MAX_TURNS` — change this to adjust game length (currently `5`)
- `MODEL` — OpenAI model string (currently `'gpt-4o-mini'`)
- `TYPEWRITER_SPEED_MS` — character animation delay in ms (currently `18`)
- `GENRES` — array of 6 genre objects (5 presets + 1 custom); drives the selector UI. Each genre object contains:
  - `id`, `label`, `icon`, `color`, `description` — UI display
- `CUSTOM_SCENARIO_FALLBACK` — fallback scenario string used when the user leaves the custom scenario field blank
- `GENRE_TONES` — map of genre id → tone instruction injected into the system prompt
- `GENRE_SCENARIOS` — map of genre id → array of 20 scenario starters; one is randomly selected per game
- `ENDING_ICONS` — map of genre id → `{ good, bad }` icons shown on the GameOver screen
- `GENRE_THEMES` — map of genre id → full CSS variable map for the theming system
- `SCENARIO_MODIFIERS` — array of 12 complications (e.g. hidden agendas, time limits, player secrets) randomly mixed into the initial prompt to add variety
- `ROMAN` — lookup array used by the turn tracker UI

### Theming System (`src/utils/theme.js`)

Themes are applied by imperatively setting CSS custom properties on `document.documentElement`, overriding the `:root` defaults in `App.css`. This means all components theme automatically without prop changes.

- `applyTheme(genreId)` — called on genre select (commit); sets all CSS vars including fonts
- `previewTheme(genreId)` — called on hover; sets only color vars, intentionally skips `--font-display` and `--font-body` so page-level fonts don't change during hover
- `resetTheme()` — called on mouse-leave and on "Begin Again"

CSS transitions on `body` and `.wrapper` animate background/color changes at `0.45s ease`. Fonts snap (no tween); this is intentional and imperceptible during the colour fade.

The themed CSS variables are:
`--bg-primary`, `--bg-parchment`, `--text-primary`, `--text-muted`, `--border-ink`, `--accent-gold`, `--font-display`, `--font-body`

### Styling Conventions

- CSS Modules (`.module.css`) scoped per component — no global class collisions
- Key selectors use `var(--font-display)` and `var(--font-body)` for genre-responsive fonts; UI chrome elements (badges, monospace labels) keep hardcoded `'Courier Prime'`
- `--accent-gold` is the single authoritative accent colour; `--genre-color` was removed — don't reintroduce it
- Google Fonts loaded in `index.html`: Cinzel, Cinzel Decorative, Crimson Text, Courier Prime, Cormorant Garamond, EB Garamond, IM Fell English, Orbitron, Playfair Display

### Component Data Flow

```
App.jsx (state + handlers)
  ├── GenreSelector   — hover calls previewTheme (colors only) + sets font vars on the hovered element directly; select calls onGenreSelect(genreId, customData?)
  ├── GameScreen      — receives full gameState + onChoiceSelect; manages typewriter gate locally
  │     ├── StoryDisplay  — uses useTypewriter hook; past segments dimmed, current animates
  │     └── ChoiceButtons — hidden until typewriter isDone; keyboard shortcuts A/B
  └── GameOver        — displays endingText + choice timeline from storySegments; styled by endingType
```

`StoryDisplay` is keyed on `storySegments.length` in `GameScreen` to force a fresh typewriter animation on each new segment.

### Hooks

`src/hooks/useTypewriter.js` — takes `(text, speedMs)`, returns `{ displayedText, isDone }`. Resets when text changes; cleans up interval on unmount.
