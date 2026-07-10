import { Tabs } from 'expo-router-sticky-tabs';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

const DATA = Array.from({ length: 60 }, (_, i) => i);

export default function Posts() {
  const { width } = useWindowDimensions();
  const size = width / 3;

  return (
    <Tabs.FlatList
      data={DATA}
      keyExtractor={(i) => `post-${i}`}
      numColumns={3}
      contentContainerStyle={styles.content}
      renderItem={({ item }) => (
        <View
          style={[
            styles.cell,
            { width: size, height: size, backgroundColor: `hsl(${(item * 24) % 360} 55% 72%)` },
          ]}>
          <Text style={styles.index}>{item + 1}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 24 },
  cell: { alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#fff' },
  index: { color: 'rgba(0,0,0,0.35)', fontWeight: '700' },
});
