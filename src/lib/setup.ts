import { db, listAll, must } from './amplify';
import { DEFAULT_DOMAINS } from './content';
import { nProfile } from './queries';
import { Profile } from './types';

/**
 * First sign-in bootstrap: silently create the profile and the three default
 * accounts (Health, Knowledge, Relationships) with empty identity statements —
 * no wizard. Who you are gets written in Compass whenever you're ready.
 */
export async function bootstrapAccount(): Promise<Profile> {
  const existingDomains = await listAll((o) => db().models.Domain.list(o));
  if (existingDomains.length === 0) {
    for (let i = 0; i < DEFAULT_DOMAINS.length; i++) {
      const d = DEFAULT_DOMAINS[i];
      must(
        await db().models.Domain.create({
          name: d.name,
          emoji: d.emoji,
          color: d.color,
          identity_statement: '',
          vision: '',
          anti_vision: '',
          sort_order: i,
        }),
      );
    }
  }

  const profiles = await listAll((o) => db().models.Profile.list(o));
  if (profiles.length) return nProfile(profiles[0]);
  const profile = must(
    await db().models.Profile.create({
      week_starts_on: 1,
      reminders_enabled: false,
      morning_time: '08:00',
      evening_time: '21:30',
      inversion_nudges: true,
    }),
  );
  return nProfile(profile);
}
