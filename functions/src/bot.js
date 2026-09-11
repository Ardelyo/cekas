/**
 * CEKAS (Catatan Keuangan Kelas)
 * Core Telegram Bot Update Dispatcher & Business Logic
 * Features (Fase 1.5 & 1.7):
 * - Multi-Pocket Allocations (Operasional, Sosial, Event, Cadangan)
 * - Whitelist-Verified Student Registration (/daftar)
 * - Master PIN Bendahara Claim (/klaimbendahara)
 * - Append-Only Transaction Correction (/koreksi)
 * - Weekly Dues & Billing Tracker (/tagihan & /bayar)
 * - Anti-Double-Submit Idempotency Window (5 seconds)
 * - Solo Direct Notifications (Personal DMs)
 */

const {
  formatRupiah,
  formatWIB,
  parseNominal,
  parseTransactionArgs,
  getCategoryMeta,
  normalizeCategory,
} = require("./formatters");
const {
  getClassInfo,
  getMemberByTelegramId,
  checkBendaharaRole,
  getWhitelistStudent,
  getAllWhitelistStudents,
  registerMemberWithWhitelist,
  claimBendaharaRole,
  toggleMemberNotification,
  getNotificationRecipients,
  recordTransaction,
  reverseTransaction,
  recordStudentWeeklyDue,
  getWeeklyDuesStatus,
  getRecentTransactions,
  NOMINAL_IURAN_MINGGUAN,
} = require("./firestore");
const { sendMessage } = require("./telegramApi");

const DEFAULT_CLASS_ID = process.env.CLASS_ID || "XI-F2";

// ----------------------------------------------------
// IDEMPOTENCY GUARD (Anti-Double-Submit)
// ----------------------------------------------------
const recentCommandsCache = new Map();
const IDEMPOTENCY_WINDOW_MS = 5000; // 5 seconds window

/**
 * Check and record command fingerprint to prevent duplicate submission.
 * @param {number|string} senderId
 * @param {string} text
 * @returns {boolean} true if duplicate, false if new
 */
function checkAndSetIdempotency(senderId, text) {
  const now = Date.now();
  const key = `${senderId}:${text.trim().toLowerCase()}`;

  // Clean old entries (> 30s)
  for (const [k, timestamp] of recentCommandsCache.entries()) {
    if (now - timestamp > 30000) {
      recentCommandsCache.delete(k);
    }
  }

  if (recentCommandsCache.has(key)) {
    const lastTime = recentCommandsCache.get(key);
    if (now - lastTime < IDEMPOTENCY_WINDOW_MS) {
      return true; // Is duplicate!
    }
  }

  recentCommandsCache.set(key, now);
  return false;
}

/**
 * Clean and escape special HTML entities.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Handle incoming Telegram Update object from Webhook or Poller.
 * @param {object} update - Telegram Update
 * @param {string} botToken - Telegram Bot Token
 * @returns {Promise<object|null>}
 */
async function handleTelegramUpdate(update, botToken) {
  if (!update || !botToken) return null;

  const message = update.message || update.edited_message;
  if (!message || !message.text) {
    return null;
  }

  const chatId = message.chat.id;
  const sender = message.from || {};
  const senderId = sender.id;
  const senderName = [sender.first_name, sender.last_name].filter(Boolean).join(" ") || "Siswa";
  const username = sender.username ? `@${sender.username}` : "";
  const displayName = username ? `${senderName} (${username})` : senderName;

  const text = message.text.trim();

  // Check if text is a command (starts with '/')
  if (!text.startsWith("/")) {
    return null;
  }

  // Idempotency check for financial write commands
  if (text.startsWith("/tambah") || text.startsWith("/kurang") || text.startsWith("/koreksi") || text.startsWith("/bayar")) {
    if (checkAndSetIdempotency(senderId, text)) {
      console.warn(`Idempotency guard caught duplicate submit from ${senderId}: "${text}"`);
      await sendMessage(
        botToken,
        chatId,
        `⚠️ <b>Perintah Ganda Terdeteksi!</b>\n\nPerintah yang sama terdeteksi dikirim berulang dalam waktu sangat singkat. Transaksi diabaikan secara aman demi mencegah saldo tercatat dobel.`
      );
      return null;
    }
  }

  // Parse command name and arguments
  const match = text.match(/^\/([a-zA-Z0-9_]+)(?:@\w+)?(?:\s+([\s\S]*))?$/);
  if (!match) return null;

  const command = match[1].toLowerCase();
  const argsStr = (match[2] || "").trim();

  try {
    switch (command) {
      case "start":
      case "bantuan":
      case "help": {
        return await handleStartCommand(chatId, senderId, senderName, botToken);
      }

      case "saldo":
      case "cek":
      case "balance": {
        return await handleSaldoCommand(chatId, botToken);
      }

      case "alokasi":
      case "pos":
      case "budget": {
        return await handleAlokasiCommand(chatId, botToken);
      }

      case "riwayat":
      case "history":
      case "mutasi": {
        return await handleRiwayatCommand(chatId, argsStr, botToken);
      }

      case "tagihan":
      case "iuran":
      case "kas": {
        return await handleTagihanCommand(chatId, argsStr, botToken);
      }

      case "bayar":
      case "lunas": {
        return await handleBayarCommand(chatId, senderId, displayName, argsStr, botToken);
      }

      case "koreksi":
      case "batal":
      case "reversal": {
        return await handleKoreksiCommand(chatId, senderId, displayName, argsStr, botToken);
      }

      case "daftar":
      case "register":
      case "signup": {
        return await handleDaftarCommand(chatId, senderId, sender.username, argsStr, botToken);
      }

      case "klaimbendahara":
      case "loginbendahara":
      case "auth": {
        return await handleKlaimBendaharaCommand(chatId, senderId, senderName, argsStr, botToken);
      }

      case "profil":
      case "profile":
      case "me": {
        return await handleProfilCommand(chatId, senderId, senderName, botToken);
      }

      case "notif":
      case "notifikasi": {
        return await handleNotifToggleCommand(chatId, senderId, argsStr, botToken);
      }

      case "tambah":
      case "masuk":
      case "in": {
        return await handleTransactionCommand(
          "in",
          chatId,
          senderId,
          displayName,
          argsStr,
          botToken
        );
      }

      case "kurang":
      case "keluar":
      case "out": {
        return await handleTransactionCommand(
          "out",
          chatId,
          senderId,
          displayName,
          argsStr,
          botToken
        );
      }

      default:
        if (message.chat.type === "private") {
          await sendMessage(
            botToken,
            chatId,
            `❓ Perintah <code>/${escapeHtml(command)}</code> tidak dikenali.\n\nKetik <code>/start</code> untuk melihat daftar menu lengkap.`
          );
        }
        return null;
    }
  } catch (error) {
    console.error(`Error processing command /${command}:`, error);
    await sendMessage(
      botToken,
      chatId,
      `⚠️ <b>Terjadi Kesalahan Sistem</b>\n<i>${escapeHtml(error.message)}</i>\n\nSilakan coba beberapa saat lagi.`
    );
    throw error;
  }
}

