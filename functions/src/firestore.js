/**
 * CEKAS (Catatan Keuangan Kelas)
 * Google Cloud Firestore integration & database operations
 * Supporting Multi-Pocket Allocations, Member Self-Registration & RBAC Claims
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

const DEFAULT_PIN_BENDAHARA = process.env.PIN_BENDAHARA || "192837";

/**
 * Get class document reference.
 * @param {string} classId
 * @returns {FirebaseFirestore.DocumentReference}
 */
function getClassRef(classId = "XI-F2") {
  return db.collection("classes").doc(classId);
}

/**
 * Get or initialize class metadata, balance, and category allocations.
 * @param {string} classId
 * @returns {Promise<object>}
 */
async function getClassInfo(classId = "XI-F2") {
  const classRef = getClassRef(classId);
  const doc = await classRef.get();

  if (!doc.exists) {
    const initialData = {
      nama: `Kelas ${classId} SMA Kartika XIX-1 Bandung`,
      tahun_ajaran: "2026/2027",
      saldo: 0,
      alokasi: {
        operasional: 0,
        sosial: 0,
        event: 0,
        cadangan: 0,
      },
      pinBendahara: DEFAULT_PIN_BENDAHARA,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };
    await classRef.set(initialData);
    return { id: classId, ...initialData, saldo: 0 };
  }

  const data = doc.data() || {};
  // Ensure alokasi object exists
  if (!data.alokasi) {
    data.alokasi = {
      operasional: Number(data.saldo) || 0,
      sosial: 0,
      event: 0,
      cadangan: 0,
    };
    await classRef.set({ alokasi: data.alokasi }, { merge: true });
  }

  // Ensure pinBendahara exists
  if (!data.pinBendahara) {
    data.pinBendahara = DEFAULT_PIN_BENDAHARA;
    await classRef.set({ pinBendahara: DEFAULT_PIN_BENDAHARA }, { merge: true });
  }

  return { id: doc.id, ...data };
}

/**
 * Find member profile by Telegram ID in `classes/{classId}/members`.
 * Checks numeric, string representations, and doc IDs.
 * @param {string} classId
 * @param {number|string} telegramId
 * @returns {Promise<object|null>}
 */
async function getMemberByTelegramId(classId = "XI-F2", telegramId) {
  if (!telegramId) return null;

  const membersRef = getClassRef(classId).collection("members");
  const numId = Number(telegramId);
  const strId = String(telegramId);

  // 1. Query by numeric telegramId
  let snapshot = await membersRef.where("telegramId", "==", numId).limit(1).get();
  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  }

  // 2. Query by string telegramId
  snapshot = await membersRef.where("telegramId", "==", strId).limit(1).get();
  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  }

  // 3. Direct document ID lookup
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
 * Self-registration for students: connects Telegram ID to NIS and full name.
 * @param {string} classId
 * @param {object} param1
 * @param {number|string} param1.telegramId
 * @param {string} param1.nis
 * @param {string} param1.nama
 * @param {string} param1.username
 * @returns {Promise<{ member: object, isNew: boolean }>}
 */
