import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { computeGrowth, Growth } from './compound';
import { DataAPI, useData } from './data';
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

const sortItems = (items: DailyItem[]) =>
  [...items].sort((a, b) => a.sort_order - b.sort_order || a.title.localeCompare(b.title));

// ---------- profile ----------

export function useProfile() {
  const data = useData();
  return useQuery({
    queryKey: qk.profile,
    queryFn: (): Promise<Profile | null> => data.getProfile(),
  });
}

export function useUpsertProfile() {
  const data = useData();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<Profile>) => {
      const { id: _ignored, ...fields } = patch;
      const existing = qc.getQueryData<Profile | null>(qk.profile);
      return existing?.id ? data.updateProfile(existing.id, fields) : data.createProfile(fields);
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
  const data = useData();
  return useQuery({
    queryKey: qk.domains,
    queryFn: async (): Promise<Domain[]> =>
      (await data.listDomains()).sort((a, b) => a.sort_order - b.sort_order),
  });
}

export function useUpdateDomain() {
  const data = useData();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Domain> }) => {
      const { id: _ignored, ...fields } = patch;
      await data.updateDomain(id, fields);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.domains });
      qc.invalidateQueries({ queryKey: qk.growth });
    },
  });
}

// ---------- life goals ----------

export function useGoals() {
  const data = useData();
  return useQuery({
    queryKey: qk.goals,
    queryFn: async (): Promise<LifeGoal[]> =>
      (await data.listGoals()).sort((a, b) => a.sort_order - b.sort_order),
  });
}

export function useAddGoal() {
  const data = useData();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ title, domainId }: { title: string; domainId: string | null }) => {
      await data.createGoal({
        title,
        domain_id: domainId,
        sort_order: Date.now() % 1000000,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.goals }),
  });
}

export function useSetGoal() {
  const data = useData();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<LifeGoal> }) => {
      const { id: _ignored, ...fields } = patch;
      await data.updateGoal(id, fields);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.goals }),
  });
}

export function useDeleteGoal() {
  const data = useData();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => data.deleteGoal(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.goals }),
  });
}

// ---------- daily items (the core loop) ----------

export function useDailyItems(date: DateStr) {
  const data = useData();
  return useQuery({
    queryKey: qk.items(date),
    queryFn: async (): Promise<DailyItem[]> =>
      sortItems(await data.listItems({ from: date, to: date })),
  });
}

export function useWeekItems(week: DateStr) {
  const data = useData();
  return useQuery({
    queryKey: qk.weekItems(week),
    queryFn: async (): Promise<DailyItem[]> =>
      sortItems(await data.listItems({ from: week, to: addDaysStr(week, 6) })),
  });
}

export function useAddDailyItem() {
  const data = useData();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      date: DateStr;
      week: DateStr;
      title: string;
      kind: 'do' | 'dont';
      domainId: string | null;
    }) => {
      return data.createItem({
        date: input.date,
        title: input.title,
        kind: input.kind,
        domain_id: input.domainId,
        done: false,
        sort_order: Date.now() % 1000000,
      });
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
  const data = useData();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { item: DailyItem; week: DateStr }) => {
      await data.updateItem(input.item.id, { done: !input.item.done });
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
  const data = useData();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; date: DateStr; week: DateStr }) => {
      await data.deleteItem(id);
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
  const data = useData();
  return useQuery({
    queryKey: qk.entry(date),
    queryFn: (): Promise<DailyEntry | null> => data.getEntry(date),
  });
}

export function useUpsertDailyEntry() {
  const data = useData();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ date, patch }: { date: DateStr; patch: Partial<DailyEntry> }) => {
      const { id: _ignored, date: _date, ...fields } = patch;
      return data.upsertEntry(date, fields);
    },
    onSuccess: (entry) => qc.setQueryData(qk.entry(entry.date), entry),
  });
}

// ---------- weekly reflections ----------

export function useWeeklyReflection(week: DateStr) {
  const data = useData();
  return useQuery({
    queryKey: qk.reflection(week),
    queryFn: (): Promise<WeeklyReflection | null> => data.getReflection(week),
  });
}

export function useUpsertWeeklyReflection() {
  const data = useData();
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
      return data.upsertReflection(week, fields);
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
  const data = useData();
  const { data: domains } = useDomains();
  const weekStartsOn = useWeekStartsOn();
  return useQuery({
    queryKey: qk.growth,
    enabled: !!domains,
    queryFn: async (): Promise<GrowthBundle> => {
      const [items, entries] = await Promise.all([data.listItems(), data.listEntries()]);
      return {
        growth: computeGrowth(domains ?? [], items, todayStr(), weekStartsOn),
        items,
        entriesByDate: new Map(entries.map((e) => [e.date, e] as const)),
      };
    },
  });
}

// ---------- data export ----------

export async function fetchAllDataAsJson(api: DataAPI): Promise<string> {
  const [profile, domains, goals, items, entries, reflections] = await Promise.all([
    api.getProfile(),
    api.listDomains({ includeArchived: true }),
    api.listGoals(),
    api.listItems(),
    api.listEntries(),
    api.listReflections(),
  ]);
  return JSON.stringify(
    {
      exported_at: new Date().toISOString(),
      profiles: profile ? [profile] : [],
      domains,
      life_goals: goals,
      daily_items: items,
      daily_entries: entries,
      weekly_reflections: reflections,
    },
    null,
    2,
  );
}
