"""
CEKAS Chart & Infographic Generator
Generates clean financial visual cards matching CEKAS Navy & Pastel branding.
100% offline, pure Python with Matplotlib.
"""

from io import BytesIO
import matplotlib
matplotlib.use("Agg") # Non-interactive backend
import matplotlib.pyplot as plt

from .database import CekasDB
from .formatters import format_rupiah
from .config import CLASS_ID, CLASS_NAME, POCKET_CONFIG

def generate_financial_chart(db: CekasDB, class_id: str = CLASS_ID) -> BytesIO:
    cls_info = db.get_or_create_class(class_id)
    saldo_total = cls_info["saldo"]
    alokasi = cls_info["alokasi"]

    labels = []
    sizes = []
    colors = []
    
    for p_key, meta in POCKET_CONFIG.items():
        val = max(alokasi.get(p_key, 0), 0)
        labels.append(f"{meta['label']}\n{format_rupiah(val)}")
        sizes.append(val)
        colors.append(meta["color"])

    if sum(sizes) == 0:
        sizes = [1, 1, 1, 1]
        labels = [f"{m['label']}\n(Rp 0)" for m in POCKET_CONFIG.values()]

    plt.style.use("fast")
    fig, ax = plt.subplots(figsize=(8, 5.5), facecolor="#FFFFFF")
    ax.set_facecolor("#FFFFFF")

    # Donut chart with white canvas and subtle pastel wedges
    wedges, texts, autotexts = ax.pie(
        sizes,
        labels=labels,
        colors=colors,
        autopct="%1.1f%%",
        pctdistance=0.75,
        startangle=140,
        textprops={"color": "#1E293B", "fontsize": 9, "weight": "bold"},
        wedgeprops={"width": 0.45, "edgecolor": "#FFFFFF", "linewidth": 3}
    )

    for at in autotexts:
        at.set_color("#FFFFFF")
        at.set_fontsize(10)
        at.set_weight("bold")

    center_text = f"TOTAL SALDO\n{format_rupiah(saldo_total)}"
    ax.text(
        0, 0, center_text,
        horizontalalignment="center",
        verticalalignment="center",
        fontsize=12,
        weight="bold",
        color="#0F172A"
    )

    plt.title(
        f"ALOKASI POS KEUANGAN KAS {class_id}\nSMA Kartika XIX-1 Bandung",
        color="#0F172A",
        fontsize=14,
        weight="bold",
        pad=20
    )

    plt.tight_layout()
    output = BytesIO()
    plt.savefig(output, format="png", dpi=200, facecolor=fig.get_facecolor(), edgecolor="none")
    plt.close(fig)
    output.seek(0)
    return output
