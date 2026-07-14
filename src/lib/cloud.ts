import { db, listAll, must } from './amplify';
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
 * The signed-in backend: owner-scoped AppSync models. Normalizers collapse
 * AppSync's nullable fields into the app types' defaults.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
const nProfile = (r: any): Profile => ({
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
const nUrge = (r: any): UrgeEvent => ({
  id: r.id,
  date: r.date,
  urge_id: r.urge_id,
  note: r.note ?? '',
  created_at: r.created_at ?? null,
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

/** Omit undefined/null-only-optional keys so AppSync create inputs stay clean. */
const withoutNullish = <T extends Record<string, unknown>>(o: T) =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== null));

export const cloudData: DataAPI = {
  async getProfile() {
    const rows = await listAll((o) => db().models.Profile.list(o));
    return rows.length ? nProfile(rows[0]) : null;
  },
  async createProfile(fields) {
    return nProfile(must(await db().models.Profile.create(fields)));
  },
  async updateProfile(id, fields) {
    return nProfile(must(await db().models.Profile.update({ id, ...fields })));
  },

  async listDomains(opts) {
    const rows = await listAll(
      (o) => db().models.Domain.list(o),
      opts?.includeArchived ? undefined : { archived: { ne: true } },
    );
    return rows.map(nDomain);
  },
  async createDomain(fields) {
    return nDomain(must(await db().models.Domain.create(fields)));
  },
  async updateDomain(id, fields) {
    must(await db().models.Domain.update({ id, ...fields }));
  },

  async listGoals() {
    const rows = await listAll((o) => db().models.LifeGoal.list(o));
    return rows.map(nGoal);
  },
  async createGoal(fields) {
    const { domain_id, ...rest } = fields;
    must(
      await db().models.LifeGoal.create({
        ...rest,
        ...withoutNullish({ domain_id }),
      }),
    );
  },
  async updateGoal(id, fields) {
    must(await db().models.LifeGoal.update({ id, ...fields }));
  },
  async deleteGoal(id) {
    must(await db().models.LifeGoal.delete({ id }));
  },

  async listItems(range) {
    const filter = !range
      ? undefined
      : range.from === range.to
        ? { date: { eq: range.from } }
        : { date: { between: [range.from, range.to] } };
    const rows = await listAll((o) => db().models.DailyItem.list(o), filter);
    return rows.map(nItem);
  },
  async createItem(fields) {
    const { domain_id, ...rest } = fields;
    return nItem(
      must(
        await db().models.DailyItem.create({
          ...rest,
          ...withoutNullish({ domain_id }),
        }),
      ),
    );
  },
  async updateItem(id, fields) {
    must(await db().models.DailyItem.update({ id, ...fields }));
  },
  async deleteItem(id) {
    must(await db().models.DailyItem.delete({ id }));
  },

  async listUrgeEvents(range) {
    const filter = !range
      ? undefined
      : range.from === range.to
        ? { date: { eq: range.from } }
        : { date: { between: [range.from, range.to] } };
    const rows = await listAll((o) => db().models.UrgeEvent.list(o), filter);
    return rows.map(nUrge);
  },
  async createUrgeEvent(fields) {
    const { note, created_at, ...rest } = fields;
    return nUrge(
      must(
        await db().models.UrgeEvent.create({
          ...rest,
          ...withoutNullish({ note, created_at }),
        }),
      ),
    );
  },

  async listEntries() {
    const rows = await listAll((o) => db().models.DailyEntry.list(o));
    return rows.map(nEntry);
  },
  async getEntry(date) {
    const rows = await listAll((o) => db().models.DailyEntry.list(o), { date: { eq: date } });
    return rows.length ? nEntry(rows[0]) : null;
  },
  async upsertEntry(date, patch) {
    const rows = await listAll((o) => db().models.DailyEntry.list(o), { date: { eq: date } });
    const res = rows.length
      ? await db().models.DailyEntry.update({ id: (rows[0] as { id: string }).id, ...patch })
      : await db().models.DailyEntry.create({ date, ...patch });
    return nEntry(must(res));
  },

  async listReflections() {
    const rows = await listAll((o) => db().models.WeeklyReflection.list(o));
    return rows.map(nReflection);
  },
  async getReflection(week) {
    const rows = await listAll((o) => db().models.WeeklyReflection.list(o), {
      week_start: { eq: week },
    });
    return rows.length ? nReflection(rows[0]) : null;
  },
  async upsertReflection(week, patch) {
    const rows = await listAll((o) => db().models.WeeklyReflection.list(o), {
      week_start: { eq: week },
    });
    const res = rows.length
      ? await db().models.WeeklyReflection.update({
          id: (rows[0] as { id: string }).id,
          ...patch,
        })
      : await db().models.WeeklyReflection.create({ week_start: week, ...patch });
    return nReflection(must(res));
  },
};
