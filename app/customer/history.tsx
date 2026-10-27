import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function HistoryScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* TOP BAR / BACK BUTTON */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Service & Order History</Text>
        <Text style={styles.subtitle}>
          Track your past motorcycle customizations and garage appointments
        </Text>

        {/* PLACEHOLDER CARD */}
        <View style={styles.historyCard}>
          <View style={styles.greenGlow} />

          <View style={styles.iconBox}>
            <Ionicons name="receipt-outline" size={32} color="#42E695" />
          </View>

          <Text style={styles.cardTitle}>Your History Here</Text>
          <Text style={styles.cardSubtitle}>
            Completed appointments, purchases, and AR builds will appear in this section.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#07090D",
  },
  content: {
    padding: 16,
    paddingTop: 40,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: "#11161D",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#222B36",
    marginBottom: 20,
  },
  backText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#FFFFFF",
    fontStyle: "italic",
  },
  subtitle: {
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: 4,
    marginBottom: 24,
    lineHeight: 18,
  },
  historyCard: {
    backgroundColor: "#11161D",
    borderRadius: 22,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(66,230,149,0.35)",
    overflow: "hidden",
    marginTop: 10,
  },
  greenGlow: {
    position: "absolute",
    right: -40,
    bottom: -40,
    width: 130,
    height: 130,
    backgroundColor: "#42E695",
    borderRadius: 90,
    opacity: 0.12,
  },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: "#090B0F",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(66,230,149,0.45)",
  },
  cardTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 6,
  },
  cardSubtitle: {
    color: "#8CA3B8",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
});