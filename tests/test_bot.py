import asyncio
from types import SimpleNamespace as NS

import pytest

from cekas.bot import build_app
from .conftest import CLS


class FakeMsg:
    def __init__(self):
        self.sent = []
        self.deleted = False

    async def reply_text(self, text, **kw):
        self.sent.append(text)

    async def reply_photo(self, *a, **kw):
        self.sent.append("PHOTO")

    async def reply_document(self, *a, **kw):
        self.sent.append("DOC")

    async def delete(self):
        self.deleted = True


class FakeBot:
    def __init__(self):
        self.sent = []

    async def send_message(self, chat_id, text, **kw):
        self.sent.append((chat_id, text))


@pytest.fixture
def run(db):
    app = build_app(db, token="123:ABC")
    handlers = {}
    for group in app.handlers.values():
        for h in group:
            for c in h.commands:
                handlers[c] = h.callback

    def call(cmd, args, uid=1, name="User"):
        msg, bot = FakeMsg(), FakeBot()
        upd = NS(effective_user=NS(id=uid, full_name=name, username="u"), effective_message=msg,
                 effective_chat=NS(id=uid))
        ctx = NS(args=args, bot=bot)
        asyncio.run(handlers[cmd](upd, ctx))
        return msg, bot

    call.handlers = handlers
    return call


def test_all_13_plus_commands_registered(run):
    expected = {"start", "help", "saldo", "alokasi", "riwayat", "tagihan", "grafik", "excel", "daftar",
                "notif", "klaimbendahara", "tambah", "kurang", "bayar", "koreksi"}
    assert expected <= set(run.handlers)


def test_write_commands_blocked_for_non_bendahara(run, db):
    for cmd, args in [("tambah", ["10k", "x"]), ("kurang", ["1k", "x"]), ("bayar", ["1"]), ("koreksi", ["1", "x"])]:
        msg, _ = run(cmd, args)
        assert "khusus bendahara" in msg.sent[0]
    assert db.get_all_transactions(CLS) == []


def test_claim_then_full_flow_with_notification(run, db):
    run("daftar", ["1"], uid=10)  # siswa penerima notifikasi
    msg, _ = run("klaimbendahara", ["salah"], uid=20)
    assert msg.deleted and not db.is_bendahara(20, CLS)
    run("klaimbendahara", ["192837"], uid=20, name="Tarina")
    assert db.is_bendahara(20, CLS)

    msg, bot = run("tambah", ["50k", "sosial", "Donasi"], uid=20)
    assert "Rp 50.000" in msg.sent[0] and [c for c, _ in bot.sent] == [10]
    msg, _ = run("kurang", ["80k", "sosial", "Terlalu besar"], uid=20)
    assert "Gagal" in msg.sent[0] and "tidak cukup" in msg.sent[0]
    msg, _ = run("bayar", ["2", "3"], uid=20)
    assert "lunas minggu ke-3" in msg.sent[0]
    msg, _ = run("bayar", ["2", "3"], uid=20)
    assert "sudah lunas" in msg.sent[0]
    msg, _ = run("bayar", ["2", "abc"], uid=20)
    assert "angka" in msg.sent[0]
    msg, _ = run("koreksi", ["1", "salah"], uid=20)
    assert "dikoreksi" in msg.sent[0]
    msg, _ = run("koreksi", ["x"], uid=20)
    assert "Format" in msg.sent[0]
    assert db.verify_integrity(CLS)["ok"] and db.get_or_create_class(CLS)["saldo"] == 10000


def test_read_commands(run, db):
    db.record_transaction(CLS, "in", 5000, "sosial", "<b>x</b>", "T")
    for cmd in ["start", "saldo", "alokasi", "riwayat", "tagihan", "grafik", "excel"]:
        assert run(cmd, [])[0].sent, cmd
    assert "&lt;b&gt;" in run("riwayat", [])[0].sent[0]  # HTML di-escape
    assert "Format" in run("tagihan", ["abc"])[0].sent[0]
    assert "Format" in run("daftar", [])[0].sent[0]
    assert "tidak terdaftar" in run("daftar", ["404"])[0].sent[0]
    assert "Terdaftar" in run("daftar", ["1"], uid=5)[0].sent[0]
    assert "dimatikan" in run("notif", [], uid=5)[0].sent[0]
    assert "Daftar dulu" in run("notif", [], uid=77)[0].sent[0]


def test_requires_token(db):
    with pytest.raises(RuntimeError):
        build_app(db, token="")
