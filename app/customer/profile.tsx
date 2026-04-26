import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import {
  SafeAreaView,
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

  return (
    <SafeAreaView style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={22} color="#000" />
        </TouchableOpacity>

        <Text style={styles.title}>My Profile</Text>

        <View style={{ width: 40 }} />
      </View>

      {/* PROFILE CARD */}
      <View style={styles.card}>
        <Ionicons
          name="person-circle"
          size={70}
          color="#ccc"
          style={{ alignSelf: "center", marginBottom: 10 }}
        />

        <Text style={styles.infoLabel}>Email</Text>
        <Text style={styles.infoValue}>
          {user?.email || "No email"}
        </Text>

        <Text style={styles.infoLabel}>User ID</Text>
        <Text style={styles.infoValue}>
          {user?.uid?.slice(0, 10)}...
        </Text>
      </View>

      {/* LOGOUT */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

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
    marginBottom: 20,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 20,
    elevation: 3,
    marginBottom: 20,
  },

  infoLabel: {
    fontSize: 12,
    color: "gray",
    marginTop: 10,
  },

  infoValue: {
    fontSize: 15,
    fontWeight: "600",
  },

  logoutButton: {
    backgroundColor: "#E53935",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
  },

  logoutText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});