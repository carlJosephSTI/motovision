
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import {
    collection,
    doc,
    getDoc,
    onSnapshot,
} from "firebase/firestore";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    BackHandler,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { auth, db } from "../firebaseConfig";

// --------------------------------------------------
// TYPES
// --------------------------------------------------

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
};

// --------------------------------------------------
// HELPERS
// --------------------------------------------------

const getDateValue = (value: any): Date | null => {
  if (!value) return null;

  if (value?.toDate && typeof value.toDate === "function") {
    return value.toDate();
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
};

const formatDate = (value: any) => {
  const date = getDateValue(value);

  if (!date) return "Date unavailable";

  return date.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatDateTime = (value: any) => {
  const date = getDateValue(value);

  if (!date) return "Date unavailable";

  return date.toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const getStatusColor = (status?: string) => {
  switch ((status || "").toLowerCase()) {
    case "approved":
      return "#16A34A";
    case "completed":
      return "#2563EB";
    case "rejected":
    case "cancelled":
      return "#DC2626";
    case "pending":
      return "#D97706";
    default:
      return "#64748B";
  }
};

const getCustomerName = (item: Appointment) =>
  item.customerName || item.userName || item.name || "Unknown Customer";

const getCustomerEmail = (item: Appointment) =>
  item.userEmail || item.email || "No email provided";

const getServiceName = (item: Appointment) =>
  item.serviceType || item.service || "General Service";

// --------------------------------------------------
// MECHANIC DASHBOARD
// --------------------------------------------------

export default function MechanicDashboard() {
  const router = useRouter();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // ------------------------------------------------
  // DISABLE BACK NAVIGATION
  // Android hardware Back redirects to login.
  // The header and swipe-back gesture are disabled.
  // ------------------------------------------------

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        router.replace("/(auth)/login");
        return true;
      }
    );

    return () => backHandler.remove();
  }, [router]);

  // ------------------------------------------------
  // CHECK MECHANIC ROLE
  // ------------------------------------------------

  useEffect(() => {
    let active = true;

    const verifyMechanic = async () => {
      try {
        const currentUser = auth.currentUser;

        if (!currentUser) {
          router.replace("/(auth)/login");
          return;
        }

        const userRef = doc(db, "users", currentUser.uid);
        const userSnapshot = await getDoc(userRef);

        if (!active) return;

        if (!userSnapshot.exists()) {
          await signOut(auth);
          router.replace("/(auth)/login");
          return;
        }

        const role = userSnapshot.data()?.role;

        if (role !== "mechanic") {
          if (role === "admin") {
            router.replace("/admin");
          } else {
            router.replace("/(tabs)");
          }
          return;
        }

        setAuthorized(true);
      } catch (error) {
        console.error("Mechanic authorization error:", error);

        if (active) {
          setErrorMessage("Unable to verify your account. Please log in again.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    verifyMechanic();

    return () => {
      active = false;
    };
  }, [router]);

  // ------------------------------------------------
  // LISTEN TO ALL APPOINTMENTS
  // ------------------------------------------------

  useEffect(() => {
    if (!authorized) return;

    setLoading(true);
    setErrorMessage("");

    const unsubscribe = onSnapshot(
      collection(db, "appointments"),
      (snapshot) => {
        const appointmentList: Appointment[] = snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }));

        appointmentList.sort((a, b) => {
          const dateA = getDateValue(a.createdAt)?.getTime() || 0;
          const dateB = getDateValue(b.createdAt)?.getTime() || 0;

          return dateB - dateA;
        });

        setAppointments(appointmentList);
        setLoading(false);
        setRefreshing(false);
      },
      (error) => {
        console.error("Appointment listener error:", error);

        setErrorMessage(
          "Unable to load appointments. Please check your connection or access permissions."
        );

        setLoading(false);
        setRefreshing(false);
      }
    );

    return () => unsubscribe();
  }, [authorized]);

  // ------------------------------------------------
  // REFRESH
  // ------------------------------------------------

  const onRefresh = useCallback(() => {
    setRefreshing(true);

    // The Firestore listener updates automatically.
    // This gives the user a brief refresh indicator.
    setTimeout(() => {
      setRefreshing(false);
    }, 600);
  }, []);

  // ------------------------------------------------
  // LOGOUT
  // ------------------------------------------------

  const handleLogout = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            try {
              await signOut(auth);
              router.replace("/(auth)/login");
            } catch (error) {
              console.error("Logout error:", error);
              Alert.alert("Error", "Unable to log out. Please try again.");
            }
          },
        },
      ]
    );
  };

  // ------------------------------------------------
  // APPOINTMENT COUNTS
  // ------------------------------------------------

  const pendingCount = appointments.filter(
    (a) => (a.status || "").toLowerCase() === "pending"
  ).length;

  const approvedCount = appointments.filter(
    (a) => (a.status || "").toLowerCase() === "approved"
  ).length;

  const completedCount = appointments.filter(
    (a) => (a.status || "").toLowerCase() === "completed"
  ).length;

  const cancelledCount = appointments.filter((a) =>
    ["cancelled", "rejected"].includes((a.status || "").toLowerCase())
  ).length;

  // ------------------------------------------------
  // LOADING SCREEN
  // ------------------------------------------------

  if (loading) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />

        <View style={styles.loadingContainer}>
          <StatusBar barStyle="dark-content" backgroundColor="#F5F7FB" />
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>
            Loading mechanic dashboard...
          </Text>
        </View>
      </>
    );
  }

  // ------------------------------------------------
  // ERROR SCREEN
  // ------------------------------------------------

  if (!authorized && errorMessage) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />

        <View style={styles.loadingContainer}>
          <StatusBar barStyle="dark-content" backgroundColor="#F5F7FB" />

          <Ionicons
            name="alert-circle-outline"
            size={55}
            color="#DC2626"
          />

          <Text style={styles.errorTitle}>Access Error</Text>
          <Text style={styles.errorText}>{errorMessage}</Text>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.replace("/(auth)/login")}
          >
            <Text style={styles.loginButtonText}>Return to Login</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  // ------------------------------------------------
  // MAIN DASHBOARD
  // ------------------------------------------------

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />

      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#123B70" />

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#2563EB"]}
              tintColor="#2563EB"
            />
          }
        >
          {/* HEADER */}

          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View style={styles.headerTitleContainer}>
                <View style={styles.logoContainer}>
                  <Ionicons
                    name="construct"
                    size={25}
                    color="#FFFFFF"
                  />
                </View>

                <View>
                  <Text style={styles.brandName}>MotoVision</Text>
                  <Text style={styles.headerSubtitle}>
                    MECHANIC PORTAL
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="log-out-outline"
                  size={20}
                  color="#FFFFFF"
                />
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeLabel}>WELCOME BACK</Text>
              <Text style={styles.welcomeTitle}>
                Mechanic Dashboard
              </Text>
              <Text style={styles.welcomeDescription}>
                View and monitor customer service appointments.
              </Text>
            </View>
          </View>

          {/* MAIN CONTENT */}

          <View style={styles.content}>
            {/* SUMMARY */}

            <View style={styles.sectionHeading}>
              <Text style={styles.sectionTitle}>Appointment Overview</Text>
              <Text style={styles.sectionSubtitle}>
                Live appointment records
              </Text>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: "#DBEAFE" }]}>
                  <Ionicons name="calendar-outline" size={21} color="#2563EB" />
                </View>
                <Text style={styles.statNumber}>{appointments.length}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: "#FEF3C7" }]}>
                  <Ionicons name="time-outline" size={21} color="#D97706" />
                </View>
                <Text style={styles.statNumber}>{pendingCount}</Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: "#DCFCE7" }]}>
                  <Ionicons name="checkmark-circle-outline" size={21} color="#16A34A" />
                </View>
                <Text style={styles.statNumber}>{approvedCount}</Text>
                <Text style={styles.statLabel}>Approved</Text>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: "#DBEAFE" }]}>
                  <Ionicons name="checkmark-done-outline" size={21} color="#2563EB" />
                </View>
                <Text style={styles.statNumber}>{completedCount}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
            </View>

            <View style={styles.cancelledSummary}>
              <Ionicons
                name="close-circle-outline"
                size={19}
                color="#DC2626"
              />
              <Text style={styles.cancelledText}>
                {cancelledCount} cancelled or rejected appointment(s)
              </Text>
            </View>

            {/* APPOINTMENTS */}

            <View style={styles.appointmentsHeading}>
              <View>
                <Text style={styles.sectionTitle}>Customer Appointments</Text>
                <Text style={styles.sectionSubtitle}>
                  All registered customer requests
                </Text>
              </View>

              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            </View>

            {errorMessage ? (
              <View style={styles.errorCard}>
                <Ionicons
                  name="alert-circle-outline"
                  size={22}
                  color="#DC2626"
                />
                <Text style={styles.errorCardText}>{errorMessage}</Text>
              </View>
            ) : null}

            {appointments.length === 0 ? (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIcon}>
                  <Ionicons
                    name="calendar-clear-outline"
                    size={38}
                    color="#94A3B8"
                  />
                </View>

                <Text style={styles.emptyTitle}>No Appointments Yet</Text>
                <Text style={styles.emptyDescription}>
                  Customer service appointments will appear here once they
                  have been submitted.
                </Text>
              </View>
            ) : (
              appointments.map((item) => {
                const status = item.status || "Pending";

                return (
                  <View key={item.id} style={styles.appointmentCard}>
                    {/* CARD TOP */}

                    <View style={styles.cardTop}>
                      <View style={styles.customerIcon}>
                        <Ionicons
                          name="person-outline"
                          size={22}
                          color="#2563EB"
                        />
                      </View>

                      <View style={styles.customerDetails}>
                        <Text style={styles.customerName}>
                          {getCustomerName(item)}
                        </Text>

                        <Text style={styles.customerEmail}>
                          {getCustomerEmail(item)}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor: `${getStatusColor(status)}18`,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            { color: getStatusColor(status) },
                          ]}
                        >
                          {status}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.cardDivider} />

                    {/* SERVICE */}

                    <View style={styles.detailRow}>
                      <Ionicons
                        name="construct-outline"
                        size={18}
                        color="#64748B"
                      />

                      <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>Service Requested</Text>
                        <Text style={styles.detailValue}>
                          {getServiceName(item)}
                        </Text>
                      </View>
                    </View>

                    {/* APPOINTMENT DATE */}

                    <View style={styles.detailRow}>
                      <Ionicons
                        name="calendar-outline"
                        size={18}
                        color="#64748B"
                      />

                      <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>Appointment Date</Text>
                        <Text style={styles.detailValue}>
                          {formatDate(item.appointmentDate || item.date)}
                        </Text>
                      </View>
                    </View>

                    {/* SUBMISSION DATE */}

                    <View style={styles.detailRow}>
                      <Ionicons
                        name="time-outline"
                        size={18}
                        color="#64748B"
                      />

                      <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>Submitted</Text>
                        <Text style={styles.detailValue}>
                          {formatDateTime(item.createdAt)}
                        </Text>
                      </View>
                    </View>

                    {/* CUSTOMER NOTES */}

                    {item.notes ? (
                      <View style={styles.notesContainer}>
                        <Text style={styles.detailLabel}>Customer Notes</Text>
                        <Text style={styles.notesText}>{item.notes}</Text>
                      </View>
                    ) : null}

                    {/* ADMIN MESSAGE */}

                    {item.adminMessage ? (
                      <View style={styles.adminMessageContainer}>
                        <Text style={styles.detailLabel}>Admin Message</Text>
                        <Text style={styles.adminMessageText}>
                          {item.adminMessage}
                        </Text>
                      </View>
                    ) : null}

                    <View style={styles.readOnlyFooter}>
                      <Ionicons
                        name="eye-outline"
                        size={15}
                        color="#64748B"
                      />
                      <Text style={styles.readOnlyText}>
                        View only · Managed by administrator
                      </Text>
                    </View>
                  </View>
                );
              })
            )}

            {/* FOOTER */}

            <View style={styles.footer}>
              <Ionicons
                name="shield-checkmark-outline"
                size={18}
                color="#64748B"
              />
              <Text style={styles.footerText}>
                MotoVision Mechanic Portal
              </Text>
              <Text style={styles.footerSubtext}>
                Appointment records are provided for viewing only.
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </>
  );
}

