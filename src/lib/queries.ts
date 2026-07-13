import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { db, listAll, must } from './amplify';
import { useAuth } from './auth';
import { computeGrowth, Growth } from './compound';
import { DateStr, addDaysStr, todayStr, weekStartOf } from './dates';
import {
  DailyEntry,
  DailyItem,
  Domain,
  LifeGoal,
  Profile,
  WeeklyReflection,
} from './types';

export const qk = {
  profile: ['profile'] as const,
  domains: ['domains'] as const,
  goals: ['goals'] as const,
  items: (date: string) => ['items', date] as const,
  weekItems: (week: string) => ['weekItems', week] as const,
  entry: (date: string) => ['entry', date] as const,
  reflection: (week: string) => ['reflection', week] as const,
  growth: ['growth'] as const,
};

// ---------- normalizers: AppSync records (nullable fields) → app types ----------

/* eslint-disable @typescript-eslint/no-explicit-any */
export const nProfile = (r: any): Profile => ({
  id: r.id,
  display_name: r.display_name ?? null,
  week_starts_on: r.week_starts_on ?? 1,
  reminders_enabled: r.reminders_enabled ?? false,
  morning_time: r.morning_time ?? '08:00',
  evening_time: r.evening_time ?? '21:30',
  inversion_nudges: r.inversion_nudges ?? true,
});
const nDomain = (r: any): Domain => ({
  id: r.id,
  name: r.name,
  emoji: r.emoji ?? '✦',
  color: r.color ?? '#AF89F4',
  identity_statement: r.identity_statement ?? '',
  vision: r.vision ?? '',
  anti_vision: r.anti_vision ?? '',
  sort_order: r.sort_order ?? 0,
  archived: r.archived ?? false,
});
const nGoal = (r: any): LifeGoal => ({
  id: r.id,
  domain_id: r.domain_id ?? null,
  title: r.title,
  done: r.done ?? false,
  sort_order: r.sort_order ?? 0,
});
const nItem = (r: any): DailyItem => ({
  id: r.id,
  date: r.date,
  title: r.title,
  kind: r.kind === 'dont' ? 'dont' : 'do',
  domain_id: r.domain_id ?? null,
  done: r.done ?? false,
  sort_order: r.sort_order ?? 0,
});
const nEntry = (r: any): DailyEntry => ({
  id: r.id,
  date: r.date,
  committed_at: r.committed_at ?? null,
  reflection: r.reflection ?? '',
  alignment: r.alignment ?? null,
});
const nReflection = (r: any): WeeklyReflection => ({
  id: r.id,
  week_start: r.week_start,
  ratings:
    typeof r.ratings === 'string'
      ? (JSON.parse(r.ratings) as Record<string, number>)
      : ((r.ratings as Record<string, number>) ?? {}),
  evidence: r.evidence ?? '',
  wins: r.wins ?? '',
  lessons: r.lessons ?? '',
  change_one: r.change_one ?? '',
});
/* eslint-enable @typescript-eslint/no-explicit-any */

const sortItems = (items: DailyItem[]) =>
  [...items].sort((a, b) => a.sort_order - b.sort_order || a.title.localeCompare(b.title));

// ---------- profile ----------

export function useProfile() {
  const { userId } = useAuth();
  return useQuery({
    queryKey: qk.profile,
    enabled: !!userId,
    queryFn: async (): Promise<Profile | null> => {
      const rows = await listAll((o) => db().models.Profile.list(o));
      return rows.length ? nProfile(rows[0]) : null;
    },
  });
}

export function useUpsertProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<Profile>) => {
      const { id: _ignored, ...fields } = patch;
      const existing = qc.getQueryData<Profile | null>(qk.profile);
      const res = existing?.id
        ? await db().models.Profile.update({ id: existing.id, ...fields })
        : await db().models.Profile.create(fields);
      return nProfile(must(res));
    },
    onSuccess: (p) => {
      qc.setQueryData(qk.profile, p);
      qc.invalidateQueries({ queryKey: qk.growth });
    },
  });
}

/** Week start day from the profile (defaults to Monday before the profile loads). */
export function useWeekStartsOn(): 0 | 1 {
  const { data: profile } = useProfile();
  return profile?.week_starts_on === 0 ? 0 : 1;
}

export function useCurrentWeekStart(): DateStr {
  return weekStartOf(todayStr(), useWeekStartsOn());
}

// ---------- domains ----------

