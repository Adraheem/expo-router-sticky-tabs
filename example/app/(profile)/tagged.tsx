import { Tabs } from 'expo-router-sticky-tabs';
import { StyleSheet, Text, View } from 'react-native';

const DATA = Array.from({ length: 30 }, (_, i) => i);

export default function Tagged() {
  return (
    <Tabs.FlatList
      data={DATA}
      keyExtractor={(i) => `tag-${i}`}
      numColumns={2}
      contentContainerStyle={styles.content}
      columnWrapperStyle={styles.row}
      renderItem={({ item }) => (
        <View style={[styles.card, { backgroundColor: `hsl(${(item * 48) % 360} 50% 78%)` }]}>
          <Text style={styles.tag}>◎ tagged {item + 1}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  content: { padding: 8, paddingBottom: 24 },
  row: { gap: 8 },
  card: {
    flex: 1,
    height: 150,
    borderRadius: 12,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tag: { color: 'rgba(0,0,0,0.5)', fontWeight: '700' },
});
