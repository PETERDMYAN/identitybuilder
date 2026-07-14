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
    // Peter's 4-step resolution: identify the acute mood → re-observe it as
    // raw sensation until it turns neutral → acknowledge and appreciate it
    // because it was chosen → the identity it serves.
    steps: [
      {
        overline: 'Identify',
        text: 'What exactly is here right now? Hunger, a mood, restlessness dressed as appetite? Point at the acute feeling and name it.',
      },
      {
        overline: 'Observe',
        breath: true,
        text: 'Drop the story and re-observe it as pure sensation — its place, its size, its texture. Watched closely, it breaks into small flickers, and the flickers turn neutral.',
      },
      {
        overline: 'Appreciate',
        text: 'Acknowledge it — it’s real. Then appreciate it: you chose this hunger, and it’s meaningful to you. Discomfort you chose is training, not suffering.',
      },
      {
        overline: 'The identity',
        identity: {
          domain: 'Health',
          vision:
            'Healthy, high-energy, vegetarian — 68 kg, 13% body fat. I chose it, it’s meaningful to me. That’s my advantage.',
          antiVision:
            'The drift: fed on every mood, low energy — and the heart disease in the pressure gets its opening.',
        },
        text: 'This is who the hunger works for. Chosen. Meaningful. Your advantage.',
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
