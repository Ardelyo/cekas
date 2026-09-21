"""
CEKAS Telegram Bot Dispatcher (python-telegram-bot v20+)
Complete asynchronous bot with non-AI manual input priority.
"""

import logging
from typing import Optional
from telegram import Update
from telegram.constants import ParseMode
from telegram.ext import (
    ApplicationBuilder,
    CommandHandler,
    ContextTypes,
    MessageHandler,
    filters,
)

from .config import CLASS_ID, TELEGRAM_BOT_TOKEN, POCKET_CONFIG
from .database import CekasDB
from .formatters import format_rupiah, parse_nominal, parse_transaction_args, format_wib
from .export_excel import generate_excel_report
from .generate_chart import generate_financial_chart

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE, db: CekasDB):
    user = update.effective_user
    member = db.get_member(user.id)
    is_bendahara = member and member["role"] in ["bendahara", "admin", "ketua"]

    msg = f"✨ <b>CEKAS (Catatan Keuangan Kelas)</b> ✨\n"
    msg += f"<i>Sistem Kas & Transparansi {CLASS_ID} SMA Kartika XIX-1 Bandung</i>\n"
    msg += "━━━━━━━━━━━━━━━━━━━━\n"
    msg += f"Halo, <b>{member['nama'] if member else user.first_name}</b>! 👋\n"
    msg += f"Role: <b>{(member['role'] if member else 'BELUM TERDAFTAR').upper()}</b>"
    if is_bendahara:
        msg += " 🔑 (Akses Bendahara)"
    msg += f"\nID Telegram: <code>{user.id}</code>\n"

    if not member:
        msg += "\n⚠️ <i>Akun Anda belum terhubung dengan data absensi kelas.</i>\n"
        msg += "👉 Ketik: <code>/daftar [NIS]</code> untuk mendaftar resmi.\n"

    msg += "\n📌 <b>Menu Siswa & Anggota Kelas:</b>\n"
    msg += "• <code>/saldo</code> - Cek total saldo kas kelas real-time.\n"
    msg += "• <code>/alokasi</code> - Rincian alokasi pos anggaran.\n"
    msg += "• <code>/tagihan [minggu?]</code> - Rekap siapa sudah/belum bayar kas.\n"
    msg += "• <code>/riwayat</code> - Lihat 10 mutasi transaksi kas terakhir.\n"
    msg += "• <code>/grafik</code> - Lihat infografis visual pos kas.\n"
    msg += "• <code>/excel</code> - Unduh buku kas format Excel (.xlsx).\n"
    msg += "• <code>/daftar [NIS]</code> - Pendaftaran terverifikasi whitelist NIS.\n\n"

    msg += "💼 <b>Menu Khusus Bendahara:</b>\n"
    msg += "• <code>/tambah [nominal] [pos?] [keterangan]</code> - Catat pemasukan.\n"
    msg += "• <code>/kurang [nominal] [pos?] [keterangan]</code> - Catat pengeluaran.\n"
    msg += "• <code>/bayar [NIS] [minggu_ke?]</code> - Catat pembayaran kas siswa.\n"
    msg += "• <code>/koreksi [id_tx] [alasan]</code> - Koreksi salah catat append-only.\n"
    msg += "• <code>/klaimbendahara [PIN]</code> - Aktivasi akses bendahara.\n"
    msg += "━━━━━━━━━━━━━━━━━━━━\n"
    msg += "💡 <i>Seluruh pencatatan kas dapat diinput secara manual dengan aman & akurat!</i>"

    await update.message.reply_text(msg, parse_mode=ParseMode.HTML)

