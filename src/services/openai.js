import OpenAI from 'openai';
import { MODEL, GENRE_TONES, MAX_TURNS } from '../config/gameConfig';

const client = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

export function buildSystemPrompt(genreId, maxTurns, scenario, modifier, toneOverride) {
  const genreLabel = (genreId === 'custom' && toneOverride)
    ? toneOverride
    : genreId.charAt(0).toUpperCase() + genreId.slice(1);
  const tone = toneOverride
    ? `Capture the essence of: ${toneOverride}. Write with full genre authenticity.`
    : GENRE_TONES[genreId] ?? '';

  return `You are a masterful storyteller running a ${genreLabel} text adventure.
The player is the protagonist. Write in second person ("You..."), present tense, immersive prose.

STORY STRUCTURE:
- The story will unfold over exactly ${maxTurns} player decisions, then reach its resolution.
- Make each narrative segment vivid and atmospheric — approximately 80–120 words. Be concise; every sentence should earn its place.
- Build tension and consequence: each choice must feel meaningful and alter the story.
- Escalate stakes with every turn. The story should feel like it's building toward something — each segment raises the emotional or physical cost of what's at stake.
- Ensure the arc leads to a satisfying, complete resolution by the final turn.
- Each set of four choices must span a full moral and narrative spectrum — from the noblest act to the most destructive — with no two choices resembling each other. Never label or explain the moral weight to the player; let the framing speak for itself.

GENRE TONE — ${genreLabel}:
${tone}

STRICT OUTPUT FORMAT — follow this exactly every single response:

[STORY]
<Your narrative here. 2–4 paragraphs. Second person. Present tense.>
[/STORY]
[CHOICE_A]
<Best path — heroic, selfless, or the highest moral ground. Carries real cost or risk.>
[/CHOICE_A]
[CHOICE_B]
<Cautious but decent path — pragmatic, well-intentioned, slightly self-preserving but not harmful.>
[/CHOICE_B]
[CHOICE_C]
<Morally grey or risky path — tempting, with clear costs or compromises visible in the framing.>
[/CHOICE_C]
[CHOICE_D]
<Worst path — selfish, cowardly, or outright harmful. The consequences feel real.>
[/CHOICE_D]

The four choices MUST be radically different from each other — different actions, different locations, different targets, different moral weight. No two choices should overlap in what the player is doing. Order them A (best outcome) → D (worst outcome) in terms of moral and narrative consequence, but never label or explain this to the player — let the framing speak for itself.

PENULTIMATE TURN RULE:
When the user's message begins with "PENULTIMATE TURN", the story has reached its crisis point.
Write the most intense, high-stakes segment yet — the situation has become critical, the consequences of what comes next are irreversible.
The four choices must span the full spectrum: A leads toward light, sacrifice, or redemption; D leads toward darkness, ruin, or betrayal; B and C occupy meaningfully different middle ground.
Make the weight of the decision unmistakable in the prose — the player should feel this matters above all else.

OPENING SCENARIO:
${scenario}

COMPLICATING FACTOR:
${modifier}

Begin the story weaving both elements naturally into your opening segment. Do not state either directly — let them emerge through the narrative.

FINAL TURN RULE:
When the user's message begins with "FINAL TURN", the player's last choice is the most important factor — it carries more weight than all prior choices combined.
Each choice carries a score: A = +2, B = +1, C = −1, D = −2. Tally the player's full history of choices.
If the total score is positive AND the final choice was A or B, write a GOOD ending — triumph, connection, hope, or resolution.
In all other cases write a BAD ending — loss, regret, failure, or tragedy. Default to bad when uncertain.
Omit [CHOICE_A], [CHOICE_B], [CHOICE_C], and [CHOICE_D] entirely.
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
  const choiceCMatch = rawContent.match(/\[CHOICE_C\]([\s\S]*?)\[\/CHOICE_C\]/);
  const choiceDMatch = rawContent.match(/\[CHOICE_D\]([\s\S]*?)\[\/CHOICE_D\]/);
  const outcomeMatch = rawContent.match(/\[OUTCOME\](good|bad)\[\/OUTCOME\]/);
  const isEnding     = rawContent.includes('[END]');

  const storyText  = storyMatch ? storyMatch[1].trim() : rawContent.trim();
  const choiceA    = choiceAMatch ? choiceAMatch[1].trim() : null;
  const choiceB    = choiceBMatch ? choiceBMatch[1].trim() : null;
  const choiceC    = choiceCMatch ? choiceCMatch[1].trim() : null;
  const choiceD    = choiceDMatch ? choiceDMatch[1].trim() : null;
  const endingType = outcomeMatch ? outcomeMatch[1] : null;

  // Fallback: mid-game but LLM dropped formatting
  if (!isEnding && (!choiceA || !choiceB || !choiceC || !choiceD)) {
    return {
      storyText,
      choiceA: choiceA ?? 'Press forward into the unknown.',
      choiceB: choiceB ?? 'Pause and gather your thoughts.',
      choiceC: choiceC ?? 'Look for another way around.',
      choiceD: choiceD ?? 'Turn back while you still can.',
      isEnding: false,
      endingType: null,
    };
  }

  // Shuffle choices so best (A) isn't always first and worst (D) isn't always last
  if (!isEnding && choiceA && choiceB && choiceC && choiceD) {
    const choices = [choiceA, choiceB, choiceC, choiceD];
    for (let i = choices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [choices[i], choices[j]] = [choices[j], choices[i]];
    }
    return { storyText, choiceA: choices[0], choiceB: choices[1], choiceC: choices[2], choiceD: choices[3], isEnding, endingType };
  }

  return { storyText, choiceA, choiceB, choiceC, choiceD, isEnding, endingType };
}

export async function sendTurn(messages) {
  const response = await client.chat.completions.create({
    model: MODEL,
    messages,
    temperature: 0.85,
    max_tokens: 1100,
  });

  const rawContent = response.choices[0].message.content;
  return extractParsedResponse(rawContent);
}
