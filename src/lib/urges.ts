import { colors } from './theme';

/**
 * In-the-moment urges surfaced on Today. Each opens a short guided flow —
 * one meditative step per screen. `{thing}` in step text is replaced by
 * whatever the user names on the prompt step (or `fallback` if skipped).
 */
export type UrgeStep = {
  overline: string;
  text: string;
  /** Show the breathing pacer under the text. */
  breath?: boolean;
  /** Placeholder for an optional "name it" input on this step. */
  prompt?: string;
  /**
   * Show the future-self / inversion fork. Pulls the user's own vision and
   * anti-vision from the named domain (written in Compass); the strings here
   * are fallbacks until they've written their own.
   */
  identity?: { domain: string; vision: string; antiVision: string };
  /** Physical things to do right now — the "Remediate" step. */
  actions?: { emoji: string; label: string; note: string }[];
};

export type Urge = {
  id: string;
  label: string;
  /** Short noun for charts and summaries ("Hunger", "Anxiety"). */
  noun: string;
  emoji: string;
  color: string;
  /** Used for `{thing}` when the user doesn't type anything. */
  fallback: string;
  steps: UrgeStep[];
};

export const URGES: Urge[] = [
  {
    id: 'hungry',
    noun: 'Hunger',
    label: 'I am hungry',
    emoji: '🥣',
    color: colors.health,
    fallback: 'it',
    // Peter's 7-step resolution: identify → get curious (Untethered Soul:
    // watch it as the witness) → acknowledge → rationalize (chosen, good) →
    // accept → appreciate → imagine both roads (endure vs submit).
    steps: [
      {
        overline: 'Identify',
        text: 'Turn toward it. There is a feeling here, and its name is hunger. Say it plainly: I am feeling hungry.',
      },
      {
        overline: 'Get curious',
        breath: true,
        text: 'Sit back and watch it, the way you’d watch weather. Where does the hunger live — stomach, chest, throat? How big is it? Does it have an edge? You are the one watching. You are not the hunger.',
      },
      {
        overline: 'Acknowledge',
        text: 'Let it exist. Don’t push it away, don’t rush to fix it. Just nod to it: yes, you’re here.',
      },
      {
        overline: 'Rationalize',
        text: 'Remember why this is good. You chose this hunger — it’s the plan working, not a problem. And it’s amazing that you can feel it, sit with it, and stay in charge. The discipline you asked for, arriving on time.',
      },
      {
        overline: 'Accept',
        text: 'It’s okay to feel this. You don’t need it gone. A meal will come when it’s due — until then, this feeling can simply be here, and you can be fine.',
      },
      {
        overline: 'Appreciate',
        text: 'Go further — be grateful for it. This is your body using its own reserves, becoming lighter and sharper. Thank the hunger. It’s on your side.',
      },
      {
        overline: 'Imagine',
        identity: {
          domain: 'Health',
          vision:
            'Endure it: healthy, high-energy, vegetarian — 68 kg, 13% body fat. Lighter, sharper, in charge. I chose it. That’s my advantage.',
          antiVision:
            'Submit to it: fed on every craving, heavy and low-energy — and the heart-disease pressure gets its opening.',
        },
        text: 'See both roads. Endure this hunger and you walk toward the first. Submit and you drift to the second. Which does this moment build?',
      },
      {
        overline: 'Remediate',
        text: 'The honest test — would poached broccoli or a plate of Brussels sprouts sound good right now? If yes, you’re truly hungry: eat a real meal, slowly. If not, it’s a craving — do one of these instead:',
        actions: [
          { emoji: '💧', label: 'A full glass of water', note: 'Thirst impersonates hunger constantly.' },
          { emoji: '🥤', label: 'Protein shake', note: '25g — the most filling thing you can drink.' },
          { emoji: '🔥', label: 'Five minutes out of breath', note: 'Stairs, burpees, a sprint — blunts the craving fast.' },
          { emoji: '☕', label: 'Black coffee or green tea', note: 'Appetite down, energy up.' },
          { emoji: '🌿', label: 'Psyllium or vinegar in water', note: 'Fills the stomach with nothing to chew.' },
        ],
      },
    ],
  },
  {
    id: 'annoyed',
    noun: 'Annoyance',
    label: 'I find … annoying',
    emoji: '😤',
    color: colors.decay,
    fallback: 'it',
    steps: [
      {
        overline: 'Name it',
        prompt: 'What’s annoying you?',
        text: 'Name it. The moment you can point at it, it’s a thing you have — not a thing you are.',
      },
      {
        overline: 'Locate',
        text: 'Close your eyes for a moment. Find where the irritation lives — jaw, chest, shoulders? Don’t fix it. Just know its address.',
      },
      {
        overline: 'Breathe',
        breath: true,
        text: 'Make each exhale longer than the inhale. Irritation is energy — let it drain out with the out-breath.',
      },
      {
        overline: 'Reframe',
        text: 'You don’t control {thing}. You do control what happens in you next. Will this matter in ten years? In ten days?',
      },
      {
        overline: 'Return',
        text: 'Let it be there without becoming you. You are the sky; this was weather passing through.',
      },
    ],
  },
  {
    id: 'anxious',
    noun: 'Anxiety',
    label: 'I am anxious about …',
    emoji: '🌊',
    color: colors.knowledge,
    fallback: 'it',
    steps: [
      {
        overline: 'Name it',
        prompt: 'What are you anxious about?',
        text: 'Say it plainly. Anxiety feeds on vagueness — it shrinks when it’s specific.',
      },
      {
        overline: 'Ground',
        text: 'Come back to the room. Find five things you can see, three you can hear, one you can feel against your skin.',
      },
      {
        overline: 'Breathe',
        breath: true,
        text: 'In for four, out for six. A long exhale is how you tell your body: the danger is not here, not now.',
      },
      {
        overline: 'Sort',
        text: 'What part of {thing} is actually yours to control today? Choose one small action. Set the rest down — it was never yours to carry.',
      },
      {
        overline: 'Return',
        text: 'Anxiety is imagination pointed at the future. You live here, in the present — and the present is workable.',
      },
    ],
  },
  {
    id: 'bored',
    noun: 'Boredom',
    label: 'It’s boring to do …',
    emoji: '🥱',
    color: colors.accentBright,
    fallback: 'this task',
    steps: [
      {
        overline: 'Name it',
        prompt: 'What’s the boring thing?',
        text: 'Name the task without judgment. It isn’t against you. It’s just unglamorous.',
      },
      {
        overline: 'Sit with it',
        text: 'Boredom is the itch for something easier. Don’t scratch it for one breath. Then one more. Notice — it isn’t pain, just restlessness. It passes.',
      },
      {
        overline: 'Shrink it',
        text: 'Make it small: what are the first two minutes? You never need to do the whole thing — only start it.',
      },
      {
        overline: 'Remember',
        text: 'Boring is where compounding hides — {thing} is one brick in something you’re building. Lay it well.',
      },
      {
        overline: 'Return',
        text: 'Do it slowly and completely. Full attention makes dull work feel like meditation.',
      },
    ],
  },
  {
    id: 'start-reading',
    noun: 'Reading',
    label: 'I don’t want to start reading',
    emoji: '📖',
    color: colors.knowledge,
    fallback: 'reading',
    steps: [
      {
        overline: 'Identify',
        text: 'Notice what you’re actually avoiding. Not the reading — the starting. The resistance lives at the first page and nowhere else.',
      },
      {
        overline: 'Get curious',
        breath: true,
        text: 'Watch the resistance like weather. Where does it sit? Notice it’s loudest right now, at the threshold — and that it has no power once a single page is behind you.',
      },
      {
        overline: 'Reframe',
        text: 'Motivation isn’t the entry fee. It arrives after the first page, never before. You don’t have to want it. You only have to open it.',
      },
      {
        overline: 'The identity',
        identity: {
          domain: 'Knowledge',
          vision: 'A reader — a few pages every day, compounding into a mind worth having.',
          antiVision: 'Always meaning to, never starting — a stack of books and a scrolling thumb.',
        },
        text: 'Every page is a vote. This is who the pages build.',
      },
      {
        overline: 'Begin',
        text: 'Shrink it until it’s easy. Do one, right now:',
        actions: [
          { emoji: '📖', label: 'Open to any page', note: 'Just hold it open. The hard part is done.' },
          { emoji: '📄', label: 'One paragraph', note: 'Read a single paragraph. Momentum takes it from there.' },
          { emoji: '⏱️', label: 'Two minutes', note: 'Set a timer. You may stop when it rings — you won’t.' },
        ],
      },
    ],
  },
  {
    id: 'start-exercise',
    noun: 'Exercise',
    label: 'It’s tiring to start exercising',
    emoji: '🏃',
    color: colors.health,
    fallback: 'the workout',
    steps: [
      {
        overline: 'Identify',
        text: 'That tiredness is a forecast, not a fact. You’re feeling the workout you imagined, not the one you’ve done. Name it: I don’t want to begin.',
      },
      {
        overline: 'Get curious',
        breath: true,
        text: 'Find the heaviness. Where does it sit? It’s densest before the first move — and it burns off inside the first two minutes of actually moving.',
      },
      {
        overline: 'Reframe',
        text: 'Energy is made by moving, not saved by resting. You don’t wait to feel strong and then move — you move, and the strength comes. The body follows the first rep.',
      },
      {
        overline: 'The identity',
        identity: {
          domain: 'Health',
          vision: 'Strong and light — someone who moves daily and runs on the energy it makes.',
          antiVision: 'Always too tired to start — stiffer and heavier every season it wins.',
        },
        text: 'This is who the first rep builds.',
      },
      {
        overline: 'Begin',
        text: 'Don’t commit to the workout. Commit to the smallest start:',
        actions: [
          { emoji: '👟', label: 'Just the shoes', note: 'Put them on. Nothing more required yet.' },
          { emoji: '🔟', label: 'Ten reps', note: 'One tiny set. The body wakes and asks for more.' },
          { emoji: '⏱️', label: 'Two minutes', note: 'Move for 120 seconds. Quit after — if you still want to.' },
        ],
      },
    ],
  },
  {
    id: 'indulge',
    noun: 'Indulgence',
    label: 'I am compelled to indulge in …',
    emoji: '🌀',
    color: colors.relationships,
    fallback: 'it',
    steps: [
      {
        overline: 'Identify',
        prompt: 'What’s pulling you?',
        text: 'Name the pull plainly. Compulsion works in the dark — naming it drags it into daylight.',
      },
      {
        overline: 'Observe',
        breath: true,
        text: 'Drop the promise it’s making and re-observe the pull as pure sensation — its place, its size, its texture. Watched closely, it breaks into small flickers, and the flickers turn neutral.',
      },
      {
        overline: 'Play the tape',
        text: 'Acknowledge it without shame — pulls happen. But you didn’t choose this one. Run the tape forward: ten minutes after {thing}, how do you feel? Tomorrow morning? Only sign trades you’d sign twice.',
      },
      {
        overline: 'The identity',
        identity: {
          domain: 'Life',
          vision:
            'Free and clear — someone who feels the pull, watches it pass, and owns the evening.',
          antiVision:
            'Owned by the pull — a little weaker every time it wins. And it keeps winning.',
        },
        text: 'Every pull that passes through you unfed is a rep. This is who the reps build.',
      },
    ],
  },
  {
    id: 'sleep',
    noun: 'Bedtime',
    label: 'I don’t want to sleep',
    emoji: '🌙',
    color: colors.accent,
    fallback: 'it',
    steps: [
      {
        overline: 'Notice',
        text: 'Not wanting to sleep is usually wanting more day — a slice of time that feels like yours. That’s real. But you’re borrowing it from tomorrow-you, at interest.',
      },
      {
        overline: 'Dim',
        text: 'Lower the lights. After this, set the phone out of reach. Everything on that screen will still exist tomorrow — this night’s rest won’t.',
      },
      {
        overline: 'Breathe',
        breath: true,
        text: 'In for four, hold for a moment, out for eight. Every long exhale is one step down the staircase toward sleep.',
      },
      {
        overline: 'Soften',
        text: 'In bed, sweep from head to toe: unclench the jaw, drop the shoulders, let the legs go heavy. Soften whatever you find.',
      },
      {
        overline: 'Return',
        text: 'Rest isn’t lost time — tomorrow’s discipline is built tonight. Goodnight.',
      },
    ],
  },
];
