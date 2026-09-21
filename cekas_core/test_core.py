"""
CEKAS Python Test Suite
Verifies formatters, transaction processing, whitelist registration, and corrections.
"""

import unittest
from formatters import format_rupiah, parse_nominal, normalize_category, parse_transaction_args
from database import CekasDB

class TestCekasCore(unittest.TestCase):
    def test_format_rupiah(self):
        self.assertEqual(format_rupiah(0), "Rp 0")
        self.assertEqual(format_rupiah(5000), "Rp 5.000")
        self.assertEqual(format_rupiah(1250000), "Rp 1.250.000")
        self.assertEqual(format_rupiah(-25000), "-Rp 25.000")

    def test_parse_nominal(self):
        self.assertEqual(parse_nominal("10000"), 10000)
        self.assertEqual(parse_nominal("10.000"), 10000)
        self.assertEqual(parse_nominal("Rp 10.000"), 10000)
        self.assertEqual(parse_nominal("10k"), 10000)
        self.assertEqual(parse_nominal("15rb"), 15000)
        self.assertEqual(parse_nominal("1.5jt"), 1500000)
        self.assertIsNone(parse_nominal("0"))
        self.assertIsNone(parse_nominal("-5000"))
        self.assertIsNone(parse_nominal("abc"))

    def test_parse_transaction_args(self):
        res1 = parse_transaction_args("10k sosial Santunan duka")
        self.assertEqual(res1["amount"], 10000)
        self.assertEqual(res1["category"], "sosial")
        self.assertEqual(res1["description"], "Santunan duka")

        res2 = parse_transaction_args("15.000 Iuran mingguan")
        self.assertEqual(res2["amount"], 15000)
        self.assertEqual(res2["category"], "operasional")
        self.assertEqual(res2["description"], "Iuran mingguan")

    def test_database_lifecycle(self):
        db = CekasDB(":memory:")
        info = db.init_class("XI-F2")
        self.assertEqual(info["saldo"], 0)

        # Seed whitelist
        db.seed_whitelist("XI-F2", [
            {"nis": "23241001", "nama_resmi": "Ardellio Satria Anindito", "role": "siswa"},
            {"nis": "23241015", "nama_resmi": "Tarina", "role": "bendahara"}
        ])

        # Test registration
        reg1 = db.register_member("XI-F2", 111, "23241001", "Ardellio")
        self.assertTrue(reg1["success"])
        self.assertEqual(reg1["role"], "siswa")

        reg_fail = db.register_member("XI-F2", 222, "99999999", "Unknown")
        self.assertFalse(reg_fail["success"])

        # Test transactions
        t1 = db.record_transaction("XI-F2", "in", 50000, "operasional", "Iuran kas", "Tarina", 111)
        self.assertEqual(t1["saldo_total"], 50000)
        self.assertEqual(t1["saldo_pocket"], 50000)

        t2 = db.record_transaction("XI-F2", "in", 30000, "sosial", "Donasi duka", "Tarina", 111)
        self.assertEqual(t2["saldo_total"], 80000)
        self.assertEqual(t2["alokasi"]["sosial"], 30000)

        t3 = db.record_transaction("XI-F2", "out", 20000, "operasional", "Beli spidol", "Tarina", 111)
        self.assertEqual(t3["saldo_total"], 60000)
        self.assertEqual(t3["alokasi"]["operasional"], 30000)

        # Test reversal / correction
        rev = db.reverse_transaction("XI-F2", t3["tx_id"], "Salah catat spidol", "Tarina", 111)
        self.assertEqual(rev["saldo_total"], 80000)
        self.assertEqual(rev["alokasi"]["operasional"], 50000)

if __name__ == "__main__":
    unittest.main()
