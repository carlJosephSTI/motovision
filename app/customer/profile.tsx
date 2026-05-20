import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import {
  ImageBackground,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { auth } from "../../firebaseConfig";

export default function Profile() {
  const router = useRouter();
  const user = auth.currentUser;

  const handleLogout = async () => {
    await signOut(auth);
    router.replace("/(auth)/login");
  };

  const email = user?.email || "No email";
  const initial = email.charAt(0).toUpperCase();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={22} color="#111" />
          </TouchableOpacity>

          <Text style={styles.title}>My Profile</Text>

          <View style={{ width: 40 }} />
        </View>

        <ImageBackground
          source={require("../../assets/images/coolMotorimg.jpg")}
          style={styles.profileHero}
          imageStyle={styles.heroImage}
          blurRadius={1}
        >
          <View style={styles.darkOverlay}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>

            <Text style={styles.welcomeText}>Welcome back</Text>
            <Text style={styles.emailText}>{email}</Text>

            <View style={styles.badge}>
              <Ionicons name="shield-checkmark" size={14} color="#1E8E3E" />
              <Text style={styles.badgeText}>MotoVision Member</Text>
            </View>
          </View>
        </ImageBackground>

        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Account Information</Text>

          <View style={styles.infoRow}>
            <View style={styles.iconBox}>
              <Ionicons name="mail-outline" size={20} color="#111" />
            </View>

            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email Address</Text>
              <Text style={styles.infoValue}>{email}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.iconBox}>
              <Ionicons name="person-outline" size={20} color="#111" />
            </View>

            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Account Type</Text>
              <Text style={styles.infoValue}>Customer</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.iconBox}>
              <Ionicons name="key-outline" size={20} color="#111" />
            </View>

            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>User ID</Text>
              <Text style={styles.infoValue}>
                {user?.uid ? `${user.uid.slice(0, 12)}...` : "Unavailable"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.quickCard}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => router.push("/customer/appointment")}
          >
            <View style={styles.actionLeft}>
              <Ionicons name="calendar-outline" size={21} color="#111" />
              <Text style={styles.actionText}>My Appointments</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => router.push("/customer/history")}
          >
            <View style={styles.actionLeft}>
              <Ionicons name="receipt-outline" size={21} color="#111" />
              <Text style={styles.actionText}>Order History</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => router.push("/cart")}
          >
            <View style={styles.actionLeft}>
              <Ionicons name="cart-outline" size={21} color="#111" />
              <Text style={styles.actionText}>My Cart</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FB",
    padding: 16,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
  },

  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111",
  },

  profileHero: {
    height: 230,
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 16,
    elevation: 4,
  },

  heroImage: {
    borderRadius: 24,
    resizeMode: "cover",
  },

  darkOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },

  avatar: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: "rgba(255,255,255,0.95)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  avatarText: {
    fontSize: 34,
    fontWeight: "800",
    color: "#111",
  },

  welcomeText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
  },

  emailText: {
    color: "#E8E8E8",
    fontSize: 13,
    marginTop: 4,
  },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginTop: 14,
  },

  badgeText: {
    color: "#111",
    fontSize: 12,
    fontWeight: "700",
  },

  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    elevation: 3,
    marginBottom: 16,
  },

  quickCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    elevation: 3,
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111",
    marginBottom: 12,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },

  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#F1F2F4",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  infoContent: {
    flex: 1,
  },

  infoLabel: {
    fontSize: 12,
    color: "#777",
  },

  infoValue: {
    fontSize: 14,
    color: "#111",
    fontWeight: "700",
    marginTop: 2,
  },

  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },

  actionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  actionText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
  },

  logoutButton: {
    backgroundColor: "#E53935",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },

  logoutText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});