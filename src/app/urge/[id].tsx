import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Button, Overline, Row, Screen, Serif, Spacer, Tiny } from '@/components/ui';
import { todayStr } from '@/lib/dates';
import { useDomains, useLogUrgeEvent } from '@/lib/queries';
import { colors, font, radius, sp } from '@/lib/theme';
import { URGES, UrgeStep } from '@/lib/urges';

export default function UrgeScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const urge = URGES.find((u) => u.id === id);

  const [step, setStep] = useState(0);
  const [thing, setThing] = useState('');
  const logUrge = useLogUrgeEvent();

  // Falls back to Today when there's no stack to pop (e.g. opened by URL).
  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  useEffect(() => {
    if (!urge) router.replace('/');
  }, [urge, router]);
  if (!urge) return null;

  const total = urge.steps.length;
  const current = urge.steps[step];
  const last = step === total - 1;
  const text = current.text.replace('{thing}', thing.trim() || urge.fallback);

  const next = () => {
    if (last) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      // The pause got taken — record it for the day's close and the week view.
      logUrge.mutate({ date: todayStr(), urgeId: urge.id, note: thing });
      close();
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      setStep(step + 1);
    }
  };

  return (
    <Screen topInset={false} style={{ flexGrow: 1 }}>
      <Row between>
        <Row gap={2}>
          {urge.steps.map((_, i) => (
            <View
              key={i}
              style={[s.stepDot, i <= step && { backgroundColor: urge.color, borderColor: urge.color }]}
            />
          ))}
        </Row>
        <Pressable onPress={close} hitSlop={10}>
          <Ionicons name="close" size={22} color={colors.muted} />
        </Pressable>
      </Row>

      <View style={s.body}>
        <Animated.View key={step} entering={FadeInDown.duration(450)}>
          <Text style={s.emoji}>{urge.emoji}</Text>
          <Overline style={{ color: urge.color }}>{current.overline}</Overline>
          <Serif style={s.stepText}>{text}</Serif>

          {current.breath ? (
            <View style={s.breathWrap}>
              <BreathCircle color={urge.color} />
              <Tiny style={{ marginTop: sp(4) }}>In as it grows · out as it shrinks</Tiny>
            </View>
          ) : null}

          {current.prompt != null ? (
            <TextInput
              value={thing}
              onChangeText={setThing}
              placeholder={current.prompt}
              placeholderTextColor={colors.muted}
              style={s.nameInput}
              returnKeyType="done"
              onSubmitEditing={next}
            />
          ) : null}

          {current.identity ? <IdentityFork identity={current.identity} /> : null}
        </Animated.View>
      </View>

      <Button label={last ? 'Done' : 'Continue'} onPress={next} />
      <Spacer h={2} />
    </Screen>
  );
}

/**
 * The future-self / inversion fork. Shows the user's own vision and
 * anti-vision (written in Compass) for the step's domain — their own words
 * carry more weight than ours — falling back to stock lines until then.
 */
function IdentityFork({ identity }: { identity: NonNullable<UrgeStep['identity']> }) {
  const { data: domains = [] } = useDomains();
  const domain = domains.find(
    (d) => d.name.trim().toLowerCase() === identity.domain.toLowerCase(),
  );
  const vision = domain?.vision.trim() || identity.vision;
  const antiVision = domain?.anti_vision.trim() || identity.antiVision;
  return (
    <View style={{ marginTop: sp(5), gap: sp(2) }}>
      <View style={[s.forkCard, s.forkVision]}>
        <Overline style={{ color: colors.accentBright }}>Future self</Overline>
        <Text style={s.forkText}>{vision}</Text>
      </View>
      <View style={[s.forkCard, s.forkInversion]}>
        <Overline style={{ color: colors.decay }}>The inversion</Overline>
        <Text style={s.forkText}>{antiVision}</Text>
      </View>
    </View>
  );
}

/** Slow pacer: expand ~4s, contract ~6s — a longer exhale calms the body. */
function BreathCircle({ color }: { color: string }) {
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.45, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 6000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );
  }, [scale]);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View
      style={[s.breathCircle, { backgroundColor: `${color}26`, borderColor: color }, anim]}
    />
  );
}

const s = StyleSheet.create({
  stepDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  body: { flex: 1, justifyContent: 'center', paddingBottom: sp(10) },
  emoji: { fontSize: 32, marginBottom: sp(4) },
  stepText: { fontSize: 23, lineHeight: 33, marginTop: sp(2.5) },
  breathWrap: { alignItems: 'center', marginTop: sp(9) },
  breathCircle: { width: 84, height: 84, borderRadius: 42, borderWidth: 1.5 },
  forkCard: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: sp(3),
    paddingHorizontal: sp(3.5),
  },
  forkVision: {
    backgroundColor: colors.accentFaint,
    borderColor: 'rgba(175, 137, 244, 0.35)',
  },
  forkInversion: {
    backgroundColor: colors.decayFaint,
    borderColor: 'rgba(194, 86, 78, 0.30)',
  },
  forkText: {
    fontFamily: font.serifItalic,
    fontSize: 15.5,
    lineHeight: 23,
    color: colors.text,
    marginTop: sp(1.5),
  },
  nameInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    color: colors.text,
    fontFamily: font.sans,
    fontSize: 16,
    paddingHorizontal: sp(3.5),
    paddingVertical: sp(3.25),
    marginTop: sp(6),
  },
});
