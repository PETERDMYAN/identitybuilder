import { cloudData } from './cloud';
import { clearLocalData, localSnapshot } from './local';

/**
 * Push everything on this phone into the signed-in account, then clear the
 * phone copy. Runs on sign-in (and again at cold start if a previous run was
 * interrupted). Idempotent: every write is guarded by a natural-key lookup —
 * domains by name, goals by title, items by (date, kind, title), entries by
 * date, reflections by week — so re-running never duplicates.
 *
 * Returns true when anything was migrated.
 */
export async function syncLocalToCloud(): Promise<boolean> {
  const snap = await localSnapshot();
  const empty =
    !snap.profile &&
    !snap.domains.length &&
    !snap.goals.length &&
    !snap.items.length &&
    !snap.urges.length &&
    !snap.entries.length &&
    !snap.reflections.length;
  if (empty) return false;

  // Domains first — everything else hangs off their ids.
  const cloudDomains = await cloudData.listDomains({ includeArchived: true });
  const domainIdMap = new Map<string, string>();
  for (const d of snap.domains) {
    const match = cloudDomains.find(
      (c) => c.name.trim().toLowerCase() === d.name.trim().toLowerCase(),
    );
    if (match) {
      domainIdMap.set(d.id, match.id);
      // The cloud copy wins, but blank prose fields inherit what was written here.
      const patch: Partial<Record<'identity_statement' | 'vision' | 'anti_vision', string>> = {};
      if (!match.identity_statement && d.identity_statement)
        patch.identity_statement = d.identity_statement;
      if (!match.vision && d.vision) patch.vision = d.vision;
      if (!match.anti_vision && d.anti_vision) patch.anti_vision = d.anti_vision;
      if (Object.keys(patch).length) await cloudData.updateDomain(match.id, patch);
    } else {
      const created = await cloudData.createDomain({
        name: d.name,
        emoji: d.emoji,
        color: d.color,
        identity_statement: d.identity_statement,
        vision: d.vision,
        anti_vision: d.anti_vision,
        sort_order: d.sort_order,
        archived: d.archived,
      });
      domainIdMap.set(d.id, created.id);
    }
  }
  const mapDomain = (id: string | null) => (id ? (domainIdMap.get(id) ?? null) : null);

  const [cloudGoals, cloudItems, cloudUrges, cloudEntries, cloudReflections, cloudProfile] =
    await Promise.all([
      cloudData.listGoals(),
      cloudData.listItems(),
      cloudData.listUrgeEvents(),
      cloudData.listEntries(),
      cloudData.listReflections(),
      cloudData.getProfile(),
    ]);

  for (const g of snap.goals) {
    if (!cloudGoals.some((c) => c.title === g.title)) {
      await cloudData.createGoal({
        title: g.title,
        domain_id: mapDomain(g.domain_id),
        done: g.done,
        sort_order: g.sort_order,
      });
    }
  }

  for (const i of snap.items) {
    if (!cloudItems.some((c) => c.date === i.date && c.kind === i.kind && c.title === i.title)) {
      await cloudData.createItem({
        date: i.date,
        title: i.title,
        kind: i.kind,
        domain_id: mapDomain(i.domain_id),
        done: i.done,
        sort_order: i.sort_order,
      });
    }
  }

  for (const u of snap.urges) {
    const dup = cloudUrges.some(
      (c) => c.date === u.date && c.urge_id === u.urge_id && c.created_at === u.created_at,
    );
    if (!dup) {
      await cloudData.createUrgeEvent({
        date: u.date,
        urge_id: u.urge_id,
        note: u.note,
        created_at: u.created_at,
      });
    }
  }

  for (const e of snap.entries) {
    if (!cloudEntries.some((c) => c.date === e.date)) {
      await cloudData.upsertEntry(e.date, {
        committed_at: e.committed_at,
        reflection: e.reflection,
        alignment: e.alignment,
      });
    }
  }

  for (const r of snap.reflections) {
    if (!cloudReflections.some((c) => c.week_start === r.week_start)) {
      const ratings = Object.fromEntries(
        Object.entries(r.ratings).map(([id, v]) => [domainIdMap.get(id) ?? id, v]),
      );
      await cloudData.upsertReflection(r.week_start, {
        ratings,
        evidence: r.evidence,
        wins: r.wins,
        lessons: r.lessons,
        change_one: r.change_one,
      });
    }
  }

  if (!cloudProfile) {
    if (snap.profile) {
      const { id: _ignored, ...fields } = snap.profile;
      await cloudData.createProfile(fields);
    }
  } else if (!cloudProfile.display_name && snap.profile?.display_name) {
    await cloudData.updateProfile(cloudProfile.id, { display_name: snap.profile.display_name });
  }

  await clearLocalData();
  return true;
}
