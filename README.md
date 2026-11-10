# CEKAS - Catatan Keuangan Kelas

Sistem kas kelas XI-F2 SMA Kartika XIX-1 Bandung. **100% Python**: tanpa JavaScript,
tanpa Node, tanpa cloud. Data disimpan di satu file SQLite (`cekas.db`).

- **Dashboard web** (server-rendered, jalan walau JavaScript browser dimatikan)
  - Publik: saldo, pos, mutasi, status iuran, grafik.
  - Bendahara (login PIN): catat transaksi, koreksi, tandai iuran, unduh Excel.
- **Bot Telegram**: `/saldo /alokasi /riwayat /tagihan /grafik /excel /daftar /notif`
  dan khusus bendahara `/tambah /kurang /bayar /koreksi /klaimbendahara`.
- **Ledger append-only**: transaksi tidak pernah dihapus atau diubah; kesalahan dikoreksi
  dengan transaksi lawan. Saldo dapat diverifikasi ulang dari ledger (`python -m cekas cek`).

## Mulai

```bash
python -m venv .venv && source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                                   # isi TELEGRAM_BOT_TOKEN bila memakai bot
python -m cekas seed          # muat daftar siswa dari data/siswa_contoh.csv (ganti dengan data asli)
python -m cekas web           # http://127.0.0.1:8000
python -m cekas bot           # bot Telegram (terminal terpisah)
```

Perintah lain: `status`, `export-excel`, `export-chart`, `cek [--perbaiki]`, `migrate`.

Daftar siswa: salin `data/siswa_contoh.csv`, isi `nis,nama_resmi,role` (role: `siswa`,
`bendahara`, `wali_kelas`), lalu `python -m cekas seed --csv data/siswa.csv`.

PIN bendahara bawaan `192837`, ubah lewat `PIN_BENDAHARA` di `.env` sebelum database pertama dibuat.
Untuk akses dari HP lewat jaringan, jalankan `python -m cekas web --host 0.0.0.0` dan
isi `CEKAS_SECRET_KEY` di `.env`. Jika dibuka lewat internet, pasang di belakang HTTPS.

## Migrasi dari versi Firestore/Node lama

Dari sumber langsung (membutuhkan Firestore project yang masih bisa dibaca publik):

```bash
python -m cekas migrate --project gemma4good-494311
```

Atau dari berkas ekspor JSON dengan struktur
`{"class":{...}, "transactions":[...], "members":[...], "whitelist_students":[...], "dues":[...]}`
(setiap dokumen berisi field Firestore plus `_id`):

```bash
python -m cekas migrate --dari ekspor.json
```

Migrasi berjalan dalam satu transaksi (gagal = tidak ada yang berubah), menolak menimpa data
yang sudah ada kecuali `--ganti`, lalu menghitung ulang saldo dari ledger dan membandingkannya
dengan saldo Firestore. Bila berbeda, kode keluar 2 dan selisihnya dicetak.

## Pengembangan

```bash
pip install -r requirements-dev.txt
python -m pytest
```

Struktur: `cekas/` (database, formatters, web, bot, migrate, export, chart, cli), `tests/`, `data/`.
Versi JavaScript/Firebase lama tetap ada di riwayat git (commit `a3cb611`).
