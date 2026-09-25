"""Когда открыта выдача сертификатов (К-12).

Чистые функции без БД — покрываются tests/test_certificate_schedule.py.
Правило одно на все пути: статус, подсказки, выдачу, кабинет и настройки.
"""
from datetime import date, datetime, timedelta
from typing import Optional, Union
from zoneinfo import ZoneInfo

# Конгресс идёт в Ташкенте: «следующий день после окончания» считается по нему,
# а не по UTC и не по зоне сервера
TASHKENT = ZoneInfo("Asia/Tashkent")

DateLike = Union[datetime, date, None]


def today_in_tashkent() -> date:
    return datetime.now(TASHKENT).date()


def _local_date(value: DateLike) -> Optional[date]:
    """Дата окончания конгресса по Ташкенту; без зоны — считается местной."""
    if value is None:
        return None
    if isinstance(value, datetime):
        return (value.astimezone(TASHKENT) if value.tzinfo else value).date()
    return value


def certificates_open(mode: str, has_pdf: bool, date_end: DateLike, today: date) -> bool:
    """Открыта ли выдача: бланк загружен и режим (или дата) это позволяет.

    Режим приходит из колонки под CHECK и из схемы с Literal — список значений
    сторожится там (database.models.CERTIFICATE_ISSUE_MODES), здесь его не
    перепроверяем. Всё, что не «open» и не «closed», считается «auto».
    """
    if not has_pdf:
        return False
    if mode == "open":
        return True
    if mode == "closed":
        return False
    end = _local_date(date_end)  # auto: со следующего дня после окончания
    return end is not None and today > end


def certificate_opens_on(mode: str, has_pdf: bool, date_end: DateLike, today: date) -> Optional[date]:
    """Дата, когда выдача откроется сама, — пока она закрыта; иначе None."""
    if mode != "auto" or not has_pdf:
        return None
    end = _local_date(date_end)
    if end is None or today > end:
        return None
    return end + timedelta(days=1)
