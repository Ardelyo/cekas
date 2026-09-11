/**
 * CEKAS (Catatan Keuangan Kelas)
 * Google Cloud Firestore integration & database operations
 * Features (Fase 1.5 & 1.7):
 * - Multi-Pocket Allocations (Operasional, Sosial, Event, Cadangan)
 * - Whitelist NIS Student Verification (/daftar)
 * - Master PIN Bendahara Claim (/klaimbendahara)
 * - Append-Only Transaction Reversal / Correction (/koreksi)
 * - Weekly Dues & Payment Tracking (/tagihan, /bayar)
 * - Solo Direct Notifications (Personal DMs)
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
const NOMINAL_IURAN_MINGGUAN = 10000; // Rp 10.000 per minggu per siswa

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

  const initialAlokasi = {
    operasional: 0,
    sosial: 0,
    event: 0,
    cadangan: 0,
  };

  if (!doc.exists) {
    const initialData = {
      nama: `Kelas ${classId} SMA Kartika XIX-1 Bandung`,
      tahun_ajaran: "2026/2027",
      saldo: 0,
      alokasi: initialAlokasi,
      pinBendahara: DEFAULT_PIN_BENDAHARA,
      nominalIuranMingguan: NOMINAL_IURAN_MINGGUAN,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };
    await classRef.set(initialData);
    return { id: classId, ...initialData, saldo: 0 };
  }

  const data = doc.data() || {};
  if (!data.alokasi) {
    data.alokasi = {
      operasional: Number(data.saldo) || 0,
      sosial: 0,
      event: 0,
      cadangan: 0,
    };
    await classRef.set({ alokasi: data.alokasi }, { merge: true });
  }

  if (!data.pinBendahara) {
    data.pinBendahara = DEFAULT_PIN_BENDAHARA;
    await classRef.set({ pinBendahara: DEFAULT_PIN_BENDAHARA }, { merge: true });
  }

  return { id: doc.id, ...data };
}

// ----------------------------------------------------
// WHITELIST & VERIFIKASI SISWA
// ----------------------------------------------------

/**
 * Check if a NIS is in the official class whitelist.
 * @param {string} classId
 * @param {string} nis
 * @returns {Promise<object|null>}
 */
async function getWhitelistStudent(classId = "XI-F2", nis) {
  if (!nis) return null;
  const cleanNis = String(nis).trim();
  const docRef = getClassRef(classId).collection("whitelist_students").doc(cleanNis);
  const doc = await docRef.get();
  if (doc.exists) {
    return { nis: doc.id, ...doc.data() };
  }
  return null;
}

/**
 * Get all students from the official class whitelist.
 * @param {string} classId
 * @returns {Promise<Array<object>>}
 */
async function getAllWhitelistStudents(classId = "XI-F2") {
  const snapshot = await getClassRef(classId)
    .collection("whitelist_students")
    .orderBy("namaResmi", "asc")
    .get();

  const list = [];
  snapshot.forEach((doc) => {
    list.push({ nis: doc.id, ...doc.data() });
  });
  return list;
}

/**
 * Verified self-registration for students using NIS Whitelist.
 * @param {string} classId
 * @param {object} param1
 * @param {number|string} param1.telegramId
 * @param {string} param1.nis
 * @param {string} param1.nama
 * @param {string} param1.username
 * @returns {Promise<{ success: boolean, reason?: string, member?: object, officialName?: string }>}
 */
