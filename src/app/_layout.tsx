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
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef } from 'react';

import { LoadingScreen } from '@/components/ui';
import { useAuth, SessionProvider } from '@/lib/auth';
import { rescheduleReminders } from '@/lib/notifications';
import { qk, useProfile } from '@/lib/queries';
import { bootstrapAccount } from '@/lib/setup';
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
 * Routes by session: signed out → sign-in; otherwise straight into the app.
 * First sign-in bootstraps the profile and default accounts silently —
 * there is no onboarding.
 */
function Gate() {
  const { userId, loading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const segments = useSegments();
  const router = useRouter();
  const qc = useQueryClient();
  const bootstrapping = useRef(false);

  useEffect(() => {
    if (!userId || profileLoading || profile || bootstrapping.current) return;
    bootstrapping.current = true;
    bootstrapAccount()
      .then((p) => {
        qc.setQueryData(qk.profile, p);
        qc.invalidateQueries({ queryKey: qk.domains });
      })
      .catch(() => {
        bootstrapping.current = false; // retry on next render
      });
  }, [userId, profileLoading, profile, qc]);

  useEffect(() => {
    if (loading) return;
    const inSignIn = (segments[0] as string | undefined) === 'sign-in';
    if (!userId) {
      if (!inSignIn) router.replace('/sign-in');
    } else if (inSignIn) {
      router.replace('/');
    }
  }, [userId, loading, segments, router]);

  // Keep local reminders in sync with saved settings.
  useEffect(() => {
    if (profile?.reminders_enabled) rescheduleReminders(profile);
  }, [profile?.reminders_enabled, profile?.morning_time, profile?.evening_time]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading || (userId && !profile)) return <LoadingScreen />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="reflect-weekly" options={{ presentation: 'modal' }} />
      <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
      <Stack.Screen name="urge/[id]" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