/**
 * Handle /start or /help command
 */
async function handleStartCommand(chatId, senderId, senderName, botToken) {
  const member = await getMemberByTelegramId(DEFAULT_CLASS_ID, senderId);
  const isRegistered = !!member;
  const roleDisplay = member ? (member.role || "Siswa").toUpperCase() : "BELUM TERDAFTAR";
  const isBendahara = member && ["bendahara", "admin", "ketua"].includes((member.role || "").toLowerCase());

  let response = `✨ <b>CEKAS (Catatan Keuangan Kelas)</b> ✨\n`;
  response += `<i>Sistem Kas & Transparansi ${DEFAULT_CLASS_ID} SMA Kartika XIX-1 Bandung</i>\n`;
  response += `━━━━━━━━━━━━━━━━━━━━\n`;
  response += `Halo, <b>${escapeHtml(member ? member.nama : senderName)}</b>! 👋\n`;
  response += `Role: <b>${escapeHtml(roleDisplay)}</b>`;
  if (isBendahara) {
    response += ` 🔑 (Akses Bendahara)`;
  }
  response += `\nID Telegram: <code>${senderId}</code>\n`;

  if (!isRegistered) {
    response += `\n⚠️ <i>Akun Anda belum terverifikasi dengan data absensi kelas.</i>\n`;
    response += `👉 Ketik: <code>/daftar [NIS] [Nama]</code> untuk mendaftar resmi.\n`;
  }

  response += `\n📌 <b>Menu Siswa & Anggota Kelas:</b>\n`;
  response += `• <code>/saldo</code> - Cek total saldo kas kelas real-time.\n`;
  response += `• <code>/alokasi</code> - Rincian saldo pos (Operasional, Sosial, Event, Cadangan).\n`;
  response += `• <code>/tagihan [minggu?]</code> - Rekap siapa sudah/belum bayar kas mingguan.\n`;
  response += `• <code>/riwayat</code> - Lihat 10 mutasi transaksi kas terakhir.\n`;
  response += `• <code>/profil</code> - Data akun & status notifikasi Anda.\n`;
  response += `• <code>/notif on|off</code> - Toggle notifikasi personal solo DM.\n`;
  response += `• <code>/daftar [NIS] [Nama]</code> - Pendaftaran terverifikasi whitelist NIS.\n\n`;

  response += `💼 <b>Menu Khusus Bendahara:</b>\n`;
  response += `• <code>/tambah [nominal] [pos?] [keterangan]</code>\n`;
  response += `  <i>Catat pemasukan kas & kirim notifikasi solo ke seluruh siswa.</i>\n`;
  response += `• <code>/kurang [nominal] [pos?] [keterangan]</code>\n`;
  response += `  <i>Catat pengeluaran kas dari pos tertentu.</i>\n`;
  response += `• <code>/bayar [NIS] [minggu_ke?]</code>\n`;
  response += `  <i>Catat pembayaran iuran siswa dan tandai status lunas di /tagihan.</i>\n`;
  response += `• <code>/koreksi [id_tx] [alasan]</code>\n`;
  response += `  <i>Koreksi transaksi salah ketik secara append-only tanpa merusak audit log.</i>\n`;
  response += `• <code>/klaimbendahara [PIN]</code>\n`;
  response += `  <i>Aktivasi akses bendahara dengan PIN resmi kelas.</i>\n`;
  response += `━━━━━━━━━━━━━━━━━━━━\n`;
  response += `🔔 <i>Notifikasi personal otomatis terkirim langsung ke HP setiap siswa saat kas berubah!</i>`;

  return await sendMessage(botToken, chatId, response);
}

/**
 * Handle /saldo command
 */
async function handleSaldoCommand(chatId, botToken) {
  const classInfo = await getClassInfo(DEFAULT_CLASS_ID);
  const saldo = Number(classInfo.saldo) || 0;
  const lastUpdated = formatWIB(classInfo.updatedAt);
  const alokasi = classInfo.alokasi || {};

  let response = `📊 <b>STATUS KAS KELAS ${escapeHtml(DEFAULT_CLASS_ID)}</b>\n`;
  response += `🏫 SMA Kartika XIX-1 Bandung\n`;
  response += `━━━━━━━━━━━━━━━━━━━━\n`;
  response += `💰 <b>Total Saldo Kas Saat Ini:</b>\n`;
  response += `👉 <code>${formatRupiah(saldo)}</code>\n\n`;

  response += `📑 <b>Ringkasan Alokasi Pos:</b>\n`;
  response += `• 🧹 Ops: <code>${formatRupiah(alokasi.operasional || 0)}</code>\n`;
  response += `• 🤝 Sosial: <code>${formatRupiah(alokasi.sosial || 0)}</code>\n`;
  response += `• 🎪 Event: <code>${formatRupiah(alokasi.event || 0)}</code>\n`;
  response += `• 🛡️ Cadangan: <code>${formatRupiah(alokasi.cadangan || 0)}</code>\n\n`;

  response += `🕒 <i>Pembaruan terakhir: ${lastUpdated}</i>\n`;
  response += `━━━━━━━━━━━━━━━━━━━━\n`;
  response += `💡 <i>Ketik <code>/alokasi</code> untuk visual detail, <code>/tagihan</code> untuk cek iuran, atau <code>/riwayat</code> untuk mutasi.</i>`;

  return await sendMessage(botToken, chatId, response);
}

