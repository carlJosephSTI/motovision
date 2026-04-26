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

import Checkbox from "expo-checkbox";
import { auth, db } from "../../firebaseConfig";

export default function SignUpScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

        {/* TERMS MODAL */}
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

        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Create Account</Text>
        </View>

        {/* FORM */}
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.card}>

            <TextInput placeholder="First Name" style={styles.input} />
            <TextInput placeholder="Last Name" style={styles.input} />

            <TextInput
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
            />

            <TextInput
              placeholder="Contact Number"
              keyboardType="numeric"
              style={styles.input}
            />

            <TextInput
              placeholder="Password"
              secureTextEntry
              style={styles.input}
              value={password}
              onChangeText={setPassword}
            />

            <TextInput
              placeholder="Confirm Password"
              secureTextEntry
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            {/* TERMS */}
            <View style={styles.checkboxContainer}>
              <Checkbox value={isChecked} onValueChange={setIsChecked} />
              <Text style={styles.checkboxText}>
                I agree to{" "}
                <Text style={styles.link} onPress={() => setShowTerms(true)}>
                  Terms and Conditions
                </Text>
              </Text>
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity
              style={[
                styles.button,
                !isChecked && { backgroundColor: "#999" }
              ]}
              onPress={handleSignup}
            >
              <Text style={styles.buttonText}>SIGN UP</Text>
            </TouchableOpacity>

          </View>
        </ScrollView>

      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FB",
    paddingTop: 60,
    paddingHorizontal: 20,
  },

  header: {
    marginBottom: 20,
  },

  backButton: {
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 10,
  },

  backText: {
    fontSize: 14,
    fontWeight: "600",
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },

  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
    backgroundColor: "#FAFAFA",
  },

  button: {
    backgroundColor: "#111",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },

  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },

  checkboxText: {
    marginLeft: 8,
    flexShrink: 1,
  },

  link: {
    color: "#007BFF",
    fontWeight: "600",
  },

  error: {
    color: "red",
    textAlign: "center",
    marginTop: 6,
  },

  /* MODAL */
  modalContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
  },

  modalContent: {
    flex: 1,
  },

  modalText: {
    fontSize: 15,
    lineHeight: 22,
  },

  closeButton: {
    backgroundColor: "#111",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
});