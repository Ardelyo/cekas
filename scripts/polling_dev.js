/**
 * CEKAS (Catatan Keuangan Kelas)
 * Local Development Poller (Long-Polling Runner)
 *
 * Runs the bot locally on your machine for instant testing without needing
 * public webhooks, ngrok, or immediate Cloud Functions deployment.
 *
 * Usage:
 *   node scripts/polling_dev.js
 */

const dns = require("dns");
try {
  dns.setDefaultResultOrder("ipv4first");
} catch (_) {}

require("dotenv").config({ path: require("path").resolve(__dirname, "../functions/.env") });
const { handleTelegramUpdate } = require("../functions/src/bot");

const botToken = process.env.TELEGRAM_BOT_TOKEN;
if (!botToken) {
  console.error("❌ Error: TELEGRAM_BOT_TOKEN is not defined in functions/.env");
  console.error("Please set TELEGRAM_BOT_TOKEN in functions/.env before running the local poller.");
  process.exit(1);
}

const telegramApi = `https://api.telegram.org/bot${botToken}`;

async function startPoller() {
  console.log("==================================================");
  console.log("🚀 CEKAS Local Bot Poller Starting...");
  console.log("==================================================");

  // 1. Get bot identity
  const meRes = await fetch(`${telegramApi}/getMe`);
  const meData = await meRes.json();
  if (!meData.ok) {
    throw new Error(`Failed to connect to Telegram: ${meData.description}`);
  }
  console.log(`🤖 Bot Name: ${meData.result.first_name} (@${meData.result.username})`);
  console.log(`🆔 Bot ID: ${meData.result.id}`);

  // 2. Ensure webhook is deleted so getUpdates works
  const webhookInfoRes = await fetch(`${telegramApi}/getWebhookInfo`);
  const webhookInfo = await webhookInfoRes.json();
  if (webhookInfo.result && webhookInfo.result.url) {
    console.log(`⚠️ Active webhook detected (${webhookInfo.result.url}). Deleting webhook for local polling...`);
    await fetch(`${telegramApi}/deleteWebhook?drop_pending_updates=false`);
    console.log("✅ Webhook removed. Local polling enabled.");
  }

  console.log("\n🟢 CEKAS Bot is now polling for Telegram messages!");
  console.log("Try sending commands from Telegram:");
  console.log("  • /start");
  console.log("  • /saldo");
  console.log("  • /riwayat");
  console.log("  • /tambah 10000 Iuran mingguan");
  console.log("  • /kurang 25000 Beli spidol kelas");
  console.log("Press Ctrl + C to stop.\n");

  let offset = 0;

  while (true) {
    try {
      const url = `${telegramApi}/getUpdates?offset=${offset}&timeout=20`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.ok && Array.isArray(data.result)) {
        for (const update of data.result) {
          offset = update.update_id + 1;
          const msg = update.message || update.edited_message;
          if (msg && msg.text) {
            const sender = msg.from ? `${msg.from.first_name} (ID: ${msg.from.id})` : "Unknown";
            console.log(`📩 [${new Date().toLocaleTimeString()}] Message from ${sender}: "${msg.text}"`);
          }

          // Dispatch update to standard CEKAS bot handler
          try {
            await handleTelegramUpdate(update, botToken);
          } catch (handlerErr) {
            console.error(`⚠️ Error handling update ${update.update_id}:`, handlerErr.message || handlerErr);
          }
        }
      } else if (!data.ok) {
        console.warn("⚠️ getUpdates returned not ok:", data);
        await new Promise((r) => setTimeout(r, 3000));
      }
    } catch (err) {
      console.error("⚠️ Polling loop error (retrying in 3s):", err.message);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

process.on("SIGINT", () => {
  console.log("\n👋 Stopping CEKAS bot poller. Goodbye!");
  process.exit(0);
});

async function main() {
  while (true) {
    try {
      await startPoller();
      break;
    } catch (err) {
      console.error("⚠️ Connection error during poller start (retrying in 3s):", err.message || err);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

main();