async def cmd_saldo(update: Update, context: ContextTypes.DEFAULT_TYPE, db: CekasDB):
    info = db.get_or_create_class(CLASS_ID)
    saldo = info["saldo"]
    alokasi = info["alokasi"]

    msg = f"📊 <b>STATUS KAS KELAS {CLASS_ID}</b>\n"
    msg += "🏫 SMA Kartika XIX-1 Bandung\n"
    msg += "━━━━━━━━━━━━━━━━━━━━\n"
    msg += f"💰 <b>Total Saldo Kas:</b> <code>{format_rupiah(saldo)}</code>\n\n"
    msg += "📑 <b>Ringkasan Alokasi Pos:</b>\n"
    for k, meta in POCKET_CONFIG.items():
        msg += f"• {meta['icon']} {meta['label']}: <code>{format_rupiah(alokasi.get(k, 0))}</code>\n"
    msg += f"\n🕒 <i>Pembaruan terakhir: {format_wib()}</i>\n"
    msg += "━━━━━━━━━━━━━━━━━━━━\n"
    msg += "💡 <i>Ketik <code>/alokasi</code> untuk detail, atau <code>/grafik</code> untuk gambar infografis.</i>"

    await update.message.reply_text(msg, parse_mode=ParseMode.HTML)

async def cmd_alokasi(update: Update, context: ContextTypes.DEFAULT_TYPE, db: CekasDB):
    info = db.get_or_create_class(CLASS_ID)
    saldo_total = info["saldo"]
    alokasi = info["alokasi"]

    msg = f"📊 <b>ALOKASI POS KAS {CLASS_ID}</b>\n"
    msg += "━━━━━━━━━━━━━━━━━━━━\n"
    msg += f"💰 <b>Total Saldo:</b> <code>{format_rupiah(saldo_total)}</code>\n\n"

    for k, meta in POCKET_CONFIG.items():
        val = alokasi.get(k, 0)
        pct = (val / saldo_total * 100) if saldo_total > 0 else 0
        msg += f"{meta['icon']} <b>{meta['label']}</b>\n"
        msg += f"   Saldo: <code>{format_rupiah(val)}</code> ({pct:.1f}%)\n"
        msg += f"   <i>{meta['description']}</i>\n\n"

    msg += "━━━━━━━━━━━━━━━━━━━━\n"
    msg += "💡 <i>Bendahara dapat mengalokasikan pos saat mencatat /tambah atau /kurang.</i>"

    await update.message.reply_text(msg, parse_mode=ParseMode.HTML)

async def cmd_riwayat(update: Update, context: ContextTypes.DEFAULT_TYPE, db: CekasDB):
    txs = db.get_recent_transactions(CLASS_ID, limit=10)
    if not txs:
        await update.message.reply_text("Belum ada transaksi kas yang dicatat.")
        return

    msg = f"📑 <b>10 MUTASI TERAKHIR KAS {CLASS_ID}</b>\n"
    msg += "━━━━━━━━━━━━━━━━━━━━\n"
    for t in txs:
        sign = "📥" if t["type"] == "in" else ("📤" if t["type"] == "out" else "↩️")
        pos = POCKET_CONFIG.get(t["category"], {}).get("label", t["category"])
        msg += f"{sign} <b>{format_rupiah(t['amount'])}</b> ({pos})\n"
        msg += f"   <i>{t['description']}</i>\n"
        msg += f"   ID: <code>#{t['id']}</code> • Oleh: {t['input_by']}\n\n"
    msg += "━━━━━━━━━━━━━━━━━━━━"

    await update.message.reply_text(msg, parse_mode=ParseMode.HTML)

async def cmd_tambah(update: Update, context: ContextTypes.DEFAULT_TYPE, db: CekasDB):
    user = update.effective_user
    args_str = " ".join(context.args) if context.args else ""
    parsed = parse_transaction_args(args_str)

    if not parsed["amount"] or not parsed["description"]:
        await update.message.reply_text(
            "⚠️ <b>Format Perintah Salah</b>\nContoh: <code>/tambah 10k operasional Iuran kas Budi</code>",
            parse_mode=ParseMode.HTML
        )
        return

    res = db.record_transaction(
        CLASS_ID, "in", parsed["amount"], parsed["category"],
        parsed["description"], user.first_name, user.id
    )
    pos_meta = POCKET_CONFIG.get(res["category"], {})

    msg = f"✅ <b>PEMASUKAN BERHASIL DICATAT!</b>\n"
    msg += "━━━━━━━━━━━━━━━━━━━━\n"
    msg += f"💰 Nominal: <b>+{format_rupiah(res['amount'])}</b>\n"
    msg += f"📁 Pos: {pos_meta.get('icon', '')} <b>{pos_meta.get('label', res['category'])}</b>\n"
    msg += f"📝 Keterangan: <i>{res['description']}</i>\n"
    msg += f"💵 Saldo Total Baru: <b>{format_rupiah(res['saldo_total'])}</b>\n"
    msg += f"🔢 ID Mutasi: <code>#{res['tx_id']}</code>"

    await update.message.reply_text(msg, parse_mode=ParseMode.HTML)

