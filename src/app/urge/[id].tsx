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
import { colors, font, radius, sp } from '@/lib/theme';
import { URGES } from '@/lib/urges';

export default function UrgeScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const urge = URGES.find((u) => u.id === id);

  const [step, setStep] = useState(0);
  const [thing, setThing] = useState('');

  useEffect(() => {
    if (!urge) router.back();
  }, [urge, router]);
  if (!urge) return null;

  const total = urge.steps.length;
  const current = urge.steps[step];
  const last = step === total - 1;
  const text = current.text.replace('{thing}', thing.trim() || urge.fallback);

  const next = () => {
    if (last) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      router.back();
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
        <Pressable onPress={() => router.back()} hitSlop={10}>
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
        </Animated.View>
      </View>

      <Button label={last ? 'Done' : 'Continue'} onPress={next} />
      <Spacer h={2} />
    </Screen>
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
