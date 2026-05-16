import { useFocusEffect, useRouter } from "expo-router";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../../firebaseConfig";

const productImages: any = {
  "click160-front-side-matte-red": require("../../assets/images/Product_Images/hondaClick160FrontSideMatteRed.jpg"),
  "click160-front-side-matte-black": require("../../assets/images/Product_Images/hondaClick160FrontSideMatteBlack.jpg"),
  "click160-front-cover-matte-red": require("../../assets/images/Product_Images/hondaClick160FrontCoverMatteRed.jpg"),
  "click160-front-cover-matte-black": require("../../assets/images/Product_Images/hondaClick160FrontCoverMatteBlack.jpg"),
  "click160-front-fender-glossy-black": require("../../assets/images/Product_Images/hondaClick160FrontFenderGlossyBlack.jpg"),
  "click160-front-cover-right-white": require("../../assets/images/Product_Images/hondaClick160FrontCoverRigthWhite.jpg"),
  "adv160-front-center-cover": require("../../assets/images/Product_Images/hondaAdv160frontcentercover.jpg"),
  "adv160-front-side-left-black": require("../../assets/images/Product_Images/hondaAdv160FrontSideLeftBlack.jpg"),
  "adv160-cover-front-upper-matte-red": require("../../assets/images/Product_Images/hondaAdv160coverFrontupperMatteRed.jpg"),
  "adv160-front-fender-matte-black": require("../../assets/images/Product_Images/hondaAdv160frontFenderMatteBlack.jpg"),
};

export default function Cart() {
  const router = useRouter();
  const user = auth.currentUser;

  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const cleanOldCartItems = (items: any[]) => {
    return items.map((item: any) => {
      const cleaned = { ...item };
      delete cleaned.image;
      return cleaned;
    });
  };

  const loadCart = async () => {
    if (!user) {
      setCartItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const cartRef = doc(db, "carts", user.uid);
      const cartSnap = await getDoc(cartRef);

      if (cartSnap.exists()) {
        const items = cartSnap.data().items || [];
        const cleanedItems = cleanOldCartItems(items);

        setCartItems(cleanedItems);

        const hadOldImages = items.some((item: any) => item.image);
        if (hadOldImages) {
          await updateDoc(cartRef, { items: cleanedItems });
        }
      } else {
        setCartItems([]);
      }
    } catch (error) {
      console.log("Cart load error:", error);
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadCart();
    }, [user])
  );

  const saveCart = async (updatedItems: any[]) => {
    if (!user) return;

    const cartRef = doc(db, "carts", user.uid);

    try {
      const cleanedItems = cleanOldCartItems(updatedItems);
      const cartSnap = await getDoc(cartRef);

      if (cartSnap.exists()) {
        await updateDoc(cartRef, { items: cleanedItems });
      } else {
        await setDoc(cartRef, { items: cleanedItems });
      }

      setCartItems(cleanedItems);
    } catch (error) {
      console.log("Cart save error:", error);
    }
  };

  const removeItem = async (productId: string) => {
    const updated = [...cartItems];

    const index = updated.findIndex(
      (item: any) => item.productId === productId
    );

    if (index >= 0) {
      if (updated[index].quantity > 1) {
        updated[index].quantity -= 1;
      } else {
        updated.splice(index, 1);
      }
    }

    await saveCart(updated);
  };

  const total = cartItems.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
    0
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Cart</Text>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#111" />
          <Text style={styles.loadingText}>Loading cart...</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {cartItems.length === 0 && (
            <Text style={styles.emptyText}>Cart is empty</Text>
          )}

          {cartItems.map((item) => {
            const itemImage = productImages[item.imageKey];

            return (
              <View key={item.productId} style={styles.card}>
                {itemImage ? (
                  <Image source={itemImage} style={styles.image} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Text style={styles.imagePlaceholderText}>Item</Text>
                  </View>
                )}

                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>

                  <Text style={styles.itemPrice}>
                    {item.quantity} × ₱{item.price}
                  </Text>

                  {item.color && (
                    <Text style={styles.variantText}>Color: {item.color}</Text>
                  )}

                  {item.side && (
                    <Text style={styles.variantText}>Side: {item.side}</Text>
                  )}

                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeItem(item.productId)}
                  >
                    <Text style={styles.removeText}>
                      {item.quantity > 1 ? "Remove 1" : "Remove"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      <View style={styles.footer}>
        <View>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.total}>₱{total}</Text>
        </View>

        <TouchableOpacity
          style={[
            styles.checkoutButton,
            cartItems.length === 0 && styles.checkoutButtonDisabled,
          ]}
          disabled={cartItems.length === 0}
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
  title: { fontSize: 24, fontWeight: "700", marginBottom: 16 },
  centerBox: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, fontSize: 13, color: "#666" },
  emptyText: { textAlign: "center", marginTop: 30, fontSize: 14, color: "#777" },
  card: { flexDirection: "row", backgroundColor: "#fff", borderRadius: 16, padding: 12, marginBottom: 12, elevation: 2 },
  image: { width: 86, height: 86, borderRadius: 12, marginRight: 12, resizeMode: "cover", backgroundColor: "#eee" },
  imagePlaceholder: { width: 86, height: 86, borderRadius: 12, marginRight: 12, backgroundColor: "#eee", justifyContent: "center", alignItems: "center" },
  imagePlaceholderText: { fontSize: 12, color: "#777", fontWeight: "600" },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: "700", color: "#111" },
  itemPrice: { fontSize: 13, color: "#555", marginTop: 4 },
  variantText: { fontSize: 12, color: "#777", marginTop: 2 },
  removeButton: { backgroundColor: "#FF3B30", paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, alignSelf: "flex-start", marginTop: 8 },
  removeText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  footer: { marginTop: 10, backgroundColor: "#fff", padding: 14, borderRadius: 16, elevation: 3 },
  totalLabel: { fontSize: 13, color: "#777" },
  total: { fontSize: 22, fontWeight: "800", color: "#1E8E3E", marginBottom: 12 },
  checkoutButton: { backgroundColor: "#111", padding: 16, borderRadius: 12, alignItems: "center" },
  checkoutButtonDisabled: { backgroundColor: "#999" },
  checkoutText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});