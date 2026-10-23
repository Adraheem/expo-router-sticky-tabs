import { Tabs } from 'expo-router-sticky-tabs';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const DATA = Array.from({ length: 30 }, (_, i) => i);

/** A plain list of rows for the extra demo tabs. Pads itself into the safe area. */
export function DemoList({ label, hue }: { label: string; hue: number }) {
  const { left, right } = useSafeAreaInsets();

  return (
    <Tabs.ScrollView
      contentContainerStyle={[
        styles.content,
        { paddingLeft: 12 + left, paddingRight: 12 + right },
      ]}>
      {DATA.map((i) => (
        <View
          key={i}
          style={[styles.row, { backgroundColor: `hsl(${hue} 50% ${90 - (i % 5) * 4}%)` }]}>
          <Text style={styles.text}>
            {label} #{i + 1}
          </Text>
        </View>
      ))}
    </Tabs.ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingVertical: 12, gap: 8, paddingBottom: 24 },
  row: { height: 64, borderRadius: 12, paddingHorizontal: 16, justifyContent: 'center' },
  text: { color: 'rgba(0,0,0,0.6)', fontWeight: '600' },
});
