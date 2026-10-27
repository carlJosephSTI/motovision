
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { db } from "../../firebaseConfig";

const ORANGE = "#FF6A00";
const ORANGE_LIGHT = "#FFF0E5";
const WHITE = "#FFFFFF";
const BACKGROUND = "#F7F8FA";
const TEXT = "#171717";
const MUTED = "#777777";
const BORDER = "#E7E7E7";
const GREEN = "#15803D";
const RED = "#DC2626";

type Model = "Click 160" | "ADV 160";

type InventoryProduct = {
  id: string;
  name: string;
  price: number;
  stock: number;
  model: Model;
  category: string;
  imageKey: string;
};

type ImageOption = {
  key: string;
  label: string;
  model: Model;
  source: any;
};

const IMAGE_LIBRARY: ImageOption[] = [
  {
    key: "click160-front-side-matte-red",
    label: "Front Side Matte Red",
    model: "Click 160",
    source: require("../../assets/images/Product_Images/hondaClick160FrontSideMatteRed.jpg"),
  },
  {
    key: "click160-front-side-matte-black",
    label: "Front Side Matte Black",
    model: "Click 160",
    source: require("../../assets/images/Product_Images/hondaClick160FrontSideMatteBlack.jpg"),
  },
  {
    key: "click160-front-cover-matte-red",
    label: "Front Cover Matte Red",
    model: "Click 160",
    source: require("../../assets/images/Product_Images/hondaClick160FrontCoverMatteRed.jpg"),
  },
  {
    key: "click160-front-cover-matte-black",
    label: "Front Cover Matte Black",
    model: "Click 160",
    source: require("../../assets/images/Product_Images/hondaClick160FrontCoverMatteBlack.jpg"),
  },
  {
    key: "click160-front-fender-glossy-black",
    label: "Front Fender Glossy Black",
    model: "Click 160",
    source: require("../../assets/images/Product_Images/hondaClick160FrontFenderGlossyBlack.jpg"),
  },
  {
    key: "click160-front-cover-right-white",
    label: "Front Cover Right White",
    model: "Click 160",
    source: require("../../assets/images/Product_Images/hondaClick160FrontCoverRigthWhite.jpg"),
  },
  {
    key: "adv160-front-center-cover",
    label: "Front Center Cover",
    model: "ADV 160",
    source: require("../../assets/images/Product_Images/hondaAdv160frontcentercover.jpg"),
  },
  {
    key: "adv160-front-side-left-black",
    label: "Front Side Left Black",
    model: "ADV 160",
    source: require("../../assets/images/Product_Images/hondaAdv160FrontSideLeftBlack.jpg"),
  },
  {
    key: "adv160-cover-front-upper-matte-red",
    label: "Front Upper Cover Matte Red",
    model: "ADV 160",
    source: require("../../assets/images/Product_Images/hondaAdv160coverFrontupperMatteRed.jpg"),
  },
  {
    key: "adv160-front-fender-matte-black",
    label: "Front Fender Matte Black",
    model: "ADV 160",
    source: require("../../assets/images/Product_Images/hondaAdv160frontFenderMatteBlack.jpg"),
  },
];

const CATEGORIES = [
  "Body Panel",
  "Front Cover",
  "Fender",
  "Other Part",
];

const emptyForm = {
  name: "",
  price: "",
  stock: "",
  model: "Click 160" as Model,
  category: "Body Panel",
  imageKey: "click160-front-side-matte-red",
};

function getImage(imageKey?: string) {
  return IMAGE_LIBRARY.find((item) => item.key === imageKey)?.source;
}

function formatPrice(price: number) {
  return `₱${Number(price || 0).toLocaleString("en-PH", {
    maximumFractionDigits: 2,
  })}`;
}

