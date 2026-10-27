import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../firebaseConfig";

const productImages: Record<string, any> = {
  "click160-front-side-matte-red": require("../assets/images/Product_Images/hondaClick160FrontSideMatteRed.jpg"),
  "click160-front-side-matte-black": require("../assets/images/Product_Images/hondaClick160FrontSideMatteBlack.jpg"),
  "click160-front-cover-matte-red": require("../assets/images/Product_Images/hondaClick160FrontCoverMatteRed.jpg"),
  "click160-front-cover-matte-black": require("../assets/images/Product_Images/hondaClick160FrontCoverMatteBlack.jpg"),
  "click160-front-fender-glossy-black": require("../assets/images/Product_Images/hondaClick160FrontFenderGlossyBlack.jpg"),
  "click160-front-cover-right-white": require("../assets/images/Product_Images/hondaClick160FrontCoverRigthWhite.jpg"),
  "adv160-front-center-cover": require("../assets/images/Product_Images/hondaAdv160frontcentercover.jpg"),
  "adv160-front-side-left-black": require("../assets/images/Product_Images/hondaAdv160FrontSideLeftBlack.jpg"),
  "adv160-cover-front-upper-matte-red": require("../assets/images/Product_Images/hondaAdv160coverFrontupperMatteRed.jpg"),
  "adv160-front-fender-matte-black": require("../assets/images/Product_Images/hondaAdv160frontFenderMatteBlack.jpg"),
};

type CartItem = {
  productId: string;
  name: string;
  price: number | string;
  quantity: number | string;
  imageKey?: string;
  color?: string;
  side?: string;
};

