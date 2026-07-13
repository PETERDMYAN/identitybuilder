import Ionicons from '@expo/vector-icons/Ionicons';
import { getDayOfYear } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { MementoBanner } from '@/components/MementoBanner';
import {
  Body,
  Button,
  Card,
  Chip,
  Field,
  LoadingScreen,
  Overline,
  RatingDots,
  Row,
  Screen,
  Serif,
  Spacer,
  Sub,
  Tiny,
  Title,
} from '@/components/ui';
import { COMMIT_LINES, DONT_SUGGESTIONS, DO_SUGGESTIONS } from '@/lib/content';
import { fmtDayTitle, greetingFor, todayStr } from '@/lib/dates';
import {
  useAddDailyItem,
  useCurrentWeekStart,
  useDailyEntry,
  useDailyItems,
  useDeleteDailyItem,
  useDomains,
  useGrowthBundle,
  useProfile,
  useToggleDailyItem,
  useUpsertDailyEntry,
} from '@/lib/queries';
import { colors, font, radius, sp } from '@/lib/theme';
import { DailyItem, Domain } from '@/lib/types';
import { URGES } from '@/lib/urges';

export default function TodayScreen() {
  const router = useRouter();
  const today = todayStr();
  const week = useCurrentWeekStart();

  const { data: profile } = useProfile();
  const { data: domains = [] } = useDomains();
  const { data: items, isLoading } = useDailyItems(today);
  const { data: entry } = useDailyEntry(today);
  const { data: bundle } = useGrowthBundle();

  const addItem = useAddDailyItem();
  const toggleItem = useToggleDailyItem();
  const deleteItem = useDeleteDailyItem();
  const upsertEntry = useUpsertDailyEntry();
  const [closeOpen, setCloseOpen] = useState(false);

  const dos = useMemo(() => (items ?? []).filter((i) => i.kind === 'do'), [items]);
  const donts = useMemo(() => (items ?? []).filter((i) => i.kind === 'dont'), [items]);
  const doneToday = (items ?? []).filter((i) => i.done).length;

  const streak = bundle?.growth.streak ?? 0;
  const committed = !!entry?.committed_at;
  const dayClosed = entry != null && (entry.alignment != null || entry.reflection.trim() !== '');
  const hour = new Date().getHours();
  const commitLine = COMMIT_LINES[getDayOfYear(new Date()) % COMMIT_LINES.length];

  const mementoDomain: Domain | undefined =
    profile?.inversion_nudges !== false && domains.length
      ? domains[getDayOfYear(new Date()) % domains.length]
      : undefined;

  const onToggle = (item: DailyItem) => {
    Haptics.impactAsync(
      item.done ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium,
    ).catch(() => {});
    toggleItem.mutate({ item, week });
  };

  const onAdd = (title: string, kind: 'do' | 'dont', domainId: string | null) => {
    addItem.mutate({ date: today, week, title, kind, domainId });
  };

  const commitToDay = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    upsertEntry.mutate({ date: today, patch: { committed_at: new Date().toISOString() } });
  };

  if (isLoading) return <LoadingScreen />;

  return (
    <Screen>
      <Row between>
        <View>
          <Sub>
            {greetingFor(hour)}
            {profile?.display_name ? `, ${profile.display_name}` : ''}
          </Sub>
          <Title style={{ marginTop: sp(0.5), fontSize: 24 }}>{fmtDayTitle(today)}</Title>
        </View>
        <Row gap={2}>
          {streak > 0 && (
            <View style={s.streakPill}>
              <Text style={s.streakText}>🔥 {streak}</Text>
            </View>
          )}
          <Pressable onPress={() => router.push('/settings')} hitSlop={8}>
            <Ionicons name="settings-outline" size={21} color={colors.muted} />
          </Pressable>
        </Row>
      </Row>
      <Spacer h={5} />

      {(items ?? []).length > 0 && !committed && (
        <Card tone="accent">
          <Serif style={{ fontSize: 17 }}>Who are you being today?</Serif>
          <Tiny style={{ marginTop: sp(1.5), marginBottom: sp(3), fontStyle: 'italic' }}>
            {commitLine}
          </Tiny>
          <Button label="I commit to today" onPress={commitToDay} loading={upsertEntry.isPending && !closeOpen} />
        </Card>
      )}

      <View style={{ marginBottom: sp(5) }}>
        <Overline>Right now</Overline>
        <Spacer h={2} />
        {URGES.map((u) => (
          <Pressable
            key={u.id}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              router.push(`/urge/${u.id}`);
            }}
            style={({ pressed }) => [s.urgeBtn, pressed && { opacity: 0.75 }]}
          >
            <View style={[s.urgeEmoji, { backgroundColor: `${u.color}1C` }]}>
              <Text style={{ fontSize: 19 }}>{u.emoji}</Text>
            </View>
            <Text style={s.urgeLabel}>{u.label}</Text>
            <Ionicons name="chevron-forward" size={15} color={colors.muted} />
          </Pressable>
        ))}
      </View>

      <ItemSection
        title="I will"
        items={dos}
        kind="do"
        domains={domains}
        suggestions={DO_SUGGESTIONS}
        placeholder="Add something to do…"
        onAdd={onAdd}
        onToggle={onToggle}
        onDelete={(item) => deleteItem.mutate({ id: item.id, date: today, week })}
      />

      <ItemSection
        title="I won't"
        items={donts}
        kind="dont"
        domains={domains}
        suggestions={DONT_SUGGESTIONS}
        placeholder="Add something to avoid…"
        onAdd={onAdd}
        onToggle={onToggle}
        onDelete={(item) => deleteItem.mutate({ id: item.id, date: today, week })}
      />

      {(items ?? []).length > 0 &&
        (dayClosed ? (
          <Card onPress={() => setCloseOpen(true)}>
            <Row between>
              <Overline>Day closed</Overline>
              <RatingDots value={entry?.alignment ?? null} onChange={() => setCloseOpen(true)} />
            </Row>
            {entry?.reflection ? <Text style={s.reflection}>“{entry.reflection}”</Text> : null}
          </Card>
        ) : (
          <Button label="Close the day" kind="ghost" onPress={() => setCloseOpen(true)} />
        ))}

      {mementoDomain ? <MementoBanner domain={mementoDomain} /> : null}

      <CloseDayModal
        visible={closeOpen}
        onClose={() => setCloseOpen(false)}
        keptToday={doneToday}
        initialAlignment={entry?.alignment ?? null}
        initialReflection={entry?.reflection ?? ''}
        onSave={(alignment, reflection) => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          upsertEntry.mutate({
            date: today,
            patch: {
              alignment,
              reflection,
              committed_at: entry?.committed_at ?? new Date().toISOString(),
            },
          });
          setCloseOpen(false);
        }}
      />
    </Screen>
  );
}

