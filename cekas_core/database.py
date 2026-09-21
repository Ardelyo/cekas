"""
CEKAS (Catatan Keuangan Kelas) - Pure Python SQLite Database & Accounting Engine
Local-first, ACID-compliant, zero cloud dependency.
"""

import sqlite3
import json
import time
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

DEFAULT_PIN = "192837"
NOMINAL_IURAN_MINGGUAN = 10000

class CekasDB:
    def __init__(self, db_path: str = ":memory:"):
        self.db_path = db_path
        self.conn = sqlite3.connect(db_path)
        self.conn.row_factory = sqlite3.Row
        self._init_schema()

    def _init_schema(self):
        with self.conn:
            self.conn.execute("PRAGMA journal_mode=WAL;")
            self.conn.execute("""
                CREATE TABLE IF NOT EXISTS classes (
                    id TEXT PRIMARY KEY,
                    nama TEXT NOT NULL,
                    tahun_ajaran TEXT NOT NULL,
                    saldo INTEGER DEFAULT 0,
                    alokasi TEXT NOT NULL,
                    pin_bendahara TEXT NOT NULL,
                    nominal_iuran INTEGER DEFAULT 10000,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            self.conn.execute("""
                CREATE TABLE IF NOT EXISTS whitelist_students (
                    class_id TEXT NOT NULL,
                    nis TEXT NOT NULL,
                    nama_resmi TEXT NOT NULL,
                    role TEXT DEFAULT 'siswa',
                    PRIMARY KEY (class_id, nis)
                );
            """)
            self.conn.execute("""
                CREATE TABLE IF NOT EXISTS members (
                    class_id TEXT NOT NULL,
                    telegram_id INTEGER PRIMARY KEY,
                    nama TEXT NOT NULL,
                    nis TEXT,
                    role TEXT DEFAULT 'siswa',
                    username TEXT,
                    notif_enabled INTEGER DEFAULT 1,
                    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            self.conn.execute("""
                CREATE TABLE IF NOT EXISTS transactions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    class_id TEXT NOT NULL,
                    type TEXT NOT NULL, -- 'in', 'out', 'correction'
                    amount INTEGER NOT NULL,
                    category TEXT NOT NULL,
                    description TEXT NOT NULL,
                    input_by TEXT NOT NULL,
                    telegram_id INTEGER NOT NULL,
                    is_reversal INTEGER DEFAULT 0,
                    reverses_tx_id INTEGER,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            self.conn.execute("""
                CREATE TABLE IF NOT EXISTS weekly_dues (
                    class_id TEXT NOT NULL,
                    nis TEXT NOT NULL,
                    week_num INTEGER NOT NULL,
                    is_paid INTEGER DEFAULT 0,
                    paid_at TIMESTAMP,
                    paid_by_tx_id INTEGER,
                    PRIMARY KEY (class_id, nis, week_num)
                );
            """)

    def init_class(self, class_id: str = "XI-F2", nama: str = "Kelas XI-F2 SMA Kartika XIX-1 Bandung") -> Dict[str, Any]:
        cursor = self.conn.cursor()
        cursor.execute("SELECT * FROM classes WHERE id = ?", (class_id,))
        row = cursor.fetchone()
        if not row:
            initial_alokasi = json.dumps({"operasional": 0, "sosial": 0, "event": 0, "cadangan": 0})
            with self.conn:
                self.conn.execute(
                    "INSERT INTO classes (id, nama, tahun_ajaran, saldo, alokasi, pin_bendahara, nominal_iuran) VALUES (?, ?, ?, 0, ?, ?, ?)",
                    (class_id, nama, "2026/2027", initial_alokasi, DEFAULT_PIN, NOMINAL_IURAN_MINGGUAN)
                )
            cursor.execute("SELECT * FROM classes WHERE id = ?", (class_id,))
            row = cursor.fetchone()
        
        data = dict(row)
        data["alokasi"] = json.loads(data["alokasi"])
        return data

    def seed_whitelist(self, class_id: str, students: List[Dict[str, str]]):
        with self.conn:
            for s in students:
                self.conn.execute(
                    "INSERT OR REPLACE INTO whitelist_students (class_id, nis, nama_resmi, role) VALUES (?, ?, ?, ?)",
                    (class_id, s["nis"], s["nama_resmi"], s.get("role", "siswa"))
                )

    def register_member(self, class_id: str, telegram_id: int, nis: str, display_name: str, username: str = "") -> Dict[str, Any]:
        cursor = self.conn.cursor()
        cursor.execute("SELECT * FROM whitelist_students WHERE class_id = ? AND nis = ?", (class_id, nis.strip()))
        wl = cursor.fetchone()
        if not wl:
            return {"success": False, "error": f"NIS {nis} tidak terdaftar di whitelist kelas."}
        
        role = wl["role"]
        nama = wl["nama_resmi"]
        with self.conn:
            self.conn.execute("""
                INSERT OR REPLACE INTO members (class_id, telegram_id, nama, nis, role, username, notif_enabled)
                VALUES (?, ?, ?, ?, ?, ?, 1)
            """, (class_id, telegram_id, nama, nis.strip(), role, username))
        
        return {"success": True, "nama": nama, "role": role, "nis": nis}

    def record_transaction(self, class_id: str, tx_type: str, amount: int, category: str, description: str, input_by: str, telegram_id: int) -> Dict[str, Any]:
        if amount <= 0:
            raise ValueError("Nominal harus lebih dari 0")
        
        cursor = self.conn.cursor()
        with self.conn:
            cursor.execute("SELECT saldo, alokasi FROM classes WHERE id = ?", (class_id,))
            cls_row = cursor.fetchone()
            if not cls_row:
                raise ValueError("Kelas tidak ditemukan")
            
            saldo = cls_row["saldo"]
            alokasi = json.loads(cls_row["alokasi"])
            cat = category if category in alokasi else "operasional"
            
            if tx_type == "in":
                saldo += amount
                alokasi[cat] = alokasi.get(cat, 0) + amount
            elif tx_type == "out":
                saldo -= amount
                alokasi[cat] = alokasi.get(cat, 0) - amount
            else:
                raise ValueError("Invalid tx_type")
                
            cursor.execute("""
                INSERT INTO transactions (class_id, type, amount, category, description, input_by, telegram_id)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (class_id, tx_type, amount, cat, description, input_by, telegram_id))
            tx_id = cursor.lastrowid
            
            cursor.execute("""
                UPDATE classes SET saldo = ?, alokasi = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
            """, (saldo, json.dumps(alokasi), class_id))
            
        return {
            "tx_id": tx_id,
            "type": tx_type,
            "amount": amount,
            "category": cat,
            "saldo_total": saldo,
            "saldo_pocket": alokasi[cat],
            "alokasi": alokasi
        }

    def reverse_transaction(self, class_id: str, tx_id: int, reason: str, reversed_by: str, telegram_id: int) -> Dict[str, Any]:
        cursor = self.conn.cursor()
        with self.conn:
            cursor.execute("SELECT * FROM transactions WHERE id = ? AND class_id = ?", (tx_id, class_id))
            orig_tx = cursor.fetchone()
            if not orig_tx:
                raise ValueError(f"Transaksi ID #{tx_id} tidak ditemukan.")
            if orig_tx["is_reversal"] or orig_tx["type"] == "correction":
                raise ValueError(f"Transaksi ID #{tx_id} sudah pernah dibatalkan/dikoreksi.")

            cursor.execute("SELECT saldo, alokasi FROM classes WHERE id = ?", (class_id,))
            cls_row = cursor.fetchone()
            saldo = cls_row["saldo"]
            alokasi = json.loads(cls_row["alokasi"])
            cat = orig_tx["category"]

            # Reverse the effect
            rev_type = "correction"
            orig_amount = orig_tx["amount"]
            if orig_tx["type"] == "in":
                saldo -= orig_amount
                alokasi[cat] = alokasi.get(cat, 0) - orig_amount
            else:
                saldo += orig_amount
                alokasi[cat] = alokasi.get(cat, 0) + orig_amount

            cursor.execute("""
                INSERT INTO transactions (class_id, type, amount, category, description, input_by, telegram_id, is_reversal, reverses_tx_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
            """, (class_id, rev_type, orig_amount, cat, f"KOREKSI #{tx_id}: {reason}", reversed_by, telegram_id, tx_id))
            correction_id = cursor.lastrowid

            cursor.execute("UPDATE transactions SET is_reversal = 1 WHERE id = ?", (tx_id,))
            cursor.execute("UPDATE classes SET saldo = ?, alokasi = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (saldo, json.dumps(alokasi), class_id))

        return {
            "correction_id": correction_id,
            "reversed_tx_id": tx_id,
            "saldo_total": saldo,
            "saldo_pocket": alokasi[cat],
            "alokasi": alokasi
        }
