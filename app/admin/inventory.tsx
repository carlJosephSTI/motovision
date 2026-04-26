import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../../firebaseConfig";

export default function Inventory() {
  const [products, setProducts] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [stock, setStock] = useState("");
  const [image, setImage] = useState("");

  // 🔥 Real-time product listener
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "products"), (snap) => {
      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProducts(data);
    });

    return () => unsub();
  }, []);

  // ✅ Add Product
  const addProduct = async () => {
    if (!name || !price || !category || !stock || !image) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    await addDoc(collection(db, "products"), {
      name,
      price: Number(price),
      category,
      stock: Number(stock),
      image,
      createdAt: new Date(),
    });

    setName("");
    setPrice("");
    setCategory("");
    setStock("");
    setImage("");
  };

  // ❌ Delete Product
  const deleteProduct = async (id: string) => {
    await deleteDoc(doc(db, "products", id));
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Inventory</Text>

      {/* 🟢 Product Form */}
      <TextInput
        placeholder="Product Name"
        style={styles.input}
        value={name}
        onChangeText={setName}
      />

      <TextInput
        placeholder="Price"
        style={styles.input}
        keyboardType="numeric"
        value={price}
        onChangeText={setPrice}
      />

      <TextInput
        placeholder="Category"
        style={styles.input}
        value={category}
        onChangeText={setCategory}
      />

      <TextInput
        placeholder="Stock"
        style={styles.input}
        keyboardType="numeric"
        value={stock}
        onChangeText={setStock}
      />

      <TextInput
        placeholder="Image URL"
        style={styles.input}
        value={image}
        onChangeText={setImage}
      />

      {/* 🔥 Preview Image */}
      {image ? (
        <Image
          source={{ uri: image }}
          style={{ width: 120, height: 120, marginVertical: 10 }}
        />
      ) : null}

      <TouchableOpacity style={styles.button} onPress={addProduct}>
        <Text style={styles.buttonText}>Add Product</Text>
      </TouchableOpacity>

      {/* 🟣 Product List */}
      {products.map((item) => (
        <View key={item.id} style={styles.card}>
          {item.image && (
            <Image
              source={{ uri: item.image }}
              style={{ width: 80, height: 80, borderRadius: 10 }}
            />
          )}

          <Text style={styles.productName}>{item.name}</Text>
          <Text>₱{item.price}</Text>
          <Text>Category: {item.category}</Text>
          <Text>Stock: {item.stock}</Text>

          <TouchableOpacity onPress={() => deleteProduct(item.id)}>
            <Text style={{ color: "red", marginTop: 6 }}>Delete</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: "#F4F6F9" },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 15 },

  input: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },

  button: {
    backgroundColor: "black",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 15,
  },

  buttonText: { color: "white", fontWeight: "600" },

  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },

  productName: {
    fontWeight: "600",
    fontSize: 16,
  },
});