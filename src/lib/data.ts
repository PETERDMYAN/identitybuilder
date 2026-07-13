import { useMemo } from 'react';

import { useAuth } from './auth';
import { cloudData } from './cloud';
import { localData } from './local';
import { DailyEntry, DailyItem, Domain, LifeGoal, Profile, WeeklyReflection } from './types';

/**
 * One storage API, two homes for the journal:
 *  - signed out → `localData` (AsyncStorage, this phone only, no sync)
 *  - signed in  → `cloudData` (owner-scoped AppSync, synced across devices)
 * Signing in migrates the local journal up (lib/sync.ts) and the app switches
 * backends; hooks in lib/queries.ts stay identical either way.
 */
export type DataAPI = {
  getProfile(): Promise<Profile | null>;
  createProfile(fields: Omit<Partial<Profile>, 'id'>): Promise<Profile>;
  updateProfile(id: string, fields: Omit<Partial<Profile>, 'id'>): Promise<Profile>;

  listDomains(opts?: { includeArchived?: boolean }): Promise<Domain[]>;
  createDomain(
    fields: Omit<Partial<Domain>, 'id'> & { name: string; emoji: string; color: string },
  ): Promise<Domain>;
  updateDomain(id: string, fields: Omit<Partial<Domain>, 'id'>): Promise<void>;

  listGoals(): Promise<LifeGoal[]>;
  createGoal(fields: Omit<Partial<LifeGoal>, 'id'> & { title: string }): Promise<void>;
  updateGoal(id: string, fields: Omit<Partial<LifeGoal>, 'id'>): Promise<void>;
  deleteGoal(id: string): Promise<void>;

  /** `range` is inclusive on both ends ('YYYY-MM-DD'). */
  listItems(range?: { from: string; to: string }): Promise<DailyItem[]>;
  createItem(
    fields: Omit<Partial<DailyItem>, 'id'> & { date: string; title: string; kind: 'do' | 'dont' },
  ): Promise<DailyItem>;
  updateItem(id: string, fields: Omit<Partial<DailyItem>, 'id'>): Promise<void>;
  deleteItem(id: string): Promise<void>;

  listEntries(): Promise<DailyEntry[]>;
  getEntry(date: string): Promise<DailyEntry | null>;
  upsertEntry(date: string, patch: Omit<Partial<DailyEntry>, 'id' | 'date'>): Promise<DailyEntry>;

  listReflections(): Promise<WeeklyReflection[]>;
  getReflection(week: string): Promise<WeeklyReflection | null>;
  upsertReflection(
    week: string,
    patch: Omit<Partial<WeeklyReflection>, 'id' | 'week_start'>,
  ): Promise<WeeklyReflection>;
};

export const dataFor = (userId: string | null | undefined): DataAPI =>
  userId ? cloudData : localData;

/** The active backend for the current session. */
export function useData(): DataAPI {
  const { userId } = useAuth();
  return useMemo(() => dataFor(userId), [userId]);
}
