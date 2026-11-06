
const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
require("dotenv").config();

const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const {
  getFirestore,
  FieldValue,
} = require("firebase-admin/firestore");

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
const firebaseAuth = getAuth();

app.use(cors());

// Keep the raw webhook body available for signature verification.
app.post(
  "/webhooks/paymongo",
  express.raw({ type: "application/json", limit: "1mb" }),
  async (req, res) => {
    const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("Missing PAYMONGO_WEBHOOK_SECRET.");
      return res.status(503).send("Webhook is not configured.");
    }

    const signatureHeader = req.headers["paymongo-signature"];

    if (typeof signatureHeader !== "string" || !Buffer.isBuffer(req.body)) {
      return res.status(400).send("Invalid webhook request.");
    }

    try {
      const signatureParts = Object.fromEntries(
        signatureHeader.split(",").map((part) => {
          const separator = part.indexOf("=");

          return separator === -1
            ? [part, ""]
            : [part.slice(0, separator), part.slice(separator + 1)];
        })
      );

      const timestamp = signatureParts.t;

      const receivedSignature =
        process.env.NODE_ENV === "production"
          ? signatureParts.li
          : signatureParts.te;

      if (!timestamp || !receivedSignature) {
        return res.status(400).send("Missing webhook signature.");
      }

      // PayMongo signs the timestamp followed by the raw request body.
      const signedPayload = Buffer.concat([
        Buffer.from(`${timestamp}.`),
        req.body,
      ]);

      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(signedPayload)
        .digest("hex");

      const receivedBuffer = Buffer.from(receivedSignature, "hex");
      const expectedBuffer = Buffer.from(expectedSignature, "hex");

      if (
        receivedBuffer.length !== expectedBuffer.length ||
        !crypto.timingSafeEqual(receivedBuffer, expectedBuffer)
      ) {
        return res.status(401).send("Invalid webhook signature.");
      }

      const payload = JSON.parse(req.body.toString("utf8"));

      const eventContainer = payload.data || {};

      const eventType =
        eventContainer.type ||
        eventContainer.attributes?.type ||
        payload.type;

      if (eventType !== "checkout_session.payment.paid") {
        return res.status(200).json({
          received: true,
          ignored: true,
        });
      }

      const session =
        eventContainer.data ||
        eventContainer.attributes?.data ||
        payload.data?.data;

      const sessionId = session?.id;
      const attributes = session?.attributes || {};
      const referenceNumber = attributes.reference_number;
      const metadata = attributes.metadata || {};
      const orderId = metadata.order_id;

      if (!sessionId || !referenceNumber) {
        console.error("Paid webhook is missing session/reference details.");
        return res.status(400).send("Missing checkout session details.");
      }

      // Locate the order by its server-created order ID, session ID,
      // or reference number. Never trust a client-supplied payment status.
      let orderRef = null;

      if (typeof orderId === "string" && orderId) {
        const candidate = db.collection("orders").doc(orderId);
        const snapshot = await candidate.get();

        if (snapshot.exists) {
          orderRef = candidate;
        }
      }

      if (!orderRef) {
        const sessionQuery = await db
          .collection("orders")
          .where("checkoutSessionId", "==", sessionId)
          .limit(1)
          .get();

        if (!sessionQuery.empty) {
          orderRef = sessionQuery.docs[0].ref;
        }
      }

      if (!orderRef) {
        const referenceQuery = await db
          .collection("orders")
          .where("referenceNumber", "==", referenceNumber)
          .limit(1)
          .get();

        if (!referenceQuery.empty) {
          orderRef = referenceQuery.docs[0].ref;
        }
      }

      if (!orderRef) {
        console.error("No order found for paid checkout session:", sessionId);
        return res.status(500).send("Order not found.");
      }

      await db.runTransaction(async (transaction) => {
        const orderSnapshot = await transaction.get(orderRef);

        if (!orderSnapshot.exists) {
          throw new Error("Order no longer exists.");
        }

        const order = orderSnapshot.data();

        if (order.checkoutSessionId !== sessionId) {
          throw new Error("Checkout session does not match the order.");
        }

        if (order.referenceNumber !== referenceNumber) {
          throw new Error("Reference number does not match the order.");
        }

        if (order.status === "paid") {
          return;
        }

        if (order.status !== "pending_payment") {
          throw new Error("Order is not awaiting payment.");
        }

        transaction.update(orderRef, {
          status: "paid",
          paidAt: FieldValue.serverTimestamp(),
          paymentProvider: "paymongo",
          paymongoPaymentIntentId:
            attributes.payment_intent?.id || null,
        });
      });

      return res.status(200).json({ received: true });
    } catch (error) {
      console.error("PayMongo webhook processing failed:", error.message);
      return res.status(500).send("Webhook processing failed.");
    }
  }
);

app.use(express.json({ limit: "100kb" }));

app.get("/", (req, res) => {
  res.json({ message: "MotoVision backend is running!" });
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "MotoVision backend",
  });
});

// --------------------------------------------------
// FIREBASE AUTHENTICATION MIDDLEWARE
// --------------------------------------------------