/**
 * Handle /alokasi command
 */
async function handleAlokasiCommand(chatId, botToken) {
  const classInfo = await getClassInfo(DEFAULT_CLASS_ID);
  const saldoTotal = Number(classInfo.saldo) || 0;
  const alokasi = classInfo.alokasi || {
    operasional: 0,
    sosial: 0,
    event: 0,
    cadangan: 0,
  };

  const getPercentage = (amount) => {
    if (saldoTotal <= 0 || !amount || amount <= 0) return "0.0%";
    return ((amount / saldoTotal) * 100).toFixed(1) + "%";
  };

  let response = `📊 <b>ALOKASI POS DANA KAS ${escapeHtml(DEFAULT_CLASS_ID)}</b>\n`;
  response += `🏫 SMA Kartika XIX-1 Bandung\n`;
  response += `━━━━━━━━━━━━━━━━━━━━\n`;
  response += `💰 <b>Total Saldo Kas:</b> <code>${formatRupiah(saldoTotal)}</code>\n\n`;

  response += `🧹 <b>Operasional & KBM:</b>\n`;
  response += `   Saldo: <code>${formatRupiah(alokasi.operasional || 0)}</code> (${getPercentage(alokasi.operasional)})\n`;
  response += `   <i>(Keperluan spidol, kebersihan, KBM)</i>\n\n`;

  response += `🤝 <b>Sosial & Peduli:</b>\n`;
  response += `   Saldo: <code>${formatRupiah(alokasi.sosial || 0)}</code> (${getPercentage(alokasi.sosial)})\n`;
  response += `   <i>(Menjenguk sakit, santunan duka)</i>\n\n`;

  response += `🎪 <b>Acara & Kegiatan:</b>\n`;
  response += `   Saldo: <code>${formatRupiah(alokasi.event || 0)}</code> (${getPercentage(alokasi.event)})\n`;
  response += `   <i>(Tabungan classmeeting, bukber, perpisahan)</i>\n\n`;

  response += `🛡️ <b>Dana Cadangan:</b>\n`;
  response += `   Saldo: <code>${formatRupiah(alokasi.cadangan || 0)}</code> (${getPercentage(alokasi.cadangan)})\n`;
  response += `   <i>(Dana darurat kelas)</i>\n`;
  response += `━━━━━━━━━━━━━━━━━━━━\n`;
  response += `💡 <i>Bendahara dapat mengarahkan pos saat mencatat:\n<code>/tambah 10k sosial [keterangan]</code></i>`;

  return await sendMessage(botToken, chatId, response);
}

/**
 * Handle /tagihan [minggu_ke?] command
 */
async function handleTagihanCommand(chatId, argsStr, botToken) {
  // Parse optional week number: "/tagihan", "/tagihan 2", "/tagihan m3"
  let week = 1;
  if (argsStr) {
    const cleanWeek = argsStr.toLowerCase().replace(/[^0-9]/g, "");
    if (cleanWeek) {
      week = parseInt(cleanWeek, 10);
    }
  }

  const status = await getWeeklyDuesStatus(DEFAULT_CLASS_ID, week);

  let response = `📋 <b>STATUS IURAN KAS MINGGU KE-${status.week}</b>\n`;
  response += `🏫 Kelas ${DEFAULT_CLASS_ID} SMA Kartika XIX-1 Bandung\n`;
  response += `🎯 Target per Siswa: <code>${formatRupiah(status.nominalPerSiswa)}</code>\n`;
  response += `━━━━━━━━━━━━━━━━━━━━\n`;
  response += `💰 <b>Terkumpul:</b> <code>${formatRupiah(status.collectedTotal)}</code> / <code>${formatRupiah(status.targetTotal)}</code> (<b>${status.percentage}%</b>)\n\n`;

  // Paid students summary
  response += `✅ <b>SUDAH BAYAR (${status.paidStudents.length} Siswa):</b>\n`;
  if (status.paidStudents.length === 0) {
    response += `   <i>(Belum ada siswa yang tercatat membayar)</i>\n`;
  } else {
    status.paidStudents.forEach((s, idx) => {
      response += `   ${idx + 1}. ${escapeHtml(s.nama)} (<code>${s.nis}</code>)\n`;
    });
  }

  response += `\n❌ <b>BELUM BAYAR (${status.unpaidStudents.length} Siswa):</b>\n`;
  if (status.unpaidStudents.length === 0) {
    response += `   🎉 <i>Luar biasa! Seluruh siswa telah melunasi kas minggu ini!</i>\n`;
  } else {
    status.unpaidStudents.forEach((s, idx) => {
      response += `   ${idx + 1}. ${escapeHtml(s.nama)} (<code>${s.nis}</code>)\n`;
    });
  }

  response += `━━━━━━━━━━━━━━━━━━━━\n`;
  response += `💡 <i>Bendahara mencatat pembayaran via:\n<code>/bayar [NIS] ${status.week}</code></i>`;

  return await sendMessage(botToken, chatId, response);
}

/**
 * Handle /bayar [NIS] [minggu_ke?] command (Bendahara Only)
 */
