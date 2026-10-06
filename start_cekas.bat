@echo off
title CEKAS • Catatan Keuangan Kelas (Web & Telegram Bot)
chcp 65001 >nul
cd /d "%~dp0"

echo ==========================================================
echo   CEKAS (Catatan Keuangan Kelas XI-F2)
echo   SMA Kartika XIX-1 Bandung
echo ==========================================================
echo.
echo [*] Memulai Web Localhost dan Telegram Bot (@kacekasbot)...
echo [*] Browser akan terbuka otomatis di http://localhost:5173
echo [*] Tekan Ctrl+C untuk menghentikan semua layanan.
echo.

node scripts/dev_all.js

pause
