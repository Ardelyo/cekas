import pytest

from cekas.formatters import format_rupiah, normalize_category, parse_nominal, parse_transaction_args


@pytest.mark.parametrize("raw,exp", [
    ("10000", 10000), ("10.000", 10000), ("Rp 10.000", 10000), ("rp. 25.000", 25000), ("10k", 10000),
    ("25K", 25000), ("15rb", 15000), ("20 ribu", 20000), ("1.5jt", 1500000), ("1,5jt", 1500000),
    ("-5000", None), ("0", None), ("abc", None), ("", None), (None, None),
])
def test_parse_nominal(raw, exp):
    assert parse_nominal(raw) == exp


def test_format_rupiah():
    assert format_rupiah(15000) == "Rp 15.000"
    assert format_rupiah(0) == "Rp 0"
    assert format_rupiah(-2500) == "-Rp 2.500"


def test_category_and_args():
    assert normalize_category("bukber") == "event" and normalize_category("zzz") is None
    p = parse_transaction_args("10k sosial Santunan duka")
    assert (p["amount"], p["category"], p["description"]) == (10000, "sosial", "Santunan duka")
    p = parse_transaction_args("25.000 Beli spidol")
    assert (p["category"], p["description"]) == ("operasional", "Beli spidol")
    assert parse_transaction_args("")["amount"] is None
