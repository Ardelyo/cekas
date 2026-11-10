"""Bot Telegram CEKAS (python-telegram-bot v20+), 13 perintah dengan RBAC.

Perintah tulis (/tambah /kurang /bayar /koreksi) hanya untuk bendahara.
Bendahara diaktifkan lewat /klaimbendahara [PIN]; pesan berisi PIN dihapus otomatis.
"""

from __future__ import annotations

import html
import logging
from typing import Awaitable, Callable

from telegram import Update
from telegram.constants import ParseMode
from telegram.ext import Application, ApplicationBuilder, CommandHandler, ContextTypes

from .chart import generate_financial_chart
from .config import CLASS_ID, POCKET_CONFIG, TELEGRAM_BOT_TOKEN
from .database import CekasDB, CekasError
from .export_excel import generate_excel_report
from .formatters import format_rupiah, format_wib, parse_nominal, parse_transaction_args, parse_utc

log = logging.getLogger("cekas.bot")
H = ParseMode.HTML
e = html.escape

HELP = (
    "<b>CEKAS - Kas Kelas {cls}</b>\n\n"
    "<b>Semua anggota</b>\n"
    "/saldo - saldo total\n/alokasi - rincian pos\n/riwayat - 10 mutasi terakhir\n"
    "/tagihan [minggu] - siapa sudah/belum bayar\n/grafik - infografis\n/excel - buku kas (.xlsx)\n"
    "/daftar NIS - hubungkan akun dengan NIS\n/notif - nyalakan/matikan notifikasi\n\n"
    "<b>Bendahara</b>\n"
    "/tambah 10k [pos] keterangan\n/kurang 25k [pos] keterangan\n"
    "/bayar NIS [minggu]\n/koreksi ID alasan\n/klaimbendahara PIN\n\n"
    "Pos: operasional, sosial, event, cadangan."
)


def _name(update: Update) -> str:
    u = update.effective_user
    return u.full_name or u.username or str(u.id)