async function registerMember(classId = "XI-F2", { telegramId, nis, nama, username }) {
  const membersCol = getClassRef(classId).collection("members");
  const numId = Number(telegramId);

  // Check if member already exists by telegramId
  const existing = await getMemberByTelegramId(classId, telegramId);

  const docId = existing ? existing.id : `user_${telegramId}`;
  const memberRef = membersCol.doc(docId);

  // Preserve existing role if already bendahara
  const role = existing && existing.role ? existing.role : "siswa";

  const memberData = {
    nama: nama.trim(),
    nis: String(nis).trim(),
    role: role,
    telegramId: numId,
    username: username || "",
    status: "terdaftar",
    notifAktif: existing && typeof existing.notifAktif === "boolean" ? existing.notifAktif : true,
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (!existing) {
    memberData.registeredAt = FieldValue.serverTimestamp();
  }

  await memberRef.set(memberData, { merge: true });

  return {
    member: { id: docId, ...memberData },
    isNew: !existing,
  };
}

/**
 * Claim bendahara role using master PIN.
 * @param {string} classId
 * @param {number|string} telegramId
 * @param {string} pinInput
 * @param {string} senderName
 * @returns {Promise<{ success: boolean, reason?: string, member?: object }>}
 */
async function claimBendaharaRole(classId = "XI-F2", telegramId, pinInput, senderName = "Siswa") {
  const classInfo = await getClassInfo(classId);
  const correctPin = String(classInfo.pinBendahara || DEFAULT_PIN_BENDAHARA).trim();

  if (String(pinInput).trim() !== correctPin) {
    return { success: false, reason: "PIN_SALAH" };
  }

  const membersCol = getClassRef(classId).collection("members");
  const existing = await getMemberByTelegramId(classId, telegramId);

  const docId = existing ? existing.id : `user_${telegramId}`;
  const memberRef = membersCol.doc(docId);

  const updatedData = {
    nama: existing ? existing.nama : senderName,
    role: "bendahara",
    telegramId: Number(telegramId),
    status: "terdaftar",
    notifAktif: true,
    claimedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await memberRef.set(updatedData, { merge: true });

  return {
    success: true,
    member: { id: docId, ...updatedData },
  };
}

/**
 * Toggle individual member notification preferences.
 * @param {string} classId
 * @param {number|string} telegramId
 * @param {boolean} enable
 * @returns {Promise<boolean>}
 */
async function toggleMemberNotification(classId = "XI-F2", telegramId, enable) {
  const member = await getMemberByTelegramId(classId, telegramId);
  if (!member) return false;

  const memberRef = getClassRef(classId).collection("members").doc(member.id);
  await memberRef.set(
    {
      notifAktif: enable,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
  return true;
}

/**
 * Get all registered members who should receive solo direct notifications.
 * @param {string} classId
 * @param {number|string} excludeTelegramId
 * @returns {Promise<Array<object>>}
 */
async function getNotificationRecipients(classId = "XI-F2", excludeTelegramId = null) {
  const membersCol = getClassRef(classId).collection("members");
  const snapshot = await membersCol.get();

  const recipients = [];
  const excludeNum = excludeTelegramId ? Number(excludeTelegramId) : null;

  snapshot.forEach((doc) => {
    const data = doc.data();
    if (data && data.telegramId) {
      const tId = Number(data.telegramId);
      // Only include if not opt-out (default true) and not sender
      if (data.notifAktif !== false && (!excludeNum || tId !== excludeNum)) {
        recipients.push({
          id: doc.id,
          nama: data.nama || "Siswa",
          telegramId: tId,
          role: data.role || "siswa",
        });
      }
    }
  });

  return recipients;
}

/**
 * Atomically record a transaction and update both total balance and category allocation.
 * @param {string} classId
 * @param {object} param1
 * @param {'in'|'out'} param1.type
 * @param {number} param1.amount
 * @param {string} param1.category - 'operasional' | 'sosial' | 'event' | 'cadangan'
 * @param {string} param1.description
 * @param {string} param1.inputBy
 * @param {number|string} param1.telegramId
 * @returns {Promise<object>}
 */
async function recordTransaction(
  classId = "XI-F2",
  { type, amount, category = "operasional", description, inputBy, telegramId }
) {
  if (type !== "in" && type !== "out") {
    throw new Error("Invalid transaction type. Must be 'in' or 'out'.");
  }
  if (!amount || amount <= 0) {
    throw new Error("Nominal transaksi harus lebih besar dari 0.");
  }
  if (!description || !description.trim()) {
    throw new Error("Keterangan transaksi tidak boleh kosong.");
  }

  const validCategory = ["operasional", "sosial", "event", "cadangan"].includes(category)
    ? category
    : "operasional";

  const classRef = getClassRef(classId);
  const transactionsCol = classRef.collection("transactions");
  const newTxRef = transactionsCol.doc();

  const result = await db.runTransaction(async (transaction) => {
    const classDoc = await transaction.get(classRef);
    let currentSaldo = 0;
    let alokasi = {
      operasional: 0,
      sosial: 0,
      event: 0,
      cadangan: 0,
    };

    if (!classDoc.exists) {
      currentSaldo = 0;
    } else {
      const data = classDoc.data() || {};
      currentSaldo = Number(data.saldo) || 0;
      if (data.alokasi) {
        alokasi = {
          operasional: Number(data.alokasi.operasional) || 0,
          sosial: Number(data.alokasi.sosial) || 0,
          event: Number(data.alokasi.event) || 0,
          cadangan: Number(data.alokasi.cadangan) || 0,
        };
      } else {
        alokasi.operasional = currentSaldo;
      }
    }

    const diff = type === "in" ? amount : -amount;
    const newSaldo = currentSaldo + diff;

    const currentCatSaldo = alokasi[validCategory] || 0;
    const newCatSaldo = currentCatSaldo + diff;
    alokasi[validCategory] = newCatSaldo;

    // 1. Update running balance and category allocation on parent class doc
    transaction.set(
      classRef,
      {
        saldo: newSaldo,
        alokasi: alokasi,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // 2. Insert transaction document
    const txData = {
      type: type, // 'in' or 'out'
      amount: amount,
      category: validCategory,
      description: description.trim(),
      inputBy: inputBy || "Anonim",
      telegramId: telegramId ? Number(telegramId) : null,
      inputMethod: "telegram",
      snapshotSaldoTotal: newSaldo,
      snapshotSaldoCategory: newCatSaldo,
      timestamp: FieldValue.serverTimestamp(),
    };

    transaction.set(newTxRef, txData);

    return {
      transactionId: newTxRef.id,
      previousSaldo: currentSaldo,
      newSaldo: newSaldo,
      previousCatSaldo: currentCatSaldo,
      newCatSaldo: newCatSaldo,
      amount: amount,
      type: type,
      category: validCategory,
      description: description.trim(),
      inputBy: inputBy,
      timestamp: new Date(),
      alokasi: alokasi,
    };
  });

  return result;
}

/**
 * Fetch the latest N transactions sorted by timestamp descending.
 * @param {string} classId
 * @param {number} limitCount
 * @param {string|null} filterCategory
 * @returns {Promise<Array<object>>}
 */
async function getRecentTransactions(classId = "XI-F2", limitCount = 10, filterCategory = null) {
  let query = getClassRef(classId).collection("transactions");

  if (filterCategory) {
    query = query.where("category", "==", filterCategory);
  }

  const snapshot = await query
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
  DEFAULT_PIN_BENDAHARA,
  getClassRef,
  getClassInfo,
  getMemberByTelegramId,
  checkBendaharaRole,
  registerMember,
  claimBendaharaRole,
  toggleMemberNotification,
  getNotificationRecipients,
  recordTransaction,
  getRecentTransactions,
};
