import { useRouter } from "expo-router";
import {
  doc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../../firebaseConfig";

export default function Cart() {
  const router = useRouter();
  const user = auth.currentUser;

  const [cartItems, setCartItems] = useState<any[]>([]);

  // 🔥 REAL-TIME LISTENER
  useEffect(() => {
    if (!user) return;

    const cartRef = doc(db, "carts", user.uid);

    const unsubscribe = onSnapshot(cartRef, (docSnap) => {
      if (docSnap.exists()) {
        setCartItems(docSnap.data().items || []);
      } else {
        setCartItems([]);
      }
    });

    return () => unsubscribe(); // cleanup
  }, []);

  // 🔥 REMOVE ITEM (WITH QUANTITY)
  const removeItem = async (productId: string) => {
    if (!user) return;

    const cartRef = doc(db, "carts", user.uid);

    let updated = [...cartItems];

    const index = updated.findIndex(
      (item) => item.productId === productId
    );

    if (index >= 0) {
      if (updated[index].quantity > 1) {
        updated[index].quantity -= 1;
      } else {
        updated.splice(index, 1);
      }
    }

    await updateDoc(cartRef, { items: updated });
  };

  const total = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Cart</Text>

      <ScrollView>
        {cartItems.length === 0 && (
          <Text style={{ textAlign: "center", marginTop: 20 }}>
            Cart is empty 🛒
          </Text>
        )}

        {cartItems.map((item) => (
          <View key={item.productId} style={styles.card}>
            <Image source={item.image} style={styles.image} />

            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>
                {item.quantity} × ₱{item.price}
              </Text>

              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeItem(item.productId)}
              >
                <Text style={styles.removeText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.total}>₱{total}</Text>

        <TouchableOpacity
          style={styles.checkoutButton}
          onPress={() => router.push("/checkout")}
        >
          <Text style={styles.checkoutText}>Checkout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FB", padding: 16 },

  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 16,
  },

  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 10,
    marginBottom: 12,
  },

  image: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 10,
  },

  itemName: { fontSize: 14, fontWeight: "600" },
  itemPrice: { fontSize: 13, color: "#666", marginVertical: 4 },

  removeButton: {
    backgroundColor: "#FF3B30",
    padding: 6,
    borderRadius: 6,
    alignSelf: "flex-start",
  },

  removeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },

  footer: { marginTop: 10 },

  total: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "right",
    marginBottom: 10,
    color: "green",
  },

  checkoutButton: {
    backgroundColor: "#111",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },

  checkoutText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});