export default function InventoryScreen() {
  const router = useRouter();

  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [search, setSearch] = useState("");
  const [modelFilter, setModelFilter] = useState<
    "All" | Model
  >("All");

  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [imageFilter, setImageFilter] = useState<Model>("Click 160");
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "products"),
      (snapshot) => {
        const loadedProducts: InventoryProduct[] =
          snapshot.docs.map((item) => {
            const data = item.data();

            return {
              id: item.id,
              name: String(data.name ?? ""),
              price: Number(data.price ?? 0),
              stock: Number(data.stock ?? 0),
              model:
                data.model === "ADV 160" ||
                data.motorcycleModel === "ADV 160"
                  ? "ADV 160"
                  : "Click 160",
              category: String(data.category ?? "Other Part"),
              imageKey: String(data.imageKey ?? ""),
            };
          });

        setProducts(loadedProducts);
        setLoading(false);
        setLoadError("");
      },
      (error) => {
        console.error("Inventory listener error:", error);
        setLoading(false);
        setLoadError(
          "Couldn't load inventory. Check your connection and Firebase permissions."
        );
      }
    );

    return unsubscribe;
  }, []);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !term ||
        product.name.toLowerCase().includes(term) ||
        product.category.toLowerCase().includes(term) ||
        product.model.toLowerCase().includes(term);

      const matchesModel =
        modelFilter === "All" || product.model === modelFilter;

      return matchesSearch && matchesModel;
    });
  }, [products, search, modelFilter]);

  const totalUnits = products.reduce(
    (sum, product) => sum + Math.max(0, product.stock),
    0
  );

  const lowStockCount = products.filter(
    (product) => product.stock <= 5
  ).length;

  function updateForm<K extends keyof typeof emptyForm>(
    key: K,
    value: (typeof emptyForm)[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function openAddModal() {
    setEditingId(null);
    setForm(emptyForm);
    setImageFilter("Click 160");
    setModalVisible(true);
  }

  function openEditModal(product: InventoryProduct) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      price: String(product.price),
      stock: String(product.stock),
      model: product.model,
      category: product.category,
      imageKey: product.imageKey,
    });
    setImageFilter(product.model);
    setModalVisible(true);
  }

  function selectModel(model: Model) {
    updateForm("model", model);
    setImageFilter(model);

    const currentImage = IMAGE_LIBRARY.find(
      (item) => item.key === form.imageKey
    );

    if (!currentImage || currentImage.model !== model) {
      const firstImage = IMAGE_LIBRARY.find(
        (item) => item.model === model
      );
      if (firstImage) {
        updateForm("imageKey", firstImage.key);
      }
    }
  }

  async function saveProduct() {
    const name = form.name.trim();
    const price = Number(form.price);
    const stock = Number(form.stock);

    if (!name) {
      Alert.alert("Missing name", "Enter the motorcycle part name.");
      return;
    }

    if (
      form.price.trim() === "" ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      Alert.alert("Invalid price", "Enter a valid price of zero or more.");
      return;
    }

    if (
      form.stock.trim() === "" ||
      !Number.isInteger(stock) ||
      stock < 0
    ) {
      Alert.alert(
        "Invalid stock",
        "Stock must be a whole number of zero or more."
      );
      return;
    }

    if (!IMAGE_LIBRARY.some((item) => item.key === form.imageKey)) {
      Alert.alert("Choose an image", "Select an image from the library.");
      return;
    }

    setSaving(true);

    try {
      const productData = {
        name,
        price,
        stock,
        model: form.model,
        category: form.category,
        imageKey: form.imageKey,
        updatedAt: serverTimestamp(),
      };

      if (editingId) {
        await updateDoc(doc(db, "products", editingId), productData);
      } else {
        await addDoc(collection(db, "products"), {
          ...productData,
          createdAt: serverTimestamp(),
        });
      }

      setModalVisible(false);
      setEditingId(null);
      setForm(emptyForm);

      Alert.alert(
        "Success",
        editingId
          ? "The motorcycle part has been updated."
          : "The motorcycle part has been added to inventory."
      );
    } catch (error) {
      console.error("Saving product failed:", error);
      Alert.alert(
        "Couldn't save product",
        "Check that you're logged in with an admin account and that your Firestore rules allow product changes."
      );
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete(product: InventoryProduct) {
    Alert.alert(
      "Delete motorcycle part?",
      `Are you sure you want to delete "${product.name}" from inventory?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "products", product.id));
            } catch (error) {
              console.error("Deleting product failed:", error);
              Alert.alert(
                "Couldn't delete",
                "Check your Firebase connection and admin permissions."
              );
            }
          },
        },
      ]
    );
  }

  function renderStat(
    icon: keyof typeof Ionicons.glyphMap,
    label: string,
    value: number,
    accent = false
  ) {
    return (
      <View style={styles.statCard}>
        <View
          style={[
            styles.statIcon,
            accent && styles.statIconAccent,
          ]}
        >
          <Ionicons
            name={icon}
            size={20}
            color={accent ? ORANGE : TEXT}
          />
        </View>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue}>{value.toLocaleString()}</Text>
      </View>
    );
  }

  function renderProduct(product: InventoryProduct) {
    const image = getImage(product.imageKey);

    return (
      <View key={product.id} style={styles.productCard}>
        <View style={styles.productTop}>
          <View style={styles.productImageBox}>
            {image ? (
              <Image
                source={image}
                style={styles.productImage}
                resizeMode="contain"
              />
            ) : (
              <Ionicons
                name="image-outline"
                size={34}
                color="#B8B8B8"
              />
            )}
          </View>

          <View style={styles.productInfo}>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.productModel}>{product.model}</Text>

            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>
                {product.category}
              </Text>
            </View>

            <Text style={styles.productPrice}>
              {formatPrice(product.price)}
            </Text>
          </View>
        </View>

        <View style={styles.productDivider} />

        <View style={styles.productBottom}>
          <View>
            <Text style={styles.stockCaption}>Available stock</Text>
            <View style={styles.stockRow}>
              <View
                style={[
                  styles.stockDot,
                  {
                    backgroundColor:
                      product.stock <= 5 ? RED : GREEN,
                  },
                ]}
              />
              <Text
                style={[
                  styles.stockValue,
                  { color: product.stock <= 5 ? RED : GREEN },
                ]}
              >
                {product.stock} units
              </Text>
              {product.stock <= 5 && (
                <Text style={styles.lowStockText}>Low stock</Text>
              )}
            </View>
          </View>

          <View style={styles.productActions}>
            <Pressable
              onPress={() => openEditModal(product)}
              style={styles.actionButton}
              accessibilityLabel="Edit product"
            >
              <Ionicons name="create-outline" size={19} color={ORANGE} />
            </Pressable>

            <Pressable
              onPress={() => confirmDelete(product)}
              style={[styles.actionButton, styles.deleteButton]}
              accessibilityLabel="Delete product"
            >
              <Ionicons name="trash-outline" size={19} color={RED} />
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={WHITE} />

      <View style={styles.header}>
        <Pressable
          onPress={() => router.replace("/admin")}
          style={styles.backButton}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={23} color={TEXT} />
        </Pressable>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Inventory</Text>
          <Text style={styles.headerSubtitle}>Manage motorcycle parts</Text>
        </View>

        <View style={styles.adminBadge}>
          <Ionicons name="shield-checkmark" size={17} color={ORANGE} />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.welcomeSection}>
          <View style={styles.eyebrow}>
            <View style={styles.eyebrowDot} />
            <Text style={styles.eyebrowText}>ADMINISTRATION</Text>
          </View>

          <Text style={styles.pageTitle}>
            Parts{"\n"}
            <Text style={styles.pageTitleAccent}>Inventory.</Text>
          </Text>

          <Text style={styles.pageDescription}>
            Keep your motorcycle parts organized and your stock up to date.
          </Text>
        </View>

        <View style={styles.statsGrid}>
          {renderStat("cube-outline", "Parts listed", products.length, true)}
          {renderStat("layers-outline", "Total units", totalUnits)}
          {renderStat("alert-circle-outline", "Low stock", lowStockCount)}
        </View>

        <Pressable style={styles.addButton} onPress={openAddModal}>
          <Ionicons name="add-circle-outline" size={22} color={WHITE} />
          <Text style={styles.addButtonText}>Add motorcycle part</Text>
          <Ionicons name="arrow-forward" size={18} color={WHITE} />
        </Pressable>

        <View style={styles.listHeading}>
          <View>
            <Text style={styles.sectionTitle}>Your parts</Text>
            <Text style={styles.sectionSubtitle}>
              {filteredProducts.length}{" "}
              {filteredProducts.length === 1 ? "item" : "items"} displayed
            </Text>
          </View>
          <Ionicons name="grid-outline" size={21} color={ORANGE} />
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color={MUTED} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search parts, models, categories..."
            placeholderTextColor="#999999"
            style={styles.searchInput}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={19} color={MUTED} />
            </Pressable>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {(["All", "Click 160", "ADV 160"] as const).map((model) => {
            const selected = modelFilter === model;

            return (
              <Pressable
                key={model}
                onPress={() => setModelFilter(model)}
                style={[
                  styles.filterChip,
                  selected && styles.filterChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    selected && styles.filterTextActive,
                  ]}
                >
                  {model === "All" ? "All parts" : model}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {loading ? (
          <View style={styles.stateContainer}>
            <ActivityIndicator size="large" color={ORANGE} />
            <Text style={styles.stateTitle}>Loading inventory...</Text>
          </View>
        ) : loadError ? (
          <View style={styles.stateContainer}>
            <Ionicons
              name="cloud-offline-outline"
              size={42}
              color={RED}
            />
            <Text style={styles.stateTitle}>Couldn't load inventory</Text>
            <Text style={styles.stateDescription}>{loadError}</Text>
          </View>
        ) : filteredProducts.length === 0 ? (
          <View style={styles.stateContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons name="file-tray-outline" size={35} color={ORANGE} />
            </View>
            <Text style={styles.stateTitle}>
              {products.length === 0
                ? "No parts in inventory yet"
                : "No matching parts"}
            </Text>
            <Text style={styles.stateDescription}>
              {products.length === 0
                ? "Add your first motorcycle part to start tracking your stock."
                : "Try another search or change the motorcycle model filter."}
            </Text>
            {products.length === 0 && (
              <Pressable
                style={styles.emptyAddButton}
                onPress={openAddModal}
              >
                <Ionicons name="add" size={19} color={WHITE} />
                <Text style={styles.emptyAddText}>Add your first part</Text>
              </Pressable>
            )}
          </View>
        ) : (
          <View style={styles.productList}>
            {filteredProducts.map(renderProduct)}
          </View>
        )}

        <Text style={styles.footerText}>MOTOVISION ADMIN · INVENTORY</Text>
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={styles.modalHeader}>
            <Pressable
              onPress={() => setModalVisible(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color={TEXT} />
            </Pressable>

            <View style={styles.modalTitleContainer}>
              <Text style={styles.modalTitle}>
                {editingId ? "Edit part" : "Add new part"}
              </Text>
              <Text style={styles.modalSubtitle}>
                Motorcycle parts inventory
              </Text>
            </View>

            <View style={{ width: 42 }} />
          </View>

          <ScrollView
            contentContainerStyle={styles.modalContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.fieldLabel}>PART NAME</Text>
            <TextInput
              value={form.name}
              onChangeText={(value) => updateForm("name", value)}
              placeholder="e.g. Click 160 Front Side"
              placeholderTextColor="#999999"
              style={styles.input}
              maxLength={100}
            />

            <Text style={styles.fieldLabel}>MOTORCYCLE MODEL</Text>
            <View style={styles.optionRow}>
              {(["Click 160", "ADV 160"] as Model[]).map((model) => (
                <Pressable
                  key={model}
                  onPress={() => selectModel(model)}
                  style={[
                    styles.optionButton,
                    form.model === model && styles.optionButtonActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.optionText,
                      form.model === model && styles.optionTextActive,
                    ]}
                  >
                    {model}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.fieldLabel}>CATEGORY</Text>
            <View style={styles.categoryOptions}>
              {CATEGORIES.map((category) => (
                <Pressable
                  key={category}
                  onPress={() => updateForm("category", category)}
                  style={[
                    styles.categoryOption,
                    form.category === category &&
                      styles.categoryOptionActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryOptionText,
                      form.category === category &&
                        styles.categoryOptionTextActive,
                    ]}
                  >
                    {category}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.twoColumnFields}>
              <View style={styles.halfField}>
                <Text style={styles.fieldLabel}>PRICE (₱)</Text>
                <TextInput
                  value={form.price}
                  onChangeText={(value) => updateForm("price", value)}
                  placeholder="2500"
                  placeholderTextColor="#999999"
                  style={styles.input}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.halfField}>
                <Text style={styles.fieldLabel}>STOCK QUANTITY</Text>
                <TextInput
                  value={form.stock}
                  onChangeText={(value) => updateForm("stock", value)}
                  placeholder="10"
                  placeholderTextColor="#999999"
                  style={styles.input}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            <View style={styles.imageHeading}>
              <View>
                <Text style={styles.fieldLabel}>PRODUCT IMAGE</Text>
                <Text style={styles.imageHint}>
                  Choose an existing app image
                </Text>
              </View>
              <Ionicons name="images-outline" size={21} color={ORANGE} />
            </View>

            <View style={styles.imageGrid}>
              {IMAGE_LIBRARY.filter(
                (item) => item.model === imageFilter
              ).map((item) => {
                const selected = form.imageKey === item.key;

                return (
                  <Pressable
                    key={item.key}
                    onPress={() => updateForm("imageKey", item.key)}
                    style={[
                      styles.imageOption,
                      selected && styles.imageOptionActive,
                    ]}
                  >
                    <Image
                      source={item.source}
                      style={styles.imageOptionImage}
                      resizeMode="contain"
                    />

                    {selected && (
                      <View style={styles.imageCheck}>
                        <Ionicons
                          name="checkmark"
                          size={14}
                          color={WHITE}
                        />
                      </View>
                    )}

                    <Text
                      style={styles.imageOptionLabel}
                      numberOfLines={2}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.modalNote}>
              <Ionicons
                name="information-circle-outline"
                size={19}
                color={ORANGE}
              />
              <Text style={styles.modalNoteText}>
                Images come from the app's bundled image library. Adding new
                image files requires adding them to the project first.
              </Text>
            </View>

            <Pressable
              onPress={saveProduct}
              disabled={saving}
              style={[
                styles.saveButton,
                saving && styles.saveButtonDisabled,
              ]}
            >
              {saving ? (
                <ActivityIndicator color={WHITE} />
              ) : (
                <>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={21}
                    color={WHITE}
                  />
                  <Text style={styles.saveButtonText}>
                    {editingId ? "Save changes" : "Add to inventory"}
                  </Text>
                </>
              )}
            </Pressable>

            <Pressable
              onPress={() => setModalVisible(false)}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: WHITE,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    backgroundColor: WHITE,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: BACKGROUND,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: TEXT,
  },
  headerSubtitle: {
    fontSize: 12,
    color: MUTED,
    marginTop: 3,
  },
  adminBadge: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: ORANGE_LIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 23,
    paddingBottom: 35,
  },
  welcomeSection: {
    marginBottom: 22,
  },
  eyebrow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  eyebrowDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: ORANGE,
    marginRight: 8,
  },
  eyebrowText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.8,
    color: ORANGE,
  },
  pageTitle: {
    fontSize: 34,
    fontWeight: "900",
    lineHeight: 39,
    color: TEXT,
    letterSpacing: -1,
  },
  pageTitleAccent: {
    color: ORANGE,
  },
  pageDescription: {
    color: MUTED,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 9,
    maxWidth: 320,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 9,
    marginBottom: 15,
  },
  statCard: {
    flex: 1,
    minWidth: 0,
    padding: 12,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: WHITE,
  },
  statIcon: {
    width: 35,
    height: 35,
    borderRadius: 11,
    backgroundColor: "#F2F2F2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  statIconAccent: {
    backgroundColor: ORANGE_LIGHT,
  },
  statLabel: {
    color: MUTED,
    fontSize: 10,
    fontWeight: "600",
    minHeight: 25,
  },
  statValue: {
    color: TEXT,
    fontSize: 23,
    fontWeight: "900",
    marginTop: 3,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 15,
    backgroundColor: ORANGE,
    marginBottom: 29,
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.17,
    shadowRadius: 9,
    elevation: 3,
  },
  addButtonText: {
    flex: 1,
    color: WHITE,
    fontWeight: "800",
    fontSize: 15,
  },
  listHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 21,
    fontWeight: "900",
    color: TEXT,
  },
  sectionSubtitle: {
    color: MUTED,
    fontSize: 12,
    marginTop: 4,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    backgroundColor: WHITE,
    paddingHorizontal: 13,
    minHeight: 49,
  },
  searchInput: {
    flex: 1,
    color: TEXT,
    fontSize: 13,
    paddingVertical: 12,
  },
  filterRow: {
    gap: 9,
    paddingTop: 13,
    paddingBottom: 17,
  },
  filterChip: {
    paddingVertical: 9,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: WHITE,
  },
  filterChipActive: {
    backgroundColor: ORANGE_LIGHT,
    borderColor: ORANGE,
  },
  filterText: {
    fontSize: 12,
    color: MUTED,
    fontWeight: "700",
  },
  filterTextActive: {
    color: ORANGE,
  },
  productList: {
    gap: 13,
  },
  productCard: {
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: WHITE,
  },
  productTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 13,
  },
  productImageBox: {
    width: 104,
    height: 104,
    borderRadius: 14,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  productImage: {
    width: "92%",
    height: "92%",
  },
  productInfo: {
    flex: 1,
    paddingTop: 2,
  },
  productName: {
    color: TEXT,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20,
  },
  productModel: {
    fontSize: 12,
    color: MUTED,
    marginTop: 4,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: ORANGE_LIGHT,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 4,
    marginTop: 7,
  },
  categoryBadgeText: {
    color: ORANGE,
    fontSize: 10,
    fontWeight: "800",
  },
  productPrice: {
    color: TEXT,
    fontSize: 17,
    fontWeight: "900",
    marginTop: 8,
  },
  productDivider: {
    height: 1,
    backgroundColor: BORDER,
    marginVertical: 13,
  },
  productBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stockCaption: {
    color: MUTED,
    fontSize: 11,
    marginBottom: 6,
  },
  stockRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  stockDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  stockValue: {
    fontSize: 13,
    fontWeight: "800",
  },
  lowStockText: {
    fontSize: 10,
    fontWeight: "800",
    color: RED,
    backgroundColor: "#FEECEC",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
  },
  productActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    width: 39,
    height: 39,
    borderRadius: 12,
    backgroundColor: ORANGE_LIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButton: {
    backgroundColor: "#FEECEC",
  },
  stateContainer: {
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 18,
    paddingHorizontal: 22,
    paddingVertical: 32,
    alignItems: "center",
    marginTop: 5,
  },
  emptyIcon: {
    width: 65,
    height: 65,
    borderRadius: 21,
    backgroundColor: ORANGE_LIGHT,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 13,
  },
  stateTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: TEXT,
    textAlign: "center",
    marginTop: 10,
  },
  stateDescription: {
    color: MUTED,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
    marginTop: 7,
  },
  emptyAddButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: ORANGE,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 11,
    marginTop: 18,
  },
  emptyAddText: {
    color: WHITE,
    fontWeight: "800",
    fontSize: 12,
  },
  footerText: {
    textAlign: "center",
    color: "#A0A0A0",
    fontSize: 9,
    letterSpacing: 1.5,
    fontWeight: "800",
    marginTop: 30,
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: WHITE,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 17,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  modalCloseButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: BACKGROUND,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitleContainer: {
    flex: 1,
    alignItems: "center",
  },
  modalTitle: {
    color: TEXT,
    fontSize: 18,
    fontWeight: "900",
  },
  modalSubtitle: {
    color: MUTED,
    fontSize: 11,
    marginTop: 4,
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 40,
  },
  fieldLabel: {
    color: "#505050",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.1,
    marginBottom: 9,
    marginTop: 17,
  },
  input: {
    backgroundColor: BACKGROUND,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 13,
    color: TEXT,
    fontSize: 14,
  },
  optionRow: {
    flexDirection: "row",
    gap: 10,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 13,
    alignItems: "center",
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: BACKGROUND,
    borderRadius: 12,
  },
  optionButtonActive: {
    borderColor: ORANGE,
    backgroundColor: ORANGE_LIGHT,
  },
  optionText: {
    color: MUTED,
    fontWeight: "700",
    fontSize: 13,
  },
  optionTextActive: {
    color: ORANGE,
  },
  categoryOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryOption: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    backgroundColor: BACKGROUND,
    paddingHorizontal: 11,
    paddingVertical: 10,
  },
  categoryOptionActive: {
    backgroundColor: ORANGE_LIGHT,
    borderColor: ORANGE,
  },
  categoryOptionText: {
    color: MUTED,
    fontSize: 12,
    fontWeight: "700",
  },
  categoryOptionTextActive: {
    color: ORANGE,
  },
  twoColumnFields: {
    flexDirection: "row",
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  imageHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 7,
  },
  imageHint: {
    fontSize: 12,
    color: MUTED,
    marginTop: -3,
  },
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 12,
  },
  imageOption: {
    width: "48%",
    flexGrow: 1,
    flexBasis: "44%",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 13,
    padding: 9,
    backgroundColor: WHITE,
    position: "relative",
  },
  imageOptionActive: {
    borderColor: ORANGE,
    borderWidth: 2,
    backgroundColor: "#FFFAF6",
  },
  imageOptionImage: {
    width: "100%",
    height: 100,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
  },
  imageOptionLabel: {
    color: TEXT,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 8,
    minHeight: 29,
  },
  imageCheck: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 23,
    height: 23,
    borderRadius: 12,
    backgroundColor: ORANGE,
    alignItems: "center",
    justifyContent: "center",
  },
  modalNote: {
    flexDirection: "row",
    gap: 9,
    alignItems: "flex-start",
    padding: 12,
    borderRadius: 12,
    backgroundColor: ORANGE_LIGHT,
    marginTop: 20,
  },
  modalNoteText: {
    flex: 1,
    fontSize: 12,
    color: "#75401D",
    lineHeight: 18,
  },
  saveButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 9,
    backgroundColor: ORANGE,
    paddingVertical: 15,
    borderRadius: 13,
    marginTop: 23,
  },
  saveButtonDisabled: {
    opacity: 0.65,
  },
  saveButtonText: {
    color: WHITE,
    fontSize: 14,
    fontWeight: "900",
  },
  cancelButton: {
    alignItems: "center",
    paddingVertical: 14,
    marginTop: 3,
  },
  cancelButtonText: {
    color: MUTED,
    fontWeight: "700",
    fontSize: 13,
  },
});
