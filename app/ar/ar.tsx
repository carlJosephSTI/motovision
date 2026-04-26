import { useNavigation } from "@react-navigation/native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Image } from "expo-image"; // supports GIFs
import { useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function ARScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const navigation = useNavigation();

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, []);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text>Camera permission required</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} />

      {/* 🔥 OVERLAY GIF FROM URL */}
      <View style={styles.overlay}>
        <Image
          source={{ uri: "https://media.tenor.com/Mdz2s-fOMggAAAAi/the-fragrant-flower-blooms-with-dignity-kaoruko-waguri.gif"}} // 👈 your GIF URL
          style={styles.image}
          contentFit="contain"
        />
         <Image
          source={{ uri: "https://media.tenor.com/KkqIDLfXSpwAAAAi/synesthesia.gif"}} //  GIF URL
          style={styles.image}
          contentFit="contain"
        />
      </View>

      {/*  GO BACK BUTTON */}
      <TouchableOpacity
        style={styles.goBackButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.goBackText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  camera: { flex: 1 },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  image: { width: 200, height: 200, opacity: 0.9 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  goBackButton: {
    position: "absolute",
    top: 40, // a bit below the status bar
    left: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 8,
  },
  goBackText: { color: "#fff", fontSize: 16 },
});