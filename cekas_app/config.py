"""
CEKAS Configuration & School Metadata
Consistent branding for XI-F2 SMA Kartika XIX-1 Bandung
"""

import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")
load_dotenv(BASE_DIR / "functions" / ".env")

# School & Branding Constants
CLASS_ID = os.getenv("CLASS_ID", "XI-F2")
CLASS_NAME = os.getenv("CLASS_NAME", f"Kelas {CLASS_ID} SMA Kartika XIX-1 Bandung")
SCHOOL_NAME = "SMA Kartika XIX-1 Bandung"
SCHOOL_YEAR = "2026/2027"
DEFAULT_PIN_BENDAHARA = os.getenv("PIN_BENDAHARA", "192837")
NOMINAL_IURAN_MINGGUAN = 10000

# Database Path
DB_PATH = os.getenv("CEKAS_DB_PATH", str(BASE_DIR / "cekas.db"))

# Telegram Bot Token (Optional if running in Web / CLI only mode)
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")

# Pocket Allocations Metadata
POCKET_CONFIG = {
    "operasional": {
        "key": "operasional",
        "label": "Operasional & KBM",
        "icon": "🧹",
        "color": "#10B981", # Emerald Mint
        "bg_color": "#ECFDF5",
        "border_color": "#A7F3D0",
        "description": "Pengadaan spidol, penghapus, alat kebersihan, cetak materi"
    },
    "sosial": {
        "key": "sosial",
        "label": "Sosial & Peduli",
        "icon": "🤝",
        "color": "#8B5CF6", # Lilac Violet
        "bg_color": "#F5F3FF",
        "border_color": "#DDD6FE",
        "description": "Santunan duka cita, jenguk teman sakit, bantuan siswa"
    },
    "event": {
        "key": "event",
        "label": "Acara & Kegiatan",
        "icon": "🎪",
        "color": "#F97316", # Peach Orange
        "bg_color": "#FFF7ED",
        "border_color": "#FED7AA",
        "description": "Class meeting, buka bersama, pentas seni, dekorasi panggung"
    },
    "cadangan": {
        "key": "cadangan",
        "label": "Dana Cadangan",
        "icon": "🛡️",
        "color": "#0284C7", # Sky Blue
        "bg_color": "#F0F9FF",
        "border_color": "#BAE6FD",
        "description": "Dana darurat kelas tak terduga dan tabungan akhir semester"
    }
}
