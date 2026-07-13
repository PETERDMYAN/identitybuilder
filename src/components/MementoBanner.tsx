import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { INVERSION_PREFIX } from '@/lib/content';
import { colors, font, radius, sp } from '@/lib/theme';
import { Domain } from '@/lib/types';

/**
 * Inversion, used gently: a quiet reminder of where skipped days lead.
 * The cliff you map so you can walk the ridge.
 */
export function MementoBanner({ domain }: { domain: Domain }) {
  if (!domain.anti_vision.trim()) return null;
  const text = domain.anti_vision.trim();
  const snippet = text.length > 120 ? `${text.slice(0, 120).trimEnd()}…` : text;
  return (
    <View style={s.box}>
      <Text style={s.prefix}>
        {INVERSION_PREFIX} {domain.emoji} {domain.name}
      </Text>
      <Text style={s.body}>“{snippet}”</Text>
    </View>
  );
}

const s = StyleSheet.create({
  box: {
    borderLeftWidth: 2,
    borderLeftColor: colors.decay,
    backgroundColor: colors.decayFaint,
    borderRadius: radius.sm,
    paddingVertical: sp(2.5),
    paddingHorizontal: sp(3),
    marginTop: sp(3),
  },
  prefix: {
    fontFamily: font.sansSemi,
    fontSize: 10.5,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: 'rgba(194, 86, 78, 0.85)',
    marginBottom: sp(1),
  },
  body: {
    fontFamily: font.serifItalic,
    fontSize: 13.5,
    lineHeight: 19,
    color: '#B39A98',
  },
});