def build_app(db: CekasDB, token: str = TELEGRAM_BOT_TOKEN, class_id: str = CLASS_ID) -> Application:
    if not token:
        raise RuntimeError("TELEGRAM_BOT_TOKEN belum diisi (file .env).")

    async def reply(update: Update, text: str) -> None:
        await update.effective_message.reply_text(text, parse_mode=H)

    async def notify(context: ContextTypes.DEFAULT_TYPE, update: Update, text: str) -> None:
        for chat_id in db.get_notif_recipients(class_id, exclude=update.effective_user.id):
            try:
                await context.bot.send_message(chat_id, text, parse_mode=H)
            except Exception as exc:  # pengguna memblokir bot dsb. tidak boleh menggagalkan perintah
                log.warning("notif ke %s gagal: %s", chat_id, exc)

    def bendahara_only(fn: Callable[[Update, ContextTypes.DEFAULT_TYPE], Awaitable[None]]):
        async def wrapper(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
            if not db.is_bendahara(update.effective_user.id, class_id):
                await reply(update, "Perintah ini khusus bendahara. Gunakan /klaimbendahara PIN.")
                return
            try:
                await fn(update, context)
            except CekasError as exc:
                await reply(update, f"Gagal: {e(str(exc))}")
        return wrapper

    async def start(update, context):
        await reply(update, HELP.format(cls=class_id))

    async def saldo(update, context):
        info = db.get_or_create_class(class_id)
        lines = [f"<b>Saldo kas {e(class_id)}</b>", f"Total: <code>{format_rupiah(info['saldo'])}</code>"]
        lines += [f"- {m['label']}: <code>{format_rupiah(info['alokasi'][k])}</code>" for k, m in POCKET_CONFIG.items()]
        lines.append(f"<i>{format_wib()}</i>")
        await reply(update, "\n".join(lines))

    async def alokasi(update, context):
        info = db.get_or_create_class(class_id)
        total = info["saldo"]
        lines = [f"<b>Alokasi pos {e(class_id)}</b>"]
        for k, m in POCKET_CONFIG.items():
            v = info["alokasi"][k]
            pct = v / total * 100 if total > 0 and v > 0 else 0
            lines.append(f"\n<b>{m['label']}</b>: <code>{format_rupiah(v)}</code> ({pct:.1f}%)\n<i>{m['description']}</i>")
        await reply(update, "\n".join(lines))

    async def riwayat(update, context):
        txs = db.get_recent_transactions(class_id, limit=10)
        if not txs:
            await reply(update, "Belum ada transaksi.")
            return
        lines = ["<b>10 mutasi terakhir</b>"]
        for t in txs:
            sign = "+" if t["type"] == "in" else "-"
            tag = " [koreksi]" if t["is_correction"] else (f" [dikoreksi #{t['reversed_by_tx_id']}]" if t["reversed_by_tx_id"] else "")
            lines.append(
                f"\n<code>#{t['id']}</code> {sign}{format_rupiah(t['amount'])} "
                f"({POCKET_CONFIG.get(t['category'], {}).get('label', t['category'])}){tag}\n"
                f"{e(t['description'])}\n<i>{e(t['input_by'])} - {format_wib(parse_utc(t['created_at']))}</i>"
            )
        await reply(update, "\n".join(lines))

    async def tagihan(update, context):
        try:
            week = int(context.args[0].lower().lstrip("m")) if context.args else 1
        except ValueError:
            await reply(update, "Format: /tagihan [minggu], contoh /tagihan 3")
            return
        week = min(max(week, 1), 60)
        st = db.get_dues_status(class_id, week)
        lines = [f"<b>Iuran minggu ke-{week}</b>: {st['paid_count']}/{st['total_students']} lunas ({st['percentage']}%)"]
        if st["unpaid_students"]:
            lines.append("\n<b>Belum bayar:</b>")
            lines += [f"- {e(s['nama_resmi'])} (<code>{s['nis']}</code>)" for s in st["unpaid_students"]]
        else:
            lines.append("\nSemua sudah lunas.")
        await reply(update, "\n".join(lines))

    async def grafik(update, context):
        await update.effective_message.reply_photo(generate_financial_chart(db, class_id), caption=f"Alokasi kas {class_id}")

    async def excel(update, context):
        await update.effective_message.reply_document(
            generate_excel_report(db, class_id), filename=f"Laporan_Kas_{class_id}.xlsx"
        )

    async def daftar(update, context):
        if not context.args:
            await reply(update, "Format: /daftar NIS")
            return
        u = update.effective_user
        r = db.register_member(class_id, u.id, context.args[0], u.username or "")
        if r["success"]:
            await reply(update, f"Terdaftar sebagai <b>{e(r['nama'])}</b> ({e(r['role'])}).")
        else:
            await reply(update, e(r["error"]))

    async def notif(update, context):
        state = db.toggle_notif(update.effective_user.id, class_id)
        if state is None:
            await reply(update, "Daftar dulu dengan /daftar NIS.")
        else:
            await reply(update, "Notifikasi " + ("aktif." if state else "dimatikan."))

    async def klaim(update, context):
        msg = update.effective_message
        pin = context.args[0] if context.args else ""
        try:  # hapus pesan berisi PIN bila bot punya izin
            await msg.delete()
        except Exception:
            pass
        if not pin:
            await context.bot.send_message(update.effective_chat.id, "Format: /klaimbendahara PIN")
            return
        r = db.claim_bendahara(class_id, update.effective_user.id, pin, _name(update))
        text = f"Akses bendahara aktif untuk <b>{e(r['nama'])}</b>." if r["success"] else e(r["error"])
        await context.bot.send_message(update.effective_chat.id, text, parse_mode=H)

    async def _catat(update, context, tx_type: str):
        parsed = parse_transaction_args(" ".join(context.args))
        cmd = "/tambah" if tx_type == "in" else "/kurang"
        if not parsed["amount"] or not parsed["description"]:
            await reply(update, f"Format: <code>{cmd} 10k [pos] keterangan</code>")
            return
        u = update.effective_user
        r = db.record_transaction(class_id, tx_type, parsed["amount"], parsed["category"],
                                  parsed["description"], _name(update), u.id, "telegram")
        sign = "+" if tx_type == "in" else "-"
        await reply(update, f"Tercatat <code>#{r['tx_id']}</code> {sign}{format_rupiah(r['amount'])} "
                            f"({POCKET_CONFIG[r['category']]['label']})\nSaldo: <b>{format_rupiah(r['saldo_total'])}</b>")
        await notify(context, update, f"Kas {sign}{format_rupiah(r['amount'])}: {e(r['description'])}\n"
                                      f"Saldo: <b>{format_rupiah(r['saldo_total'])}</b>")

    async def tambah(update, context):
        await _catat(update, context, "in")

    async def kurang(update, context):
        await _catat(update, context, "out")

    async def bayar(update, context):
        if not context.args:
            await reply(update, "Format: /bayar NIS [minggu]")
            return
        try:
            week = int(context.args[1].lower().lstrip("m")) if len(context.args) > 1 else 1
        except ValueError:
            await reply(update, "Minggu harus angka.")
            return
        r = db.mark_dues_paid(class_id, context.args[0], week, _name(update), update.effective_user.id, "telegram")
        await reply(update, f"{e(r['nama'])} lunas minggu ke-{week} (<code>#{r['tx_id']}</code>).\n"
                            f"Saldo: <b>{format_rupiah(r['saldo_total'])}</b>")
        await notify(context, update, f"{e(r['nama'])} membayar kas minggu ke-{week}.")

    async def koreksi(update, context):
        if len(context.args) < 2 or not context.args[0].lstrip("#").isdigit():
            await reply(update, "Format: /koreksi ID alasan")
            return
        tx_id = int(context.args[0].lstrip("#"))
        r = db.reverse_transaction(class_id, tx_id, " ".join(context.args[1:]), _name(update),
                                   update.effective_user.id, "telegram")
        await reply(update, f"Transaksi <code>#{tx_id}</code> dikoreksi (<code>#{r['correction_id']}</code>).\n"
                            f"Saldo: <b>{format_rupiah(r['saldo_total'])}</b>")
        await notify(context, update, f"Koreksi transaksi #{tx_id}. Saldo: <b>{format_rupiah(r['saldo_total'])}</b>")

    async def on_error(update, context):
        log.exception("error handler", exc_info=context.error)
        if isinstance(update, Update) and update.effective_message:
            await update.effective_message.reply_text("Terjadi kesalahan. Coba lagi.")

    app = ApplicationBuilder().token(token).build()
    for name, fn in {
        "start": start, "help": start, "saldo": saldo, "alokasi": alokasi, "riwayat": riwayat,
        "tagihan": tagihan, "grafik": grafik, "excel": excel, "daftar": daftar, "notif": notif,
        "klaimbendahara": klaim,
        "tambah": bendahara_only(tambah), "kurang": bendahara_only(kurang),
        "bayar": bendahara_only(bayar), "koreksi": bendahara_only(koreksi),
    }.items():
        app.add_handler(CommandHandler(name, fn))
    app.add_error_handler(on_error)
    return app


def run_bot(db: CekasDB) -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")
    build_app(db).run_polling(drop_pending_updates=True)
