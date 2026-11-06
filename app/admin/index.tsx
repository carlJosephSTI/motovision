
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import {
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { auth } from "../../firebaseConfig";

type AdminRoute =
  | "/admin/inventory"
  | "/admin/appointments"
  | "/admin/mechanics";

export default function AdminHome() {
  const router = useRouter();

  const handlePress = (route: AdminRoute) => {
    router.push(route);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/(auth)/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const items = [
    {
      label: "Inventory",
      subtitle: "Manage motorcycle parts",
      route: "/admin/inventory" as const,
      icon: "cube-outline" as const,
      colors: ["#20C4F4", "#0879D9"] as const,
      accent: "#0879D9",
      number: "01",
    },
    {
      label: "Appointments",
      subtitle: "Manage customer bookings",
      route: "/admin/appointments" as const,
      icon: "calendar-outline" as const,
      colors: ["#A78BFA", "#6D4AFF"] as const,
      accent: "#6D4AFF",
      number: "02",
    },
    {
      label: "Manage Mechanics",
      subtitle: "Authorize and manage repairers",
      route: "/admin/mechanics" as const,
      icon: "people-outline" as const,
      colors: ["#34D399", "#059669"] as const,
      accent: "#059669",
      number: "03",
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.topBar}>
          <View style={styles.brandMark}>
            <Ionicons
              name="speedometer-outline"
              size={25}
              color="#FFFFFF"
            />
          </View>

          <View style={styles.brandText}>
            <Text style={styles.brandName}>MotoVision</Text>
            <Text style={styles.brandCaption}>ADMINISTRATION</Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.75}
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Ionicons
              name="log-out-outline"
              size={20}
              color="#334155"
            />
          </TouchableOpacity>
        </View>

        <ImageBackground
          source={require("../../assets/images/adminMotorPic.jpg")}
          style={styles.heroCard}
          imageStyle={styles.heroImage}
        >
          <LinearGradient
            colors={[
              "rgba(3, 19, 39, 0.12)",
              "rgba(3, 19, 39, 0.92)",
            ]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.heroOverlay}
          >
            <View style={styles.adminBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.adminBadgeText}>
                ADMIN CONTROL CENTER
              </Text>
            </View>

            <View>
              <Text style={styles.heroTitle}>
                Built for control.
              </Text>
              <Text style={styles.heroSubtitle}>
                Everything you need to keep MotoVision running.
              </Text>
            </View>

            <View style={styles.heroBottom}>
              <View style={styles.heroLine} />
              <Text style={styles.heroBottomText}>
                YOUR STORE. YOUR CONTROL.
              </Text>
            </View>
          </LinearGradient>
        </ImageBackground>

        <View style={styles.welcomeRow}>
          <View>
            <Text style={styles.eyebrow}>WORKSPACE</Text>
            <Text style={styles.sectionTitle}>
              What are we managing?
            </Text>
          </View>

          <View style={styles.sectionCount}>
            <Text style={styles.sectionCountNumber}>03</Text>
            <Text style={styles.sectionCountLabel}>SECTIONS</Text>
          </View>
        </View>

        <View style={styles.cards}>
          {items.map((item) => (
            <TouchableOpacity
              key={item.route}
              activeOpacity={0.88}
              style={styles.cardWrapper}
              onPress={() => handlePress(item.route)}
            >
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <LinearGradient
                    colors={item.colors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.iconBox}
                  >
                    <Ionicons
                      name={item.icon}
                      size={29}
                      color="#FFFFFF"
                    />
                  </LinearGradient>

                  <Text style={styles.cardNumber}>
                    {item.number}
                  </Text>
                </View>

                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>
                    {item.label}
                  </Text>
                  <Text style={styles.cardSubtitle}>
                    {item.subtitle}
                  </Text>
                </View>

                <View style={styles.cardFooter}>
                  <Text
                    style={[
                      styles.openText,
                      { color: item.accent },
                    ]}
                  >
                    Open section
                  </Text>

                  <View
                    style={[
                      styles.arrowCircle,
                      { backgroundColor: `${item.accent}12` },
                    ]}
                  >
                    <Ionicons
                      name="arrow-forward"
                      size={18}
                      color={item.accent}
                    />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.footer}>
          <View style={styles.footerDivider} />
          <Ionicons
            name="shield-checkmark-outline"
            size={16}
            color="#94A3B8"
          />
          <Text style={styles.footerText}>
            MOTOVISION ADMINISTRATION
          </Text>
          <View style={styles.footerDivider} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F7FC",
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 45,
  },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },

  brandMark: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: "#0879D9",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0879D9",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },

  brandText: {
    flex: 1,
    marginLeft: 12,
  },

  brandName: {
    fontSize: 21,
    fontWeight: "900",
    color: "#14243A",
    letterSpacing: -0.6,
  },

  brandCaption: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 2,
    color: "#64748B",
    marginTop: 3,
  },

  logoutButton: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E1E8F0",
    alignItems: "center",
    justifyContent: "center",
  },

  heroCard: {
    height: 245,
    borderRadius: 26,
    overflow: "hidden",
    marginBottom: 30,
    backgroundColor: "#10233D",
    shadowColor: "#153A60",
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 6,
  },

  heroImage: {
    resizeMode: "cover",
  },

  heroOverlay: {
    flex: 1,
    padding: 23,
    justifyContent: "space-between",
  },

  adminBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
    borderColor: "rgba(255,255,255,0.25)",
    borderWidth: 1,
    borderRadius: 30,
    paddingHorizontal: 11,
    paddingVertical: 8,
    gap: 7,
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 5,
    backgroundColor: "#5EEAD4",
  },

  adminBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.1,
  },

  heroTitle: {
    color: "#FFFFFF",
    fontSize: 29,
    fontWeight: "900",
    letterSpacing: -0.7,
  },

  heroSubtitle: {
    color: "#E2EAF5",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 7,
    maxWidth: 265,
  },

  heroBottom: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  heroLine: {
    width: 27,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#38BDF8",
  },

  heroBottomText: {
    color: "#D8E6F5",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.4,
  },

  welcomeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 17,
  },

  eyebrow: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2,
    color: "#0879D9",
    marginBottom: 6,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#14243A",
    letterSpacing: -0.5,
  },

  sectionCount: {
    alignItems: "flex-end",
  },

  sectionCountNumber: {
    fontSize: 22,
    fontWeight: "900",
    color: "#14243A",
  },

  sectionCountLabel: {
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: "#94A3B8",
    marginTop: 1,
  },

  cards: {
    gap: 15,
  },

  cardWrapper: {
    borderRadius: 23,
    backgroundColor: "#FFFFFF",
    shadowColor: "#1E3A5F",
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 3,
  },

  card: {
    minHeight: 184,
    padding: 20,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: "#E7EDF5",
    backgroundColor: "#FFFFFF",
    justifyContent: "space-between",
  },

  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  cardNumber: {
    fontSize: 13,
    fontWeight: "900",
    color: "#CBD5E1",
    letterSpacing: 1,
  },

  cardInfo: {
    marginTop: 18,
    marginBottom: 17,
  },

  cardTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#172B45",
    letterSpacing: -0.4,
  },

  cardSubtitle: {
    fontSize: 12,
    color: "#7A8BA1",
    marginTop: 5,
  },

  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#F0F3F8",
    paddingTop: 13,
  },

  openText: {
    fontSize: 12,
    fontWeight: "800",
  },

  arrowCircle: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 30,
  },

  footerDivider: {
    height: 1,
    backgroundColor: "#DCE5EF",
    flex: 1,
  },

  footerText: {
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: "#94A3B8",
  },
});
