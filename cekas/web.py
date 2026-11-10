"""Dashboard web CEKAS (FastAPI + Jinja2), server-rendered tanpa JavaScript.

Akses publik: lihat saldo, mutasi, status iuran, grafik (transparansi kelas).
Akses bendahara (login PIN): catat transaksi, koreksi, tandai iuran, unduh Excel.
"""

from __future__ import annotations

import os
import secrets
import time
from pathlib import Path
from typing import Optional
from urllib.parse import quote

from fastapi import Depends, FastAPI, Form, HTTPException, Request
from fastapi.responses import HTMLResponse, RedirectResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer

from .chart import generate_financial_chart
from .config import CLASS_ID, DB_PATH, POCKET_CONFIG, SECRET_KEY
from .database import CekasDB, CekasError
from .export_excel import generate_excel_report
from .formatters import format_rupiah, format_wib, parse_nominal, parse_utc

BASE = Path(__file__).resolve().parent
COOKIE = "cekas_session"
SESSION_TTL = 8 * 3600
MAX_FAILS, LOCK_SECONDS = 5, 300


def create_app(db: Optional[CekasDB] = None, secret_key: str = "") -> FastAPI:
    db = db or CekasDB(DB_PATH)
    db.get_or_create_class(CLASS_ID)
    signer = URLSafeTimedSerializer(secret_key or SECRET_KEY or secrets.token_hex(32), salt="cekas-login")
    fails: dict[str, list[float]] = {}  # ip -> waktu gagal login

    app = FastAPI(title="CEKAS", version="3.0.0", docs_url=None, redoc_url=None, openapi_url=None)
    app.mount("/static", StaticFiles(directory=str(BASE / "static")), name="static")
    templates = Jinja2Templates(directory=str(BASE / "templates"))
    templates.env.filters["rupiah"] = format_rupiah
    templates.env.filters["wib"] = lambda v: format_wib(parse_utc(v))

    def session_of(request: Request) -> Optional[dict]:
        token = request.cookies.get(COOKIE)
        if not token:
            return None
        try:
            return signer.loads(token, max_age=SESSION_TTL)
        except (BadSignature, SignatureExpired):
            return None

    def require_bendahara(request: Request) -> dict:
        sess = session_of(request)
        if not sess:
            raise HTTPException(status_code=303, headers={"Location": "/login?err=" + quote("Login bendahara dulu.")})
        return sess

    def back(path: str, msg: str = "", err: str = "") -> RedirectResponse:
        sep = "&" if "?" in path else "?"
        extra = (f"{sep}msg={quote(msg)}" if msg else "") + (f"{sep if not msg else '&'}err={quote(err)}" if err else "")
        return RedirectResponse(url=path + extra, status_code=303)

    @app.get("/", response_class=HTMLResponse)
    def dashboard(request: Request, week: int = 1, msg: str = "", err: str = ""):
        week = min(max(week, 1), 60)
        return templates.TemplateResponse(
            request=request,
            name="dashboard.html",
            context={
                "info": db.get_or_create_class(CLASS_ID),
                "pockets": POCKET_CONFIG,
                "dues": db.get_dues_status(CLASS_ID, week),
                "week": week,
                "txs": db.get_recent_transactions(CLASS_ID, limit=25),
                "session": session_of(request),
                "msg": msg,
                "err": err,
            },
        )

    @app.get("/login", response_class=HTMLResponse)
    def login_page(request: Request, msg: str = "", err: str = ""):
        return templates.TemplateResponse(request=request, name="login.html", context={"session": session_of(request), "msg": msg, "err": err})

    @app.post("/login")
    def login(request: Request, pin: str = Form(...), nama: str = Form("Bendahara")):
        ip = request.client.host if request.client else "?"
        now = time.time()
        recent = [t for t in fails.get(ip, []) if now - t < LOCK_SECONDS]
        if len(recent) >= MAX_FAILS:
            fails[ip] = recent
            return back("/login", err="Terlalu banyak percobaan. Coba lagi beberapa menit lagi.")
        if not db.verify_pin(CLASS_ID, pin):
            fails[ip] = recent + [now]
            return back("/login", err="PIN salah.")
        fails.pop(ip, None)
        resp = back("/", msg="Login berhasil.")
        token = signer.dumps({"nama": (nama.strip() or "Bendahara")[:40]})
        resp.set_cookie(COOKIE, token, max_age=SESSION_TTL, httponly=True, samesite="strict",
                        secure=request.url.scheme == "https")
        return resp

    @app.post("/logout")
    def logout():
        resp = back("/", msg="Anda sudah keluar.")
        resp.delete_cookie(COOKIE)
        return resp

    @app.post("/transaksi")
    def create_transaction(
        tipe: str = Form(...), nominal: str = Form(...), pos: str = Form(...),
        keterangan: str = Form(...), sess: dict = Depends(require_bendahara),
    ):
        amount = parse_nominal(nominal)
        if not amount:
            return back("/", err="Nominal tidak valid. Contoh: 10000, 10k, 15rb.")
        try:
            r = db.record_transaction(CLASS_ID, tipe, amount, pos, keterangan, sess["nama"], None, "web")
        except CekasError as e:
            return back("/", err=str(e))
        return back("/", msg=f"Tercatat #{r['tx_id']}. Saldo: {format_rupiah(r['saldo_total'])}")

    @app.post("/koreksi")
    def reverse(tx_id: int = Form(...), alasan: str = Form(...), sess: dict = Depends(require_bendahara)):
        try:
            r = db.reverse_transaction(CLASS_ID, tx_id, alasan, sess["nama"], None, "web")
        except CekasError as e:
            return back("/", err=str(e))
        return back("/", msg=f"Transaksi #{tx_id} dikoreksi (#{r['correction_id']}).")

    @app.post("/iuran")
    def pay(nis: str = Form(...), week: int = Form(1), sess: dict = Depends(require_bendahara)):
        try:
            r = db.mark_dues_paid(CLASS_ID, nis, week, sess["nama"], None, "web")
        except CekasError as e:
            return back(f"/?week={week}", err=str(e))
        return back(f"/?week={week}", msg=f"{r['nama']} lunas minggu ke-{week}.")

    @app.get("/export/excel")
    def export_excel(sess: dict = Depends(require_bendahara)):
        stream = generate_excel_report(db, CLASS_ID)
        name = f"Laporan_Kas_{CLASS_ID}.xlsx"
        return StreamingResponse(
            stream,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f'attachment; filename="{name}"'},
        )

    @app.get("/grafik.png")
    def chart():
        return StreamingResponse(generate_financial_chart(db, CLASS_ID), media_type="image/png")

    @app.get("/healthz")
    def health():
        return {"ok": True, "integrity": db.verify_integrity(CLASS_ID)["ok"]}

    return app


def app_factory() -> FastAPI:  # untuk `uvicorn cekas.web:app_factory --factory`
    return create_app()
