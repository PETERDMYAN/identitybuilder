import {
  Fraunces_400Regular_Italic,
  Fraunces_500Medium,
  Fraunces_600SemiBold,
} from '@expo-google-fonts/fraunces';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';

import { LoadingScreen } from '@/components/ui';
import { useAuth, SessionProvider } from '@/lib/auth';
import { dataFor } from '@/lib/data';
import { rescheduleReminders } from '@/lib/notifications';
import { qk, useProfile } from '@/lib/queries';
import { bootstrapAccount } from '@/lib/setup';
import { syncLocalToCloud } from '@/lib/sync';
import { colors } from '@/lib/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Fraunces_400Regular_Italic,
    Fraunces_500Medium,
    Fraunces_600SemiBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <StatusBar style="light" />
        <Gate />
      </SessionProvider>
    </QueryClientProvider>
  );
}

/**
 * No sign-in wall: the app opens straight into Today. Signed out, the journal
 * lives on this phone; signing in (from Settings) migrates it into the account
 * and keeps it synced. This component only manages the switch between those
 * two backends.
 */
function Gate() {
  const { userId, loading } = useAuth();
  const qc = useQueryClient();
  const [switching, setSwitching] = useState(false);
  const prev = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (loading) return;
    const p = prev.current;
    prev.current = userId;
    if (p === undefined) {
      // Cold start. If a previous sign-in sync was interrupted, quietly finish
      // moving the leftover local journal into the account.
      if (userId) {
        syncLocalToCloud()
          .then((moved) => {
            if (moved) qc.invalidateQueries();
          })
          .catch(() => {});
      }
      return;
    }
    if (p === userId) return;
    // Signed in or out. Migrate the phone journal up on sign-in, then start
    // the new mode with a clean cache either way.
    (async () => {
      setSwitching(true);
      try {
        if (userId) await syncLocalToCloud();
      } catch {
        // Local data stays put; the next cold start retries.
      }
      qc.clear();
      setSwitching(false);
    })();
  }, [userId, loading, qc]);

  if (loading || switching) return <LoadingScreen />;
  return <Ready key={userId ?? 'local'} />;
}

function Ready() {
  const { userId } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const qc = useQueryClient();
  const bootstrapping = useRef(false);

  // First launch in either mode: silently create the profile and default
  // accounts — there is no onboarding.
  useEffect(() => {
    if (profileLoading || profile || bootstrapping.current) return;
    bootstrapping.current = true;
    bootstrapAccount(dataFor(userId))
      .then((p) => {
        qc.setQueryData(qk.profile, p);
        qc.invalidateQueries({ queryKey: qk.domains });
      })
      .catch(() => {
        bootstrapping.current = false; // retry on next render
      });
  }, [userId, profileLoading, profile, qc]);

  // Keep local reminders in sync with saved settings.
  useEffect(() => {
    if (profile?.reminders_enabled) rescheduleReminders(profile);
  }, [profile?.reminders_enabled, profile?.morning_time, profile?.evening_time]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!profile) return <LoadingScreen />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="reflect-weekly" options={{ presentation: 'modal' }} />
      <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
      <Stack.Screen name="urge/[id]" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