function ItemSection({
  title,
  items,
  kind,
  domains,
  suggestions,
  placeholder,
  onAdd,
  onToggle,
  onDelete,
}: {
  title: string;
  items: DailyItem[];
  kind: 'do' | 'dont';
  domains: Domain[];
  suggestions: string[];
  placeholder: string;
  onAdd: (title: string, kind: 'do' | 'dont', domainId: string | null) => void;
  onToggle: (item: DailyItem) => void;
  onDelete: (item: DailyItem) => void;
}) {
  const [text, setText] = useState('');
  const [domainId, setDomainId] = useState<string | null>(null);
  const domainById = new Map(domains.map((d) => [d.id, d]));

  const submit = () => {
    const t = text.trim();
    if (!t) return;
    onAdd(t, kind, domainId);
    setText('');
  };

  return (
    <View style={{ marginBottom: sp(5) }}>
      <Overline style={kind === 'dont' ? { color: colors.decay } : undefined}>{title}</Overline>
      <Spacer h={2} />

      {items.map((item) => {
        const domain = item.domain_id ? domainById.get(item.domain_id) : undefined;
        const doneColor = domain?.color ?? colors.accent;
        return (
          <Pressable
            key={item.id}
            onPress={() => onToggle(item)}
            style={({ pressed }) => [s.itemRow, pressed && { opacity: 0.7 }]}
          >
            <View
              style={[
                s.check,
                kind === 'dont' && s.checkDont,
                item.done && { backgroundColor: doneColor, borderColor: doneColor },
              ]}
            >
              {item.done ? <Text style={s.checkMark}>✓</Text> : null}
            </View>
            <Text style={[s.itemTitle, item.done && { color: colors.sub }]} numberOfLines={2}>
              {item.title}
            </Text>
            {domain ? <Text style={{ fontSize: 12, marginRight: sp(2) }}>{domain.emoji}</Text> : null}
            <Pressable onPress={() => onDelete(item)} hitSlop={8}>
              <Text style={s.remove}>✕</Text>
            </Pressable>
          </Pressable>
        );
      })}

      {items.length === 0 && (
        <Row style={{ flexWrap: 'wrap' }}>
          {suggestions.map((sug) => (
            <Chip key={sug} label={`+ ${sug}`} small onPress={() => onAdd(sug, kind, null)} />
          ))}
        </Row>
      )}

      <View style={s.addRow}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          style={s.addInput}
          returnKeyType="done"
          onSubmitEditing={submit}
        />
      </View>
      {text.trim().length > 0 && (
        <Row gap={1} style={{ marginTop: sp(2), flexWrap: 'wrap' }}>
          <Chip label="✦ Life" small selected={domainId === null} onPress={() => setDomainId(null)} />
          {domains.map((d) => (
            <Chip
              key={d.id}
              label={`${d.emoji} ${d.name}`}
              small
              color={d.color}
              selected={domainId === d.id}
              onPress={() => setDomainId(d.id)}
            />
          ))}
          <Chip label="Add ↵" small color={colors.accentBright} onPress={submit} />
        </Row>
      )}
    </View>
  );
}

