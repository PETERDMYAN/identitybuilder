import { DataAPI } from './data';
import { DEFAULT_DOMAINS } from './content';
import { Profile } from './types';

/**
 * First-launch bootstrap, same for both backends: silently create the profile
 * and the three default accounts (Health, Knowledge, Relationships) with empty
 * identity statements — no wizard. Who you are gets written in Compass
 * whenever you're ready.
 */
export async function bootstrapAccount(api: DataAPI): Promise<Profile> {
  const existingDomains = await api.listDomains({ includeArchived: true });
  if (existingDomains.length === 0) {
    for (let i = 0; i < DEFAULT_DOMAINS.length; i++) {
      const d = DEFAULT_DOMAINS[i];
      await api.createDomain({
        name: d.name,
        emoji: d.emoji,
        color: d.color,
        identity_statement: '',
        vision: '',
        anti_vision: '',
        sort_order: i,
      });
    }
  }

  const profile = await api.getProfile();
  if (profile) return profile;
  return api.createProfile({
    week_starts_on: 1,
    reminders_enabled: false,
    morning_time: '08:00',
    evening_time: '21:30',
    inversion_nudges: true,
  });
}
