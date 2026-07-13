import { signInWithRedirect, signOut } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import {
  Body,
  Button,
  Card,
  Chip,
  ErrorNote,
  Field,
  LoadingScreen,
  Overline,
  Row,
  Screen,
  Serif,
  Spacer,
  Sub,
  Tiny,
} from '@/components/ui';

import { useAuth } from '@/lib/auth';
import { dataFor } from '@/lib/data';
import { ensureNotificationPermission, rescheduleReminders } from '@/lib/notifications';
import { fetchAllDataAsJson, useProfile, useUpsertProfile } from '@/lib/queries';
import { colors, font, sp } from '@/lib/theme';
import { Profile } from '@/lib/types';

export default function SettingsScreen() {
  const { data: profile } = useProfile();
  if (!profile) return <LoadingScreen />;
  return <SettingsForm profile={profile} />;
}

function SettingsForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const { userId } = useAuth();
  const upsert = useUpsertProfile();
  const [name, setName] = useState(profile.display_name ?? '');
  const [exporting, setExporting] = useState(false);

  const save = async (patch: Partial<Profile>, reschedule = false) => {
    try {
      const next = await upsert.mutateAsync(patch);
      if (reschedule) await rescheduleReminders(next);
    } catch (e: any) {
      Alert.alert('Could not save', e?.message ?? 'Please try again.');
    }
  };

  const toggleReminders = async (on: boolean) => {
    if (on) {
      const ok = await ensureNotificationPermission();
      if (!ok) {
        Alert.alert(
          'Notifications are off',
          'Allow notifications for Identity Compound in system settings, then try again.',
        );
        return;
      }
    }
    await save({ reminders_enabled: on }, true);
  };

  const exportData = async () => {
    setExporting(true);
    try {
      const json = await fetchAllDataAsJson(dataFor(userId));
      await Clipboard.setStringAsync(json);
      Alert.alert('Copied', 'Your entire journal is on the clipboard as JSON. Paste it somewhere safe.');
    } catch (e: any) {
      Alert.alert('Export failed', e?.message ?? 'Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Screen topInset={false}>
      <Row between>
        <Serif>Settings</Serif>
        <Button label="Done" small onPress={() => router.back()} />
      </Row>
      <Spacer h={5} />

      <AccountCard />

      <Field
        label="Your name"
        value={name}
        onChangeText={setName}
        onEndEditing={() => save({ display_name: name.trim() || null })}
        placeholder="How the app greets you"
      />

      <Overline style={{ marginBottom: sp(2) }}>Week starts on</Overline>
      <Row gap={0}>
        <Chip
          label="Monday"
          selected={profile.week_starts_on === 1}
          onPress={() => save({ week_starts_on: 1 })}
        />
        <Chip
          label="Sunday"
          selected={profile.week_starts_on === 0}
          onPress={() => save({ week_starts_on: 0 })}
        />
      </Row>
      <Spacer h={4} />

      <Card>
        <Row between>
          <View style={{ flex: 1, marginRight: sp(3) }}>
            <Body style={{ fontFamily: font.sansSemi }}>Daily reminders</Body>
            <Tiny style={{ marginTop: sp(0.5) }}>
              Morning commit, evening close, weekly plan. Requires a development build for full
              support (limited in Expo Go).
            </Tiny>
          </View>
          <Switch
            value={profile.reminders_enabled}
            onValueChange={toggleReminders}
            trackColor={{ true: colors.accent, false: colors.border }}
            thumbColor="#fff"
          />
        </Row>
        {profile.reminders_enabled && (
          <View style={{ marginTop: sp(4) }}>
            <Tiny style={{ marginBottom: sp(2) }}>MORNING COMMIT</Tiny>
            <Row style={{ flexWrap: 'wrap' }}>
              {['06:30', '07:00', '07:30', '08:00', '09:00'].map((t) => (
                <Chip
                  key={t}
                  label={t}
                  small
                  selected={profile.morning_time === t}
                  onPress={() => save({ morning_time: t }, true)}
                />
              ))}
            </Row>
            <Tiny style={{ marginTop: sp(3), marginBottom: sp(2) }}>EVENING REFLECT</Tiny>
            <Row style={{ flexWrap: 'wrap' }}>
              {['20:30', '21:00', '21:30', '22:00', '22:30'].map((t) => (
                <Chip
                  key={t}
                  label={t}
                  small
                  selected={profile.evening_time === t}
                  onPress={() => save({ evening_time: t }, true)}
                />
              ))}
            </Row>
          </View>
        )}
      </Card>

      <Card>
        <Row between>
          <View style={{ flex: 1, marginRight: sp(3) }}>
            <Body style={{ fontFamily: font.sansSemi }}>Inversion nudges</Body>
            <Tiny style={{ marginTop: sp(0.5) }}>
              A quiet daily reminder of where skipped days lead.
            </Tiny>
          </View>
          <Switch
            value={profile.inversion_nudges}
            onValueChange={(v) => save({ inversion_nudges: v })}
            trackColor={{ true: colors.accent, false: colors.border }}
            thumbColor="#fff"
          />
        </Row>
      </Card>

      <Spacer h={2} />
      <Button label="Copy all data as JSON" kind="ghost" onPress={exportData} loading={exporting} />
      <Spacer h={4} />
      <Sub style={{ textAlign: 'center' }}>
        {userId
          ? 'Identity Compound · synced to your own AWS account.'
          : 'Identity Compound · your journal lives on this phone.'}
      </Sub>
    </Screen>
  );
}

/**
 * Sign-in is optional. Signed out, the journal is phone-local; signing in
 * with Apple migrates it into the user's own backend and keeps it synced.
 */
function AccountCard() {
  const { userId } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // signInWithRedirect resolves when the browser sheet opens; real failures
  // (cancelled, provider errors) arrive as Hub events.
  useEffect(() => {
    const unsubscribe = Hub.listen('auth', ({ payload }) => {
      if (payload.event === 'signInWithRedirect_failure') {
        setBusy(false);
        setError('Apple sign-in did not complete. Please try again.');
      }
      if (payload.event === 'signedIn') setBusy(false);
    });
    return unsubscribe;
  }, []);

  const signIn = async () => {
    setBusy(true);
    setError(null);
    try {
      await signInWithRedirect({ provider: 'Apple' });
      // The root layout migrates local data and switches backends on success.
    } catch (e: unknown) {
      setBusy(false);
      const msg = e instanceof Error ? e.message : 'Something went wrong.';
      // Re-tapping while a flow is pending is not an error worth showing.
      if (!/already.*in progress/i.test(msg)) setError(msg);
    }
  };

  if (userId) {
    return (
      <Card>
        <Body style={{ fontFamily: font.sansSemi }}>Syncing with Apple</Body>
        <Tiny style={{ marginTop: sp(0.5) }}>
          Your journal is backed up to your own AWS account and follows you across devices.
        </Tiny>
        <Spacer h={3} />
        <Button
          label="Sign out"
          kind="outline"
          onPress={() =>
            Alert.alert(
              'Sign out?',
              'Your journal stays safe in your account. This phone starts a fresh local journal that won’t sync.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Sign out', style: 'destructive', onPress: () => signOut() },
              ],
            )
          }
        />
      </Card>
    );
  }

  return (
    <Card>
      <Body style={{ fontFamily: font.sansSemi }}>This journal lives on this phone</Body>
      <Tiny style={{ marginTop: sp(0.5) }}>
        Sign in with Apple to sync it — everything here moves into your account the moment you do.
      </Tiny>
      <Spacer h={3} />
      <ErrorNote message={error} />
      <Pressable
        onPress={signIn}
        disabled={busy}
        style={({ pressed }) => [s.appleButton, (pressed || busy) && { opacity: 0.7 }]}
      >
        <Text style={s.appleLogo}>{Platform.OS === 'ios' ? '' : '🍎'}</Text>
        <Text style={s.appleLabel}>{busy ? 'Opening…' : 'Sign in with Apple'}</Text>
      </Pressable>
    </Card>
  );
}

const s = StyleSheet.create({
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: sp(3.25),
    gap: sp(2),
  },
  appleLogo: { fontSize: 17, color: '#000000', marginTop: -2 },
  appleLabel: { fontFamily: font.sansSemi, fontSize: 15.5, color: '#000000' },
});
