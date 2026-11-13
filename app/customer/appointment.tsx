
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
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
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

// Generate date choices using local calendar dates.
const getNextDates = (numberOfDays: number) => {
  const dates: Date[] = [];
  const today = new Date();

  for (let i = 0; i < numberOfDays; i++) {
    const date = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + i,
      12
    );

    dates.push(date);
  }

  return dates;
};

const dateToKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatAppointmentDate = (value: any) => {
  if (!value) return "No date selected";

  let date: Date;

  if (value?.toDate) {
    date = value.toDate();
  } else if (value instanceof Date) {
    date = value;
  } else {
    // Stored appointment dates use YYYY-MM-DD.
    const parts = String(value).split("-").map(Number);

    if (parts.length === 3 && parts.every(Number.isFinite)) {
      date = new Date(parts[0], parts[1] - 1, parts[2], 12);
    } else {
      date = new Date(value);
    }
  }

  if (Number.isNaN(date.getTime())) return "No date selected";

  return date.toLocaleDateString([], {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

export default function Appointment() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Multiple service selections.
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const [selectedDate, setSelectedDate] = useState("");
  const [notes, setNotes] = useState("");

  const [myAppointments, setMyAppointments] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [busyAppointmentId, setBusyAppointmentId] = useState<string | null>(
    null
  );

  // Rescheduling modal state.
  const [rescheduleAppointment, setRescheduleAppointment] = useState<any>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");

  const availableDates = useMemo(() => getNextDates(30), []);

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

  // Toggle a service checkbox.
  const toggleService = (serviceName: string) => {
    setSelectedServices((previous) =>
      previous.includes(serviceName)
        ? previous.filter((item) => item !== serviceName)
        : [...previous, serviceName]
    );
  };

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

    if (selectedServices.length === 0) {
      Alert.alert(
        "Select a Service",
        "Please choose at least one service."
      );
      return;
    }

    if (!selectedDate) {
      Alert.alert(
        "Choose an Appointment Date",
        "Please select your preferred appointment date."
      );
      return;
    }

    if (
      selectedServices.includes("Others") &&
      !notes.trim()
    ) {
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

        // Keep serviceType for compatibility with existing admin screens.
        serviceType: selectedServices.join(", "),
        serviceTypes: selectedServices,

        notes: notes.trim(),
        appointmentDate: selectedDate,

        status: "pending",
        adminMessage: "",

        createdAt: new Date(),
      });

      setSelectedServices([]);
      setSelectedDate("");
      setNotes("");

      Alert.alert(
        "Request Submitted!",
        `Your appointment request has been sent.\n\nPreferred date: ${formatAppointmentDate(
          selectedDate
        )}\n\nYou can track its status under Your Requests.`
      );
    } catch (error: any) {
      console.error("Appointment submission error:", error);

      let message =
        "We couldn't submit your appointment. Please try again.";

      if (error?.code === "permission-denied") {
        message =
          "The database denied the request. Please check your account permissions.";
      } else if (error?.code === "unavailable") {
        message =
          "The service is temporarily unavailable. Check your internet connection and try again.";
      }

      Alert.alert("Submission Failed", message);
    } finally {
      setSubmitting(false);
    }
  };

  // Open the rescheduling date picker for a pending request.
  const openReschedule = (appointment: any) => {
    if (appointment.status?.toLowerCase() !== "pending") {
      Alert.alert(
        "Rescheduling Unavailable",
        "Only pending appointments can be rescheduled."
      );
      return;
    }

    setRescheduleAppointment(appointment);
    setRescheduleDate(appointment.appointmentDate || "");
  };

  // Save a new date for a pending appointment.
  const saveReschedule = async () => {
    if (!user || !rescheduleAppointment) return;

    if (!rescheduleDate) {
      Alert.alert(
        "Choose a Date",
        "Please select a new appointment date."
      );
      return;
    }

    if (
      rescheduleDate === rescheduleAppointment.appointmentDate
    ) {
      Alert.alert(
        "Same Date Selected",
        "Please choose a different date to reschedule your appointment."
      );
      return;
    }

    if (busyAppointmentId) return;

    setBusyAppointmentId(rescheduleAppointment.id);

    try {
      // Verify the request still belongs to this customer and is pending.
      const currentAppointment = myAppointments.find(
        (item) => item.id === rescheduleAppointment.id
      );

      if (
        !currentAppointment ||
        currentAppointment.userId !== user.uid ||
        currentAppointment.status?.toLowerCase() !== "pending"
      ) {
        throw new Error(
          "This appointment is no longer pending or cannot be found."
        );
      }

      await updateDoc(
        doc(db, "appointments", rescheduleAppointment.id),
        {
          appointmentDate: rescheduleDate,
          rescheduledAt: new Date(),
        }
      );

      setRescheduleAppointment(null);
      setRescheduleDate("");

      Alert.alert(
        "Rescheduling Complete!",
        `Your appointment has been successfully rescheduled to ${formatAppointmentDate(
          rescheduleDate
        )}.`
      );
    } catch (error: any) {
      console.error("Appointment rescheduling error:", error);

      Alert.alert(
        "Rescheduling Failed",
        error?.message ||
          "We couldn't reschedule your appointment. Please try again."
      );
    } finally {
      setBusyAppointmentId(null);
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

    if (appointment.status?.toLowerCase() !== expectedStatus) {
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
        ? "This request will be marked as cancelled."
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

            Alert.alert(
              action === "cancel" ? "Request Cancelled" : "Request Restored",
              action === "cancel"
                ? "Your request has been marked as cancelled."
                : "Your request is pending again."
            );
          } catch (error: any) {
            console.error("Appointment status update error:", error);

            Alert.alert(
              "Update Failed",
              error?.message ||
                "We couldn't update this request. Please try again."
            );
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

  const isOthers = selectedServices.includes("Others");

  return (
    <>
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
                  Request one or more services
                </Text>
              </View>
            </View>

            {/* MULTIPLE SERVICE CHECKBOXES */}
            <View style={styles.sectionLabelRow}>
              <Text style={styles.sectionLabel}>SELECT SERVICES</Text>
              <Text style={styles.selectionHint}>
                {selectedServices.length} SELECTED
              </Text>
            </View>

            {SERVICES.map((service) => {
              const selected = selectedServices.includes(service.name);

              return (
                <TouchableOpacity
                  key={service.name}
                  activeOpacity={0.8}
                  style={[
                    styles.option,
                    selected && styles.selectedOption,
                  ]}
                  onPress={() => toggleService(service.name)}
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
                      styles.checkbox,
                      selected && styles.checkboxSelected,
                    ]}
                  >
                    {selected && (
                      <Ionicons
                        name="checkmark"
                        size={15}
                        color="#FFFFFF"
                      />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* APPOINTMENT DATE */}
            <View style={styles.notesHeader}>
              <View style={styles.notesTitleRow}>
                <Ionicons
                  name="calendar"
                  size={18}
                  color={ORANGE}
                />
                <Text style={styles.notesTitle}>
                  Preferred Appointment Date
                </Text>
                <Text style={styles.requiredLabel}>REQUIRED</Text>
              </View>

              <Text style={styles.notesSubtitle}>
                Select your preferred date. Your request will remain pending
                until reviewed by the admin.
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dateList}
            >
              {availableDates.map((date) => {
                const key = dateToKey(date);
                const selected = selectedDate === key;

                return (
                  <TouchableOpacity
                    key={key}
                    activeOpacity={0.8}
                    onPress={() => setSelectedDate(key)}
                    style={[
                      styles.dateOption,
                      selected && styles.dateOptionSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dateDay,
                        selected && styles.dateTextSelected,
                      ]}
                    >
                      {date.toLocaleDateString([], {
                        weekday: "short",
                      }).toUpperCase()}
                    </Text>

                    <Text
                      style={[
                        styles.dateNumber,
                        selected && styles.dateTextSelected,
                      ]}
                    >
                      {date.getDate()}
                    </Text>

                    <Text
                      style={[
                        styles.dateMonth,
                        selected && styles.dateTextSelected,
                      ]}
                    >
                      {date.toLocaleDateString([], {
                        month: "short",
                      }).toUpperCase()}
                    </Text>

                    {selected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={15}
                        color="#FFFFFF"
                        style={styles.dateCheck}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.selectedDateSummary}>
              <Ionicons
                name="calendar-outline"
                size={17}
                color={AMBER}
              />
              <Text style={styles.selectedDateText}>
                {selectedDate
                  ? formatAppointmentDate(selectedDate)
                  : "No appointment date selected"}
              </Text>
            </View>

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
                You can change your appointment date while it is pending.
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={createAppointment}
              disabled={submitting || authLoading}
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
                style={styles.button}
              >
                {submitting || authLoading ? (
                  <>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={styles.buttonText}>
                      {authLoading
                        ? "VERIFYING ACCOUNT..."
                        : "SENDING REQUEST..."}
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

        {/* APPOINTMENT HISTORY */}
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
            const canReschedule = status === "pending";

            // Old records may only have serviceType.
            const services: string[] =
              Array.isArray(item.serviceTypes) && item.serviceTypes.length
                ? item.serviceTypes
                : item.serviceType
                  ? String(item.serviceType).split(", ")
                  : [];

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
                      name={getServiceIcon(services[0] || "")}
                      size={23}
                      color={status === "cancelled" ? "#A1A1AA" : ORANGE}
                    />
                  </View>

                  <View style={styles.historyMain}>
                    <Text style={styles.service}>
                      {services.length
                        ? services
                            .map((service) =>
                              service === "Tire" ? "Tire Service" : service
                            )
                            .join(", ")
                        : "Service Request"}
                    </Text>

                    {!!formatDate(item.createdAt) && (
                      <Text style={styles.historyDate}>
                        Submitted: {formatDate(item.createdAt)}
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

                {/* APPOINTMENT DATE DISPLAY */}
                <View style={styles.appointmentDateBox}>
                  <Ionicons
                    name="calendar-outline"
                    size={17}
                    color={AMBER}
                  />
                  <View style={styles.appointmentDateContent}>
                    <Text style={styles.appointmentDateLabel}>
                      APPOINTMENT DATE
                    </Text>
                    <Text style={styles.appointmentDateValue}>
                      {formatAppointmentDate(item.appointmentDate)}
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

                {/* PENDING APPOINTMENT ACTIONS */}
                {canReschedule && (
                  <View style={styles.actionArea}>
                    <TouchableOpacity
                      style={styles.rescheduleButton}
                      activeOpacity={0.8}
                      disabled={busy || !!busyAppointmentId}
                      onPress={() => openReschedule(item)}
                    >
                      <Ionicons
                        name="calendar-outline"
                        size={18}
                        color={AMBER}
                      />
                      <Text style={styles.rescheduleButtonText}>
                        RESCHEDULE
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* CANCEL / RESTORE */}
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
                          <ActivityIndicator
                            size="small"
                            color="#FF7777"
                          />
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
                          <ActivityIndicator
                            size="small"
                            color={AMBER}
                          />
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

      {/* RESCHEDULING MODAL */}
      <Modal
        visible={!!rescheduleAppointment}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setRescheduleAppointment(null);
          setRescheduleDate("");
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIcon}>
                <Ionicons
                  name="calendar-outline"
                  size={25}
                  color={ORANGE}
                />
              </View>

              <TouchableOpacity
                onPress={() => {
                  setRescheduleAppointment(null);
                  setRescheduleDate("");
                }}
                style={styles.modalClose}
              >
                <Ionicons name="close" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalTitle}>Reschedule Appointment</Text>

            <Text style={styles.modalSubtitle}>
              Choose a new preferred date for your pending appointment.
            </Text>

            <View style={styles.currentDateBox}>
              <Text style={styles.currentDateLabel}>CURRENT DATE</Text>
              <Text style={styles.currentDateValue}>
                {formatAppointmentDate(
                  rescheduleAppointment?.appointmentDate
                )}
              </Text>
            </View>

            <Text style={styles.modalSectionLabel}>
              SELECT A NEW DATE
            </Text>

            <ScrollView
              style={styles.modalDateScroll}
              contentContainerStyle={styles.modalDateGrid}
              showsVerticalScrollIndicator={false}
            >
              {availableDates.map((date) => {
                const key = dateToKey(date);
                const selected = rescheduleDate === key;
                const isCurrent =
                  key === rescheduleAppointment?.appointmentDate;

                return (
                  <TouchableOpacity
                    key={key}
                    activeOpacity={0.8}
                    disabled={isCurrent}
                    onPress={() => setRescheduleDate(key)}
                    style={[
                      styles.modalDateOption,
                      selected && styles.modalDateOptionSelected,
                      isCurrent && styles.modalDateOptionDisabled,
                    ]}
                  >
                    <Text
                      style={[
                        styles.modalDateDay,
                        selected && styles.dateTextSelected,
                      ]}
                    >
                      {date.toLocaleDateString([], {
                        weekday: "short",
                      })}
                    </Text>

                    <Text
                      style={[
                        styles.modalDateNumber,
                        selected && styles.dateTextSelected,
                      ]}
                    >
                      {date.getDate()}
                    </Text>

                    <Text
                      style={[
                        styles.modalDateMonth,
                        selected && styles.dateTextSelected,
                      ]}
                    >
                      {date.toLocaleDateString([], {
                        month: "short",
                      })}
                    </Text>

                    {isCurrent && (
                      <Text style={styles.currentDateTag}>CURRENT</Text>
                    )}

                    {selected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color="#FFFFFF"
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.modalSelectedDate}>
              <Ionicons
                name="calendar"
                size={17}
                color={AMBER}
              />
              <Text style={styles.modalSelectedDateText}>
                {rescheduleDate
                  ? formatAppointmentDate(rescheduleDate)
                  : "Select your new appointment date"}
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              disabled={!rescheduleDate || !!busyAppointmentId}
              onPress={saveReschedule}
              style={styles.modalSubmitWrapper}
            >
              <LinearGradient
                colors={
                  !rescheduleDate || !!busyAppointmentId
                    ? ["#6B7280", "#374151"]
                    : [AMBER, ORANGE, "#E95B08"]
                }
                style={styles.modalSubmitButton}
              >
                {busyAppointmentId === rescheduleAppointment?.id ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={19}
                      color="#FFFFFF"
                    />
                    <Text style={styles.buttonText}>
                      CONFIRM NEW DATE
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
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

  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#626B77",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 3,
  },

  checkboxSelected: {
    borderColor: ORANGE,
    backgroundColor: ORANGE,
  },

  notesHeader: {
    marginTop: 18,
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

  dateList: {
    gap: 9,
    paddingVertical: 5,
    paddingRight: 5,
  },

  dateOption: {
    width: 67,
    minHeight: 91,
    borderRadius: 13,
    backgroundColor: "#0A0D12",
    borderWidth: 1,
    borderColor: "#30343D",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
  },

  dateOptionSelected: {
    backgroundColor: ORANGE,
    borderColor: AMBER,
  },

  dateDay: {
    color: "#929BA7",
    fontSize: 9,
    fontWeight: "900",
  },

  dateNumber: {
    color: "#FFFFFF",
    fontSize: 23,
    fontWeight: "900",
    marginVertical: 2,
  },

  dateMonth: {
    color: "#929BA7",
    fontSize: 9,
    fontWeight: "800",
  },

  dateTextSelected: {
    color: "#FFFFFF",
  },

  dateCheck: {
    position: "absolute",
    top: 4,
    right: 4,
  },

  selectedDateSummary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255,170,51,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,170,51,0.18)",
    marginTop: 12,
  },

  selectedDateText: {
    flex: 1,
    color: "#E4E7EB",
    fontSize: 12,
    fontWeight: "700",
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
    fontSize: 13,
    marginBottom: 4,
  },

  historyDate: {
    color: "#8D96A2",
    fontSize: 10,
  },

  appointmentDateBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 11,
    marginTop: 13,
    borderRadius: 12,
    backgroundColor: "rgba(255,170,51,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,170,51,0.15)",
  },

  appointmentDateContent: {
    flex: 1,
  },

  appointmentDateLabel: {
    color: "#929BA7",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
    marginBottom: 4,
  },

  appointmentDateValue: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
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
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.07)",
    gap: 9,
  },

  rescheduleButton: {
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

  rescheduleButtonText: {
    color: AMBER,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.7,
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

  // Rescheduling modal.
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.78)",
    justifyContent: "center",
    padding: 18,
  },

  modalCard: {
    maxHeight: "88%",
    backgroundColor: "#131820",
    borderRadius: 23,
    borderWidth: 1,
    borderColor: "rgba(255,122,24,0.35)",
    padding: 19,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  modalIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: "rgba(255,122,24,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },

  modalClose: {
    width: 35,
    height: 35,
    borderRadius: 12,
    backgroundColor: "#252B34",
    alignItems: "center",
    justifyContent: "center",
  },

  modalTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
  },

  modalSubtitle: {
    color: "#A1AAB6",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 7,
    marginBottom: 17,
  },

  currentDateBox: {
    backgroundColor: "#0B0F15",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#303640",
    padding: 12,
    marginBottom: 17,
  },

  currentDateLabel: {
    color: "#929BA7",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 5,
  },

  currentDateValue: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },

  modalSectionLabel: {
    color: "#E4E7EB",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 10,
  },

  modalDateScroll: {
    maxHeight: 260,
  },

  modalDateGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingBottom: 8,
  },

  modalDateOption: {
    width: "22%",
    minHeight: 78,
    flexGrow: 1,
    backgroundColor: "#0B0F15",
    borderWidth: 1,
    borderColor: "#303640",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },

  modalDateOptionSelected: {
    backgroundColor: ORANGE,
    borderColor: AMBER,
  },

  modalDateOptionDisabled: {
    opacity: 0.35,
  },

  modalDateDay: {
    color: "#A1AAB6",
    fontSize: 9,
    fontWeight: "800",
  },

  modalDateNumber: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
    marginVertical: 2,
  },

  modalDateMonth: {
    color: "#A1AAB6",
    fontSize: 9,
    fontWeight: "800",
  },

  currentDateTag: {
    color: "#A1AAB6",
    fontSize: 7,
    fontWeight: "900",
    marginTop: 3,
  },

  modalSelectedDate: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    padding: 12,
    backgroundColor: "rgba(255,170,51,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,170,51,0.18)",
    borderRadius: 12,
    marginTop: 13,
  },

  modalSelectedDateText: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },

  modalSubmitWrapper: {
    marginTop: 15,
    borderRadius: 14,
    overflow: "hidden",
  },

  modalSubmitButton: {
    minHeight: 51,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    borderRadius: 14,
  },
});