async function requireFirebaseUser(req, res, next) {
  const match = (req.headers.authorization || "").match(
    /^Bearer\s+(.+)$/i
  );

  if (!match) {
    return res.status(401).json({
      error: "Please sign in again.",
    });
  }

  try {
    const token = await firebaseAuth.verifyIdToken(match[1]);

    req.firebaseUser = {
      uid: token.uid,
      email: token.email || null,
    };

    return next();
  } catch {
    return res.status(401).json({
      error: "Invalid or expired sign-in token.",
    });
  }
}

// Only users with an admin role in Firestore can use admin endpoints.
async function requireAdmin(req, res, next) {
  try {
    const adminDoc = await db
      .collection("users")
      .doc(req.firebaseUser.uid)
      .get();

    if (!adminDoc.exists || adminDoc.data().role !== "admin") {
      return res.status(403).json({
        error: "Administrator access is required.",
      });
    }

    return next();
  } catch (error) {
    console.error("Admin verification failed:", error.message);

    return res.status(500).json({
      error: "Could not verify administrator access.",
    });
  }
}

// --------------------------------------------------
// MECHANIC MANAGEMENT
// --------------------------------------------------

// GET: List all currently authorized mechanics.
app.get(
  "/api/admin/mechanics",
  requireFirebaseUser,
  requireAdmin,
  async (req, res) => {
    try {
      const snapshot = await db
        .collection("users")
        .where("role", "==", "mechanic")
        .get();

      const mechanics = await Promise.all(
        snapshot.docs.map(async (userDoc) => {
          let authUser = null;

          try {
            authUser = await firebaseAuth.getUser(userDoc.id);
          } catch {
            // Keep the Firestore record even if Auth lookup fails.
          }

          const data = userDoc.data();

          return {
            uid: userDoc.id,
            email: authUser?.email || data.email || "",
            displayName:
              authUser?.displayName ||
              data.name ||
              data.fullName ||
              "",
          };
        })
      );

      mechanics.sort((a, b) =>
        a.email.localeCompare(b.email)
      );

      return res.status(200).json({
        mechanics,
        count: mechanics.length,
      });
    } catch (error) {
      console.error("Mechanic list error:", error.message);

      return res.status(500).json({
        error: "Could not load mechanic accounts.",
      });
    }
  }
);

// POST: Authorize an already-registered MotoVision account by email.
app.post(
  "/api/admin/mechanics/authorize",
  requireFirebaseUser,
  requireAdmin,
  async (req, res) => {
    try {
      const email =
        typeof req.body?.email === "string"
          ? req.body.email.trim().toLowerCase()
          : "";

      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!email || !emailPattern.test(email)) {
        return res.status(400).json({
          error: "Please provide a valid email address.",
        });
      }

      let targetUser;

      try {
        targetUser = await firebaseAuth.getUserByEmail(email);
      } catch (error) {
        if (error.code === "auth/user-not-found") {
          return res.status(404).json({
            error:
              "No registered MotoVision account was found with that email. Ask the mechanic to register first.",
          });
        }

        throw error;
      }

      const targetRef = db
        .collection("users")
        .doc(targetUser.uid);

      const targetSnapshot = await targetRef.get();

      if (!targetSnapshot.exists) {
        return res.status(404).json({
          error:
            "The registered account does not have a MotoVision user profile.",
        });
      }

      const currentRole = targetSnapshot.data().role;

      if (currentRole === "admin") {
        return res.status(403).json({
          error: "An administrator account cannot be assigned as a mechanic.",
        });
      }

      if (currentRole !== "customer" && currentRole !== "mechanic") {
        return res.status(400).json({
          error: "This account has an invalid or unsupported role.",
        });
      }

      if (currentRole === "mechanic") {
        return res.status(200).json({
          message: "This account is already authorized as a mechanic.",
          mechanic: {
            uid: targetUser.uid,
            email: targetUser.email || email,
            displayName: targetUser.displayName || "",
          },
        });
      }

      await targetRef.update({
        role: "mechanic",
        mechanicAuthorizedAt: FieldValue.serverTimestamp(),
        mechanicAuthorizedBy: req.firebaseUser.uid,
      });

      console.log(
        `Mechanic authorized: ${email} by admin ${req.firebaseUser.uid}`
      );

      return res.status(200).json({
        message: "Mechanic account successfully authorized.",
        mechanic: {
          uid: targetUser.uid,
          email: targetUser.email || email,
          displayName: targetUser.displayName || "",
        },
      });
    } catch (error) {
      console.error("Mechanic authorization error:", error.message);

      return res.status(500).json({
        error: "Could not authorize this mechanic account.",
      });
    }
  }
);