// --------------------------------------------------
// STYLES
// --------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: "#F5F7FB",
    justifyContent: "center",
    alignItems: "center",
    padding: 25,
  },

  loadingText: {
    marginTop: 15,
    color: "#64748B",
    fontSize: 14,
  },

  errorTitle: {
    marginTop: 15,
    fontSize: 21,
    fontWeight: "800",
    color: "#1E293B",
  },

  errorText: {
    marginTop: 8,
    color: "#64748B",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 21,
  },

  loginButton: {
    marginTop: 22,
    backgroundColor: "#2563EB",
    paddingHorizontal: 25,
    paddingVertical: 13,
    borderRadius: 10,
  },

  loginButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },

  // HEADER

  header: {
    backgroundColor: "#123B70",
    paddingTop: 55,
    paddingHorizontal: 22,
    paddingBottom: 32,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },

  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  logoContainer: {
    width: 45,
    height: 45,
    backgroundColor: "#2563EB",
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 11,
  },

  brandName: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: 0.3,
  },

  headerSubtitle: {
    color: "#BFDBFE",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginTop: 3,
  },

  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 9,
    gap: 6,
  },

  logoutText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },

  welcomeContainer: {
    marginTop: 32,
  },

  welcomeLabel: {
    color: "#93C5FD",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.8,
  },

  welcomeTitle: {
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "800",
    marginTop: 7,
  },

  welcomeDescription: {
    color: "#DBEAFE",
    fontSize: 13,
    marginTop: 8,
    lineHeight: 20,
  },

  // CONTENT

  content: {
    paddingHorizontal: 19,
    paddingTop: 25,
    paddingBottom: 35,
  },

  sectionHeading: {
    marginBottom: 17,
  },

  sectionTitle: {
    color: "#172B4D",
    fontSize: 18,
    fontWeight: "800",
  },

  sectionSubtitle: {
    color: "#94A3B8",
    fontSize: 12,
    marginTop: 5,
  },

  // STATISTICS

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 11,
  },

  statCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: "#E8EDF5",
  },

  statIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 13,
  },

  statNumber: {
    color: "#172B4D",
    fontSize: 25,
    fontWeight: "800",
  },

  statLabel: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },

  cancelledSummary: {
    backgroundColor: "#FEF2F2",
    borderRadius: 10,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 9,
  },

  cancelledText: {
    color: "#B91C1C",
    fontSize: 12,
    fontWeight: "600",
  },

  // APPOINTMENTS

  appointmentsHeading: {
    marginTop: 32,
    marginBottom: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },

  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 5,
    backgroundColor: "#16A34A",
  },

  liveText: {
    color: "#15803D",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.7,
  },

  appointmentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E8EDF5",
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },

  cardTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  customerIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  customerDetails: {
    flex: 1,
  },

  customerName: {
    color: "#172B4D",
    fontSize: 14,
    fontWeight: "800",
  },

  customerEmail: {
    color: "#94A3B8",
    fontSize: 11,
    marginTop: 4,
  },

  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 5,
  },

  statusText: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "capitalize",
  },

  cardDivider: {
    height: 1,
    backgroundColor: "#EEF2F7",
    marginVertical: 15,
  },

  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
    gap: 11,
  },

  detailContent: {
    flex: 1,
  },

  detailLabel: {
    color: "#94A3B8",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  detailValue: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
  },

  notesContainer: {
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 10,
    marginTop: 2,
    marginBottom: 11,
  },

  notesText: {
    color: "#475569",
    fontSize: 12,
    lineHeight: 19,
    marginTop: 6,
  },

  adminMessageContainer: {
    backgroundColor: "#EFF6FF",
    padding: 12,
    borderRadius: 10,
    marginBottom: 11,
  },

  adminMessageText: {
    color: "#1D4ED8",
    fontSize: 12,
    lineHeight: 19,
    marginTop: 6,
  },

  readOnlyFooter: {
    borderTopWidth: 1,
    borderTopColor: "#EEF2F7",
    paddingTop: 12,
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  readOnlyText: {
    color: "#94A3B8",
    fontSize: 10,
    fontWeight: "600",
  },

  // EMPTY STATE

  emptyContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 25,
    paddingVertical: 35,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E8EDF5",
  },

  emptyIcon: {
    width: 75,
    height: 75,
    borderRadius: 25,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },

  emptyTitle: {
    color: "#334155",
    fontSize: 16,
    fontWeight: "800",
  },

  emptyDescription: {
    color: "#94A3B8",
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 8,
  },

  // ERRORS

  errorCard: {
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginBottom: 14,
  },

  errorCardText: {
    flex: 1,
    color: "#B91C1C",
    fontSize: 12,
    lineHeight: 18,
  },

  // FOOTER

  footer: {
    alignItems: "center",
    marginTop: 20,
    paddingTop: 22,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },

  footerText: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 8,
  },

  footerSubtext: {
    color: "#94A3B8",
    fontSize: 10,
    marginTop: 5,
    textAlign: "center",
  },
});
