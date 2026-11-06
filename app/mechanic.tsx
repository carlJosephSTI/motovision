
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import {
    collection,
    doc,
    getDoc,
    onSnapshot,
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { auth, db } from "../firebaseConfig";

type Appointment = {
  id: string;
  userName?: string;
  customerName?: string;
  name?: string;
  userEmail?: string;
  email?: string;
  serviceType?: string;
  service?: string;
  notes?: string;
  adminMessage?: string;
  status?: string;
  createdAt?: any;
  appointmentDate?: any;
  date?: any;
  [key: string]: any;
};

function formatDate(value: any): string {
  if (!value) return "Date not available";

  try {
    let date: Date;

    if (typeof value?.toDate === "function") {
      date = value.toDate();
    } else if (value instanceof Date) {
      date = value;
    } else if (typeof value === "string" || typeof value === "number") {
      date = new Date(value);
    } else {
      return "Date not available";
    }

    if (Number.isNaN(date.getTime())) {
      return "Date not available";
    }

    return date.toLocaleString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "Date not available";
  }
}

function normalizeStatus(status?: string): string {
  return (status || "pending").trim().toLowerCase();
}

function getStatusStyle(status?: string) {
  switch (normalizeStatus(status)) {
    case "approved":
      return {
        backgroundColor: "#ECFDF5",
        color: "#059669",
        icon: "checkmark-circle-outline" as const,
      };

    case "rejected":
      return {
        backgroundColor: "#FEF2F2",
        color: "#DC2626",
        icon: "close-circle-outline" as const,
      };

    case "completed":
      return {
        backgroundColor: "#EFF6FF",
        color: "#2563EB",
        icon: "checkmark-done-circle-outline" as const,
      };

    case "cancelled":
    case "canceled":
      return {
        backgroundColor: "#F1F5F9",
        color: "#64748B",
        icon: "ban-outline" as const,
      };

    default:
      return {
        backgroundColor: "#FFF7ED",
        color: "#EA580C",
        icon: "time-outline" as const,
      };
  }
}

export default function MechanicDashboard() {
  const router = useRouter();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  const [mechanicName, setMechanicName] = useState("Mechanic");

  useEffect(() => {
    let unsubscribeAppointments: (() => void) | undefined;
    let cancelled = false;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (unsubscribeAppointments) {
        unsubscribeAppointments();
        unsubscribeAppointments = undefined;
      }

      if (!user) {
        if (!cancelled) {
          setCheckingRole(false);
          setLoading(false);
          Alert.alert(
            "Login Required",
            "Please log in to access the mechanic dashboard."
          );
          router.replace("/(auth)/login");
        }
        return;
      }

      try {
        setCheckingRole(true);

        const userRef = doc(db, "users", user.uid);
        const userSnapshot = await getDoc(userRef);

        if (cancelled) return;

        if (!userSnapshot.exists()) {
          Alert.alert(
            "Account Not Found",
            "Your user profile could not be found."
          );
          await auth.signOut();
          router.replace("/(auth)/login");
          return;
        }

        const userData = userSnapshot.data();

        if (userData.role !== "mechanic") {
          Alert.alert(
            "Access Denied",
            "This account is not authorized to access the mechanic dashboard."
          );

          router.replace(
            userData.role === "admin"
              ? "/admin"
              : "/(tabs)"
          );
          return;
        }

        setMechanicName(
          userData.fullName ||
            userData.name ||
            user.displayName ||
            "Mechanic"
        );

        setCheckingRole(false);

        unsubscribeAppointments = onSnapshot(
          collection(db, "appointments"),
          (snapshot) => {
            const appointmentList: Appointment[] = snapshot.docs.map(
              (appointmentDoc) => ({
                id: appointmentDoc.id,
                ...appointmentDoc.data(),
              })
            );

            appointmentList.sort((a, b) => {
              const dateA =
                a.createdAt?.toDate?.()?.getTime?.() ||
                new Date(a.createdAt || 0).getTime() ||
                0;

              const dateB =
                b.createdAt?.toDate?.()?.getTime?.() ||
                new Date(b.createdAt || 0).getTime() ||
                0;

              return dateB - dateA;
            });

            setAppointments(appointmentList);
            setLoading(false);
            setRefreshing(false);
          },
          (error) => {
            console.error("Appointments listener error:", error);

            setLoading(false);
            setRefreshing(false);

            Alert.alert(
              "Unable to Load Appointments",
              "The app could not retrieve appointment records. Please check your connection and Firestore permissions."
            );
          }
        );
      } catch (error) {
        console.error("Mechanic role verification failed:", error);

        if (!cancelled) {
          setCheckingRole(false);
          setLoading(false);

          Alert.alert(
            "Verification Failed",
            "We could not verify your mechanic account. Please log in again."
          );

          router.replace("/(auth)/login");
        }
      }
    });

    return () => {
      cancelled = true;
      unsubscribeAuth();

      if (unsubscribeAppointments) {
        unsubscribeAppointments();
      }
    };
  }, [router]);

  const counts = useMemo(() => {
    const result = {
      total: appointments.length,
      pending: 0,
      approved: 0,
      rejected: 0,
      completed: 0,
      cancelled: 0,
    };

    appointments.forEach((appointment) => {
      const status = normalizeStatus(appointment.status);

      if (status === "pending") result.pending++;
      else if (status === "approved") result.approved++;
      else if (status === "rejected") result.rejected++;
      else if (status === "completed") result.completed++;
      else if (status === "cancelled" || status === "canceled") {
        result.cancelled++;
      }
    });

    return result;
  }, [appointments]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);

    // Firestore's onSnapshot listener is already real-time.
    // This refresh indicator simply gives the user feedback.
    setTimeout(() => {
      setRefreshing(false);
    }, 600);
  };

  if (checkingRole || loading) {
    return (
      <View style={styles.loadingScreen}>
        <View style={styles.loadingIcon}>
          <Ionicons
            name="construct-outline"
            size={32}
            color="#0879D9"
          />
        </View>

        <ActivityIndicator
          size="large"
          color="#0879D9"
        />

        <Text style={styles.loadingTitle}>
          Loading Mechanic Dashboard
        </Text>

        <Text style={styles.loadingSubtitle}>
          Verifying your account and retrieving appointments...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#0879D9"
          />
        }
      >
        {/* Header */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.75}
            onPress={handleBack}
          >
            <Ionicons
              name="arrow-back"
              size={21}
              color="#24364B"
            />
          </TouchableOpacity>

          <View style={styles.brandText}>
            <Text style={styles.brandName}>
              MotoVision
            </Text>
            <Text style={styles.brandCaption}>
              MECHANIC WORKSPACE
            </Text>
          </View>

          <View style={styles.roleBadge}>
            <Ionicons
              name="construct-outline"
              size={15}
              color="#0879D9"
            />
            <Text style={styles.roleBadgeText}>
              MECHANIC
            </Text>
          </View>
        </View>

        {/* Welcome Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.heroIcon}>
              <Ionicons
                name="speedometer-outline"
                size={29}
                color="#FFFFFF"
              />
            </View>

            <View style={styles.onlineBadge}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>
                LIVE UPDATES
              </Text>
            </View>
          </View>

          <Text style={styles.heroGreeting}>
            Welcome back,
          </Text>

          <Text style={styles.heroName}>
            {mechanicName}
          </Text>

          <Text style={styles.heroDescription}>
            Keep track of customer appointments and stay updated
            with the latest service requests.
          </Text>

          <View style={styles.heroDivider} />

          <View style={styles.heroFooter}>
            <Ionicons
              name="eye-outline"
              size={17}
              color="#BAE6FD"
            />
            <Text style={styles.heroFooterText}>
              VIEW-ONLY APPOINTMENT ACCESS
            </Text>
          </View>
        </View>

        {/* Overview */}
        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.eyebrow}>
              APPOINTMENT OVERVIEW
            </Text>
            <Text style={styles.sectionTitle}>
              Booking Summary
            </Text>
          </View>

          <View style={styles.totalBadge}>
            <Text style={styles.totalNumber}>
              {counts.total}
            </Text>
            <Text style={styles.totalLabel}>
              TOTAL
            </Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: "#FFF7ED" }]}>
              <Ionicons
                name="time-outline"
                size={20}
                color="#EA580C"
              />
            </View>
            <Text style={styles.statNumber}>
              {counts.pending}
            </Text>
            <Text style={styles.statLabel}>
              Pending
            </Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: "#ECFDF5" }]}>
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color="#059669"
              />
            </View>
            <Text style={styles.statNumber}>
              {counts.approved}
            </Text>
            <Text style={styles.statLabel}>
              Approved
            </Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: "#FEF2F2" }]}>
              <Ionicons
                name="close-circle-outline"
                size={20}
                color="#DC2626"
              />
            </View>
            <Text style={styles.statNumber}>
              {counts.rejected}
            </Text>
            <Text style={styles.statLabel}>
              Rejected
            </Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: "#EFF6FF" }]}>
              <Ionicons
                name="checkmark-done-circle-outline"
                size={20}
                color="#2563EB"
              />
            </View>
            <Text style={styles.statNumber}>
              {counts.completed}
            </Text>
            <Text style={styles.statLabel}>
              Completed
            </Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: "#F1F5F9" }]}>
              <Ionicons
                name="ban-outline"
                size={20}
                color="#64748B"
              />
            </View>
            <Text style={styles.statNumber}>
              {counts.cancelled}
            </Text>
            <Text style={styles.statLabel}>
              Cancelled
            </Text>
          </View>
        </View>

        {/* Appointments */}
        <View style={styles.appointmentsHeading}>
          <View>
            <Text style={styles.eyebrow}>
              CUSTOMER BOOKINGS
            </Text>
            <Text style={styles.sectionTitle}>
              All Appointments
            </Text>
          </View>

          <View style={styles.appointmentCountBadge}>
            <Text style={styles.appointmentCountText}>
              {appointments.length} records
            </Text>
          </View>
        </View>

        {appointments.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="calendar-outline"
                size={34}
                color="#94A3B8"
              />
            </View>

            <Text style={styles.emptyTitle}>
              No Appointments Yet
            </Text>

            <Text style={styles.emptySubtitle}>
              Customer bookings will appear here once they are
              submitted through MotoVision.
            </Text>
          </View>
        ) : (
          <View style={styles.appointmentsList}>
            {appointments.map((appointment, index) => {
              const statusStyle = getStatusStyle(
                appointment.status
              );

              const customerName =
                appointment.userName ||
                appointment.customerName ||
                appointment.name ||
                "Customer";

              const customerEmail =
                appointment.userEmail ||
                appointment.email ||
                "Email not available";

              const serviceType =
                appointment.serviceType ||
                appointment.service ||
                "General Service";

              return (
                <View
                  key={appointment.id}
                  style={styles.appointmentCard}
                >
                  <View style={styles.appointmentTop}>
                    <View style={styles.appointmentNumber}>
                      <Text style={styles.appointmentNumberText}>
                        {String(index + 1).padStart(2, "0")}
                      </Text>
                    </View>

                    <View style={styles.appointmentTopInfo}>
                      <Text style={styles.customerName}>
                        {customerName}
                      </Text>
                      <Text style={styles.customerEmail}>
                        {customerEmail}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: statusStyle.backgroundColor },
                      ]}
                    >
                      <Ionicons
                        name={statusStyle.icon}
                        size={13}
                        color={statusStyle.color}
                      />
                      <Text
                        style={[
                          styles.statusText,
                          { color: statusStyle.color },
                        ]}
                      >
                        {normalizeStatus(appointment.status).toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardDivider} />

                  <View style={styles.detailRow}>
                    <View style={styles.detailIcon}>
                      <Ionicons
                        name="construct-outline"
                        size={17}
                        color="#0879D9"
                      />
                    </View>

                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>
                        SERVICE TYPE
                      </Text>
                      <Text style={styles.detailValue}>
                        {serviceType}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <View style={styles.detailIcon}>
                      <Ionicons
                        name="calendar-outline"
                        size={17}
                        color="#0879D9"
                      />
                    </View>

                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>
                        DATE SUBMITTED
                      </Text>
                      <Text style={styles.detailValue}>
                        {formatDate(
                          appointment.createdAt ||
                            appointment.appointmentDate ||
                            appointment.date
                        )}
                      </Text>
                    </View>
                  </View>

                  {appointment.notes ? (
                    <View style={styles.messageBox}>
                      <Text style={styles.messageLabel}>
                        CUSTOMER NOTES
                      </Text>
                      <Text style={styles.messageText}>
                        {appointment.notes}
                      </Text>
                    </View>
                  ) : null}

                  {appointment.adminMessage ? (
                    <View style={styles.adminMessageBox}>
                      <View style={styles.adminMessageHeading}>
                        <Ionicons
                          name="chatbox-ellipses-outline"
                          size={15}
                          color="#0879D9"
                        />
                        <Text style={styles.adminMessageLabel}>
                          ADMIN MESSAGE
                        </Text>
                      </View>

                      <Text style={styles.messageText}>
                        {appointment.adminMessage}
                      </Text>
                    </View>
                  ) : null}

                  <View style={styles.readOnlyFooter}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={13}
                      color="#94A3B8"
                    />
                    <Text style={styles.readOnlyText}>
                      Read-only appointment record
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Ionicons
            name="shield-checkmark-outline"
            size={16}
            color="#94A3B8"
          />
          <Text style={styles.footerText}>
            MOTOVISION MECHANIC WORKSPACE
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F7FC",
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 45,
  },

  loadingScreen: {
    flex: 1,
    backgroundColor: "#F3F7FC",
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },

  loadingIcon: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: "#E0F2FE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
  },

  loadingTitle: {
    color: "#172B45",
    fontSize: 17,
    fontWeight: "900",
    marginTop: 18,
  },

  loadingSubtitle: {
    color: "#7A8BA1",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    marginTop: 7,
  },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    gap: 12,
  },

  backButton: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E1E8F0",
    alignItems: "center",
    justifyContent: "center",
  },

  brandText: {
    flex: 1,
  },

  brandName: {
    fontSize: 21,
    fontWeight: "900",
    color: "#14243A",
    letterSpacing: -0.6,
  },

  brandCaption: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.8,
    color: "#64748B",
    marginTop: 3,
  },

  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#E0F2FE",
  },

  roleBadgeText: {
    color: "#0879D9",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.7,
  },

  heroCard: {
    backgroundColor: "#102B49",
    borderRadius: 25,
    padding: 22,
    marginBottom: 30,
    shadowColor: "#153A60",
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 5,
  },

  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },

  heroIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: "#0879D9",
    alignItems: "center",
    justifyContent: "center",
  },

  onlineBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
  },

  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 5,
    backgroundColor: "#5EEAD4",
  },

  onlineText: {
    color: "#D9F9F2",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.8,
  },

  heroGreeting: {
    color: "#B9D1E8",
    fontSize: 13,
    fontWeight: "600",
  },

  heroName: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.7,
    marginTop: 3,
  },

  heroDescription: {
    color: "#D2E1F0",
    fontSize: 11,
    lineHeight: 18,
    marginTop: 9,
  },

  heroDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginVertical: 17,
  },

  heroFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  heroFooterText: {
    color: "#BAE6FD",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },

  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },

  eyebrow: {
    color: "#0879D9",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.7,
    marginBottom: 5,
  },

  sectionTitle: {
    color: "#14243A",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.5,
  },

  totalBadge: {
    minWidth: 52,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#E0F2FE",
    alignItems: "center",
    justifyContent: "center",
  },

  totalNumber: {
    color: "#0879D9",
    fontSize: 17,
    fontWeight: "900",
  },

  totalLabel: {
    color: "#0879D9",
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.8,
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 30,
  },

  statCard: {
    width: "31%",
    minHeight: 117,
    flexGrow: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E7EDF5",
  },

  statIcon: {
    width: 35,
    height: 35,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  statNumber: {
    color: "#172B45",
    fontSize: 21,
    fontWeight: "900",
  },

  statLabel: {
    color: "#7A8BA1",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 3,
  },

  appointmentsHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },

  appointmentCountBadge: {
    backgroundColor: "#E0F2FE",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
  },

  appointmentCountText: {
    color: "#0879D9",
    fontSize: 9,
    fontWeight: "900",
  },

  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 21,
    borderWidth: 1,
    borderColor: "#E7EDF5",
    padding: 28,
    alignItems: "center",
  },

  emptyIcon: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  emptyTitle: {
    color: "#24364B",
    fontSize: 16,
    fontWeight: "900",
  },

  emptySubtitle: {
    color: "#94A3B8",
    fontSize: 11,
    textAlign: "center",
    lineHeight: 18,
    marginTop: 7,
  },

  appointmentsList: {
    gap: 14,
  },

  appointmentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 21,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E7EDF5",
    shadowColor: "#1E3A5F",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },

  appointmentTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  appointmentNumber: {
    width: 39,
    height: 39,
    borderRadius: 13,
    backgroundColor: "#E0F2FE",
    alignItems: "center",
    justifyContent: "center",
  },

  appointmentNumberText: {
    color: "#0879D9",
    fontSize: 12,
    fontWeight: "900",
  },

  appointmentTopInfo: {
    flex: 1,
  },

  customerName: {
    color: "#172B45",
    fontSize: 13,
    fontWeight: "900",
  },

  customerEmail: {
    color: "#94A3B8",
    fontSize: 10,
    marginTop: 4,
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 20,
  },

  statusText: {
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.3,
  },

  cardDivider: {
    height: 1,
    backgroundColor: "#F0F3F8",
    marginVertical: 15,
  },

  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 13,
  },

  detailIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },

  detailContent: {
    flex: 1,
  },

  detailLabel: {
    color: "#94A3B8",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 4,
  },

  detailValue: {
    color: "#24364B",
    fontSize: 11,
    fontWeight: "700",
  },

  messageBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 13,
    padding: 12,
    marginTop: 2,
    marginBottom: 10,
  },

  messageLabel: {
    color: "#64748B",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 6,
  },

  messageText: {
    color: "#475569",
    fontSize: 11,
    lineHeight: 17,
  },

  adminMessageBox: {
    backgroundColor: "#EFF6FF",
    borderRadius: 13,
    padding: 12,
    marginTop: 2,
  },

  adminMessageHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 7,
  },

  adminMessageLabel: {
    color: "#0879D9",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
  },

  readOnlyFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: "#F0F3F8",
    marginTop: 14,
    paddingTop: 11,
  },

  readOnlyText: {
    color: "#94A3B8",
    fontSize: 9,
    fontWeight: "700",
  },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 30,
  },

  footerText: {
    color: "#94A3B8",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.1,
  },
});
