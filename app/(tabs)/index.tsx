import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function Home() {
  const router = useRouter();

  const now = new Date();
  const hour = now.getHours();
  const isOpen = hour >= 9 && hour < 18;

  return (
    <View style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>MotoVision</Text>

        <TouchableOpacity
          onPress={() => router.push("/customer/profile")}
        >
          <Ionicons name="person-circle-outline" size={34} color="#333" />
        </TouchableOpacity>
      </View>

      {/* STATUS CARD */}
      <View style={styles.card}>
        <Image
          source={require("../../assets/images/garage.jpg")}
          style={styles.image}
        />

        <View style={styles.textContainer}>
          <Text style={styles.label}>Gaijin Garage is</Text>
          <Text style={styles.time}>9:00 AM – 6:00 PM</Text>
        </View>

        <Text
          style={[
            styles.status,
            isOpen ? styles.open : styles.closed,
          ]}
        >
          {isOpen ? "OPEN" : "CLOSED"}
        </Text>
      </View>

      {/* 🔥 AR EXPERIENCE CARD */}
      <TouchableOpacity
        onPress={() => router.push("../ar/ar")}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={["#0F2027", "#203A43", "#2C5364"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.arCard}
        >
          <View style={styles.glow} />

          <View style={styles.arTextContainer}>
            <Text style={styles.arTitle}>AR Experience</Text>
            <Text style={styles.arSubtitle}>
              Visualize motorcycles in real space
            </Text>

            <View style={styles.arButton}>
              <Text style={styles.arButtonText}>Try Now</Text>
              <Ionicons name="arrow-forward" size={14} color="#fff" />
            </View>
          </View>

          <Image
            source={require("../../assets/images/motorcycle.jpg")}
            style={styles.arImage}
          />
        </LinearGradient>
      </TouchableOpacity>

      {/* 🔥 ACTION CARDS */}
      <View style={styles.row}>

        {/* APPOINTMENT */}
        <TouchableOpacity
          style={styles.squareWrapper}
          activeOpacity={0.85}
          onPress={() => router.push("../customer/appointment")}
        >
          <LinearGradient
            colors={["#FFB347", "#FF7E00"]}
            style={styles.squareCard}
          >
            <Image
              source={require("../../assets/images/appointment.jpg")}
              style={styles.squareImage}
            />
            <Text style={styles.squareText}>Make Appointment</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* HISTORY */}
        <TouchableOpacity
          style={styles.squareWrapper}
          activeOpacity={0.85}
          onPress={() => router.push("../customer/history")}
        >
          <LinearGradient
            colors={["#A8E6CF", "#56C596"]}
            style={styles.squareCard}
          >
            <Image
              source={require("../../assets/images/history.jpg")}
              style={styles.squareImage}
            />
            <Text style={styles.squareText}>History</Text>
          </LinearGradient>
        </TouchableOpacity>

      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FB",
    padding: 16,
    paddingTop: 60,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    elevation: 3,
    marginBottom: 16,
  },

  image: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 10,
  },

  textContainer: {
    flex: 1,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
  },

  time: {
    fontSize: 12,
    color: "gray",
  },

  status: {
    fontSize: 13,
    fontWeight: "700",
  },

  open: {
    color: "#2ECC71",
  },

  closed: {
    color: "#E53935",
  },

  /* AR CARD */
  arCard: {
    borderRadius: 22,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    overflow: "hidden",
  },

  glow: {
    position: "absolute",
    right: -30,
    top: -30,
    width: 160,
    height: 160,
    backgroundColor: "#00D4FF",
    borderRadius: 100,
    opacity: 0.15,
  },

  arTextContainer: {
    flex: 1,
  },

  arTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 6,
  },

  arSubtitle: {
    fontSize: 13,
    color: "#CDE7FF",
    marginBottom: 12,
  },

  arButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    alignSelf: "flex-start",
  },

  arButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },

  arImage: {
    width: 120,
    height: 80,
    resizeMode: "contain",
    opacity: 0.9,
    transform: [{ rotate: "-5deg" }],
  },

  /* ACTION CARDS */
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },

  squareWrapper: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 20,
    overflow: "hidden",
  },

  squareCard: {
    height: 140,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  squareImage: {
    position: "absolute",
    width: 160,
    height: 150,
    opacity: 0.45,
  },

  squareText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
});