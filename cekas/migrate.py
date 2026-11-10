"""Migrasi data CEKAS versi lama (Firestore) ke SQLite.

Dua sumber data:
  * REST API Firestore (butuh akses baca publik, sesuai firestore.rules lama), atau
  * berkas JSON hasil ekspor (`cekas migrate --dari berkas.json`).

Hasil migrasi diverifikasi: saldo dihitung ulang dari ledger lalu dibandingkan
dengan saldo di Firestore. Selisih dilaporkan, tidak disembunyikan.
"""

from __future__ import annotations

import json
import re
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from .config import POCKET_CONFIG
from .database import ROLES, CekasDB, CekasError, utc_now

REST = "https://firestore.googleapis.com/v1/projects/{project}/databases/(default)/documents/{path}"


# --------------------------------------------------------------- sumber REST
def _decode(value: Dict[str, Any]) -> Any:
    (kind, raw), = value.items()
    if kind == "nullValue":
        return None
    if kind == "integerValue":
        return int(raw)
    if kind == "doubleValue":
        return float(raw)
    if kind == "mapValue":
        return {k: _decode(v) for k, v in raw.get("fields", {}).items()}
    if kind == "arrayValue":
        return [_decode(v) for v in raw.get("values", [])]
    return raw  # string, boolean, timestamp (tetap string ISO), dll.


def _decode_doc(doc: Dict[str, Any]) -> Dict[str, Any]:
    out = {k: _decode(v) for k, v in doc.get("fields", {}).items()}
    out["_id"] = doc["name"].rsplit("/", 1)[-1]
    return out


def _get(url: str) -> Dict[str, Any]:
    try:
        with urllib.request.urlopen(url, timeout=30) as resp:
            return json.load(resp)
    except urllib.error.HTTPError as exc:
        raise CekasError(f"Firestore menolak permintaan (HTTP {exc.code}): {url}") from exc
    except urllib.error.URLError as exc:
        raise CekasError(f"Tidak dapat menghubungi Firestore: {exc.reason}") from exc


def fetch_firestore(project: str, class_id: str) -> Dict[str, Any]:
    base = f"classes/{urllib.parse.quote(class_id)}"
    snap: Dict[str, Any] = {"class": _decode_doc(_get(REST.format(project=project, path=base)))}
    for sub in ("transactions", "members", "whitelist_students", "dues"):
        docs: List[Dict[str, Any]] = []
        token: Optional[str] = None
        while True:
            q = "pageSize=300" + (f"&pageToken={urllib.parse.quote(token)}" if token else "")
            try:
                page = _get(REST.format(project=project, path=f"{base}/{sub}") + "?" + q)
            except CekasError:
                if sub in ("members", "dues"):  # boleh tidak terbaca
                    break
                raise
            docs += [_decode_doc(d) for d in page.get("documents", [])]
            token = page.get("nextPageToken")
            if not token:
                break
        snap[sub] = docs
    return snap


# --------------------------------------------------------------------- impor
def _iso(ts: Any) -> str:
    """Normalkan timestamp Firestore/ISO ke ISO-8601 UTC detik."""
    if not ts:
        return utc_now()
    s = str(ts).replace("Z", "+00:00")
    s = re.sub(r"(\.\d{6})\d+", r"\1", s)  # nanodetik -> mikrodetik
    try:
        dt = datetime.fromisoformat(s)
    except ValueError:
        return utc_now()
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc).isoformat(timespec="seconds")


def _role(raw: Any) -> str:
    raw = str(raw or "siswa")
    if raw in ROLES:
        return raw
    return "bendahara" if raw in ("admin", "ketua") else "siswa"