// DELETE: Revoke mechanic access without deleting the Firebase account.
app.delete(
  "/api/admin/mechanics/:uid",
  requireFirebaseUser,
  requireAdmin,
  async (req, res) => {
    try {
      const targetUid = req.params.uid;

      if (
        typeof targetUid !== "string" ||
        !targetUid ||
        targetUid.length > 128
      ) {
        return res.status(400).json({
          error: "Invalid mechanic account ID.",
        });
      }

      if (targetUid === req.firebaseUser.uid) {
        return res.status(400).json({
          error: "You cannot revoke your own administrator account.",
        });
      }

      const targetRef = db.collection("users").doc(targetUid);
      const targetSnapshot = await targetRef.get();

      if (!targetSnapshot.exists) {
        return res.status(404).json({
          error: "Mechanic account was not found.",
        });
      }

      const targetData = targetSnapshot.data();

      if (targetData.role === "admin") {
        return res.status(403).json({
          error: "Administrator accounts cannot be revoked here.",
        });
      }

      if (targetData.role !== "mechanic") {
        return res.status(400).json({
          error: "This account is not currently an authorized mechanic.",
        });
      }

      await targetRef.update({
        role: "customer",
        mechanicRevokedAt: FieldValue.serverTimestamp(),
        mechanicRevokedBy: req.firebaseUser.uid,
      });

      let email = targetData.email || "";

      try {
        const authUser = await firebaseAuth.getUser(targetUid);
        email = authUser.email || email;
      } catch {
        // Revocation has already succeeded.
      }

      console.log(
        `Mechanic access revoked: ${targetUid} by admin ${req.firebaseUser.uid}`
      );

      return res.status(200).json({
        message: "Mechanic access successfully revoked.",
        mechanic: {
          uid: targetUid,
          email,
        },
      });
    } catch (error) {
      console.error("Mechanic revocation error:", error.message);

      return res.status(500).json({
        error: "Could not revoke mechanic access.",
      });
    }
  }
);

// --------------------------------------------------
// PRODUCT PRICING
// --------------------------------------------------

// Prices are determined by the backend, never by the app.
const staticProducts = {
  c3: {
    name: "Click 160 Front Fender Glossy Black",
    price: 2500,
  },
  c4: {
    name: "Click 160 Front Cover Right White",
    price: 2600,
  },
  a1: {
    name: "ADV 160 Front Center Cover",
    price: 450,
  },
  a2: {
    name: "ADV 160 Front Side Left Black",
    price: 2400,
  },
  a3: {
    name: "ADV 160 Cover Front Upper Matte Red",
    price: 2300,
  },
  a4: {
    name: "ADV 160 Front Fender Matte Black",
    price: 3550,
  },
};

function getStaticProduct(productId) {
  if (staticProducts[productId]) {
    return {
      ...staticProducts[productId],
      productId,
    };
  }

  // Matches IDs generated by the current catalog.
  const match = productId.match(
    /^(click160-front-side|click160-front-cover)_(Matte Red|Matte Black)(?:_(Left|Right))?$/
  );

  if (!match) return null;

  const [, baseId, color, side] = match;
  const isSidePanel = baseId === "click160-front-side";

  if (isSidePanel && !side) return null;
  if (!isSidePanel && side) return null;

  return {
    productId,
    name: `Click 160 ${
      isSidePanel ? "Front Side" : "Front Cover"
    } ${color}${isSidePanel ? ` (${side})` : ""}`,
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

  if (!firestoreId) {
    throw new Error("Invalid catalog product ID.");
  }

  const productSnap = await db
    .collection("products")
    .doc(firestoreId)
    .get();

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
    throw new Error(
      `${data.name || "A product"} has insufficient stock.`
    );
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

// --------------------------------------------------
// PAYMONGO CHECKOUT
// --------------------------------------------------

app.post(
  "/api/checkout-session",
  requireFirebaseUser,
  async (req, res) => {
    const secretKey = process.env.PAYMONGO_SECRET_KEY;

    if (!secretKey || !secretKey.startsWith("sk_test_")) {
      return res.status(503).json({
        error: "PayMongo test mode is not configured on the backend.",
      });
    }

    const { items, customer } = req.body || {};

    if (!Array.isArray(items) || items.length < 1 || items.length > 30) {
      return res.status(400).json({
        error: "Your cart is empty or invalid.",
      });
    }

    const customerName =
      typeof customer?.name === "string"
        ? customer.name.trim()
        : "";

    const customerContact =
      typeof customer?.contact === "string"
        ? customer.contact.trim()
        : "";

    if (
      !customerName ||
      customerName.length > 120 ||
      !customerContact ||
      customerContact.length > 40
    ) {
      return res.status(400).json({
        error: "Please provide a valid name and contact number.",
      });
    }

    try {
      const resolvedItems = await Promise.all(
        items.map(resolveOrderItem)
      );

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
        return res.status(400).json({
          error: "The order total is invalid.",
        });
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
            success_url:
              "https://motovisionitsbackend.onrender.com/payment/success",
            cancel_url:
              "https://motovisionitsbackend.onrender.com/payment/cancel",
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
              "Basic " +
              Buffer.from(`${secretKey}:`).toString("base64"),
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
        console.error(
          "PayMongo returned an unexpected checkout response."
        );

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
  }
);

// These pages are redirects only. They do not confirm payment.
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
