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

  const [selectedImage, setSelectedImage] = useState<any>(null);
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

  const animateButton = (id: string) => {
    if (!scaleAnims.current[id]) {
      scaleAnims.current[id] = new Animated.Value(1);
    }

    Animated.sequence([
      Animated.timing(scaleAnims.current[id], {
        toValue: 0.9,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnims.current[id], {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
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
        image: variant.image,
        quantity: 1,
      };
    } else {
      newItem = {
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: 1,
      };
    }

    const cartRef = doc(db, "carts", user.uid);
    const cartSnap = await getDoc(cartRef);

    if (!cartSnap.exists()) {
      await setDoc(cartRef, { items: [newItem] });
    } else {
      const items = cartSnap.data().items || [];

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

    animateButton(newItem.productId);
    showAddedToast();
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
          image: require("../../assets/images/Product_Images/hondaClick160FrontSideMatteRed.jpg"),
        },
        {
          color: "Matte Black",
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
          image: require("../../assets/images/Product_Images/hondaClick160FrontCoverMatteRed.jpg"),
        },
        {
          color: "Matte Black",
          image: require("../../assets/images/Product_Images/hondaClick160FrontCoverMatteBlack.jpg"),
        },
      ],
    },
    {
      id: "c3",
      name: "Click 160 Front Fender Glossy Black",
      price: 2500,
      image: require("../../assets/images/Product_Images/hondaClick160FrontFenderGlossyBlack.jpg"),
    },
    {
      id: "c4",
      name: "Click 160 Front Cover Right White",
      price: 2600,
      image: require("../../assets/images/Product_Images/hondaClick160FrontCoverRigthWhite.jpg"),
    },
  ];

  const advProducts = [
    {
      id: "a1",
      name: "ADV 160 Front Center Cover",
      price: 450,
      image: require("../../assets/images/Product_Images/hondaAdv160frontcentercover.jpg"),
    },
    {
      id: "a2",
      name: "ADV 160 Front Side Left Black",
      price: 2400,
      image: require("../../assets/images/Product_Images/hondaAdv160FrontSideLeftBlack.jpg"),
    },
    {
      id: "a3",
      name: "ADV 160 Cover Front Upper Matte Red",
      price: 2300,
      image: require("../../assets/images/Product_Images/hondaAdv160coverFrontupperMatteRed.jpg"),
    },
    {
      id: "a4",
      name: "ADV 160 Front Fender Matte Black",
      price: 3550,
      image: require("../../assets/images/Product_Images/hondaAdv160frontFenderMatteBlack.jpg"),
    },
  ];

  const renderProduct = (product: any) => {
    const isVariant = product.variants;

    if (!isVariant) {
      return (
        <View key={product.id} style={styles.card}>
          <TouchableOpacity onPress={() => setSelectedImage(product.image)}>
            <Image source={product.image} style={styles.image} />
          </TouchableOpacity>

          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.productPrice}>₱{product.price}</Text>

          <Animated.View
            style={{
              transform: [
                {
                  scale:
                    scaleAnims.current[product.id] ||
                    (scaleAnims.current[product.id] = new Animated.Value(1)),
                },
              ],
            }}
          >
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => addToCart(product)}
            >
              <Text style={styles.addButtonText}>Add to Cart</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      );
    }

    const state = getState(product.id);
    const selectedVariant = product.variants[state.colorIndex];

    return (
      <View key={product.id} style={styles.card}>
        <TouchableOpacity onPress={() => setSelectedImage(selectedVariant.image)}>
          <Image source={selectedVariant.image} style={styles.image} />
        </TouchableOpacity>

        <Text style={styles.productName}>
          {product.baseName} {selectedVariant.color}
        </Text>

        <Text style={styles.productPrice}>₱{product.price}</Text>

        {product.hasSide && (
          <View style={styles.sideContainer}>
            {["Left", "Right"].map((side) => (
              <TouchableOpacity
                key={side}
                style={[
                  styles.sideButton,
                  state.side === side && styles.sideActive,
                ]}
                onPress={() => updateState(product.id, { side })}
              >
                <Text style={styles.sideText}>{side}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.colorContainer}>
          {product.variants.map((variant: any, index: number) => (
            <TouchableOpacity
              key={index}
              onPress={() =>
                updateState(product.id, { colorIndex: index })
              }
            >
              <Image
                source={variant.image}
                style={[
                  styles.colorCircle,
                  state.colorIndex === index && styles.colorActive,
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>

        <Animated.View
          style={{
            transform: [
              {
                scale:
                  scaleAnims.current[product.id] ||
                  (scaleAnims.current[product.id] = new Animated.Value(1)),
              },
            ],
          }}
        >
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => addToCart(product, state)}
          >
            <Text style={styles.addButtonText}>Add to Cart</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {showToast && (
        <Animated.View style={[styles.toast, { opacity: fadeAnim }]}>
          <Text style={styles.toastText}>Added to Cart ✅</Text>
        </Animated.View>
      )}

      <Modal visible={!!selectedImage} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setSelectedImage(null)}>
          <View style={styles.modalBackground}>
            <Image source={selectedImage} style={styles.fullImage} />
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <View style={styles.navContainer}>
        <TouchableOpacity
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

      <ScrollView ref={scrollRef}>
        <View ref={clickRef}>
          <Text style={styles.sectionTitle}>Click 160</Text>
          <View style={styles.grid}>
            {clickProducts.map(renderProduct)}
          </View>
        </View>

        <View ref={advRef}>
          <Text style={styles.sectionTitle}>ADV 160</Text>
          <View style={styles.grid}>
            {advProducts.map(renderProduct)}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FB", padding: 16 },

  navContainer: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
    marginTop: 8,
  },

  navImage: { width: 100, height: 50, borderRadius: 12 },

  sectionTitle: { fontSize: 18, fontWeight: "700", marginVertical: 10 },

  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },

  card: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 10,
    marginBottom: 12,
    elevation: 3,
  },

  image: { width: "100%", height: 100, borderRadius: 10 },

  productName: { fontSize: 13, fontWeight: "600", marginTop: 4 },

  productPrice: { fontSize: 13, color: "#4CAF50", marginBottom: 6 },

  addButton: {
    backgroundColor: "#111",
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: "center",
  },

  addButtonText: { color: "#fff", fontSize: 12, fontWeight: "600" },

  sideContainer: { flexDirection: "row", gap: 6, marginBottom: 6 },

  sideButton: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: "#eee",
  },

  sideActive: { backgroundColor: "#999" },

  sideText: { fontSize: 11, fontWeight: "600" },

  colorContainer: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 8,
  },

  colorCircle: {
    width: 28,
    height: 28,
    borderRadius: 50,
  },

  colorActive: {
    borderWidth: 2,
    borderColor: "#000",
  },

  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },

  fullImage: {
    width: "90%",
    height: "60%",
    resizeMode: "contain",
  },

  toast: {
    position: "absolute",
    bottom: 30,
    alignSelf: "center",
    backgroundColor: "#111",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    zIndex: 999,
  },

  toastText: {
    color: "#fff",
    fontWeight: "600",
  },
});