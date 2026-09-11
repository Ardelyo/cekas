/**
 * CEKAS (Catatan Keuangan Kelas)
 * Core Telegram Bot Update Dispatcher & Business Logic
 * Features:
 * - Budget Allocations (Operasional, Sosial, Event, Cadangan)
 * - Self-Registration (/daftar) & Bendahara PIN Claim (/klaimbendahara)
 * - Solo Direct Notifications (Personal DMs to all registered students)
 * - Real-Time Balance & History
 */

const {
  formatRupiah,
  formatWIB,
  parseTransactionArgs,
  getCategoryMeta,
  normalizeCategory,
} = require("./formatters");
const {
  getClassInfo,
  getMemberByTelegramId,
  checkBendaharaRole,
  registerMember,
  claimBendaharaRole,
  toggleMemberNotification,
  getNotificationRecipients,
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

  const message = update.message || update.edited_message;
  if (!message || !message.text) {
    return null; // Ignore non-text messages
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
    response += `\n⚠️ <i>Anda belum menghubungkan akun ini dengan data kelas.</i>\n`;
    response += `Ketik <code>/daftar [NIS] [Nama Lengkap]</code> untuk mendaftar.\n`;
  }

  response += `\n📌 <b>Menu Siswa & Anggota Kelas:</b>\n`;
  response += `• <code>/saldo</code> - Cek total saldo kas terkini.\n`;
  response += `• <code>/alokasi</code> - Rincian saldo per pos (Operasional, Sosial, Event, Cadangan).\n`;
  response += `• <code>/riwayat</code> - Lihat 10 mutasi transaksi kas terakhir.\n`;
  response += `• <code>/profil</code> - Cek data akun & status notifikasi Anda.\n`;
  response += `• <code>/notif on|off</code> - Hidupkan/matikan notifikasi transaksi personal.\n`;
  response += `• <code>/daftar [NIS] [Nama]</code> - Pendaftaran akun siswa mandiri.\n\n`;

  response += `💼 <b>Menu Khusus Bendahara:</b>\n`;
  response += `• <code>/tambah [nominal] [pos?] [keterangan]</code>\n`;
  response += `  <i>Contoh:</i> <code>/tambah 10k operasional Iuran kas Ardellio</code>\n`;
  response += `  <i>Contoh:</i> <code>/tambah 20k sosial Santunan duka cita</code>\n`;
  response += `• <code>/kurang [nominal] [pos?] [keterangan]</code>\n`;
  response += `  <i>Contoh:</i> <code>/kurang 35k operasional Beli sapu & pel</code>\n`;
  response += `• <code>/klaimbendahara [PIN]</code> - Aktivasi hak bendahara via PIN kelas.\n`;
  response += `━━━━━━━━━━━━━━━━━━━━\n`;
  response += `🔔 <i>Notifikasi personal otomatis dikirim langsung ke setiap siswa saat ada mutasi kas baru!</i>`;

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

  response += `📑 <b>Ringkasan Alokasi Pos Dana:</b>\n`;
  response += `• 🧹 Ops: <code>${formatRupiah(alokasi.operasional || 0)}</code>\n`;
  response += `• 🤝 Sosial: <code>${formatRupiah(alokasi.sosial || 0)}</code>\n`;
  response += `• 🎪 Event: <code>${formatRupiah(alokasi.event || 0)}</code>\n`;
  response += `• 🛡️ Cadangan: <code>${formatRupiah(alokasi.cadangan || 0)}</code>\n\n`;

  response += `🕒 <i>Pembaruan terakhir: ${lastUpdated}</i>\n`;
  response += `━━━━━━━━━━━━━━━━━━━━\n`;
  response += `💡 <i>Ketik <code>/alokasi</code> untuk visual detail atau <code>/riwayat</code> untuk mutasi.</i>`;

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
  response += `   <i>(Keperluan spidol, alat kebersihan, KBM)</i>\n\n`;

  response += `🤝 <b>Sosial & Peduli:</b>\n`;
  response += `   Saldo: <code>${formatRupiah(alokasi.sosial || 0)}</code> (${getPercentage(alokasi.sosial)})\n`;
  response += `   <i>(Dana menjenguk, santunan, duka cita)</i>\n\n`;

  response += `🎪 <b>Acara & Kegiatan:</b>\n`;
  response += `   Saldo: <code>${formatRupiah(alokasi.event || 0)}</code> (${getPercentage(alokasi.event)})\n`;
  response += `   <i>(Tabungan bukber, classmeeting, perpisahan)</i>\n\n`;

  response += `🛡️ <b>Dana Cadangan:</b>\n`;
  response += `   Saldo: <code>${formatRupiah(alokasi.cadangan || 0)}</code> (${getPercentage(alokasi.cadangan)})\n`;
  response += `   <i>(Dana darurat kelas)</i>\n`;
  response += `━━━━━━━━━━━━━━━━━━━━\n`;
  response += `💡 <i>Bendahara dapat mengarahkan pos saat mencatat:\n<code>/tambah 10k sosial [keterangan]</code></i>`;

  return await sendMessage(botToken, chatId, response);
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
    const icon = isIn ? "📥" : "📤";
    const sign = isIn ? "+" : "-";
    const formattedAmount = `${sign}${formatRupiah(tx.amount)}`;
    const timeStr = formatWIB(tx.timestamp);
    const desc = escapeHtml(tx.description || "Tanpa keterangan");
    const author = escapeHtml(tx.inputBy || "Bendahara");
    const catMeta = getCategoryMeta(tx.category || "operasional");

    response += `<b>${idx + 1}. ${icon} ${formattedAmount}</b> (${catMeta.icon} ${escapeHtml(catMeta.label)})\n`;
    response += `   📝 <i>${desc}</i>\n`;
    response += `   👤 Oleh: ${author}\n`;
    response += `   🕒 ${timeStr}\n\n`;
  });

  response += `━━━━━━━━━━━━━━━━━━━━\n`;
  response += `💰 <b>Total Saldo Kas Terkini:</b> <code>${formatRupiah(saldo)}</code>`;

  return await sendMessage(botToken, chatId, response);
}

