
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth } from "../../firebaseConfig";

const API_BASE_URL = "https://motovisionitsbackend.onrender.com";

type Mechanic = {
  uid: string;
  email: string;
  displayName?: string;
};

type ApiResponse = {
  message?: string;
  error?: string;
  mechanics?: Mechanic[];
  mechanic?: Mechanic;
  count?: number;
};

export default function ManageMechanics() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [authorizing, setAuthorizing] = useState(false);
  const [revokingUid, setRevokingUid] = useState<string | null>(null);

  const getAuthToken = async () => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error("Your session has expired. Please log in again.");
    }

    return await currentUser.getIdToken();
  };

  const getResponseData = async (response: Response): Promise<ApiResponse> => {
    let data: ApiResponse = {};

    try {
      data = await response.json();
    } catch {
      // The server did not return JSON.
    }

    if (!response.ok) {
      throw new Error(
        data.error ||
          data.message ||
          `Request failed with status ${response.status}.`
      );
    }

    return data;
  };

  const loadMechanics = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      }

      const token = await getAuthToken();

      const response = await fetch(
        `${API_BASE_URL}/api/admin/mechanics`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await getResponseData(response);

      setMechanics(
        Array.isArray(data.mechanics) ? data.mechanics : []
      );
    } catch (error) {
      console.error("Failed to load mechanics:", error);

      Alert.alert(
        "Unable to Load Mechanics",
        error instanceof Error
          ? error.message
          : "Something went wrong while loading mechanics."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadMechanics();
  }, [loadMechanics]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadMechanics(false);
  };

  const handleAuthorize = async () => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      Alert.alert(
        "Email Required",
        "Please enter the registered email address of the mechanic."
      );
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      Alert.alert(
        "Invalid Email",
        "Please enter a valid email address."
      );
      return;
    }

    try {
      setAuthorizing(true);

      const token = await getAuthToken();

      const response = await fetch(
        `${API_BASE_URL}/api/admin/mechanics/authorize`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: cleanEmail,
          }),
        }
      );

      const data = await getResponseData(response);

      setEmail("");

      Alert.alert(
        "Mechanic Authorized",
        data.message ||
          `${cleanEmail} has been granted mechanic access.`
      );

      await loadMechanics(false);
    } catch (error) {
      console.error("Mechanic authorization failed:", error);

      Alert.alert(
        "Authorization Failed",
        error instanceof Error
          ? error.message
          : "Unable to authorize this account. Please try again."
      );
    } finally {
      setAuthorizing(false);
    }
  };

  const handleRevoke = (mechanic: Mechanic) => {
    Alert.alert(
      "Revoke Mechanic Access?",
      `Are you sure you want to remove mechanic access from ${
        mechanic.email
      }?\n\nTheir account will remain registered, but their role will return to customer.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Revoke Access",
          style: "destructive",
          onPress: () => confirmRevoke(mechanic),
        },
      ]
    );
  };

  const confirmRevoke = async (mechanic: Mechanic) => {
    try {
      setRevokingUid(mechanic.uid);

      const token = await getAuthToken();

      const response = await fetch(
        `${API_BASE_URL}/api/admin/mechanics/${encodeURIComponent(
          mechanic.uid
        )}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await getResponseData(response);

      setMechanics((current) =>
        current.filter((item) => item.uid !== mechanic.uid)
      );

      Alert.alert(
        "Access Revoked",
        data.message ||
          `${mechanic.email} is now a regular customer account.`
      );
    } catch (error) {
      console.error("Mechanic revocation failed:", error);

      Alert.alert(
        "Unable to Revoke Access",
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setRevokingUid(null);
    }
  };

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
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.75}
            onPress={() => router.back()}
          >
            <Ionicons
              name="arrow-back"
              size={21}
              color="#24364B"
            />
          </TouchableOpacity>

          <View style={styles.headerText}>
            <Text style={styles.headerEyebrow}>
              ADMINISTRATION
            </Text>
            <Text style={styles.headerTitle}>
              Manage Mechanics
            </Text>
          </View>

          <TouchableOpacity
            style={styles.refreshButton}
            activeOpacity={0.75}
            onPress={() => loadMechanics()}
          >
            <Ionicons
              name="refresh-outline"
              size={21}
              color="#0879D9"
            />
          </TouchableOpacity>
        </View>

        {/* Intro */}
        <View style={styles.introCard}>
          <View style={styles.introIcon}>
            <Ionicons
              name="people-outline"
              size={27}
              color="#FFFFFF"
            />
          </View>

          <View style={styles.introText}>
            <Text style={styles.introTitle}>
              Mechanic Access Control
            </Text>
            <Text style={styles.introSubtitle}>
              Approve registered users to access the mechanic
              dashboard and manage their access whenever needed.
            </Text>
          </View>
        </View>

        {/* Authorize Form */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionEyebrow}>
              ACCOUNT MANAGEMENT
            </Text>
            <Text style={styles.sectionTitle}>
              Authorize a Mechanic
            </Text>
          </View>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>01</Text>
          </View>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.fieldLabel}>
            REGISTERED EMAIL ADDRESS
          </Text>

          <View style={styles.inputWrapper}>
            <Ionicons
              name="mail-outline"
              size={19}
              color="#94A3B8"
            />

            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="mechanic@example.com"
              placeholderTextColor="#A0AEC0"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!authorizing}
            />
          </View>

          <View style={styles.notice}>
            <Ionicons
              name="information-circle-outline"
              size={17}
              color="#0879D9"
            />
            <Text style={styles.noticeText}>
              The mechanic must create a normal MotoVision account
              first. Enter the same email address they registered with.
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.authorizeButton,
              authorizing && styles.disabledButton,
            ]}
            activeOpacity={0.85}
            onPress={handleAuthorize}
            disabled={authorizing}
          >
            {authorizing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons
                  name="person-add-outline"
                  size={19}
                  color="#FFFFFF"
                />
                <Text style={styles.authorizeButtonText}>
                  Authorize Mechanic
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Current Mechanics */}
        <View style={styles.listHeader}>
          <View>
            <Text style={styles.sectionEyebrow}>
              AUTHORIZED ACCOUNTS
            </Text>
            <Text style={styles.sectionTitle}>
              Current Mechanics
            </Text>
          </View>

          <View style={styles.countBadge}>
            <Text style={styles.countNumber}>
              {mechanics.length}
            </Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color="#0879D9"
            />
            <Text style={styles.loadingText}>
              Loading mechanic accounts...
            </Text>
          </View>
        ) : mechanics.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="people-outline"
                size={32}
                color="#94A3B8"
              />
            </View>

            <Text style={styles.emptyTitle}>
              No Mechanics Yet
            </Text>

            <Text style={styles.emptySubtitle}>
              Authorized mechanic accounts will appear here.
            </Text>
          </View>
        ) : (
          <View style={styles.mechanicsList}>
            {mechanics.map((mechanic) => (
              <View
                key={mechanic.uid}
                style={styles.mechanicCard}
              >
                <View style={styles.mechanicTop}>
                  <View style={styles.avatar}>
                    <Ionicons
                      name="person"
                      size={22}
                      color="#0879D9"
                    />
                  </View>

                  <View style={styles.mechanicInfo}>
                    <Text
                      style={styles.mechanicName}
                      numberOfLines={1}
                    >
                      {mechanic.displayName?.trim() ||
                        "MotoVision Mechanic"}
                    </Text>

                    <Text
                      style={styles.mechanicEmail}
                      numberOfLines={2}
                    >
                      {mechanic.email}
                    </Text>
                  </View>

                  <View style={styles.activeBadge}>
                    <View style={styles.activeDot} />
                    <Text style={styles.activeText}>
                      ACTIVE
                    </Text>
                  </View>
                </View>

                <View style={styles.mechanicDivider} />

                <View style={styles.mechanicFooter}>
                  <View style={styles.roleLabel}>
                    <Ionicons
                      name="shield-checkmark-outline"
                      size={15}
                      color="#059669"
                    />
                    <Text style={styles.roleText}>
                      Mechanic Access
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.revokeButton,
                      revokingUid === mechanic.uid &&
                        styles.disabledRevokeButton,
                    ]}
                    activeOpacity={0.8}
                    disabled={revokingUid !== null}
                    onPress={() => handleRevoke(mechanic)}
                  >
                    {revokingUid === mechanic.uid ? (
                      <ActivityIndicator
                        size="small"
                        color="#DC2626"
                      />
                    ) : (
                      <>
                        <Ionicons
                          name="close-circle-outline"
                          size={16}
                          color="#DC2626"
                        />
                        <Text style={styles.revokeText}>
                          Revoke
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Footer Note */}
        <View style={styles.footerNote}>
          <Ionicons
            name="lock-closed-outline"
            size={16}
            color="#94A3B8"
          />
          <Text style={styles.footerNoteText}>
            Access changes are processed securely by the MotoVision
            backend. Revoking access does not delete the user's account.
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

  header: {
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

  headerText: {
    flex: 1,
  },

  headerEyebrow: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.8,
    color: "#0879D9",
    marginBottom: 4,
  },

  headerTitle: {
    fontSize: 21,
    fontWeight: "900",
    color: "#14243A",
    letterSpacing: -0.5,
  },

  refreshButton: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E1E8F0",
    alignItems: "center",
    justifyContent: "center",
  },

  introCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0879D9",
    borderRadius: 22,
    padding: 19,
    marginBottom: 30,
    gap: 14,
  },

  introIcon: {
    width: 53,
    height: 53,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },

  introText: {
    flex: 1,
  },

  introTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 5,
  },

  introSubtitle: {
    color: "#E1F1FF",
    fontSize: 11,
    lineHeight: 17,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  sectionEyebrow: {
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

  stepBadge: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "#E0F2FE",
    alignItems: "center",
    justifyContent: "center",
  },

  stepBadgeText: {
    color: "#0879D9",
    fontSize: 12,
    fontWeight: "900",
  },

  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 19,
    borderWidth: 1,
    borderColor: "#E7EDF5",
    marginBottom: 30,
    shadowColor: "#1E3A5F",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },

  fieldLabel: {
    color: "#64748B",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.3,
    marginBottom: 10,
  },

  inputWrapper: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: "#F7FAFD",
    borderWidth: 1,
    borderColor: "#E2EAF3",
  },

  input: {
    flex: 1,
    color: "#172B45",
    fontSize: 13,
    paddingVertical: 13,
  },

  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 14,
    marginBottom: 17,
  },

  noticeText: {
    flex: 1,
    color: "#64748B",
    fontSize: 11,
    lineHeight: 17,
  },

  authorizeButton: {
    minHeight: 51,
    borderRadius: 14,
    backgroundColor: "#0879D9",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    shadowColor: "#0879D9",
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 3,
  },

  disabledButton: {
    opacity: 0.65,
  },

  authorizeButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },

  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },

  countBadge: {
    minWidth: 39,
    height: 39,
    paddingHorizontal: 8,
    borderRadius: 13,
    backgroundColor: "#E0F2FE",
    alignItems: "center",
    justifyContent: "center",
  },

  countNumber: {
    color: "#0879D9",
    fontSize: 15,
    fontWeight: "900",
  },

  loadingContainer: {
    minHeight: 150,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E7EDF5",
  },

  loadingText: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 12,
  },

  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E7EDF5",
    padding: 27,
    alignItems: "center",
  },

  emptyIcon: {
    width: 65,
    height: 65,
    borderRadius: 22,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 13,
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
    lineHeight: 17,
    marginTop: 6,
  },

  mechanicsList: {
    gap: 13,
  },

  mechanicCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E7EDF5",
    padding: 16,
    shadowColor: "#1E3A5F",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },

  mechanicTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },

  avatar: {
    width: 47,
    height: 47,
    borderRadius: 16,
    backgroundColor: "#E0F2FE",
    alignItems: "center",
    justifyContent: "center",
  },

  mechanicInfo: {
    flex: 1,
  },

  mechanicName: {
    color: "#172B45",
    fontSize: 13,
    fontWeight: "900",
    marginBottom: 4,
  },

  mechanicEmail: {
    color: "#7A8BA1",
    fontSize: 10,
    lineHeight: 15,
  },

  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 20,
  },

  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 4,
    backgroundColor: "#059669",
  },

  activeText: {
    color: "#059669",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  mechanicDivider: {
    height: 1,
    backgroundColor: "#F0F3F8",
    marginVertical: 14,
  },

  mechanicFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  roleLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  roleText: {
    color: "#059669",
    fontSize: 10,
    fontWeight: "800",
  },

  revokeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#FEF2F2",
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },

  disabledRevokeButton: {
    opacity: 0.5,
  },

  revokeText: {
    color: "#DC2626",
    fontSize: 10,
    fontWeight: "900",
  },

  footerNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    marginTop: 25,
    paddingHorizontal: 3,
  },

  footerNoteText: {
    flex: 1,
    color: "#94A3B8",
    fontSize: 10,
    lineHeight: 16,
  },
});