async function handleBayarCommand(chatId, senderId, senderName, argsStr, botToken) {
  // 1. Check RBAC
  const { authorized, member } = await checkBendaharaRole(DEFAULT_CLASS_ID, senderId);
  if (!authorized) {
    return await sendMessage(
      botToken,
      chatId,
      `⛔ <b>Akses Ditolak!</b>\nPerintah <code>/bayar</code> hanya dapat dilakukan oleh Bendahara Kelas.`
    );
  }

  if (!argsStr) {
    const guideMsg =
      `💳 <b>Pencatatan Iuran Kas Siswa</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `Gunakan format berikut:\n` +
      `<code>/bayar [NIS] [minggu_ke?] [nominal?]</code>\n\n` +
      `<b>Contoh:</b>\n` +
      `• <code>/bayar 23241001 1</code> <i>(Catat iuran minggu 1 Ardellio Rp 10.000)</i>\n` +
      `• <code>/bayar 23241020 2 20k</code> <i>(Catat iuran minggu 2 Nabila Rp 20.000)</i>\n\n` +
      `<i>Status siswa otomatis terupdate lunas di <code>/tagihan</code>!</i>`;
    return await sendMessage(botToken, chatId, guideMsg);
  }

  const parts = argsStr.trim().split(/\s+/);
  const nis = parts[0];
  let week = 1;
  let amount = NOMINAL_IURAN_MINGGUAN;

  if (parts[1]) {
    const parsedWeek = parseInt(parts[1].replace(/[^0-9]/g, ""), 10);
    if (!isNaN(parsedWeek) && parsedWeek > 0) {
      week = parsedWeek;
    }
  }

  if (parts[2]) {
    const parsedNominal = parseNominal(parts[2]);
    if (parsedNominal && parsedNominal > 0) {
      amount = parsedNominal;
    }
  }

  const recordedBy = member && member.nama ? member.nama : senderName;

  try {
    const res = await recordStudentWeeklyDue(DEFAULT_CLASS_ID, {
      nis: nis,
      week: week,
      amount: amount,
      bendaharaName: recordedBy,
      bendaharaTelegramId: senderId,
    });

    const studentInfo = await getWhitelistStudent(DEFAULT_CLASS_ID, nis);
    const studentName = studentInfo ? studentInfo.namaResmi : nis;

    let successMsg = `✅ <b>IURAN KAS BERHASIL DICATAT!</b>\n`;
    successMsg += `━━━━━━━━━━━━━━━━━━━━\n`;
    successMsg += `👤 <b>Siswa:</b> ${escapeHtml(studentName)} (<code>${nis}</code>)\n`;
    successMsg += `🗓️ <b>Periode:</b> Minggu ke-${week}\n`;
    successMsg += `📥 <b>Nominal:</b> <code>+${formatRupiah(amount)}</code> (Pos Operasional)\n`;
    successMsg += `👤 <b>Bendahara:</b> ${escapeHtml(recordedBy)}\n`;
    successMsg += `━━━━━━━━━━━━━━━━━━━━\n`;
    successMsg += `💰 <b>Total Saldo Kas Baru:</b> <code>${formatRupiah(res.newSaldo)}</code>\n\n`;
    successMsg += `💡 <i>Cek status terkini kelas dengan <code>/tagihan ${week}</code>.</i>`;

    await sendMessage(botToken, chatId, successMsg);

    // Broadcast solo notification
    broadcastSoloNotifications(botToken, res, senderId).catch((err) => {
      console.error("Solo notification error:", err);
    });

    return res;
  } catch (err) {
    return await sendMessage(
      botToken,
      chatId,
      `⚠️ <b>Gagal Mencatat Iuran</b>\n<i>${escapeHtml(err.message)}</i>`
    );
  }
}

/**
 * Handle /koreksi [id_tx] [alasan] (Bendahara Only - Append-Only Reversal)
 */
async function handleKoreksiCommand(chatId, senderId, senderName, argsStr, botToken) {
  // 1. Check RBAC
  const { authorized, member } = await checkBendaharaRole(DEFAULT_CLASS_ID, senderId);
  if (!authorized) {
    return await sendMessage(
      botToken,
      chatId,
      `⛔ <b>Akses Ditolak!</b>\nPerintah <code>/koreksi</code> hanya dapat dilakukan oleh Bendahara Kelas.`
    );
  }

  if (!argsStr) {
    const guideMsg =
      `🔄 <b>Koreksi Transaksi Kas (Append-Only)</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `Jika Anda salah memasukkan nominal atau salah pos, gunakan perintah ini untuk membuat transaksi pembalik secara transparan tanpa merusak riwayat audit.\n\n` +
      `<b>Format:</b>\n` +
      `<code>/koreksi [id_transaksi] [alasan_koreksi]</code>\n\n` +
      `<b>Contoh:</b>\n` +
      `<code>/koreksi tx_178912 Salah input nominal, seharusnya 10k</code>\n\n` +
      `<i>ID transaksi dapat dilihat pada daftar <code>/riwayat</code>.</i>`;
    return await sendMessage(botToken, chatId, guideMsg);
  }

  const spaceIndex = argsStr.search(/\s+/);
  if (spaceIndex === -1) {
    return await sendMessage(
      botToken,
      chatId,
      `⚠️ <b>Alasan koreksi wajib disertakan!</b>\nContoh: <code>/koreksi tx_123 Salah input nominal</code>`
    );
  }

  const txId = argsStr.slice(0, spaceIndex).trim();
  const reason = argsStr.slice(spaceIndex).trim();

  const recordedBy = member && member.nama ? member.nama : senderName;

  const result = await reverseTransaction(
    DEFAULT_CLASS_ID,
    txId,
    reason,
    recordedBy,
    senderId
  );

  if (!result.success) {
    let errorDetail = "";
    if (result.reason === "TX_NOT_FOUND") {
      errorDetail = `Transaksi dengan ID <code>${escapeHtml(txId)}</code> tidak ditemukan di Firestore. Periksa kembali ID di <code>/riwayat</code>.`;
    } else if (result.reason === "ALREADY_REVERSED") {
      errorDetail = `Transaksi ini sudah pernah dibatalkan/dikoreksi sebelumnya pada koreksi ID <code>${escapeHtml(result.existingCorrectionId)}</code>.`;
    } else {
      errorDetail = `Kesalahan: ${result.reason}`;
    }

    return await sendMessage(
      botToken,
      chatId,
      `⛔ <b>Koreksi Gagal!</b>\n\n${errorDetail}`
    );
  }

  const catMeta = getCategoryMeta(result.category);
  const sign = result.reversalType === "in" ? "+" : "-";

  let successMsg = `🔄 <b>KOREKSI TRANSAKSI BERHASIL!</b>\n`;
  successMsg += `━━━━━━━━━━━━━━━━━━━━\n`;
  successMsg += `📋 <b>ID Transaksi Asal:</b> <code>#${escapeHtml(txId)}</code>\n`;
  successMsg += `⚖️ <b>Efek Pembalik:</b> <code>${sign}${formatRupiah(result.amount)}</code> (${catMeta.icon} ${escapeHtml(catMeta.label)})\n`;
  successMsg += `📝 <b>Alasan:</b> ${escapeHtml(reason)}\n`;
  successMsg += `👤 <b>Oleh:</b> ${escapeHtml(recordedBy)} (Bendahara)\n`;
  successMsg += `━━━━━━━━━━━━━━━━━━━━\n`;
  successMsg += `💰 <b>Total Saldo Kas Sekarang:</b> <code>${formatRupiah(result.newSaldo)}</code>\n`;
  successMsg += `📊 <b>Saldo Pos ${catMeta.label}:</b> <code>${formatRupiah(result.newCatSaldo)}</code>\n\n`;
  successMsg += `🔔 <i>Transaksi pembalik telah dicatat secara append-only dan notifikasi koreksi otomatis dikirim ke seluruh siswa.</i>`;

  await sendMessage(botToken, chatId, successMsg);

  // Broadcast solo correction notification
  broadcastCorrectionNotification(botToken, result, reason, recordedBy, senderId).catch((err) => {
    console.error("Solo correction notification error:", err);
  });

  return result;
}

