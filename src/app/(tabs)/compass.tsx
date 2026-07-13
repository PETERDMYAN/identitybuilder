import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  Body,
  Button,
  Card,
  Creed,
  Field,
  LoadingScreen,
  Overline,
  Row,
  Screen,
  Serif,
  Spacer,
  Sub,
  Tiny,
  Title,
} from '@/components/ui';
import {
  useAddGoal,
  useDeleteGoal,
  useDomains,
  useGoals,
  useSetGoal,
  useUpdateDomain,
} from '@/lib/queries';
import { colors, font, radius, sp } from '@/lib/theme';
import { Domain } from '@/lib/types';

export default function CompassScreen() {
  const { data: domains, isLoading } = useDomains();
  const { data: goals = [] } = useGoals();
  const addGoal = useAddGoal();
  const setGoal = useSetGoal();
  const deleteGoal = useDeleteGoal();
  const [editing, setEditing] = useState<Domain | null>(null);
  const [goalInput, setGoalInput] = useState('');

  if (isLoading || !domains) return <LoadingScreen />;

  return (
    <Screen>
      <Overline>Compass</Overline>
      <Title style={{ marginTop: sp(0.5), fontSize: 24 }}>Who you are becoming</Title>
      <Sub style={{ marginTop: sp(1.5) }}>
        Identity is the direction; commitments are the steps. Revisit often — especially the
        inversions.
      </Sub>
      <Spacer h={4} />

      {domains.map((d) => (
        <Card key={d.id} style={{ marginBottom: sp(3.5) }}>
          <Row between>
            <Row gap={2}>
              <Text style={{ fontSize: 16 }}>{d.emoji}</Text>
              <Overline style={{ color: d.color }}>{d.name}</Overline>
            </Row>
            <Button label="Edit" kind="ghost" small onPress={() => setEditing(d)} />
          </Row>
          <Creed style={{ marginTop: sp(2.5) }}>
            {d.identity_statement || 'Tap Edit to write who you are here.'}
          </Creed>

          {d.vision ? (
            <View style={[s.block, { borderLeftColor: colors.accentBright, backgroundColor: colors.accentFaint }]}>
              <Tiny style={{ color: colors.accentBright, marginBottom: sp(1) }}>5-YEAR VISION — IF I COMPOUND</Tiny>
              <Sub style={{ color: colors.text }}>{d.vision}</Sub>
            </View>
          ) : null}
          {d.anti_vision ? (
            <View style={[s.block, { borderLeftColor: colors.decay, backgroundColor: colors.decayFaint }]}>
              <Tiny style={{ color: colors.decay, marginBottom: sp(1) }}>INVERSION — IF I DRIFT</Tiny>
              <Sub>{d.anti_vision}</Sub>
            </View>
          ) : null}
        </Card>
      ))}

      <Spacer h={2} />
      <Overline>Life goals</Overline>
      <Spacer h={2} />
      {goals.map((g) => (
        <Card key={g.id} style={s.goalRow}>
          <Pressable
            onPress={() => setGoal.mutate({ id: g.id, patch: { done: !g.done } })}
            hitSlop={6}
            style={[s.goalCheck, g.done && { backgroundColor: colors.accent, borderColor: colors.accent }]}
          >
            {g.done ? <Text style={s.goalCheckMark}>✓</Text> : null}
          </Pressable>
          <Body
            style={[
              { flex: 1 },
              g.done && { color: colors.muted, textDecorationLine: 'line-through' },
            ]}
          >
            {g.title}
          </Body>
          <Pressable onPress={() => deleteGoal.mutate(g.id)} hitSlop={8}>
            <Text style={s.remove}>✕</Text>
          </Pressable>
        </Card>
      ))}
      <Field
        value={goalInput}
        onChangeText={setGoalInput}
        placeholder="Add a life goal and press return…"
        returnKeyType="done"
        onSubmitEditing={() => {
          if (goalInput.trim()) {
            addGoal.mutate({ title: goalInput.trim(), domainId: null });
            setGoalInput('');
          }
        }}
      />

      <Spacer h={2} />
      <Text style={s.footerQuote}>
        “Invert, always invert.” Know the cliff precisely — then walk the ridge.
      </Text>

      <EditDomainModal domain={editing} onClose={() => setEditing(null)} />
    </Screen>
  );
}

function EditDomainModal({ domain, onClose }: { domain: Domain | null; onClose: () => void }) {
  const updateDomain = useUpdateDomain();
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('');
  const [identity, setIdentity] = useState('');
  const [vision, setVision] = useState('');
  const [anti, setAnti] = useState('');

  // Sync form state when a domain is selected.
  const [openedFor, setOpenedFor] = useState<string | null>(null);
  if (domain && openedFor !== domain.id) {
    setOpenedFor(domain.id);
    setName(domain.name);
    setEmoji(domain.emoji);
    setIdentity(domain.identity_statement);
    setVision(domain.vision);
    setAnti(domain.anti_vision);
  } else if (!domain && openedFor) {
    setOpenedFor(null);
  }

  const save = () => {
    if (!domain) return;
    updateDomain.mutate({
      id: domain.id,
      patch: {
        name: name.trim() || domain.name,
        emoji: emoji.trim() || domain.emoji,
        identity_statement: identity.trim(),
        vision: vision.trim(),
        anti_vision: anti.trim(),
      },
    });
    onClose();
  };

  return (
    <Modal visible={!!domain} animationType="slide" onRequestClose={onClose}>
      <Screen topInset>
        <Row between>
          <Serif>Edit {domain?.name}</Serif>
          <Button label="Cancel" kind="ghost" small onPress={onClose} />
        </Row>
        <Spacer h={4} />
        <Row gap={3}>
          <View style={{ flex: 2 }}>
            <Field label="Name" value={name} onChangeText={setName} />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Emoji" value={emoji} onChangeText={setEmoji} />
          </View>
        </Row>
        <Field
          label="I am… (identity, present tense)"
          value={identity}
          onChangeText={setIdentity}
          multiline
          placeholder="I am someone who…"
        />
        <Field
          label="5-year vision — if I compound"
          value={vision}
          onChangeText={setVision}
          multiline
        />
        <Field
          label="Inversion — who I refuse to become"
          value={anti}
          onChangeText={setAnti}
          multiline
        />
        <Button label="Save" onPress={save} loading={updateDomain.isPending} />
      </Screen>
    </Modal>
  );
}

const s = StyleSheet.create({
  block: {
    borderLeftWidth: 2,
    borderRadius: radius.sm,
    paddingVertical: sp(2.5),
    paddingHorizontal: sp(3),
    marginTop: sp(3),
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(3),
    paddingVertical: sp(3),
    marginBottom: sp(2),
  },
  goalCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalCheckMark: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  remove: { color: colors.muted, fontSize: 15, padding: sp(1) },
  footerQuote: {
    fontFamily: font.serifItalic,
    fontSize: 13.5,
    color: colors.muted,
    textAlign: 'center',
    marginTop: sp(4),
  },
});
