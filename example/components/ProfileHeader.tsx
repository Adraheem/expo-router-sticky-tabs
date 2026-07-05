import { Pressable, StyleSheet, Text, View } from 'react-native';

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

/** An Instagram-style profile header: avatar, stats, bio and actions. */
export function ProfileHeader() {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>RA</Text>
        </View>
        <View style={styles.stats}>
          <Stat value="248" label="Posts" />
          <Stat value="18.2k" label="Followers" />
          <Stat value="312" label="Following" />
        </View>
      </View>

      <Text style={styles.name}>Raheem Adebayo</Text>
      <Text style={styles.bio}>
        Principal RN architect · building sticky tabs for Expo Router 📱{'\n'}
        Swipe the tabs · scroll to collapse the header
      </Text>

      <View style={styles.actions}>
        <Pressable style={[styles.button, styles.primary]}>
          <Text style={styles.primaryText}>Follow</Text>
        </Pressable>
        <Pressable style={[styles.button, styles.secondary]}>
          <Text style={styles.secondaryText}>Message</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, backgroundColor: '#fff' },
  topRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#405de6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '700' },
  stats: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '700', color: '#111' },
  statLabel: { fontSize: 13, color: '#666' },
  name: { marginTop: 12, fontSize: 16, fontWeight: '700', color: '#111' },
  bio: { marginTop: 4, fontSize: 14, lineHeight: 20, color: '#333' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  button: { flex: 1, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  primary: { backgroundColor: '#0095f6' },
  primaryText: { color: '#fff', fontWeight: '700' },
  secondary: { backgroundColor: '#efefef' },
  secondaryText: { color: '#111', fontWeight: '700' },
});