/**
 * Handle /riwayat command
 */
async function handleRiwayatCommand(chatId, argsStr, botToken) {
  const filterCat = normalizeCategory(argsStr);
  const [classInfo, transactions] = await Promise.all([
    getClassInfo(DEFAULT_CLASS_ID),
    getRecentTransactions(DEFAULT_CLASS_ID, 10, filterCat),
  ]);

  const saldo = Number(classInfo.saldo) || 0;
  const catTitle = filterCat ? ` [POS: ${filterCat.toUpperCase()}]` : "";

  if (!transactions || transactions.length === 0) {
    const emptyMsg =
      `📋 <b>RIWAYAT KAS KELAS ${escapeHtml(DEFAULT_CLASS_ID)}${catTitle}</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `<i>Belum ada catatan transaksi yang tersimpan.</i>\n\n` +
      `💰 Saldo total: <code>${formatRupiah(saldo)}</code>`;
    return await sendMessage(botToken, chatId, emptyMsg);
  }

  let response = `📋 <b>10 TRANSAKSI TERAKHIR KAS ${escapeHtml(DEFAULT_CLASS_ID)}${catTitle}</b>\n`;
  response += `━━━━━━━━━━━━━━━━━━━━\n`;

  transactions.forEach((tx, idx) => {
    const isIn = tx.type === "in";
    const icon = tx.isCorrection ? "🔄" : (isIn ? "📥" : "📤");
    const sign = isIn ? "+" : "-";
    const formattedAmount = `${sign}${formatRupiah(tx.amount)}`;
    const timeStr = formatWIB(tx.timestamp);
    const desc = escapeHtml(tx.description || "Tanpa keterangan");
    const author = escapeHtml(tx.inputBy || "Bendahara");
    const catMeta = getCategoryMeta(tx.category || "operasional");

    response += `<b>${idx + 1}. ${icon} ${formattedAmount}</b> (${catMeta.icon} ${escapeHtml(catMeta.label)})\n`;
    response += `   📝 <i>${desc}</i>`;
    if (tx.isReversed) {
      response += ` <s>[DIKOREKSI]</s>`;
    }
    response += `\n   👤 Oleh: ${author} | 🆔 <code>${tx.id}</code>\n`;
    response += `   🕒 ${timeStr}\n\n`;
  });

  response += `━━━━━━━━━━━━━━━━━━━━\n`;
  response += `💰 <b>Total Saldo Kas Terkini:</b> <code>${formatRupiah(saldo)}</code>`;

  return await sendMessage(botToken, chatId, response);
}

/**
 * Handle /daftar [NIS] [Nama Lengkap] (Whitelist-Verified)
 */
async function handleDaftarCommand(chatId, senderId, username, argsStr, botToken) {
  if (!argsStr) {
    const guideMsg =
      `📝 <b>Pendaftaran Siswa XI-F2 Terverifikasi</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `Gunakan format berikut:\n` +
      `<code>/daftar [NIS] [Nama Lengkap]</code>\n\n` +
      `<b>Contoh:</b>\n` +
      `<code>/daftar 23241001 Ardellio Satria Anindito</code>\n` +
      `<code>/daftar 23241015 Tarina</code>\n\n` +
      `<i>Sistem akan mencocokkan NIS Anda dengan daftar absensi resmi kelas XI-F2 SMA Kartika XIX-1 Bandung untuk mencegah akun fiktif/luar mendaftar.</i>`;
    return await sendMessage(botToken, chatId, guideMsg);
  }

  const parts = argsStr.trim().split(/\s+/);
  const nis = parts[0];
  const nama = parts.slice(1).join(" ").trim();

  if (!nis || !nama) {
    return await sendMessage(
      botToken,
      chatId,
      `⚠️ <b>NIS dan Nama Lengkap wajib diisi!</b>\nContoh: <code>/daftar 23241001 Ardellio Satria</code>`
    );
  }

  const regRes = await registerMemberWithWhitelist(DEFAULT_CLASS_ID, {
    telegramId: senderId,
    nis: nis,
    nama: nama,
    username: username || "",
  });

  if (!regRes.success) {
    if (regRes.reason === "NIS_NOT_IN_WHITELIST") {
      return await sendMessage(
        botToken,
        chatId,
        `⛔ <b>Pendaftaran Ditolak: NIS Tidak Terdaftar!</b>\n\nNIS <code>${escapeHtml(nis)}</code> tidak ditemukan dalam daftar absensi resmi kelas XI-F2 SMA Kartika XIX-1 Bandung.\n\nJika NIS Anda benar dan baru masuk kelas, silakan hubungi Ketua Kelas atau Wali Kelas untuk menambahkan NIS Anda ke sistem.`
      );
    } else if (regRes.reason === "NIS_ALREADY_CLAIMED") {
      return await sendMessage(
        botToken,
        chatId,
        `⚠️ <b>Pendaftaran Gagal: NIS Telah Ditautkan!</b>\n\nNIS <code>${escapeHtml(nis)}</code> (${escapeHtml(regRes.officialName)}) sudah terdaftar dan ditautkan ke akun Telegram lain.\n\nJika Anda mengganti nomor/akun Telegram, hubungi Bendahara atau Wali Kelas untuk mereset tautan akun.`
      );
    }
  }

  let successMsg = `🎉 <b>PENDAFTARAN RESMI BERHASIL!</b>\n`;
  successMsg += `━━━━━━━━━━━━━━━━━━━━\n`;
  successMsg += `Nama Resmi: <b>${escapeHtml(regRes.officialName)}</b>\n`;
  successMsg += `NIS: <code>${escapeHtml(regRes.member.nis)}</code>\n`;
  successMsg += `Status: <b>VERIFIKASI WHITELIST XI-F2 ✅</b>\n`;
  successMsg += `Role: <b>${escapeHtml((regRes.member.role || "siswa").toUpperCase())}</b>\n`;
  successMsg += `ID Telegram: <code>${senderId}</code>\n`;
  successMsg += `Notifikasi Langsung: <b>🔔 AKTIF</b>\n`;
  successMsg += `━━━━━━━━━━━━━━━━━━━━\n`;
  successMsg += `✅ <i>Akun Anda kini resmi terhubung dengan kas kelas.\nAnda akan menerima notifikasi personal instan setiap kali ada mutasi kas masuk/keluar!</i>`;

  return await sendMessage(botToken, chatId, successMsg);
}

