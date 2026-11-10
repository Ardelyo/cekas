import re
from io import BytesIO

import pytest
from fastapi.testclient import TestClient
from openpyxl import load_workbook

from cekas.web import create_app
from .conftest import CLS


@pytest.fixture
def client(db):
    return TestClient(create_app(db, secret_key="test"), follow_redirects=False)


def login(c, pin="192837"):
    return c.post("/login", data={"pin": pin, "nama": "Tarina"})


def test_public_view_has_no_write_controls_and_no_js(client, db):
    r = client.get("/")
    assert r.status_code == 200
    assert "<script" not in r.text.lower() and "onclick" not in r.text.lower()
    assert "Catat transaksi" not in r.text and "Tandai lunas" not in r.text


@pytest.mark.parametrize("path,data", [
    ("/transaksi", {"tipe": "in", "nominal": "10k", "pos": "sosial", "keterangan": "x"}),
    ("/koreksi", {"tx_id": 1, "alasan": "x"}),
    ("/iuran", {"nis": "1", "week": 1}),
])
def test_writes_require_login(client, db, path, data):
    r = client.post(path, data=data)
    assert r.status_code == 303 and "/login" in r.headers["location"]
    assert db.get_all_transactions(CLS) == []


def test_excel_requires_login(client):
    assert client.get("/export/excel").status_code == 303


def test_wrong_pin_then_lockout(client):
    for _ in range(5):
        r = login(client, "000000")
        assert "PIN" in r.headers["location"] or "err" in r.headers["location"]
    r = login(client, "192837")  # benar, tetapi sedang terkunci
    assert "Terlalu" in __import__("urllib.parse").parse.unquote(r.headers["location"])
    assert "cekas_session" not in r.cookies


def test_full_flow(client, db):
    r = login(client)
    assert r.status_code == 303 and "cekas_session" in r.cookies
    client.cookies.set("cekas_session", r.cookies["cekas_session"])
    assert "HttpOnly" in r.headers["set-cookie"] and "SameSite=strict" in r.headers["set-cookie"]

    r = client.post("/transaksi", data={"tipe": "in", "nominal": "50k", "pos": "sosial", "keterangan": "donasi"})
    assert "msg=" in r.headers["location"]
    r = client.post("/transaksi", data={"tipe": "out", "nominal": "ngawur", "pos": "sosial", "keterangan": "x"})
    assert "err=" in r.headers["location"]
    r = client.post("/transaksi", data={"tipe": "out", "nominal": "90k", "pos": "sosial", "keterangan": "x"})
    assert "err=" in r.headers["location"]  # melebihi saldo pos
    assert client.post("/iuran", data={"nis": "1", "week": 3}).status_code == 303
    assert "err=" in client.post("/iuran", data={"nis": "1", "week": 3}).headers["location"]  # dobel
    assert db.get_or_create_class(CLS)["saldo"] == 60000
    tx = db.get_all_transactions(CLS)
    assert [t["source"] for t in tx] == ["web", "web"] and tx[0]["input_by"] == "Tarina"

    page = client.get("/?week=3").text
    assert "Rp 60.000" in page and "Koreksi" in page and "donasi" in page
    client.post("/koreksi", data={"tx_id": tx[0]["id"], "alasan": "salah"})
    assert db.get_or_create_class(CLS)["saldo"] == 10000
    assert client.get("/export/excel").status_code == 200
    assert client.get("/grafik.png").content.startswith(b"\x89PNG")
    assert client.get("/healthz").json() == {"ok": True, "integrity": True}
    client.post("/logout")


def test_forged_cookie_rejected(client):
    client.cookies.set("cekas_session", "palsu.palsu.palsu")
    assert client.post("/transaksi", data={"tipe": "in", "nominal": "1k", "pos": "sosial", "keterangan": "x"}).status_code == 303


def test_xss_escaped(client, db):
    db.record_transaction(CLS, "in", 1000, "sosial", '<img src=x onerror=alert(1)>', '<b>x</b>')
    html = client.get("/").text
    assert "<img src=x" not in html and "&lt;img" in html


def test_query_params_escaped_and_week_clamped(client):
    assert "<script>" not in client.get("/?msg=<script>alert(1)</script>").text
    assert client.get("/?week=9999").status_code == 200
    assert client.get("/?week=abc").status_code == 422


def test_excel_formula_injection_neutralised(db):
    from cekas.export_excel import generate_excel_report
    db.record_transaction(CLS, "in", 1000, "sosial", "=HYPERLINK(\"http://x\")", "+cmd")
    wb = load_workbook(BytesIO(generate_excel_report(db, CLS).read()))
    ws = wb["Buku Kas Umum"]
    cell = ws.cell(row=5, column=5)
    assert cell.data_type == "s" and cell.value.startswith("=HYPERLINK")
    assert set(wb.sheetnames) == {"Ringkasan Kas", "Buku Kas Umum", "Iuran Mingguan"}
