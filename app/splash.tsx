import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
   
    const timer = setTimeout(() => {
      router.replace('/(auth)/login'); 
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]); 

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Welcome to MotoVision</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#EFEFEF' },
  text: { fontSize: 28, fontWeight: '700' },
});