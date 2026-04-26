import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { useState } from "react";
import {
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
    router.push(route);
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
    colors: ["#667eea", "#764ba2"] as const,
  },
  {
    label: "Inventory",
    route: "/admin/inventory",
    icon: "cube-outline",
    colors: ["#f7971e", "#ffd200"] as const,
  },
  {
    label: "Appointments",
    route: "/admin/appointments",
    icon: "calendar-outline",
    colors: ["#00c6ff", "#0072ff"] as const,
  },
  {
    label: "Orders",
    route: "/admin/orders",
    icon: "cart-outline",
    colors: ["#11998e", "#38ef7d"] as const,
  },
];

  return (
    <View style={styles.container}>

      {/* 🔥 TOP ADMIN CARD */}
      <View style={styles.topCard}>
        <Text style={styles.adminText}>Admin</Text>
        <Ionicons name="shield-checkmark" size={40} color="#000" style={{ opacity: 0.6 }} />
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content}>

        {/* GRID */}
        <View style={styles.grid}>
          {items.map((item) => (
            <TouchableOpacity
              key={item.route}
              style={styles.gridItem}
              activeOpacity={0.85}
              onPress={() => handlePress(item.route as AdminRoute)}
            >
              <LinearGradient
                 colors={item.colors}
                style={styles.card}
              >
                <Ionicons
                  name={item.icon as any}
                  size={36}
                  color="#fff"
                  style={{ marginBottom: 10, opacity: 0.9 }}
                />

                <Text style={styles.cardText}>{item.label}</Text>
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
    backgroundColor: "#F4F6F9",
    paddingTop: 60,
    paddingHorizontal: 16,
  },

  /* 🔥 TOP CARD */
  topCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    elevation: 3,
  },

  adminText: {
    fontSize: 20,
    fontWeight: "700",
  },

  logoutButton: {
    alignSelf: "flex-end",
    backgroundColor: "#111",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 10,
  },

  logoutText: {
    color: "#fff",
    fontWeight: "600",
  },

  content: {
    paddingBottom: 30,
  },

  /* GRID */
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  gridItem: {
    width: "48%",
    marginBottom: 14,
  },

  card: {
    height: 130,
    borderRadius: 18,
    padding: 16,
    justifyContent: "center",
    alignItems: "center",
  },

  cardText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
});