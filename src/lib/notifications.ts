import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { Profile } from './types';

// Note: in Expo Go, scheduled notifications are limited (especially on
// Android). They work fully in a development or production build.

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function ensureNotificationPermission(): Promise<boolean> {
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    if (!current.canAskAgain) return false;
    const req = await Notifications.requestPermissionsAsync();
    return req.granted;
  } catch {
    return false;
  }
}

function parseHHMM(s: string): { hour: number; minute: number } {
  const [h, m] = s.split(':').map((x) => parseInt(x, 10));
  return { hour: Number.isFinite(h) ? h : 8, minute: Number.isFinite(m) ? m : 0 };
}

/** JS getDay (0=Sun) → expo-notifications weekday (1=Sun..7=Sat). */
const toExpoWeekday = (jsDay: number) => (jsDay % 7) + 1;

/**
 * Recreate all scheduled reminders from the profile's settings.
 * Called after settings change and on app start.
 */
export async function rescheduleReminders(profile: Profile): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!profile.reminders_enabled) return;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('rituals', {
        name: 'Daily rituals',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
    const channel = Platform.OS === 'android' ? { channelId: 'rituals' } : {};

    const morning = parseHHMM(profile.morning_time);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Cast today’s votes',
        body: 'Who are you being today? Open your commitments and start the day on purpose.',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        ...morning,
        ...channel,
      },
    });

    const evening = parseHHMM(profile.evening_time);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Close the day',
        body: 'Check off what you kept and leave one honest line. Unmarked days count too.',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        ...evening,
        ...channel,
      },
    });

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Design the week',
        body: 'Your identities need evidence. Choose this week’s small commitments.',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: toExpoWeekday(profile.week_starts_on),
        hour: 9,
        minute: 0,
        ...channel,
      },
    });
  } catch {
    // Expo Go on Android cannot schedule — fail quietly, works in real builds.
  }
}
