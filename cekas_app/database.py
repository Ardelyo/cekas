"""
CEKAS Database Operations & State Management
SQLite with WAL mode, ACID transactions, RBAC, and Weekly Dues Tracking.
"""

import sqlite3
import json
import time
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any, Tuple
from .config import CLASS_ID, CLASS_NAME, SCHOOL_YEAR, DEFAULT_PIN_BENDAHARA, NOMINAL_IURAN_MINGGUAN, POCKET_CONFIG

class CekasDB:
    def __init__(self, db_path: str):
        self.db_path = db_path
        self.conn = sqlite3.connect(db_path, check_same_thread=False)
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

    def get_or_create_class(self, class_id: str = CLASS_ID) -> Dict[str, Any]:
        cursor = self.conn.cursor()
        cursor.execute("SELECT * FROM classes WHERE id = ?", (class_id,))
        row = cursor.fetchone()
        if not row:
            initial_alokasi = json.dumps({k: 0 for k in POCKET_CONFIG.keys()})
            with self.conn:
                self.conn.execute(
                    """INSERT INTO classes (id, nama, tahun_ajaran, saldo, alokasi, pin_bendahara, nominal_iuran)
                       VALUES (?, ?, ?, 0, ?, ?, ?)""",
                    (class_id, CLASS_NAME, SCHOOL_YEAR, initial_alokasi, DEFAULT_PIN_BENDAHARA, NOMINAL_IURAN_MINGGUAN)
                )
            cursor.execute("SELECT * FROM classes WHERE id = ?", (class_id,))
            row = cursor.fetchone()
            
        data = dict(row)
        data["alokasi"] = json.loads(data["alokasi"])
        return data

    def seed_initial_students(self, class_id: str = CLASS_ID):
        """Seed official student roster for XI-F2."""
        students = [
            {"nis": "23241001", "nama_resmi": "Ardellio Satria Anindito", "role": "siswa"},
            {"nis": "23241015", "nama_resmi": "Tarina", "role": "bendahara"},
            {"nis": "23241020", "nama_resmi": "Nabila", "role": "siswa"},
            {"nis": "23241025", "nama_resmi": "Cinta", "role": "siswa"},
            {"nis": "23241002", "nama_resmi": "Ahmad Fauzi", "role": "siswa"},
            {"nis": "23241003", "nama_resmi": "Alisha Zahra", "role": "siswa"},
            {"nis": "23241004", "nama_resmi": "Arya Pratama", "role": "siswa"},
            {"nis": "23241005", "nama_resmi": "Budi Santoso", "role": "siswa"},
            {"nis": "23241006", "nama_resmi": "Cantika Putri", "role": "siswa"},
            {"nis": "23241007", "nama_resmi": "Dimas Anggara", "role": "siswa"},
            {"nis": "23241008", "nama_resmi": "Dwi Cahyo", "role": "siswa"},
            {"nis": "23241009", "nama_resmi": "Elvira Rosa", "role": "siswa"},
            {"nis": "23241010", "nama_resmi": "Farhan Makarim", "role": "siswa"},
            {"nis": "23241011", "nama_resmi": "Gita Gutawa", "role": "siswa"},
            {"nis": "23241012", "nama_resmi": "Hafiz Suhendra", "role": "siswa"},
            {"nis": "23241013", "nama_resmi": "Indah Permata", "role": "siswa"},
            {"nis": "23241014", "nama_resmi": "Jovan Andreas", "role": "siswa"},
            {"nis": "23241016", "nama_resmi": "Karisma Ayu", "role": "siswa"},
            {"nis": "23241017", "nama_resmi": "Luthfi Hakim", "role": "siswa"},
            {"nis": "23241018", "nama_resmi": "Maulana Malik", "role": "siswa"},
            {"nis": "23241019", "nama_resmi": "Nadya Shafa", "role": "siswa"},
            {"nis": "23241021", "nama_resmi": "Oki Setiawan", "role": "siswa"},
            {"nis": "23241022", "nama_resmi": "Putri Maharani", "role": "siswa"},
            {"nis": "23241023", "nama_resmi": "Rafi Akbar", "role": "siswa"},
            {"nis": "23241024", "nama_resmi": "Rian Hidayat", "role": "siswa"},
            {"nis": "23241026", "nama_resmi": "Satria Wicaksana", "role": "siswa"},
            {"nis": "23241027", "nama_resmi": "Tiara Andini", "role": "siswa"},
            {"nis": "23241028", "nama_resmi": "Umar Faruq", "role": "siswa"},
            {"nis": "23241029", "nama_resmi": "Vina Panduwinata", "role": "siswa"},
            {"nis": "23241030", "nama_resmi": "Wahyu Wibowo", "role": "siswa"},
            {"nis": "23241031", "nama_resmi": "Xavier Zidane", "role": "siswa"},
            {"nis": "23241032", "nama_resmi": "Yoga Pratama", "role": "siswa"},
            {"nis": "23241033", "nama_resmi": "Zahra Aulia", "role": "siswa"},
            {"nis": "23241034", "nama_resmi": "Wali Kelas XI-F2", "role": "wali_kelas"}
        ]
        with self.conn:
            for s in students:
                self.conn.execute("""
                    INSERT OR REPLACE INTO whitelist_students (class_id, nis, nama_resmi, role)
                    VALUES (?, ?, ?, ?)
                """, (class_id, s["nis"], s["nama_resmi"], s["role"]))

    def get_whitelist_student(self, class_id: str, nis: str) -> Optional[Dict[str, Any]]:
        cursor = self.conn.cursor()
        cursor.execute("SELECT * FROM whitelist_students WHERE class_id = ? AND nis = ?", (class_id, nis.strip()))
        row = cursor.fetchone()
        return dict(row) if row else None

    def get_all_whitelist_students(self, class_id: str = CLASS_ID) -> List[Dict[str, Any]]:
        cursor = self.conn.cursor()
        cursor.execute("SELECT * FROM whitelist_students WHERE class_id = ? ORDER BY nis ASC", (class_id,))
        return [dict(r) for r in cursor.fetchall()]

    def register_member(self, class_id: str, telegram_id: int, nis: str, username: str = "") -> Dict[str, Any]:
        wl = self.get_whitelist_student(class_id, nis)
        if not wl:
            return {"success": False, "error": f"NIS {nis} tidak terdaftar di whitelist resmi kelas."}
        
        with self.conn:
            self.conn.execute("""
                INSERT OR REPLACE INTO members (class_id, telegram_id, nama, nis, role, username, notif_enabled)
                VALUES (?, ?, ?, ?, ?, ?, 1)
            """, (class_id, telegram_id, wl["nama_resmi"], nis.strip(), wl["role"], username))
            
        return {"success": True, "nama": wl["nama_resmi"], "role": wl["role"], "nis": nis}

    def get_member(self, telegram_id: int) -> Optional[Dict[str, Any]]:
        cursor = self.conn.cursor()
        cursor.execute("SELECT * FROM members WHERE telegram_id = ?", (telegram_id,))
        row = cursor.fetchone()
        return dict(row) if row else None

    def claim_bendahara(self, class_id: str, telegram_id: int, pin: str) -> Dict[str, Any]:
        cls = self.get_or_create_class(class_id)
        if pin.strip() != cls["pin_bendahara"]:
            return {"success": False, "error": "PIN Bendahara tidak valid!"}
            
        with self.conn:
            cursor = self.conn.cursor()
            cursor.execute("SELECT * FROM members WHERE telegram_id = ?", (telegram_id,))
            member = cursor.fetchone()
            if member:
                self.conn.execute("UPDATE members SET role = 'bendahara' WHERE telegram_id = ?", (telegram_id,))
                nama = member["nama"]
            else:
                nama = f"Bendahara {telegram_id}"
                self.conn.execute("""
                    INSERT INTO members (class_id, telegram_id, nama, role, notif_enabled)
                    VALUES (?, ?, ?, 'bendahara', 1)
                """, (class_id, telegram_id, nama))
                
        return {"success": True, "nama": nama}

    def toggle_notif(self, telegram_id: int, state: Optional[bool] = None) -> bool:
        cursor = self.conn.cursor()
        cursor.execute("SELECT notif_enabled FROM members WHERE telegram_id = ?", (telegram_id,))
        row = cursor.fetchone()
        if not row:
            return False
            
        current = bool(row["notif_enabled"])
        new_val = (not current) if state is None else state
        with self.conn:
            self.conn.execute("UPDATE members SET notif_enabled = ? WHERE telegram_id = ?", (1 if new_val else 0, telegram_id))
        return new_val

    def get_notif_recipients(self, class_id: str = CLASS_ID) -> List[int]:
        cursor = self.conn.cursor()
        cursor.execute("SELECT telegram_id FROM members WHERE class_id = ? AND notif_enabled = 1", (class_id,))
        return [r["telegram_id"] for r in cursor.fetchall()]

    def record_transaction(self, class_id: str, tx_type: str, amount: int, category: str, description: str, input_by: str, telegram_id: int) -> Dict[str, Any]:
        if amount <= 0:
            raise ValueError("Nominal transaksi harus lebih dari 0!")
            
        cat = category if category in POCKET_CONFIG else "operasional"
        
        with self.conn:
            cursor = self.conn.cursor()
            cursor.execute("SELECT saldo, alokasi FROM classes WHERE id = ?", (class_id,))
            cls_row = cursor.fetchone()
            if not cls_row:
                raise ValueError("Data kelas tidak ditemukan.")
                
            saldo = cls_row["saldo"]
            alokasi = json.loads(cls_row["alokasi"])
            
            if tx_type == "in":
                saldo += amount
                alokasi[cat] = alokasi.get(cat, 0) + amount
            elif tx_type == "out":
                saldo -= amount
                alokasi[cat] = alokasi.get(cat, 0) - amount
            else:
                raise ValueError(f"Tipe transaksi '{tx_type}' tidak valid.")
                
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
            "description": description,
            "input_by": input_by,
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
                raise ValueError(f"Transaksi ID #{tx_id} sudah pernah dibatalkan / dikoreksi.")

            cursor.execute("SELECT saldo, alokasi FROM classes WHERE id = ?", (class_id,))
            cls_row = cursor.fetchone()
            saldo = cls_row["saldo"]
            alokasi = json.loads(cls_row["alokasi"])
            cat = orig_tx["category"]
            orig_amount = orig_tx["amount"]

            if orig_tx["type"] == "in":
                saldo -= orig_amount
                alokasi[cat] = alokasi.get(cat, 0) - orig_amount
            else:
                saldo += orig_amount
                alokasi[cat] = alokasi.get(cat, 0) + orig_amount

            cursor.execute("""
                INSERT INTO transactions (class_id, type, amount, category, description, input_by, telegram_id, is_reversal, reverses_tx_id)
                VALUES (?, 'correction', ?, ?, ?, ?, ?, 1, ?)
            """, (class_id, orig_amount, cat, f"KOREKSI #{tx_id}: {reason}", reversed_by, telegram_id, tx_id))
            correction_id = cursor.lastrowid

            cursor.execute("UPDATE transactions SET is_reversal = 1 WHERE id = ?", (tx_id,))
            cursor.execute("""
                UPDATE classes SET saldo = ?, alokasi = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
            """, (saldo, json.dumps(alokasi), class_id))

        return {
            "correction_id": correction_id,
            "reversed_tx_id": tx_id,
            "amount": orig_amount,
            "category": cat,
            "saldo_total": saldo,
            "saldo_pocket": alokasi[cat],
            "alokasi": alokasi
        }

    def mark_dues_paid(self, class_id: str, nis: str, week_num: int, recorded_by: str, telegram_id: int, auto_tx: bool = True) -> Dict[str, Any]:
        wl = self.get_whitelist_student(class_id, nis)
        if not wl:
            raise ValueError(f"NIS {nis} tidak ditemukan di kelas {class_id}.")

        cls = self.get_or_create_class(class_id)
        nominal = cls["nominal_iuran"]
        tx_id = None

        with self.conn:
            cursor = self.conn.cursor()
            if auto_tx:
                desc = f"Iuran kas minggu ke-{week_num} ({wl['nama_resmi']})"
                tx_res = self.record_transaction(class_id, "in", nominal, "operasional", desc, recorded_by, telegram_id)
                tx_id = tx_res["tx_id"]

            cursor.execute("""
                INSERT OR REPLACE INTO weekly_dues (class_id, nis, week_num, is_paid, paid_at, paid_by_tx_id)
                VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP, ?)
            """, (class_id, nis.strip(), week_num, tx_id))

        return {
            "nis": nis,
            "nama": wl["nama_resmi"],
            "week_num": week_num,
            "nominal": nominal,
            "tx_id": tx_id
        }

    def get_dues_status(self, class_id: str = CLASS_ID, week_num: int = 1) -> Dict[str, Any]:
        students = self.get_all_whitelist_students(class_id)
        cursor = self.conn.cursor()
        cursor.execute("SELECT * FROM weekly_dues WHERE class_id = ? AND week_num = ?", (class_id, week_num))
        paid_map = {r["nis"]: dict(r) for r in cursor.fetchall()}

        paid_list = []
        unpaid_list = []

        for s in students:
            if s["role"] == "wali_kelas":
                continue # Wali kelas does not pay student dues
            if s["nis"] in paid_map and paid_map[s["nis"]]["is_paid"]:
                paid_list.append(s)
            else:
                unpaid_list.append(s)

        total_students = len(paid_list) + len(unpaid_list)
        pct = (len(paid_list) / total_students * 100) if total_students > 0 else 0

        return {
            "week_num": week_num,
            "total_students": total_students,
            "paid_count": len(paid_list),
            "unpaid_count": len(unpaid_list),
            "percentage": round(pct, 1),
            "paid_students": paid_list,
            "unpaid_students": unpaid_list
        }

    def get_recent_transactions(self, class_id: str = CLASS_ID, limit: int = 15, category: Optional[str] = None) -> List[Dict[str, Any]]:
        cursor = self.conn.cursor()
        if category:
            cursor.execute("""
                SELECT * FROM transactions WHERE class_id = ? AND category = ? ORDER BY id DESC LIMIT ?
            """, (class_id, category, limit))
        else:
            cursor.execute("""
                SELECT * FROM transactions WHERE class_id = ? ORDER BY id DESC LIMIT ?
            """, (class_id, limit))
        return [dict(r) for r in cursor.fetchall()]
