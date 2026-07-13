import { signInWithRedirect } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
import React, { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { ErrorNote, Screen, Sub, Tiny, Title } from '@/components/ui';
import { colors, font, sp } from '@/lib/theme';

export default function SignInScreen() {
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
      // The auth gate takes over once the redirect completes.
    } catch (e: unknown) {
      setBusy(false);
      const msg = e instanceof Error ? e.message : 'Something went wrong.';
      // Re-tapping while a flow is pending is not an error worth showing.
      if (!/already.*in progress/i.test(msg)) setError(msg);
    }
  };

  return (
    <Screen scroll={false}>
      <View style={s.hero}>
        <Text style={s.mark}>◮</Text>
        <Title>Identity Compound</Title>
        <Sub style={{ marginTop: sp(2), textAlign: 'center' }}>
          Health, knowledge, relationships — the three accounts where{'\n'}every day compounds.
          This is where you keep score.
        </Sub>
      </View>

      <View style={s.bottom}>
        <ErrorNote message={error} />
        <Pressable
          onPress={signIn}
          disabled={busy}
          style={({ pressed }) => [s.appleButton, (pressed || busy) && { opacity: 0.7 }]}
        >
          <Text style={s.appleLogo}>{Platform.OS === 'ios' ? '' : '🍎'}</Text>
          <Text style={s.appleLabel}>{busy ? 'Opening…' : 'Sign in with Apple'}</Text>
        </Pressable>
        <Tiny style={s.footnote}>
          One tap with Face ID. Your data stays in your own AWS account.
        </Tiny>
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  mark: { fontSize: 44, color: colors.accentBright, marginBottom: sp(4) },
  bottom: { paddingBottom: sp(6) },
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: sp(3.75),
    gap: sp(2),
  },
  appleLogo: { fontSize: 18, color: '#000000', marginTop: -2 },
  appleLabel: { fontFamily: font.sansSemi, fontSize: 16.5, color: '#000000' },
  footnote: { textAlign: 'center', marginTop: sp(3) },
});
