"""P-01: секретарь собирает программу конгресса, участник видит её на своём языке.

Правило голой базы: разрешена только фикстура `client`. ORM-фабрики корневого
conftest (`congress`, `make_day`, `make_section`) здесь запрещены — состояние,
собранное в обход API, скрывает ровно те дефекты, ради которых прогон и пишется
(дата дня, затенённая именем поля, уезжала в 422 только на входе схемы).

Админ-зависимость подменена глобально в корневом conftest; публичные шаги
(`/detail`) авторизации не требуют и на подмену не опираются.
"""

PROCESS_ID = "P-01"

DAY_1_DATE = "2026-09-25"
DAY_2_DATE = "2026-09-26"
SECTION_1_TITLE_UZ = "1-seksiya"
SECTION_2_TITLE_UZ = "2-seksiya"
MISSING_ID = 999999


async def _create_section(client, day_id, *, ru, uz, en, order=0):
    """POST секции программы: три языка обязательны, так что вырожденного вызова нет."""
    return await client.post(
        "/api/congress/congress-program-sections",
        json={
            "day_id": day_id,
            "title_ru": ru,
            "title_uz": uz,
            "title_en": en,
            "order": order,
        },
    )


async def test_p01(journey, client):
    j = journey(PROCESS_ID)

    # --- create_congress -----------------------------------------------------
    created = await j.step(
        "create_congress",
        lambda: client.post(
            "/api/congress/congresses",
            json={
                "title_ru": "XII съезд ревматологов",
                "title_uz": "Revmatologlar XII qurultoyi",
                "title_en": "12th Congress of Rheumatologists",
                "date_start": "2026-09-25T09:00:00",
                "date_end": "2026-09-26T18:00:00",
            },
        ),
    )
    assert created.status_code == 200, f"[create_congress] {created.status_code}: {created.text}"
    congress_id = created.json()["id"]

    # --- create_days ---------------------------------------------------------
    # title_uz заполнен у первого дня и пуст у второго: UZ необязателен, и
    # пустая строка не должна ломать ни запись, ни публичную отдачу.
    day_1_response = await j.step(
        "create_days",
        lambda: client.post(
            "/api/congress/congress-program-days",
            json={
                "congress_id": congress_id,
                "date": DAY_1_DATE,
                "title_ru": "День первый",
                "title_uz": "Birinchi kun",
                "title_en": "Day one",
                "order": 0,
            },
        ),
    )
    assert day_1_response.status_code == 200, (
        f"[create_days] день 1 не создан: {day_1_response.status_code}: {day_1_response.text}"
    )
    day_1 = day_1_response.json()
    assert day_1["date"] == DAY_1_DATE, (
        f"[create_days] дата дня 1 сохранена как {day_1['date']!r}, ожидалась {DAY_1_DATE}"
    )

    day_2_response = await client.post(
        "/api/congress/congress-program-days",
        json={
            "congress_id": congress_id,
            "date": DAY_2_DATE,
            "title_ru": "День второй",
            "title_uz": "",
            "title_en": "Day two",
            "order": 1,
        },
    )
    assert day_2_response.status_code == 200, (
        f"[create_days] день 2 не создан: {day_2_response.status_code}: {day_2_response.text}"
    )
    day_2 = day_2_response.json()
    assert day_2["date"] == DAY_2_DATE, (
        f"[create_days] дата дня 2 сохранена как {day_2['date']!r}, ожидалась {DAY_2_DATE}"
    )
    day_1_id, day_2_id = day_1["id"], day_2["id"]

    # --- days_in_list --------------------------------------------------------
    days_response = await j.step(
        "days_in_list",
        lambda: client.get(f"/api/congress/congress-program-days?congress_id={congress_id}"),
    )
    assert days_response.status_code == 200, (
        f"[days_in_list] {days_response.status_code}: {days_response.text}"
    )
    days = days_response.json()
    j.contains("days_in_list", days, lambda d: d["id"] == day_1_id and d["date"] == DAY_1_DATE)
    assert len(days) == 2, f"[days_in_list] ожидались два дня, пришло {len(days)}: {days}"
    assert [d["id"] for d in days] == [day_1_id, day_2_id], (
        "[days_in_list] порядок по order нарушен: "
        f"{[(d['id'], d['order']) for d in days]}"
    )
    assert [d["date"] for d in days] == [DAY_1_DATE, DAY_2_DATE], (
        f"[days_in_list] даты потерялись или разъехались: {[d['date'] for d in days]}"
    )

    # --- create_sections -----------------------------------------------------
    section_1_response = await j.step(
        "create_sections",
        lambda: _create_section(
            client,
            day_1_id,
            ru="Секция ранней диагностики",
            uz=SECTION_1_TITLE_UZ,
            en="Early diagnosis session",
        ),
    )
    assert section_1_response.status_code == 200, (
        f"[create_sections] секция дня 1: {section_1_response.status_code}: {section_1_response.text}"
    )
    section_2_response = await _create_section(
        client,
        day_2_id,
        ru="Секция терапии",
        uz=SECTION_2_TITLE_UZ,
        en="Therapy session",
        order=1,
    )
    assert section_2_response.status_code == 200, (
        f"[create_sections] секция дня 2: {section_2_response.status_code}: {section_2_response.text}"
    )
    section_1_id = section_1_response.json()["id"]
    section_2_id = section_2_response.json()["id"]

    # --- sections_by_congress ------------------------------------------------
    # Чужой конгресс со своим днём и секцией: на одном конгрессе фильтр по
    # congress_id зелёный и тогда, когда он не фильтрует вовсе.
    other_congress_response = await client.post(
        "/api/congress/congresses",
        json={
            "title_ru": "Чужой конгресс",
            "title_uz": "Begona qurultoy",
            "title_en": "Other congress",
        },
    )
    assert other_congress_response.status_code == 200, (
        f"[sections_by_congress] чужой конгресс не создан: {other_congress_response.text}"
    )
    other_day_response = await client.post(
        "/api/congress/congress-program-days",
        json={
            "congress_id": other_congress_response.json()["id"],
            "date": DAY_1_DATE,
            "title_ru": "Чужой день",
            "title_uz": "Begona kun",
            "title_en": "Other day",
            "order": 0,
        },
    )
    assert other_day_response.status_code == 200, (
        f"[sections_by_congress] день чужого конгресса: {other_day_response.text}"
    )
    other_section_response = await _create_section(
        client,
        other_day_response.json()["id"],
        ru="Чужая секция",
        uz="Begona seksiya",
        en="Other session",
    )
    assert other_section_response.status_code == 200, (
        f"[sections_by_congress] секция чужого конгресса: {other_section_response.text}"
    )
    other_section_id = other_section_response.json()["id"]

    sections_response = await j.step(
        "sections_by_congress",
        lambda: client.get(f"/api/congress/congress-program-sections?congress_id={congress_id}"),
    )
    assert sections_response.status_code == 200, (
        f"[sections_by_congress] {sections_response.status_code}: {sections_response.text}"
    )
    sections = sections_response.json()
    j.contains("sections_by_congress", sections, lambda s: s["id"] == section_2_id)
    assert [s["id"] for s in sections] == [section_1_id, section_2_id], (
        f"[sections_by_congress] ожидались секции {[section_1_id, section_2_id]} "
        f"в порядке день→секция, пришло {[s['id'] for s in sections]}"
    )
    assert all(s["id"] != other_section_id for s in sections), (
        f"[sections_by_congress] секция чужого конгресса {other_section_id} попала в выдачу"
    )

    # --- create_speaker_in_day2 ----------------------------------------------
    # Пустые строки времени — ровно то, что шлёт форма админки за незаполненное поле.
    speaker_response = await j.step(
        "create_speaker_in_day2",
        lambda: client.post(
            "/api/congress/congress-speakers",
            json={
                "congress_id": congress_id,
                "section_id": section_2_id,
                "last_name_ru": "Рахимов",
                "last_name_uz": "Rahimov",
                "last_name_en": "Rakhimov",
                "first_name_ru": "Азиз",
                "first_name_uz": "Aziz",
                "first_name_en": "Aziz",
                "time_start": "",
                "time_end": "",
            },
        ),
    )
    assert speaker_response.status_code == 200, (
        f"[create_speaker_in_day2] {speaker_response.status_code}: {speaker_response.text}"
    )
    speaker = speaker_response.json()
    assert speaker["time_start"] is None, (
        f"[create_speaker_in_day2] пустое время начала сохранено как "
        f"{speaker['time_start']!r}, ожидался None"
    )
    assert speaker["time_end"] is None, (
        f"[create_speaker_in_day2] пустое время конца сохранено как "
        f"{speaker['time_end']!r}, ожидался None"
    )
    assert speaker["section_id"] == section_2_id, (
        f"[create_speaker_in_day2] спикер привязан к секции {speaker['section_id']}, "
        f"ожидалась {section_2_id}"
    )
    speaker_id = speaker["id"]

    # --- move_section --------------------------------------------------------
    moved = await j.step(
        "move_section",
        lambda: client.put(
            f"/api/congress/congress-program-sections/{section_1_id}",
            json={"day_id": day_2_id},
        ),
    )
    assert moved.status_code == 200, f"[move_section] {moved.status_code}: {moved.text}"
    assert moved.json()["day_id"] == day_2_id, (
        f"[move_section] секция осталась в дне {moved.json()['day_id']}, ожидался {day_2_id}"
    )
    day_2_list = await client.get(f"/api/congress/congress-program-sections?day_id={day_2_id}")
    assert day_2_list.status_code == 200, f"[move_section] {day_2_list.status_code}: {day_2_list.text}"
    assert sorted(s["id"] for s in day_2_list.json()) == sorted([section_1_id, section_2_id]), (
        "[move_section] после переноса в дне 2 должны быть обе секции, пришло "
        f"{[s['id'] for s in day_2_list.json()]}"
    )

    # --- reject_orphan -------------------------------------------------------
    orphan_section = await j.step(
        "reject_orphan",
        lambda: _create_section(
            client,
            MISSING_ID,
            ru="Секция-сирота",
            uz="Yetim seksiya",
            en="Orphan session",
        ),
    )
    assert orphan_section.status_code == 404, (
        f"[reject_orphan] секция с несуществующим днём принята с кодом "
        f"{orphan_section.status_code}: {orphan_section.text}"
    )
    orphan_speaker = await client.post(
        "/api/congress/congress-speakers",
        json={
            "congress_id": congress_id,
            "section_id": MISSING_ID,
            "last_name_ru": "Сирота",
            "last_name_uz": "Yetim",
            "last_name_en": "Orphan",
            "first_name_ru": "Пётр",
            "first_name_uz": "Petr",
            "first_name_en": "Petr",
        },
    )
    assert orphan_speaker.status_code == 404, (
        f"[reject_orphan] спикер с несуществующей секцией принят с кодом "
        f"{orphan_speaker.status_code}: {orphan_speaker.text}"
    )

    # --- public_detail_readback ----------------------------------------------
    detail_response = await j.step(
        "public_detail_readback",
        lambda: client.get(f"/api/congress/congresses/{congress_id}/detail"),
    )
    assert detail_response.status_code == 200, (
        f"[public_detail_readback] {detail_response.status_code}: {detail_response.text}"
    )
    detail = detail_response.json()

    program_days = detail["program_days"]
    assert [d["id"] for d in program_days] == [day_1_id, day_2_id], (
        f"[public_detail_readback] дни отданы как {[d['id'] for d in program_days]}, "
        f"ожидались {[day_1_id, day_2_id]} по порядку"
    )
    assert [d["date"] for d in program_days] == [DAY_1_DATE, DAY_2_DATE], (
        "[public_detail_readback] даты дней в публичной выдаче: "
        f"{[d['date'] for d in program_days]}"
    )

    day_1_payload, day_2_payload = program_days
    assert day_1_payload["sections"] == [], (
        "[public_detail_readback] день 1 после переноса должен быть пуст, в нём "
        f"{[s['id'] for s in day_1_payload['sections']]}"
    )
    day_2_sections = day_2_payload["sections"]
    assert sorted(s["id"] for s in day_2_sections) == sorted([section_1_id, section_2_id]), (
        "[public_detail_readback] в дне 2 ожидались обе секции, пришло "
        f"{[s['id'] for s in day_2_sections]}"
    )

    by_id = {s["id"]: s for s in day_2_sections}
    assert by_id[section_1_id]["title_uz"] == SECTION_1_TITLE_UZ, (
        "[public_detail_readback] UZ-название перенесённой секции: "
        f"{by_id[section_1_id]['title_uz']!r}"
    )
    assert by_id[section_2_id]["title_uz"] == SECTION_2_TITLE_UZ, (
        f"[public_detail_readback] UZ-название секции дня 2: {by_id[section_2_id]['title_uz']!r}"
    )

    speakers = by_id[section_2_id]["speakers"]
    assert [s["id"] for s in speakers] == [speaker_id], (
        f"[public_detail_readback] под секцией {section_2_id} ожидался спикер {speaker_id}, "
        f"пришло {[s['id'] for s in speakers]}"
    )
    speaker_payload = speakers[0]
    for field in ("last_name_uz", "last_name_en"):
        assert field in speaker_payload, (
            f"[public_detail_readback] в спикере нет поля {field}: {sorted(speaker_payload)}"
        )
    assert speaker_payload["last_name_uz"] == "Rahimov", (
        f"[public_detail_readback] UZ-фамилия спикера: {speaker_payload['last_name_uz']!r}"
    )
