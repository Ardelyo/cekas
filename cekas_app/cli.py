"""
CEKAS Unified CLI Controller
Run Web Dashboard, Telegram Bot, Seeder, or Local Financial Operations.
"""

import sys
import argparse
from pathlib import Path

from .config import CLASS_ID, DB_PATH, POCKET_CONFIG
from .database import CekasDB
from .formatters import format_rupiah, parse_nominal, parse_transaction_args, format_wib
from .export_excel import generate_excel_report
from .generate_chart import generate_financial_chart

def get_db():
    db = CekasDB(DB_PATH)
    db.get_or_create_class(CLASS_ID)
    return db

def cmd_status():
    db = get_db()
    info = db.get_or_create_class(CLASS_ID)
    print("=" * 50)
    print(f"📊 STATUS KAS DIGITAL {CLASS_ID} - SMA KARTIKA XIX-1")
    print("=" * 50)
    print(f"💰 Total Saldo: {format_rupiah(info['saldo'])}")
    print("-" * 50)
    print("Pos Alokasi:")
    for k, meta in POCKET_CONFIG.items():
        val = info["alokasi"].get(k, 0)
        pct = (val / info["saldo"] * 100) if info["saldo"] > 0 else 0
        print(f"  {meta['icon']} {meta['label']:<20}: {format_rupiah(val):>14} ({pct:.1f}%)")
    print("=" * 50)

def cmd_seed():
    db = get_db()
    db.seed_initial_students(CLASS_ID)
    students = db.get_all_whitelist_students(CLASS_ID)
    print(f"✅ Berhasil mendaftarkan {len(students)} siswa ke whitelist kelas {CLASS_ID}.")

def cmd_export_excel(output_path="laporan_kas.xlsx"):
    db = get_db()
    stream = generate_excel_report(db, CLASS_ID)
    with open(output_path, "wb") as f:
        f.write(stream.read())
    print(f"✅ Laporan Excel tersimpan di: {output_path}")

def cmd_export_chart(output_path="grafik_kas.png"):
    db = get_db()
    stream = generate_financial_chart(db, CLASS_ID)
    with open(output_path, "wb") as f:
        f.write(stream.read())
    print(f"✅ Infografis tersimpan di: {output_path}")

def cmd_web(host="127.0.0.1", port=8000):
    import uvicorn
    from .web import app
    print(f"🚀 Menjalankan CEKAS Web Dashboard di http://{host}:{port}")
    uvicorn.run(app, host=host, port=port)

def main():
    parser = argparse.ArgumentParser(description="CEKAS Pure Python CLI")
    subparsers = parser.add_subparsers(dest="subcommand", help="Perintah yang tersedia")

    subparsers.add_parser("status", help="Tampilkan status saldo dan pos kas saat ini")
    subparsers.add_parser("seed", help="Inisialisasi data whitelist siswa")
    
    excel_p = subparsers.add_parser("export-excel", help="Ekspor laporan kas format Excel (.xlsx)")
    excel_p.add_argument("-o", "--output", default="laporan_kas.xlsx", help="Nama file output")

    chart_p = subparsers.add_parser("export-chart", help="Ekspor infografis format PNG")
    chart_p.add_argument("-o", "--output", default="grafik_kas.png", help="Nama file output")

    web_p = subparsers.add_parser("web", help="Jalankan Web Dashboard & Mini App")
    web_p.add_argument("--host", default="127.0.0.1", help="Host bind")
    web_p.add_argument("--port", type=int, default=8000, help="Port bind")

    args = parser.parse_args()

    if args.subcommand == "status":
        cmd_status()
    elif args.subcommand == "seed":
        cmd_seed()
    elif args.subcommand == "export-excel":
        cmd_export_excel(args.output)
    elif args.subcommand == "export-chart":
        cmd_export_chart(args.output)
    elif args.subcommand == "web":
        cmd_web(args.host, args.port)
    else:
        cmd_status()

if __name__ == "__main__":
    main()