async function registerMemberWithWhitelist(classId = "XI-F2", { telegramId, nis, nama, username }) {
  const cleanNis = String(nis).trim();
  const numId = Number(telegramId);

  // 1. Verify against official class whitelist
  const whitelistStudent = await getWhitelistStudent(classId, cleanNis);
  if (!whitelistStudent) {
    return {
      success: false,
      reason: "NIS_NOT_IN_WHITELIST",
    };
  }

  // 2. Check if NIS is already claimed by someone else
  if (
    whitelistStudent.statusKlaim === true &&
    whitelistStudent.claimedByTelegramId &&
    whitelistStudent.claimedByTelegramId !== numId
  ) {
    return {
      success: false,
      reason: "NIS_ALREADY_CLAIMED",
      officialName: whitelistStudent.namaResmi,
    };
  }

  // 3. Register or update member in members collection
  const existing = await getMemberByTelegramId(classId, telegramId);
  const docId = existing ? existing.id : `user_${telegramId}`;
  const memberRef = getClassRef(classId).collection("members").doc(docId);

  const officialName = whitelistStudent.namaResmi || nama.trim();
  const role = existing && existing.role ? existing.role : (whitelistStudent.role || "siswa");

  const memberData = {
    nama: officialName,
    nis: cleanNis,
    role: role,
    telegramId: numId,
    username: username || "",
    status: "terdaftar",
    verifiedWhitelist: true,
    notifAktif: existing && typeof existing.notifAktif === "boolean" ? existing.notifAktif : true,
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (!existing) {
    memberData.registeredAt = FieldValue.serverTimestamp();
  }

  await memberRef.set(memberData, { merge: true });

  // 4. Update status in whitelist collection
  await getClassRef(classId)
    .collection("whitelist_students")
    .doc(cleanNis)
    .set(
      {
        statusKlaim: true,
        claimedByTelegramId: numId,
        claimedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

  return {
    success: true,
    member: { id: docId, ...memberData },
    officialName: officialName,
  };
}

/**
 * Find member profile by Telegram ID in `classes/{classId}/members`.
 * @param {string} classId
 * @param {number|string} telegramId
 * @returns {Promise<object|null>}
 */
async function getMemberByTelegramId(classId = "XI-F2", telegramId) {
  if (!telegramId) return null;

  const membersRef = getClassRef(classId).collection("members");
  const numId = Number(telegramId);
  const strId = String(telegramId);

  let snapshot = await membersRef.where("telegramId", "==", numId).limit(1).get();
  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  }

  snapshot = await membersRef.where("telegramId", "==", strId).limit(1).get();
  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  }

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

  // Record audit log for security tracking
  await getClassRef(classId).collection("audit_logs").add({
    action: "CLAIM_BENDAHARA",
    telegramId: Number(telegramId),
    nama: existing ? existing.nama : senderName,
    timestamp: FieldValue.serverTimestamp(),
  });

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

// ----------------------------------------------------
// TRANSAKSI & APPEND-ONLY KOREKSI
// ----------------------------------------------------

/**
 * Atomically record a transaction and update running balance & category allocations.
 * @param {string} classId
 * @param {object} param1
 * @param {'in'|'out'} param1.type
 * @param {number} param1.amount
 * @param {string} param1.category
 * @param {string} param1.description
 * @param {string} param1.inputBy
 * @param {number|string} param1.telegramId
 * @param {string|null} param1.studentNis
 * @param {number|null} param1.dueWeek
 * @returns {Promise<object>}
 */
async function recordTransaction(
  classId = "XI-F2",
  { type, amount, category = "operasional", description, inputBy, telegramId, studentNis = null, dueWeek = null }
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
    let alokasi = { operasional: 0, sosial: 0, event: 0, cadangan: 0 };

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
      type: type,
      amount: amount,
      category: validCategory,
      description: description.trim(),
      inputBy: inputBy || "Anonim",
      telegramId: telegramId ? Number(telegramId) : null,
      studentNis: studentNis || null,
      dueWeek: dueWeek ? Number(dueWeek) : null,
      inputMethod: "telegram",
      snapshotSaldoTotal: newSaldo,
      snapshotSaldoCategory: newCatSaldo,
      isReversed: false,
      timestamp: FieldValue.serverTimestamp(),
    };

    transaction.set(newTxRef, txData);

    // 3. If tied to weekly due, mark due record
    if (studentNis && dueWeek && type === "in") {
      const dueDocId = `m${dueWeek}_${studentNis}`;
      const dueRef = classRef.collection("dues").doc(dueDocId);
      transaction.set(
        dueRef,
        {
          nis: studentNis,
          week: Number(dueWeek),
          amount: amount,
          paid: true,
          txId: newTxRef.id,
          paidAt: FieldValue.serverTimestamp(),
          recordedBy: inputBy,
        },
        { merge: true }
      );
    }

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
 * Append-Only Reversal Correction (/koreksi)
 * Does NOT delete the original transaction; creates a contra-entry and updates balances atomically.
 * @param {string} classId
 * @param {string} txId
 * @param {string} reason
 * @param {string} bendaharaName
 * @param {number|string} bendaharaTelegramId
 * @returns {Promise<{ success: boolean, reason?: string, originalTx?: object, correctionTx?: object, newSaldo?: number, newCatSaldo?: number }>}
 */
async function reverseTransaction(classId = "XI-F2", txId, reason, bendaharaName, bendaharaTelegramId) {
  if (!txId || !txId.trim()) {
    return { success: false, reason: "TX_ID_EMPTY" };
  }
  if (!reason || !reason.trim()) {
    return { success: false, reason: "REASON_EMPTY" };
  }

  const cleanTxId = txId.trim();
  const classRef = getClassRef(classId);
  const txRef = classRef.collection("transactions").doc(cleanTxId);
  const newCorrRef = classRef.collection("transactions").doc();

  const result = await db.runTransaction(async (transaction) => {
    const txDoc = await transaction.get(txRef);
    if (!txDoc.exists) {
      return { success: false, reason: "TX_NOT_FOUND" };
    }

    const txData = txDoc.data();
    if (txData.isReversed) {
      return {
        success: false,
        reason: "ALREADY_REVERSED",
        existingCorrectionId: txData.correctionTxId,
      };
    }

    const classDoc = await transaction.get(classRef);
    const classData = classDoc.data() || {};
    let currentSaldo = Number(classData.saldo) || 0;
    let alokasi = classData.alokasi || { operasional: 0, sosial: 0, event: 0, cadangan: 0 };

    const amount = Number(txData.amount) || 0;
    const cat = txData.category || "operasional";

    // Opposite effect: if original was 'in', contra is 'out' (decrease balance)
    // if original was 'out', contra is 'in' (restore balance)
    const reversalType = txData.type === "in" ? "out" : "in";
    const diff = reversalType === "in" ? amount : -amount;

    const newTotalSaldo = currentSaldo + diff;
    const currentCatSaldo = Number(alokasi[cat]) || 0;
    const newCatSaldo = currentCatSaldo + diff;
    alokasi[cat] = newCatSaldo;

    // 1. Update class balances
    transaction.set(
      classRef,
      {
        saldo: newTotalSaldo,
        alokasi: alokasi,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // 2. Mark original transaction as reversed
    transaction.update(txRef, {
      isReversed: true,
      reversedBy: bendaharaName,
      reversalReason: reason.trim(),
      reversedAt: FieldValue.serverTimestamp(),
      correctionTxId: newCorrRef.id,
    });

    // 3. Create append-only correction document
    const corrData = {
      type: reversalType,
      amount: amount,
      category: cat,
      description: `[KOREKSI #${cleanTxId}] ${reason.trim()}`,
      isCorrection: true,
      correctedTxId: cleanTxId,
      inputBy: bendaharaName,
      telegramId: Number(bendaharaTelegramId),
      inputMethod: "telegram",
      snapshotSaldoTotal: newTotalSaldo,
      snapshotSaldoCategory: newCatSaldo,
      isReversed: false,
      timestamp: FieldValue.serverTimestamp(),
    };

    transaction.set(newCorrRef, corrData);

    // 4. If original was tied to weekly dues, unmark the due
    if (txData.studentNis && txData.dueWeek && txData.type === "in") {
      const dueDocId = `m${txData.dueWeek}_${txData.studentNis}`;
      const dueRef = classRef.collection("dues").doc(dueDocId);
      transaction.update(dueRef, {
        paid: false,
        unpaidReason: `Telah dikoreksi: ${reason.trim()}`,
        correctedAt: FieldValue.serverTimestamp(),
      });
    }

    return {
      success: true,
      originalTx: { id: cleanTxId, ...txData },
      correctionTx: { id: newCorrRef.id, ...corrData },
      newSaldo: newTotalSaldo,
      newCatSaldo: newCatSaldo,
      reversalType: reversalType,
      amount: amount,
      category: cat,
    };
  });

  return result;
}

// ----------------------------------------------------
// TAGIHAN & IURAN MINGGUAN (/tagihan & /bayar)
// ----------------------------------------------------

/**
 * Record weekly kas payment for a specific student (/bayar)
 * @param {string} classId
 * @param {object} param1
 * @param {string} param1.nis
 * @param {number} param1.week
 * @param {number} param1.amount
 * @param {string} param1.bendaharaName
 * @param {number|string} param1.bendaharaTelegramId
 * @returns {Promise<object>}
 */
async function recordStudentWeeklyDue(
  classId = "XI-F2",
  { nis, week, amount = NOMINAL_IURAN_MINGGUAN, bendaharaName, bendaharaTelegramId }
) {
  const cleanNis = String(nis).trim();
  const student = await getWhitelistStudent(classId, cleanNis);
  if (!student) {
    throw new Error(`Siswa dengan NIS "${cleanNis}" tidak ditemukan dalam whitelist kelas.`);
  }

  const desc = `Iuran Kas Minggu ke-${week} - ${student.namaResmi} (${cleanNis})`;

  return await recordTransaction(classId, {
    type: "in",
    amount: amount,
    category: "operasional",
    description: desc,
    inputBy: bendaharaName,
    telegramId: bendaharaTelegramId,
    studentNis: cleanNis,
    dueWeek: week,
  });
}

/**
 * Get weekly dues status: paid vs unpaid students
 * @param {string} classId
 * @param {number} weekNumber
 * @returns {Promise<object>}
 */
async function getWeeklyDuesStatus(classId = "XI-F2", weekNumber = 1) {
  const [allStudents, duesSnap] = await Promise.all([
    getAllWhitelistStudents(classId),
    getClassRef(classId)
      .collection("dues")
      .where("week", "==", Number(weekNumber))
      .where("paid", "==", true)
      .get(),
  ]);

  const paidMap = new Map();
  duesSnap.forEach((doc) => {
    const data = doc.data();
    paidMap.set(data.nis, data);
  });

  const paidStudents = [];
  const unpaidStudents = [];

  allStudents.forEach((student) => {
    if (paidMap.has(student.nis)) {
      paidStudents.push({
        nis: student.nis,
        nama: student.namaResmi,
        amount: paidMap.get(student.nis).amount || NOMINAL_IURAN_MINGGUAN,
        paidAt: paidMap.get(student.nis).paidAt,
      });
    } else {
      unpaidStudents.push({
        nis: student.nis,
        nama: student.namaResmi,
        statusKlaim: student.statusKlaim || false,
      });
    }
  });

  const nominalPerSiswa = NOMINAL_IURAN_MINGGUAN;
  const targetTotal = allStudents.length * nominalPerSiswa;
  const collectedTotal = paidStudents.reduce((sum, s) => sum + s.amount, 0);
  const percentage = targetTotal > 0 ? ((collectedTotal / targetTotal) * 100).toFixed(1) : "0.0";

  return {
    week: Number(weekNumber),
    totalStudents: allStudents.length,
    paidStudents,
    unpaidStudents,
    nominalPerSiswa,
    targetTotal,
    collectedTotal,
    percentage,
  };
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
  NOMINAL_IURAN_MINGGUAN,
  getClassRef,
  getClassInfo,
  getWhitelistStudent,
  getAllWhitelistStudents,
  registerMemberWithWhitelist,
  getMemberByTelegramId,
  checkBendaharaRole,
  claimBendaharaRole,
  toggleMemberNotification,
  getNotificationRecipients,
  recordTransaction,
  reverseTransaction,
  recordStudentWeeklyDue,
  getWeeklyDuesStatus,
  getRecentTransactions,
};
