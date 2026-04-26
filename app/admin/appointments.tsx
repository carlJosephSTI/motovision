import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../../firebaseConfig";

const deleteAppointment = async (id: string) => {
  await deleteDoc(doc(db, "appointments", id));
};
export default function Appointments() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [messages, setMessages] = useState<any>({});

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "appointments"), (snap) => {
      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAppointments(data);
    });

    return () => unsub();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    await updateDoc(doc(db, "appointments", id), { status });
  };

  const sendMessage = async (id: string) => {
    await updateDoc(doc(db, "appointments", id), {
      adminMessage: messages[id] || "",
    });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Appointments</Text>

      {appointments.map((item) => (
        
        <View key={item.id} style={styles.card}>
          <Text style={styles.service}>{item.serviceType}</Text>
          <Text style={styles.info}>User: {item.userEmail}</Text>
          <Text style={styles.info}>Notes: {item.notes || "None"}</Text>
          <Text style={styles.status}>Status: {item.status}</Text>

          {/* ADMIN MESSAGE INPUT */}
          <TextInput
            placeholder="Reply to user..."
            style={styles.input}
            value={messages[item.id] || ""}
            onChangeText={(text) =>
              setMessages({ ...messages, [item.id]: text })
            }
          />

          <TouchableOpacity
            style={styles.sendBtn}
            onPress={() => sendMessage(item.id)}
          >
            <Text style={styles.btnText}>Send Message</Text>
          </TouchableOpacity>

          <Text style={styles.reply}>
            Admin Reply: {item.adminMessage || "None"}
          </Text>

          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: "#2ECC71" }]}
              onPress={() => updateStatus(item.id, "approved")}
            >
              <Text style={styles.btnText}>Approve</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, { backgroundColor: "#E74C3C" }]}
              onPress={() => updateStatus(item.id, "rejected")}
            >
              <Text style={styles.btnText}>Reject</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, { backgroundColor: "#3498DB" }]}
              onPress={() => updateStatus(item.id, "completed")}
            >
              <Text style={styles.btnText}>Done</Text>
            </TouchableOpacity>
          </View>
          {/*this the delete button burh */}
          <TouchableOpacity
  style={{ backgroundColor: "#000", padding: 8, marginTop: 6 }}
  onPress={() => deleteAppointment(item.id)}
>
  <Text style={{ color: "#fff", textAlign: "center" }}>
    Delete
  </Text>
</TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#F4F6F9",
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 15,
  },

  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },

  service: {
    fontSize: 16,
    fontWeight: "700",
  },

  info: {
    fontSize: 13,
    color: "gray",
  },

  status: {
    marginTop: 5,
    fontWeight: "600",
  },

  input: {
    backgroundColor: "#F0F0F0",
    borderRadius: 10,
    padding: 8,
    marginTop: 8,
  },

  sendBtn: {
    backgroundColor: "#111",
    padding: 8,
    borderRadius: 8,
    marginTop: 6,
    alignItems: "center",
  },

  reply: {
    marginTop: 6,
    fontStyle: "italic",
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },

  btn: {
    padding: 8,
    borderRadius: 8,
  },

  btnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12,
  },
});