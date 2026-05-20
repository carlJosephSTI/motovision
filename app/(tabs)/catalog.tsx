import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc
} from "firebase/firestore";
import { useRef, useState } from "react";
import {
  Animated,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { auth, db } from "../../firebaseConfig";

export default function Catalog() {
  const router = useRouter();
  const user = auth.currentUser;

  const scrollRef = useRef<any>(null);
  const clickRef = useRef<View>(null);
  const advRef = useRef<View>(null);

  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [productStates, setProductStates] = useState<any>({});

  const getState = (id: string) => {
    return productStates[id] || { colorIndex: 0, side: "Left" };
  };

  const updateState = (id: string, newState: any) => {
    setProductStates((prev: any) => ({
      ...prev,
      [id]: { ...getState(id), ...newState },
    }));
  };

  const [showToast, setShowToast] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const scaleAnims = useRef<{ [key: string]: Animated.Value }>({});
  const glowAnims = useRef<{ [key: string]: Animated.Value }>({});

  const getScaleAnim = (id: string) => {
    if (!scaleAnims.current[id]) {
      scaleAnims.current[id] = new Animated.Value(1);
    }
    return scaleAnims.current[id];
  };

  const getGlowAnim = (id: string) => {
    if (!glowAnims.current[id]) {
      glowAnims.current[id] = new Animated.Value(0);
    }
    return glowAnims.current[id];
  };

  const animateButton = (id: string) => {
    Animated.sequence([
      Animated.timing(getScaleAnim(id), {
        toValue: 0.94,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(getScaleAnim(id), {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const pulseCard = (id: string) => {
    Animated.sequence([
      Animated.timing(getGlowAnim(id), {
        toValue: 1,
        duration: 140,
        useNativeDriver: false,
      }),
      Animated.timing(getGlowAnim(id), {
        toValue: 0,
        duration: 600,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const showAddedToast = () => {
    setShowToast(true);

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setShowToast(false));
    }, 1500);
  };

  const getDescription = (name: string) => {
    const lowerName = name.toLowerCase();

    if (lowerName.includes("front side")) {
      return "A front side body panel used to preview the motorcycle’s side profile and fairing style before installation.";
    }

    if (lowerName.includes("front cover")) {
      return "A front cover panel designed to enhance the motorcycle’s front appearance and help customers visualize fitment before purchase.";
    }

    if (lowerName.includes("front fender")) {
      return "A front fender part that helps protect the wheel area while adding a cleaner and more customized front-end look.";
    }

    if (lowerName.includes("center cover")) {
      return "A center cover component used to complete the front body layout and improve the overall motorcycle styling.";
    }

    if (lowerName.includes("upper")) {
      return "An upper front cover part for styling and body protection, useful for previewing color and panel combinations.";
    }

    return "A motorcycle body accessory that helps customers preview style, fitment, and color before actual installation.";
  };

  const openPreview = (product: any, image: any, name: string, price: number, extra?: any) => {
    setSelectedProduct({
      image,
      name,
      price,
      description: getDescription(name),
      color: extra?.color || null,
      side: extra?.side || null,
    });
  };

  const addToCart = async (product: any, state?: any) => {
    if (!user) return;

    let newItem;

    if (product.variants) {
      const variant = product.variants[state.colorIndex];
      const sideText = product.hasSide ? ` (${state.side})` : "";
      const finalName = `${product.baseName} ${variant.color}${sideText}`;
      const variantId = `${product.id}_${variant.color}_${state.side}`;

      newItem = {
        productId: variantId,
        name: finalName,
        price: product.price,
        imageKey: variant.imageKey,
        color: variant.color,
        side: product.hasSide ? state.side : null,
        quantity: 1,
      };
    } else {
      newItem = {
        productId: product.id,
        name: product.name,
        price: product.price,
        imageKey: product.imageKey,
        quantity: 1,
      };
    }

    const cartRef = doc(db, "carts", user.uid);
    const cartSnap = await getDoc(cartRef);

    if (!cartSnap.exists()) {
      await setDoc(cartRef, { items: [newItem] });
    } else {
      const rawItems = cartSnap.data().items || [];

      const items = rawItems.map((item: any) => {
        const cleaned = { ...item };
        delete cleaned.image;
        return cleaned;
      });

      const index = items.findIndex(
        (item: any) => item.productId === newItem.productId
      );

      if (index >= 0) {
        items[index].quantity += 1;
      } else {
        items.push(newItem);
      }

      await updateDoc(cartRef, { items });
    }

    animateButton(product.id);
    pulseCard(product.id);
    showAddedToast();
  };

  const clickTheme = {
    accent: "#FF3B30",
    accentSoft: "rgba(255,59,48,0.16)",
    border: "#352026",
    glow: "#FF3B30",
    tag: "CLICK SERIES",
  };

  const advTheme = {
    accent: "#00D4FF",
    accentSoft: "rgba(0,212,255,0.14)",
    border: "#1D3342",
    glow: "#00D4FF",
    tag: "ADV SERIES",
  };

  const clickProducts = [
    {
      id: "click160-front-side",
      baseName: "Click 160 Front Side",
      price: 2500,
      hasSide: true,
      variants: [
        {
          color: "Matte Red",
          imageKey: "click160-front-side-matte-red",
          image: require("../../assets/images/Product_Images/hondaClick160FrontSideMatteRed.jpg"),
        },
        {
          color: "Matte Black",
          imageKey: "click160-front-side-matte-black",
          image: require("../../assets/images/Product_Images/hondaClick160FrontSideMatteBlack.jpg"),
        },
      ],
    },
    {
      id: "click160-front-cover",
      baseName: "Click 160 Front Cover",
      price: 2800,
      hasSide: false,
      variants: [
        {
          color: "Matte Red",
          imageKey: "click160-front-cover-matte-red",
          image: require("../../assets/images/Product_Images/hondaClick160FrontCoverMatteRed.jpg"),
        },
        {
          color: "Matte Black",
          imageKey: "click160-front-cover-matte-black",
          image: require("../../assets/images/Product_Images/hondaClick160FrontCoverMatteBlack.jpg"),
        },
      ],
    },
    {
      id: "c3",
      name: "Click 160 Front Fender Glossy Black",
      price: 2500,
      imageKey: "click160-front-fender-glossy-black",
      image: require("../../assets/images/Product_Images/hondaClick160FrontFenderGlossyBlack.jpg"),
    },
    {
      id: "c4",
      name: "Click 160 Front Cover Right White",
      price: 2600,
      imageKey: "click160-front-cover-right-white",
      image: require("../../assets/images/Product_Images/hondaClick160FrontCoverRigthWhite.jpg"),
    },
  ];

  const advProducts = [
    {
      id: "a1",
      name: "ADV 160 Front Center Cover",
      price: 450,
      imageKey: "adv160-front-center-cover",
      image: require("../../assets/images/Product_Images/hondaAdv160frontcentercover.jpg"),
    },
    {
      id: "a2",
      name: "ADV 160 Front Side Left Black",
      price: 2400,
      imageKey: "adv160-front-side-left-black",
      image: require("../../assets/images/Product_Images/hondaAdv160FrontSideLeftBlack.jpg"),
    },
    {
      id: "a3",
      name: "ADV 160 Cover Front Upper Matte Red",
      price: 2300,
      imageKey: "adv160-cover-front-upper-matte-red",
      image: require("../../assets/images/Product_Images/hondaAdv160coverFrontupperMatteRed.jpg"),
    },
    {
      id: "a4",
      name: "ADV 160 Front Fender Matte Black",
      price: 3550,
      imageKey: "adv160-front-fender-matte-black",
      image: require("../../assets/images/Product_Images/hondaAdv160frontFenderMatteBlack.jpg"),
    },
  ];

  const renderProduct = (product: any, theme: any) => {
    const isVariant = product.variants;
    const glow = getGlowAnim(product.id);

    const animatedCardStyle = {
      borderColor: glow.interpolate({
        inputRange: [0, 1],
        outputRange: [theme.border, theme.glow],
      }),
      shadowColor: theme.glow,
      shadowOpacity: glow.interpolate({
        inputRange: [0, 1],
        outputRange: [0.08, 0.42],
      }),
      shadowRadius: glow.interpolate({
        inputRange: [0, 1],
        outputRange: [6, 18],
      }),
    };

    if (!isVariant) {
      return (
        <Animated.View
          key={product.id}
          style={[styles.card, animatedCardStyle]}
        >
          <Text style={[styles.productTag, { color: theme.accent }]}>
            {theme.tag}
          </Text>

          <TouchableOpacity
            onPress={() =>
              openPreview(product, product.image, product.name, product.price)
            }
          >
            <View style={styles.imageBox}>
              <Image source={product.image} style={styles.image} />
            </View>
          </TouchableOpacity>

          <Text style={styles.productName}>{product.name}</Text>
          <Text style={[styles.productPrice, { color: theme.accent }]}>
            ₱{product.price}
          </Text>

          <Animated.View
            style={{
              transform: [{ scale: getScaleAnim(product.id) }],
            }}
          >
            <TouchableOpacity
              style={[
                styles.addButton,
                {
                  borderColor: theme.accent,
                  backgroundColor: theme.accentSoft,
                },
              ]}
              onPress={() => addToCart(product)}
            >
              <Ionicons name="cart-outline" size={15} color="#fff" />
              <Text style={styles.addButtonText}>Add to Cart</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      );
    }

    const state = getState(product.id);
    const selectedVariant = product.variants[state.colorIndex];
    const previewName = `${product.baseName} ${selectedVariant.color}`;

    return (
      <Animated.View
        key={product.id}
        style={[styles.card, animatedCardStyle]}
      >
        <Text style={[styles.productTag, { color: theme.accent }]}>
          {theme.tag}
        </Text>

        <TouchableOpacity
          onPress={() =>
            openPreview(
              product,
              selectedVariant.image,
              previewName,
              product.price,
              {
                color: selectedVariant.color,
                side: product.hasSide ? state.side : null,
              }
            )
          }
        >
          <View style={styles.imageBox}>
            <Image source={selectedVariant.image} style={styles.image} />
          </View>
        </TouchableOpacity>

        <Text style={styles.productName}>
          {product.baseName} {selectedVariant.color}
        </Text>

        <Text style={[styles.productPrice, { color: theme.accent }]}>
          ₱{product.price}
        </Text>

        {product.hasSide && (
          <View style={styles.sideContainer}>
            {["Left", "Right"].map((side) => (
              <TouchableOpacity
                key={side}
                style={[
                  styles.sideButton,
                  state.side === side && {
                    backgroundColor: theme.accentSoft,
                    borderColor: theme.accent,
                  },
                ]}
                onPress={() => updateState(product.id, { side })}
              >
                <Text
                  style={[
                    styles.sideText,
                    state.side === side && { color: "#fff" },
                  ]}
                >
                  {side}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.colorContainer}>
          {product.variants.map((variant: any, index: number) => (
            <TouchableOpacity
              key={index}
              onPress={() => updateState(product.id, { colorIndex: index })}
            >
              <Image
                source={variant.image}
                style={[
                  styles.colorCircle,
                  state.colorIndex === index && {
                    borderWidth: 2,
                    borderColor: theme.accent,
                  },
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>

        <Animated.View
          style={{
            transform: [{ scale: getScaleAnim(product.id) }],
          }}
        >
          <TouchableOpacity
            style={[
              styles.addButton,
              {
                borderColor: theme.accent,
                backgroundColor: theme.accentSoft,
              },
            ]}
            onPress={() => addToCart(product, state)}
          >
            <Ionicons name="cart-outline" size={15} color="#fff" />
            <Text style={styles.addButtonText}>Add to Cart</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {showToast && (
        <Animated.View style={[styles.toast, { opacity: fadeAnim }]}>
          <Text style={styles.toastText}>Added to Cart</Text>
        </Animated.View>
      )}

      <Modal visible={!!selectedProduct} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setSelectedProduct(null)}>
          <View style={styles.modalBackground}>
            <Image source={selectedProduct?.image} style={styles.fullImage} />

            <View style={styles.previewInfoCard}>
              <Text style={styles.previewTitle}>{selectedProduct?.name}</Text>

              <Text style={styles.previewPrice}>
                ₱{selectedProduct?.price}
              </Text>

              {(selectedProduct?.color || selectedProduct?.side) && (
                <View style={styles.previewPills}>
                  {selectedProduct?.color && (
                    <View style={styles.previewPill}>
                      <Text style={styles.previewPillText}>
                        {selectedProduct.color}
                      </Text>
                    </View>
                  )}

                  {selectedProduct?.side && (
                    <View style={styles.previewPill}>
                      <Text style={styles.previewPillText}>
                        {selectedProduct.side} Side
                      </Text>
                    </View>
                  )}
                </View>
              )}

              <Text style={styles.previewDescription}>
                {selectedProduct?.description}
              </Text>

              <Text style={styles.previewHint}>
                Tap anywhere to close
              </Text>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <View style={styles.navContainer}>
        <TouchableOpacity
          style={[styles.navButton, { borderColor: clickTheme.border }]}
          onPress={() =>
            clickRef.current?.measureLayout(
              scrollRef.current,
              (x, y) => scrollRef.current.scrollTo({ y, animated: true })
            )
          }
        >
          <Image
            source={require("../../assets/images/Product_Images/Click160Button.jpg")}
            style={styles.navImage}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, { borderColor: advTheme.border }]}
          onPress={() =>
            advRef.current?.measureLayout(
              scrollRef.current,
              (x, y) => scrollRef.current.scrollTo({ y, animated: true })
            )
          }
        >
          <Image
            source={require("../../assets/images/Product_Images/Adv160Button.jpg")}
            style={styles.navImage}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <View ref={clickRef}>
          <Text style={styles.sectionTitle}>Click 160</Text>
          <Text style={[styles.sectionSubtitle, { color: clickTheme.accent }]}>
            Urban body parts and panels
          </Text>

          <View style={styles.grid}>
            {clickProducts.map((product) => renderProduct(product, clickTheme))}
          </View>
        </View>

        <View ref={advRef}>
          <Text style={styles.sectionTitle}>ADV 160</Text>
          <Text style={[styles.sectionSubtitle, { color: advTheme.accent }]}>
            Adventure series accessories
          </Text>

          <View style={styles.grid}>
            {advProducts.map((product) => renderProduct(product, advTheme))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#07090D",
    padding: 16,
  },

  navContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
    marginTop: 8,
  },

  navButton: {
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: "#11161D",
    padding: 4,
  },

  navImage: {
    width: 112,
    height: 56,
    borderRadius: 12,
  },

  sectionTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#fff",
    marginTop: 10,
  },

  sectionSubtitle: {
    fontSize: 12,
    fontWeight: "800",
    marginTop: 2,
    marginBottom: 12,
    letterSpacing: 0.6,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  card: {
    width: "48%",
    backgroundColor: "#11161D",
    borderRadius: 18,
    padding: 10,
    marginBottom: 14,
    borderWidth: 1,
    elevation: 4,
  },

  productTag: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
    marginBottom: 7,
  },

  imageBox: {
    width: "100%",
    height: 105,
    borderRadius: 14,
    backgroundColor: "#F4F4F4",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    marginBottom: 8,
  },

  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  productName: {
    fontSize: 13,
    fontWeight: "800",
    color: "#fff",
    marginTop: 2,
    minHeight: 36,
  },

  productPrice: {
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 8,
  },

  addButton: {
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
    borderWidth: 1,
  },

  addButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },

  sideContainer: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 8,
  },

  sideButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: "#0B0F14",
    borderWidth: 1,
    borderColor: "#252A33",
  },

  sideText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#9CA3AF",
  },

  colorContainer: {
    flexDirection: "row",
    gap: 7,
    marginBottom: 9,
  },

  colorCircle: {
    width: 30,
    height: 30,
    borderRadius: 50,
    backgroundColor: "#fff",
  },

  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.94)",
    justifyContent: "center",
    alignItems: "center",
    padding: 18,
  },

  fullImage: {
    width: "94%",
    height: "52%",
    resizeMode: "contain",
  },

  previewInfoCard: {
    width: "94%",
    backgroundColor: "#11161D",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#253241",
    marginTop: 10,
  },

  previewTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 4,
  },

  previewPrice: {
    color: "#00D4FF",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 8,
  },

  previewPills: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },

  previewPill: {
    backgroundColor: "rgba(0,212,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(0,212,255,0.35)",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
  },

  previewPillText: {
    color: "#CDE7FF",
    fontSize: 11,
    fontWeight: "800",
  },

  previewDescription: {
    color: "#C9D1D9",
    fontSize: 13,
    lineHeight: 19,
  },

  previewHint: {
    color: "#6B7280",
    fontSize: 11,
    textAlign: "center",
    marginTop: 12,
    fontWeight: "700",
  },

  toast: {
    position: "absolute",
    bottom: 35,
    alignSelf: "center",
    backgroundColor: "#11161D",
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 24,
    zIndex: 999,
    borderWidth: 1,
    borderColor: "#00D4FF",
  },

  toastText: {
    color: "#fff",
    fontWeight: "800",
  },
});