/**
 * Handle /klaimbendahara [PIN]
 */
async function handleKlaimBendaharaCommand(chatId, senderId, senderName, argsStr, botToken) {
  if (!argsStr) {
    const hintMsg =
      `🔑 <b>Aktivasi Hak Bendahara Kelas</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `Masukkan PIN otorisasi kelas yang diberikan oleh Wali Kelas / Ketua Kelas:\n` +
      `<code>/klaimbendahara [PIN]</code>\n\n` +
      `<b>Contoh:</b>\n` +
      `<code>/klaimbendahara 192837</code>`;
    return await sendMessage(botToken, chatId, hintMsg);
  }

  const pinInput = argsStr.trim();
  const claimRes = await claimBendaharaRole(DEFAULT_CLASS_ID, senderId, pinInput, senderName);

  if (!claimRes.success) {
    return await sendMessage(
      botToken,
      chatId,
      `⛔ <b>PIN Otorisasi Salah!</b>\n\nKode PIN yang Anda masukkan tidak sesuai. Silakan hubungi Wali Kelas atau Ketua Kelas XI-F2 untuk mendapatkan PIN yang sah.`
    );
  }

  let successMsg = `🎉 <b>HAK BENDAHARA AKTIF!</b>\n`;
  successMsg += `━━━━━━━━━━━━━━━━━━━━\n`;
  successMsg += `Selamat, <b>${escapeHtml(claimRes.member.nama)}</b>!\n`;
  successMsg += `Akun Telegram Anda kini terdaftar sebagai <b>BENDAHARA</b> Kelas ${DEFAULT_CLASS_ID}.\n\n`;
  successMsg += `Sekarang Anda dapat menjalankan:\n`;
  successMsg += `• <code>/tambah [nominal] [pos] [ket]</code>\n`;
  successMsg += `• <code>/kurang [nominal] [pos] [ket]</code>\n`;
  successMsg += `• <code>/bayar [NIS] [minggu]</code>\n`;
  successMsg += `• <code>/koreksi [id_tx] [alasan]</code>\n`;
  successMsg += `━━━━━━━━━━━━━━━━━━━━\n`;
  successMsg += `💡 <i>Setiap transaksi yang Anda catat akan otomatis dikirimkan sebagai notifikasi personal ke seluruh siswa yang terdaftar.</i>`;

  return await sendMessage(botToken, chatId, successMsg);
}

/**
 * Handle /profil or /me
 */
async function handleProfilCommand(chatId, senderId, senderName, botToken) {
  const member = await getMemberByTelegramId(DEFAULT_CLASS_ID, senderId);

  let response = `👤 <b>PROFIL PENGGUNA CEKAS</b>\n`;
  response += `🏫 Kelas ${DEFAULT_CLASS_ID} SMA Kartika XIX-1 Bandung\n`;
  response += `━━━━━━━━━━━━━━━━━━━━\n`;

  if (!member) {
    response += `Status: <b>Belum Terverifikasi</b>\n`;
    response += `Nama: <i>${escapeHtml(senderName)}</i>\n`;
    response += `ID Telegram: <code>${senderId}</code>\n\n`;
    response += `👉 <i>Ketik <code>/daftar [NIS] [Nama]</code> untuk menghubungkan ke data absensi resmi.</i>`;
  } else {
    response += `Nama: <b>${escapeHtml(member.nama)}</b>\n`;
    response += `NIS: <code>${escapeHtml(member.nis || "-")}</code>\n`;
    response += `Role: <b>${escapeHtml((member.role || "siswa").toUpperCase())}</b>\n`;
    response += `Verifikasi Whitelist: <b>${member.verifiedWhitelist ? "✅ TERDAFTAR RESMI" : "⚠️ MANDIRI"}</b>\n`;
    response += `ID Telegram: <code>${senderId}</code>\n`;
    response += `Notifikasi Personal: <b>${member.notifAktif !== false ? "🔔 AKTIF" : "🔕 NONAKTIF"}</b>\n`;
    response += `━━━━━━━━━━━━━━━━━━━━\n`;
    response += `💡 <i>Ketik <code>/notif off</code> untuk mematikan notifikasi solo, atau <code>/notif on</code> untuk menyalakannya kembali.</i>`;
  }

  return await sendMessage(botToken, chatId, response);
}

/**
 * Handle /notif [on|off]
 */
async function handleNotifToggleCommand(chatId, senderId, argsStr, botToken) {
  const option = (argsStr || "").toLowerCase().trim();
  let enable = true;

  if (option === "off" || option === "mati" || option === "nonaktif") {
    enable = false;
  } else if (option === "on" || option === "hidup" || option === "aktif") {
    enable = true;
  } else {
    return await sendMessage(
      botToken,
      chatId,
      `ℹ️ <b>Pengaturan Notifikasi Personal</b>\n\nFormat:\n• <code>/notif on</code> (Aktifkan notifikasi)\n• <code>/notif off</code> (Nonaktifkan notifikasi)`
    );
  }

  await toggleMemberNotification(DEFAULT_CLASS_ID, senderId, enable);

  const statusText = enable ? "🔔 <b>AKTIF</b>" : "🔕 <b>NONAKTIF</b>";
  return await sendMessage(
    botToken,
    chatId,
    `✅ Status notifikasi personal Anda berhasil diubah menjadi: ${statusText}`
  );
}

/**
 * Send Solo Direct Notifications to all registered members
 */
async function broadcastSoloNotifications(botToken, result, excludeTelegramId) {
  try {
    const recipients = await getNotificationRecipients(DEFAULT_CLASS_ID, excludeTelegramId);
    if (!recipients || recipients.length === 0) return;

    const isIn = result.type === "in";
    const icon = isIn ? "📥" : "📤";
    const sign = isIn ? "+" : "-";
    const title = isIn ? "PEMASUKAN KAS BARU" : "PENGELUARAN KAS KELAS";
    const catMeta = getCategoryMeta(result.category);

    let notifMsg = `🔔 <b>PEMBERITAHUAN KAS KELAS ${DEFAULT_CLASS_ID}</b>\n`;
    notifMsg += `━━━━━━━━━━━━━━━━━━━━\n`;
    notifMsg += `${icon} <b>${title}:</b> <code>${sign}${formatRupiah(result.amount)}</code>\n`;
    notifMsg += `📁 <b>Pos:</b> ${catMeta.icon} ${escapeHtml(catMeta.label)}\n`;
    notifMsg += `📝 <b>Keterangan:</b> ${escapeHtml(result.description)}\n`;
    notifMsg += `👤 <b>Oleh:</b> ${escapeHtml(result.inputBy)} (Bendahara)\n`;
    notifMsg += `🕒 <b>Waktu:</b> ${formatWIB(result.timestamp)}\n`;
    notifMsg += `━━━━━━━━━━━━━━━━━━━━\n`;
    notifMsg += `💰 <b>Total Saldo Kas Sekarang:</b> <code>${formatRupiah(result.newSaldo)}</code>\n`;
    notifMsg += `📊 <b>Saldo Pos ${catMeta.label}:</b> <code>${formatRupiah(result.newCatSaldo)}</code>\n\n`;
    notifMsg += `<i>(Pesan otomatis transparansi kas CEKAS XI-F2 SMA Kartika XIX-1 Bandung)</i>`;

    for (const student of recipients) {
      sendMessage(botToken, student.telegramId, notifMsg).catch((err) => {
        console.warn(`Could not deliver solo notification to ${student.nama} (${student.telegramId}):`, err.message);
      });
    }
  } catch (err) {
    console.error("Error broadcasting solo notifications:", err);
  }
}

/**
 * Broadcast Correction Notification to all students
 */
async function broadcastCorrectionNotification(botToken, result, reason, author, excludeTelegramId) {
  try {
    const recipients = await getNotificationRecipients(DEFAULT_CLASS_ID, excludeTelegramId);
    if (!recipients || recipients.length === 0) return;

    const catMeta = getCategoryMeta(result.category);
    const sign = result.reversalType === "in" ? "+" : "-";

    let notifMsg = `⚠️ <b>PEMBERITAHUAN KOREKSI KAS ${DEFAULT_CLASS_ID}</b>\n`;
    notifMsg += `━━━━━━━━━━━━━━━━━━━━\n`;
    notifMsg += `🔄 Transaksi <code>#${escapeHtml(result.originalTx.id)}</code> telah dikoreksi oleh Bendahara.\n`;
    notifMsg += `⚖️ <b>Efek Saldo:</b> <code>${sign}${formatRupiah(result.amount)}</code> (${catMeta.icon} ${escapeHtml(catMeta.label)})\n`;
    notifMsg += `📝 <b>Alasan Koreksi:</b> ${escapeHtml(reason)}\n`;
    notifMsg += `👤 <b>Bendahara:</b> ${escapeHtml(author)}\n`;
    notifMsg += `━━━━━━━━━━━━━━━━━━━━\n`;
    notifMsg += `💰 <b>Total Saldo Kas Terkoreksi:</b> <code>${formatRupiah(result.newSaldo)}</code>\n`;
    notifMsg += `📊 <b>Saldo Pos ${catMeta.label}:</b> <code>${formatRupiah(result.newCatSaldo)}</code>\n\n`;
    notifMsg += `<i>(Audit log append-only transparan kas CEKAS XI-F2)</i>`;

    for (const student of recipients) {
      sendMessage(botToken, student.telegramId, notifMsg).catch((err) => {
        console.warn(`Could not deliver correction notification to ${student.nama} (${student.telegramId}):`, err.message);
      });
    }
  } catch (err) {
    console.error("Error broadcasting correction notifications:", err);
  }
}

