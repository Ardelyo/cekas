/**
 * CEKAS (Catatan Keuangan Kelas)
 * Unified Runner: Web Localhost + Telegram Bot Poller
 */

const { spawn, exec } = require("child_process");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");

console.log("==================================================");
console.log("🚀 Memulai CEKAS (Web Localhost + Telegram Bot)...");
console.log("==================================================");

let browserOpened = false;

// 1. Jalankan Telegram Bot Poller
const botProcess = spawn("node", ["scripts/polling_dev.js"], {
  cwd: rootDir,
  shell: true,
  stdio: ["inherit", "pipe", "pipe"],
});

botProcess.stdout.on("data", (data) => {
  const lines = data.toString().trim().split("\n");
  for (const line of lines) {
    if (line.trim()) console.log(`\x1b[36m[BOT]\x1b[0m ${line}`);
  }
});

botProcess.stderr.on("data", (data) => {
  const lines = data.toString().trim().split("\n");
  for (const line of lines) {
    if (line.trim()) console.error(`\x1b[31m[BOT ERR]\x1b[0m ${line}`);
  }
});

// 2. Jalankan Vite Web App
const webProcess = spawn("npm", ["--prefix", "web-app", "run", "dev", "--", "--host", "127.0.0.1", "--port", "5173"], {
  cwd: rootDir,
  shell: true,
  stdio: ["inherit", "pipe", "pipe"],
});

webProcess.stdout.on("data", (data) => {
  const str = data.toString();
  const lines = str.trim().split("\n");
  for (const line of lines) {
    if (line.trim()) console.log(`\x1b[32m[WEB]\x1b[0m ${line}`);
  }

  if (!browserOpened && (str.includes("Local:") || str.includes("5173"))) {
    browserOpened = true;
    console.log("\n🌐 Membuka browser: http://localhost:5173 ...\n");
    exec("start http://localhost:5173");
  }
});

webProcess.stderr.on("data", (data) => {
  const lines = data.toString().trim().split("\n");
  for (const line of lines) {
    if (line.trim()) console.error(`\x1b[33m[WEB ERR]\x1b[0m ${line}`);
  }
});

function cleanup() {
  console.log("\n🛑 Menghentikan semua layanan CEKAS...");
  try {
    if (botProcess && !botProcess.killed) {
      if (process.platform === "win32") {
        exec(`taskkill /pid ${botProcess.pid} /T /F >nul 2>&1`);
      } else {
        botProcess.kill();
      }
    }
  } catch (_) {}

  try {
    if (webProcess && !webProcess.killed) {
      if (process.platform === "win32") {
        exec(`taskkill /pid ${webProcess.pid} /T /F >nul 2>&1`);
      } else {
        webProcess.kill();
      }
    }
  } catch (_) {}

  setTimeout(() => process.exit(0), 500);
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
process.on("exit", cleanup);
