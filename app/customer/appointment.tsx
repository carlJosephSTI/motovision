import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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
      userName: user?.email?.split("@")[0],
      serviceType: selectedService,
      notes,
      status: "pending",
      adminMessage: "",
      createdAt: new Date(),
    });

    setSelectedService("");
    setNotes("");

    Alert.alert("Appointment request sent!");
  };

  const getStatusColor = (status: string) => {
    if (status === "approved") return "#2ECC71";
    if (status === "rejected") return "#FF5252";
    if (status === "completed") return "#00D4FF";

    return "#F9A825";
  };

  const getServiceIcon = (service: string) => {
    if (service === "Oil Change") return "water-outline";
    if (service === "Engine Check") return "speedometer-outline";
    if (service === "Tire") return "disc-outline";

    return "construct-outline";
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={18} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Appointments</Text>

        <Text style={styles.subtitle}>
          Schedule garage services and customization support
        </Text>
      </View>

      {/* CREATE CARD */}
      <View style={styles.cardGlow}>
        <LinearGradient
          colors={["#151A22", "#0F131A", "#11161D"]}
          style={styles.card}
        >
          <View style={styles.sectionHeader}>
            <View style={styles.iconBox}>
              <Ionicons
                name="calendar-outline"
                size={24}
                color="#00D4FF"
              />
            </View>

            <View>
              <Text style={styles.sectionTitle}>New Appointment</Text>
              <Text style={styles.sectionSubtitle}>
                Choose a garage service
              </Text>
            </View>
          </View>

          {/* SERVICE OPTIONS */}
          {["Oil Change", "Engine Check", "Tire", "Maintenance"].map((s) => (
            <TouchableOpacity
              key={s}
              activeOpacity={0.85}
              style={[
                styles.option,
                selectedService === s && styles.selected,
              ]}
              onPress={() => setSelectedService(s)}
            >
              <View style={styles.optionLeft}>
                <Ionicons
                  name={getServiceIcon(s) as any}
                  size={22}
                  color={
                    selectedService === s ? "#00D4FF" : "#9CA3AF"
                  }
                />

                <Text
                  style={[
                    styles.optionText,
                    selectedService === s && styles.selectedText,
                  ]}
                >
                  {s}
                </Text>
              </View>

              {selectedService === s && (
                <Ionicons
                  name="checkmark-circle"
                  size={22}
                  color="#00D4FF"
                />
              )}
            </TouchableOpacity>
          ))}

          {/* NOTES */}
          <View style={styles.inputBox}>
            <Ionicons
              name="chatbox-ellipses-outline"
              size={20}
              color="#9CA3AF"
              style={{ marginTop: 4 }}
            />

            <TextInput
              placeholder="Additional notes or concerns..."
              placeholderTextColor="#747B86"
              style={styles.input}
              value={notes}
              onChangeText={setNotes}
              multiline
            />
          </View>

          {/* BUTTON */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={createAppointment}
          >
            <LinearGradient
              colors={["#00AEEF", "#006C9E"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.button}
            >
              <Text style={styles.buttonText}>SUBMIT REQUEST</Text>

              <Ionicons
                name="arrow-forward"
                size={18}
                color="#fff"
              />
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </View>

      {/* HISTORY */}
      <Text style={styles.historyTitle}>Your Requests</Text>

      {myAppointments.map((item) => (
        <View key={item.id} style={styles.historyCard}>
          <View style={styles.historyTop}>
            <View style={styles.historyIconBox}>
              <Ionicons
                name={getServiceIcon(item.serviceType) as any}
                size={22}
                color="#00D4FF"
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.service}>
                {item.serviceType}
              </Text>

              <Text style={styles.notes}>
                {item.notes || "No notes provided"}
              </Text>
            </View>

            <View
              style={[
                styles.statusBadge,
                {
                  borderColor: getStatusColor(item.status),
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  {
                    color: getStatusColor(item.status),
                  },
                ]}
              >
                {item.status.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.replyBox}>
            <Ionicons
              name="person-circle-outline"
              size={18}
              color="#9CA3AF"
            />

            <Text style={styles.reply}>
              Admin: {item.adminMessage || "No reply yet"}
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#07090D",
  },

  scrollContent: {
    padding: 18,
    paddingTop: 52,
    paddingBottom: 120,
  },

  header: {
    marginBottom: 20,
  },

  backButton: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  backText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 13,
  },

  title: {
    fontSize: 30,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#9CA3AF",
    fontWeight: "700",
  },

  cardGlow: {
    borderRadius: 24,
    padding: 1,
    backgroundColor: "rgba(0,212,255,0.25)",
    shadowColor: "#00D4FF",
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 22,
  },

  card: {
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(0,212,255,0.16)",
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },

  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "rgba(0,212,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(0,212,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  sectionSubtitle: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
  },

  option: {
    minHeight: 62,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#252A33",
    backgroundColor: "#090D13",
    paddingHorizontal: 16,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  selected: {
    borderColor: "#00D4FF",
    backgroundColor: "rgba(0,212,255,0.08)",
  },

  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  optionText: {
    color: "#C9D1D9",
    fontWeight: "800",
    fontSize: 14,
  },

  selectedText: {
    color: "#FFFFFF",
  },

  inputBox: {
    minHeight: 95,
    borderWidth: 1,
    borderColor: "#252A33",
    borderRadius: 16,
    backgroundColor: "#090D13",
    padding: 14,
    marginTop: 4,
    flexDirection: "row",
    alignItems: "flex-start",
  },

  input: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 14,
    marginLeft: 10,
    minHeight: 70,
    textAlignVertical: "top",
  },

  button: {
    marginTop: 16,
    height: 54,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    shadowColor: "#00D4FF",
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "900",
    letterSpacing: 1,
  },

  historyTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 12,
  },

  historyCard: {
    backgroundColor: "#11161D",
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#222B36",
  },

  historyTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  historyIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "rgba(0,212,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(0,212,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  service: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 15,
    marginBottom: 4,
  },

  notes: {
    color: "#9CA3AF",
    fontSize: 12,
    lineHeight: 16,
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  statusText: {
    fontSize: 10,
    fontWeight: "900",
  },

  replyBox: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  reply: {
    color: "#C9D1D9",
    fontSize: 12,
    fontStyle: "italic",
    flex: 1,
  },
});