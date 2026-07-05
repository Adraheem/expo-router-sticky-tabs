import { Redirect } from 'expo-router';

// The app opens straight into the Instagram-style profile.
export default function Index() {
  return <Redirect href="/posts" />;
}
