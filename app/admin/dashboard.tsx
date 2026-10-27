import { Ionicons } from "@expo/vector-icons";
import { collection, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { db } from "../../firebaseConfig";

export default function Dashboard() {
  const [users, setUsers] = useState(0);
  const [products, setProducts] = useState(0);
  const [orders, setOrders] = useState(0);
  const [appointments, setAppointments] = useState(0);

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      setUsers(snap.size);
    });

    const unsubProducts = onSnapshot(collection(db, "products"), (snap) => {
      setProducts(snap.size);
    });

    const unsubOrders = onSnapshot(collection(db, "orders"), (snap) => {
      setOrders(snap.size);
    });

    const unsubAppointments = onSnapshot(collection(db, "appointments"), (snap) => {
      setAppointments(snap.size);
    });

    return () => {
      unsubUsers();
      unsubProducts();
      unsubOrders();
      unsubAppointments();
    };
  }, []);

  const cards = [
    { label: "Total Users", value: users, icon: "people-outline", color: "#00AEEF" },
    { label: "Total Products", value: products, icon: "cube-outline", color: "#E50914" },
    { label: "Total Orders", value: orders, icon: "receipt-outline", color: "#F9A825" },
    { label: "Total Appointments", value: appointments, icon: "calendar-outline", color: "#42E695" },
  ];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerCard}>
        <View>
          <Text style={styles.kicker}>ADMIN PANEL</Text>
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.subtitle}>MotoVision system overview</Text>
        </View>

        <View style={styles.adminBadge}>
          <Ionicons name="construct-outline" size={24} color="#00AEEF" />
        </View>
      </View>

      <View style={styles.grid}>
        {cards.map((item) => (
          <View key={item.label} style={styles.card}>
            <View
              style={[
                styles.iconBox,
                {
                  backgroundColor: `${item.color}18`,
                  borderColor: `${item.color}55`,
                },
              ]}
            >
              <Ionicons name={item.icon as any} size={25} color={item.color} />
            </View>

            <Text style={styles.number}>{item.value}</Text>
            <Text style={styles.label}>{item.label}</Text>

            <View style={[styles.neonLine, { backgroundColor: item.color }]} />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F4F7FB",
  },

  container: {
    padding: 20,
    paddingTop: 54,
    paddingBottom: 120,
  },

  headerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E5EAF0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#00AEEF",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 5,
  },

  kicker: {
    color: "#00AEEF",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginBottom: 5,
  },

  title: {
    fontSize: 30,
    fontWeight: "900",
    color: "#111827",
  },

  subtitle: {
    marginTop: 3,
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "700",
  },

  adminBadge: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: "rgba(0,174,239,0.10)",
    borderWidth: 1,
    borderColor: "rgba(0,174,239,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  card: {
    width: "48%",
    minHeight: 155,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E5EAF0",
    shadowColor: "#111827",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    overflow: "hidden",
  },

  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },

  number: {
    fontSize: 32,
    fontWeight: "900",
    color: "#111827",
  },

  label: {
    marginTop: 4,
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "800",
  },

  neonLine: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 0,
    height: 4,
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
  },
});