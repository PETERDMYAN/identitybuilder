// App-level types. The AppSync records are normalized into these shapes in
// lib/queries.ts (Amplify's nullable fields collapse to the defaults here).

export type Profile = {
  id: string;
  display_name: string | null;
  week_starts_on: number; // 1 = Monday, 0 = Sunday (JS getDay convention)
  reminders_enabled: boolean;
  morning_time: string; // 'HH:MM'
  evening_time: string; // 'HH:MM'
  inversion_nudges: boolean;
};

export type Domain = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  identity_statement: string;
  vision: string;
  anti_vision: string;
  sort_order: number;
  archived: boolean;
};

export type LifeGoal = {
  id: string;
  domain_id: string | null;
  title: string;
  done: boolean;
  sort_order: number;
};

/**
 * One thing you will do — or refuse to do — on one specific day.
 * Checking it off is a vote for the identity.
 */
export type DailyItem = {
  id: string;
  date: string; // 'YYYY-MM-DD'
  title: string;
  kind: 'do' | 'dont';
  domain_id: string | null;
  done: boolean;
  sort_order: number;
};

/** One completed urge flow — the pause got taken, so it gets counted. */
export type UrgeEvent = {
  id: string;
  date: string; // 'YYYY-MM-DD'
  urge_id: string; // matches lib/urges.ts ids
  note: string; // what the user named, if anything
  created_at: string | null; // ISO timestamp
};

export type DailyEntry = {
  id: string;
  date: string; // 'YYYY-MM-DD'
  committed_at: string | null;
  reflection: string;
  alignment: number | null; // 1..5
};

export type WeeklyReflection = {
  id: string;
  week_start: string; // 'YYYY-MM-DD'
  ratings: Record<string, number>; // domain_id -> 1..5
  evidence: string;
  wins: string;
  lessons: string;
  change_one: string;
};
