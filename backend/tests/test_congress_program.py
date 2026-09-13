"""Тесты программы конгресса: даты дней, пустые строки в датах/времени,
проверка существования родителя и фильтры выборок."""
from datetime import date


async def test_create_program_day_with_date(client, congress):
    """День программы с датой создаётся и дата возвращается как есть."""
    response = await client.post(
        "/api/congress/congress-program-days",
        json={
            "congress_id": congress.id,
            "date": "2026-09-25",
            "title_ru": "День 1",
            "title_uz": "",
            "title_en": "",
        },
    )
    assert response.status_code == 200, response.text
    assert response.json()["date"] == "2026-09-25"


async def test_list_program_days_serializes_date(client, congress, make_day):
    """Список дней не падает на дне с проставленной датой."""
    await make_day(congress.id, date=date(2026, 9, 25), title_ru="День 1")

    response = await client.get(
        "/api/congress/congress-program-days", params={"congress_id": congress.id}
    )
    assert response.status_code == 200, response.text
    days = response.json()
    assert len(days) == 1
    assert days[0]["date"] == "2026-09-25"


async def test_congress_detail_serializes_day_date(client, congress, make_day):
    """Детальная выдача конгресса отдаёт дату дня программы."""
    await make_day(congress.id, date=date(2026, 9, 25), title_ru="День 1")

    response = await client.get(f"/api/congress/congresses/{congress.id}/detail")
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["program_days"][0]["date"] == "2026-09-25"


async def test_update_program_day_date(client, congress, make_day):
    """Дату дня можно изменить через PUT."""
    day = await make_day(congress.id, date=date(2026, 9, 25), title_ru="День 1")

    response = await client.put(
        f"/api/congress/congress-program-days/{day.id}", json={"date": "2026-09-26"}
    )
    assert response.status_code == 200, response.text
    assert response.json()["date"] == "2026-09-26"


async def test_create_program_section(client, congress, make_day):
    """Секция создаётся для существующего дня."""
    day = await make_day(congress.id, title_ru="День 1")

    response = await client.post(
        "/api/congress/congress-program-sections",
        json={
            "day_id": day.id,
            "title_ru": "Секция",
            "title_uz": "",
            "title_en": "",
            "order": 0,
        },
    )
    assert response.status_code == 200, response.text
    assert response.json()["day_id"] == day.id


# ==================== ПУСТЫЕ СТРОКИ ВМЕСТО ДАТ/ВРЕМЕНИ ====================

async def test_create_speaker_with_empty_time_strings(client, congress):
    """Форма шлёт '' для незаполненного времени — это должно значить None."""
    response = await client.post(
        "/api/congress/congress-speakers",
        json={
            "congress_id": congress.id,
            "last_name_ru": "Иванов",
            "last_name_uz": "Ivanov",
            "last_name_en": "Ivanov",
            "first_name_ru": "Иван",
            "first_name_uz": "Ivan",
            "first_name_en": "Ivan",
            "time_start": "",
            "time_end": "",
        },
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["time_start"] is None
    assert data["time_end"] is None


async def test_create_congress_with_empty_date_strings(client):
    """То же самое для дат конгресса."""
    response = await client.post(
        "/api/congress/congresses",
        json={
            "title_ru": "Конгресс",
            "title_uz": "Kongress",
            "title_en": "Congress",
            "date_start": "",
            "date_end": "",
        },
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["date_start"] is None
    assert data["date_end"] is None


async def test_create_program_day_with_empty_date_string(client, congress):
    """И для даты дня программы."""
    response = await client.post(
        "/api/congress/congress-program-days",
        json={
            "congress_id": congress.id,
            "date": "",
            "title_ru": "День без даты",
            "title_uz": "",
            "title_en": "",
        },
    )
    assert response.status_code == 200, response.text
    assert response.json()["date"] is None


# ==================== ПРОВЕРКА РОДИТЕЛЯ ====================

async def test_create_program_day_unknown_congress(client):
    response = await client.post(
        "/api/congress/congress-program-days",
        json={
            "congress_id": 999,
            "title_ru": "День 1",
            "title_uz": "",
            "title_en": "",
        },
    )
    assert response.status_code == 404, response.text


async def test_create_program_section_unknown_day(client):
    response = await client.post(
        "/api/congress/congress-program-sections",
        json={"day_id": 999, "title_ru": "Секция", "title_uz": "", "title_en": "", "order": 0},
    )
    assert response.status_code == 404, response.text


async def test_create_speaker_unknown_congress(client):
    response = await client.post(
        "/api/congress/congress-speakers",
        json={
            "congress_id": 999,
            "last_name_ru": "Иванов",
            "last_name_uz": "Ivanov",
            "last_name_en": "Ivanov",
            "first_name_ru": "Иван",
            "first_name_uz": "Ivan",
            "first_name_en": "Ivan",
        },
    )
    assert response.status_code == 404, response.text


async def test_create_speaker_unknown_section(client, congress):
    response = await client.post(
        "/api/congress/congress-speakers",
        json={
            "congress_id": congress.id,
            "section_id": 999,
            "last_name_ru": "Иванов",
            "last_name_uz": "Ivanov",
            "last_name_en": "Ivanov",
            "first_name_ru": "Иван",
            "first_name_uz": "Ivan",
            "first_name_en": "Ivan",
        },
    )
    assert response.status_code == 404, response.text


# ==================== ВЫБОРКА СЕКЦИЙ И ПЕРЕНОС МЕЖДУ ДНЯМИ ====================

async def test_list_sections_by_congress(client, make_congress, make_day, make_section):
    """congress_id отбирает секции только своего конгресса; day_id работает как раньше."""
    first = await make_congress("Первый конгресс")
    second = await make_congress("Второй конгресс")
    first_day = await make_day(first.id, title_ru="День первого", order=0)
    second_day = await make_day(second.id, title_ru="День второго", order=0)
    first_section = await make_section(first_day.id, title_ru="Секция первого")
    await make_section(second_day.id, title_ru="Секция второго")

    response = await client.get(
        "/api/congress/congress-program-sections", params={"congress_id": first.id}
    )
    assert response.status_code == 200, response.text
    assert [s["id"] for s in response.json()] == [first_section.id]

    response = await client.get(
        "/api/congress/congress-program-sections", params={"day_id": first_day.id}
    )
    assert response.status_code == 200, response.text
    assert [s["day_id"] for s in response.json()] == [first_day.id]


async def test_update_section_day_id(client, congress, make_day, make_section):
    """Секцию можно перенести в другой день."""
    day1 = await make_day(congress.id, title_ru="День 1", order=0)
    day2 = await make_day(congress.id, title_ru="День 2", order=1)
    section = await make_section(day1.id)

    response = await client.put(
        f"/api/congress/congress-program-sections/{section.id}", json={"day_id": day2.id}
    )
    assert response.status_code == 200, response.text
    assert response.json()["day_id"] == day2.id


async def test_update_section_unknown_day_id(client, congress, make_day, make_section):
    day = await make_day(congress.id, title_ru="День 1")
    section = await make_section(day.id)

    response = await client.put(
        f"/api/congress/congress-program-sections/{section.id}", json={"day_id": 999}
    )
    assert response.status_code == 404, response.text


async def test_update_section_null_day_id(client, congress, make_day, make_section):
    """day_id=null не должен уходить в NOT NULL колонку и валить запрос 500-й."""
    day = await make_day(congress.id, title_ru="День 1")
    section = await make_section(day.id)

    response = await client.put(
        f"/api/congress/congress-program-sections/{section.id}", json={"day_id": None}
    )
    assert response.status_code == 422, response.text
