
const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
require("dotenv").config();

const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

const app = express();
const PORT = process.env.PORT || 3000;

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

if (!serviceAccountJson) {
  console.error("Missing FIREBASE_SERVICE_ACCOUNT_JSON.");
  process.exit(1);
}

try {
  if (!getApps().length) {
    initializeApp({
      credential: cert(JSON.parse(serviceAccountJson)),
    });
  }
} catch (error) {
  console.error("Firebase Admin initialization failed. Check credentials.");
  process.exit(1);
}

const db = getFirestore();
app.use(cors());
app.use(express.json({ limit: "100kb" }));

app.get("/", (req, res) => {
  res.json({ message: "MotoVision backend is running!" });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "MotoVision backend" });
});

async function requireFirebaseUser(req, res, next) {
  const match = (req.headers.authorization || "").match(/^Bearer\s+(.+)$/i);

  if (!match) {
    return res.status(401).json({ error: "Please sign in again." });
  }

  try {
    const token = await getAuth().verifyIdToken(match[1]);
    req.firebaseUser = { uid: token.uid, email: token.email || null };
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired sign-in token." });
  }
}

// Prices for the static products currently defined in catalog.tsx.
// Never accept a price supplied by the app as authoritative.
const staticProducts = {
  c3: { name: "Click 160 Front Fender Glossy Black", price: 2500 },
  c4: { name: "Click 160 Front Cover Right White", price: 2600 },
  a1: { name: "ADV 160 Front Center Cover", price: 450 },
  a2: { name: "ADV 160 Front Side Left Black", price: 2400 },
  a3: { name: "ADV 160 Cover Front Upper Matte Red", price: 2300 },
  a4: { name: "ADV 160 Front Fender Matte Black", price: 3550 },
};

function getStaticProduct(productId) {
  if (staticProducts[productId]) {
    return {
      ...staticProducts[productId],
      productId,
    };
  }

  // Variant IDs follow: base ID + "_" + color + "_" + side.
  const match = productId.match(
    /^(click160-front-side|click160-front-cover)_(Matte Red|Matte Black)_(Left|Right)$/
  );

  if (!match) return null;

  const [, baseId, color, side] = match;
  const isSidePanel = baseId === "click160-front-side";

  return {
    productId,
    name: `Click 160 ${isSidePanel ? "Front Side" : "Front Cover"} ${color}${isSidePanel ? ` (${side})` : ""}`,
    price: isSidePanel ? 2500 : 2800,
    color,
    side: isSidePanel ? side : null,
  };
}

async function resolveOrderItem(item) {
  const productId = item?.productId;
  const quantity = Number(item?.quantity);

  if (
    typeof productId !== "string" ||
    !Number.isSafeInteger(quantity) ||
    quantity < 1 ||
    quantity > 20
  ) {
    throw new Error("An item has an invalid product ID or quantity.");
  }

  const staticProduct = getStaticProduct(productId);

  if (staticProduct) {
    return {
      ...staticProduct,
      quantity,
      subtotal: staticProduct.price * quantity,
    };
  }

  if (!productId.startsWith("firestore_")) {
    throw new Error(`Unsupported product in cart: ${productId}`);
  }

  const firestoreId = productId.slice("firestore_".length);
  if (!firestoreId) throw new Error("Invalid catalog product ID.");

  const productSnap = await db.collection("products").doc(firestoreId).get();

  if (!productSnap.exists) {
    throw new Error("A product in your cart no longer exists.");
  }

  const data = productSnap.data();
  const price = Number(data.price);
  const stock = Number(data.stock);

  if (!Number.isFinite(price) || price <= 0) {
    throw new Error(`Invalid price for ${data.name || "a product"}.`);
  }

  if (!Number.isFinite(stock) || stock < quantity) {
    throw new Error(`${data.name || "A product"} has insufficient stock.`);
  }

  return {
    productId,
    firestoreId,
    name: String(data.name || "MotoVision product").slice(0, 200),
    price,
    quantity,
    subtotal: price * quantity,
  };
}

