/**
 * CEKAS (Catatan Keuangan Kelas)
 * Lightweight Telegram Bot API client using native fetch with IPv4 prioritization and resilient retries
 */

const dns = require("dns");
try {
  dns.setDefaultResultOrder("ipv4first");
} catch (_) {}

/**
 * Resilient fetch wrapper with automatic retry for transient socket/network errors (e.g. ECONNRESET).
 * @param {string} url
 * @param {RequestInit} options
 * @param {number} maxRetries
 * @returns {Promise<Response>}
 */
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      return response;
    } catch (err) {
      lastError = err;
      const isNetworkError =
        err.name === "TypeError" ||
        err.code === "ECONNRESET" ||
        err.code === "ETIMEDOUT" ||
        err.code === "UND_ERR_SOCKET" ||
        (err.cause && (err.cause.code === "ECONNRESET" || err.cause.code === "ETIMEDOUT" || err.cause.code === "ECONNREFUSED"));

      if (isNetworkError && attempt < maxRetries) {
        console.warn(`[telegramApi] Network reset/timeout (${err.message}). Retrying ${attempt}/${maxRetries} in ${attempt * 300}ms...`);
        await new Promise((resolve) => setTimeout(resolve, attempt * 300));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

/**
 * Send a text message to a Telegram chat.
 * @param {string} botToken
 * @param {string|number} chatId
 * @param {string} text
 * @param {object} options
 * @returns {Promise<object>}
 */
async function sendMessage(botToken, chatId, text, options = {}) {
  if (!botToken) {
    throw new Error("TELEGRAM_BOT_TOKEN is not configured.");
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const body = {
    chat_id: chatId,
    text: text,
    parse_mode: options.parse_mode || "HTML",
    disable_web_page_preview: true,
    ...options,
  };

  const response = await fetchWithRetry(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (!data.ok) {
    console.error("Telegram API error response:", data);
    throw new Error(`Telegram API Error [${data.error_code}]: ${data.description}`);
  }
  return data.result;
}

/**
 * Send chat action (e.g. 'typing').
 * @param {string} botToken
 * @param {string|number} chatId
 * @param {string} action
 * @returns {Promise<boolean>}
 */
async function sendChatAction(botToken, chatId, action = "typing") {
  try {
    const url = `https://api.telegram.org/bot${botToken}/sendChatAction`;
    await fetchWithRetry(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, action }),
    });
    return true;
  } catch (err) {
    // Non-critical, ignore error
    return false;
  }
}

module.exports = {
  sendMessage,
  sendChatAction,
};
