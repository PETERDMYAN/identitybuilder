import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Text, View } from 'react-native';

import {
  Body,
  Button,
  Chip,
  EmptyState,
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
} from '@/components/ui';
import { addDaysStr, fmtWeekRange } from '@/lib/dates';
import {
  useCurrentWeekStart,
  useDomains,
  useUpsertWeeklyReflection,
  useWeekItems,
  useWeeklyReflection,
} from '@/lib/queries';
import { sp } from '@/lib/theme';
import { DailyItem, Domain, WeeklyReflection } from '@/lib/types';

export default function ReflectWeeklyScreen() {
  const router = useRouter();
  const currentWeek = useCurrentWeekStart();
  const [which, setWhich] = useState<'this' | 'last'>('this');
  const week = which === 'this' ? currentWeek : addDaysStr(currentWeek, -7);

  const { data: domains = [] } = useDomains();
  const { data: items, isLoading: itemsLoading } = useWeekItems(week);
  const { data: reflection, isLoading: reflLoading } = useWeeklyReflection(week);

  if (itemsLoading || reflLoading) return <LoadingScreen />;

  return (
    <Screen topInset={false}>
      <Row between>
        <Serif>Weekly reflection</Serif>
        <Button label="Close" kind="ghost" small onPress={() => router.back()} />
      </Row>
      <Spacer h={3} />
      <Row gap={2}>
        <Chip label="This week" selected={which === 'this'} onPress={() => setWhich('this')} />
        <Chip label="Last week" selected={which === 'last'} onPress={() => setWhich('last')} />
      </Row>
      <Tiny style={{ marginTop: sp(2) }}>{fmtWeekRange(week)}</Tiny>
      <Spacer h={4} />

      {!items || items.length === 0 ? (
        <EmptyState
          emoji="🌫️"
          title="Nothing was set"
          body="No daily do's or don'ts existed this week, so there is nothing to grade — only a lesson: unset days drift."
        />
      ) : (
        <ReflectForm
          key={`${week}-${reflection?.id ?? 'new'}`}
          week={week}
          items={items}
          domains={domains}
          existing={reflection ?? null}
          onSaved={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            Alert.alert('Recorded', 'The week is closed. The next one is unwritten.', [
              { text: 'Done', onPress: () => router.back() },
            ]);
          }}
        />
      )}
    </Screen>
  );
}

function ReflectForm({
  week,
  items,
  domains,
  existing,
  onSaved,
}: {
  week: string;
  items: DailyItem[];
  domains: Domain[];
  existing: WeeklyReflection | null;
  onSaved: () => void;
}) {
  const upsert = useUpsertWeeklyReflection();
  const [ratings, setRatings] = useState<Record<string, number>>(existing?.ratings ?? {});
  const [evidence, setEvidence] = useState(existing?.evidence ?? '');
  const [wins, setWins] = useState(existing?.wins ?? '');
  const [lessons, setLessons] = useState(existing?.lessons ?? '');
  const [changeOne, setChangeOne] = useState(existing?.change_one ?? '');

  const kept = items.filter((i) => i.done).length;

  const save = async () => {
    try {
      await upsert.mutateAsync({
        week,
        patch: {
          ratings,
          evidence: evidence.trim(),
          wins: wins.trim(),
          lessons: lessons.trim(),
          change_one: changeOne.trim(),
        },
      });
      onSaved();
    } catch (e: unknown) {
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Please try again.');
    }
  };

  return (
    <View>
      <Body style={{ marginBottom: sp(4) }}>
        {kept} of {items.length} kept this week.
      </Body>

      <Overline style={{ marginBottom: sp(2) }}>Alignment, account by account</Overline>
      {domains.map((d) => {
        const dItems = items.filter((i) => i.domain_id === d.id);
        if (dItems.length === 0) return null;
        return (
          <View key={d.id} style={{ marginBottom: sp(3.5) }}>
            <Row between style={{ marginBottom: sp(1.5) }}>
              <Row gap={1.5}>
                <Text style={{ fontSize: 12 }}>{d.emoji}</Text>
                <Sub>
                  {d.name} · {dItems.filter((i) => i.done).length}/{dItems.length}
                </Sub>
              </Row>
            </Row>
            <RatingDots
              value={ratings[d.id] ?? null}
              onChange={(n) => setRatings((r) => ({ ...r, [d.id]: n }))}
              color={d.color}
            />
          </View>
        );
      })}
      <Spacer h={2} />

      <Field
        label="What did this week's actions prove about you?"
        value={evidence}
        onChangeText={setEvidence}
        placeholder="The evidence, not the intention…"
        multiline
      />
      <Field label="Wins to keep" value={wins} onChangeText={setWins} multiline placeholder="What worked?" />
      <Field
        label="Lessons"
        value={lessons}
        onChangeText={setLessons}
        multiline
        placeholder="What got in the way, and what does it teach?"
      />
      <Field
        label="One change for next week"
        value={changeOne}
        onChangeText={setChangeOne}
        placeholder="Only one. Make it stick."
      />
      <Button label="Close the week" onPress={save} loading={upsert.isPending} />
    </View>
  );
}
