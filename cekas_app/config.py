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

# Pocket Allocations Metadata (White & Pastel Aesthetic)
POCKET_CONFIG = {
    "operasional": {
        "key": "operasional",
        "label": "Operasional & KBM",
        "icon": "🧹",
        "color": "#10B981", # Emerald
        "pastel_bg": "#DCFCE7", # Light Mint
        "pastel_border": "#86EFAC",
        "text_color": "#065F46",
        "description": "Spidol, penghapus, sapu pel, cetak materi"
    },
    "sosial": {
        "key": "sosial",
        "label": "Sosial & Peduli",
        "icon": "🤝",
        "color": "#8B5CF6", # Violet
        "pastel_bg": "#EDE9FE", # Light Lilac
        "pastel_border": "#C4B5FD",
        "text_color": "#5B21B6",
        "description": "Jenguk kawan sakit, santunan duka cita"
    },
    "event": {
        "key": "event",
        "label": "Acara & Kegiatan",
        "icon": "🎪",
        "color": "#F97316", # Orange
        "pastel_bg": "#FFEDD5", # Light Peach
        "pastel_border": "#FDBA74",
        "text_color": "#9A3412",
        "description": "Class meeting, buka puasa bersama, pentas seni"
    },
    "cadangan": {
        "key": "cadangan",
        "label": "Dana Cadangan",
        "icon": "🛡️",
        "color": "#0284C7", # Sky
        "pastel_bg": "#E0F2FE", # Light Sky
        "pastel_border": "#7DD3FC",
        "text_color": "#075985",
        "description": "Dana darurat kelas dan tabungan akhir semester"
    }
}