app.post("/api/checkout-session", requireFirebaseUser, async (req, res) => {
  const secretKey = process.env.PAYMONGO_SECRET_KEY;

  if (!secretKey || !secretKey.startsWith("sk_test_")) {
    return res.status(503).json({
      error: "PayMongo test mode is not configured on the backend.",
    });
  }

  const { items, customer } = req.body || {};

  if (!Array.isArray(items) || items.length < 1 || items.length > 30) {
    return res.status(400).json({ error: "Your cart is empty or invalid." });
  }

  const customerName =
    typeof customer?.name === "string" ? customer.name.trim() : "";
  const customerContact =
    typeof customer?.contact === "string" ? customer.contact.trim() : "";

  if (!customerName || customerName.length > 120 ||
      !customerContact || customerContact.length > 40) {
    return res.status(400).json({
      error: "Please provide a valid name and contact number.",
    });
  }

  try {
    // Resolve all prices using server-side data.
    const resolvedItems = await Promise.all(items.map(resolveOrderItem));
    const totalPesos = resolvedItems.reduce(
      (sum, item) => sum + item.subtotal,
      0
    );
    const totalCentavos = Math.round(totalPesos * 100);

    if (
      !Number.isSafeInteger(totalCentavos) ||
      totalCentavos < 100 ||
      totalCentavos > 100000000
    ) {
      return res.status(400).json({ error: "The order total is invalid." });
    }

    const orderRef = db.collection("orders").doc();
    const referenceNumber = `MV-${orderRef.id}`;

    const lineItems = resolvedItems.map((item) => ({
      name: item.name.slice(0, 200),
      amount: Math.round(item.price * 100),
      currency: "PHP",
      quantity: item.quantity,
    }));

    const payload = {
      data: {
        attributes: {
          line_items: lineItems,
          payment_method_types: ["card", "gcash", "qrph"],
          success_url: "https://motovisionitsbackend.onrender.com/payment/success",
          cancel_url: "https://motovisionitsbackend.onrender.com/payment/cancel",
          reference_number: referenceNumber,
          send_email_receipt: true,
          metadata: {
            order_id: orderRef.id,
            firebase_uid: req.firebaseUser.uid,
          },
        },
      },
    };

    const paymongoResponse = await fetch(
      "https://api.paymongo.com/v2/checkout_sessions",
      {
        method: "POST",
        headers: {
          Authorization:
            "Basic " + Buffer.from(`${secretKey}:`).toString("base64"),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const paymongoData = await paymongoResponse.json();

    if (!paymongoResponse.ok) {
      console.error(
        "PayMongo checkout creation failed:",
        JSON.stringify(paymongoData.errors || [])
      );
      return res.status(502).json({
        error: "PayMongo couldn't create checkout. Please try again.",
      });
    }

    const session = paymongoData?.data;
    const checkoutUrl = session?.attributes?.checkout_url;

    if (
      !session?.id ||
      typeof checkoutUrl !== "string" ||
      !checkoutUrl.startsWith("https://")
    ) {
      console.error("PayMongo returned an unexpected checkout response.");
      return res.status(502).json({
        error: "PayMongo returned an invalid checkout response.",
      });
    }

    await orderRef.set({
      uid: req.firebaseUser.uid,
      customer: {
        name: customerName,
        contact: customerContact,
        email: req.firebaseUser.email,
      },
      items: resolvedItems,
      total: totalPesos,
      currency: "PHP",
      status: "pending_payment",
      paymentProvider: "paymongo",
      checkoutSessionId: session.id,
      referenceNumber,
      createdAt: FieldValue.serverTimestamp(),
    });

    return res.json({
      orderId: orderRef.id,
      referenceNumber,
      checkoutUrl,
      total: totalPesos,
      currency: "PHP",
    });
  } catch (error) {
    console.error("Checkout error:", error.message);
    return res.status(400).json({
      error: error.message || "Couldn't prepare checkout.",
    });
  }
});

// Redirect destinations only; visiting these does NOT prove payment succeeded.
app.get("/payment/success", (req, res) => {
  res.status(200).send(
    "<h2>MotoVision</h2><p>You've returned from checkout. Payment confirmation is processed separately; you may return to the app.</p>"
  );
});

app.get("/payment/cancel", (req, res) => {
  res.status(200).send(
    "<h2>MotoVision</h2><p>Checkout was cancelled or left incomplete. You can return to the app and try again.</p>"
  );
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`MotoVision backend running on port ${PORT}`);
});
