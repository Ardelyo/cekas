"""
CEKAS Comprehensive System Test Suite
Verifies 100% offline, deterministic, non-AI features:
- Indonesian currency and nominal parsing
- Database schema & whitelist seeding
- Manual transactions across 4 pockets
- Running balance integrity
- Append-only reversal audit trail
- Student weekly dues tracking
- Multi-sheet Excel report generation
- Visual infographic chart generation
"""

import unittest
from io import BytesIO

from cekas_app.formatters import format_rupiah, parse_nominal, parse_transaction_args, normalize_category
from cekas_app.database import CekasDB
from cekas_app.export_excel import generate_excel_report
from cekas_app.generate_chart import generate_financial_chart
from cekas_app.config import POCKET_CONFIG

class TestCekasSystem(unittest.TestCase):
    def setUp(self):
        self.db = CekasDB(":memory:")
        self.db.get_or_create_class("XI-F2")
        self.db.seed_initial_students("XI-F2")

    def test_nominal_parser_indonesian_slang(self):
        self.assertEqual(parse_nominal("10000"), 10000)
        self.assertEqual(parse_nominal("10.000"), 10000)
        self.assertEqual(parse_nominal("Rp 10.000"), 10000)
        self.assertEqual(parse_nominal("rp. 25.000"), 25000)
        self.assertEqual(parse_nominal("10k"), 10000)
        self.assertEqual(parse_nominal("25K"), 25000)
        self.assertEqual(parse_nominal("15rb"), 15000)
        self.assertEqual(parse_nominal("20 ribu"), 20000)
        self.assertEqual(parse_nominal("1.5jt"), 1500000)
        self.assertIsNone(parse_nominal("-5000"))
        self.assertIsNone(parse_nominal("0"))
        self.assertIsNone(parse_nominal("bukan_angka"))

    def test_category_normalization(self):
        self.assertEqual(normalize_category("ops"), "operasional")
        self.assertEqual(normalize_category("kebersihan"), "operasional")
        self.assertEqual(normalize_category("santunan"), "sosial")
        self.assertEqual(normalize_category("bukber"), "event")
        self.assertEqual(normalize_category("darurat"), "cadangan")
        self.assertIsNone(normalize_category("unknown_category"))

    def test_transaction_args_parsing(self):
        p1 = parse_transaction_args("10k sosial Santunan duka")
        self.assertEqual(p1["amount"], 10000)
        self.assertEqual(p1["category"], "sosial")
        self.assertEqual(p1["description"], "Santunan duka")

        p2 = parse_transaction_args("25.000 Beli spidol kelas")
        self.assertEqual(p2["amount"], 25000)
        self.assertEqual(p2["category"], "operasional")
        self.assertEqual(p2["description"], "Beli spidol kelas")

    def test_whitelist_and_member_registration(self):
        students = self.db.get_all_whitelist_students("XI-F2")
        self.assertGreaterEqual(len(students), 30)

        # Valid registration
        res1 = self.db.register_member("XI-F2", 999111, "23241001", "ardellio_bot")
        self.assertTrue(res1["success"])
        self.assertEqual(res1["nama"], "Ardellio Satria Anindito")

        # Invalid NIS registration
        res2 = self.db.register_member("XI-F2", 999222, "99999999", "ghost")
        self.assertFalse(res2["success"])

    def test_manual_financial_operations_and_running_balance(self):
        # 1. Add operational dues
        t1 = self.db.record_transaction("XI-F2", "in", 100000, "operasional", "Iuran kas mingguan", "Tarina", 123)
        self.assertEqual(t1["saldo_total"], 100000)
        self.assertEqual(t1["saldo_pocket"], 100000)

        # 2. Add social donation
        t2 = self.db.record_transaction("XI-F2", "in", 50000, "sosial", "Donasi jenguk teman sakit", "Tarina", 123)
        self.assertEqual(t2["saldo_total"], 150000)
        self.assertEqual(t2["alokasi"]["sosial"], 50000)

        # 3. Deduct operational expense
        t3 = self.db.record_transaction("XI-F2", "out", 30000, "operasional", "Beli spidol & sapu", "Tarina", 123)
        self.assertEqual(t3["saldo_total"], 120000)
        self.assertEqual(t3["alokasi"]["operasional"], 70000)

        # 4. Append-only correction (reversal of t3)
        rev = self.db.reverse_transaction("XI-F2", t3["tx_id"], "Nota salah hitung", "Tarina", 123)
        self.assertEqual(rev["saldo_total"], 150000)
        self.assertEqual(rev["alokasi"]["operasional"], 100000)

        # Verify audit ledger history
        txs = self.db.get_recent_transactions("XI-F2", limit=10)
        self.assertEqual(len(txs), 4) # t1, t2, t3, rev_tx
        self.assertTrue(any(t["type"] == "correction" for t in txs))

    def test_weekly_dues_matrix(self):
        # Initial status
        st_before = self.db.get_dues_status("XI-F2", week_num=1)
        self.assertEqual(st_before["paid_count"], 0)
        self.assertGreater(st_before["unpaid_count"], 0)

        # Mark Ardellio paid
        pay_res = self.db.mark_dues_paid("XI-F2", "23241001", 1, "Tarina", 123)
        self.assertEqual(pay_res["nis"], "23241001")

        # Check status after
        st_after = self.db.get_dues_status("XI-F2", week_num=1)
        self.assertEqual(st_after["paid_count"], 1)
        self.assertIn("23241001", [s["nis"] for s in st_after["paid_students"]])

    def test_excel_export_generation(self):
        self.db.record_transaction("XI-F2", "in", 50000, "operasional", "Kas awal", "Tarina", 123)
        stream = generate_excel_report(self.db, "XI-F2")
        content = stream.read()
        self.assertGreater(len(content), 1000)
        # Check ZIP / XLSX magic bytes (PK\x03\x04)
        self.assertTrue(content.startswith(b"PK\x03\x04"))

    def test_chart_generation(self):
        self.db.record_transaction("XI-F2", "in", 50000, "operasional", "Kas awal", "Tarina", 123)
        self.db.record_transaction("XI-F2", "in", 30000, "sosial", "Kas sosial", "Tarina", 123)
        stream = generate_financial_chart(self.db, "XI-F2")
        content = stream.read()
        self.assertGreater(len(content), 5000)
        # Check PNG header magic bytes (\x89PNG\r\n\x1a\n)
        self.assertTrue(content.startswith(b"\x89PNG\r\n\x1a\n"))

if __name__ == "__main__":
    unittest.main()