/**
 * Handle /daftar [NIS] [Nama Lengkap]
 */
async function handleDaftarCommand(chatId, senderId, username, argsStr, botToken) {
  if (!argsStr) {
    const guideMsg =
      `📝 <b>Pendaftaran Siswa Mandiri</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `Gunakan format berikut:\n` +
      `<code>/daftar [NIS] [Nama Lengkap]</code>\n\n` +
      `<b>Contoh:</b>\n` +
      `<code>/daftar 23241001 Ardellio Satria Anindito</code>\n` +
      `<code>/daftar 23241015 Tarina</code>\n\n` +
      `<i>Setelah mendaftar, akun Telegram Anda akan otomatis menerima notifikasi personal saat kas kelas diperbarui.</i>`;
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

  const result = await registerMember(DEFAULT_CLASS_ID, {
    telegramId: senderId,
    nis: nis,
    nama: nama,
    username: username || "",
  });

  let successMsg = `🎉 <b>PENDAFTARAN BERHASIL!</b>\n`;
  successMsg += `━━━━━━━━━━━━━━━━━━━━\n`;
  successMsg += `Nama: <b>${escapeHtml(result.member.nama)}</b>\n`;
  successMsg += `NIS: <code>${escapeHtml(result.member.nis)}</code>\n`;
  successMsg += `Role: <b>${escapeHtml((result.member.role || "siswa").toUpperCase())}</b>\n`;
  successMsg += `ID Telegram: <code>${senderId}</code>\n`;
  successMsg += `Notifikasi Langsung: <b>🔔 AKTIF</b>\n`;
  successMsg += `━━━━━━━━━━━━━━━━━━━━\n`;
  successMsg += `✅ <i>Akun Anda telah tersimpan di sistem CEKAS Kelas ${DEFAULT_CLASS_ID}.\nAnda akan otomatis menerima notifikasi personal setiap kali kas kelas bertambah atau berkurang!</i>`;

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
    response += `Status: <b>Belum Terdaftar</b>\n`;
    response += `Nama: <i>${escapeHtml(senderName)}</i>\n`;
    response += `ID Telegram: <code>${senderId}</code>\n\n`;
    response += `👉 <i>Silakan ketik <code>/daftar [NIS] [Nama]</code> untuk mendaftarkan akun Anda.</i>`;
  } else {
    response += `Nama: <b>${escapeHtml(member.nama)}</b>\n`;
    response += `NIS: <code>${escapeHtml(member.nis || "-")}</code>\n`;
    response += `Role: <b>${escapeHtml((member.role || "siswa").toUpperCase())}</b>\n`;
    response += `ID Telegram: <code>${senderId}</code>\n`;
    response += `Notifikasi Personal: <b>${member.notifAktif !== false ? "🔔 AKTIF" : "🔕 NONAKTIF"}</b>\n`;
    response += `━━━━━━━━━━━━━━━━━━━━\n`;
    response += `💡 <i>Ketik <code>/notif off</code> untuk mematikan notifikasi personal, atau <code>/notif on</code> untuk menyalakannya kembali.</i>`;
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

    // Send direct solo message to each student in background
    for (const student of recipients) {
      sendMessage(botToken, student.telegramId, notifMsg).catch((err) => {
        // Silently skip if student hasn't started bot or blocked
        console.warn(`Could not deliver solo notification to ${student.nama} (${student.telegramId}):`, err.message);
      });
    }
  } catch (err) {
    console.error("Error broadcasting solo notifications:", err);
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
  successMsg += `${icon} <b>Nominal:</b> <code>${sign}${formatRupiah(result.amount)}</code>\n`;
  successMsg += `📁 <b>Pos Alokasi:</b> ${catMeta.icon} <b>${escapeHtml(catMeta.label)}</b>\n`;
  successMsg += `📝 <b>Keterangan:</b> ${escapeHtml(result.description)}\n`;
  successMsg += `👤 <b>Bendahara:</b> ${escapeHtml(recordedBy)}\n`;
  successMsg += `🕒 <b>Waktu:</b> ${formatWIB(result.timestamp)}\n`;
  successMsg += `━━━━━━━━━━━━━━━━━━━━\n`;
  successMsg += `💰 <b>Total Saldo Kas:</b> <code>${formatRupiah(result.newSaldo)}</code>\n`;
  successMsg += `📊 <b>Saldo Pos ${catMeta.label}:</b> <code>${formatRupiah(result.newCatSaldo)}</code>\n\n`;
  successMsg += `🔔 <i>Notifikasi personal telah otomatis dikirimkan ke seluruh siswa yang terdaftar.</i>`;

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
  handleDaftarCommand,
  handleKlaimBendaharaCommand,
  handleProfilCommand,
  handleNotifToggleCommand,
  handleTransactionCommand,
  broadcastSoloNotifications,
};
