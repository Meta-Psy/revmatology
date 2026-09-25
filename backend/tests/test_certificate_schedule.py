"""Когда выдача сертификатов открыта (К-12, design-doc §4).

Чистые функции: решение зависит только от аргументов, «сегодня» приходит
снаружи.
"""
from datetime import date, datetime, timedelta, timezone

import pytest

from functions.certificate_schedule import TASHKENT, certificate_opens_on, certificates_open, today_in_tashkent

END = datetime(2026, 9, 25, 18, 0, tzinfo=TASHKENT)  # конгресс кончается 25-го вечером
DAY_AFTER = date(2026, 9, 26)


@pytest.mark.parametrize("mode", ["auto", "open", "closed"])
def test_no_template_means_closed(mode):
    assert certificates_open(mode, False, END, date(2030, 1, 1)) is False
    assert certificate_opens_on(mode, False, END, date(2020, 1, 1)) is None


def test_open_and_closed_ignore_dates():
    assert certificates_open("open", True, None, date(2020, 1, 1)) is True
    assert certificates_open("closed", True, END, date(2030, 1, 1)) is False
    # руками открытая или закрытая выдача даты автооткрытия не обещает
    assert certificate_opens_on("open", True, END, date(2020, 1, 1)) is None
    assert certificate_opens_on("closed", True, END, date(2020, 1, 1)) is None


def test_auto_opens_the_day_after_the_end():
    assert certificates_open("auto", True, END, date(2026, 9, 25)) is False  # в последний день ещё закрыто
    assert certificates_open("auto", True, END, DAY_AFTER) is True
    assert certificates_open("auto", True, END, date(2026, 10, 1)) is True


def test_auto_without_date_end_is_closed():
    assert certificates_open("auto", True, None, date(2030, 1, 1)) is False
    assert certificate_opens_on("auto", True, None, date(2030, 1, 1)) is None


def test_opens_on_only_while_closed():
    assert certificate_opens_on("auto", True, END, date(2026, 9, 25)) == DAY_AFTER
    assert certificate_opens_on("auto", True, END, DAY_AFTER) is None  # уже открыто


def test_date_end_is_read_in_tashkent():
    """22:00 UTC 25-го — это уже 26-е в Ташкенте (+05:00), конгресс кончился."""
    late = datetime(2026, 9, 25, 22, 0, tzinfo=timezone.utc)
    assert certificates_open("auto", True, late, date(2026, 9, 26)) is False
    assert certificates_open("auto", True, late, date(2026, 9, 27)) is True
    assert certificate_opens_on("auto", True, late, date(2026, 9, 26)) == date(2026, 9, 27)


def test_naive_date_end_is_local():
    """В БД дата может лежать без зоны (SQLite) — считаем её ташкентской."""
    naive = datetime(2026, 9, 25, 18, 0)
    assert certificates_open("auto", True, naive, date(2026, 9, 25)) is False
    assert certificates_open("auto", True, naive, DAY_AFTER) is True


def test_plain_date_end_works():
    assert certificates_open("auto", True, date(2026, 9, 25), DAY_AFTER) is True


def test_today_in_tashkent_matches_the_zone():
    assert today_in_tashkent() == datetime.now(TASHKENT).date()
    # и отличается от UTC-даты ровно тогда, когда в Ташкенте уже следующий день
    delta = today_in_tashkent() - datetime.now(timezone.utc).date()
    assert delta in (timedelta(0), timedelta(days=1))


def test_one_list_of_modes_everywhere():
    """Список режимов объявлен один раз: схема, CHECK и параметризация — от него.

    Отдельной копии в functions/certificate_schedule быть не должно: она ничего
    не проверяла и создавала ложное ощущение проверки.
    """
    from typing import get_args

    import functions.certificate_schedule as schedule
    from database.models import CERTIFICATE_ISSUE_MODES, ISSUE_MODE_CHECK
    from schemas.certificates import IssueMode

    assert get_args(IssueMode) == CERTIFICATE_ISSUE_MODES
    assert ISSUE_MODE_CHECK == "issue_mode IN ('auto', 'open', 'closed')"
    assert not hasattr(schedule, "ISSUE_MODES")