async def cmd_kurang(update: Update, context: ContextTypes.DEFAULT_TYPE, db: CekasDB):
    user = update.effective_user
    args_str = " ".join(context.args) if context.args else ""
    parsed = parse_transaction_args(args_str)

    if not parsed["amount"] or not parsed["description"]:
        await update.message.reply_text(
            "⚠️ <b>Format Perintah Salah</b>\nContoh: <code>/kurang 25k operasional Beli sapu dan pel</code>",
            parse_mode=ParseMode.HTML
        )
        return

    res = db.record_transaction(
        CLASS_ID, "out", parsed["amount"], parsed["category"],
        parsed["description"], user.first_name, user.id
    )
    pos_meta = POCKET_CONFIG.get(res["category"], {})

    msg = f"📤 <b>PENGELUARAN BERHASIL DICATAT!</b>\n"
    msg += "━━━━━━━━━━━━━━━━━━━━\n"
    msg += f"💸 Nominal: <b>-{format_rupiah(res['amount'])}</b>\n"
    msg += f"📁 Pos: {pos_meta.get('icon', '')} <b>{pos_meta.get('label', res['category'])}</b>\n"
    msg += f"📝 Keterangan: <i>{res['description']}</i>\n"
    msg += f"💵 Saldo Total Baru: <b>{format_rupiah(res['saldo_total'])}</b>\n"
    msg += f"🔢 ID Mutasi: <code>#{res['tx_id']}</code>"

    await update.message.reply_text(msg, parse_mode=ParseMode.HTML)

async def cmd_grafik(update: Update, context: ContextTypes.DEFAULT_TYPE, db: CekasDB):
    await update.message.reply_text("⏳ Sedang merender infografis keuangan kas...")
    img_stream = generate_financial_chart(db, CLASS_ID)
    await update.message.reply_photo(photo=img_stream, caption=f"📊 Infografis Saldo Kas {CLASS_ID}")

async def cmd_excel(update: Update, context: ContextTypes.DEFAULT_TYPE, db: CekasDB):
    await update.message.reply_text("⏳ Menyusun laporan resmi Excel (.xlsx)...")
    excel_stream = generate_excel_report(db, CLASS_ID)
    filename = f"Laporan_Kas_{CLASS_ID}.xlsx"
    await update.message.reply_document(document=excel_stream, filename=filename, caption=f"📑 Laporan Kas Resmi {CLASS_ID}")

def build_telegram_app(db: CekasDB, token: str = TELEGRAM_BOT_TOKEN):
    if not token:
        return None

    app = ApplicationBuilder().token(token).build()

    app.add_handler(CommandHandler("start", lambda u, c: cmd_start(u, c, db)))
    app.add_handler(CommandHandler("saldo", lambda u, c: cmd_saldo(u, c, db)))
    app.add_handler(CommandHandler("alokasi", lambda u, c: cmd_alokasi(u, c, db)))
    app.add_handler(CommandHandler("riwayat", lambda u, c: cmd_riwayat(u, c, db)))
    app.add_handler(CommandHandler("tambah", lambda u, c: cmd_tambah(u, c, db)))
    app.add_handler(CommandHandler("kurang", lambda u, c: cmd_kurang(u, c, db)))
    app.add_handler(CommandHandler("grafik", lambda u, c: cmd_grafik(u, c, db)))
    app.add_handler(CommandHandler("excel", lambda u, c: cmd_excel(u, c, db)))

    return app
