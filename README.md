# CEKAS (Catatan Keuangan Kelas) — Pure Python Edition
**Sistem Kas Kelas Mandiri, Offline-First & Zero-Cloud Berbasis Python 3.11+**  
*Kelompok 5 — Kelas XI-F2 SMA Kartika XIX 1 Bandung*

[![Branch](https://img.shields.io/badge/Branch-pure--python-blue.svg)](https://github.com/Ardelyo/cekas/tree/pure-python)
[![Status](https://img.shields.io/badge/Status-Offline--First-success.svg)](https://github.com/Ardelyo/cekas/tree/pure-python)
[![Python](https://img.shields.io/badge/Python-3.11+-brightgreen.svg)](https://www.python.org/)

---

## 📌 Mengapa Pure Python?

Branch `pure-python` memindahkan seluruh sistem CEKAS dari ketergantungan cloud (Firebase Firestore / Cloud Functions) ke **arsitektur lokal deterministik (*Offline-First*)** yang dapat berjalan langsung di laptop bendahara tanpa perlu koneksi internet konstan atau tagihan cloud.

### Keunggulan Utama:
1. **Zero-Cloud & 100% Offline-First**: Menggunakan SQLite lokal dengan mode **WAL (*Write-Ahead Logging*)** dan transaksi ACID.
2. **Multi-Interface**:
   - **Interactive CLI / TUI**: Menu interaktif cepat untuk bendahara di kelas (`cekas.bat` / `demo.bat`).
   - **Web Dashboard & PWA**: Dashboard responsif mobile-first bertema white canvas dengan kartu bento pastel (`python run.py web`).
   - **Telegram Bot Lokal**: Bot polling mandiri tanpa perlu server webhook berbayar (`python -m cekas_app.bot`).
3. **Laporan & Visualisasi Otomatis**:
   - Export buku kas berformat **Excel (.xlsx)** lengkap dengan rumus otomatis SUM dan tab mutasi (`python run.py export-excel`).
   - Generator grafik alokasi kas & tren arus kas berformat gambar **PNG** dengan Matplotlib (`python run.py export-chart`).
4. **Android APK Ready**: Dukungan bundle Capacitor + PWA dengan build otomatis di GitHub Actions.

---

## 🚀 Cara Menggunakan Branch Ini (`pure-python`)

### 1. Clone & Beralih ke Branch `pure-python`
```bash
# Clone repository
git clone https://github.com/Ardelyo/cekas.git
cd cekas

# Beralih ke branch pure-python
git checkout pure-python
```

### 2. Instalasi Dependensi
Gunakan Python 3.11+ dan instal dependensi melalui `pip` atau `uv`:
```bash
# Menggunakan virtualenv
python -m venv .venv

# Di Windows:
.venv\Scripts\activate
# Di macOS / Linux:
source .venv/bin/activate

# Install requirements
pip install -r requirements.txt
```
*Atau jika menggunakan `uv`:*
```bash
uv pip install -r requirements.txt
```

### 3. Konfigurasi Environment (Opsional untuk Telegram Bot)
Salin contoh environment:
```bash
cp functions/.env.example .env
```
Isi token Telegram bot jika ingin menjalankan bot polling. Jika hanya menggunakan Web Dashboard dan CLI, file `.env` tidak wajib diisi.

---

## 💻 Menjalankan Aplikasi

### Opsi A: Launcher Instan Windows
Cukup klik dua kali atau jalankan file batch:
- **`cekas.bat`**: Membuka antarmuka interaktif CLI CEKAS.
- **`demo.bat`**: Menjalankan simulasi penuh otomatis (seeding data, mutasi, export Excel, dan visualisasi chart).

### Opsi B: Command Line Interface (CLI)
```bash
# Inisialisasi data awal siswa & saldo kas
python run.py seed

# Cek saldo kas & ringkasan pos alokasi
python run.py status

# Catat pemasukan kas (misal iuran siswa)
python run.py tambah 20000 "Iuran kas mingguan Ardellio" --alokasi operasional --nama Tarina

# Catat pengeluaran kas
python run.py kurang 35000 "Beli sapu dan pel kelas" --alokasi operasional --nama Tarina

# Export laporan Excel resmi
python run.py export-excel

# Buat grafik visualisasi kas
python run.py export-chart
```

### Opsi C: Web Dashboard Lokal (PWA)
```bash
python run.py web
```
Buka browser di **`http://127.0.0.1:8000`**.  
Dashboard dapat di-install sebagai aplikasi desktop/mobile (PWA) dengan 1-tap install.

### Opsi D: Telegram Bot Mode Polling
```bash
python -m cekas_app.bot
```

---

## 🧪 Menjalankan Pengujian Otomatis

Uji validasi core database, transaksi atomik, dan formatting:
```bash
python cekas_core/test_core.py
python -m unittest tests/test_full_system.py
```

---

## 📂 Struktur Direktori `pure-python`

```
cekas/
├── cekas_app/                 # Aplikasi utama Python
│   ├── database.py           # Engine SQLite WAL & transaksi atomik
│   ├── formatters.py         # Parser nominal (10k, 10.000) & text formatting
│   ├── cli.py                # Command-line interface
│   ├── web.py                # FastAPI server untuk Web Dashboard & PWA
│   ├── export_excel.py       # Generator laporan Excel multi-sheet
│   ├── generate_chart.py     # Generator grafik Matplotlib
│   ├── bot.py                # Runner Telegram Bot polling
│   └── templates/dashboard.html # White canvas bento UI
├── cekas_core/               # Minimal standalone core module
├── tests/                    # Unit & integration tests
├── scripts/                  # Helper script mobile & web bundle
├── cekas.bat                 # Windows quick launcher
├── demo.bat                  # Automated demo runner
├── requirements.txt          # Daftar paket Python
└── run.py                    # Master CLI entry point
```

---

## 👥 Tim Pengembang
- **Kelas:** XI-F2 SMA Kartika XIX-1 Bandung
- **Kelompok:** Kelompok 5
- **Ketua Kelompok:** Tarina
- **Arsitek & Developer:** Ardellio Satria Anindito
