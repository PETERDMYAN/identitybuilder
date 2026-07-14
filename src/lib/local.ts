import 'react-native-get-random-values';

import AsyncStorage from '@react-native-async-storage/async-storage';

import type { DataAPI } from './data';
import {
  DailyEntry,
  DailyItem,
  Domain,
  LifeGoal,
  Profile,
  UrgeEvent,
  WeeklyReflection,
} from './types';

/**
 * The signed-out backend: the whole journal as six JSON collections in
 * AsyncStorage. Nothing leaves the phone. Signing in hands everything to
 * lib/sync.ts, which pushes it into the account and clears these keys.
 */
const K = {
  profile: 'ic.local.profile',
  domains: 'ic.local.domains',
  goals: 'ic.local.goals',
  items: 'ic.local.items',
  urges: 'ic.local.urges',
  entries: 'ic.local.entries',
  reflections: 'ic.local.reflections',
} as const;

function newId(): string {
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  b[6] = (b[6] & 0x0f) | 0x40; // uuid v4
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

async function read<T>(key: string): Promise<T[]> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

const write = (key: string, rows: unknown[]) => AsyncStorage.setItem(key, JSON.stringify(rows));

// Read-modify-write mutations run one at a time so quick taps can't clobber
// each other.
let queue: Promise<unknown> = Promise.resolve();
function locked<T>(fn: () => Promise<T>): Promise<T> {
  const p = queue.then(() => fn());
  queue = p.then(
    () => undefined,
    () => undefined,
  );
  return p;
}

function insert<T extends { id: string }>(key: string, row: T): Promise<T> {
  return locked(async () => {
    const rows = await read<T>(key);
    rows.push(row);
    await write(key, rows);
    return row;
  });
}

function update<T extends { id: string }>(key: string, id: string, fields: Partial<T>): Promise<T> {
  return locked(async () => {
    const rows = await read<T>(key);
    const idx = rows.findIndex((r) => r.id === id);
    if (idx < 0) throw new Error('Not found on this phone');
    rows[idx] = { ...rows[idx], ...fields, id };
    await write(key, rows);
    return rows[idx];
  });
}

function remove(key: string, id: string): Promise<void> {
  return locked(async () => {
    const rows = await read<{ id: string }>(key);
    await write(
      key,
      rows.filter((r) => r.id !== id),
    );
  });
}

export const localData: DataAPI = {
  async getProfile() {
    const rows = await read<Profile>(K.profile);
    return rows[0] ?? null;
  },
  createProfile(fields) {
    return insert<Profile>(K.profile, {
      id: newId(),
      display_name: fields.display_name ?? null,
      week_starts_on: fields.week_starts_on ?? 1,
      reminders_enabled: fields.reminders_enabled ?? false,
      morning_time: fields.morning_time ?? '08:00',
      evening_time: fields.evening_time ?? '21:30',
      inversion_nudges: fields.inversion_nudges ?? true,
    });
  },
  updateProfile(id, fields) {
    return update<Profile>(K.profile, id, fields);
  },

  async listDomains(opts) {
    const rows = await read<Domain>(K.domains);
    return opts?.includeArchived ? rows : rows.filter((d) => !d.archived);
  },
  createDomain(fields) {
    return insert<Domain>(K.domains, {
      id: newId(),
      name: fields.name,
      emoji: fields.emoji ?? '✦',
      color: fields.color ?? '#AF89F4',
      identity_statement: fields.identity_statement ?? '',
      vision: fields.vision ?? '',
      anti_vision: fields.anti_vision ?? '',
      sort_order: fields.sort_order ?? 0,
      archived: fields.archived ?? false,
    });
  },
  async updateDomain(id, fields) {
    await update<Domain>(K.domains, id, fields);
  },

  listGoals() {
    return read<LifeGoal>(K.goals);
  },
  async createGoal(fields) {
    await insert<LifeGoal>(K.goals, {
      id: newId(),
      title: fields.title,
      domain_id: fields.domain_id ?? null,
      done: fields.done ?? false,
      sort_order: fields.sort_order ?? 0,
    });
  },
  async updateGoal(id, fields) {
    await update<LifeGoal>(K.goals, id, fields);
  },
  deleteGoal(id) {
    return remove(K.goals, id);
  },

  async listItems(range) {
    const rows = await read<DailyItem>(K.items);
    return range ? rows.filter((i) => i.date >= range.from && i.date <= range.to) : rows;
  },
  createItem(fields) {
    return insert<DailyItem>(K.items, {
      id: newId(),
      date: fields.date,
      title: fields.title,
      kind: fields.kind,
      domain_id: fields.domain_id ?? null,
      done: fields.done ?? false,
      sort_order: fields.sort_order ?? 0,
    });
  },
  async updateItem(id, fields) {
    await update<DailyItem>(K.items, id, fields);
  },
  deleteItem(id) {
    return remove(K.items, id);
  },

  async listUrgeEvents(range) {
    const rows = await read<UrgeEvent>(K.urges);
    return range ? rows.filter((u) => u.date >= range.from && u.date <= range.to) : rows;
  },
  createUrgeEvent(fields) {
    return insert<UrgeEvent>(K.urges, {
      id: newId(),
      date: fields.date,
      urge_id: fields.urge_id,
      note: fields.note ?? '',
      created_at: fields.created_at ?? null,
    });
  },

  listEntries() {
    return read<DailyEntry>(K.entries);
  },
  async getEntry(date) {
    const rows = await read<DailyEntry>(K.entries);
    return rows.find((e) => e.date === date) ?? null;
  },
  upsertEntry(date, patch) {
    return locked(async () => {
      const rows = await read<DailyEntry>(K.entries);
      const idx = rows.findIndex((e) => e.date === date);
      let row: DailyEntry;
      if (idx >= 0) {
        row = { ...rows[idx], ...patch, id: rows[idx].id, date };
        rows[idx] = row;
      } else {
        row = {
          id: newId(),
          date,
          committed_at: patch.committed_at ?? null,
          reflection: patch.reflection ?? '',
          alignment: patch.alignment ?? null,
        };
        rows.push(row);
      }
      await write(K.entries, rows);
      return row;
    });
  },

  listReflections() {
    return read<WeeklyReflection>(K.reflections);
  },
  async getReflection(week) {
    const rows = await read<WeeklyReflection>(K.reflections);
    return rows.find((r) => r.week_start === week) ?? null;
  },
  upsertReflection(week, patch) {
    return locked(async () => {
      const rows = await read<WeeklyReflection>(K.reflections);
      const idx = rows.findIndex((r) => r.week_start === week);
      let row: WeeklyReflection;
      if (idx >= 0) {
        row = { ...rows[idx], ...patch, id: rows[idx].id, week_start: week };
        rows[idx] = row;
      } else {
        row = {
          id: newId(),
          week_start: week,
          ratings: patch.ratings ?? {},
          evidence: patch.evidence ?? '',
          wins: patch.wins ?? '',
          lessons: patch.lessons ?? '',
          change_one: patch.change_one ?? '',
        };
        rows.push(row);
      }
      await write(K.reflections, rows);
      return row;
    });
  },
};

// ---------- sync support ----------

export type LocalSnapshot = {
  profile: Profile | null;
  domains: Domain[];
  goals: LifeGoal[];
  items: DailyItem[];
  urges: UrgeEvent[];
  entries: DailyEntry[];
  reflections: WeeklyReflection[];
};

export async function localSnapshot(): Promise<LocalSnapshot> {
  const [profiles, domains, goals, items, urges, entries, reflections] = await Promise.all([
    read<Profile>(K.profile),
    read<Domain>(K.domains),
    read<LifeGoal>(K.goals),
    read<DailyItem>(K.items),
    read<UrgeEvent>(K.urges),
    read<DailyEntry>(K.entries),
    read<WeeklyReflection>(K.reflections),
  ]);
  return { profile: profiles[0] ?? null, domains, goals, items, urges, entries, reflections };
}

export function clearLocalData(): Promise<void> {
  return AsyncStorage.multiRemove(Object.values(K)).then(() => undefined);
}
