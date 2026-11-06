
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { auth, db } from "../../firebaseConfig";

const ORANGE = "#FF7A18";
const AMBER = "#FFAA33";
const BACKGROUND = "#080A0E";
const CARD_BACKGROUND = "#11151C";
const MUTED = "#9CA3AF";

const SERVICES = [
  {
    name: "Oil Change",
    description: "Oil and lubrication service",
    icon: "water-outline",
  },
  {
    name: "Engine Check",
    description: "Engine inspection and diagnostics",
    icon: "speedometer-outline",
  },
  {
    name: "Tire",
    description: "Tire inspection and related concerns",
    icon: "disc-outline",
  },
  {
    name: "Maintenance",
    description: "Routine motorcycle maintenance",
    icon: "construct-outline",
  },
  {
    name: "Others",
    description: "Something else? Tell us what you need",
    icon: "chatbox-ellipses-outline",
  },
] as const;

export default function Appointment() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [selectedService, setSelectedService] = useState("");
  const [notes, setNotes] = useState("");
  const [myAppointments, setMyAppointments] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [busyAppointmentId, setBusyAppointmentId] = useState<string | null>(
    null
  );

  // Track authentication changes.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setAuthLoading(false);
      },
      (error) => {
        console.error("Authentication error:", error);
        setUser(null);
        setAuthLoading(false);

        Alert.alert(
          "Authentication Error",
          "We couldn't verify your account. Please try signing in again."
        );
      }
    );

    return unsubscribe;
  }, []);

  // Listen to the signed-in customer's appointments in real time.
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setMyAppointments([]);
      setAppointmentsLoading(false);
      return;
    }

    setAppointmentsLoading(true);

    const appointmentsQuery = query(
      collection(db, "appointments"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(
      appointmentsQuery,
      (snapshot) => {
        const data = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        }));

        data.sort((a: any, b: any) => {
          const timeA = a.createdAt?.toMillis?.() ?? 0;
          const timeB = b.createdAt?.toMillis?.() ?? 0;
          return timeB - timeA;
        });

        setMyAppointments(data);
        setAppointmentsLoading(false);
      },
      (error) => {
        console.error("Appointment listener error:", error);
        setAppointmentsLoading(false);

        Alert.alert(
          "Unable to Load Requests",
          "We couldn't load your appointment requests. Please check your connection and try again."
        );
      }
    );

    return unsubscribe;
  }, [user, authLoading]);

  // Submit a new appointment request.
  const createAppointment = async () => {
    if (authLoading) {
      Alert.alert("Please Wait", "We're verifying your account.");
      return;
    }

    if (!user) {
      Alert.alert(
        "Sign In Required",
        "Please sign in to submit an appointment request."
      );
      return;
    }

    if (!selectedService) {
      Alert.alert(
        "Select a Service",
        "Please choose the service you need before submitting."
      );
      return;
    }

    if (selectedService === "Others" && !notes.trim()) {
      Alert.alert(
        "Additional Details Needed",
        "Please describe the service or concern you need help with."
      );
      return;
    }

    if (submitting) return;

    setSubmitting(true);

    try {
      await addDoc(collection(db, "appointments"), {
        userId: user.uid,
        userEmail: user.email ?? "",
        userName: user.email?.split("@")[0] ?? "Customer",
        serviceType: selectedService,
        notes: notes.trim(),
        status: "pending",
        adminMessage: "",
        createdAt: new Date(),
      });

      setSelectedService("");
      setNotes("");

      Alert.alert(
        "Request Submitted!",
        "Your appointment request has been sent. You can track its status under Your Requests."
      );
    } catch (error: any) {
      console.error("Appointment submission error:", error);

      let message =
        "We couldn't submit your appointment. Please try again.";

      if (error?.code === "permission-denied") {
        message =
          "The database denied the request. Please check your account permissions and try again.";
      } else if (error?.code === "unavailable") {
        message =
          "The service is temporarily unavailable. Check your internet connection and try again.";
      }

      Alert.alert("Submission Failed", message);
    } finally {
      setSubmitting(false);
    }
  };

  // Cancel or restore an appointment without deleting its record.
  const changeAppointmentStatus = async (
    appointment: any,
    action: "cancel" | "restore"
  ) => {
    if (!user) {
      Alert.alert("Sign In Required", "Please sign in again.");
      return;
    }

    const expectedStatus = action === "cancel" ? "pending" : "cancelled";
    const newStatus = action === "cancel" ? "cancelled" : "pending";

    if (appointment.status !== expectedStatus) {
      Alert.alert(
        "Status Changed",
        "This request's status has changed. Please refresh the screen and try again."
      );
      return;
    }

    const title =
      action === "cancel" ? "Cancel This Request?" : "Restore This Request?";

    const message =
      action === "cancel"
        ? "This request will be marked as cancelled. You can restore it to pending later if you change your mind."
        : "This request will return to pending so the admin can review it again.";

    Alert.alert(title, message, [
      {
        text: "Go Back",
        style: "cancel",
      },
      {
        text: action === "cancel" ? "Cancel Request" : "Restore Request",
        style: action === "cancel" ? "destructive" : "default",
        onPress: async () => {
          if (busyAppointmentId) return;

          setBusyAppointmentId(appointment.id);

          try {
            await updateDoc(doc(db, "appointments", appointment.id), {
              status: newStatus,
            });

            // Firestore's real-time listener will update the card.
            Alert.alert(
              action === "cancel" ? "Request Cancelled" : "Request Restored",
              action === "cancel"
                ? "Your request has been marked as cancelled."
                : "Your request is pending again."
            );
          } catch (error: any) {
            console.error("Appointment status update error:", error);

            let errorMessage =
              "We couldn't update this request. Please try again.";

            if (error?.code === "permission-denied") {
              errorMessage =
                "The database rejected this change. Please make sure the Firestore Rules allow customers to cancel and restore their own requests.";
            } else if (error?.code === "not-found") {
              errorMessage =
                "This appointment could not be found. Please refresh the screen.";
            }

            Alert.alert("Update Failed", errorMessage);
          } finally {
            setBusyAppointmentId(null);
          }
        },
      },
    ]);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "#35D07F";
      case "rejected":
        return "#FF626B";
      case "completed":
        return "#60B8FF";
      case "cancelled":
        return "#A1A1AA";
      default:
        return AMBER;
    }
  };

  const getStatusIcon = (status: string): any => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "checkmark-circle-outline";
      case "rejected":
        return "close-circle-outline";
      case "completed":
        return "checkmark-done-circle-outline";
      case "cancelled":
        return "ban-outline";
      default:
        return "time-outline";
    }
  };

  const getServiceIcon = (service: string): any => {
    const option = SERVICES.find((item) => item.name === service);
    return option?.icon ?? "construct-outline";
  };

  const formatDate = (value: any) => {
    try {
      if (!value) return "";

      const date = value?.toDate
        ? value.toDate()
        : value instanceof Date
          ? value
          : new Date(value);

      if (Number.isNaN(date.getTime())) return "";

      return date.toLocaleString([], {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  const isOthers = selectedService === "Others";

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.eyebrow}>
          <View style={styles.eyebrowDot} />
          <Text style={styles.eyebrowText}>MOTOVISION GARAGE</Text>
        </View>

        <Text style={styles.title}>Appointments</Text>

        <Text style={styles.subtitle}>
          Your ride deserves the right care.
          {"\n"}Tell us what your motorcycle needs.
        </Text>
      </View>

      {/* NEW APPOINTMENT FORM */}
      <View style={styles.cardGlow}>
        <LinearGradient
          colors={["#171A20", "#101319", "#0D1015"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <View style={styles.sectionHeader}>
            <View style={styles.iconBox}>
              <Ionicons
                name="calendar-outline"
                size={25}
                color={ORANGE}
              />
            </View>

            <View style={styles.sectionHeadingText}>
              <Text style={styles.sectionTitle}>New Appointment</Text>
              <Text style={styles.sectionSubtitle}>
                Request a service from our team
              </Text>
            </View>
          </View>

          <View style={styles.sectionLabelRow}>
            <Text style={styles.sectionLabel}>SELECT A SERVICE</Text>
            <Text style={styles.selectionHint}>
              {selectedService ? "1 SELECTED" : "CHOOSE ONE"}
            </Text>
          </View>

          {SERVICES.map((service) => {
            const selected = selectedService === service.name;

            return (
              <TouchableOpacity
                key={service.name}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                style={[
                  styles.option,
                  selected && styles.selectedOption,
                ]}
                onPress={() => setSelectedService(service.name)}
              >
                <View
                  style={[
                    styles.optionIconBox,
                    selected && styles.optionIconBoxSelected,
                  ]}
                >
                  <Ionicons
                    name={service.icon as any}
                    size={23}
                    color={selected ? AMBER : "#969EAA"}
                  />
                </View>

                <View style={styles.optionTextContainer}>
                  <Text
                    style={[
                      styles.optionText,
                      selected && styles.selectedText,
                    ]}
                  >
                    {service.name === "Tire"
                      ? "Tire Service"
                      : service.name}
                  </Text>

                  <Text style={styles.optionDescription}>
                    {service.description}
                  </Text>
                </View>

                <View
                  style={[
                    styles.radioCircle,
                    selected && styles.radioCircleSelected,
                  ]}
                >
                  {selected && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            );
          })}

          {/* ADDITIONAL NOTES */}
          <View style={styles.notesHeader}>
            <View style={styles.notesTitleRow}>
              <Ionicons
                name="chatbox-ellipses-outline"
                size={18}
                color={ORANGE}
              />

              <Text style={styles.notesTitle}>
                {isOthers ? "Describe Your Request" : "Additional Notes"}
              </Text>

              {isOthers && (
                <Text style={styles.requiredLabel}>REQUIRED</Text>
              )}
            </View>

            <Text style={styles.notesSubtitle}>
              {isOthers
                ? "Tell us what service or assistance you need."
                : "Any concerns or details you'd like our team to know?"}
            </Text>
          </View>

          <View
            style={[
              styles.inputBox,
              isOthers && !notes.trim() && styles.inputBoxOthers,
            ]}
          >
            <TextInput
              placeholder={
                isOthers
                  ? "Describe the service you need..."
                  : "e.g. Unusual engine noise, maintenance concerns..."
              }
              placeholderTextColor="#737B87"
              style={styles.input}
              value={notes}
              onChangeText={setNotes}
              multiline
              maxLength={500}
              textAlignVertical="top"
              returnKeyType="default"
              accessibilityLabel="Additional appointment notes"
            />
          </View>

          <Text style={styles.characterCount}>
            {notes.length}/500 characters
          </Text>

          <View style={styles.infoBox}>
            <Ionicons
              name="information-circle-outline"
              size={19}
              color={AMBER}
            />
            <Text style={styles.infoText}>
              Your request remains pending until the admin reviews it.
              Submitting a request does not guarantee confirmation.
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={createAppointment}
            disabled={submitting || authLoading}
            accessibilityRole="button"
            accessibilityLabel="Submit appointment request"
            style={styles.submitWrapper}
          >
            <LinearGradient
              colors={
                submitting || authLoading
                  ? ["#A45A24", "#804018"]
                  : [AMBER, ORANGE, "#E95B08"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.button,
                (submitting || authLoading) && styles.buttonDisabled,
              ]}
            >
              {submitting || authLoading ? (
                <>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.buttonText}>
                    {authLoading ? "VERIFYING ACCOUNT..." : "SENDING REQUEST..."}
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons
                    name="paper-plane-outline"
                    size={19}
                    color="#FFFFFF"
                  />
                  <Text style={styles.buttonText}>SUBMIT REQUEST</Text>
                  <Ionicons
                    name="arrow-forward"
                    size={18}
                    color="#FFFFFF"
                  />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.secureNote}>
            <Ionicons
              name="shield-checkmark-outline"
              size={14}
              color="#737B87"
            />
            <Text style={styles.secureNoteText}>
              Your request is linked to your signed-in account.
            </Text>
          </View>
        </LinearGradient>
      </View>

      {/* EXISTING HISTORY AREA */}
      <View style={styles.historyHeader}>
        <View>
          <Text style={styles.historyTitle}>Your Requests</Text>
          <Text style={styles.historySubtitle}>
            Keep track of your service requests
          </Text>
        </View>

        <View style={styles.historyCount}>
          <Ionicons name="receipt-outline" size={16} color={ORANGE} />
          <Text style={styles.historyCountText}>
            {myAppointments.length}
          </Text>
        </View>
      </View>

      {appointmentsLoading || authLoading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator size="small" color={ORANGE} />
          <Text style={styles.emptyStateText}>
            Loading your requests...
          </Text>
        </View>
      ) : !user ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons
              name="person-circle-outline"
              size={30}
              color={ORANGE}
            />
          </View>
          <Text style={styles.emptyTitle}>Sign in to view requests</Text>
          <Text style={styles.emptyStateText}>
            Your appointment history will appear here after you sign in.
          </Text>
        </View>
      ) : myAppointments.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons
              name="calendar-outline"
              size={30}
              color={ORANGE}
            />
          </View>
          <Text style={styles.emptyTitle}>No requests yet</Text>
          <Text style={styles.emptyStateText}>
            Your submitted service requests will appear here.
          </Text>
        </View>
      ) : (
        myAppointments.map((item) => {
          const status = (item.status || "pending").toLowerCase();
          const statusColor = getStatusColor(status);
          const busy = busyAppointmentId === item.id;
          const canCancel = status === "pending";
          const canRestore = status === "cancelled";

          return (
            <View key={item.id} style={styles.historyCard}>
              <View style={styles.historyTop}>
                <View
                  style={[
                    styles.historyIconBox,
                    status === "cancelled" && styles.cancelledIconBox,
                  ]}
                >
                  <Ionicons
                    name={getServiceIcon(item.serviceType)}
                    size={23}
                    color={status === "cancelled" ? "#A1A1AA" : ORANGE}
                  />
                </View>

                <View style={styles.historyMain}>
                  <Text style={styles.service}>
                    {item.serviceType === "Tire"
                      ? "Tire Service"
                      : item.serviceType}
                  </Text>

                  {!!formatDate(item.createdAt) && (
                    <Text style={styles.historyDate}>
                      {formatDate(item.createdAt)}
                    </Text>
                  )}
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    { borderColor: statusColor },
                  ]}
                >
                  <Ionicons
                    name={getStatusIcon(status)}
                    size={12}
                    color={statusColor}
                  />
                  <Text
                    style={[styles.statusText, { color: statusColor }]}
                  >
                    {status.toUpperCase()}
                  </Text>
                </View>
              </View>

              <Text style={styles.notes}>
                {item.notes || "No additional notes provided."}
              </Text>

              {status === "cancelled" && (
                <View style={styles.cancelledNotice}>
                  <Ionicons
                    name="information-circle-outline"
                    size={16}
                    color="#A1A1AA"
                  />
                  <Text style={styles.cancelledNoticeText}>
                    This request is cancelled. You can restore it to pending
                    if you'd like the admin to review it again.
                  </Text>
                </View>
              )}

              <View style={styles.replyBox}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={18}
                  color={ORANGE}
                />

                <View style={styles.replyContent}>
                  <Text style={styles.replyLabel}>ADMIN RESPONSE</Text>
                  <Text style={styles.reply}>
                    {item.adminMessage || "No reply yet"}
                  </Text>
                </View>
              </View>

              {/* CANCELLATION / RESTORE CONTROLS */}
              {(canCancel || canRestore) && (
                <View style={styles.actionArea}>
                  {canCancel ? (
                    <TouchableOpacity
                      style={styles.cancelButton}
                      activeOpacity={0.8}
                      disabled={busy || !!busyAppointmentId}
                      onPress={() =>
                        changeAppointmentStatus(item, "cancel")
                      }
                    >
                      {busy ? (
                        <ActivityIndicator size="small" color="#FF7777" />
                      ) : (
                        <Ionicons
                          name="close-circle-outline"
                          size={18}
                          color="#FF7777"
                        />
                      )}

                      <Text style={styles.cancelButtonText}>
                        {busy ? "PLEASE WAIT..." : "CANCEL REQUEST"}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.restoreButton}
                      activeOpacity={0.8}
                      disabled={busy || !!busyAppointmentId}
                      onPress={() =>
                        changeAppointmentStatus(item, "restore")
                      }
                    >
                      {busy ? (
                        <ActivityIndicator size="small" color={AMBER} />
                      ) : (
                        <Ionicons
                          name="refresh-circle-outline"
                          size={19}
                          color={AMBER}
                        />
                      )}

                      <Text style={styles.restoreButtonText}>
                        {busy ? "RESTORING..." : "RESTORE TO PENDING"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },

  scrollContent: {
    padding: 18,
    paddingTop: 52,
    paddingBottom: 120,
  },

  header: {
    marginBottom: 24,
  },

  backButton: {
    alignSelf: "flex-start",
    backgroundColor: "#15181E",
    borderWidth: 1,
    borderColor: "#2C3038",
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 13,
    marginBottom: 25,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  backText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 13,
  },

  eyebrow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },

  eyebrowDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: ORANGE,
  },

  eyebrowText: {
    color: AMBER,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2.1,
  },

  title: {
    fontSize: 32,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.8,
  },

  subtitle: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    color: MUTED,
    fontWeight: "500",
  },

  cardGlow: {
    borderRadius: 25,
    padding: 1,
    backgroundColor: "rgba(255,122,24,0.48)",
    shadowColor: ORANGE,
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 7,
    marginBottom: 30,
  },

  card: {
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,145,40,0.14)",
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
  },

  sectionHeadingText: {
    flex: 1,
  },

  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "rgba(255,122,24,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,145,40,0.35)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 13,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  sectionSubtitle: {
    fontSize: 12,
    color: MUTED,
    marginTop: 4,
  },

  sectionLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  sectionLabel: {
    color: "#E4E7EB",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.4,
  },

  selectionHint: {
    color: AMBER,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
  },

  option: {
    minHeight: 76,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#292D35",
    backgroundColor: "#0B0E13",
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  selectedOption: {
    borderColor: ORANGE,
    backgroundColor: "rgba(255,122,24,0.075)",
    shadowColor: ORANGE,
    shadowOpacity: 0.08,
    shadowRadius: 7,
    elevation: 2,
  },

  optionIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#191D24",
    borderWidth: 1,
    borderColor: "#292D35",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  optionIconBoxSelected: {
    backgroundColor: "rgba(255,122,24,0.14)",
    borderColor: "rgba(255,145,40,0.38)",
  },

  optionTextContainer: {
    flex: 1,
    paddingRight: 7,
  },

  optionText: {
    color: "#E0E4E9",
    fontWeight: "800",
    fontSize: 14,
  },

  selectedText: {
    color: "#FFFFFF",
  },

  optionDescription: {
    color: "#858D99",
    fontSize: 11,
    lineHeight: 15,
    marginTop: 4,
  },

  radioCircle: {
    width: 21,
    height: 21,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: "#555D68",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 3,
  },

  radioCircleSelected: {
    borderColor: ORANGE,
  },

  radioInner: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: ORANGE,
  },

  notesHeader: {
    marginTop: 15,
    marginBottom: 11,
  },

  notesTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },

  notesTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  requiredLabel: {
    color: AMBER,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.6,
    backgroundColor: "rgba(255,122,24,0.12)",
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: "hidden",
  },

  notesSubtitle: {
    color: "#9098A4",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 6,
  },

  inputBox: {
    minHeight: 115,
    borderWidth: 1,
    borderColor: "#30343D",
    borderRadius: 16,
    backgroundColor: "#0A0D12",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  inputBoxOthers: {
    borderColor: "rgba(255,122,24,0.65)",
  },

  input: {
    color: "#FFFFFF",
    fontSize: 13,
    lineHeight: 20,
    minHeight: 88,
    padding: 0,
  },

  characterCount: {
    textAlign: "right",
    color: "#727B87",
    fontSize: 10,
    marginTop: 7,
    marginBottom: 16,
  },

  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    padding: 12,
    borderRadius: 13,
    backgroundColor: "rgba(255,170,51,0.065)",
    borderWidth: 1,
    borderColor: "rgba(255,170,51,0.16)",
  },

  infoText: {
    flex: 1,
    color: "#B9BFC8",
    fontSize: 11,
    lineHeight: 17,
  },

  submitWrapper: {
    marginTop: 18,
    borderRadius: 16,
    shadowColor: ORANGE,
    shadowOpacity: 0.3,
    shadowRadius: 13,
    elevation: 6,
  },

  button: {
    minHeight: 55,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
  },

  buttonDisabled: {
    opacity: 0.8,
  },

  buttonText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 12,
    letterSpacing: 1,
  },

  secureNote: {
    marginTop: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  secureNoteText: {
    color: "#737B87",
    fontSize: 10,
  },

  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  historyTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
  },

  historySubtitle: {
    color: MUTED,
    fontSize: 11,
    marginTop: 4,
  },

  historyCount: {
    minWidth: 42,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,122,24,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,122,24,0.25)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingHorizontal: 9,
  },

  historyCountText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },

  historyCard: {
    backgroundColor: CARD_BACKGROUND,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#292D35",
  },

  historyTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  historyIconBox: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: "rgba(255,122,24,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,122,24,0.28)",
    justifyContent: "center",
    alignItems: "center",
  },

  cancelledIconBox: {
    backgroundColor: "rgba(161,161,170,0.08)",
    borderColor: "rgba(161,161,170,0.25)",
  },

  historyMain: {
    flex: 1,
  },

  service: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 14,
    marginBottom: 4,
  },

  historyDate: {
    color: "#8D96A2",
    fontSize: 10,
  },

  notes: {
    color: "#A8AFB9",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 13,
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.025)",
    flexShrink: 0,
  },

  statusText: {
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.3,
  },

  cancelledNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 12,
    padding: 10,
    borderRadius: 11,
    backgroundColor: "rgba(161,161,170,0.07)",
    borderWidth: 1,
    borderColor: "rgba(161,161,170,0.15)",
  },

  cancelledNoticeText: {
    flex: 1,
    color: "#A1A1AA",
    fontSize: 11,
    lineHeight: 16,
  },

  replyBox: {
    marginTop: 13,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.07)",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
  },

  replyContent: {
    flex: 1,
  },

  replyLabel: {
    color: "#858D99",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 5,
  },

  reply: {
    color: "#D0D5DC",
    fontSize: 12,
    lineHeight: 18,
  },

  actionArea: {
    marginTop: 13,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.07)",
  },

  cancelButton: {
    minHeight: 43,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255,98,107,0.35)",
    backgroundColor: "rgba(255,98,107,0.07)",
    borderRadius: 12,
    paddingHorizontal: 12,
  },

  cancelButtonText: {
    color: "#FF7777",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.7,
  },

  restoreButton: {
    minHeight: 43,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255,170,51,0.38)",
    backgroundColor: "rgba(255,122,24,0.09)",
    borderRadius: 12,
    paddingHorizontal: 12,
  },

  restoreButtonText: {
    color: AMBER,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.6,
  },

  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderRadius: 18,
    backgroundColor: "#101319",
    borderWidth: 1,
    borderColor: "#252A32",
    marginBottom: 12,
  },

  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 19,
    backgroundColor: "rgba(255,122,24,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,122,24,0.24)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 13,
  },

  emptyTitle: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 14,
    textAlign: "center",
    marginTop: 4,
  },

  emptyStateText: {
    color: "#8E97A3",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 8,
  },
});
