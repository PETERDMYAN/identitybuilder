import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CompoundChart } from '@/components/CompoundChart';
import {
  Body,
  Card,
  Chip,
  LoadingScreen,
  Overline,
  Row,
  Screen,
  Spacer,
  Sub,
  Tiny,
  Title,
} from '@/components/ui';
import { fmtMultiplier, WEEK_DOWN, WEEK_UP } from '@/lib/compound';
import { addDaysStr, fmtShort, todayStr } from '@/lib/dates';
import { useDomains, useGrowthBundle } from '@/lib/queries';
import { colors, font, radius, sp } from '@/lib/theme';

export default function GrowthScreen() {
  const { data: domains = [] } = useDomains();
  const { data: bundle, isLoading } = useGrowthBundle();
  const [selected, setSelected] = useState<string>('life');

  const growth = bundle?.growth;
  const series = useMemo(() => {
    if (!growth) return { points: [], color: colors.accentBright, score: 1, label: 'Life' };
    if (selected === 'life') {
      return { points: growth.life, color: colors.accentBright, score: growth.lifeScore, label: 'Life' };
    }
    const dg = growth.domains.find((d) => d.domain.id === selected);
    return dg
      ? { points: dg.points, color: dg.domain.color, score: dg.score, label: dg.domain.name }
      : { points: [], color: colors.accentBright, score: 1, label: 'Life' };
  }, [growth, selected]);

  const evidenceDays = useMemo(() => {
    if (!bundle) return [];
    const today = todayStr();
    const domainColor = new Map(domains.map((d) => [d.id, d.color]));
    const days: { date: string; titles: { title: string; color: string }[]; reflection: string; alignment: number | null }[] = [];
    for (let i = 0; i < 14; i++) {
      const date = addDaysStr(today, -i);
      const dayKept = bundle.items.filter((it) => it.date === date && it.done);
      const entry = bundle.entriesByDate.get(date);
      if (dayKept.length === 0 && !entry?.reflection && entry?.alignment == null) continue;
      days.push({
        date,
        titles: dayKept.map((it) => ({
          title: it.kind === 'dont' ? `Held the line: ${it.title}` : it.title,
          color: (it.domain_id && domainColor.get(it.domain_id)) || colors.accentBright,
        })),
        reflection: entry?.reflection ?? '',
        alignment: entry?.alignment ?? null,
      });
    }
    return days;
  }, [bundle, domains]);

  if (isLoading || !growth) return <LoadingScreen />;

  return (
    <Screen>
      <Overline>Compounding</Overline>
      <Row between style={{ marginTop: sp(0.5) }}>
        <Title style={{ fontSize: 40, color: series.color }}>{fmtMultiplier(series.score)}</Title>
        <View style={{ alignItems: 'flex-end' }}>
          <Tiny>PACE → 1 YEAR</Tiny>
          <Body style={{ fontFamily: font.sansSemi, color: growth.paceYear >= 1 ? colors.green : colors.decay }}>
            {fmtMultiplier(growth.paceYear)}
          </Body>
        </View>
      </Row>
      <Sub style={{ marginTop: sp(0.5) }}>
        {series.label} compound score — everyone starts at ×1.00
      </Sub>
      <Spacer h={3} />

      <Row style={{ flexWrap: 'wrap' }}>
        <Chip label="◮ Life" selected={selected === 'life'} onPress={() => setSelected('life')} />
        {domains.map((d) => (
          <Chip
            key={d.id}
            label={`${d.emoji} ${d.name}`}
            color={d.color}
            selected={selected === d.id}
            onPress={() => setSelected(d.id)}
          />
        ))}
      </Row>
      <Spacer h={2} />

      <Card style={{ paddingVertical: sp(3), paddingHorizontal: sp(2) }}>
        <CompoundChart points={series.points} color={series.color} />
        <Tiny style={{ paddingHorizontal: sp(2), marginTop: sp(1) }}>
          A fully kept week compounds ×{WEEK_UP.toFixed(3)}; a fully broken one ×
          {WEEK_DOWN.toFixed(3)}. The wedge is where your five-year selves are built.
        </Tiny>
      </Card>

      <Row gap={2.5}>
        <StatTile label="Streak" value={`${growth.streak}d`} />
        <StatTile label="Kept" value={`${growth.totalKept}`} />
        <StatTile
          label="This week"
          value={`${growth.thisWeekKept}/${growth.thisWeekTotal || '–'}`}
        />
      </Row>
      <Spacer h={4} />

      <Overline>Evidence for each identity</Overline>
      <Spacer h={2} />
      {growth.domains.map(({ domain, kept }) => (
        <Card key={domain.id} style={[s.evidenceCard, { borderLeftColor: domain.color }]}>
          <Row between>
            <View style={{ flex: 1, marginRight: sp(3) }}>
              <Tiny style={{ color: domain.color }}>
                {domain.emoji} {domain.name.toUpperCase()}
              </Tiny>
              <Body style={{ marginTop: sp(1), fontFamily: font.sansMed }} numberOfLines={2}>
                {domain.identity_statement || 'Define this identity in Compass'}
              </Body>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={[s.voteCount, { color: domain.color }]}>{kept}</Text>
              <Tiny>kept</Tiny>
            </View>
          </Row>
        </Card>
      ))}
      <Spacer h={4} />

      <Overline>Evidence log</Overline>
      <Spacer h={2} />
      {evidenceDays.length === 0 ? (
        <Sub>Kept do's and don'ts and daily reflections will appear here.</Sub>
      ) : (
        evidenceDays.map((day) => (
          <Card key={day.date} style={{ paddingVertical: sp(3) }}>
            <Row between>
              <Tiny style={{ color: colors.sub }}>{fmtShort(day.date)}</Tiny>
              {day.alignment != null && (
                <Tiny style={{ color: colors.accentBright }}>{'●'.repeat(day.alignment)}</Tiny>
              )}
            </Row>
            {day.titles.map((t, i) => (
              <Row key={`${t.title}-${i}`} gap={2} style={{ marginTop: sp(1.5) }}>
                <View style={[s.logDot, { backgroundColor: t.color }]} />
                <Sub style={{ color: colors.text }}>{t.title}</Sub>
              </Row>
            ))}
            {day.reflection ? <Text style={s.logQuote}>“{day.reflection}”</Text> : null}
          </Card>
        ))
      )}
    </Screen>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.statTile}>
      <Text style={s.statValue}>{value}</Text>
      <Tiny style={{ marginTop: sp(0.5) }}>{label.toUpperCase()}</Tiny>
    </View>
  );
}

const s = StyleSheet.create({
  statTile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: sp(3),
    alignItems: 'center',
  },
  statValue: { fontFamily: font.serif, fontSize: 20, color: colors.text },
  evidenceCard: { borderLeftWidth: 3, marginBottom: sp(2.5) },
  voteCount: { fontFamily: font.serif, fontSize: 26 },
  logDot: { width: 6, height: 6, borderRadius: 3 },
  logQuote: {
    fontFamily: font.serifItalic,
    fontSize: 13.5,
    lineHeight: 19,
    color: colors.sub,
    marginTop: sp(2),
  },
});
