/**
 * CEKAS (Catatan Keuangan Kelas)
 * Google Cloud Firestore integration & database operations
 */

const admin = require("firebase-admin");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

// Set default Google Application Credentials if not already set and file exists
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  const defaultGcloudCreds = "C:/Users/X1 CARBON/AppData/Roaming/gcloud/application_default_credentials.json";
  try {
    if (require("fs").existsSync(defaultGcloudCreds)) {
      process.env.GOOGLE_APPLICATION_CREDENTIALS = defaultGcloudCreds;
    }
  } catch (e) {
    // Ignore if not accessible
  }
}

// Initialize Firebase Admin if not already initialized
if (!admin.apps || admin.apps.length === 0) {
  admin.initializeApp({
    projectId: process.env.GCP_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || "gemma4good-494311",
  });
}

const db = getFirestore();

/**
 * Get class document reference.
 * @param {string} classId
 * @returns {FirebaseFirestore.DocumentReference}
 */
function getClassRef(classId = "XI-F2") {
  return db.collection("classes").doc(classId);
}

/**
 * Get or initialize class metadata and balance.
 * @param {string} classId
 * @returns {Promise<object>}
 */
async function getClassInfo(classId = "XI-F2") {
  const classRef = getClassRef(classId);
  const doc = await classRef.get();

  if (!doc.exists) {
    const initialData = {
      nama: "Kelas XI-F2 SMA Kartika XIX-1 Bandung",
      tahun_ajaran: "2026/2027",
      saldo: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };
    await classRef.set(initialData);
    return { id: classId, ...initialData, saldo: 0 };
  }

  return { id: doc.id, ...doc.data() };
}

/**
 * Find member profile by Telegram ID in `classes/{classId}/members`.
 * Checks both numeric and string representations for resilience.
 * @param {string} classId
 * @param {number|string} telegramId
 * @returns {Promise<object|null>}
 */
async function getMemberByTelegramId(classId = "XI-F2", telegramId) {
  if (!telegramId) return null;

  const membersRef = getClassRef(classId).collection("members");
  const numId = Number(telegramId);
  const strId = String(telegramId);

  // 1. Try numeric query
  let snapshot = await membersRef.where("telegramId", "==", numId).limit(1).get();
  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  }

  // 2. Try string query
  snapshot = await membersRef.where("telegramId", "==", strId).limit(1).get();
  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  }

  // 3. Fallback: check if the document ID itself is the telegramId
  const directDoc = await membersRef.doc(strId).get();
  if (directDoc.exists) {
    return { id: directDoc.id, ...directDoc.data() };
  }

  return null;
}

/**
 * Check if the user is an authorized Bendahara.
 * @param {string} classId
 * @param {number|string} telegramId
 * @returns {Promise<{ authorized: boolean, member: object|null }>}
 */
async function checkBendaharaRole(classId = "XI-F2", telegramId) {
  const member = await getMemberByTelegramId(classId, telegramId);
  if (!member) {
    return { authorized: false, member: null };
  }

  const role = (member.role || "").toLowerCase().trim();
  const isAuthorized = role === "bendahara" || role === "admin" || role === "ketua";

  return {
    authorized: isAuthorized,
    member: member,
  };
}

/**
 * Atomically record a transaction and update the running balance in Firestore.
 * @param {string} classId
 * @param {object} param1
 * @param {'in'|'out'} param1.type
 * @param {number} param1.amount
 * @param {string} param1.description
 * @param {string} param1.inputBy
 * @param {number|string} param1.telegramId
 * @returns {Promise<object>}
 */
async function recordTransaction(classId = "XI-F2", { type, amount, description, inputBy, telegramId }) {
  if (type !== "in" && type !== "out") {
    throw new Error("Invalid transaction type. Must be 'in' or 'out'.");
  }
  if (!amount || amount <= 0) {
    throw new Error("Nominal transaksi harus lebih besar dari 0.");
  }
  if (!description || !description.trim()) {
    throw new Error("Keterangan transaksi tidak boleh kosong.");
  }

  const classRef = getClassRef(classId);
  const transactionsCol = classRef.collection("transactions");
  const newTxRef = transactionsCol.doc();

  const result = await db.runTransaction(async (transaction) => {
    const classDoc = await transaction.get(classRef);
    let currentSaldo = 0;

    if (!classDoc.exists) {
      transaction.set(classRef, {
        nama: "Kelas XI-F2 SMA Kartika XIX-1 Bandung",
        tahun_ajaran: "2026/2027",
        saldo: 0,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      currentSaldo = 0;
    } else {
      currentSaldo = Number(classDoc.data().saldo) || 0;
    }

    const diff = type === "in" ? amount : -amount;
    const newSaldo = currentSaldo + diff;

    // 1. Update running balance on parent class doc
    transaction.update(classRef, {
      saldo: newSaldo,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // 2. Insert transaction document
    const txData = {
      type: type, // 'in' or 'out'
      amount: amount,
      description: description.trim(),
      inputBy: inputBy || "Anonim",
      telegramId: telegramId ? Number(telegramId) : null,
      inputMethod: "telegram",
      timestamp: FieldValue.serverTimestamp(),
    };

    transaction.set(newTxRef, txData);

    return {
      transactionId: newTxRef.id,
      previousSaldo: currentSaldo,
      newSaldo: newSaldo,
      amount: amount,
      type: type,
      description: description.trim(),
      inputBy: inputBy,
      timestamp: new Date(),
    };
  });

  return result;
}

/**
 * Fetch the latest N transactions sorted by timestamp descending.
 * @param {string} classId
 * @param {number} limitCount
 * @returns {Promise<Array<object>>}
 */
async function getRecentTransactions(classId = "XI-F2", limitCount = 10) {
  const transactionsCol = getClassRef(classId).collection("transactions");
  const snapshot = await transactionsCol
    .orderBy("timestamp", "desc")
    .limit(limitCount)
    .get();

  const results = [];
  snapshot.forEach((doc) => {
    results.push({
      id: doc.id,
      ...doc.data(),
    });
  });

  return results;
}

module.exports = {
  db,
  admin,
  getClassRef,
  getClassInfo,
  getMemberByTelegramId,
  checkBendaharaRole,
  recordTransaction,
  getRecentTransactions,
};
