"""Konfigurasi CEKAS. Semua nilai dapat diubah lewat variabel lingkungan atau file .env."""

import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

CLASS_ID = os.getenv("CLASS_ID", "XI-F2")
CLASS_NAME = os.getenv("CLASS_NAME", f"Kelas {CLASS_ID} SMA Kartika XIX-1 Bandung")
SCHOOL_NAME = "SMA Kartika XIX-1 Bandung"
SCHOOL_YEAR = os.getenv("SCHOOL_YEAR", "2026/2027")
DEFAULT_PIN_BENDAHARA = os.getenv("PIN_BENDAHARA", "192837")
NOMINAL_IURAN_MINGGUAN = int(os.getenv("NOMINAL_IURAN", "10000"))

DB_PATH = os.getenv("CEKAS_DB_PATH", str(BASE_DIR / "cekas.db"))
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
# Kunci penandatangan cookie login web. Jika kosong, dibuat acak per proses
# (login web hangus setiap server restart).
SECRET_KEY = os.getenv("CEKAS_SECRET_KEY", "")

POCKET_CONFIG = {
    "operasional": {
        "label": "Operasional & KBM",
        "color": "#10B981",
        "description": "Spidol, penghapus, sapu pel, cetak materi",
    },
    "sosial": {
        "label": "Sosial & Peduli",
        "color": "#8B5CF6",
        "description": "Jenguk kawan sakit, santunan duka cita",
    },
    "event": {
        "label": "Acara & Kegiatan",
        "color": "#F97316",
        "description": "Class meeting, buka puasa bersama, pentas seni",
    },
    "cadangan": {
        "label": "Dana Cadangan",
        "color": "#0284C7",
        "description": "Dana darurat kelas dan tabungan akhir semester",
    },
}
BENDAHARA_ROLES = ("bendahara",)
