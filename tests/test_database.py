import threading

import pytest

from cekas.database import CekasDB, CekasError
from .conftest import CLS


def test_running_balance_and_pockets(db):
    db.record_transaction(CLS, "in", 100000, "operasional", "kas", "T")
    db.record_transaction(CLS, "in", 50000, "sosial", "donasi", "T")
    r = db.record_transaction(CLS, "out", 30000, "operasional", "spidol", "T")
    assert r["saldo_total"] == 120000
    assert r["alokasi"] == {"operasional": 70000, "sosial": 50000, "event": 0, "cadangan": 0}
    assert db.verify_integrity(CLS)["ok"]


def test_cannot_overdraw_pocket(db):
    db.record_transaction(CLS, "in", 10000, "sosial", "x", "T")
    with pytest.raises(CekasError):
        db.record_transaction(CLS, "out", 20000, "sosial", "x", "T")
    assert db.get_or_create_class(CLS)["saldo"] == 10000  # tidak berubah


@pytest.mark.parametrize("amount", [0, -5, 1.5, "10"])
def test_rejects_bad_amount(db, amount):
    with pytest.raises(CekasError):
        db.record_transaction(CLS, "in", amount, "operasional", "x", "T")


def test_rejects_bad_type_category_empty_desc(db):
    for args in [("xx", 1000, "operasional", "a"), ("in", 1000, "nope", "a"), ("in", 1000, "operasional", "  ")]:
        with pytest.raises(CekasError):
            db.record_transaction(CLS, args[0], args[1], args[2], args[3], "T")
    assert db.get_all_transactions(CLS) == []


def test_reversal_append_only_and_once(db):
    t = db.record_transaction(CLS, "in", 50000, "event", "bukber", "T")
    r = db.reverse_transaction(CLS, t["tx_id"], "salah catat", "T")
    assert r["saldo_total"] == 0
    txs = db.get_all_transactions(CLS)
    assert len(txs) == 2 and txs[1]["is_correction"] and txs[1]["type"] == "out"
    assert txs[0]["reversed_by_tx_id"] == txs[1]["id"]
    with pytest.raises(CekasError):  # tidak bisa dikoreksi dua kali
        db.reverse_transaction(CLS, t["tx_id"], "lagi", "T")
    with pytest.raises(CekasError):  # koreksi tidak bisa dikoreksi
        db.reverse_transaction(CLS, r["correction_id"], "x", "T")
    with pytest.raises(CekasError):
        db.reverse_transaction(CLS, 999, "x", "T")
    with pytest.raises(CekasError):
        db.reverse_transaction(CLS, t["tx_id"], "  ", "T")
    assert db.verify_integrity(CLS)["ok"]


def test_dues_pay_once_and_reverse_unpays(db):
    r = db.mark_dues_paid(CLS, "1", 2, "T")
    assert r["saldo_total"] == 10000
    with pytest.raises(CekasError):  # tidak boleh bayar dobel
        db.mark_dues_paid(CLS, "1", 2, "T")
    assert db.get_or_create_class(CLS)["saldo"] == 10000
    st = db.get_dues_status(CLS, 2)
    assert st["paid_count"] == 1 and st["total_students"] == 3  # wali kelas tidak dihitung
    db.reverse_transaction(CLS, r["tx_id"], "salah orang", "T")
    assert db.get_dues_status(CLS, 2)["paid_count"] == 0
    db.mark_dues_paid(CLS, "1", 2, "T")  # boleh bayar lagi setelah dikoreksi
    with pytest.raises(CekasError):
        db.mark_dues_paid(CLS, "9", 1, "T")  # wali kelas
    with pytest.raises(CekasError):
        db.mark_dues_paid(CLS, "404", 1, "T")
    with pytest.raises(CekasError):
        db.mark_dues_paid(CLS, "1", 0, "T")


def test_register_and_bendahara_claim(db):
    assert db.register_member(CLS, 111, "1", "ani")["success"]
    assert not db.register_member(CLS, 111, "404")["success"]
    assert not db.register_member(CLS, 222, "1")["success"]  # NIS sudah dipakai akun lain
    assert not db.is_bendahara(111, CLS)
    assert not db.claim_bendahara(CLS, 111, "salah")["success"]
    assert not db.is_bendahara(111, CLS)
    assert db.claim_bendahara(CLS, 111, "192837")["success"]
    assert db.is_bendahara(111, CLS)
    db.register_member(CLS, 111, "1")  # daftar ulang tidak menurunkan role
    assert db.is_bendahara(111, CLS)
    # siswa yang menjadi bendahara tidak terdaftar -> klaim tetap jalan
    assert db.claim_bendahara(CLS, 333, "192837", "Nama")["success"]


def test_notifications(db):
    db.register_member(CLS, 111, "1")
    db.register_member(CLS, 222, "2")
    assert db.toggle_notif(111, CLS) is False
    assert db.get_notif_recipients(CLS) == [222]
    assert db.get_notif_recipients(CLS, exclude=222) == []
    assert db.toggle_notif(999, CLS) is None


def test_failed_operation_rolls_back_everything(db):
    # saldo cukup untuk iuran, tapi gagal di tengah -> tidak ada yang tersimpan
    db.mark_dues_paid(CLS, "1", 1, "T")
    before = db.get_all_transactions(CLS)
    with pytest.raises(CekasError):
        db.mark_dues_paid(CLS, "1", 1, "T")
    assert db.get_all_transactions(CLS) == before


def test_concurrent_writes_keep_balance_exact(tmp_path):
    d = CekasDB(str(tmp_path / "c.db"))
    d.get_or_create_class(CLS)

    def work():
        for _ in range(25):
            d.record_transaction(CLS, "in", 1000, "operasional", "x", "T")

    threads = [threading.Thread(target=work) for _ in range(8)]
    [t.start() for t in threads]
    [t.join() for t in threads]
    assert d.get_or_create_class(CLS)["saldo"] == 200000
    assert d.verify_integrity(CLS)["ok"]


def test_persistence_across_reopen(tmp_path):
    p = str(tmp_path / "c.db")
    d = CekasDB(p)
    d.get_or_create_class(CLS)
    d.record_transaction(CLS, "in", 5000, "sosial", "x", "T")
    d.close()
    assert CekasDB(p).get_or_create_class(CLS)["saldo"] == 5000


def test_recalculate_repairs_drift(db):
    db.record_transaction(CLS, "in", 5000, "sosial", "x", "T")
    db.conn.execute("UPDATE classes SET saldo = 1 WHERE id = ?", (CLS,))
    assert not db.verify_integrity(CLS)["ok"]
    db.recalculate_balances(CLS)
    assert db.verify_integrity(CLS)["ok"]


def test_csv_import(db, tmp_path):
    f = tmp_path / "s.csv"
    f.write_text("nis,nama_resmi,role\n10,Cici,siswa\n11,Dedi,bendahara\n", encoding="utf-8")
    assert db.import_students_csv(CLS, str(f)) == 2
    assert db.get_whitelist_student(CLS, "11")["role"] == "bendahara"
    f.write_text("nis,nama_resmi,role\n12,X,raja\n", encoding="utf-8")
    with pytest.raises(CekasError):
        db.import_students_csv(CLS, str(f))
