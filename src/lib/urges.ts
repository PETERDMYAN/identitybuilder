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
    steps: [
      {
        overline: 'Notice',
        text: 'Pause. Where is this hunger — stomach, mouth, or mind? Real hunger sits low and grows slowly. Cravings spark high and shout.',
      },
      {
        overline: 'Breathe',
        breath: true,
        text: 'Take three slow breaths before anything else. An urge is a wave — it rises, crests, and passes whether you feed it or not.',
      },
      {
        overline: 'Ask',
        text: 'When did you last eat? Hours ago — honor it with a real meal, eaten slowly. Recently — this is likely a feeling asking to be fed.',
      },
      {
        overline: 'Choose',
        text: 'Drink a glass of water and wait ten minutes. If the hunger is still there, eat with attention and enjoy every bite.',
      },
      {
        overline: 'Return',
        text: 'You paused between urge and action. That pause is the skill — and a vote for the person you’re becoming.',
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
