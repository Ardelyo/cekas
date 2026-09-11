/**
 * CEKAS (Catatan Keuangan Kelas)
 * Core Telegram Bot Update Dispatcher & Business Logic
 */

const { formatRupiah, parseNominal, formatWIB } = require("./formatters");
const {
  getClassInfo,
  getMemberByTelegramId,
  checkBendaharaRole,
  recordTransaction,
  getRecentTransactions,
} = require("./firestore");
const { sendMessage } = require("./telegramApi");

const DEFAULT_CLASS_ID = process.env.CLASS_ID || "XI-F2";

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

  // Extract message (standard message or edited message)
  const message = update.message || update.edited_message;
  if (!message || !message.text) {
    return null; // Ignore non-text messages (photos, stickers, etc. for MVP)
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
    return null; // Ignore normal conversational messages
  }

  // Parse command name and arguments
  // e.g. "/tambah@cekas_bot 10000 Kas Ardellio" -> command: "/tambah", argsStr: "10000 Kas Ardellio"
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

      case "riwayat":
      case "history":
      case "mutasi": {
        return await handleRiwayatCommand(chatId, botToken);
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
        // Ignore unknown commands or private chat hint
        if (message.chat.type === "private") {
          await sendMessage(
            botToken,
            chatId,
            `❓ Perintah <code>/${escapeHtml(command)}</code> tidak dikenali.\n\nKetik <code>/start</code> untuk melihat daftar perintah yang tersedia.`
          );
        }
        return null;
    }
  } catch (error) {
    console.error(`Error processing command /${command}:`, error);
    await sendMessage(
      botToken,
      chatId,
      `⚠️ <b>Terjadi Kesalahan Sistem</b>\n<i>${escapeHtml(error.message)}</i>\n\nSilakan coba beberapa saat lagi atau hubungi bendahara.`
    );
    throw error;
  }
}

/**
 * Handle /start or /help command
 */
async function handleStartCommand(chatId, senderId, senderName, botToken) {
  // Check member profile in Firestore
  const member = await getMemberByTelegramId(DEFAULT_CLASS_ID, senderId);
  const roleDisplay = member
    ? (member.role || "Siswa").toUpperCase()
    : "SISWA / TAMU";
  const isBendahara = member && ["bendahara", "admin", "ketua"].includes((member.role || "").toLowerCase());

  let response = `✨ <b>CEKAS (Catatan Keuangan Kelas)</b> ✨\n`;
  response += `<i>Sistem Informasi Kas Digital Kelas ${DEFAULT_CLASS_ID} SMA Kartika XIX-1 Bandung</i>\n`;
  response += `━━━━━━━━━━━━━━━━━━━━\n`;
  response += `Halo, <b>${escapeHtml(senderName)}</b>! 👋\n`;
  response += `Status Anda: <b>${escapeHtml(roleDisplay)}</b>`;
  if (isBendahara) {
    response += ` 🔑 (Akses Penuh)`;
  }
  response += `\nID Telegram Anda: <code>${senderId}</code>\n\n`;

  response += `📌 <b>Perintah untuk Seluruh Siswa:</b>\n`;
  response += `• <code>/saldo</code> - Cek saldo kas kelas terkini secara real-time.\n`;
  response += `• <code>/riwayat</code> - Lihat 10 mutasi/transaksi kas terakhir.\n`;
  response += `• <code>/start</code> - Tampilkan kembali panduan ini.\n\n`;

  response += `💼 <b>Perintah Khusus Bendahara:</b>\n`;
  response += `• <code>/tambah [nominal] [keterangan]</code>\n`;
  response += `  <i>Catat pemasukan kas baru.</i>\n`;
  response += `  Contoh: <code>/tambah 10000 Iuran kas Ardellio</code>\n`;
  response += `  Contoh: <code>/tambah 25k Uang jualan bazar</code>\n\n`;
  response += `• <code>/kurang [nominal] [keterangan]</code>\n`;
  response += `  <i>Catat pengeluaran kas kelas.</i>\n`;
  response += `  Contoh: <code>/kurang 35000 Beli sapu dan alat pel</code>\n`;
  response += `  Contoh: <code>/kurang 15k Beli spidol whiteboard</code>\n`;
  response += `━━━━━━━━━━━━━━━━━━━━\n`;
  response += `💡 <i>Sistem ini terintegrasi langsung dengan database Google Cloud Firestore untuk menjamin transparansi & akurasi keuangan kelas tanpa selisih.</i>`;

  return await sendMessage(botToken, chatId, response);
}

