import { StyleSheet, Text, View } from "react-native";

export default function ARScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>AR Viewer</Text>
      <Text style={styles.subtitle}>
        AR setup is being rebuilt without expo-three.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FB",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
});