const formatPeso = (amount: number) =>
  `₱${amount.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function Checkout() {
  const router = useRouter();
  const user = auth.currentUser;

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [summaryExpanded, setSummaryExpanded] = useState(true);
  const [paymentBusy, setPaymentBusy] = useState(false);

  const loadCheckoutData = useCallback(async () => {
    setLoading(true);

    if (!auth.currentUser) {
      setCartItems([]);
      setLoading(false);
      return;
    }

    try {
      const userNow = auth.currentUser;
      const cartSnap = await getDoc(doc(db, "carts", userNow.uid));

      if (!cartSnap.exists()) {
        setCartItems([]);
        return;
      }

      const items = (cartSnap.data().items || []) as CartItem[];
      setCartItems(
        items.filter(
          (item) =>
            item &&
            typeof item.productId === "string" &&
            Number(item.quantity) > 0
        )
      );

      // Prefill from the user's existing profile, if available.
      const userSnap = await getDoc(doc(db, "users", userNow.uid));
      if (userSnap.exists()) {
        const profile = userSnap.data();
        if (profile.name || profile.fullName || profile.displayName) {
          setName(
            profile.name || profile.fullName || profile.displayName || ""
          );
        }
        if (profile.contact || profile.contactNumber || profile.phone) {
          setContact(
            String(
              profile.contact || profile.contactNumber || profile.phone || ""
            )
          );
        }
      }
    } catch (error) {
      console.log("Checkout load error:", error);
      Alert.alert(
        "Couldn't load checkout",
        "Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCheckoutData();
    }, [loadCheckoutData])
  );

  const totalQuantity = cartItems.reduce(
    (sum, item) => sum + Math.max(0, Number(item.quantity) || 0),
    0
  );

  const total = cartItems.reduce(
    (sum, item) =>
      sum +
      Math.max(0, Number(item.price) || 0) *
        Math.max(0, Number(item.quantity) || 0),
    0
  );

  const handleProceedToPayment = () => {
    if (!auth.currentUser) {
      Alert.alert(
        "Sign in required",
        "Please sign in again before continuing to checkout."
      );
      return;
    }

    if (cartItems.length === 0) {
      Alert.alert("Your cart is empty", "Add some parts before checking out.");
      return;
    }

    if (!name.trim() || !contact.trim()) {
      Alert.alert(
        "Complete your details",
        "Please enter your full name and contact number."
      );
      return;
    }

    if (contact.trim().replace(/\D/g, "").length < 10) {
      Alert.alert(
        "Check your contact number",
        "Please enter a valid contact number so the shop can reach you."
      );
      return;
    }

    // Payment is deliberately not simulated or marked as successful here.
    // Next step: call the secure backend that creates the PayMongo Checkout Session.
    Alert.alert(
      "Payment setup in progress",
      "Your checkout details are ready. PayMongo test payments will be enabled after the secure backend is configured. Your cart has not been cleared and no order has been marked as paid."
    );
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#101821" />

      <View style={styles.topBar}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.75}
        >
          <Ionicons name="arrow-back" size={23} color="#35D8F5" />
        </TouchableOpacity>

        <View style={styles.topBarTitleWrap}>
          <Text style={styles.topBarTitle}>Checkout</Text>
          <Text style={styles.topBarSubtitle}>One last stop before the ride</Text>
        </View>

        <View style={styles.secureBadge}>
          <Ionicons name="shield-checkmark" size={17} color="#42DDA8" />
          <Text style={styles.secureText}>Secure</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#31D7F4" />
            <Text style={styles.loadingText}>Preparing your checkout...</Text>
          </View>
        ) : (
          <>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollContent}
            >
              <ImageBackground
                source={require("../assets/images/MotoVision_banner.png")}
                style={styles.banner}
                imageStyle={styles.bannerImage}
                resizeMode="cover"
              >
                {/* The banner artwork already contains its own text, so keep it unobstructed. */}
              </ImageBackground>

              <View style={styles.progressRow}>
                <View style={styles.progressStep}>
                  <View style={[styles.progressDot, styles.progressDotDone]}>
                    <Ionicons name="checkmark" size={13} color="#101821" />
                  </View>
                  <Text style={styles.progressDoneText}>Cart</Text>
                </View>
                <View style={styles.progressLine} />
                <View style={styles.progressStep}>
                  <View style={styles.progressDotActive}>
                    <Text style={styles.progressNumber}>2</Text>
                  </View>
                  <Text style={styles.progressActiveText}>Checkout</Text>
                </View>
                <View style={styles.progressLine} />
                <View style={styles.progressStep}>
                  <View style={styles.progressDot}>
                    <Text style={styles.progressNumberMuted}>3</Text>
                  </View>
                  <Text style={styles.progressMutedText}>Payment</Text>
                </View>
              </View>

              <View style={styles.sectionCard}>
                <TouchableOpacity
                  style={styles.sectionHeader}
                  onPress={() => setSummaryExpanded((current) => !current)}
                  activeOpacity={0.8}
                >
                  <View style={styles.sectionTitleGroup}>
                    <View style={[styles.iconTile, styles.cyanTile]}>
                      <Ionicons name="receipt-outline" size={20} color="#20CBEA" />
                    </View>
                    <View>
                      <Text style={styles.sectionTitle}>Order summary</Text>
                      <Text style={styles.sectionSubtitle}>
                        {totalQuantity} {totalQuantity === 1 ? "item" : "items"} in your cart
                      </Text>
                    </View>
                  </View>
                  <View style={styles.summaryHeaderRight}>
                    <Text style={styles.summaryHeaderPrice}>{formatPeso(total)}</Text>
                    <Ionicons
                      name={summaryExpanded ? "chevron-up" : "chevron-down"}
                      size={19}
                      color="#AEBAC8"
                    />
                  </View>
                </TouchableOpacity>

                {summaryExpanded && (
                  <View style={styles.itemsList}>
                    {cartItems.length === 0 ? (
                      <View style={styles.emptyCart}>
                        <Ionicons name="cart-outline" size={32} color="#8A9BAB" />
                        <Text style={styles.emptyCartTitle}>Your cart is empty</Text>
                        <Text style={styles.emptyCartText}>
                          Head back to the catalog and pick out some parts.
                        </Text>
                        <TouchableOpacity
                          style={styles.browseButton}
                          onPress={() => router.replace("/(tabs)/catalog")}
                        >
                          <Text style={styles.browseButtonText}>Browse catalog</Text>
                          <Ionicons name="arrow-forward" size={15} color="#101821" />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      cartItems.map((item, index) => {
                        const image = item.imageKey
                          ? productImages[item.imageKey]
                          : undefined;
                        const quantity = Math.max(0, Number(item.quantity) || 0);
                        const price = Math.max(0, Number(item.price) || 0);

                        return (
                          <View
                            key={`${item.productId}-${index}`}
                            style={[
                              styles.itemRow,
                              index < cartItems.length - 1 && styles.itemDivider,
                            ]}
                          >
                            <View style={styles.itemImageWrap}>
                              {image ? (
                                <Image source={image} style={styles.itemImage} />
                              ) : (
                                <View style={styles.itemImageFallback}>
                                  <Ionicons
                                    name="construct-outline"
                                    size={25}
                                    color="#9BAAB9"
                                  />
                                </View>
                              )}
                            </View>
                            <View style={styles.itemDetails}>
                              <Text style={styles.itemName} numberOfLines={2}>
                                {item.name}
                              </Text>
                              <View style={styles.itemMetaRow}>
                                {item.color ? (
                                  <View style={styles.itemTag}>
                                    <Text style={styles.itemTagText}>{item.color}</Text>
                                  </View>
                                ) : null}
                                {item.side ? (
                                  <View style={styles.itemTag}>
                                    <Text style={styles.itemTagText}>
                                      {item.side} side
                                    </Text>
                                  </View>
                                ) : null}
                              </View>
                              <Text style={styles.itemQuantity}>
                                Qty: {quantity} × {formatPeso(price)}
                              </Text>
                            </View>
                            <Text style={styles.itemLineTotal}>
                              {formatPeso(price * quantity)}
                            </Text>
                          </View>
                        );
                      })
                    )}
                  </View>
                )}

                {cartItems.length > 0 && (
                  <View style={styles.totalBreakdown}>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>Subtotal</Text>
                      <Text style={styles.breakdownValue}>{formatPeso(total)}</Text>
                    </View>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>Delivery</Text>
                      <Text style={styles.pickupIncluded}>Onsite pickup</Text>
                    </View>
                    <View style={styles.breakdownDivider} />
                    <View style={styles.grandTotalRow}>
                      <View>
                        <Text style={styles.grandTotalLabel}>Total to pay</Text>
                        <Text style={styles.grandTotalCaption}>PHP · Philippine peso</Text>
                      </View>
                      <Text style={styles.grandTotal}>{formatPeso(total)}</Text>
                    </View>
                  </View>
                )}
              </View>

              <View style={styles.sectionCard}>
                <View style={styles.sectionHeaderStatic}>
                  <View style={[styles.iconTile, styles.orangeTile]}>
                    <Ionicons name="person-outline" size={20} color="#FF9B54" />
                  </View>
                  <View>
                    <Text style={styles.sectionTitle}>Your details</Text>
                    <Text style={styles.sectionSubtitle}>
                      So we know who to prepare the order for
                    </Text>
                  </View>
                </View>

                <Text style={styles.inputLabel}>FULL NAME</Text>
                <View style={styles.inputShell}>
                  <Ionicons name="person-outline" size={19} color="#93A5B7" />
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="Enter your full name"
                    placeholderTextColor="#8190A0"
                    autoCapitalize="words"
                    autoComplete="name"
                    textContentType="name"
                    style={styles.input}
                    returnKeyType="next"
                  />
                </View>

                <Text style={styles.inputLabel}>CONTACT NUMBER</Text>
                <View style={styles.inputShell}>
                  <Ionicons name="call-outline" size={19} color="#93A5B7" />
                  <TextInput
                    value={contact}
                    onChangeText={setContact}
                    placeholder="e.g. 09XX XXX XXXX"
                    placeholderTextColor="#8190A0"
                    keyboardType="phone-pad"
                    autoComplete="tel"
                    textContentType="telephoneNumber"
                    style={styles.input}
                    returnKeyType="done"
                    maxLength={20}
                  />
                </View>
                <Text style={styles.fieldHint}>
                  We'll use these details if we need to contact you about your order.
                </Text>
              </View>

              <View style={styles.sectionCard}>
                <View style={styles.sectionHeaderStatic}>
                  <View style={[styles.iconTile, styles.greenTile]}>
                    <Ionicons name="card-outline" size={20} color="#48DDA9" />
                  </View>
                  <View>
                    <Text style={styles.sectionTitle}>Payment method</Text>
                    <Text style={styles.sectionSubtitle}>
                      Secure checkout powered by PayMongo
                    </Text>
                  </View>
                </View>

                <View style={styles.paymongoOption}>
                  <View style={styles.radioOuter}>
                    <View style={styles.radioInner} />
                  </View>
                  <View style={styles.paymongoLogoMark}>
                    <Ionicons name="shield-checkmark" size={22} color="#45DDA8" />
                  </View>
                  <View style={styles.paymongoTextWrap}>
                    <Text style={styles.paymongoTitle}>PayMongo</Text>
                    <Text style={styles.paymongoSubtitle}>
                      Available options shown on the secure payment page
                    </Text>
                  </View>
                  <Ionicons name="checkmark-circle" size={21} color="#31D7F4" />
                </View>

                <View style={styles.secureNote}>
                  <Ionicons name="lock-closed" size={14} color="#45DDA8" />
                  <Text style={styles.secureNoteText}>
                    Your payment details will be handled by PayMongo, not stored in MotoVision.
                  </Text>
                </View>
              </View>

              <View style={styles.pickupNotice}>
                <View style={styles.pickupIcon}>
                  <Ionicons name="storefront-outline" size={20} color="#FF9B54" />
                </View>
                <View style={styles.pickupCopy}>
                  <Text style={styles.pickupTitle}>Onsite collection only</Text>
                  <Text style={styles.pickupText}>
                    Your parts must be claimed onsite. Delivery is not available at this time.
                  </Text>
                </View>
              </View>

              <View style={styles.bottomReassurance}>
                <Ionicons name="information-circle-outline" size={17} color="#91A3B5" />
                <Text style={styles.bottomReassuranceText}>
                  Check your items and details before continuing. Your order isn't confirmed until payment is verified.
                </Text>
              </View>
            </ScrollView>

            <View style={styles.bottomBar}>
              <View style={styles.bottomTotalBlock}>
                <Text style={styles.bottomTotalLabel}>TOTAL AMOUNT</Text>
                <Text style={styles.bottomTotal}>{formatPeso(total)}</Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.payButton,
                  (cartItems.length === 0 || paymentBusy) && styles.payButtonDisabled,
                ]}
                onPress={handleProceedToPayment}
                disabled={cartItems.length === 0 || paymentBusy}
                activeOpacity={0.85}
              >
                {paymentBusy ? (
                  <ActivityIndicator color="#101821" />
                ) : (
                  <>
                    <Ionicons name="lock-closed" size={17} color="#101821" />
                    <Text style={styles.payButtonText}>Proceed to payment</Text>
                    <Ionicons name="arrow-forward" size={18} color="#101821" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: {
    flex: 1,
    backgroundColor: "#141D27",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 17,
    paddingTop: Platform.OS === "android" ? 30 : 42,
    paddingBottom: 10,
    backgroundColor: "#18232F",
    borderBottomWidth: 1,
    borderBottomColor: "#2C3A49",
  },
  backButton: {
    width: 43,
    height: 43,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#233544",
    borderWidth: 1,
    borderColor: "#354B5B",
  },
  topBarTitleWrap: { flex: 1, marginLeft: 12 },
  topBarTitle: {
    color: "#F7FAFC",
    fontSize: 23,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  topBarSubtitle: {
    color: "#A7B6C5",
    fontSize: 11,
    marginTop: 2,
    fontWeight: "500",
  },
  secureBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: "#203A3A",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#31554F",
  },
  secureText: { color: "#B4F5D9", fontSize: 11, fontWeight: "800" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: { color: "#B7C4D0", fontSize: 13, fontWeight: "600" },
  scrollContent: {
    padding: 16,
    paddingBottom: 28,
  },
  banner: {
    height: 178,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#0A1722",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#334757",
  },
  bannerImage: { borderRadius: 20 },
  bannerShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(8, 17, 27, 0.17)",
  },
  bannerCopy: {
    paddingLeft: 17,
    paddingRight: "39%",
    justifyContent: "center",
  },
  bannerPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#35D8F5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
    marginBottom: 10,
  },
  bannerPillText: {
    color: "#101821",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },
  bannerHeading: {
    color: "#FFFFFF",
    fontSize: 21,
    lineHeight: 25,
    fontWeight: "900",
    letterSpacing: -0.6,
  },
  bannerHeadingAccent: {
    color: "#55E1F7",
    fontSize: 22,
    lineHeight: 26,
    fontWeight: "900",
    letterSpacing: -0.6,
  },
  bannerSubtext: {
    color: "#F2F6FA",
    fontSize: 10,
    marginTop: 7,
    fontWeight: "600",
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 17,
    marginBottom: 17,
    paddingHorizontal: 8,
  },
  progressStep: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  progressDot: {
    width: 23,
    height: 23,
    borderRadius: 12,
    backgroundColor: "#263441",
    borderWidth: 1,
    borderColor: "#3C4D5D",
    alignItems: "center",
    justifyContent: "center",
  },
  progressDotDone: {
    backgroundColor: "#49E0AD",
    borderColor: "#49E0AD",
  },
  progressDotActive: {
    width: 23,
    height: 23,
    borderRadius: 12,
    backgroundColor: "#35D8F5",
    alignItems: "center",
    justifyContent: "center",
  },
  progressNumber: { color: "#10202A", fontSize: 11, fontWeight: "900" },
  progressNumberMuted: { color: "#9BACBC", fontSize: 11, fontWeight: "800" },
  progressDoneText: { color: "#B8F5DE", fontSize: 11, fontWeight: "800" },
  progressActiveText: { color: "#F5FAFF", fontSize: 11, fontWeight: "900" },
  progressMutedText: { color: "#8D9CAC", fontSize: 11, fontWeight: "700" },
  progressLine: {
    flex: 1,
    maxWidth: 55,
    height: 1,
    backgroundColor: "#415363",
    marginHorizontal: 9,
  },
  sectionCard: {
    backgroundColor: "#202C38",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#344555",
    padding: 15,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  sectionHeaderStatic: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    marginBottom: 17,
  },
  sectionTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    flex: 1,
  },
  iconTile: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  cyanTile: { backgroundColor: "#173D4A" },
  orangeTile: { backgroundColor: "#49362D" },
  greenTile: { backgroundColor: "#204139" },
  sectionTitle: { color: "#F6F9FC", fontSize: 16, fontWeight: "900" },
  sectionSubtitle: { color: "#A7B6C5", fontSize: 11, marginTop: 3, lineHeight: 15 },
  summaryHeaderRight: { alignItems: "flex-end", gap: 4 },
  summaryHeaderPrice: { color: "#55E1F7", fontSize: 14, fontWeight: "900" },
  itemsList: { marginTop: 13 },
  emptyCart: {
    alignItems: "center",
    paddingVertical: 22,
    paddingHorizontal: 12,
  },
  emptyCartTitle: { color: "#F5F8FB", fontSize: 15, fontWeight: "800", marginTop: 8 },
  emptyCartText: {
    color: "#A7B6C5",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    marginTop: 5,
    maxWidth: 245,
  },
  browseButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#35D8F5",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 11,
    marginTop: 14,
  },
  browseButtonText: { color: "#101821", fontSize: 12, fontWeight: "900" },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 11,
  },
  itemDivider: { borderBottomWidth: 1, borderBottomColor: "#354554" },
  itemImageWrap: {
    width: 67,
    height: 67,
    borderRadius: 13,
    backgroundColor: "#F0F3F6",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#455766",
  },
  itemImage: { width: "100%", height: "100%", resizeMode: "cover" },
  itemImageFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2B3946",
  },
  itemDetails: { flex: 1 },
  itemName: { color: "#F6F9FC", fontSize: 12, fontWeight: "800", lineHeight: 17 },
  itemMetaRow: { flexDirection: "row", flexWrap: "wrap", gap: 5, marginTop: 5 },
  itemTag: {
    borderRadius: 6,
    backgroundColor: "#2D3C49",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "#425464",
  },
  itemTagText: { color: "#C8D6E2", fontSize: 9, fontWeight: "700" },
  itemQuantity: { color: "#9FAFBE", fontSize: 10, marginTop: 5 },
  itemLineTotal: {
    color: "#F4F8FB",
    fontSize: 11,
    fontWeight: "900",
    alignSelf: "flex-start",
    marginTop: 3,
  },
  totalBreakdown: {
    borderTopWidth: 1,
    borderTopColor: "#3A4B5A",
    marginTop: 8,
    paddingTop: 13,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 9,
  },
  breakdownLabel: { color: "#A7B6C5", fontSize: 12, fontWeight: "600" },
  breakdownValue: { color: "#DDE6EE", fontSize: 12, fontWeight: "800" },
  pickupIncluded: { color: "#49DDA9", fontSize: 11, fontWeight: "800" },
  breakdownDivider: { height: 1, backgroundColor: "#3A4B5A", marginVertical: 5 },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 5,
  },
  grandTotalLabel: { color: "#F5F8FB", fontSize: 13, fontWeight: "900" },
  grandTotalCaption: { color: "#91A3B5", fontSize: 10, marginTop: 3 },
  grandTotal: { color: "#55E1F7", fontSize: 20, fontWeight: "900" },
  inputLabel: {
    color: "#AFC0CF",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 2,
  },
  inputShell: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    minHeight: 52,
    paddingHorizontal: 13,
    backgroundColor: "#17222D",
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#3A4B5B",
    marginBottom: 14,
  },
  input: {
    flex: 1,
    color: "#F7FAFC",
    fontSize: 13,
    paddingVertical: 12,
  },
  fieldHint: {
    color: "#91A3B5",
    fontSize: 10,
    lineHeight: 15,
    marginTop: -3,
  },
  paymongoOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#35D8F5",
    backgroundColor: "#1B3541",
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#35D8F5",
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#35D8F5",
  },
  paymongoLogoMark: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#244A43",
    alignItems: "center",
    justifyContent: "center",
  },
  paymongoTextWrap: { flex: 1 },
  paymongoTitle: { color: "#F6FAFC", fontSize: 14, fontWeight: "900" },
  paymongoSubtitle: { color: "#B6C5D2", fontSize: 10, lineHeight: 15, marginTop: 3 },
  secureNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
    marginTop: 12,
    paddingHorizontal: 2,
  },
  secureNoteText: { flex: 1, color: "#A7B6C5", fontSize: 10, lineHeight: 15 },
  pickupNotice: {
    flexDirection: "row",
    gap: 11,
    alignItems: "center",
    backgroundColor: "#302D2A",
    borderWidth: 1,
    borderColor: "#584337",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  pickupIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#49362D",
    alignItems: "center",
    justifyContent: "center",
  },
  pickupCopy: { flex: 1 },
  pickupTitle: { color: "#FFE1CA", fontSize: 13, fontWeight: "900" },
  pickupText: { color: "#D1BEB1", fontSize: 11, lineHeight: 16, marginTop: 4 },
  bottomReassurance: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
    paddingHorizontal: 3,
    marginTop: 1,
    marginBottom: 8,
  },
  bottomReassuranceText: { flex: 1, color: "#9EADBA", fontSize: 10, lineHeight: 15 },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 22 : 13,
    backgroundColor: "#202C38",
    borderTopWidth: 1,
    borderTopColor: "#3A4B5A",
  },
  bottomTotalBlock: { flexShrink: 0 },
  bottomTotalLabel: { color: "#A5B5C4", fontSize: 9, fontWeight: "900", letterSpacing: 0.8 },
  bottomTotal: { color: "#55E1F7", fontSize: 20, fontWeight: "900", marginTop: 4 },
  payButton: {
    flex: 1,
    minHeight: 51,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#35D8F5",
    borderRadius: 15,
    paddingHorizontal: 12,
    shadowColor: "#35D8F5",
    shadowOpacity: 0.17,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  payButtonDisabled: {
    backgroundColor: "#536675",
    shadowOpacity: 0,
  },
  payButtonText: {
    color: "#101821",
    fontSize: 12,
    fontWeight: "900",
  },
});