def import_snapshot(db: CekasDB, snap: Dict[str, Any], class_id: str, replace: bool = False) -> Dict[str, Any]:
    """Impor snapshot ke SQLite dalam satu transaksi atomik. Mengembalikan laporan."""
    src = snap.get("class") or {}
    txs = sorted(snap.get("transactions", []), key=lambda t: (_iso(t.get("timestamp")), t.get("_id", "")))
    report: Dict[str, Any] = {"warnings": []}

    db.get_or_create_class(class_id)
    with db._tx() as cur:
        has_data = cur.execute("SELECT COUNT(*) FROM transactions WHERE class_id = ?", (class_id,)).fetchone()[0]
        if has_data and not replace:
            raise CekasError(
                f"Database sudah berisi {has_data} transaksi untuk kelas {class_id}. "
                "Gunakan --ganti untuk menimpa (data lama dihapus)."
            )
        if replace:
            for table in ("transactions", "weekly_dues", "members", "whitelist_students"):
                cur.execute(f"DELETE FROM {table} WHERE class_id = ?", (class_id,))

        # kelas
        updates = {"nama": src.get("nama"), "tahun_ajaran": src.get("tahun_ajaran"),
                   "pin_bendahara": src.get("pinBendahara"), "nominal_iuran": src.get("nominalIuranMingguan")}
        for col, val in updates.items():
            if val not in (None, ""):
                cur.execute(f"UPDATE classes SET {col} = ? WHERE id = ?", (val, class_id))

        # roster
        for s in snap.get("whitelist_students", []):
            nis = str(s.get("nis") or s["_id"]).strip()
            cur.execute(
                "INSERT OR REPLACE INTO whitelist_students (class_id, nis, nama_resmi, role) VALUES (?,?,?,?)",
                (class_id, nis, s.get("namaResmi") or s.get("nama") or nis, _role(s.get("role"))),
            )

        # anggota Telegram
        seen = set()
        for m in snap.get("members", []):
            tid = m.get("telegramId")
            if not tid or int(tid) in seen:
                continue
            seen.add(int(tid))
            cur.execute(
                "INSERT INTO members (class_id, telegram_id, nama, nis, role, username, notif_enabled, registered_at)"
                " VALUES (?,?,?,?,?,?,?,?)",
                (class_id, int(tid), m.get("nama") or str(tid), m.get("nis"), _role(m.get("role")),
                 m.get("username") or "", 0 if m.get("notifAktif") is False else 1, _iso(m.get("registeredAt"))),
            )

        # ledger (urut kronologis; id baru berurutan)
        idmap: Dict[str, int] = {}
        for t in txs:
            ttype = t.get("type")
            amount = int(t.get("amount") or 0)
            if ttype not in ("in", "out") or amount <= 0:
                report["warnings"].append(f"Transaksi {t.get('_id')} dilewati (tipe/nominal tidak valid).")
                continue
            cat = t.get("category") if t.get("category") in POCKET_CONFIG else "operasional"
            cur.execute(
                "INSERT INTO transactions (class_id, type, amount, category, description, input_by, telegram_id,"
                " source, student_nis, due_week, is_correction, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
                (class_id, ttype, amount, cat, (t.get("description") or "(tanpa keterangan)").strip(),
                 t.get("inputBy") or "Anonim", t.get("telegramId"), "migrasi", t.get("studentNis"),
                 t.get("dueWeek"), 1 if t.get("isCorrection") else 0, _iso(t.get("timestamp"))),
            )
            idmap[t["_id"]] = cur.lastrowid
        for t in txs:  # relasi koreksi (butuh peta id lengkap)
            me = idmap.get(t.get("_id"))
            if not me:
                continue
            if t.get("correctedTxId") in idmap:
                cur.execute("UPDATE transactions SET corrects_tx_id = ? WHERE id = ?", (idmap[t["correctedTxId"]], me))
            if t.get("correctionTxId") in idmap:
                cur.execute("UPDATE transactions SET reversed_by_tx_id = ? WHERE id = ?", (idmap[t["correctionTxId"]], me))

        # iuran: hanya yang transaksinya belum dikoreksi
        dues = 0
        for d in snap.get("dues", []):
            tx_new = idmap.get(d.get("txId"))
            if not d.get("paid") or not tx_new or not d.get("nis") or not d.get("week"):
                continue
            if cur.execute("SELECT reversed_by_tx_id FROM transactions WHERE id = ?", (tx_new,)).fetchone()[0]:
                continue
            cur.execute(
                "INSERT OR REPLACE INTO weekly_dues (class_id, nis, week_num, tx_id, paid_at) VALUES (?,?,?,?,?)",
                (class_id, str(d["nis"]), int(d["week"]), tx_new, _iso(d.get("paidAt"))),
            )
            dues += 1

        # saldo dihitung ulang dari ledger
        total, pocket = 0, {k: 0 for k in POCKET_CONFIG}
        for r in cur.execute("SELECT type, amount, category FROM transactions WHERE class_id = ?", (class_id,)):
            d = r["amount"] if r["type"] == "in" else -r["amount"]
            total += d
            pocket[r["category"]] += d
        db._store_balances(cur, class_id, total, pocket)
        db._audit(cur, class_id, "migrasi", "sistem", f"{len(idmap)} transaksi, {dues} iuran")

    src_saldo = src.get("saldo")
    report.update(
        transaksi=len(idmap), iuran=dues, anggota=len(seen), siswa=len(snap.get("whitelist_students", [])),
        saldo_baru=total, saldo_sumber=src_saldo,
        saldo_cocok=(src_saldo is None or int(src_saldo) == total),
    )
    if not report["saldo_cocok"]:
        report["warnings"].append(
            f"Saldo sumber ({src_saldo}) berbeda dari hasil hitung ledger ({total}). Periksa data sumber."
        )
    report["integritas_ok"] = db.verify_integrity(class_id)["ok"]
    return report


def import_json_file(db: CekasDB, path: str, class_id: str, replace: bool = False) -> Dict[str, Any]:
    with open(path, encoding="utf-8") as fh:
        snap = json.load(fh)
    return import_snapshot(db, snap, class_id, replace)
