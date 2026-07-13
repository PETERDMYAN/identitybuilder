// Design tokens — dark, calm, "observatory at dusk".
// GXS purple = the compounding-up path (vision): vivid #771FFF for fills,
// lavender #AF89F4 for text/lines on dark. Ember red = the decay path (anti-vision).

export const colors = {
  bg: '#0B0F12',
  surface: '#12181E',
  raised: '#182028',
  overlay: '#1E2833',
  border: '#232D37',
  borderSoft: '#1A222B',

  text: '#ECF1F6',
  sub: '#9AA8B6',
  muted: '#5E6D7B',

  accent: '#771FFF',
  accentBright: '#AF89F4',
  accentFaint: 'rgba(175, 137, 244, 0.12)',
  decay: '#C2564E',
  decayFaint: 'rgba(194, 86, 78, 0.10)',

  green: '#63C69B',
  danger: '#D96A5F',

  // default domain palette
  health: '#63C69B',
  knowledge: '#6B9FE8',
  relationships: '#E58BA0',
};

export const font = {
  serif: 'Fraunces_600SemiBold',
  serifMed: 'Fraunces_500Medium',
  serifItalic: 'Fraunces_400Regular_Italic',
  sans: 'Inter_400Regular',
  sansMed: 'Inter_500Medium',
  sansSemi: 'Inter_600SemiBold',
  sansBold: 'Inter_700Bold',
};

export const radius = { sm: 10, md: 14, lg: 20, xl: 28 };

/** 4pt spacing scale: sp(4) = 16 */
export const sp = (n: number) => n * 4;

export const hairline = { borderWidth: 1, borderColor: colors.border };
