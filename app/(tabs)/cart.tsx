import { Ionicons } from "@expo/vector-icons";
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
          <ActivityIndicator size="large" color="#00D4FF" />
          <Text style={styles.loadingText}>Loading cart...</Text>
        </View>
      ) : (
        <>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 140 }}
          >
            {cartItems.length === 0 && (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="cart-outline"
                  size={70}
                  color="#2F3A46"
                />
                <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
                <Text style={styles.emptySubtitle}>
                  Browse the catalog and add motorcycle parts
                </Text>
              </View>
            )}

            {cartItems.map((item) => {
              const itemImage = productImages[item.imageKey];

              return (
                <View key={item.productId} style={styles.card}>
                  {itemImage ? (
                    <View style={styles.imageBox}>
                      <Image source={itemImage} style={styles.image} />
                    </View>
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

                    <View style={styles.badgeRow}>
                      {item.color && (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>
                            {item.color}
                          </Text>
                        </View>
                      )}

                      {item.side && (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>
                            {item.side} Side
                          </Text>
                        </View>
                      )}
                    </View>

                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeItem(item.productId)}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={14}
                        color="#FF6B6B"
                      />
                      <Text style={styles.removeText}>
                        {item.quantity > 1 ? "Remove 1" : "Remove"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          <View style={styles.footer}>
            <View>
              <Text style={styles.totalLabel}>TOTAL</Text>
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
              <Ionicons
                name="arrow-forward"
                size={16}
                color="#fff"
              />
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#07090D",
    padding: 16,
  },

  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#FFFFFF",
    marginBottom: 18,
  },

  centerBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: "#9CA3AF",
    fontWeight: "700",
  },

  emptyContainer: {
    alignItems: "center",
    marginTop: 80,
  },

  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
    marginTop: 14,
  },

  emptySubtitle: {
    color: "#7B8494",
    fontSize: 13,
    marginTop: 8,
    textAlign: "center",
    maxWidth: 220,
    lineHeight: 18,
  },

  card: {
    flexDirection: "row",
    backgroundColor: "#11161D",
    borderRadius: 20,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#252A33",
    shadowColor: "#00D4FF",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },

  imageBox: {
    width: 90,
    height: 90,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    overflow: "hidden",
  },

  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  imagePlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 16,
    backgroundColor: "#1F2937",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  imagePlaceholderText: {
    fontSize: 12,
    color: "#7B8494",
    fontWeight: "700",
  },

  itemInfo: {
    flex: 1,
  },

  itemName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  itemPrice: {
    fontSize: 14,
    color: "#00D4FF",
    fontWeight: "800",
    marginTop: 6,
  },

  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },

  badge: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "#2F3A46",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
  },

  badgeText: {
    color: "#C9D1D9",
    fontSize: 11,
    fontWeight: "700",
  },

  removeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,107,107,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,107,107,0.22)",
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 10,
  },

  removeText: {
    color: "#FF6B6B",
    fontSize: 12,
    fontWeight: "800",
  },

  footer: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 20,
    backgroundColor: "#11161D",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#252A33",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  totalLabel: {
    fontSize: 11,
    color: "#7B8494",
    fontWeight: "800",
    letterSpacing: 1,
  },

  total: {
    fontSize: 26,
    fontWeight: "900",
    color: "#42E695",
    marginTop: 4,
  },

  checkoutButton: {
    backgroundColor: "#FF9500",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    shadowColor: "#FF9500",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },

  checkoutButtonDisabled: {
    backgroundColor: "#4B5563",
    shadowOpacity: 0,
  },

  checkoutText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 15,
  },
});