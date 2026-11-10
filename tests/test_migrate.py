import json

import pytest

from cekas import migrate
from cekas.cli import main
from cekas.database import CekasDB, CekasError
from .conftest import CLS


def fs(fields, name):
    """Bentuk dokumen sesuai REST API Firestore."""
    def enc(v):
        if v is None: return {"nullValue": None}
        if isinstance(v, bool): return {"booleanValue": v}
        if isinstance(v, int): return {"integerValue": str(v)}
        if isinstance(v, dict): return {"mapValue": {"fields": {k: enc(x) for k, x in v.items()}}}
        if isinstance(v, str) and v.endswith("Z"): return {"timestampValue": v}
        return {"stringValue": v}
    return {"name": f"projects/p/databases/(default)/documents/classes/XI-F2/x/{name}",
            "fields": {k: enc(v) for k, v in fields.items()}}


def snapshot():
    docs = [
        fs({"type": "in", "amount": 10000, "category": "operasional", "description": "Iuran Ani", "inputBy": "Tarina",
            "telegramId": 5, "studentNis": "1", "dueWeek": 1, "timestamp": "2026-09-01T01:00:00.123456789Z"}, "a1"),
        fs({"type": "in", "amount": 50000, "category": "sosial", "description": "Donasi", "inputBy": "Tarina",
            "timestamp": "2026-09-02T01:00:00Z", "isReversed": True, "correctionTxId": "a3"}, "a2"),
        fs({"type": "out", "amount": 50000, "category": "sosial", "description": "[KOREKSI #a2] salah", "inputBy": "Tarina",
            "isCorrection": True, "correctedTxId": "a2", "timestamp": "2026-09-03T01:00:00Z"}, "a3"),
        fs({"type": "out", "amount": 3000, "category": "aneh", "description": "Spidol", "inputBy": "T",
            "timestamp": "2026-09-04T01:00:00Z"}, "a4"),
        fs({"type": "bogus", "amount": 1, "timestamp": "2026-09-05T01:00:00Z"}, "a5"),
    ]
    dec = migrate._decode_doc
    return {
        "class": dec(fs({"nama": "Kelas X", "saldo": 7000, "pinBendahara": "654321", "nominalIuranMingguan": 10000}, "XI-F2")),
        "transactions": [dec(d) for d in docs],
        "whitelist_students": [dec(fs({"namaResmi": "Ani", "role": "siswa"}, "1")), dec(fs({"namaResmi": "Tarina", "role": "ketua"}, "3"))],
        "members": [dec(fs({"nama": "Tarina", "nis": "3", "role": "bendahara", "telegramId": 5, "notifAktif": False}, "user_5"))],
        "dues": [dec(fs({"nis": "1", "week": 1, "paid": True, "txId": "a1"}, "m1_1"))],
    }


def test_import_preserves_ledger_and_verifies(tmp_path):
    db = CekasDB(":memory:")
    rep = migrate.import_snapshot(db, snapshot(), CLS)
    assert rep["transaksi"] == 4 and rep["saldo_baru"] == 7000 and rep["saldo_cocok"] and rep["integritas_ok"]
    assert len(rep["warnings"]) == 1  # transaksi bogus dilewati dan dilaporkan
    txs = db.get_all_transactions(CLS)
    assert [t["description"] for t in txs][0] == "Iuran Ani"
    assert txs[1]["reversed_by_tx_id"] == txs[2]["id"] and txs[2]["corrects_tx_id"] == txs[1]["id"] and txs[2]["is_correction"]
    assert txs[3]["category"] == "operasional" and txs[0]["created_at"] == "2026-09-01T01:00:00+00:00"
    assert db.get_dues_status(CLS, 1)["paid_count"] == 1
    assert db.get_member(5, CLS)["notif_enabled"] == 0
    assert db.get_whitelist_student(CLS, "3")["role"] == "bendahara"  # 'ketua' dipetakan
    assert db.verify_pin(CLS, "654321")  # PIN sumber dipertahankan


def test_balance_mismatch_is_reported(tmp_path):
    snap = snapshot()
    snap["class"]["saldo"] = 999
    rep = migrate.import_snapshot(CekasDB(":memory:"), snap, CLS)
    assert not rep["saldo_cocok"] and any("berbeda" in w for w in rep["warnings"])


def test_refuses_double_import_unless_replace():
    db = CekasDB(":memory:")
    migrate.import_snapshot(db, snapshot(), CLS)
    with pytest.raises(CekasError):
        migrate.import_snapshot(db, snapshot(), CLS)
    rep = migrate.import_snapshot(db, snapshot(), CLS, replace=True)
    assert rep["transaksi"] == 4 and len(db.get_all_transactions(CLS)) == 4


def test_failed_import_leaves_db_untouched():
    db = CekasDB(":memory:")
    snap = snapshot()
    snap["whitelist_students"][0]["namaResmi"] = None
    snap["members"][0]["telegramId"] = "bukan angka"
    with pytest.raises(Exception):
        migrate.import_snapshot(db, snap, CLS)
    assert db.get_all_transactions(CLS) == [] and db.get_all_whitelist_students(CLS) == []


def test_cli_migrate_from_json(tmp_path, monkeypatch, capsys):
    monkeypatch.setattr("cekas.cli.DB_PATH", str(tmp_path / "m.db"))
    f = tmp_path / "x.json"
    f.write_text(json.dumps(snapshot()), encoding="utf-8")
    assert main(["migrate", "--dari", str(f)]) == 0
    assert "saldo_cocok: True" in capsys.readouterr().out
    assert main(["migrate", "--dari", str(f)]) == 1  # impor ganda ditolak
    assert main(["cek"]) == 0
    assert main(["status"]) == 0 and "Rp 7.000" in capsys.readouterr().out


def test_rest_pagination(monkeypatch):
    pages = {"transactions": [{"documents": [{"name": "x/a", "fields": {}}], "nextPageToken": "t"}, {"documents": [{"name": "x/b", "fields": {}}]}]}
    calls = []

    def fake(url):
        calls.append(url)
        if url.endswith("/XI-F2"):
            return {"name": "x/XI-F2", "fields": {}}
        if "/transactions" in url:
            return pages["transactions"].pop(0)
        return {}

    monkeypatch.setattr(migrate, "_get", fake)
    snap = migrate.fetch_firestore("p", "XI-F2")
    assert [t["_id"] for t in snap["transactions"]] == ["a", "b"]
