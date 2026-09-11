/**
 * CEKAS (Catatan Keuangan Kelas)
 * Cloud Functions for Firebase - Telegram Webhook Entrypoint
 */

require("dotenv").config();
const { onRequest } = require("firebase-functions/v2/https");
const { handleTelegramUpdate } = require("./src/bot");

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

/**
 * Cloud Function HTTPS Webhook for Telegram Bot
 */
exports.cekasWebhook = onRequest(
  {
    cors: false,
    timeoutSeconds: 60,
    memory: "256MiB",
    maxInstances: 10,
  },
  async (req, res) => {
    // Health check endpoint for simple browser/ping verification
    if (req.method === "GET") {
      res.status(200).json({
        status: "ok",
        app: "CEKAS (Catatan Keuangan Kelas)",
        version: "1.0.0-mvp",
        message: "CEKAS Telegram Webhook is active and listening for events.",
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    // Optional Telegram Secret Token verification
    if (WEBHOOK_SECRET) {
      const headerSecret = req.headers["x-telegram-bot-api-secret-token"];
      if (headerSecret !== WEBHOOK_SECRET) {
        console.warn("Unauthorized webhook request. Secret token mismatch.");
        res.status(401).send("Unauthorized");
        return;
      }
    }

    const token = TELEGRAM_BOT_TOKEN;
    if (!token) {
      console.error("FATAL: TELEGRAM_BOT_TOKEN is not defined in environment variables.");
      res.status(500).send("Server configuration error: missing bot token.");
      return;
    }

    try {
      const update = req.body;
      if (!update || typeof update !== "object") {
        res.status(400).send("Invalid body payload");
        return;
      }

      // Process update asynchronously without blocking Telegram's 200 OK timeout
      // In Cloud Functions, waiting for handleTelegramUpdate before returning 200 ensures execution doesn't get frozen
      await handleTelegramUpdate(update, token);

      res.status(200).send("OK");
    } catch (err) {
      console.error("Unhandled error in webhook handler:", err);
      // Return 200 so Telegram doesn't endlessly retry failed malformed commands
      res.status(200).json({ error: err.message });
    }
  }
);
