import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../../firebaseConfig";

interface Appointment {
  id: string;
  userId?: string;
  userEmail?: string;
  serviceType?: string;
  status: string;
  notes?: string;
  adminMessage?: string;
}

const deleteAppointment = async (id: string) => {
  await deleteDoc(doc(db, "appointments", id));
};

export default function Appointments() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [messages, setMessages] = useState<{ [key: string]: string }>({});
  const [userPhotos, setUserPhotos] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "appointments"), async (snap) => {
      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Appointment[];

      setAppointments(data);

      const photoMap: { [key: string]: string } = {};
      for (const item of data) {
        if (item.userId) {
          try {
            const savedUri = await AsyncStorage.getItem(`profile_pic_${item.userId}`);
            if (savedUri) {
              photoMap[item.userId] = savedUri;
            }
          } catch (e) {
            console.error("Error loading profile picture", e);
          }
        }
      }
      setUserPhotos(photoMap);
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

  const getStatusColor = (status: string) => {
    if (status === "approved") return "#2ECC71";
    if (status === "rejected") return "#FF5252";
    if (status === "completed") return "#00AEEF";
    return "#F9A825";
  };

  const getServiceIcon = (service?: string) => {
    if (service === "Oil Change") return "water-outline";
    if (service === "Engine Check") return "speedometer-outline";
    if (service === "Tire") return "disc-outline";
    return "construct-outline";
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerCard}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.push("/admin")}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color="#111827" />
          </TouchableOpacity>

          <View style={styles.headerIcon}>
            <Ionicons name="calendar-outline" size={22} color="#00AEEF" />
          </View>
        </View>

        <View style={{ marginTop: 12 }}>
          <Text style={styles.kicker}>ADMIN PANEL</Text>
          <Text style={styles.title}>Appointments</Text>
          <Text style={styles.subtitle}>
            Review, update, and respond to customer requests
          </Text>
        </View>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{appointments.length}</Text>
          <Text style={styles.summaryLabel}>Total Requests</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={[styles.summaryNumber, { color: "#F9A825" }]}>
            {appointments.filter((a) => a.status === "pending").length}
          </Text>
          <Text style={styles.summaryLabel}>Pending</Text>
        </View>
      </View>

      {appointments.map((item) => {
        const statusColor = getStatusColor(item.status);
        const userPhoto = item.userId ? userPhotos[item.userId] : null;

        return (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.avatarBox}>
                {userPhoto ? (
                  <Image source={{ uri: userPhoto }} style={styles.avatarImg} />
                ) : (
                  <Ionicons
                    name={getServiceIcon(item.serviceType) as any}
                    size={23}
                    color="#00AEEF"
                  />
                )}
              </View>

              <View style={styles.cardInfo}>
                <Text style={styles.service}>{item.serviceType || "Service"}</Text>
                <Text style={styles.userEmail}>{item.userEmail || "No Email"}</Text>
              </View>

              <View style={[styles.statusBadge, { borderColor: statusColor }]}>
                <Text style={[styles.statusText, { color: statusColor }]}>
                  {item.status.toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.detailBox}>
              <View style={styles.detailRow}>
                <Ionicons name="document-text-outline" size={17} color="#6B7280" />
                <Text style={styles.info}>Notes: {item.notes || "None"}</Text>
              </View>

              <View style={styles.detailRow}>
                <Ionicons name="chatbubble-ellipses-outline" size={17} color="#6B7280" />
                <Text style={styles.info}>
                  Admin Reply: {item.adminMessage || "None"}
                </Text>
              </View>
            </View>

            <View style={styles.replyInputBox}>
              <Ionicons name="create-outline" size={18} color="#6B7280" />
              <TextInput
                placeholder="Reply to user..."
                placeholderTextColor="#9CA3AF"
                style={styles.input}
                value={messages[item.id] || ""}
                onChangeText={(text) =>
                  setMessages({ ...messages, [item.id]: text })
                }
              />
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.sendBtn}
              onPress={() => sendMessage(item.id)}
            >
              <Ionicons name="send-outline" size={16} color="#fff" />
              <Text style={styles.btnText}>Send Message</Text>
            </TouchableOpacity>

            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: "#2ECC71" }]}
                onPress={() => updateStatus(item.id, "approved")}
              >
                <Ionicons name="checkmark-outline" size={15} color="#fff" />
                <Text style={styles.btnText}>Approve</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: "#FF5252" }]}
                onPress={() => updateStatus(item.id, "rejected")}
              >
                <Ionicons name="close-outline" size={15} color="#fff" />
                <Text style={styles.btnText}>Reject</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: "#00AEEF" }]}
                onPress={() => updateStatus(item.id, "completed")}
              >
                <Ionicons name="flag-outline" size={15} color="#fff" />
                <Text style={styles.btnText}>Done</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.deleteBtn}
              onPress={() => deleteAppointment(item.id)}
            >
              <Ionicons name="trash-outline" size={16} color="#EF4444" />
              <Text style={styles.deleteText}>Delete Request</Text>
            </TouchableOpacity>
          </View>
        );
      })}
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
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5EAF0",
    shadowColor: "#00AEEF",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 5,
  },

  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#F4F7FB",
    borderWidth: 1,
    borderColor: "#E5EAF0",
    justifyContent: "center",
    alignItems: "center",
  },

  kicker: {
    color: "#00AEEF",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginBottom: 3,
  },

  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#111827",
  },

  subtitle: {
    marginTop: 3,
    color: "#6B7280",
    fontSize: 13,
    fontWeight: "700",
  },

  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(0,174,239,0.10)",
    borderWidth: 1,
    borderColor: "rgba(0,174,239,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },

  summaryRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },

  summaryCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5EAF0",
    shadowColor: "#111827",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },

  summaryNumber: {
    fontSize: 26,
    fontWeight: "900",
    color: "#111827",
  },

  summaryLabel: {
    color: "#6B7280",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 3,
  },

  card: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 24,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E5EAF0",
    shadowColor: "#111827",
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 4,
  },

  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  avatarBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(0,174,239,0.10)",
    borderWidth: 1,
    borderColor: "rgba(0,174,239,0.35)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    overflow: "hidden",
  },

  avatarImg: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  cardInfo: {
    flex: 1,
  },

  service: {
    fontSize: 16,
    fontWeight: "900",
    color: "#111827",
  },

  userEmail: {
    marginTop: 3,
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "700",
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: "#FFFFFF",
  },

  statusText: {
    fontSize: 10,
    fontWeight: "900",
  },

  detailBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#EEF2F7",
    marginBottom: 12,
    gap: 8,
  },

  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },

  info: {
    flex: 1,
    fontSize: 12,
    color: "#4B5563",
    fontWeight: "700",
    lineHeight: 17,
  },

  replyInputBox: {
    minHeight: 46,
    backgroundColor: "#F8FAFC",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#E5EAF0",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  input: {
    flex: 1,
    paddingHorizontal: 8,
    color: "#111827",
    fontSize: 13,
    fontWeight: "700",
  },

  sendBtn: {
    marginTop: 10,
    backgroundColor: "#111827",
    height: 42,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 7,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 10,
  },

  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 4,
  },

  btnText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 11,
  },

  deleteBtn: {
    marginTop: 10,
    backgroundColor: "rgba(239,68,68,0.08)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.25)",
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },

  deleteText: {
    color: "#EF4444",
    fontSize: 12,
    fontWeight: "900",
  },
});