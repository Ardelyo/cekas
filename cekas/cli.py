"""CLI CEKAS: python -m cekas <perintah>"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from .config import CLASS_ID, DB_PATH, POCKET_CONFIG
from .database import CekasDB, CekasError
from .formatters import format_rupiah

DEFAULT_CSV = Path(__file__).resolve().parent.parent / "data" / "siswa_contoh.csv"


def _db() -> CekasDB:
    db = CekasDB(DB_PATH)
    db.get_or_create_class(CLASS_ID)
    return db


def cmd_status(args) -> int:
    info = _db().get_or_create_class(CLASS_ID)
    print(f"Kas {CLASS_ID}: {format_rupiah(info['saldo'])}")
    for k, m in POCKET_CONFIG.items():
        print(f"  {m['label']:<20} {format_rupiah(info['alokasi'][k]):>14}")
    return 0


def cmd_seed(args) -> int:
    n = _db().import_students_csv(CLASS_ID, args.csv)
    print(f"{n} siswa dimuat dari {args.csv}")
    return 0


def cmd_web(args) -> int:
    import uvicorn

    from .web import create_app

    uvicorn.run(create_app(_db()), host=args.host, port=args.port)
    return 0


def cmd_bot(args) -> int:
    from .bot import run_bot

    run_bot(_db())
    return 0


def cmd_excel(args) -> int:
    from .export_excel import generate_excel_report

    Path(args.output).write_bytes(generate_excel_report(_db(), CLASS_ID).read())
    print(f"Tersimpan: {args.output}")
    return 0


def cmd_chart(args) -> int:
    from .chart import generate_financial_chart

    Path(args.output).write_bytes(generate_financial_chart(_db(), CLASS_ID).read())
    print(f"Tersimpan: {args.output}")
    return 0


def cmd_cek(args) -> int:
    r = _db().verify_integrity(CLASS_ID)
    print("Integritas OK" if r["ok"] else f"TIDAK COCOK: tersimpan {r['stored_saldo']} vs hitung ulang {r['calculated_saldo']}")
    if not r["ok"] and args.perbaiki:
        _db().recalculate_balances(CLASS_ID)
        print("Saldo dihitung ulang dari ledger.")
    return 0 if r["ok"] else 1


def cmd_migrate(args) -> int:
    from .migrate import fetch_firestore, import_json_file, import_snapshot

    db = _db()
    if args.dari:
        rep = import_json_file(db, args.dari, CLASS_ID, args.ganti)
    else:
        rep = import_snapshot(db, fetch_firestore(args.project, CLASS_ID), CLASS_ID, args.ganti)
    for k in ("siswa", "anggota", "transaksi", "iuran", "saldo_sumber", "saldo_baru", "saldo_cocok", "integritas_ok"):
        print(f"{k:>14}: {rep[k]}")
    for w in rep["warnings"]:
        print("PERINGATAN:", w)
    return 0 if rep["saldo_cocok"] and rep["integritas_ok"] else 2


def main(argv=None) -> int:
    p = argparse.ArgumentParser(prog="cekas", description="CEKAS - Catatan Keuangan Kelas")
    sub = p.add_subparsers(dest="cmd")
    sub.add_parser("status", help="tampilkan saldo").set_defaults(fn=cmd_status)
    s = sub.add_parser("seed", help="muat daftar siswa dari CSV"); s.add_argument("--csv", default=str(DEFAULT_CSV)); s.set_defaults(fn=cmd_seed)
    s = sub.add_parser("web", help="jalankan dashboard web"); s.add_argument("--host", default="127.0.0.1"); s.add_argument("--port", type=int, default=8000); s.set_defaults(fn=cmd_web)
    sub.add_parser("bot", help="jalankan bot Telegram").set_defaults(fn=cmd_bot)
    s = sub.add_parser("export-excel"); s.add_argument("-o", "--output", default="laporan_kas.xlsx"); s.set_defaults(fn=cmd_excel)
    s = sub.add_parser("export-chart"); s.add_argument("-o", "--output", default="grafik_kas.png"); s.set_defaults(fn=cmd_chart)
    s = sub.add_parser("cek", help="verifikasi saldo terhadap ledger"); s.add_argument("--perbaiki", action="store_true"); s.set_defaults(fn=cmd_cek)
    s = sub.add_parser("migrate", help="impor data lama dari Firestore")
    s.add_argument("--dari", help="berkas JSON ekspor (jika tidak diisi, baca langsung dari Firestore)")
    s.add_argument("--project", default="gemma4good-494311", help="ID project Firebase")
    s.add_argument("--ganti", action="store_true", help="timpa data kelas yang sudah ada")
    s.set_defaults(fn=cmd_migrate)
    args = p.parse_args(argv)
    if not getattr(args, "fn", None):
        args = p.parse_args(["status"])
    try:
        return args.fn(args)
    except CekasError as exc:
        print(f"Gagal: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
