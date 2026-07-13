import { DateStr, addDaysStr, weekStartOf } from './dates';
import { DailyItem, Domain } from './types';

/**
 * The two-curves model.
 *
 * "1% better every day" for a year is ×37.8; 1% worse is ×0.03. We track at
 * weekly granularity: a week where every daily do/don't was kept multiplies
 * your score by 1.01^7, a fully-broken week by 0.99^7, partial weeks
 * interpolate. A week with nothing set holds flat — the drift penalty applies
 * to broken intentions, not to rest.
 */
export const DAILY_UP = 1.01;
export const DAILY_DOWN = 0.99;
export const WEEK_UP = Math.pow(DAILY_UP, 7); // ≈ 1.072
export const WEEK_DOWN = Math.pow(DAILY_DOWN, 7); // ≈ 0.932

export function weeklyFactor(ratio: number | null): number {
  if (ratio == null) return 1;
  const r = Math.min(1, Math.max(0, ratio));
  return WEEK_DOWN + (WEEK_UP - WEEK_DOWN) * r;
}

export type WeekPoint = {
  weekStart: DateStr;
  /** kept/set for the week; null = nothing set */
  ratio: number | null;
  /** cumulative compound score at the END of this week (starts at 1) */
  score: number;
};

export type DomainGrowth = {
  domain: Domain;
  points: WeekPoint[];
  score: number;
  /** total items kept for this identity, all time */
  kept: number;
};

export type Growth = {
  domains: DomainGrowth[];
  life: WeekPoint[];
  lifeScore: number;
  totalKept: number;
  /** consecutive days (ending today or yesterday) with at least one kept item */
  streak: number;
  weeksTracked: number;
  thisWeekKept: number;
  thisWeekTotal: number;
  /** projected multiplier after a year at the average pace so far */
  paceYear: number;
};

export function computeGrowth(
  domains: Domain[],
  items: DailyItem[],
  today: DateStr,
  weekStartsOn: 0 | 1,
): Growth {
  const currentWeek = weekStartOf(today, weekStartsOn);
  const firstWeek = items.length
    ? items.map((i) => weekStartOf(i.date, weekStartsOn)).sort()[0]
    : currentWeek;

  const weeks: DateStr[] = [];
  for (let w = firstWeek; w <= currentWeek && weeks.length < 530; w = addDaysStr(w, 7)) {
    weeks.push(w);
  }

  // Bucket items by week once.
  const byWeek = new Map<string, DailyItem[]>();
  const doneDates = new Set<string>();
  let totalKept = 0;
  for (const item of items) {
    const wk = weekStartOf(item.date, weekStartsOn);
    byWeek.set(wk, [...(byWeek.get(wk) ?? []), item]);
    if (item.done) {
      totalKept += 1;
      doneDates.add(item.date);
    }
  }

  const seriesFor = (filter: (i: DailyItem) => boolean): WeekPoint[] => {
    let score = 1;
    return weeks.map((wk) => {
      const weekItems = (byWeek.get(wk) ?? []).filter(filter);
      const ratio = weekItems.length
        ? weekItems.filter((i) => i.done).length / weekItems.length
        : null;
      score *= weeklyFactor(ratio);
      return { weekStart: wk, ratio, score };
    });
  };

  const domainGrowths: DomainGrowth[] = domains.map((domain) => {
    const points = seriesFor((i) => i.domain_id === domain.id);
    return {
      domain,
      points,
      score: points.length ? points[points.length - 1].score : 1,
      kept: items.filter((i) => i.domain_id === domain.id && i.done).length,
    };
  });

  const life = seriesFor(() => true);
  const lifeScore = life.length ? life[life.length - 1].score : 1;

  // Pace: geometric mean of the weekly factors actually earned (weeks with items).
  const factors = life.filter((p) => p.ratio != null).map((p) => weeklyFactor(p.ratio));
  const avgFactor = factors.length
    ? Math.exp(factors.reduce((a, f) => a + Math.log(f), 0) / factors.length)
    : 1;
  const paceYear = Math.pow(avgFactor, 52);

  // Streak of consecutive days with at least one kept item, ending today or yesterday.
  let streak = 0;
  let cursor: DateStr = doneDates.has(today) ? today : addDaysStr(today, -1);
  while (doneDates.has(cursor)) {
    streak += 1;
    cursor = addDaysStr(cursor, -1);
  }

  const thisWeekItems = byWeek.get(currentWeek) ?? [];

  return {
    domains: domainGrowths,
    life,
    lifeScore,
    totalKept,
    streak,
    weeksTracked: weeks.length,
    thisWeekKept: thisWeekItems.filter((i) => i.done).length,
    thisWeekTotal: thisWeekItems.length,
    paceYear,
  };
}

export const fmtMultiplier = (x: number): string =>
  `×${x >= 10 ? x.toFixed(0) : x >= 1.995 ? x.toFixed(1) : x.toFixed(2)}`;
