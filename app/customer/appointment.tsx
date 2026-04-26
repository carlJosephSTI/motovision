import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
    addDoc,
    collection,
    onSnapshot,
    query,
    where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { auth, db } from "../../firebaseConfig";

export default function Appointment() {
  const router = useRouter();

  const [selectedService, setSelectedService] = useState("");
  const [notes, setNotes] = useState("");
  const [myAppointments, setMyAppointments] = useState<any[]>([]);

  const user = auth.currentUser;

  // 🔥 LISTEN TO USER APPOINTMENTS
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "appointments"),
      where("userId", "==", user.uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMyAppointments(data);
    });

    return () => unsub();
  }, []);

  const createAppointment = async () => {
    if (!selectedService) {
      Alert.alert("Select a service");
      return;
    }

    await addDoc(collection(db, "appointments"), {
      userId: user?.uid,
      userEmail: user?.email,
      userName: user?.email?.split("@")[0], // 👈 simple name
      serviceType: selectedService,
      notes,
      status: "pending",
      adminMessage: "",
      createdAt: new Date(),
    });

    setSelectedService("");
    setNotes("");
    Alert.alert("Request sent!");
  };

  const getStatusColor = (status: string) => {
    if (status === "approved") return "#2ECC71";
    if (status === "rejected") return "#E74C3C";
    if (status === "completed") return "#3498DB";
    return "#F39C12"; // pending
  };

  return (
    <ScrollView style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} />
        </TouchableOpacity>

        <Text style={styles.title}>Appointments</Text>

        <View style={{ width: 24 }} />
      </View>

      {/* CREATE SECTION */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>New Appointment</Text>

        {["Oil Change", "Engine Check", "Tire", "Maintenance"].map((s) => (
          <TouchableOpacity
            key={s}
            style={[
              styles.option,
              selectedService === s && styles.selected,
            ]}
            onPress={() => setSelectedService(s)}
          >
            <Text>{s}</Text>
          </TouchableOpacity>
        ))}

        <TextInput
          placeholder="Notes..."
          style={styles.input}
          value={notes}
          onChangeText={setNotes}
          multiline
        />

        <TouchableOpacity style={styles.button} onPress={createAppointment}>
          <Text style={styles.buttonText}>Submit</Text>
        </TouchableOpacity>
      </View>

      {/* HISTORY / STATUS */}
      <Text style={styles.sectionTitle}>Your Requests</Text>

      {myAppointments.map((item) => (
        <View key={item.id} style={styles.historyCard}>
          <Text style={styles.service}>{item.serviceType}</Text>

          <Text style={{ color: getStatusColor(item.status) }}>
            {item.status.toUpperCase()}
          </Text>

          <Text style={styles.notes}>Notes: {item.notes || "None"}</Text>

          <Text style={styles.reply}>
            Admin: {item.adminMessage || "No reply yet"}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FB",
    padding: 16,
    paddingTop: 50,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
  },

  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
  },

  option: {
    padding: 10,
    backgroundColor: "#eee",
    borderRadius: 10,
    marginBottom: 6,
  },

  selected: {
    backgroundColor: "#FFD580",
  },

  input: {
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },

  button: {
    marginTop: 12,
    backgroundColor: "#111",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },

  historyCard: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },

  service: {
    fontWeight: "700",
    fontSize: 15,
  },

  notes: {
    fontSize: 12,
    color: "gray",
  },

  reply: {
    marginTop: 4,
    fontStyle: "italic",
  },
});