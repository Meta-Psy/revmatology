"""PDF положения конкурса молодых учёных по языкам (К-08): young_scientists_file_ru/uz/en.

Поля устроены как program_file_* из К-07: админ загружает PDF на каждый язык,
публичная страница конкурса берёт ссылку из /congresses/{id}/detail.
"""

YOUNG_SCIENTISTS_FILES = {
    "young_scientists_file_ru": "/uploads/rules-ru.pdf",
    "young_scientists_file_uz": "/uploads/rules-uz.pdf",
    "young_scientists_file_en": "/uploads/rules-en.pdf",
}


async def _get_detail(client, congress_id):
    response = await client.get(f"/api/congress/congresses/{congress_id}/detail")
    assert response.status_code == 200, response.text
    return response.json()


async def test_create_congress_with_young_scientists_files(client):
    """Создание конгресса сохраняет PDF положения на всех трёх языках."""
    response = await client.post(
        "/api/congress/congresses",
        json={"title_ru": "Конгресс", "title_uz": "Kongress", "title_en": "Congress", **YOUNG_SCIENTISTS_FILES},
    )
    assert response.status_code == 200, response.text
    created = response.json()

    single = await client.get(f"/api/congress/congresses/{created['id']}")
    assert single.status_code == 200, single.text
    detail = await _get_detail(client, created["id"])
    listing = await client.get("/api/congress/congresses", params={"include_inactive": True})
    assert listing.status_code == 200, listing.text
    (listed,) = [c for c in listing.json() if c["id"] == created["id"]]

    for key, value in YOUNG_SCIENTISTS_FILES.items():
        assert created[key] == value
        assert single.json()[key] == value
        assert detail[key] == value
        assert listed[key] == value


async def test_congress_without_young_scientists_files_returns_nulls(client, congress):
    """У конгресса без положения поля приходят как null, а не отсутствуют."""
    detail = await _get_detail(client, congress.id)
    for key in YOUNG_SCIENTISTS_FILES:
        assert key in detail
        assert detail[key] is None


async def test_partial_update_sets_only_given_file_and_keeps_program(client, congress):
    """Частичное обновление ставит один файл и не трогает PDF программы и текст конкурса."""
    await client.put(
        f"/api/congress/congresses/{congress.id}",
        json={"program_file_ru": "/uploads/program-ru.pdf", "young_scientists_ru": "Условия конкурса"},
    )

    response = await client.put(
        f"/api/congress/congresses/{congress.id}",
        json={"young_scientists_file_uz": "/uploads/rules-uz.pdf"},
    )
    assert response.status_code == 200, response.text

    detail = await _get_detail(client, congress.id)
    assert detail["young_scientists_file_uz"] == "/uploads/rules-uz.pdf"
    assert detail["young_scientists_file_ru"] is None
    assert detail["young_scientists_file_en"] is None
    assert detail["program_file_ru"] == "/uploads/program-ru.pdf"
    assert detail["young_scientists_ru"] == "Условия конкурса"


async def test_young_scientists_file_can_be_removed(client, congress):
    """Пустая строка из формы и null оба снимают файл."""
    await client.put(f"/api/congress/congresses/{congress.id}", json=YOUNG_SCIENTISTS_FILES)

    response = await client.put(
        f"/api/congress/congresses/{congress.id}",
        json={"young_scientists_file_ru": "", "young_scientists_file_uz": None},
    )
    assert response.status_code == 200, response.text

    detail = await _get_detail(client, congress.id)
    assert not detail["young_scientists_file_ru"]
    assert detail["young_scientists_file_uz"] is None
    assert detail["young_scientists_file_en"] == YOUNG_SCIENTISTS_FILES["young_scientists_file_en"]
