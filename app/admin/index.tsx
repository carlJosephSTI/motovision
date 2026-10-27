import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { useState } from "react";
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
  | "/admin/dashboard"
  | "/admin/inventory"
  | "/admin/appointments"
  | "/admin/orders";

export default function AdminHome() {
  const router = useRouter();
  const [activeButton, setActiveButton] = useState<AdminRoute | null>(null);

  const handlePress = (route: AdminRoute) => {
    setActiveButton(route);
    router.replace(route);
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.replace("/(auth)/login");
  };

  const items = [
    {
      label: "Dashboard",
      route: "/admin/dashboard",
      icon: "grid-outline",
      colors: ["#00AEEF", "#0077B6"] as const,
    },
    {
      label: "Inventory",
      route: "/admin/inventory",
      icon: "cube-outline",
      colors: ["#F7971E", "#FFD200"] as const,
    },
    {
      label: "Appointments",
      route: "/admin/appointments",
      icon: "calendar-outline",
      colors: ["#7F5AF0", "#6246EA"] as const,
    },
    {
      label: "Orders",
      route: "/admin/orders",
      icon: "cart-outline",
      colors: ["#11998E", "#38EF7D"] as const,
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <ImageBackground
          source={require("../../assets/images/adminMotorPic.jpg")}
          style={styles.heroCard}
          imageStyle={styles.heroImage}
        >
          <View style={styles.heroOverlay}>
            <View style={styles.heroTop}>
              <View>
                <Text style={styles.kicker}>ADMIN PANEL</Text>
                <Text style={styles.heroTitle}>MotoVision</Text>
                <Text style={styles.heroSubtitle}>
                  Manage products, orders, and appointments
                </Text>
              </View>

              <View style={styles.shieldBox}>
                <Ionicons name="shield-checkmark" size={30} color="#FFFFFF" />
              </View>
            </View>
          </View>
        </ImageBackground>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={18} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Quick Access</Text>

        <View style={styles.grid}>
          {items.map((item) => (
            <TouchableOpacity
              key={item.route}
              style={styles.gridItem}
              activeOpacity={0.88}
              onPress={() => handlePress(item.route as AdminRoute)}
            >
              <LinearGradient
                colors={item.colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.card}
              >
                <View style={styles.cardGlow} />

                <Ionicons
                  name={item.icon as any}
                  size={36}
                  color="#fff"
                  style={styles.cardIcon}
                />

                <Text style={styles.cardText}>{item.label}</Text>

                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color="rgba(255,255,255,0.9)"
                  style={styles.arrow}
                />
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F7FB",
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 54,
    paddingBottom: 120,
  },

  heroCard: {
    height: 180,
    borderRadius: 30,
    overflow: "hidden",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#D9E2EC",
    shadowColor: "#00AEEF",
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 6,
  },

  heroImage: {
    borderRadius: 30,
    resizeMode: "cover",
  },

  heroOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    padding: 20,
    justifyContent: "space-between",
  },

  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  kicker: {
    color: "#7DD3FC",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.3,
    marginBottom: 6,
  },

  heroTitle: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "900",
  },

  heroSubtitle: {
    marginTop: 4,
    color: "#D1D5DB",
    fontSize: 13,
    fontWeight: "700",
    maxWidth: 220,
    lineHeight: 18,
  },

  shieldBox: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },

  logoutButton: {
    alignSelf: "flex-end",
    backgroundColor: "#111827",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    shadowColor: "#111827",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },

  logoutText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 13,
  },

  sectionTitle: {
    color: "#111827",
    fontSize: 19,
    fontWeight: "900",
    marginBottom: 14,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  gridItem: {
    width: "48%",
    marginBottom: 15,
  },

  card: {
    height: 145,
    borderRadius: 24,
    padding: 18,
    justifyContent: "space-between",
    overflow: "hidden",
    shadowColor: "#111827",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },

  cardGlow: {
    position: "absolute",
    right: -20,
    bottom: -20,
    width: 110,
    height: 110,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)",
  },

  cardIcon: {
    opacity: 0.95,
  },

  cardText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
  },

  arrow: {
    position: "absolute",
    right: 16,
    bottom: 16,
  },
});