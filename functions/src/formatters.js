/**
 * CEKAS (Catatan Keuangan Kelas)
 * Formatting utilities for Currency, Date/Time, and Input Parsing
 */

/**
 * Format numeric value to Indonesian Rupiah currency format.
 * Example: 15000 -> "Rp 15.000"
 * @param {number} amount
 * @returns {string}
 */
function formatRupiah(amount) {
  const num = Math.round(Number(amount) || 0);
  const formatted = Math.abs(num)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const sign = num < 0 ? "-Rp " : "Rp ";
  return `${sign}${formatted}`;
}

/**
 * Parse user input string to integer nominal.
 * Supports:
 * - "10000" -> 10000
 * - "10.000" or "10,000" -> 10000
 * - "Rp 10.000" or "rp10000" -> 10000
 * - "10k" or "10K" -> 10000
 * - "10rb" or "10 rb" -> 10000
 * - "1.5jt" or "1.5m" -> 1500000
 * @param {string} inputStr
 * @returns {number|null} returns positive integer or null if invalid
 */
function parseNominal(inputStr) {
  if (!inputStr) return null;
  let clean = inputStr.trim().toLowerCase();

  // Remove leading 'rp' or 'rp.'
  clean = clean.replace(/^rp\.?\s*/i, "");

  // Check suffix multipliers
  let multiplier = 1;
  if (/(\d+(?:[.,]\d+)?)\s*(?:k|rb|ribu)$/i.test(clean)) {
    multiplier = 1000;
    clean = clean.replace(/\s*(?:k|rb|ribu)$/i, "");
  } else if (/(\d+(?:[.,]\d+)?)\s*(?:jt|juta|m)$/i.test(clean)) {
    multiplier = 1000000;
    clean = clean.replace(/\s*(?:jt|juta|m)$/i, "");
  }

  // Handle commas as decimal if followed by multiplier, or dots as thousands separator
  if (multiplier > 1) {
    clean = clean.replace(",", ".");
    const val = parseFloat(clean);
    if (isNaN(val) || val <= 0) return null;
    return Math.round(val * multiplier);
  }

  // Standard digits with optional '.' or ',' thousands separator
  // e.g. "50.000" or "50000"
  clean = clean.replace(/[.,\s]/g, "");
  const num = parseInt(clean, 10);
  if (isNaN(num) || num <= 0) {
    return null;
  }
  return num;
}

/**
 * Map raw category word to standardized category key.
 * Standard categories: 'operasional', 'sosial', 'event', 'cadangan'
 * @param {string} rawCat
 * @returns {string|null} returns category key if matched, or null
 */
function normalizeCategory(rawCat) {
  if (!rawCat) return null;
  const c = rawCat.toLowerCase().trim();

  if (["operasional", "ops", "rutin", "kelas", "kebersihan"].includes(c)) {
    return "operasional";
  }
  if (["sosial", "duka", "santunan", "sakit", "peduli"].includes(c)) {
    return "sosial";
  }
  if (["event", "acara", "bukber", "kegiatan", "perpisahan", "wisuda"].includes(c)) {
    return "event";
  }
  if (["cadangan", "darurat", "lainnya", "sisa", "tabungan"].includes(c)) {
    return "cadangan";
  }

  return null;
}

/**
 * Get category metadata for UI display.
 * @param {string} categoryKey
 * @returns {{ key: string, label: string, icon: string }}
 */
function getCategoryMeta(categoryKey) {
  const cat = (categoryKey || "operasional").toLowerCase();
  switch (cat) {
    case "sosial":
      return { key: "sosial", label: "Sosial & Peduli", icon: "🤝" };
    case "event":
      return { key: "event", label: "Acara & Kegiatan", icon: "🎪" };
    case "cadangan":
      return { key: "cadangan", label: "Dana Cadangan", icon: "🛡️" };
    case "operasional":
    default:
      return { key: "operasional", label: "Operasional & KBM", icon: "🧹" };
  }
}

/**
 * Split transaction arguments into nominal, category, and description.
 * Formats supported:
 * 1. "10000 sosial Sumbangan duka cita" -> { amount: 10000, category: "sosial", description: "Sumbangan duka cita" }
 * 2. "10000 Iuran kas mingguan" -> { amount: 10000, category: "operasional", description: "Iuran kas mingguan" }
 * @param {string} argsStr
 * @returns {{ amount: number|null, rawNominal: string, category: string, description: string }}
 */
function parseTransactionArgs(argsStr) {
  if (!argsStr) {
    return { amount: null, rawNominal: "", category: "operasional", description: "" };
  }

  const parts = argsStr.trim().split(/\s+/);
  const rawNominal = parts[0] || "";
  const amount = parseNominal(rawNominal);

  if (!amount) {
    return { amount: null, rawNominal, category: "operasional", description: "" };
  }

  const remainingWords = parts.slice(1);
  if (remainingWords.length === 0) {
    return { amount, rawNominal, category: "operasional", description: "" };
  }

  // Check if first word of remaining text matches a known category
  const detectedCategory = normalizeCategory(remainingWords[0]);
  let category = "operasional";
  let description = "";

  if (detectedCategory && remainingWords.length > 1) {
    category = detectedCategory;
    description = remainingWords.slice(1).join(" ");
  } else {
    // If not a recognized category keyword, entire remaining text is description
    description = remainingWords.join(" ");
  }

  return {
    amount,
    rawNominal,
    category,
    description,
  };
}

/**
 * Format timestamp (Date, Firestore Timestamp, or ISO string) to Indonesian date/time WIB.
 * Example: "11/09/2026, 14:35 WIB"
 * @param {Date|object|string|number} timestamp
 * @returns {string}
 */
function formatWIB(timestamp) {
  let date;
  if (!timestamp) {
    date = new Date();
  } else if (typeof timestamp.toDate === "function") {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else if (typeof timestamp === "number" || typeof timestamp === "string") {
    date = new Date(timestamp);
  } else if (timestamp._seconds) {
    date = new Date(timestamp._seconds * 1000);
  } else {
    date = new Date();
  }

  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date) + " WIB";
}

module.exports = {
  formatRupiah,
  parseNominal,
  normalizeCategory,
  getCategoryMeta,
  parseTransactionArgs,
  formatWIB,
};
