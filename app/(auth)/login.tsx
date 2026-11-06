
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  reload,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import { auth, db } from '../../firebaseConfig';

const MAX_ATTEMPTS = 4;
const LOCKOUT_DURATION = 60;

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  const remainingAttempts = Math.max(
    0,
    MAX_ATTEMPTS - failedAttempts
  );

  // Countdown for the temporary login lockout.
  useEffect(() => {
    if (lockoutSeconds <= 0) return;

    const timer = setTimeout(() => {
      if (lockoutSeconds === 1) {
        setLockoutSeconds(0);
        setFailedAttempts(0);
        setError('');
      } else {
        setLockoutSeconds((previous) => previous - 1);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [lockoutSeconds]);

  const handleLogin = async () => {
    setError('');

    if (isLoading) return;

    if (lockoutSeconds > 0) {
      setError(
        `Please wait ${lockoutSeconds} seconds before trying again.`
      );
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setIsLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        normalizedEmail,
        password
      );

      const user = userCredential.user;

      // A successful authentication resets the failed-attempt counter.
      setFailedAttempts(0);

      // Refresh the user's profile so verification status is up to date.
      await reload(user);

      if (!user.emailVerified) {
        Alert.alert(
          'Verify your email first',
          `Your MotoVision account (${user.email ?? normalizedEmail}) has not been verified yet. Check your inbox and spam folder. You can also resend the verification email below.`,
          [
            {
              text: 'Not now',
              style: 'cancel',
              onPress: () => {
                void signOut(auth);
              },
            },
            {
              text: 'Resend email',
              onPress: () => {
                void (async () => {
                  try {
                    await sendEmailVerification(user);

                    Alert.alert(
                      'Verification email sent',
                      'Check your inbox and spam folder, open the verification link, then return to MotoVision and log in again.'
                    );
                  } catch (resendError: any) {
                    Alert.alert(
                      'Could not send email',
                      resendError?.message ||
                        'Please try again later or check your internet connection.'
                    );
                  } finally {
                    await signOut(auth);
                  }
                })();
              },
            },
          ],
          { cancelable: false }
        );

        return;
      }

      // Retrieve the user's assigned role from Firestore.
      const userDoc = await getDoc(doc(db, 'users', user.uid));

      if (!userDoc.exists()) {
        await signOut(auth);

        Alert.alert(
          'Account profile not found',
          'Your account profile could not be found. Please contact the administrator.'
        );

        return;
      }

      const role = userDoc.data().role;

      // Route users according to their assigned role.
      if (role === 'admin') {
        router.replace('/admin');
      } else if (role === 'mechanic') {
        router.replace('/mechanic');
      } else if (role === 'customer') {
        router.replace('/(tabs)');
      } else {
        await signOut(auth);

        Alert.alert(
          'Unauthorized account',
          'Your account does not have a valid assigned role. Please contact the administrator.'
        );
      }
    } catch (err: any) {
      console.log('LOGIN ERROR CODE:', err.code);
      console.log('LOGIN ERROR MESSAGE:', err.message);

      if (
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/user-not-found'
      ) {
        const nextFailedAttempts = failedAttempts + 1;
        setFailedAttempts(nextFailedAttempts);

        const attemptsLeft = MAX_ATTEMPTS - nextFailedAttempts;

        if (attemptsLeft <= 0) {
          setLockoutSeconds(LOCKOUT_DURATION);

          setError(
            `You have used all ${MAX_ATTEMPTS} login attempts. Please wait ${LOCKOUT_DURATION} seconds before trying again.`
          );
        } else {
          setError(
            `Invalid email or password. ${attemptsLeft} ${
              attemptsLeft === 1 ? 'attempt' : 'attempts'
            } remaining.`
          );
        }
      } else if (err.code === 'auth/too-many-requests') {
        // Firebase may independently throttle repeated authentication attempts.
        setFailedAttempts(MAX_ATTEMPTS);
        setLockoutSeconds(LOCKOUT_DURATION);

        setError(
          'Too many login attempts. Please wait before trying again.'
        );
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (err.code === 'permission-denied') {
        setError('Signed in, but Firestore access was denied.');
      } else {
        setError(
          err.message || 'Something went wrong. Please try again.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const showAdminHint = () => {
    Alert.alert(
      'Admin Access',
      'Use the assigned administrator email and password, then press LOGIN.'
    );
  };

  const isLocked = lockoutSeconds > 0;

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
            colors={['#151A22', '#0F131A', '#11161D']}
            style={styles.card}
          >
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={showAdminHint}
              style={styles.adminIconButton}
            >
              <Ionicons
                name="construct-outline"
                size={20}
                color="#FFFFFF"
              />
            </TouchableOpacity>

            <Text style={styles.cardTitle}>Welcome Back</Text>

            <Text style={styles.cardSubtitle}>
              Sign in to continue customizing your ride
            </Text>

            <View style={styles.inputBox}>
              <Ionicons
                name="mail-outline"
                size={19}
                color="#9CA3AF"
              />

              <TextInput
                placeholder="Email"
                placeholderTextColor="#747B86"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                style={styles.input}
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  setError('');
                }}
                editable={!isLocked && !isLoading}
              />
            </View>

            <View style={styles.passwordContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={19}
                color="#9CA3AF"
              />

              <TextInput
                placeholder="Password"
                placeholderTextColor="#747B86"
                secureTextEntry={!showPassword}
                autoComplete="current-password"
                style={styles.passwordInput}
                value={password}
                onChangeText={(value) => {
                  setPassword(value);
                  setError('');
                }}
                editable={!isLocked && !isLoading}
              />

              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
                disabled={isLocked || isLoading}
              >
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={22}
                  color="#B8C0CC"
                />
              </TouchableOpacity>
            </View>

            {/* LOGIN ATTEMPTS COUNTER */}
            <View style={styles.attemptsContainer}>
              <Ionicons
                name={isLocked ? 'time-outline' : 'shield-checkmark-outline'}
                size={15}
                color={isLocked ? '#F87171' : '#9CA3AF'}
              />

              <Text
                style={[
                  styles.attemptsText,
                  isLocked && styles.lockedText,
                ]}
              >
                {isLocked
                  ? `Login locked. Try again in ${lockoutSeconds}s`
                  : `${remainingAttempts} login ${
                      remainingAttempts === 1 ? 'attempt' : 'attempts'
                    } remaining`}
              </Text>
            </View>

            {error ? (
              <Text style={styles.error}>{error}</Text>
            ) : null}

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleLogin}
              disabled={isLoading || isLocked}
            >
              <LinearGradient
                colors={
                  isLoading || isLocked
                    ? ['#6B7280', '#374151']
                    : ['#E50914', '#7A0C12']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.loginButton}
              >
                <Text style={styles.loginText}>
                  {isLoading
                    ? 'PLEASE WAIT...'
                    : isLocked
                    ? `LOCKED (${lockoutSeconds}s)`
                    : 'LOGIN'}
                </Text>

                {!isLoading && !isLocked ? (
                  <Ionicons
                    name="arrow-forward"
                    size={18}
                    color="#fff"
                  />
                ) : null}
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/(auth)/signup')}
          disabled={isLocked}
        >
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
    backgroundColor: 'rgba(255,255,255,0.18)',
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,
    marginBottom: 20,
  },

  card: {
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    position: 'relative',
  },

  adminIconButton: {
    position: 'absolute',
    top: 18,
    right: 18,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(229, 9, 20, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(229, 9, 20, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },

  cardTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 4,
    paddingRight: 48,
  },

  cardSubtitle: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 18,
    paddingRight: 48,
  },

  inputBox: {
    height: 54,
    borderWidth: 1,
    borderColor: '#252A33',
    borderRadius: 15,
    paddingHorizontal: 14,
    marginBottom: 14,
    backgroundColor: '#090D13',
    flexDirection: 'row',
    alignItems: 'center',
  },

  input: {
    flex: 1,
    paddingHorizontal: 10,
    fontSize: 15,
    color: '#FFFFFF',
    height: '100%',
  },

  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#252A33',
    borderRadius: 15,
    backgroundColor: '#090D13',
    marginBottom: 8,
    height: 54,
    paddingLeft: 14,
  },

  passwordInput: {
    flex: 1,
    paddingHorizontal: 10,
    fontSize: 15,
    height: '100%',
    color: '#FFFFFF',
  },

  eyeButton: {
    paddingHorizontal: 14,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },

  attemptsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 3,
    marginBottom: 10,
  },

  attemptsText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '700',
  },

  lockedText: {
    color: '#F87171',
  },

  loginButton: {
    height: 54,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    flexDirection: 'row',
    gap: 8,
    shadowColor: '#E50914',
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

  createAccount: {
    textAlign: 'center',
    fontSize: 14,
    color: '#C9D1D9',
    opacity: 0.85,
    fontWeight: '700',
  },

  error: {
    color: '#FF6B6B',
    fontSize: 13,
    marginBottom: 10,
    textAlign: 'center',
    fontWeight: '700',
  },
});
