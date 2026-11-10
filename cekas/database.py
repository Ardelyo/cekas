"""Lapisan database CEKAS: SQLite (WAL), ledger append-only, RBAC, dan iuran mingguan."""

from __future__ import annotations

import csv
import hmac
import json
import sqlite3
import threading
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterator, List, Optional

from .config import (
    BENDAHARA_ROLES,
    CLASS_ID,
    CLASS_NAME,
    DEFAULT_PIN_BENDAHARA,
    NOMINAL_IURAN_MINGGUAN,
    POCKET_CONFIG,
    SCHOOL_YEAR,
)

ROLES = ("siswa", "bendahara", "wali_kelas")
TX_TYPES = ("in", "out")

SCHEMA = """
CREATE TABLE IF NOT EXISTS classes (
    id TEXT PRIMARY KEY,
    nama TEXT NOT NULL,
    tahun_ajaran TEXT NOT NULL,
    saldo INTEGER NOT NULL DEFAULT 0,
    alokasi TEXT NOT NULL,
    pin_bendahara TEXT NOT NULL,
    nominal_iuran INTEGER NOT NULL DEFAULT 10000,
    updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS whitelist_students (
    class_id TEXT NOT NULL,
    nis TEXT NOT NULL,
    nama_resmi TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'siswa',
    PRIMARY KEY (class_id, nis)
);
CREATE TABLE IF NOT EXISTS members (
    class_id TEXT NOT NULL,
    telegram_id INTEGER NOT NULL,
    nama TEXT NOT NULL,
    nis TEXT,
    role TEXT NOT NULL DEFAULT 'siswa',
    username TEXT,
    notif_enabled INTEGER NOT NULL DEFAULT 1,
    registered_at TEXT NOT NULL,
    PRIMARY KEY (class_id, telegram_id)
);
CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('in','out')),
    amount INTEGER NOT NULL CHECK (amount > 0),
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    input_by TEXT NOT NULL,
    telegram_id INTEGER,
    source TEXT NOT NULL DEFAULT 'cli',
    student_nis TEXT,
    due_week INTEGER,
    is_correction INTEGER NOT NULL DEFAULT 0,
    corrects_tx_id INTEGER,
    reversed_by_tx_id INTEGER,
    created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tx_class ON transactions (class_id, id);
CREATE TABLE IF NOT EXISTS weekly_dues (
    class_id TEXT NOT NULL,
    nis TEXT NOT NULL,
    week_num INTEGER NOT NULL,
    tx_id INTEGER NOT NULL,
    paid_at TEXT NOT NULL,
    PRIMARY KEY (class_id, nis, week_num)
);
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id TEXT NOT NULL,
    action TEXT NOT NULL,
    actor TEXT NOT NULL,
    detail TEXT NOT NULL,
    created_at TEXT NOT NULL
);
"""


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


class CekasError(ValueError):
    """Kesalahan bisnis yang aman ditampilkan ke pengguna."""