export function useDomains() {
  const { userId } = useAuth();
  return useQuery({
    queryKey: qk.domains,
    enabled: !!userId,
    queryFn: async (): Promise<Domain[]> => {
      const rows = await listAll((o) => db().models.Domain.list(o), {
        archived: { ne: true },
      });
      return rows.map(nDomain).sort((a, b) => a.sort_order - b.sort_order);
    },
  });
}

export function useUpdateDomain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Domain> }) => {
      const { id: _ignored, ...fields } = patch;
      must(await db().models.Domain.update({ id, ...fields }));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.domains });
      qc.invalidateQueries({ queryKey: qk.growth });
    },
  });
}

// ---------- life goals ----------

export function useGoals() {
  const { userId } = useAuth();
  return useQuery({
    queryKey: qk.goals,
    enabled: !!userId,
    queryFn: async (): Promise<LifeGoal[]> => {
      const rows = await listAll((o) => db().models.LifeGoal.list(o));
      return rows.map(nGoal).sort((a, b) => a.sort_order - b.sort_order);
    },
  });
}

export function useAddGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ title, domainId }: { title: string; domainId: string | null }) => {
      must(
        await db().models.LifeGoal.create({
          title,
          ...(domainId ? { domain_id: domainId } : {}),
          sort_order: Date.now() % 1000000,
        }),
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.goals }),
  });
}

export function useSetGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<LifeGoal> }) => {
      const { id: _ignored, ...fields } = patch;
      must(await db().models.LifeGoal.update({ id, ...fields }));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.goals }),
  });
}

export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      must(await db().models.LifeGoal.delete({ id }));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.goals }),
  });
}

// ---------- daily items (the core loop) ----------

export function useDailyItems(date: DateStr) {
  const { userId } = useAuth();
  return useQuery({
    queryKey: qk.items(date),
    enabled: !!userId,
    queryFn: async (): Promise<DailyItem[]> => {
      const rows = await listAll((o) => db().models.DailyItem.list(o), { date: { eq: date } });
      return sortItems(rows.map(nItem));
    },
  });
}

export function useWeekItems(week: DateStr) {
  const { userId } = useAuth();
  return useQuery({
    queryKey: qk.weekItems(week),
    enabled: !!userId,
    queryFn: async (): Promise<DailyItem[]> => {
      const rows = await listAll((o) => db().models.DailyItem.list(o), {
        date: { between: [week, addDaysStr(week, 6)] },
      });
      return sortItems(rows.map(nItem));
    },
  });
}

export function useAddDailyItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      date: DateStr;
      week: DateStr;
      title: string;
      kind: 'do' | 'dont';
      domainId: string | null;
    }) => {
      const res = await db().models.DailyItem.create({
        date: input.date,
        title: input.title,
        kind: input.kind,
        ...(input.domainId ? { domain_id: input.domainId } : {}),
        done: false,
        sort_order: Date.now() % 1000000,
      });
      return nItem(must(res));
    },
    onSuccess: (_r, v) => {
      qc.invalidateQueries({ queryKey: qk.items(v.date) });
      qc.invalidateQueries({ queryKey: qk.weekItems(v.week) });
      qc.invalidateQueries({ queryKey: qk.growth });
    },
  });
}

/** Toggle kept/not-kept, optimistically so the check-in feels instant. */
export function useToggleDailyItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { item: DailyItem; week: DateStr }) => {
      must(await db().models.DailyItem.update({ id: input.item.id, done: !input.item.done }));
    },
    onMutate: async ({ item }) => {
      const key = qk.items(item.date);
      await qc.cancelQueries({ queryKey: key });
      const before = qc.getQueryData<DailyItem[]>(key);
      qc.setQueryData<DailyItem[]>(key, (old = []) =>
        old.map((i) => (i.id === item.id ? { ...i, done: !i.done } : i)),
      );
      return { before, key };
    },
    onError: (_e, _v, ctx) => {
      if (ctx) qc.setQueryData(ctx.key, ctx.before);
    },
    onSettled: (_r, _e, v) => {
      qc.invalidateQueries({ queryKey: qk.items(v.item.date) });
      qc.invalidateQueries({ queryKey: qk.weekItems(v.week) });
      qc.invalidateQueries({ queryKey: qk.growth });
    },
  });
}

