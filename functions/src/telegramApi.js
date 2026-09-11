/**
 * CEKAS (Catatan Keuangan Kelas)
 * Lightweight Telegram Bot API client using native fetch
 */

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

  const response = await fetch(url, {
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
    await fetch(url, {
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