class CekasDB:
    def __init__(self, db_path: str = ":memory:"):
        self.db_path = db_path
        self._lock = threading.RLock()
        self.conn = sqlite3.connect(db_path, check_same_thread=False, isolation_level=None)
        self.conn.row_factory = sqlite3.Row
        self.conn.execute("PRAGMA foreign_keys=ON")
        if db_path != ":memory:":
            self.conn.execute("PRAGMA journal_mode=WAL")
        self.conn.executescript(SCHEMA)

    # ------------------------------------------------------------------ util
    @contextmanager
    def _tx(self) -> Iterator[sqlite3.Cursor]:
        """Transaksi atomik: semua berhasil atau semua dibatalkan."""
        with self._lock:
            cur = self.conn.cursor()
            cur.execute("BEGIN IMMEDIATE")
            try:
                yield cur
            except BaseException:
                self.conn.execute("ROLLBACK")
                raise
            else:
                self.conn.execute("COMMIT")

    def close(self) -> None:
        self.conn.close()

    def _audit(self, cur: sqlite3.Cursor, class_id: str, action: str, actor: str, detail: str) -> None:
        cur.execute(
            "INSERT INTO audit_logs (class_id, action, actor, detail, created_at) VALUES (?,?,?,?,?)",
            (class_id, action, actor, detail, utc_now()),
        )

    # ----------------------------------------------------------------- kelas
    def get_or_create_class(self, class_id: str = CLASS_ID) -> Dict[str, Any]:
        with self._lock:
            row = self.conn.execute("SELECT * FROM classes WHERE id = ?", (class_id,)).fetchone()
            if row is None:
                with self._tx() as cur:
                    cur.execute(
                        "INSERT INTO classes (id, nama, tahun_ajaran, saldo, alokasi, pin_bendahara,"
                        " nominal_iuran, updated_at) VALUES (?,?,?,0,?,?,?,?)",
                        (
                            class_id,
                            CLASS_NAME,
                            SCHOOL_YEAR,
                            json.dumps({k: 0 for k in POCKET_CONFIG}),
                            DEFAULT_PIN_BENDAHARA,
                            NOMINAL_IURAN_MINGGUAN,
                            utc_now(),
                        ),
                    )
                row = self.conn.execute("SELECT * FROM classes WHERE id = ?", (class_id,)).fetchone()
        data = dict(row)
        alokasi = json.loads(data["alokasi"])
        data["alokasi"] = {k: int(alokasi.get(k, 0)) for k in POCKET_CONFIG}
        return data

    def verify_pin(self, class_id: str, pin: str) -> bool:
        stored = self.get_or_create_class(class_id)["pin_bendahara"]
        return hmac.compare_digest(str(pin).strip().encode(), str(stored).strip().encode())

    # ---------------------------------------------------------------- roster
    def upsert_student(self, class_id: str, nis: str, nama: str, role: str = "siswa") -> None:
        nis, nama = str(nis).strip(), str(nama).strip()
        if not nis or not nama:
            raise CekasError("NIS dan nama wajib diisi.")
        if role not in ROLES:
            raise CekasError(f"Role '{role}' tidak valid. Pilihan: {', '.join(ROLES)}.")
        with self._tx() as cur:
            cur.execute(
                "INSERT INTO whitelist_students (class_id, nis, nama_resmi, role) VALUES (?,?,?,?)"
                " ON CONFLICT(class_id, nis) DO UPDATE SET nama_resmi=excluded.nama_resmi, role=excluded.role",
                (class_id, nis, nama, role),
            )

    def import_students_csv(self, class_id: str, path: str) -> int:
        count = 0
        with open(path, newline="", encoding="utf-8-sig") as fh:
            for row in csv.DictReader(fh):
                self.upsert_student(class_id, row["nis"], row["nama_resmi"], (row.get("role") or "siswa").strip())
                count += 1
        return count

    def get_whitelist_student(self, class_id: str, nis: str) -> Optional[Dict[str, Any]]:
        row = self.conn.execute(
            "SELECT * FROM whitelist_students WHERE class_id = ? AND nis = ?", (class_id, str(nis).strip())
        ).fetchone()
        return dict(row) if row else None

    def get_all_whitelist_students(self, class_id: str = CLASS_ID) -> List[Dict[str, Any]]:
        rows = self.conn.execute(
            "SELECT * FROM whitelist_students WHERE class_id = ? ORDER BY nama_resmi COLLATE NOCASE", (class_id,)
        ).fetchall()
        return [dict(r) for r in rows]

    # --------------------------------------------------------------- anggota
    def register_member(self, class_id: str, telegram_id: int, nis: str, username: str = "") -> Dict[str, Any]:
        wl = self.get_whitelist_student(class_id, nis)
        if not wl:
            return {"success": False, "error": f"NIS {nis} tidak terdaftar di whitelist resmi kelas."}
        with self._tx() as cur:
            taken = cur.execute(
                "SELECT telegram_id FROM members WHERE class_id = ? AND nis = ? AND telegram_id != ?",
                (class_id, wl["nis"], telegram_id),
            ).fetchone()
            if taken:
                return {"success": False, "error": f"NIS {nis} sudah dipakai akun Telegram lain."}
            existing = cur.execute(
                "SELECT role FROM members WHERE class_id = ? AND telegram_id = ?", (class_id, telegram_id)
            ).fetchone()
            # Siswa tidak boleh menaikkan rolenya sendiri; role mengikuti whitelist,
            # tetapi klaim bendahara via PIN yang sudah ada dipertahankan.
            role = wl["role"]
            if existing and existing["role"] in BENDAHARA_ROLES:
                role = existing["role"]
            cur.execute(
                "INSERT INTO members (class_id, telegram_id, nama, nis, role, username, notif_enabled, registered_at)"
                " VALUES (?,?,?,?,?,?,1,?)"
                " ON CONFLICT(class_id, telegram_id) DO UPDATE SET nama=excluded.nama, nis=excluded.nis,"
                " role=?, username=excluded.username",
                (class_id, telegram_id, wl["nama_resmi"], wl["nis"], role, username or "", utc_now(), role),
            )
            self._audit(cur, class_id, "register", str(telegram_id), f"NIS {wl['nis']} -> {role}")
        return {"success": True, "nama": wl["nama_resmi"], "role": role, "nis": wl["nis"]}

    def get_member(self, telegram_id: int, class_id: str = CLASS_ID) -> Optional[Dict[str, Any]]:
        row = self.conn.execute(
            "SELECT * FROM members WHERE class_id = ? AND telegram_id = ?", (class_id, telegram_id)
        ).fetchone()
        return dict(row) if row else None

    def is_bendahara(self, telegram_id: int, class_id: str = CLASS_ID) -> bool:
        m = self.get_member(telegram_id, class_id)
        return bool(m and m["role"] in BENDAHARA_ROLES)

    def claim_bendahara(self, class_id: str, telegram_id: int, pin: str, display_name: str = "Bendahara") -> Dict[str, Any]:
        if not self.verify_pin(class_id, pin):
            with self._tx() as cur:
                self._audit(cur, class_id, "claim_gagal", str(telegram_id), "PIN salah")
            return {"success": False, "error": "PIN Bendahara tidak valid!"}
        with self._tx() as cur:
            row = cur.execute(
                "SELECT nama FROM members WHERE class_id = ? AND telegram_id = ?", (class_id, telegram_id)
            ).fetchone()
            if row:
                cur.execute(
                    "UPDATE members SET role='bendahara' WHERE class_id = ? AND telegram_id = ?",
                    (class_id, telegram_id),
                )
                nama = row["nama"]
            else:
                nama = display_name
                cur.execute(
                    "INSERT INTO members (class_id, telegram_id, nama, role, notif_enabled, registered_at)"
                    " VALUES (?,?,?,'bendahara',1,?)",
                    (class_id, telegram_id, nama, utc_now()),
                )
            self._audit(cur, class_id, "claim_bendahara", str(telegram_id), nama)
        return {"success": True, "nama": nama}

    def toggle_notif(self, telegram_id: int, class_id: str = CLASS_ID, state: Optional[bool] = None) -> Optional[bool]:
        with self._tx() as cur:
            row = cur.execute(
                "SELECT notif_enabled FROM members WHERE class_id = ? AND telegram_id = ?", (class_id, telegram_id)
            ).fetchone()
            if not row:
                return None
            new_val = (not bool(row["notif_enabled"])) if state is None else state
            cur.execute(
                "UPDATE members SET notif_enabled = ? WHERE class_id = ? AND telegram_id = ?",
                (1 if new_val else 0, class_id, telegram_id),
            )
        return new_val

    def get_notif_recipients(self, class_id: str = CLASS_ID, exclude: Optional[int] = None) -> List[int]:
        rows = self.conn.execute(
            "SELECT telegram_id FROM members WHERE class_id = ? AND notif_enabled = 1", (class_id,)
        ).fetchall()
        return [r["telegram_id"] for r in rows if r["telegram_id"] != exclude]

    # ------------------------------------------------------------- transaksi
    def _load_balances(self, cur: sqlite3.Cursor, class_id: str):
        row = cur.execute("SELECT saldo, alokasi FROM classes WHERE id = ?", (class_id,)).fetchone()
        if not row:
            raise CekasError("Data kelas tidak ditemukan.")
        alokasi = json.loads(row["alokasi"])
        return int(row["saldo"]), {k: int(alokasi.get(k, 0)) for k in POCKET_CONFIG}

    def _store_balances(self, cur: sqlite3.Cursor, class_id: str, saldo: int, alokasi: Dict[str, int]) -> None:
        cur.execute(
            "UPDATE classes SET saldo = ?, alokasi = ?, updated_at = ? WHERE id = ?",
            (saldo, json.dumps(alokasi), utc_now(), class_id),
        )

    def _apply(
        self,
        cur: sqlite3.Cursor,
        class_id: str,
        tx_type: str,
        amount: int,
        category: str,
        description: str,
        input_by: str,
        telegram_id: Optional[int],
        source: str,
        student_nis: Optional[str] = None,
        due_week: Optional[int] = None,
        corrects_tx_id: Optional[int] = None,
    ) -> Dict[str, Any]:
        if tx_type not in TX_TYPES:
            raise CekasError(f"Tipe transaksi '{tx_type}' tidak valid.")
        if not isinstance(amount, int) or amount <= 0:
            raise CekasError("Nominal transaksi harus bilangan bulat lebih dari 0.")
        if category not in POCKET_CONFIG:
            raise CekasError(f"Pos '{category}' tidak dikenal.")
        description = (description or "").strip()
        if not description:
            raise CekasError("Keterangan transaksi tidak boleh kosong.")

        saldo, alokasi = self._load_balances(cur, class_id)
        delta = amount if tx_type == "in" else -amount
        if alokasi[category] + delta < 0:
            raise CekasError(
                f"Saldo pos {POCKET_CONFIG[category]['label']} tidak cukup "
                f"(tersisa Rp {alokasi[category]:,}).".replace(",", ".")
            )
        saldo += delta
        alokasi[category] += delta
        cur.execute(
            "INSERT INTO transactions (class_id, type, amount, category, description, input_by, telegram_id,"
            " source, student_nis, due_week, is_correction, corrects_tx_id, created_at)"
            " VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (
                class_id, tx_type, amount, category, description, input_by, telegram_id, source,
                student_nis, due_week, 1 if corrects_tx_id else 0, corrects_tx_id, utc_now(),
            ),
        )
        tx_id = cur.lastrowid
        self._store_balances(cur, class_id, saldo, alokasi)
        return {
            "tx_id": tx_id,
            "type": tx_type,
            "amount": amount,
            "category": category,
            "description": description,
            "input_by": input_by,
            "saldo_total": saldo,
            "saldo_pocket": alokasi[category],
            "alokasi": alokasi,
        }

    def record_transaction(
        self,
        class_id: str,
        tx_type: str,
        amount: int,
        category: str,
        description: str,
        input_by: str,
        telegram_id: Optional[int] = None,
        source: str = "cli",
    ) -> Dict[str, Any]:
        with self._tx() as cur:
            res = self._apply(cur, class_id, tx_type, amount, category, description, input_by, telegram_id, source)
            self._audit(cur, class_id, "transaksi", input_by, f"#{res['tx_id']} {tx_type} {amount} {category}")
        return res

    def reverse_transaction(
        self,
        class_id: str,
        tx_id: int,
        reason: str,
        reversed_by: str,
        telegram_id: Optional[int] = None,
        source: str = "cli",
    ) -> Dict[str, Any]:
        reason = (reason or "").strip()
        if not reason:
            raise CekasError("Alasan koreksi wajib diisi.")
        with self._tx() as cur:
            orig = cur.execute(
                "SELECT * FROM transactions WHERE id = ? AND class_id = ?", (tx_id, class_id)
            ).fetchone()
            if not orig:
                raise CekasError(f"Transaksi #{tx_id} tidak ditemukan.")
            if orig["is_correction"]:
                raise CekasError(f"Transaksi #{tx_id} adalah koreksi dan tidak dapat dikoreksi lagi.")
            if orig["reversed_by_tx_id"]:
                raise CekasError(f"Transaksi #{tx_id} sudah pernah dikoreksi (#{orig['reversed_by_tx_id']}).")
            res = self._apply(
                cur, class_id, "out" if orig["type"] == "in" else "in", orig["amount"], orig["category"],
                f"[KOREKSI #{tx_id}] {reason}", reversed_by, telegram_id, source, corrects_tx_id=tx_id,
            )
            cur.execute("UPDATE transactions SET reversed_by_tx_id = ? WHERE id = ?", (res["tx_id"], tx_id))
            if orig["student_nis"] and orig["due_week"]:
                cur.execute(
                    "DELETE FROM weekly_dues WHERE class_id = ? AND nis = ? AND week_num = ? AND tx_id = ?",
                    (class_id, orig["student_nis"], orig["due_week"], tx_id),
                )
            self._audit(cur, class_id, "koreksi", reversed_by, f"#{tx_id} -> #{res['tx_id']}: {reason}")
        res["reversed_tx_id"] = tx_id
        res["correction_id"] = res["tx_id"]
        return res

    def get_transaction(self, class_id: str, tx_id: int) -> Optional[Dict[str, Any]]:
        row = self.conn.execute(
            "SELECT * FROM transactions WHERE class_id = ? AND id = ?", (class_id, tx_id)
        ).fetchone()
        return dict(row) if row else None

    def get_recent_transactions(
        self, class_id: str = CLASS_ID, limit: int = 15, category: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        sql, params = "SELECT * FROM transactions WHERE class_id = ?", [class_id]
        if category:
            sql += " AND category = ?"
            params.append(category)
        sql += " ORDER BY id DESC LIMIT ?"
        params.append(int(limit))
        return [dict(r) for r in self.conn.execute(sql, params).fetchall()]

    def get_all_transactions(self, class_id: str = CLASS_ID) -> List[Dict[str, Any]]:
        rows = self.conn.execute("SELECT * FROM transactions WHERE class_id = ? ORDER BY id ASC", (class_id,))
        return [dict(r) for r in rows.fetchall()]

    # ----------------------------------------------------------------- iuran
    def mark_dues_paid(
        self,
        class_id: str,
        nis: str,
        week_num: int,
        recorded_by: str,
        telegram_id: Optional[int] = None,
        source: str = "cli",
    ) -> Dict[str, Any]:
        if not isinstance(week_num, int) or not 1 <= week_num <= 60:
            raise CekasError("Minggu ke- harus antara 1 dan 60.")
        wl = self.get_whitelist_student(class_id, nis)
        if not wl:
            raise CekasError(f"NIS {nis} tidak ditemukan di kelas {class_id}.")
        if wl["role"] == "wali_kelas":
            raise CekasError("Wali kelas tidak membayar iuran siswa.")
        nominal = self.get_or_create_class(class_id)["nominal_iuran"]
        with self._tx() as cur:
            if cur.execute(
                "SELECT 1 FROM weekly_dues WHERE class_id = ? AND nis = ? AND week_num = ?",
                (class_id, wl["nis"], week_num),
            ).fetchone():
                raise CekasError(f"{wl['nama_resmi']} sudah lunas untuk minggu ke-{week_num}.")
            res = self._apply(
                cur, class_id, "in", nominal, "operasional",
                f"Iuran kas minggu ke-{week_num} - {wl['nama_resmi']} ({wl['nis']})",
                recorded_by, telegram_id, source, student_nis=wl["nis"], due_week=week_num,
            )
            cur.execute(
                "INSERT INTO weekly_dues (class_id, nis, week_num, tx_id, paid_at) VALUES (?,?,?,?,?)",
                (class_id, wl["nis"], week_num, res["tx_id"], utc_now()),
            )
            self._audit(cur, class_id, "iuran", recorded_by, f"{wl['nis']} minggu {week_num} #{res['tx_id']}")
        res.update({"nis": wl["nis"], "nama": wl["nama_resmi"], "week_num": week_num, "nominal": nominal})
        return res

    def get_dues_status(self, class_id: str = CLASS_ID, week_num: int = 1) -> Dict[str, Any]:
        paid_nis = {
            r["nis"]
            for r in self.conn.execute(
                "SELECT nis FROM weekly_dues WHERE class_id = ? AND week_num = ?", (class_id, week_num)
            ).fetchall()
        }
        paid, unpaid = [], []
        for s in self.get_all_whitelist_students(class_id):
            if s["role"] == "wali_kelas":
                continue
            (paid if s["nis"] in paid_nis else unpaid).append(s)
        total = len(paid) + len(unpaid)
        return {
            "week_num": week_num,
            "total_students": total,
            "paid_count": len(paid),
            "unpaid_count": len(unpaid),
            "percentage": round(len(paid) / total * 100, 1) if total else 0.0,
            "paid_students": paid,
            "unpaid_students": unpaid,
        }

    # ------------------------------------------------------------- integritas
    def verify_integrity(self, class_id: str = CLASS_ID) -> Dict[str, Any]:
        """Hitung ulang saldo dari ledger dan bandingkan dengan saldo tersimpan."""
        saldo, alokasi = self._load_balances(self.conn.cursor(), class_id)
        calc_total, calc_pocket = 0, {k: 0 for k in POCKET_CONFIG}
        for t in self.get_all_transactions(class_id):
            d = t["amount"] if t["type"] == "in" else -t["amount"]
            calc_total += d
            calc_pocket[t["category"]] = calc_pocket.get(t["category"], 0) + d
        return {
            "ok": calc_total == saldo and calc_pocket == alokasi,
            "stored_saldo": saldo,
            "calculated_saldo": calc_total,
            "stored_alokasi": alokasi,
            "calculated_alokasi": calc_pocket,
        }

    def recalculate_balances(self, class_id: str = CLASS_ID) -> Dict[str, Any]:
        with self._tx() as cur:
            total, pocket = 0, {k: 0 for k in POCKET_CONFIG}
            for t in cur.execute("SELECT * FROM transactions WHERE class_id = ?", (class_id,)).fetchall():
                d = t["amount"] if t["type"] == "in" else -t["amount"]
                total += d
                pocket[t["category"]] = pocket.get(t["category"], 0) + d
            self._store_balances(cur, class_id, total, pocket)
        return {"saldo": total, "alokasi": pocket}
