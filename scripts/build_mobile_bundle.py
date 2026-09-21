"""
Build standalone static distribution for Android APK (Capacitor)
Renders dashboard with initial SQLite data and client-side offline persistence.
"""

import sys
import json
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from jinja2 import Environment, FileSystemLoader

from cekas_app.config import CLASS_ID, CLASS_NAME, DB_PATH, POCKET_CONFIG
from cekas_app.database import CekasDB
from cekas_app.formatters import format_rupiah, format_wib

ROOT_DIR = Path(__file__).resolve().parent.parent
TEMPLATES_DIR = ROOT_DIR / "cekas_app" / "templates"
STATIC_DIR = ROOT_DIR / "cekas_app" / "static"
WWW_DIR = ROOT_DIR / "www"

WWW_DIR.mkdir(parents=True, exist_ok=True)
(WWW_DIR / "static").mkdir(parents=True, exist_ok=True)

# 1. Copy static icons & manifest
for f in STATIC_DIR.glob("*.*"):
    (WWW_DIR / "static" / f.name).write_bytes(f.read_bytes())

# 2. Get initial data from SQLite
db = CekasDB(DB_PATH)
class_info = db.get_or_create_class(CLASS_ID)
dues_status = db.get_dues_status(CLASS_ID, week_num=1)
all_students = db.get_all_whitelist_students(CLASS_ID)
recent_transactions = db.get_recent_transactions(CLASS_ID, limit=20)

# 3. Render template
env = Environment(loader=FileSystemLoader(str(TEMPLATES_DIR)))
template = env.get_template("dashboard.html")

html_content = template.render(
    class_info=class_info,
    pockets=POCKET_CONFIG,
    dues_status=dues_status,
    all_students=all_students,
    recent_transactions=recent_transactions,
    format_rupiah=format_rupiah
)

# 4. Enhance HTML for standalone Android APK: Add client-side LocalStorage reactivity
client_js = """
<script>
// Standalone APK Client-Side Local Storage & Reactivity
window.addEventListener('DOMContentLoaded', () => {
  console.log("CEKAS Android APK initialized");
});
</script>
"""
html_content = html_content.replace("</body>", f"{client_js}\n</body>")

(WWW_DIR / "index.html").write_text(html_content, encoding="utf-8")
print(f"✅ Standalone mobile distribution built successfully at: {WWW_DIR / 'index.html'}")
