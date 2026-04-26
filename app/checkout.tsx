import { useRouter } from "expo-router";
import { addDoc, collection, doc, getDoc, updateDoc } from "firebase/firestore";
import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity
} from "react-native";
import { auth, db } from "../firebaseConfig";

export default function Checkout() {
  const router = useRouter();
  const user = auth.currentUser;

  const [name, setName] = useState("");
  const [contact, setContact] = useState("");

  const handleCheckout = async () => {
    if (!user) return;

    if (!name || !contact) {
      Alert.alert("Please fill in all fields");
      return;
    }

    try {
      // 🔥 Get cart items
      const cartRef = doc(db, "carts", user.uid);
      const cartSnap = await getDoc(cartRef);

      if (!cartSnap.exists()) {
        Alert.alert("Cart is empty");
        return;
      }

      const cartData = cartSnap.data();

      // 🔥 Create order in Firestore
      await addDoc(collection(db, "orders"), {
        userId: user.uid,
        customerName: name,
        contact,
        items: cartData.items,
        total: cartData.items.reduce(
          (sum: number, item: any) =>
            sum + Number(item.price) * Number(item.quantity),
          0
        ),
        status: "pending",
        createdAt: new Date(),
      });

      // 🔥 Clear Cart After Order
      await updateDoc(cartRef, {
        items: [],
      });

      Alert.alert("Order placed successfully!");

      router.replace("/(tabs)");

    } catch (error) {
      console.log(error);
      Alert.alert("Checkout failed");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Checkout</Text>

      <Text style={styles.label}>Full Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your name"
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>Contact Number</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter contact number"
        keyboardType="numeric"
        value={contact}
        onChangeText={setContact}
      />

      <Text style={styles.note}>
        📍 Items must be claimed onsite. No delivery available.
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={handleCheckout}
      >
        <Text style={styles.buttonText}>
          Confirm Order
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#EFEFEF",
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 20,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },

  input: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 14,
  },

  note: {
    marginVertical: 20,
    fontSize: 14,
    color: "gray",
  },

  button: {
    backgroundColor: "black",
    padding: 16,
    borderRadius: 14,
  },

  buttonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "600",
    fontSize: 16,
  },
});