function CloseDayModal({
  visible,
  onClose,
  onSave,
  keptToday,
  initialAlignment,
  initialReflection,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (alignment: number | null, reflection: string) => void;
  keptToday: number;
  initialAlignment: number | null;
  initialReflection: string;
}) {
  const [alignment, setAlignment] = useState<number | null>(initialAlignment);
  const [reflection, setReflection] = useState(initialReflection);

  const [wasVisible, setWasVisible] = useState(false);
  if (visible && !wasVisible) {
    setWasVisible(true);
    setAlignment(initialAlignment);
    setReflection(initialReflection);
  } else if (!visible && wasVisible) {
    setWasVisible(false);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.modalBackdrop} onPress={onClose} />
      <View style={s.sheet}>
        <Serif>Close the day</Serif>
        <Sub style={{ marginTop: sp(1) }}>
          {keptToday} kept today. Evidence recorded either way.
        </Sub>
        <Spacer h={4} />
        <Body style={{ fontFamily: font.sansSemi, marginBottom: sp(2) }}>
          How aligned were you with who you say you are?
        </Body>
        <RatingDots value={alignment} onChange={setAlignment} />
        <Spacer h={4} />
        <Field
          label="One honest line"
          value={reflection}
          onChangeText={setReflection}
          placeholder="What did today’s actions say about who you are?"
          multiline
        />
        <Button label="Close the day" onPress={() => onSave(alignment, reflection.trim())} />
        <Spacer h={2} />
        <Button label="Not yet" kind="outline" onPress={onClose} />
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  streakPill: {
    backgroundColor: colors.accentFaint,
    borderRadius: 999,
    paddingHorizontal: sp(2.5),
    paddingVertical: sp(1.25),
  },
  streakText: { fontFamily: font.sansSemi, fontSize: 13, color: colors.accentBright },
  urgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: sp(3.25),
    paddingHorizontal: sp(3.5),
    marginBottom: sp(2),
  },
  urgeEmoji: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: sp(3),
  },
  urgeLabel: { flex: 1, fontFamily: font.sansSemi, fontSize: 16, color: colors.text },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: sp(2.5),
  },
  check: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.raised,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: sp(3),
  },
  checkDont: { borderRadius: 8, borderColor: 'rgba(194, 86, 78, 0.5)' },
  checkMark: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  itemTitle: { flex: 1, fontFamily: font.sansMed, fontSize: 15.5, color: colors.text, marginRight: sp(2) },
  remove: { color: colors.muted, fontSize: 15, padding: sp(1) },
  addRow: { marginTop: sp(1) },
  addInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radius.md,
    color: colors.text,
    fontFamily: font.sans,
    fontSize: 15,
    paddingHorizontal: sp(3.5),
    paddingVertical: sp(2.75),
  },
  reflection: {
    fontFamily: font.serifItalic,
    fontSize: 14.5,
    lineHeight: 21,
    color: colors.sub,
    marginTop: sp(2),
  },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor: colors.raised,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: sp(5),
    paddingBottom: sp(10),
  },
});
