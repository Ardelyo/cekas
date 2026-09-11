/**
 * CEKAS (Catatan Keuangan Kelas)
 * Seed initial Firestore collections, whitelist students, and member roles
 *
 * Usage:
 *   node scripts/seed_members.js [YOUR_TELEGRAM_ID] [OPTIONAL_CLASS_ID]
 *
 * Example:
 *   node scripts/seed_members.js 123456789 XI-F2
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../functions/.env") });
const admin = require("firebase-admin");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  const defaultGcloudCreds = "C:/Users/X1 CARBON/AppData/Roaming/gcloud/application_default_credentials.json";
  try {
    if (require("fs").existsSync(defaultGcloudCreds)) {
      process.env.GOOGLE_APPLICATION_CREDENTIALS = defaultGcloudCreds;
    }
  } catch (e) {}
}

if (admin.getApps().length === 0) {
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (serviceAccountPath && !serviceAccountPath.includes("application_default_credentials")) {
    const serviceAccount = require(require("path").resolve(serviceAccountPath));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else {
    admin.initializeApp({
      projectId: process.env.GCP_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || "gemma4good-494311",
    });
  }
}

const db = getFirestore();

async function seedData() {
  const cliArgs = process.argv.slice(2);
  const userTelegramId = cliArgs[0] ? Number(cliArgs[0]) : (process.env.BENDAHARA_TELEGRAM_ID ? Number(process.env.BENDAHARA_TELEGRAM_ID) : null);
  const classId = cliArgs[1] || process.env.CLASS_ID || "XI-F2";

  console.log(`\n==============================================`);
  console.log(`🚀 CEKAS Firestore Database Seeder (Fase 1.5)`);
  console.log(`Target Class: ${classId}`);
  if (userTelegramId) {
    console.log(`Registered Bendahara Telegram ID: ${userTelegramId}`);
  }
  console.log(`==============================================\n`);

  const classRef = db.collection("classes").doc(classId);

  // 1. Initialize or check class document
  const classDoc = await classRef.get();
  const initialAlokasi = {
    operasional: 0,
    sosial: 0,
    event: 0,
    cadangan: 0,
  };

  if (!classDoc.exists) {
    console.log(`Creating document for class ${classId}...`);
    await classRef.set({
      nama: `Kelas ${classId} SMA Kartika XIX-1 Bandung`,
      tahun_ajaran: "2026/2027",
      saldo: 0,
      alokasi: initialAlokasi,
      pinBendahara: "192837",
      nominalIuranMingguan: 10000,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    console.log(`✅ Class ${classId} document created with initial saldo: Rp 0`);
  } else {
    const existingData = classDoc.data() || {};
    await classRef.set(
      {
        alokasi: existingData.alokasi || initialAlokasi,
        pinBendahara: existingData.pinBendahara || "192837",
        nominalIuranMingguan: existingData.nominalIuranMingguan || 10000,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    console.log(`ℹ️ Class ${classId} document updated (Current Saldo: Rp ${existingData.saldo || 0})`);
  }

  // 2. Whitelist Students subcollection
  console.log(`\nSeeding official student roster into ${classId}/whitelist_students...`);
  const whitelistStudents = [
    { nis: "23241001", namaResmi: "Ardellio Satria Anindito", role: "siswa" },
    { nis: "23241015", namaResmi: "Tarina", role: "bendahara" },
    { nis: "23241020", namaResmi: "Nabila", role: "siswa" },
    { nis: "23241025", namaResmi: "Cinta", role: "siswa" },
    { nis: "23241005", namaResmi: "Budi Santoso", role: "siswa" },
    { nis: "23241008", namaResmi: "Dwi Cahyo", role: "siswa" },
    { nis: "23241012", namaResmi: "Farhan Maulana", role: "siswa" },
    { nis: "23241018", namaResmi: "Gita Pratiwi", role: "siswa" },
    { nis: "23241022", namaResmi: "Rian Hidayat", role: "siswa" },
    { nis: "23241028", namaResmi: "Zahra Amelia", role: "siswa" },
  ];

  const whitelistCol = classRef.collection("whitelist_students");
  for (const s of whitelistStudents) {
    await whitelistCol.doc(s.nis).set(
      {
        namaResmi: s.namaResmi,
        role: s.role,
        statusKlaim: s.nis === "23241015" && userTelegramId ? true : false,
        claimedByTelegramId: s.nis === "23241015" && userTelegramId ? userTelegramId : null,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    console.log(`  📋 [WHITELIST] ${s.nis} - ${s.namaResmi} (${s.role.toUpperCase()})`);
  }

  // 3. Members subcollection
  const membersCol = classRef.collection("members");

  const initialMembers = [
    {
      id: "tarina",
      nis: "23241015",
      nama: "Tarina",
      role: "bendahara",
      telegramId: userTelegramId || 99990001,
      keterangan: "Ketua Kelompok & Bendahara Utama",
    },
    {
      id: "ardellio",
      nis: "23241001",
      nama: "Ardellio Satria Anindito",
      role: "siswa",
      telegramId: 99990002,
      keterangan: "Anggota Kelompok 5 / Siswa XI-F2",
    },
    {
      id: "nabila",
      nis: "23241020",
      nama: "Nabila",
      role: "siswa",
      telegramId: 99990003,
      keterangan: "Anggota Kelompok 5 / Siswa XI-F2",
    },
    {
      id: "cinta",
      nis: "23241025",
      nama: "Cinta",
      role: "siswa",
      telegramId: 99990004,
      keterangan: "Anggota Kelompok 5 / Siswa XI-F2",
    },
    {
      id: "walikelas",
      nis: "GURU-XIF2",
      nama: "Wali Kelas XI-F2",
      role: "walikelas",
      telegramId: 99990005,
      keterangan: "Wali Kelas Pembimbing",
    },
  ];

  console.log(`\nSeeding members into ${classId}/members...`);
  for (const member of initialMembers) {
    await membersCol.doc(member.id).set(
      {
        nis: member.nis,
        nama: member.nama,
        role: member.role,
        telegramId: member.telegramId,
        keterangan: member.keterangan,
        verifiedWhitelist: true,
        notifAktif: true,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    console.log(`  👤 [${member.role.toUpperCase()}] ${member.nama} (NIS: ${member.nis}, Telegram ID: ${member.telegramId})`);
  }

  console.log(`\n✅ Seeding completed successfully!`);
  console.log(`Tip: Untuk menjadikan Telegram ID pribadi Anda sebagai Bendahara, jalankan:`);
  console.log(`  node scripts/seed_members.js <ID_TELEGRAM_ANDA> ${classId}\n`);
}

seedData().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
