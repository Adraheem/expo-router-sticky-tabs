import { Text, type ColorValue } from 'react-native';

// Lightweight emoji icons so the example needs no icon-font dependency.
function makeIcon(glyph: string) {
  return function Icon({ color, size }: { focused: boolean; color: ColorValue; size: number }) {
    return <Text style={{ fontSize: size, color, opacity: 0.9 }}>{glyph}</Text>;
  };
}

export const GridIcon = makeIcon('▦');
export const ReelsIcon = makeIcon('▷');
export const TaggedIcon = makeIcon('◎');
