import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useState } from 'react';
import {
  Image,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';

import { auth, db } from '../../firebaseConfig';

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;

      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (userDoc.exists()) {
        const role = userDoc.data().role;

        if (role === "admin") {
          router.replace("/admin");
        } else {
          router.replace("/(tabs)");
        }
      } else {
        setError("User role not found in database.");
      }

    } catch (err: any) {
      setError('Invalid email or password');
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>

        <View style={styles.logoSection}>
          <Image
            source={require('../../assets/images/GGlogo.jpg')}
            style={styles.logo1}
          />

          <Image
            source={require('../../assets/images/newMotoLogo.png')}
            style={styles.logo2}
          />
        </View>

        <View style={styles.cardGlow}>
          <LinearGradient
            colors={["#151A22", "#0F131A", "#11161D"]}
            style={styles.card}
          >
            <Text style={styles.cardTitle}>Welcome Back</Text>
            <Text style={styles.cardSubtitle}>
              Sign in to continue customizing your ride
            </Text>

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
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={22}
                  color="#B8C0CC"
                />
              </TouchableOpacity>
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleLogin}
            >
              <LinearGradient
                colors={["#E50914", "#7A0C12"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.loginButton}
              >
                <Text style={styles.loginText}>LOGIN</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/admin")}
              style={styles.adminButton}
            >
              <Text style={styles.adminText}>Login as Admin</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
          <Text style={styles.createAccount}>Create an account</Text>
        </TouchableOpacity>

      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07090D',
    paddingHorizontal: 24,
    paddingTop: 34,
  },

  logoSection: {
    alignItems: 'center',
    marginBottom: 24,
  },

  logo1: {
    width: 115,
    height: 55,
    resizeMode: 'contain',
    marginBottom: 5,
    
  },

  logo2: {
    width: 300,
    height: 200,
    resizeMode: 'contain',
  },

  cardGlow: {
    borderRadius: 24,
    padding: 1,
    backgroundColor: "rgba(255,255,255,0.18)",
    shadowColor: "#FFFFFF",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,
    marginBottom: 20,
  },

  card: {
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  cardTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 4,
  },

  cardSubtitle: {
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 18,
  },

  inputBox: {
    height: 54,
    borderWidth: 1,
    borderColor: '#252A33',
    borderRadius: 15,
    paddingHorizontal: 14,
    marginBottom: 14,
    backgroundColor: '#090D13',
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
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#252A33',
    borderRadius: 15,
    backgroundColor: '#090D13',
    marginBottom: 14,
    height: 54,
    paddingLeft: 14,
  },

  passwordInput: {
    flex: 1,
    paddingHorizontal: 10,
    fontSize: 15,
    height: '100%',
    color: "#FFFFFF",
  },

  eyeButton: {
    paddingHorizontal: 14,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },

  loginButton: {
    height: 54,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    flexDirection: "row",
    gap: 8,
    shadowColor: "#E50914",
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 7,
  },

  loginText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },

  adminButton: {
    marginTop: 14,
  },

  adminText: {
    textAlign: "center",
    color: "#FFFFFF",
    opacity: 0.78,
    fontSize: 13,
    fontWeight: "700",
  },

  createAccount: {
    textAlign: 'center',
    fontSize: 14,
    color: '#C9D1D9',
    opacity: 0.85,
    fontWeight: "700",
  },

  error: {
    color: '#FF6B6B',
    fontSize: 13,
    marginBottom: 10,
    textAlign: 'center',
    fontWeight: "700",
  },
});