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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Dashboard</Text>

      <View style={styles.card}>
        <Text style={styles.number}>{users}</Text>
        <Text>Total Users</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.number}>{products}</Text>
        <Text>Total Products</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.number}>{orders}</Text>
        <Text>Total Orders</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.number}>{appointments}</Text>
        <Text>Total Appointments</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: "#F4F6F9" },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 20 },
  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    marginBottom: 15,
    elevation: 3,
  },
  number: {
    fontSize: 28,
    fontWeight: "bold",
  },
});