
import { Ionicons } from "@expo/vector-icons";
import Checkbox from "expo-checkbox";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  type User,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import { auth, db } from "../../firebaseConfig";

export default function SignUpScreen() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [contact, setContact] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isChecked, setIsChecked] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const router = useRouter();

  // Password requirements
  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const isPasswordValid = Object.values(passwordChecks).every(Boolean);

  const showValidationError = (message: string) => {
    setError(message);
    Alert.alert("Check your details", message);
  };

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    return emailRegex.test(value);
  };

  const handleSignup = async () => {
    if (isSubmitting) return;

    Keyboard.dismiss();
    setError("");

    const normalizedFirstName = firstName.trim();
    const normalizedLastName = lastName.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedContact = contact.trim();

    // Required fields
    if (
      !normalizedFirstName ||
      !normalizedLastName ||
      !normalizedEmail ||
      !normalizedContact ||
      !password ||
      !confirmPassword
    ) {
      showValidationError("Please complete all fields before creating your account.");
      return;
    }

    // Email validation
    if (!validateEmail(normalizedEmail)) {
      showValidationError("Please enter a valid email address.");
      return;
    }

    // Password validation
    if (!isPasswordValid) {
      showValidationError(
        "Your password does not meet all the requirements. Please check the password checklist."
      );
      return;
    }

    // Confirm password
    if (password !== confirmPassword) {
      showValidationError("Your passwords do not match. Please check them and try again.");
      return;
    }

    // Terms and Conditions
    if (!isChecked) {
      showValidationError("You must agree to the Terms and Conditions before signing up.");
      return;
    }

    let createdUser: User | null = null;

    try {
      setIsSubmitting(true);

      // Create Firebase account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        normalizedEmail,
        password
      );

      createdUser = userCredential.user;

      const fullName = `${normalizedFirstName} ${normalizedLastName}`;

      // Save customer profile in Firestore
      await setDoc(doc(db, "users", createdUser.uid), {
        email: createdUser.email,
        firstName: normalizedFirstName,
        lastName: normalizedLastName,
        name: fullName,
        contact: normalizedContact,
        contactNumber: normalizedContact,
        role: "customer",
        emailVerified: false,
        createdAt: serverTimestamp(),
      });

      // Send verification email
      try {
        await sendEmailVerification(createdUser);
      } catch (emailError) {
        await signOut(auth).catch(() => undefined);

        Alert.alert(
          "Account created, email not sent",
          "Your account was created, but MotoVision couldn't send the verification email. Please try again later."
        );

        console.error("EMAIL VERIFICATION ERROR:", emailError);
        return;
      }

      // Keep unverified users signed out
      await signOut(auth).catch(() => undefined);

      Alert.alert(
        "Verify your email",
        `We've sent a verification link to ${createdUser.email ?? normalizedEmail}.\n\nPlease open your email and tap the verification link before logging in.`,
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (err) {
      if (createdUser) {
        await signOut(auth).catch(() => undefined);

        setError(
          "Your account was created, but we couldn't finish setting up your profile. Please contact the app administrator."
        );

        Alert.alert(
          "Profile setup failed",
          "Your Firebase account was created, but we couldn't save your customer information. Please contact the app administrator."
        );

        console.error("SIGNUP PROFILE SETUP ERROR:", err);
        return;
      }

      const code = (err as { code?: string })?.code;

      let message = "An unexpected error occurred. Please try again.";

      if (code === "auth/email-already-in-use") {
        message = "An account with this email already exists. Try logging in instead.";
      } else if (code === "auth/invalid-email") {
        message = "Please enter a valid email address.";
      } else if (code === "auth/weak-password") {
        message = "Your password is too weak. Please choose a stronger password.";
      } else if (code === "auth/network-request-failed") {
        message = "Network error. Check your internet connection and try again.";
      } else if (code === "auth/too-many-requests") {
        message = "Too many attempts. Please wait a while before trying again.";
      } else if (err instanceof Error) {
        message = err.message;
      }

      setError(message);
      Alert.alert("Registration failed", message);

      console.error("SIGNUP ERROR:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reusable password checklist item
  const PasswordRequirement = ({
    passed,
    label,
  }: {
    passed: boolean;
    label: string;
  }) => (
    <View style={styles.requirementRow}>
      <Ionicons
        name={passed ? "checkmark-circle" : "ellipse-outline"}
        size={15}
        color={passed ? "#4ADE80" : "#747B86"}
      />
      <Text
        style={[
          styles.requirementText,
          passed && styles.requirementPassed,
        ]}
      >
        {label}
      </Text>
    </View>
  );

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>

        {/* TERMS AND CONDITIONS MODAL */}
        <Modal visible={showTerms} animationType="slide">
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Terms and Conditions</Text>

            <ScrollView style={styles.modalContent}>
              <Text style={styles.modalText}>
                Welcome to MotoVision.

                {"\n\n"}By creating an account, you agree to use MotoVision as a motorcycle customization preview and service appointment application.

                {"\n\n"}1. AR Feature Limitation
                {"\n"}MotoVision currently supports only two motorcycle model previews: Honda Click 160 and Honda ADV 160. Other motorcycle models may not be available in this prototype version.

                {"\n\n"}2. Device Compatibility
                {"\n"}The AR feature requires a device that supports ARCore / Google Play Services for AR. If your device does not support ARCore, the AR preview may not function properly.

                {"\n\n"}3. Personal Data Collection
                {"\n"}MotoVision may collect basic account information such as your name, email address, contact number, appointment details, cart items, and transaction-related records.

                {"\n\n"}4. Purpose of Data Use
                {"\n"}Your information will only be used for account registration, login authentication, order/cart processing, appointment scheduling, customer support, and app-related records.

                {"\n\n"}5. Data Privacy
                {"\n"}MotoVision follows the principles of the Philippine Data Privacy Act of 2012, also known as Republic Act No. 10173. We aim to process personal data with transparency, legitimate purpose, and proportionality.

                {"\n\n"}6. Data Protection
                {"\n"}Your data will be stored through Firebase services and will not be intentionally sold or shared with unrelated third parties. Access to user records is limited to authorized administrators for app-related purposes.

                {"\n\n"}7. User Responsibility
                {"\n"}You are responsible for keeping your login credentials secure and for ensuring that the information you provide is accurate.

                {"\n\n"}8. Consent
                {"\n"}By checking the box and creating an account, you confirm that you understand and agree to these Terms and Conditions.
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
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <View style={styles.cardGlow}>
            <LinearGradient
              colors={["#151A22", "#0F131A", "#11161D"]}
              style={styles.card}
            >

              {/* FIRST NAME */}
              <View style={styles.inputBox}>
                <Ionicons name="person-outline" size={19} color="#9CA3AF" />
                <TextInput
                  placeholder="First Name"
                  placeholderTextColor="#747B86"
                  style={styles.input}
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                />
              </View>

              {/* LAST NAME */}
              <View style={styles.inputBox}>
                <Ionicons name="person-outline" size={19} color="#9CA3AF" />
                <TextInput
                  placeholder="Last Name"
                  placeholderTextColor="#747B86"
                  style={styles.input}
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                />
              </View>

              {/* EMAIL */}
              <View style={styles.inputBox}>
                <Ionicons name="mail-outline" size={19} color="#9CA3AF" />
                <TextInput
                  placeholder="Email"
                  placeholderTextColor="#747B86"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              {/* CONTACT NUMBER */}
              <View style={styles.inputBox}>
                <Ionicons name="call-outline" size={19} color="#9CA3AF" />
                <TextInput
                  placeholder="Contact Number"
                  placeholderTextColor="#747B86"
                  keyboardType="phone-pad"
                  style={styles.input}
                  value={contact}
                  onChangeText={setContact}
                />
              </View>

              {/* PASSWORD */}
              <View style={styles.passwordContainer}>
                <Ionicons name="lock-closed-outline" size={19} color="#9CA3AF" />

                <TextInput
                  placeholder="Password"
                  placeholderTextColor="#747B86"
                  secureTextEntry={!showPassword}
                  style={styles.passwordInput}
                  value={password}
                  onChangeText={(value) => {
                    setPassword(value);
                    setError("");
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
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

              {/* PASSWORD REQUIREMENTS */}
              <View style={styles.passwordRequirements}>
                <Text style={styles.requirementTitle}>
                  Password must contain:
                </Text>

                <PasswordRequirement
                  passed={passwordChecks.length}
                  label="At least 8 characters"
                />

                <PasswordRequirement
                  passed={passwordChecks.uppercase}
                  label="At least one uppercase letter (A-Z)"
                />

                <PasswordRequirement
                  passed={passwordChecks.lowercase}
                  label="At least one lowercase letter (a-z)"
                />

                <PasswordRequirement
                  passed={passwordChecks.number}
                  label="At least one number (0-9)"
                />

                <PasswordRequirement
                  passed={passwordChecks.special}
                  label="At least one special character (!@#$)"
                />

                {password.length > 0 && (
                  <Text
                    style={[
                      styles.passwordStatus,
                      {
                        color: isPasswordValid ? "#4ADE80" : "#F87171",
                      },
                    ]}
                  >
                    {isPasswordValid
                      ? "Password meets all requirements"
                      : "Password requirements not yet met"}
                  </Text>
                )}
              </View>

              {/* CONFIRM PASSWORD */}
              <View style={styles.passwordContainer}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={19}
                  color="#9CA3AF"
                />

                <TextInput
                  placeholder="Confirm Password"
                  placeholderTextColor="#747B86"
                  secureTextEntry={!showConfirmPassword}
                  style={styles.passwordInput}
                  value={confirmPassword}
                  onChangeText={(value) => {
                    setConfirmPassword(value);
                    setError("");
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                >
                  <Ionicons
                    name={showConfirmPassword ? "eye-off" : "eye"}
                    size={22}
                    color="#B8C0CC"
                  />
                </TouchableOpacity>
              </View>

              {/* PASSWORD MATCH STATUS */}
              {confirmPassword.length > 0 && (
                <View style={styles.matchRow}>
                  <Ionicons
                    name={
                      password === confirmPassword
                        ? "checkmark-circle"
                        : "close-circle"
                    }
                    size={15}
                    color={
                      password === confirmPassword
                        ? "#4ADE80"
                        : "#F87171"
                    }
                  />
                  <Text
                    style={[
                      styles.matchText,
                      {
                        color:
                          password === confirmPassword
                            ? "#4ADE80"
                            : "#F87171",
                      },
                    ]}
                  >
                    {password === confirmPassword
                      ? "Passwords match"
                      : "Passwords do not match"}
                  </Text>
                </View>
              )}

              {/* TERMS AND CONDITIONS */}
              <View style={styles.checkboxContainer}>
                <Checkbox
                  value={isChecked}
                  onValueChange={setIsChecked}
                  color={isChecked ? "#E50914" : undefined}
                />

                <Text style={styles.checkboxText}>
                  I agree to{" "}
                  <Text
                    style={styles.link}
                    onPress={() => setShowTerms(true)}
                  >
                    Terms and Conditions
                  </Text>
                </Text>
              </View>

              {/* ERROR MESSAGE */}
              {error ? <Text style={styles.error}>{error}</Text> : null}

              {/* SIGNUP BUTTON */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleSignup}
                disabled={isSubmitting}
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
                  {isSubmitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.buttonText}>SIGN UP</Text>
                      <Ionicons
                        name="arrow-forward"
                        size={18}
                        color="#fff"
                      />
                    </>
                  )}
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

  passwordRequirements: {
    backgroundColor: "#090D13",
    borderWidth: 1,
    borderColor: "#252A33",
    borderRadius: 14,
    padding: 12,
    marginTop: -3,
    marginBottom: 12,
  },

  requirementTitle: {
    color: "#C9D1D9",
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 8,
  },

  requirementRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },

  requirementText: {
    color: "#747B86",
    fontSize: 12,
    fontWeight: "600",
  },

  requirementPassed: {
    color: "#4ADE80",
  },

  passwordStatus: {
    fontSize: 11,
    fontWeight: "800",
    marginTop: 5,
  },

  matchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: -5,
    marginBottom: 12,
    paddingHorizontal: 4,
  },

  matchText: {
    fontSize: 12,
    fontWeight: "700",
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
    minHeight: 52,
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
