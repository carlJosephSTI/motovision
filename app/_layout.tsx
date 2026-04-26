import { useColorScheme } from '@/hooks/use-color-scheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { AuthProvider } from "../context/AuthContext";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  console.log("APP RENDERING");
  console.log("LAYOUT MOUNTED");

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          
          {/* ONLY keep these */}
          <Stack.Screen name="index" />
          <Stack.Screen name="checkout" />
          <Stack.Screen name="splash" />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />

        </Stack>

        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}