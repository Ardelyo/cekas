"""
CEKAS Formatters & Parsing Utilities
Supports standard and natural Indonesian currency strings, dates, and commands.
"""

import re
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, List

WIB = timezone(timedelta(hours=7))

def format_rupiah(amount: float | int) -> str:
    """Format numeric value to Indonesian Rupiah currency format.
    Example: 15000 -> "Rp 15.000"
    """
    num = round(float(amount or 0))
    formatted = f"{abs(num):,}".replace(",", ".")
    sign = "-Rp " if num < 0 else "Rp "
    return f"{sign}{formatted}"

def parse_nominal(input_str: Optional[str]) -> Optional[int]:
    """Parse user input string to integer nominal.
    Supports:
    - "10000" -> 10000
    - "10.000" or "10,000" -> 10000
    - "Rp 10.000" or "rp10000" -> 10000
    - "10k" or "10K" -> 10000
    - "10rb" or "10 rb" or "10 ribu" -> 10000
    - "1.5jt" or "1.5m" -> 1500000
    """
    if not input_str:
        return None
    
    clean = input_str.strip().lower()
    clean = re.sub(r"^rp\.?\s*", "", clean, flags=re.IGNORECASE)
    
    multiplier = 1
    k_match = re.search(r"(\d+(?:[.,]\d+)?)\s*(?:k|rb|ribu)$", clean)
    jt_match = re.search(r"(\d+(?:[.,]\d+)?)\s*(?:jt|juta|m)$", clean)
    
    if k_match:
        multiplier = 1000
        clean = re.sub(r"\s*(?:k|rb|ribu)$", "", clean)
    elif jt_match:
        multiplier = 1000000
        clean = re.sub(r"\s*(?:jt|juta|m)$", "", clean)
        
    if multiplier > 1:
        clean = clean.replace(",", ".")
        try:
            val = float(clean)
            if val <= 0:
                return None
            return round(val * multiplier)
        except ValueError:
            return None
            
    clean = re.sub(r"[.,\s]", "", clean)
    try:
        num = int(clean)
        return num if num > 0 else None
    except ValueError:
        return None

def normalize_category(raw_cat: Optional[str]) -> Optional[str]:
    """Map category alias/synonym to canonical pocket key."""
    if not raw_cat:
        return None
    c = raw_cat.strip().lower()
    
    if c in ["operasional", "ops", "rutin", "kelas", "kebersihan", "kbm"]:
        return "operasional"
    if c in ["sosial", "duka", "santunan", "sakit", "peduli"]:
        return "sosial"
    if c in ["event", "acara", "bukber", "kegiatan", "perpisahan", "wisuda", "lomba"]:
        return "event"
    if c in ["cadangan", "darurat", "lainnya", "sisa", "tabungan"]:
        return "cadangan"
    return None

def parse_transaction_args(args_str: Optional[str]) -> Dict[str, Any]:
    """Split transaction arguments into nominal, category, and description."""
    if not args_str:
        return {
            "amount": None,
            "raw_nominal": "",
            "category": "operasional",
            "description": ""
        }
        
    parts = args_str.strip().split()
    if not parts:
        return {
            "amount": None,
            "raw_nominal": "",
            "category": "operasional",
            "description": ""
        }
        
    raw_nominal = parts[0]
    amount = parse_nominal(raw_nominal)
    
    if len(parts) == 1:
        return {
            "amount": amount,
            "raw_nominal": raw_nominal,
            "category": "operasional",
            "description": ""
        }
        
    second_token = parts[1]
    matched_cat = normalize_category(second_token)
    
    if matched_cat:
        category = matched_cat
        description = " ".join(parts[2:]).strip()
    else:
        category = "operasional"
        description = " ".join(parts[1:]).strip()
        
    return {
        "amount": amount,
        "raw_nominal": raw_nominal,
        "category": category,
        "description": description
    }

def format_wib(dt: Optional[datetime] = None) -> str:
    """Format datetime to Indonesian WIB string."""
    if dt is None:
        dt = datetime.now(WIB)
    elif dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc).astimezone(WIB)
    else:
        dt = dt.astimezone(WIB)
    return dt.strftime("%d/%m/%Y, %H.%M.%S WIB")