export function useDeleteDailyItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; date: DateStr; week: DateStr }) => {
      must(await db().models.DailyItem.delete({ id }));
    },
    onSuccess: (_r, v) => {
      qc.invalidateQueries({ queryKey: qk.items(v.date) });
      qc.invalidateQueries({ queryKey: qk.weekItems(v.week) });
      qc.invalidateQueries({ queryKey: qk.growth });
    },
  });
}

// ---------- daily entries ----------

export function useDailyEntry(date: DateStr) {
  const { userId } = useAuth();
  return useQuery({
    queryKey: qk.entry(date),
    enabled: !!userId,
    queryFn: async (): Promise<DailyEntry | null> => {
      const rows = await listAll((o) => db().models.DailyEntry.list(o), { date: { eq: date } });
      return rows.length ? nEntry(rows[0]) : null;
    },
  });
}

export function useUpsertDailyEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ date, patch }: { date: DateStr; patch: Partial<DailyEntry> }) => {
      const { id: _ignored, ...fields } = patch;
      const rows = await listAll((o) => db().models.DailyEntry.list(o), { date: { eq: date } });
      const res = rows.length
        ? await db().models.DailyEntry.update({ id: (rows[0] as { id: string }).id, ...fields })
        : await db().models.DailyEntry.create({ date, ...fields });
      return nEntry(must(res));
    },
    onSuccess: (entry) => qc.setQueryData(qk.entry(entry.date), entry),
  });
}

// ---------- weekly reflections ----------

export function useWeeklyReflection(week: DateStr) {
  const { userId } = useAuth();
  return useQuery({
    queryKey: qk.reflection(week),
    enabled: !!userId,
    queryFn: async (): Promise<WeeklyReflection | null> => {
      const rows = await listAll((o) => db().models.WeeklyReflection.list(o), {
        week_start: { eq: week },
      });
      return rows.length ? nReflection(rows[0]) : null;
    },
  });
}

export function useUpsertWeeklyReflection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      week,
      patch,
    }: {
      week: DateStr;
      patch: Partial<WeeklyReflection>;
    }) => {
      const { id: _ignored, week_start: _w, ...fields } = patch;
      const rows = await listAll((o) => db().models.WeeklyReflection.list(o), {
        week_start: { eq: week },
      });
      const res = rows.length
        ? await db().models.WeeklyReflection.update({
            id: (rows[0] as { id: string }).id,
            ...fields,
          })
        : await db().models.WeeklyReflection.create({ week_start: week, ...fields });
      return nReflection(must(res));
    },
    onSuccess: (r) => qc.setQueryData(qk.reflection(r.week_start), r),
  });
}

// ---------- growth (everything, for the compounding chart) ----------

export type GrowthBundle = {
  growth: Growth;
  items: DailyItem[];
  entriesByDate: Map<string, DailyEntry>;
};

export function useGrowthBundle() {
  const { userId } = useAuth();
  const { data: domains } = useDomains();
  const weekStartsOn = useWeekStartsOn();
  return useQuery({
    queryKey: qk.growth,
    enabled: !!userId && !!domains,
    queryFn: async (): Promise<GrowthBundle> => {
      const [itemRows, entryRows] = await Promise.all([
        listAll((o) => db().models.DailyItem.list(o)),
        listAll((o) => db().models.DailyEntry.list(o)),
      ]);
      const items = itemRows.map(nItem);
      const entries = entryRows.map(nEntry);
      return {
        growth: computeGrowth(domains ?? [], items, todayStr(), weekStartsOn),
        items,
        entriesByDate: new Map(entries.map((e) => [e.date, e] as const)),
      };
    },
  });
}

// ---------- data export ----------

export async function fetchAllDataAsJson(): Promise<string> {
  const [profiles, domains, goals, items, entries, reflections] = await Promise.all([
    listAll((o) => db().models.Profile.list(o)),
    listAll((o) => db().models.Domain.list(o)),
    listAll((o) => db().models.LifeGoal.list(o)),
    listAll((o) => db().models.DailyItem.list(o)),
    listAll((o) => db().models.DailyEntry.list(o)),
    listAll((o) => db().models.WeeklyReflection.list(o)),
  ]);
  return JSON.stringify(
    {
      exported_at: new Date().toISOString(),
      profiles: profiles.map(nProfile),
      domains: domains.map(nDomain),
      life_goals: goals.map(nGoal),
      daily_items: items.map(nItem),
      daily_entries: entries.map(nEntry),
      weekly_reflections: reflections.map(nReflection),
    },
    null,
    2,
  );
}
