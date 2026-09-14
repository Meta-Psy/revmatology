"""PDF программы конгресса по языкам (К-07): поля program_file_ru/uz/en.

Админ загружает PDF программы на каждый язык, публичные страницы берут ссылку
из /congresses/{id} и /congresses/{id}/detail.
"""

PROGRAM_FILES = {
    "program_file_ru": "/uploads/program-ru.pdf",
    "program_file_uz": "/uploads/program-uz.pdf",
    "program_file_en": "/uploads/program-en.pdf",
}


async def _get_detail(client, congress_id):
    response = await client.get(f"/api/congress/congresses/{congress_id}/detail")
    assert response.status_code == 200, response.text
    return response.json()


async def test_create_congress_with_program_files(client):
    """Создание конгресса сохраняет PDF программы на всех трёх языках."""
    response = await client.post(
        "/api/congress/congresses",
        json={"title_ru": "Конгресс", "title_uz": "Kongress", "title_en": "Congress", **PROGRAM_FILES},
    )
    assert response.status_code == 200, response.text
    created = response.json()
    for key, value in PROGRAM_FILES.items():
        assert created[key] == value

    single = await client.get(f"/api/congress/congresses/{created['id']}")
    assert single.status_code == 200, single.text
    detail = await _get_detail(client, created["id"])
    listing = await client.get("/api/congress/congresses", params={"include_inactive": True})
    assert listing.status_code == 200, listing.text
    (listed,) = [c for c in listing.json() if c["id"] == created["id"]]

    for key, value in PROGRAM_FILES.items():
        assert single.json()[key] == value
        assert detail[key] == value
        assert listed[key] == value


async def test_congress_without_program_files_returns_nulls(client, congress):
    """У конгресса без PDF поля приходят как null, а не отсутствуют."""
    detail = await _get_detail(client, congress.id)
    for key in PROGRAM_FILES:
        assert key in detail
        assert detail[key] is None


async def test_partial_update_sets_only_given_program_file(client, congress):
    """Частичное обновление ставит один файл и не трогает остальные поля."""
    response = await client.put(
        f"/api/congress/congresses/{congress.id}",
        json={"program_file_ru": "/uploads/program-ru.pdf"},
    )
    assert response.status_code == 200, response.text

    detail = await _get_detail(client, congress.id)
    assert detail["program_file_ru"] == "/uploads/program-ru.pdf"
    assert detail["program_file_uz"] is None
    assert detail["program_file_en"] is None
    assert detail["title_ru"] == congress.title_ru


async def test_partial_update_without_program_files_keeps_them(client, congress):
    """Обновление других полей не затирает ранее загруженные PDF."""
    response = await client.put(f"/api/congress/congresses/{congress.id}", json=PROGRAM_FILES)
    assert response.status_code == 200, response.text

    response = await client.put(
        f"/api/congress/congresses/{congress.id}",
        json={"title_ru": "Новое название", "info_letter_file_ru": "/uploads/letter.pdf"},
    )
    assert response.status_code == 200, response.text

    detail = await _get_detail(client, congress.id)
    assert detail["title_ru"] == "Новое название"
    assert detail["info_letter_file_ru"] == "/uploads/letter.pdf"
    for key, value in PROGRAM_FILES.items():
        assert detail[key] == value


async def test_program_file_can_be_removed(client, congress):
    """Админ может убрать PDF: пустая строка из формы и null оба снимают файл."""
    await client.put(f"/api/congress/congresses/{congress.id}", json=PROGRAM_FILES)

    response = await client.put(
        f"/api/congress/congresses/{congress.id}",
        json={"program_file_ru": "", "program_file_uz": None},
    )
    assert response.status_code == 200, response.text

    detail = await _get_detail(client, congress.id)
    assert not detail["program_file_ru"]
    assert detail["program_file_uz"] is None
    assert detail["program_file_en"] == PROGRAM_FILES["program_file_en"]
