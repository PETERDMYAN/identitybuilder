import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  Body,
  Button,
  Card,
  LoadingScreen,
  Overline,
  Row,
  Screen,
  Spacer,
  Sub,
  Tiny,
  Title,
} from '@/components/ui';
import { fmtMultiplier } from '@/lib/compound';
import { fmtShort, fmtWeekRange, todayStr, weekDates, weekdayLetter } from '@/lib/dates';
import {
  useCurrentWeekStart,
  useGrowthBundle,
  useWeekItems,
  useWeeklyReflection,
} from '@/lib/queries';
import { colors, font, sp } from '@/lib/theme';

export default function WeekScreen() {
  const router = useRouter();
  const today = todayStr();
  const week = useCurrentWeekStart();

  const { data: items, isLoading } = useWeekItems(week);
  const { data: reflection } = useWeeklyReflection(week);
  const { data: bundle } = useGrowthBundle();

  const days = useMemo(() => {
    const byDate = new Map<string, { total: number; done: number }>();
    for (const i of items ?? []) {
      const d = byDate.get(i.date) ?? { total: 0, done: 0 };
      d.total += 1;
      if (i.done) d.done += 1;
      byDate.set(i.date, d);
    }
    return weekDates(week).map((date) => ({ date, ...(byDate.get(date) ?? { total: 0, done: 0 }) }));
  }, [items, week]);

  const total = (items ?? []).length;
  const kept = (items ?? []).filter((i) => i.done).length;

  const pastWeeks = useMemo(() => {
    const life = bundle?.growth.life ?? [];
    return life.filter((p) => p.weekStart !== week).slice(-4).reverse();
  }, [bundle, week]);

  if (isLoading) return <LoadingScreen />;

  return (
    <Screen>
      <Overline>This week</Overline>
      <Title style={{ marginTop: sp(0.5), fontSize: 24 }}>{fmtWeekRange(week)}</Title>
      <Spacer h={4} />

      <Card>
        <Row between>
          <Body style={{ fontFamily: font.sansSemi }}>
            {kept} of {total || '—'} kept
          </Body>
          <Sub>{total ? Math.round((kept / total) * 100) : 0}%</Sub>
        </Row>
        <View style={s.barTrack}>
          <View style={[s.barFill, { width: `${Math.min(100, total ? (kept / total) * 100 : 0)}%` }]} />
        </View>
        <Row between style={{ marginTop: sp(4) }}>
          {days.map((d) => {
            const isToday = d.date === today;
            const future = d.date > today;
            return (
              <View key={d.date} style={[s.dayCell, future && { opacity: 0.35 }]}>
                <Tiny style={isToday ? { color: colors.text } : undefined}>
                  {weekdayLetter(d.date)}
                </Tiny>
                <View
                  style={[
                    s.dayBubble,
                    d.total > 0 && d.done === d.total && { backgroundColor: colors.accent, borderColor: colors.accent },
                    d.total > 0 && d.done < d.total && d.done > 0 && { borderColor: colors.accentBright },
                    isToday && d.total === 0 && { borderColor: colors.sub },
                  ]}
                >
                  <Text style={s.dayCount}>{d.total ? `${d.done}/${d.total}` : '·'}</Text>
                </View>
              </View>
            );
          })}
        </Row>
        <Tiny style={{ marginTop: sp(2.5) }}>
          Set each day's do's and don'ts on Today — this is the week they add up to.
        </Tiny>
      </Card>

      {reflection ? (
        <Card onPress={() => router.push('/reflect-weekly')}>
          <Overline>Weekly reflection ✓</Overline>
          {reflection.evidence ? (
            <Text style={s.quote}>“{reflection.evidence}”</Text>
          ) : (
            <Sub style={{ marginTop: sp(1.5) }}>Saved. Tap to revisit or edit.</Sub>
          )}
        </Card>
      ) : (
        <Card tone="accent">
          <Body style={{ fontFamily: font.sansSemi }}>End the week honestly</Body>
          <Sub style={{ marginTop: sp(1), marginBottom: sp(3) }}>
            What did this week’s actions prove about who you are becoming?
          </Sub>
          <Button label="Weekly reflection" onPress={() => router.push('/reflect-weekly')} />
        </Card>
      )}

      {pastWeeks.length > 0 && (
        <>
          <Spacer h={4} />
          <Overline>Recent weeks</Overline>
          <Spacer h={2} />
          {pastWeeks.map((p) => (
            <Card key={p.weekStart} style={{ paddingVertical: sp(3) }}>
              <Row between>
                <Sub>{fmtShort(p.weekStart)}</Sub>
                <Row gap={3}>
                  <Tiny>{p.ratio == null ? 'nothing set' : `${Math.round(p.ratio * 100)}% kept`}</Tiny>
                  <Body style={{ fontFamily: font.sansSemi, color: colors.accentBright }}>
                    {fmtMultiplier(p.score)}
                  </Body>
                </Row>
              </Row>
            </Card>
          ))}
        </>
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  barTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
    marginTop: sp(2.5),
    overflow: 'hidden',
  },
  barFill: { height: 6, borderRadius: 3, backgroundColor: colors.accentBright },
  dayCell: { alignItems: 'center', gap: 6, flex: 1 },
  dayBubble: {
    minWidth: 34,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.raised,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  dayCount: { fontFamily: font.sansMed, fontSize: 10.5, color: colors.sub },
  quote: {
    fontFamily: font.serifItalic,
    fontSize: 14.5,
    lineHeight: 21,
    color: colors.sub,
    marginTop: sp(2),
  },
});
