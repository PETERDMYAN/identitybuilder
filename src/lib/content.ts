import { colors } from './theme';

/**
 * The three compounding accounts of a life, seeded silently on first launch.
 * Identity, vision and anti-vision start empty — written in Compass whenever
 * the user is ready.
 */
export const DEFAULT_DOMAINS = [
  { key: 'health', name: 'Health', emoji: '🫀', color: colors.health },
  { key: 'knowledge', name: 'Knowledge', emoji: '📚', color: colors.knowledge },
  { key: 'relationships', name: 'Relationships', emoji: '🤝', color: colors.relationships },
];

/** Tap-to-add ideas shown when today's "I will" list is empty. */
export const DO_SUGGESTIONS = ['Move 30 minutes', 'Read 20 pages', 'Call someone I love'];

/** Tap-to-add ideas shown when today's "I won't" list is empty. */
export const DONT_SUGGESTIONS = ['No doomscrolling', 'No sugar today', 'No complaining'];

/** Rotating one-liners under the daily commit button (identity > outcomes). */
export const COMMIT_LINES = [
  'You do not rise to your goals. You fall to your systems.',
  'Every action is a vote for the person you are becoming.',
  'Small things compound. That is the whole trick.',
  'Show up as them today, and you are them today.',
];

/** Gentle inversion nudges. Shown sparingly — the cliff, not a whip. */
export const INVERSION_PREFIX = 'Skipped days compound too — toward:';
