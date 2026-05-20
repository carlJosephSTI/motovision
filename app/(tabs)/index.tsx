import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  Image,
  ImageBackground,
  SafeAreaView,
  ScrollView,
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
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* HEADER HERO */}
        <ImageBackground
          source={require("../../assets/images/garageBGneon.jpg")}
          style={styles.headerHero}
          imageStyle={styles.headerHeroImage}
        >
          <View style={styles.headerOverlay}>
            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => router.push("/customer/profile")}
            >
              <Ionicons name="person-circle-outline" size={38} color="#fff" />
            </TouchableOpacity>

            <View>
              <Text style={styles.title}>MotoVision</Text>
              <Text style={styles.subtitle}>Customize. Preview. Ride.</Text>
            </View>
          </View>
        </ImageBackground>

        {/* STATUS CARD */}
        <View style={styles.statusCard}>
          <Image
            source={require("../../assets/images/GGlogo.jpg")}
            style={styles.garageImage}
          />

          <View style={styles.textContainer}>
            <Text style={styles.partnerLabel}>PARTNER GARAGE</Text>
            <Text style={styles.label}>Gaijin Garage</Text>
            <Text style={styles.time}>9:00 AM – 6:00 PM</Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              isOpen ? styles.openBadge : styles.closedBadge,
            ]}
          >
            <Text style={[styles.status, isOpen ? styles.open : styles.closed]}>
              {isOpen ? "OPEN" : "CLOSED"}
            </Text>
          </View>
        </View>

        {/* AR EXPERIENCE */}
        <TouchableOpacity
          onPress={() => router.push("../ar/ar")}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={["#06131C", "#082335", "#0B111A"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.arCard}
          >
            <View style={styles.arGridGlow} />
            <View style={styles.arBlueGlow} />

            <View style={styles.arTextContainer}>
              <Text style={styles.arLabel}>FEATURED</Text>
              <Text style={styles.arTitle}>AR Experience</Text>
              <Text style={styles.arSubtitle}>
                Preview motorcycle parts before installation
              </Text>

              <View style={styles.arButton}>
                <Text style={styles.arButtonText}>Try Now</Text>
                <Ionicons name="arrow-forward" size={15} color="#fff" />
              </View>
            </View>

            <Image
              source={require("../../assets/images/motorcycle.jpg")}
              style={styles.arImage}
            />
          </LinearGradient>
        </TouchableOpacity>

        {/* SERVICES */}
        <Text style={styles.sectionTitle}>Garage Services</Text>

        <View style={styles.row}>
          {/* APPOINTMENT */}
          <TouchableOpacity
            style={[styles.serviceCard, styles.orangeService]}
            activeOpacity={0.85}
            onPress={() => router.push("../customer/appointment")}
          >
            <View style={styles.orangeGlow} />

            <Text style={styles.serviceTagOrange}>SERVICE</Text>

            <View style={[styles.serviceIconBox, styles.orangeIconBox]}>
              <Ionicons name="calendar-outline" size={28} color="#F9A825" />
            </View>

            <Text style={styles.serviceTitle}>Make Appointment</Text>
            <Text style={styles.serviceSubtitle}>
              Schedule garage services
            </Text>

            <Ionicons
              name="arrow-forward"
              size={22}
              color="#F9A825"
              style={styles.cardArrow}
            />
          </TouchableOpacity>

          {/* HISTORY */}
          <TouchableOpacity
            style={[styles.serviceCard, styles.greenService]}
            activeOpacity={0.85}
            onPress={() => router.push("../customer/history")}
          >
            <View style={styles.greenGlow} />

            <Text style={styles.serviceTagGreen}>RECORDS</Text>

            <View style={[styles.serviceIconBox, styles.greenIconBox]}>
              <Ionicons name="receipt-outline" size={28} color="#42E695" />
            </View>

            <Text style={styles.serviceTitle}>History</Text>
            <Text style={styles.serviceSubtitle}>
              View orders and records
            </Text>

            <Ionicons
              name="arrow-forward"
              size={22}
              color="#42E695"
              style={styles.cardArrow}
            />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#07090D",
  },

  scrollContent: {
    padding: 16,
    paddingTop: 40,
    paddingBottom: 140,
  },

  headerHero: {
    height: 170,
    borderRadius: 26,
    overflow: "hidden",
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#253241",
  },

  headerHeroImage: {
    borderRadius: 26,
    resizeMode: "cover",
  },

  headerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.38)",
    padding: 20,
    justifyContent: "flex-end",
  },

  profileButton: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },

  title: {
    fontSize: 40,
    fontWeight: "900",
    color: "#FFFFFF",
    fontStyle: "italic",
    textShadowColor: "rgba(0,0,0,0.9)",
    textShadowOffset: { width: 2, height: 3 },
    textShadowRadius: 8,
  },

  subtitle: {
    fontSize: 14,
    color: "#C8F5FF",
    fontWeight: "800",
    fontStyle: "italic",
    marginTop: 2,
    textShadowColor: "rgba(0,0,0,0.9)",
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 6,
  },

  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#11161D",
    borderRadius: 20,
    padding: 12,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#222B36",
  },

  garageImage: {
    width: 72,
    height: 72,
    borderRadius: 16,
    marginRight: 12,
    backgroundColor: "#fff",
  },

  textContainer: {
    flex: 1,
  },

  partnerLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: "#8CA3B8",
    letterSpacing: 1,
    marginBottom: 4,
  },

  label: {
    fontSize: 17,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  time: {
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: 3,
  },

  statusBadge: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },

  openBadge: {
    backgroundColor: "rgba(46, 204, 113, 0.15)",
  },

  closedBadge: {
    backgroundColor: "rgba(229, 57, 53, 0.15)",
  },

  status: {
    fontSize: 12,
    fontWeight: "900",
  },

  open: {
    color: "#2ECC71",
  },

  closed: {
    color: "#FF5252",
  },

  arCard: {
    minHeight: 150,
    borderRadius: 24,
    padding: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#008FD6",
  },

  arGridGlow: {
    position: "absolute",
    right: -20,
    bottom: -30,
    width: 230,
    height: 150,
    backgroundColor: "#00D4FF",
    opacity: 0.08,
    borderRadius: 120,
  },

  arBlueGlow: {
    position: "absolute",
    right: 35,
    top: 30,
    width: 150,
    height: 150,
    backgroundColor: "#00D4FF",
    borderRadius: 100,
    opacity: 0.13,
  },

  arTextContainer: {
    flex: 1,
    zIndex: 2,
  },

  arLabel: {
    fontSize: 11,
    fontWeight: "900",
    color: "#00D4FF",
    letterSpacing: 1,
    marginBottom: 8,
  },

  arTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#fff",
    marginBottom: 6,
  },

  arSubtitle: {
    fontSize: 13,
    color: "#CDE7FF",
    marginBottom: 14,
    lineHeight: 18,
    maxWidth: 180,
  },

  arButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "rgba(0, 212, 255, 0.14)",
    paddingVertical: 8,
    paddingHorizontal: 13,
    borderRadius: 12,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "rgba(0,212,255,0.4)",
  },

  arButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
  },

  arImage: {
    position: "absolute",
    right: -18,
    bottom: 8,
    width: 215,
    height: 155,
    resizeMode: "contain",
    opacity: 0.48,
    tintColor: "#00D4FF",
    transform: [{ rotate: "-3deg" }],
  },

  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 20,
    marginBottom: 12,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  serviceCard: {
    flex: 1,
    minHeight: 165,
    backgroundColor: "#11161D",
    borderRadius: 22,
    padding: 16,
    marginHorizontal: 4,
    borderWidth: 1,
    justifyContent: "center",
    overflow: "hidden",
  },

  orangeService: {
    borderColor: "rgba(249,168,37,0.35)",
  },

  greenService: {
    borderColor: "rgba(66,230,149,0.35)",
  },

  orangeGlow: {
    position: "absolute",
    right: -35,
    bottom: -35,
    width: 110,
    height: 110,
    backgroundColor: "#F9A825",
    borderRadius: 80,
    opacity: 0.14,
  },

  greenGlow: {
    position: "absolute",
    right: -35,
    bottom: -35,
    width: 110,
    height: 110,
    backgroundColor: "#42E695",
    borderRadius: 80,
    opacity: 0.14,
  },

  serviceTagOrange: {
    color: "#F9A825",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 10,
  },

  serviceTagGreen: {
    color: "#42E695",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 10,
  },

  serviceIconBox: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: "#090B0F",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
    borderWidth: 1,
  },

  orangeIconBox: {
    borderColor: "rgba(249,168,37,0.45)",
  },

  greenIconBox: {
    borderColor: "rgba(66,230,149,0.45)",
  },

  serviceTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 5,
  },

  serviceSubtitle: {
    color: "#9CA3AF",
    fontSize: 12,
    lineHeight: 16,
    paddingRight: 10,
  },

  cardArrow: {
    position: "absolute",
    right: 16,
    bottom: 16,
  },
});