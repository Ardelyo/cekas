import pytest

from cekas.database import CekasDB

CLS = "XI-F2"


@pytest.fixture
def db():
    d = CekasDB(":memory:")
    d.get_or_create_class(CLS)
    for nis, nama, role in [("1", "Ani", "siswa"), ("2", "Budi", "siswa"), ("3", "Tarina", "bendahara"), ("9", "Wali", "wali_kelas")]:
        d.upsert_student(CLS, nis, nama, role)
    return d
