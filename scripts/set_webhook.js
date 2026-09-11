/**
 * CEKAS (Catatan Keuangan Kelas)
 * Telegram Bot Webhook Setup & Management CLI
 *
 * Usage:
 *   1. Check webhook status:
 *      node scripts/set_webhook.js
 *
 *   2. Set new webhook URL:
 *      node scripts/set_webhook.js https://<REGION>-<PROJECT_ID>.cloudfunctions.net/cekasWebhook [OPTIONAL_SECRET]
 *
 *   3. Delete webhook (switch back to polling):
 *      node scripts/set_webhook.js --delete
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../functions/.env") });

const botToken = process.env.TELEGRAM_BOT_TOKEN;
if (!botToken) {
  console.error("❌ Error: TELEGRAM_BOT_TOKEN is not defined in functions/.env");
  process.exit(1);
}

const args = process.argv.slice(2);

async function main() {
  const telegramApi = `https://api.telegram.org/bot${botToken}`;

  // Check bot identity first
  const meRes = await fetch(`${telegramApi}/getMe`);
  const meData = await meRes.json();
  if (!meData.ok) {
    console.error("❌ Failed to connect to Telegram Bot API:", meData.description);
    process.exit(1);
  }
  console.log(`🤖 Bot Connected: @${meData.result.username} (${meData.result.first_name}) [ID: ${meData.result.id}]`);

  // Action 1: Delete webhook
  if (args[0] === "--delete" || args[0] === "--remove") {
    console.log("⏳ Deleting Telegram webhook...");
    const delRes = await fetch(`${telegramApi}/deleteWebhook?drop_pending_updates=true`);
    const delData = await delRes.json();
    console.log("Result:", delData);
    return;
  }

  // Action 2: Set webhook
  if (args[0] && args[0].startsWith("http")) {
    const webhookUrl = args[0];
    const secret = args[1] || process.env.WEBHOOK_SECRET || "";

    console.log(`⏳ Setting webhook URL to: ${webhookUrl}`);
    const body = {
      url: webhookUrl,
      drop_pending_updates: false,
    };
    if (secret) {
      body.secret_token = secret;
      console.log(`🔒 Secret token enabled.`);
    }

    const setRes = await fetch(`${telegramApi}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const setData = await setRes.json();
    console.log("Set Webhook Response:", setData);
  }

  // Action 3: Inspect current webhook info
  console.log("\n📡 Checking Current Webhook Status...");
  const infoRes = await fetch(`${telegramApi}/getWebhookInfo`);
  const infoData = await infoRes.json();
  console.log(JSON.stringify(infoData.result, null, 2));

  if (!infoData.result.url) {
    console.log("\n💡 Note: Webhook is currently UNSET (Ready for local polling runner: npm run bot:polling)");
  } else {
    console.log(`\n✅ Webhook is currently ACTIVE at: ${infoData.result.url}`);
  }
}

main().catch((err) => {
  console.error("❌ Webhook management error:", err);
  process.exit(1);
});
