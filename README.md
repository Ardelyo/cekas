# CEKAS (Catatan Keuangan Kelas)
**Sistem Informasi Pencatatan Uang Kas Digital Berbasis Telegram Bot & Google Cloud Firestore**  
*Kelompok 5 — Kelas XI-F2 SMA Kartika XIX 1 Bandung*

---

## 📌 Ringkasan Eksekutif MVP

Aplikasi **CEKAS (Kace Kas)** dirancang untuk memecahkan friksi pengelolaan kas kelas konvensional yang sebelumnya masih manual (buku tulis). Dengan digitalisasi berbasis **Telegram Bot** yang terhubung langsung ke **Google Cloud Firestore**, setiap transaksi iuran dan pengeluaran dicatat secara instan, transparan, dan dihitung secara otomatis (*running balance*) tanpa risiko selisih kas (*cash mismatch*).

Fokus MVP (*Minimum Viable Product*) ini memvalidasi alur pencatatan kas multi-user melalui Telegram Bot dengan otorisasi berbasis peran (*Role-Based Access Control* / RBAC):
1. **Bendahara Kelas**: Berhak menambah pemasukan (`/tambah`) dan mencatat pengeluaran (`/kurang`).
2. **Siswa & Wali Kelas**: Memiliki akses baca penuh (*read-only*) untuk mengecek saldo terkini (`/saldo`) dan 10 mutasi terakhir (`/riwayat`).

---

## 🏗️ Arsitektur & Tech Stack

```
[ Siswa / Bendahara XI-F2 ]
             │
             ▼
      Telegram Bot API
             │
   ┌─────────┴─────────┐
   │                   │ (Mode Polling Lokal / Dev)
   ▼ (Mode Webhook)    ▼
Cloud Functions    Local Runner (scripts/polling_dev.js)
(Node.js / Express)    │
   │                   │
   └─────────┬─────────┘
             ▼
   Google Cloud Firestore
     ├── classes/XI-F2 (saldo, nama, updatedAt)
     ├── classes/XI-F2/transactions (riwayat mutasi)
     └── classes/XI-F2/members (RBAC: bendahara, siswa)
```

- **Runtime Backend:** Node.js (v18+)
- **Cloud Engine:** Cloud Functions for Firebase (2nd Gen)
- **Database:** Google Cloud Firestore (NoSQL Real-Time, Atomic Transactions)
- **Client Interface:** Telegram Bot API
- **Otorisasi:** Subcollection Firestore `members` (verifikasi Telegram ID pengirim)

---

## 🗄️ Skema Data Cloud Firestore

### 1. Document Utama Kelas: `classes/XI-F2`
```json
{
  "nama": "Kelas XI-F2 SMA Kartika XIX-1 Bandung",
  "tahun_ajaran": "2026/2027",
  "saldo": 150000,
  "createdAt": "2026-09-11T00:00:00Z",
  "updatedAt": "2026-09-11T07:35:00Z"
}
```

### 2. Subcollection Transaksi: `classes/XI-F2/transactions/{txId}`
```json
{
  "type": "in",
  "amount": 10000,
  "description": "Iuran mingguan kas Ardellio",
  "inputBy": "Tarina",
  "telegramId": 123456789,
  "inputMethod": "telegram",
  "timestamp": "2026-09-11T07:35:00Z"
}
```

### 3. Subcollection Anggota & Role: `classes/XI-F2/members/{memberId}`
```json
{
  "nama": "Tarina",
  "role": "bendahara",
  "telegramId": 123456789,
  "keterangan": "Ketua Kelompok & Bendahara Utama"
}
```

---

## 📱 Daftar Perintah Telegram Bot

| Perintah | Hak Akses | Contoh Perintah | Deskripsi Output |
|---|---|---|---|
| `/start` | Semua Siswa | `/start` | Menampilkan sapaan, identitas pengguna, status role, dan panduan lengkap perintah. |
| `/saldo` | Semua Siswa | `/saldo` | Menampilkan total saldo kas kelas real-time dan ringkasan pos alokasi. |
| `/alokasi` | Semua Siswa | `/alokasi` | Visualisasi rincian saldo per pos anggaran (Operasional, Sosial, Event, Cadangan) lengkap dengan persentase. |
| `/riwayat` | Semua Siswa | `/riwayat`<br>`/riwayat sosial` | Menampilkan rekapitulasi 10 transaksi terakhir (pemasukan 📥 / pengeluaran 📤) beserta nama pencatat & saldo akhir. |
| `/profil` | Semua Siswa | `/profil` | Melihat data akun, status NIS, role, dan preferensi notifikasi personal. |
| `/notif` | Semua Siswa | `/notif on` atau `/notif off` | Mengaktifkan atau menonaktifkan notifikasi personal (DM) saat kas berubah. |
| `/daftar` | Siswa Baru | `/daftar 23241001 Ardellio Satria` | Menghubungkan ID Telegram siswa secara mandiri ke sistem kelas. |
| `/klaimbendahara` | Calon Bendahara | `/klaimbendahara 192837` | Mengaktifkan hak akses bendahara secara instan menggunakan PIN rahasia kelas. |
| `/tambah` | **Khusus Bendahara** | `/tambah 10k operasional Iuran Ardellio`<br>`/tambah 25k sosial Donasi santunan` | Menambah saldo pos tertentu dan otomatis membroadcast notifikasi DM ke seluruh siswa. |
| `/kurang` | **Khusus Bendahara** | `/kurang 35k operasional Beli sapu dan pel`<br>`/kurang 15k Beli spidol` | Mengurangi saldo pos tertentu dan otomatis membroadcast notifikasi DM ke seluruh siswa. |

