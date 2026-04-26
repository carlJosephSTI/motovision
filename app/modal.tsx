import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { router } from 'expo-router';
import { StyleSheet } from 'react-native';

export default function ModalScreen() {
  return (
    <ThemedView style={styles.container}>
  <ThemedText type="title">This is a modal</ThemedText>

  <ThemedText
    type="link"
    style={styles.link}
    onPress={() => router.back()}
  >
    Go to home screen
  </ThemedText>
</ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