/**
 * Handle /saldo command
 */
async function handleSaldoCommand(chatId, botToken) {
  const classInfo = await getClassInfo(DEFAULT_CLASS_ID);
  const saldo = Number(classInfo.saldo) || 0;
  const lastUpdated = formatWIB(classInfo.updatedAt);

  let response = `📊 <b>STATUS KAS KELAS ${escapeHtml(DEFAULT_CLASS_ID)}</b>\n`;
  response += `🏫 SMA Kartika XIX-1 Bandung\n`;
  response += `━━━━━━━━━━━━━━━━━━━━\n`;
  response += `💰 <b>Total Saldo Kas Saat Ini:</b>\n`;
  response += `👉 <code>${formatRupiah(saldo)}</code>\n\n`;
  response += `🕒 <i>Pembaruan terakhir: ${lastUpdated}</i>\n`;
  response += `━━━━━━━━━━━━━━━━━━━━\n`;
  response += `💡 <i>Gunakan perintah <code>/riwayat</code> untuk melihat 10 mutasi kas terakhir.</i>`;

  return await sendMessage(botToken, chatId, response);
}

/**
 * Handle /riwayat command
 */
async function handleRiwayatCommand(chatId, botToken) {
  const [classInfo, transactions] = await Promise.all([
    getClassInfo(DEFAULT_CLASS_ID),
    getRecentTransactions(DEFAULT_CLASS_ID, 10),
  ]);

  const saldo = Number(classInfo.saldo) || 0;

  if (!transactions || transactions.length === 0) {
    const emptyMsg =
      `📋 <b>RIWAYAT KAS KELAS ${escapeHtml(DEFAULT_CLASS_ID)}</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `<i>Belum ada catatan transaksi kas yang tersimpan.</i>\n\n` +
      `💰 Saldo saat ini: <code>${formatRupiah(saldo)}</code>`;
    return await sendMessage(botToken, chatId, emptyMsg);
  }

  let response = `📋 <b>10 TRANSAKSI TERAKHIR KAS ${escapeHtml(DEFAULT_CLASS_ID)}</b>\n`;
  response += `SMA Kartika XIX-1 Bandung\n`;
  response += `━━━━━━━━━━━━━━━━━━━━\n`;

  transactions.forEach((tx, idx) => {
    const isIn = tx.type === "in";
    const icon = isIn ? "📥" : "📤";
    const sign = isIn ? "+" : "-";
    const formattedAmount = `${sign}${formatRupiah(tx.amount).replace("Rp ", "Rp ")}`;
    const timeStr = formatWIB(tx.timestamp);
    const desc = escapeHtml(tx.description || "Tanpa keterangan");
    const author = escapeHtml(tx.inputBy || "Bendahara");

    response += `<b>${idx + 1}. ${icon} ${formattedAmount}</b>\n`;
    response += `   📝 <i>${desc}</i>\n`;
    response += `   👤 Oleh: ${author}\n`;
    response += `   🕒 ${timeStr}\n\n`;
  });

  response += `━━━━━━━━━━━━━━━━━━━━\n`;
  response += `💰 <b>Saldo Kas Terkini:</b> <code>${formatRupiah(saldo)}</code>`;

  return await sendMessage(botToken, chatId, response);
}

/**
 * Handle /tambah and /kurang commands (Only Bendahara)
 */
async function handleTransactionCommand(type, chatId, senderId, senderName, argsStr, botToken) {
  const actionName = type === "in" ? "Pemasukan" : "Pengeluaran";
  const cmdName = type === "in" ? "/tambah" : "/kurang";

  // 1. Role-based Access Control (RBAC): Only registered Bendahara allowed
  const { authorized, member } = await checkBendaharaRole(DEFAULT_CLASS_ID, senderId);
  if (!authorized) {
    const deniedMsg =
      `⛔ <b>Akses Ditolak!</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `Mohon maaf, <b>${escapeHtml(senderName)}</b>.\n` +
      `Perintah <code>${cmdName}</code> hanya diizinkan untuk <b>Bendahara Kelas</b> yang terdaftar di sistem CEKAS.\n\n` +
      `Siswa dapat melihat rekap kas menggunakan:\n` +
      `• <code>/saldo</code> (cek jumlah uang kas)\n` +
      `• <code>/riwayat</code> (cek mutasi uang kas)\n\n` +
      `🆔 ID Telegram Anda: <code>${senderId}</code>\n` +
      `<i>(Hubungi pengurus kelas jika Anda merupakan bendahara yang berwenang)</i>`;
    return await sendMessage(botToken, chatId, deniedMsg);
  }

  // 2. Validate input parameters
  if (!argsStr) {
    const helperMsg =
      `⚠️ <b>Format Input ${actionName} Tidak Lengkap</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `Gunakan format berikut:\n` +
      `<code>${cmdName} [nominal] [keterangan]</code>\n\n` +
      `<b>Contoh penggunaan:</b>\n` +
      `• <code>${cmdName} 10000 Iuran kas Ardellio</code>\n` +
      `• <code>${cmdName} 25k Uang bazar kelas</code>\n` +
      `• <code>${cmdName} 35.000 Beli sapu dan pel lantai</code>`;
    return await sendMessage(botToken, chatId, helperMsg);
  }

  // Split nominal and description
  // e.g. "10000 Iuran kas siswa" -> parts[0] = "10000", rest = "Iuran kas siswa"
  const spaceIndex = argsStr.search(/\s+/);
  let nominalStr = "";
  let description = "";

  if (spaceIndex === -1) {
    nominalStr = argsStr;
    description = "";
  } else {
    nominalStr = argsStr.slice(0, spaceIndex).trim();
    description = argsStr.slice(spaceIndex).trim();
  }

  const amount = parseNominal(nominalStr);

  if (!amount || amount <= 0) {
    const errorNominal =
      `⚠️ <b>Nominal Tidak Valid: "${escapeHtml(nominalStr)}"</b>\n\n` +
      `Pastikan nominal berupa angka positif.\n` +
      `<i>Contoh: 10000, 10.000, 15k, atau 50000.</i>`;
    return await sendMessage(botToken, chatId, errorNominal);
  }

  if (!description) {
    const errorDesc =
      `⚠️ <b>Keterangan Transaksi Wajib Diisi!</b>\n\n` +
      `Untuk menjaga transparansi & audit keuangan kelas, setiap transaksi wajib menyertakan alasan/keterangan.\n\n` +
      `<i>Contoh: <code>${cmdName} ${nominalStr} Iuran mingguan siswa</code></i>`;
    return await sendMessage(botToken, chatId, errorDesc);
  }

  // 3. Record transaction atomically in Firestore
  const recordedBy = member && member.nama ? member.nama : senderName;

  const result = await recordTransaction(DEFAULT_CLASS_ID, {
    type: type,
    amount: amount,
    description: description,
    inputBy: recordedBy,
    telegramId: senderId,
  });

  // 4. Send beautiful success report
  const icon = type === "in" ? "📥" : "📤";
  const sign = type === "in" ? "+" : "-";

  let successMsg = `✅ <b>${actionName.toUpperCase()} BERHASIL DICATAT!</b>\n`;
  successMsg += `━━━━━━━━━━━━━━━━━━━━\n`;
  successMsg += `${icon} <b>Nominal:</b> <code>${sign}${formatRupiah(result.amount)}</code>\n`;
  successMsg += `📝 <b>Keterangan:</b> ${escapeHtml(result.description)}\n`;
  successMsg += `👤 <b>Dicatat Oleh:</b> ${escapeHtml(recordedBy)} (Bendahara)\n`;
  successMsg += `🕒 <b>Waktu:</b> ${formatWIB(result.timestamp)}\n`;
  successMsg += `━━━━━━━━━━━━━━━━━━━━\n`;
  successMsg += `💰 <b>Saldo Kas Terkini:</b> <code>${formatRupiah(result.newSaldo)}</code>\n`;
  successMsg += `<i>(Sebelumnya: ${formatRupiah(result.previousSaldo)})</i>\n\n`;
  successMsg += `🔔 <i>Data telah tersimpan di Cloud Firestore & dapat dilihat secara transparan oleh seluruh kelas via <code>/saldo</code> & <code>/riwayat</code>.</i>`;

  return await sendMessage(botToken, chatId, successMsg);
}

module.exports = {
  handleTelegramUpdate,
  handleStartCommand,
  handleSaldoCommand,
  handleRiwayatCommand,
  handleTransactionCommand,
};