> 🔔 **Fitur Solo/Personal Notification:**  
> Sistem tidak mengharuskan bot berada di grup kelas. Setiap kali bendahara mencatat `/tambah` atau `/kurang`, bot secara otomatis mengirimkan notifikasi langsung (*private message*) ke akun Telegram masing-masing siswa yang telah terdaftar (`/daftar`). Siswa dapat mengatur preferensi ini lewat `/notif on/off`.

---

## 🚀 Panduan Setup & Uji Coba

### 1. Buat Bot Telegram via @BotFather
1. Buka Telegram dan cari **`@BotFather`**.
2. Kirim perintah `/newbot`.
3. Tentukan nama bot (misal: `CEKAS Kas XI-F2`) dan username bot (misal: `cekas_xif2_bot`).
4. Salin **HTTP API Token** yang diberikan oleh BotFather.

### 2. Konfigurasi Environment Variable
Salin file konfigurasi di folder `functions`:
```bash
cp functions/.env.example functions/.env
```
Buka file `functions/.env` dan sesuaikan nilainya:
```env
TELEGRAM_BOT_TOKEN=123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ
CLASS_ID=XI-F2
GCP_PROJECT_ID=gemma4good-494311
BENDAHARA_TELEGRAM_ID=987654321
```
*(Catatan: Anda bisa mendapatkan Telegram ID pribadi dengan mengirim pesan ke bot `@userinfobot` di Telegram)*.

### 3. Install Dependensi & Jalankan Automated Test
```bash
# Di direktori root proyek
npm test
```
*Hasil: 13 pengujian otomatis memverifikasi kalkulasi saldo lari, parser nominal rupiah (`10k`, `10.000`), permission check, dan LIFO history.*

### 4. Inisialisasi Data Firestore (Seeder)
Daftarkan anggota awal kelas XI-F2 (Tarina, Ardellio, Nabila, Cinta, Wali Kelas) dan tetapkan Telegram ID Anda sebagai bendahara:
```bash
# Ganti dengan Telegram ID Anda
node scripts/seed_members.js <ID_TELEGRAM_ANDA> XI-F2
```

---

## 🧪 Metode Menjalankan Bot

### Opsi A: Mode Polling Lokal (Rekomendasi untuk Uji Coba Instan)
Anda **tidak perlu** deploy ke Cloud Functions atau menyewa hosting untuk mencoba bot. Cukup jalankan runner polling lokal:
```bash
npm run bot:dev
```
Bot akan langsung merespons chat di Telegram Anda secara real-time!

### Opsi B: Mode Production Webhook (Firebase Cloud Functions)
1. **Deploy Cloud Functions:**
   ```bash
   firebase deploy --only functions
   ```
   Firebase akan memberikan URL endpoint, misalnya:
   `https://us-central1-gemma4good-494311.cloudfunctions.net/cekasWebhook`

2. **Daftarkan Webhook ke Telegram:**
   ```bash
   npm run webhook:set https://us-central1-gemma4good-494311.cloudfunctions.net/cekasWebhook
   ```

3. **Periksa Status Webhook:**
   ```bash
   npm run webhook:status
   ```

4. **Jika Ingin Menghapus Webhook (Kembali ke mode polling):**
   ```bash
   npm run webhook:delete
   ```

---

## 🔒 Keamanan & Integritas Data

1. **Firestore Atomic Transactions:**  
   Perhitungan saldo lari dieksekusi menggunakan `db.runTransaction()`. Hal ini menjamin tidak terjadi *race condition* atau data selisih ketika dua pengurus mencatat kas pada detik yang bersamaan.
2. **Fleksibilitas Input Nominal:**  
   Parser mendukung format natural Indonesia seperti `10000`, `10.000`, `10k`, `10rb`, `Rp 25.000`, dan menolak angka negatif atau karakter tidak valid.
3. **Audit Trail Lengkap:**  
   Setiap transaksi mencatat siapa yang memasukkan (`inputBy`), ID Telegram, timestamp server, metode input (`telegram`), dan deskripsi alasan pengeluaran/pemasukan.

---

## 👥 Tim Pengembang
- **Kelas:** XI-F2 SMA Kartika XIX-1 Bandung
- **Kelompok:** Kelompok 5
- **Ketua Kelompok:** Tarina
- **Anggota:** Ardellio Satria Anindito, Nabila, Cinta
