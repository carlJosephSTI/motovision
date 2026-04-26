import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../../firebaseConfig";

export default function ProductDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<any>(null);
  const user = auth.currentUser;

  // 🔥 LOAD PRODUCT FROM FIRESTORE
  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;

      const docRef = doc(db, "products", id);
      const snapshot = await getDoc(docRef);

      if (snapshot.exists()) {
        setProduct({ id: snapshot.id, ...snapshot.data() });
      }
    };

    fetchProduct();
  }, [id]);

  // 🔥 ADD TO CART
  const addToCart = async () => {
    if (!user) {
      Alert.alert("Please login first");
      return;
    }

    const cartRef = doc(db, "carts", user.uid);
    const cartSnap = await getDoc(cartRef);

    const newItem = {
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
    };

    if (!cartSnap.exists()) {
      await setDoc(cartRef, { items: [newItem] });
    } else {
      const existingItems = cartSnap.data().items || [];

      const existingIndex = existingItems.findIndex(
        (item: any) => item.productId === product.id
      );

      if (existingIndex >= 0) {
        existingItems[existingIndex].quantity += 1;
      } else {
        existingItems.push(newItem);
      }

      await updateDoc(cartRef, { items: existingItems });
    }

    Alert.alert("Added to Cart ✅");
  };

  if (!product) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image source={{ uri: product.image }} style={styles.image} />

      <Text style={styles.name}>{product.name}</Text>
      <Text style={styles.price}>₱{product.price}</Text>
      <Text style={styles.description}>{product.description}</Text>

      <TouchableOpacity style={styles.addButton} onPress={addToCart}>
        <Text style={styles.addButtonText}>Add to Cart</Text>
      </TouchableOpacity>

      {/* 🔥 FLOATING CAMERA BUTTON */}
      <TouchableOpacity
        style={styles.cameraButton}
        onPress={() => router.push(`/ar/${product.id}`)}
      >
        <Ionicons name="camera" size={26} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>← Back to Catalog</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#EFEFEF" },

  image: { width: "100%", height: 200, borderRadius: 12, marginBottom: 16 },

  name: { fontSize: 24, fontWeight: "bold", marginBottom: 8 },

  price: { fontSize: 18, color: "gray", marginBottom: 12 },

  description: { fontSize: 16, marginBottom: 20 },

  addButton: {
    backgroundColor: "#1e90ff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },

  addButtonText: {
    color: "#fff",
    fontWeight: "600",
    textAlign: "center",
  },

  cameraButton: {
    position: "absolute",
    bottom: 30,
    right: 20,
    backgroundColor: "#000",
    padding: 16,
    borderRadius: 50,
    elevation: 5,
  },

  backButton: { alignItems: "center", marginTop: 8 },

  backText: { color: "#000", fontWeight: "500" },
});