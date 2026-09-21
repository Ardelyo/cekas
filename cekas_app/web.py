"""
CEKAS FastAPI Web Dashboard & API
Supports interactive desktop/mobile browser and Telegram Mini App.
"""

from pathlib import Path
from fastapi import FastAPI, Request, Form, HTTPException
from fastapi.responses import HTMLResponse, StreamingResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles

from .config import CLASS_ID, CLASS_NAME, DB_PATH, POCKET_CONFIG
from .database import CekasDB
from .formatters import format_rupiah, parse_nominal, format_wib
from .export_excel import generate_excel_report
from .generate_chart import generate_financial_chart

app = FastAPI(title="CEKAS Web Dashboard", version="2.0.0")

BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
STATIC_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

TEMPLATES_DIR = BASE_DIR / "templates"
templates = Jinja2Templates(directory=str(TEMPLATES_DIR))

# Global DB instance
db = CekasDB(DB_PATH)
db.get_or_create_class(CLASS_ID)
db.seed_initial_students(CLASS_ID)

@app.get("/", response_class=HTMLResponse)
async def dashboard_view(request: Request, week: int = 1):
    class_info = db.get_or_create_class(CLASS_ID)
    dues_status = db.get_dues_status(CLASS_ID, week_num=week)
    all_students = db.get_all_whitelist_students(CLASS_ID)
    recent_transactions = db.get_recent_transactions(CLASS_ID, limit=20)

    return templates.TemplateResponse(
        request=request,
        name="dashboard.html",
        context={
            "class_info": class_info,
            "pockets": POCKET_CONFIG,
            "dues_status": dues_status,
            "all_students": all_students,
            "recent_transactions": recent_transactions,
            "format_rupiah": format_rupiah,
        }
    )

@app.post("/api/transaction/create")
async def create_transaction(
    type: str = Form(...),
    nominal: str = Form(...),
    category: str = Form(...),
    description: str = Form(...),
    input_by: str = Form("Tarina")
):
    amount = parse_nominal(nominal)
    if not amount or amount <= 0:
        raise HTTPException(status_code=400, detail="Nominal tidak valid.")

    db.record_transaction(
        class_id=CLASS_ID,
        tx_type=type,
        amount=amount,
        category=category,
        description=description,
        input_by=input_by,
        telegram_id=123456789
    )
    return RedirectResponse(url="/", status_code=303)

@app.post("/api/transaction/reverse")
async def reverse_transaction(
    tx_id: int = Form(...),
    reason: str = Form("Koreksi manual via Web"),
    reversed_by: str = Form("Tarina")
):
    try:
        db.reverse_transaction(
            class_id=CLASS_ID,
            tx_id=tx_id,
            reason=reason,
            reversed_by=reversed_by,
            telegram_id=123456789
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return RedirectResponse(url="/", status_code=303)

@app.post("/api/dues/pay")
async def pay_dues(
    nis: str = Form(...),
    week_num: int = Form(1),
    recorded_by: str = Form("Tarina")
):
    try:
        db.mark_dues_paid(
            class_id=CLASS_ID,
            nis=nis,
            week_num=week_num,
            recorded_by=recorded_by,
            telegram_id=123456789,
            auto_tx=True
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return RedirectResponse(url=f"/?week={week_num}", status_code=303)

@app.get("/api/export/excel")
async def export_excel():
    excel_stream = generate_excel_report(db, CLASS_ID)
    filename = f"Laporan_Kas_{CLASS_ID}_{format_wib()[:10].replace('/', '-')}.xlsx"
    return StreamingResponse(
        excel_stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@app.get("/api/export/chart")
async def export_chart():
    img_stream = generate_financial_chart(db, CLASS_ID)
    return StreamingResponse(img_stream, media_type="image/png")
