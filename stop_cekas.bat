@echo off
title Hentikan Layanan CEKAS
chcp 65001 >nul
echo ==========================================================
echo   Menghentikan semua proses CEKAS...
echo ==========================================================

powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*polling_dev.js*' -or $_.CommandLine -like '*dev_all.js*' -or $_.CommandLine -like '*vite*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"

echo.
echo [OK] Semua proses Web dan Bot CEKAS telah dihentikan.
timeout /t 2 >nul
