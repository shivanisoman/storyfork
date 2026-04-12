import OpenAI from 'openai';
import { MODEL, GENRE_TONES, MAX_TURNS } from '../config/gameConfig';

const client = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

export function buildSystemPrompt(genreId, maxTurns, scenario, modifier) {
  const genreLabel = genreId.charAt(0).toUpperCase() + genreId.slice(1);
  const tone = GENRE_TONES[genreId] || '';

  return `You are a masterful storyteller running a ${genreLabel} text adventure.
The player is the protagonist. Write in second person ("You..."), present tense, immersive prose.

STORY STRUCTURE:
- The story will unfold over exactly ${maxTurns} player decisions, then reach its resolution.
- Make each narrative segment vivid and atmospheric — approximately 80–120 words. Be concise; every sentence should earn its place.
- Build tension and consequence: each choice must feel meaningful and alter the story.
- Escalate stakes with every turn. The story should feel like it's building toward something — each segment raises the emotional or physical cost of what's at stake.
- Ensure the arc leads to a satisfying, complete resolution by the final turn.
- Each pair of choices should carry implicit narrative weight: one option leans toward hope, courage, or connection (the "better path"); the other toward fear, selfishness, or harm (the "worse path"). Never label or explain this to the player — let the framing speak for itself.

GENRE TONE — ${genreLabel}:
${tone}

STRICT OUTPUT FORMAT — follow this exactly every single response:

[STORY]
<Your narrative here. 2–4 paragraphs. Second person. Present tense.>
[/STORY]
[CHOICE_A]
<First option — one clear, action-oriented sentence.>
[/CHOICE_A]
[CHOICE_B]
<Second option — one clear, action-oriented sentence.>
[/CHOICE_B]

PENULTIMATE TURN RULE:
When the user's message begins with "PENULTIMATE TURN", the story has reached its crisis point.
Write the most intense, high-stakes segment yet — the situation has become critical, the consequences of what comes next are irreversible.
The two choices must feel like a true fork in the road: one leads toward light, sacrifice, or redemption; the other toward darkness, self-preservation, or ruin.
Make the weight of the decision unmistakable in the prose — the player should feel this matters above all else.

OPENING SCENARIO:
${scenario}

COMPLICATING FACTOR:
${modifier}

Begin the story weaving both elements naturally into your opening segment. Do not state either directly — let them emerge through the narrative.

FINAL TURN RULE:
When the user's message begins with "FINAL TURN", the player's last choice is the most important factor — it carries more weight than all prior choices combined.
If that final choice was brave, selfless, or hopeful AND the majority of earlier choices were also positive, write a GOOD ending — triumph, connection, hope, or resolution.
In all other cases — mixed choices, a weak final choice, or a bad final choice — write a BAD ending — loss, regret, failure, or tragedy. Default to bad when uncertain.
Omit [CHOICE_A] and [CHOICE_B] entirely.
After [/STORY], add [OUTCOME]good[/OUTCOME] or [OUTCOME]bad[/OUTCOME] to declare the ending type.
Then end with [END] on its own line.`;
}

export function buildUserMessage(choiceText, turnCount, maxTurns) {
  if (turnCount >= maxTurns) {
    return `FINAL TURN\nChoice: ${choiceText}`;
  }
  if (turnCount === maxTurns - 1) {
    return `PENULTIMATE TURN\nChoice: ${choiceText}`;
  }
  return `Choice: ${choiceText}`;
}

function extractParsedResponse(rawContent) {
  const storyMatch   = rawContent.match(/\[STORY\]([\s\S]*?)\[\/STORY\]/);
  const choiceAMatch = rawContent.match(/\[CHOICE_A\]([\s\S]*?)\[\/CHOICE_A\]/);
  const choiceBMatch = rawContent.match(/\[CHOICE_B\]([\s\S]*?)\[\/CHOICE_B\]/);
  const outcomeMatch = rawContent.match(/\[OUTCOME\](good|bad)\[\/OUTCOME\]/);
  const isEnding     = rawContent.includes('[END]');

  const storyText  = storyMatch ? storyMatch[1].trim() : rawContent.trim();
  const choiceA    = choiceAMatch ? choiceAMatch[1].trim() : null;
  const choiceB    = choiceBMatch ? choiceBMatch[1].trim() : null;
  const endingType = outcomeMatch ? outcomeMatch[1] : null;

  // Fallback: mid-game but LLM dropped formatting
  if (!isEnding && (!choiceA || !choiceB)) {
    return {
      storyText,
      choiceA: choiceA ?? 'Press forward into the unknown.',
      choiceB: choiceB ?? 'Pause and gather your thoughts.',
      isEnding: false,
      endingType: null,
    };
  }

  return { storyText, choiceA, choiceB, isEnding, endingType };
}

export async function sendTurn(messages) {
  const response = await client.chat.completions.create({
    model: MODEL,
    messages,
    temperature: 0.85,
    max_tokens: 800,
  });

  const rawContent = response.choices[0].message.content;
  return extractParsedResponse(rawContent);
}
