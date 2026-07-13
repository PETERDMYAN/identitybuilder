import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Switch, View } from 'react-native';

import {
  Body,
  Button,
  Card,
  Chip,
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
import { signOut } from 'aws-amplify/auth';

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
      const json = await fetchAllDataAsJson();
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
      <Spacer h={2} />
      <Button
        label="Sign out"
        kind="danger"
        onPress={() =>
          Alert.alert('Sign out?', 'Your data stays safe in your AWS backend.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign out', style: 'destructive', onPress: () => signOut() },
          ])
        }
      />
      <Spacer h={4} />
      <Sub style={{ textAlign: 'center' }}>
        Identity Compound · your data lives in your own AWS account.
      </Sub>
    </Screen>
  );
}
