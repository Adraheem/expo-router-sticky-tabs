import { Tabs } from 'expo-router-sticky-tabs';
import { StyleSheet, Text, View } from 'react-native';

const DATA = Array.from({ length: 24 }, (_, i) => i);

export default function Reels() {
  return (
    <Tabs.FlatList
      data={DATA}
      keyExtractor={(i) => `reel-${i}`}
      contentContainerStyle={styles.content}
      renderItem={({ item }) => (
        <View style={[styles.card, { backgroundColor: `hsl(${(item * 37) % 360} 45% 30%)` }]}>
          <Text style={styles.play}>▷</Text>
          <Text style={styles.caption}>Reel #{item + 1}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  content: { padding: 12, gap: 12, paddingBottom: 24 },
  card: {
    height: 220,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  play: { color: '#fff', fontSize: 44 },
  caption: { color: '#fff', marginTop: 8, fontWeight: '600' },
});
