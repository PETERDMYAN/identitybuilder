import React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, font, radius, sp } from '@/lib/theme';

// ---------- layout ----------

export function Screen({
  children,
  scroll = true,
  style,
  topInset = true,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
  topInset?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const pad = {
    paddingTop: (topInset ? insets.top : sp(3)) + sp(2),
    paddingBottom: insets.bottom + sp(10),
  };
  if (!scroll) {
    return <View style={[s.screen, pad, style]}>{children}</View>;
  }
  return (
    <KeyboardAvoidingView
      style={s.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={s.screenScroll}
        contentContainerStyle={[s.screenContent, pad, style]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export const Row = ({
  children,
  style,
  between,
  gap = 0,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  between?: boolean;
  gap?: number;
}) => (
  <View
    style={[
      s.row,
      between && { justifyContent: 'space-between' },
      gap ? { gap: sp(gap) } : null,
      style,
    ]}
  >
    {children}
  </View>
);

export const Spacer = ({ h = 4 }: { h?: number }) => <View style={{ height: sp(h) }} />;

export const Divider = () => <View style={s.divider} />;

export function Card({
  children,
  style,
  onPress,
  tone = 'surface',
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  tone?: 'surface' | 'raised' | 'accent' | 'decay';
}) {
  const tones: Record<string, ViewStyle> = {
    surface: { backgroundColor: colors.surface, borderColor: colors.border },
    raised: { backgroundColor: colors.raised, borderColor: colors.border },
    accent: { backgroundColor: colors.accentFaint, borderColor: 'rgba(175,137,244,0.35)' },
    decay: { backgroundColor: colors.decayFaint, borderColor: 'rgba(194,86,78,0.30)' },
  };
  const body = <View style={[s.card, tones[tone], style]}>{children}</View>;
  if (!onPress) return body;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && s.pressed}>
      {body}
    </Pressable>
  );
}

// ---------- typography ----------

const text = (base: TextStyle) =>
  function Txt({ children, style, ...rest }: { children: React.ReactNode; style?: StyleProp<TextStyle> } & React.ComponentProps<typeof Text>) {
    return (
      <Text {...rest} style={[base, style]}>
        {children}
      </Text>
    );
  };

export const Title = text({ fontFamily: font.serif, fontSize: 28, lineHeight: 34, color: colors.text });
export const Serif = text({ fontFamily: font.serifMed, fontSize: 19, lineHeight: 27, color: colors.text });
export const Creed = text({ fontFamily: font.serifMed, fontSize: 17, lineHeight: 25, color: colors.text });
export const Body = text({ fontFamily: font.sans, fontSize: 15, lineHeight: 22, color: colors.text });
export const Sub = text({ fontFamily: font.sans, fontSize: 13.5, lineHeight: 20, color: colors.sub });
export const Tiny = text({ fontFamily: font.sansMed, fontSize: 11.5, lineHeight: 15, color: colors.muted });
export const Overline = text({
  fontFamily: font.sansSemi,
  fontSize: 11,
  lineHeight: 14,
  color: colors.muted,
  letterSpacing: 1.4,
  textTransform: 'uppercase',
});

// ---------- controls ----------

export function Button({
  label,
  onPress,
  kind = 'primary',
  loading,
  disabled,
  small,
  style,
}: {
  label: string;
  onPress: () => void;
  kind?: 'primary' | 'ghost' | 'outline' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  small?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const off = disabled || loading;
  const kindStyle: Record<string, [ViewStyle, TextStyle]> = {
    primary: [{ backgroundColor: colors.accent }, { color: '#FFFFFF' }],
    ghost: [{ backgroundColor: colors.raised }, { color: colors.text }],
    outline: [
      { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border },
      { color: colors.sub },
    ],
    danger: [{ backgroundColor: 'transparent' }, { color: colors.danger }],
  };
  const [box, txt] = kindStyle[kind];
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      style={({ pressed }) => [
        s.btn,
        small && s.btnSmall,
        box,
        off && { opacity: 0.45 },
        pressed && s.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={txt.color as string} size="small" />
      ) : (
        <Text style={[s.btnLabel, small && { fontSize: 13.5 }, txt]}>{label}</Text>
      )}
    </Pressable>
  );
}

export function Chip({
  label,
  onPress,
  selected,
  color = colors.accentBright,
  small,
}: {
  label: string;
  onPress?: () => void;
  selected?: boolean;
  color?: string;
  small?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        s.chip,
        small && s.chipSmall,
        selected && { backgroundColor: `${color}22`, borderColor: color },
        pressed && s.pressed,
      ]}
    >
      <Text
        style={[
          s.chipLabel,
          small && { fontSize: 12 },
          selected && { color, fontFamily: font.sansSemi },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function Field({
  label,
  hint,
  ...input
}: { label?: string; hint?: string } & TextInputProps) {
  return (
    <View style={{ marginBottom: sp(3) }}>
      {label ? <Text style={s.fieldLabel}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.muted}
        {...input}
        style={[s.input, input.multiline && s.inputMulti, input.style]}
      />
      {hint ? <Tiny style={{ marginTop: sp(1) }}>{hint}</Tiny> : null}
    </View>
  );
}

/** Pick how many days per week (×1 … ×7). */
export function DaysStepper({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <Row gap={1}>
      {[1, 2, 3, 4, 5, 6, 7].map((n) => (
        <Pressable
          key={n}
          onPress={() => onChange(n)}
          style={[s.dayStep, value === n && { backgroundColor: colors.accentFaint, borderColor: colors.accentBright }]}
        >
          <Text style={[s.dayStepLabel, value === n && { color: colors.accentBright, fontFamily: font.sansSemi }]}>
            {n}
          </Text>
        </Pressable>
      ))}
    </Row>
  );
}

/** 1..5 alignment rating. */
export function RatingDots({
  value,
  onChange,
  color = colors.accentBright,
}: {
  value: number | null;
  onChange: (n: number) => void;
  color?: string;
}) {
  return (
    <Row gap={2}>
      {[1, 2, 3, 4, 5].map((n) => {
        const on = value != null && n <= value;
        return (
          <Pressable key={n} onPress={() => onChange(n)} hitSlop={6}>
            <View
              style={[
                s.ratingDot,
                on && { backgroundColor: color, borderColor: color },
              ]}
            />
          </Pressable>
        );
      })}
    </Row>
  );
}

/** Small kept/target dots, e.g. ●●○○ for 2 of 4. */
export function ProgressDots({ kept, target, color }: { kept: number; target: number; color: string }) {
  return (
    <Row gap={1}>
      {Array.from({ length: Math.min(target, 7) }, (_, i) => (
        <View
          key={i}
          style={[
            s.progressDot,
            i < kept ? { backgroundColor: color } : { backgroundColor: colors.border },
          ]}
        />
      ))}
    </Row>
  );
}

// ---------- states ----------

export function LoadingScreen({ label }: { label?: string }) {
  return (
    <View style={[s.screen, s.center]}>
      <ActivityIndicator color={colors.accentBright} />
      {label ? <Sub style={{ marginTop: sp(3) }}>{label}</Sub> : null}
    </View>
  );
}

export function EmptyState({
  emoji,
  title,
  body,
  cta,
  onPress,
}: {
  emoji: string;
  title: string;
  body: string;
  cta?: string;
  onPress?: () => void;
}) {
  return (
    <Card style={s.center}>
      <Text style={{ fontSize: 34, marginBottom: sp(2) }}>{emoji}</Text>
      <Serif style={{ textAlign: 'center' }}>{title}</Serif>
      <Sub style={{ textAlign: 'center', marginTop: sp(1.5), marginBottom: cta ? sp(4) : 0 }}>{body}</Sub>
      {cta && onPress ? <Button label={cta} onPress={onPress} /> : null}
    </Card>
  );
}

export function ErrorNote({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <View style={s.errorBox}>
      <Sub style={{ color: colors.danger }}>{message}</Sub>
    </View>
  );
}

// ---------- styles ----------

const s = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: sp(4) },
  screenScroll: { flex: 1, backgroundColor: colors.bg },
  screenContent: { paddingHorizontal: sp(4) },
  center: { alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center' },
  divider: { height: 1, backgroundColor: colors.borderSoft, marginVertical: sp(3) },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: sp(4),
    marginBottom: sp(3),
  },
  pressed: { opacity: 0.75 },
  btn: {
    borderRadius: radius.md,
    paddingVertical: sp(3.5),
    paddingHorizontal: sp(5),
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSmall: { paddingVertical: sp(2), paddingHorizontal: sp(3.5), borderRadius: radius.sm },
  btnLabel: { fontFamily: font.sansSemi, fontSize: 15.5 },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: sp(1.75),
    paddingHorizontal: sp(3),
    marginRight: sp(1.5),
    marginBottom: sp(1.5),
  },
  chipSmall: { paddingVertical: sp(1), paddingHorizontal: sp(2.25) },
  chipLabel: { fontFamily: font.sansMed, fontSize: 13, color: colors.sub },
  fieldLabel: {
    fontFamily: font.sansSemi,
    fontSize: 12.5,
    color: colors.sub,
    marginBottom: sp(1.5),
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    color: colors.text,
    fontFamily: font.sans,
    fontSize: 15,
    paddingHorizontal: sp(3.5),
    paddingVertical: sp(3),
  },
  inputMulti: { minHeight: 96, textAlignVertical: 'top' },
  dayStep: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayStepLabel: { fontFamily: font.sansMed, fontSize: 14, color: colors.sub },
  ratingDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  progressDot: { width: 6, height: 6, borderRadius: 3 },
  errorBox: {
    backgroundColor: colors.decayFaint,
    borderRadius: radius.sm,
    padding: sp(3),
    marginBottom: sp(3),
  },
});
