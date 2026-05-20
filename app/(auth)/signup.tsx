import { Ionicons } from "@expo/vector-icons";
import Checkbox from "expo-checkbox";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { useState } from "react";
import {
  Keyboard,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from "react-native";

import { auth, db } from "../../firebaseConfig";

export default function SignUpScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");

  const [isChecked, setIsChecked] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const router = useRouter();

  const handleSignup = async () => {
    if (!email || !password || !confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!isChecked) {
      setError("You must agree to the Terms and Conditions");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        role: "customer",
        createdAt: serverTimestamp(),
      });

      alert("Account created successfully!");
      router.back();

    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred");
      }
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>

        <Modal visible={showTerms} animationType="slide">
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Terms and Conditions</Text>

            <ScrollView style={styles.modalContent}>
              <Text style={styles.modalText}>
                Welcome to MotoVision.

                {"\n\n"}By creating an account, you agree to the following:

                {"\n\n"}• Your data will be stored securely.
                {"\n"}• You are responsible for your account activity.
                {"\n"}• Payments are handled via secure third-party providers.
                {"\n"}• Misuse of the app may result in account suspension.
              </Text>
            </ScrollView>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowTerms(false)}
            >
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </Modal>

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={18} color="#fff" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            Join MotoVision and start customizing your ride
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <View style={styles.cardGlow}>
            <LinearGradient
              colors={["#151A22", "#0F131A", "#11161D"]}
              style={styles.card}
            >
              <View style={styles.inputBox}>
                <Ionicons name="person-outline" size={19} color="#9CA3AF" />
                <TextInput
                  placeholder="First Name"
                  placeholderTextColor="#747B86"
                  style={styles.input}
                />
              </View>

              <View style={styles.inputBox}>
                <Ionicons name="person-outline" size={19} color="#9CA3AF" />
                <TextInput
                  placeholder="Last Name"
                  placeholderTextColor="#747B86"
                  style={styles.input}
                />
              </View>

              <View style={styles.inputBox}>
                <Ionicons name="mail-outline" size={19} color="#9CA3AF" />
                <TextInput
                  placeholder="Email"
                  placeholderTextColor="#747B86"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <View style={styles.inputBox}>
                <Ionicons name="call-outline" size={19} color="#9CA3AF" />
                <TextInput
                  placeholder="Contact Number"
                  placeholderTextColor="#747B86"
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>

              <View style={styles.passwordContainer}>
                <Ionicons name="lock-closed-outline" size={19} color="#9CA3AF" />

                <TextInput
                  placeholder="Password"
                  placeholderTextColor="#747B86"
                  secureTextEntry={!showPassword}
                  style={styles.passwordInput}
                  value={password}
                  onChangeText={setPassword}
                />

                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? "eye-off" : "eye"}
                    size={22}
                    color="#B8C0CC"
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.passwordContainer}>
                <Ionicons name="shield-checkmark-outline" size={19} color="#9CA3AF" />

                <TextInput
                  placeholder="Confirm Password"
                  placeholderTextColor="#747B86"
                  secureTextEntry={!showConfirmPassword}
                  style={styles.passwordInput}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />

                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons
                    name={showConfirmPassword ? "eye-off" : "eye"}
                    size={22}
                    color="#B8C0CC"
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.checkboxContainer}>
                <Checkbox
                  value={isChecked}
                  onValueChange={setIsChecked}
                  color={isChecked ? "#E50914" : undefined}
                />

                <Text style={styles.checkboxText}>
                  I agree to{" "}
                  <Text style={styles.link} onPress={() => setShowTerms(true)}>
                    Terms and Conditions
                  </Text>
                </Text>
              </View>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleSignup}
                disabled={!isChecked}
              >
                <LinearGradient
                  colors={
                    isChecked
                      ? ["#E50914", "#7A0C12"]
                      : ["#4B5563", "#374151"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.button}
                >
                  <Text style={styles.buttonText}>SIGN UP</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </ScrollView>

      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#07090D",
    paddingTop: 52,
    paddingHorizontal: 20,
  },

  header: {
    marginBottom: 18,
  },

  backButton: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  backText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#fff",
  },

  title: {
    fontSize: 30,
    fontWeight: "900",
    color: "#fff",
  },

  subtitle: {
    fontSize: 13,
    color: "#9CA3AF",
    fontWeight: "700",
    marginTop: 4,
  },

  cardGlow: {
    borderRadius: 24,
    padding: 1,
    backgroundColor: "rgba(255,255,255,0.18)",
    shadowColor: "#FFFFFF",
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 8,
  },

  card: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  inputBox: {
    height: 52,
    borderWidth: 1,
    borderColor: "#252A33",
    borderRadius: 15,
    paddingHorizontal: 14,
    marginBottom: 12,
    backgroundColor: "#090D13",
    flexDirection: "row",
    alignItems: "center",
  },

  input: {
    flex: 1,
    paddingHorizontal: 10,
    fontSize: 15,
    color: "#FFFFFF",
    height: "100%",
  },

  passwordContainer: {
    height: 52,
    borderWidth: 1,
    borderColor: "#252A33",
    borderRadius: 15,
    backgroundColor: "#090D13",
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 14,
  },

  passwordInput: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 10,
    color: "#FFFFFF",
    fontSize: 15,
  },

  eyeButton: {
    height: "100%",
    paddingHorizontal: 14,
    justifyContent: "center",
    alignItems: "center",
  },

  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    marginBottom: 8,
  },

  checkboxText: {
    marginLeft: 9,
    flexShrink: 1,
    color: "#C9D1D9",
    fontSize: 13,
    fontWeight: "700",
  },

  link: {
    color: "#FF6B6B",
    fontWeight: "900",
  },

  button: {
    padding: 15,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    flexDirection: "row",
    gap: 8,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "900",
    letterSpacing: 1,
  },

  error: {
    color: "#FF6B6B",
    textAlign: "center",
    marginTop: 6,
    fontWeight: "700",
    fontSize: 13,
  },

  modalContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: "#07090D",
  },

  modalTitle: {
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 12,
    color: "#fff",
  },

  modalContent: {
    flex: 1,
    backgroundColor: "#11161D",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#252A33",
  },

  modalText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#C9D1D9",
  },

  closeButton: {
    backgroundColor: "#E50914",
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 14,
  },
});