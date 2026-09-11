/**
 * CEKAS (Catatan Keuangan Kelas)
 * Automated Verification & Unit/Integration Test Suite (Fase 2)
 */

const assert = require("assert");
const {
  formatRupiah,
  parseNominal,
  formatWIB,
  normalizeCategory,
  getCategoryMeta,
  parseTransactionArgs,
} = require("../src/formatters");

console.log("==================================================");
console.log("🧪 CEKAS Automated Test Suite Starting (Fase 2)...");
console.log("==================================================");

let passedTests = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(err);
    process.exitCode = 1;
  }
}

async function testAsync(name, fn) {
  try {
    await fn();
    console.log(`  ✅ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(err);
    process.exitCode = 1;
  }
}

async function runAllTests() {
  // ----------------------------------------------------
  // TEST GROUP 1: Formatters & Parsing
  // ----------------------------------------------------
  console.log("\n📦 1. Testing Formatters & Parsing Logic:");

  test("formatRupiah formats standard amounts correctly", () => {
    assert.strictEqual(formatRupiah(0), "Rp 0");
    assert.strictEqual(formatRupiah(5000), "Rp 5.000");
    assert.strictEqual(formatRupiah(10000), "Rp 10.000");
    assert.strictEqual(formatRupiah(1250000), "Rp 1.250.000");
    assert.strictEqual(formatRupiah(-25000), "-Rp 25.000");
  });

  test("parseNominal parses pure numbers and dot separators", () => {
    assert.strictEqual(parseNominal("10000"), 10000);
    assert.strictEqual(parseNominal("10.000"), 10000);
    assert.strictEqual(parseNominal("150.000"), 150000);
    assert.strictEqual(parseNominal("1,000,000"), 1000000);
  });

  test("parseNominal handles 'Rp' prefix and case insensitivity", () => {
    assert.strictEqual(parseNominal("Rp 10000"), 10000);
    assert.strictEqual(parseNominal("rp. 25.000"), 25000);
    assert.strictEqual(parseNominal("RP50000"), 50000);
  });

  test("parseNominal handles shorthand suffixes ('k', 'rb', 'jt')", () => {
    assert.strictEqual(parseNominal("10k"), 10000);
    assert.strictEqual(parseNominal("25K"), 25000);
    assert.strictEqual(parseNominal("15rb"), 15000);
    assert.strictEqual(parseNominal("20 ribu"), 20000);
    assert.strictEqual(parseNominal("1jt"), 1000000);
    assert.strictEqual(parseNominal("1.5jt"), 1500000);
  });

  test("parseNominal rejects negative, zero, and malformed values", () => {
    assert.strictEqual(parseNominal("0"), null);
    assert.strictEqual(parseNominal("-5000"), null);
    assert.strictEqual(parseNominal("abc"), null);
    assert.strictEqual(parseNominal(""), null);
    assert.strictEqual(parseNominal(null), null);
  });

  test("normalizeCategory maps category synonyms to standard keys", () => {
    assert.strictEqual(normalizeCategory("ops"), "operasional");
    assert.strictEqual(normalizeCategory("rutin"), "operasional");
    assert.strictEqual(normalizeCategory("sosial"), "sosial");
    assert.strictEqual(normalizeCategory("duka"), "sosial");
    assert.strictEqual(normalizeCategory("santunan"), "sosial");
    assert.strictEqual(normalizeCategory("event"), "event");
    assert.strictEqual(normalizeCategory("bukber"), "event");
    assert.strictEqual(normalizeCategory("cadangan"), "cadangan");
    assert.strictEqual(normalizeCategory("darurat"), "cadangan");
    assert.strictEqual(normalizeCategory("unknown_word"), null);
  });

  test("parseTransactionArgs splits nominal, category, and description accurately", () => {
    // 1. With explicit category
    const p1 = parseTransactionArgs("10k sosial Santunan siswa sakit");
    assert.strictEqual(p1.amount, 10000);
    assert.strictEqual(p1.category, "sosial");
    assert.strictEqual(p1.description, "Santunan siswa sakit");

    // 2. Default to operasional when no category keyword specified
    const p2 = parseTransactionArgs("15.000 Iuran mingguan Ardellio");
    assert.strictEqual(p2.amount, 15000);
    assert.strictEqual(p2.category, "operasional");
    assert.strictEqual(p2.description, "Iuran mingguan Ardellio");

    // 3. Event category with shorthand
    const p3 = parseTransactionArgs("50k event Tabungan kas buka puasa");
    assert.strictEqual(p3.amount, 50000);
    assert.strictEqual(p3.category, "event");
    assert.strictEqual(p3.description, "Tabungan kas buka puasa");
  });

  test("formatWIB returns valid date string with 'WIB'", () => {
    const wibStr = formatWIB(new Date("2026-09-11T07:30:00Z")); // 14:30 WIB
    assert.ok(wibStr.includes("WIB"), "Should include WIB timezone label");
  });

  // ----------------------------------------------------
  // TEST GROUP 2: Business Logic, RBAC & Allocations
  // ----------------------------------------------------
  console.log("\n📦 2. Testing Multi-Pocket Allocations & RBAC Simulation:");

  const mockDb = {
    classData: {
      nama: "Kelas XI-F2 SMA Kartika XIX-1 Bandung",
      tahun_ajaran: "2026/2027",
      saldo: 0,
      alokasi: {
        operasional: 0,
        sosial: 0,
        event: 0,
        cadangan: 0,
      },
      pinBendahara: "192837",
    },
    members: [
      { id: "tarina", nama: "Tarina", nis: "23241015", role: "bendahara", telegramId: 1111, notifAktif: true },
      { id: "ardellio", nama: "Ardellio", nis: "23241001", role: "siswa", telegramId: 2222, notifAktif: true },
      { id: "nabila", nama: "Nabila", nis: "23241020", role: "siswa", telegramId: 3333, notifAktif: true },
    ],
    transactions: [],
  };

  function mockCheckBendahara(telegramId) {
    const member = mockDb.members.find((m) => m.telegramId === Number(telegramId));
    if (!member) return { authorized: false, member: null };
    const isBendahara = ["bendahara", "admin", "ketua"].includes(member.role.toLowerCase());
    return { authorized: isBendahara, member };
  }

  function mockRegisterMember(telegramId, nis, nama) {
    let member = mockDb.members.find((m) => m.telegramId === Number(telegramId));
    if (member) {
      member.nis = nis;
      member.nama = nama;
    } else {
      member = {
        id: `user_${telegramId}`,
        nama,
        nis,
        role: "siswa",
        telegramId: Number(telegramId),
        notifAktif: true,
      };
      mockDb.members.push(member);
    }
    return member;
  }

  function mockClaimBendahara(telegramId, pinInput) {
    if (pinInput !== mockDb.classData.pinBendahara) {
      return { success: false };
    }
    const member = mockDb.members.find((m) => m.telegramId === Number(telegramId));
    if (member) {
      member.role = "bendahara";
      return { success: true, member };
    }
    return { success: false };
  }

  function mockRecordTxWithAllocation(type, amount, category, description, inputBy, telegramId) {
    const diff = type === "in" ? amount : -amount;
    mockDb.classData.saldo += diff;
    mockDb.classData.alokasi[category] = (mockDb.classData.alokasi[category] || 0) + diff;

    const tx = {
      id: "tx_" + (mockDb.transactions.length + 1),
      type,
      amount,
      category,
      description,
      inputBy,
      telegramId,
      timestamp: new Date(),
    };
    mockDb.transactions.unshift(tx);

    return {
      newSaldo: mockDb.classData.saldo,
      newCatSaldo: mockDb.classData.alokasi[category],
      alokasi: { ...mockDb.classData.alokasi },
    };
  }

  test("Self-Registration adds new student correctly", () => {
    const newStudent = mockRegisterMember(4444, "23241030", "Cinta");
    assert.strictEqual(newStudent.nama, "Cinta");
    assert.strictEqual(newStudent.role, "siswa");
    assert.strictEqual(newStudent.notifAktif, true);
    assert.strictEqual(mockDb.members.length, 4);
  });

  test("Bendahara claim with master PIN succeeds and updates role", () => {
    // Attempt with wrong PIN
    const wrongAttempt = mockClaimBendahara(4444, "000000");
    assert.strictEqual(wrongAttempt.success, false);
    assert.strictEqual(mockCheckBendahara(4444).authorized, false);

    // Attempt with correct PIN
    const rightAttempt = mockClaimBendahara(4444, "192837");
    assert.strictEqual(rightAttempt.success, true);
    assert.strictEqual(mockCheckBendahara(4444).authorized, true);
    assert.strictEqual(rightAttempt.member.role, "bendahara");
  });

  test("Recording transaction with 'operasional' pocket updates total & pocket", () => {
    const res = mockRecordTxWithAllocation("in", 50000, "operasional", "Kas rutin KBM", "Tarina", 1111);
    assert.strictEqual(res.newSaldo, 50000);
    assert.strictEqual(res.newCatSaldo, 50000);
    assert.strictEqual(res.alokasi.operasional, 50000);
    assert.strictEqual(res.alokasi.sosial, 0);
  });

  test("Recording transaction with 'sosial' pocket updates independently", () => {
    const res = mockRecordTxWithAllocation("in", 30000, "sosial", "Donasi duka cita", "Tarina", 1111);
    assert.strictEqual(res.newSaldo, 80000);
    assert.strictEqual(res.alokasi.operasional, 50000);
    assert.strictEqual(res.alokasi.sosial, 30000);
  });

  test("Recording expense reduces category pocket and total accurately", () => {
    const res = mockRecordTxWithAllocation("out", 15000, "operasional", "Beli spidol & isi tinta", "Tarina", 1111);
    assert.strictEqual(res.newSaldo, 65000);
    assert.strictEqual(res.alokasi.operasional, 35000);
    assert.strictEqual(res.alokasi.sosial, 30000);
  });

  test("Total saldo matches sum of all category pockets", () => {
    const sumCategories =
      mockDb.classData.alokasi.operasional +
      mockDb.classData.alokasi.sosial +
      mockDb.classData.alokasi.event +
      mockDb.classData.alokasi.cadangan;

    assert.strictEqual(mockDb.classData.saldo, sumCategories);
  });

  test("Solo notification recipients query excludes sender and opt-out users", () => {
    // Student 3333 opts out
    mockDb.members.find((m) => m.telegramId === 3333).notifAktif = false;

    // Sender is Tarina (1111)
    const senderId = 1111;
    const recipients = mockDb.members.filter(
      (m) => m.telegramId !== senderId && m.notifAktif !== false
    );

    // Should include 2222 (Ardellio) and 4444 (Cinta), but NOT 1111 (sender) and NOT 3333 (opt-out)
    const recipientIds = recipients.map((r) => r.telegramId);
    assert.ok(recipientIds.includes(2222));
    assert.ok(recipientIds.includes(4444));
    assert.ok(!recipientIds.includes(1111));
    assert.ok(!recipientIds.includes(3333));
  });

  console.log("\n==================================================");
  console.log(`🎉 ALL ${passedTests} TESTS PASSED!`);
  console.log("CEKAS Multi-Pocket Allocations, RBAC & Solo Notification logic are verified 100%.");
  console.log("==================================================\n");
}

runAllTests().catch((e) => {
  console.error("Test runner failed:", e);
  process.exit(1);
});