/**
 * Handle /tambah and /kurang commands (Only Bendahara)
 */
async function handleTransactionCommand(type, chatId, senderId, senderName, argsStr, botToken) {
  const actionName = type === "in" ? "Pemasukan" : "Pengeluaran";
  const cmdName = type === "in" ? "/tambah" : "/kurang";

  // 1. RBAC: Only registered Bendahara allowed
  const { authorized, member } = await checkBendaharaRole(DEFAULT_CLASS_ID, senderId);
  if (!authorized) {
    const deniedMsg =
      `⛔ <b>Akses Ditolak!</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `Mohon maaf, <b>${escapeHtml(senderName)}</b>.\n` +
      `Perintah <code>${cmdName}</code> hanya diizinkan untuk <b>Bendahara Kelas</b>.\n\n` +
      `Jika Anda adalah bendahara yang sah, aktifkan hak akses menggunakan PIN kelas:\n` +
      `👉 <code>/klaimbendahara [PIN]</code>\n\n` +
      `🆔 ID Telegram Anda: <code>${senderId}</code>`;
    return await sendMessage(botToken, chatId, deniedMsg);
  }

  // 2. Parse arguments: nominal, category, description
  const parsed = parseTransactionArgs(argsStr);

  if (!parsed.amount || parsed.amount <= 0) {
    const helperMsg =
      `⚠️ <b>Format Input ${actionName} Tidak Lengkap</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `Gunakan format berikut:\n` +
      `<code>${cmdName} [nominal] [pos?] [keterangan]</code>\n\n` +
      `<b>Pilihan Pos:</b>\n` +
      `• <code>ops</code> / <code>operasional</code> (KBM & kebersihan)\n` +
      `• <code>sosial</code> (Santunan, jenguk sakit)\n` +
      `• <code>event</code> (Acara, bukber, classmeet)\n` +
      `• <code>cadangan</code> (Darurat)\n\n` +
      `<b>Contoh:</b>\n` +
      `• <code>${cmdName} 10k operasional Iuran kas Ardellio</code>\n` +
      `• <code>${cmdName} 20k sosial Santunan duka cita</code>\n` +
      `• <code>${cmdName} 35000 Beli sapu dan pel</code> <i>(default ke operasional)</i>`;
    return await sendMessage(botToken, chatId, helperMsg);
  }

  if (!parsed.description) {
    const errorDesc =
      `⚠️ <b>Keterangan Transaksi Wajib Diisi!</b>\n\n` +
      `Untuk menjaga transparansi kas kelas, setiap transaksi wajib menyertakan alasan/keterangan.\n\n` +
      `<i>Contoh: <code>${cmdName} ${parsed.rawNominal} ${parsed.category} Iuran mingguan siswa</code></i>`;
    return await sendMessage(botToken, chatId, errorDesc);
  }

  // 3. Record transaction atomically in Firestore
  const recordedBy = member && member.nama ? member.nama : senderName;

  const result = await recordTransaction(DEFAULT_CLASS_ID, {
    type: type,
    amount: parsed.amount,
    category: parsed.category,
    description: parsed.description,
    inputBy: recordedBy,
    telegramId: senderId,
  });

  // 4. Send receipt confirmation to the bendahara
  const icon = type === "in" ? "📥" : "📤";
  const sign = type === "in" ? "+" : "-";
  const catMeta = getCategoryMeta(result.category);

  let successMsg = `✅ <b>${actionName.toUpperCase()} BERHASIL DICATAT!</b>\n`;
  successMsg += `━━━━━━━━━━━━━━━━━━━━\n`;
  successMsg += `📋 <b>ID Transaksi:</b> <code>#${result.transactionId}</code>\n`;
  successMsg += `${icon} <b>Nominal:</b> <code>${sign}${formatRupiah(result.amount)}</code>\n`;
  successMsg += `📁 <b>Pos Alokasi:</b> ${catMeta.icon} <b>${escapeHtml(catMeta.label)}</b>\n`;
  successMsg += `📝 <b>Keterangan:</b> ${escapeHtml(result.description)}\n`;
  successMsg += `👤 <b>Bendahara:</b> ${escapeHtml(recordedBy)}\n`;
  successMsg += `🕒 <b>Waktu:</b> ${formatWIB(result.timestamp)}\n`;
  successMsg += `━━━━━━━━━━━━━━━━━━━━\n`;
  successMsg += `💰 <b>Total Saldo Kas:</b> <code>${formatRupiah(result.newSaldo)}</code>\n`;
  successMsg += `📊 <b>Saldo Pos ${catMeta.label}:</b> <code>${formatRupiah(result.newCatSaldo)}</code>\n\n`;
  successMsg += `🔔 <i>Notifikasi personal telah otomatis dikirimkan ke seluruh siswa yang terdaftar.</i>\n`;
  successMsg += `💡 <i>Jika salah catat, gunakan: <code>/koreksi ${result.transactionId} [alasan]</code></i>`;

  await sendMessage(botToken, chatId, successMsg);

  // 5. Solo Direct Broadcast to registered students
  broadcastSoloNotifications(botToken, result, senderId).catch((err) => {
    console.error("Solo notification broadcast error:", err);
  });

  return result;
}

module.exports = {
  handleTelegramUpdate,
  handleStartCommand,
  handleSaldoCommand,
  handleAlokasiCommand,
  handleRiwayatCommand,
  handleTagihanCommand,
  handleBayarCommand,
  handleKoreksiCommand,
  handleDaftarCommand,
  handleKlaimBendaharaCommand,
  handleProfilCommand,
  handleNotifToggleCommand,
  handleTransactionCommand,
  broadcastSoloNotifications,
  broadcastCorrectionNotification,
  checkAndSetIdempotency,
};
