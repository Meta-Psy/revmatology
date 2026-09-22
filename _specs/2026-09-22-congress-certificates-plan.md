# Выдача сертификатов (К-11) — план исполнения

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development или superpowers:executing-plans. Шаги — чекбоксы `- [ ]`. TDD: сначала падающий тест, потом код.

**Goal:** участник находит себя в списке получателей по Ф.И.О. (+ телефон), получает PDF-шаблон с вписанным официальным Ф.И.О., не больше 5 раз; админ ведёт список и шаблон.

**Architecture:** две таблицы (миграция `005`), чистые функции имён/телефонов/CSV и сборки PDF (reportlab-слой + pypdf-наложение), новый роутер `api/certificates.py` под `/api/congress`, публичная страница `/congress/:id/certificate` и вкладка «Сертификаты» в админке конгресса.

**Tech Stack:** FastAPI + async SQLAlchemy, reportlab, pypdf, fontTools (только тесты), React 19, Vitest.

**Design-doc (источник истины по поведению):** `_specs/2026-09-22-congress-certificates-design.md`. При расхождении плана и дизайна — прав дизайн, расхождение записать в отчёт.

---

## Разводка по исполнителям (по файлам, не по темам)

| Исполнитель | Рабочая копия / ветка | Владеет файлами |
|---|---|---|
| **B (сервер)** | `C:/Users/Alex/10_Projects/_wt/revmatology-cert`, ветка `feat/congress-certificates` | `backend/**`, `_specs/processes.yaml` |
| **F (фронт)** | `C:/Users/Alex/10_Projects/_wt/revmatology-cert-fe`, ветка `feat/congress-certificates-fe` от того же `origin/main` | `frontend/**` |
| Главная сессия | — | `_specs/PLAN.md`, этот план, design-doc, сведение F в B, PR |

Общие правила для обоих:
- git только через `git -C <своя рабочая копия>`; в `main` не коммитить; `push --force` нельзя; PR не открывать — это делает главная сессия.
- В коммитах трейлер отдельной строкой над `Co-Authored-By`:
  ```
  Plan-Item: К-11

  Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
  ```
  (пустая строка между ними **не** ставится — см. заметку `О-01` о squash). Conventional Commits, тема по-русски.
- `backend/venv` лежит в индексе (узел `О-05`) — не трогать, не ставить в него пакеты. Для Python — свой venv в `C:/Users/Alex/AppData/Local/Temp/claude/C--Users-Alex-10-Projects-revmatology/4465dc6f-8d01-4cf1-8ccb-760956e6b7e5/scratchpad/venv-cert` (`pip install -r backend/requirements-dev.txt`).
- `node_modules` — только `npm ci` внутри своей рабочей копии, **никаких junction/symlink** на основной каталог (инцидент: `git worktree remove` стёр основной `node_modules`).
- Если запускали `vite preview`/`dev` — остановить перед отчётом.

## Контракт API (общий для B и F — менять нельзя без главной сессии)

Префикс `/api/congress`. Ошибки — FastAPI `{"detail": "<код>"}`.

```
GET  /congresses/{id}/certificates/status            -> {"open": bool}
GET  /congresses/{id}/certificates/suggest?q=<str>   -> [{"id": int, "full_name": str, "needs_phone": bool}]   (≤7)
POST /congresses/{id}/certificates/issue             body {"recipient_id": int, "phone": str|null}
     200 application/pdf, Content-Disposition: attachment; filename="Certificate_X.pdf"; filename*=UTF-8''...
     404 {"detail":"not_found"} | 403 {"detail":"limit_reached"} | 429 {"detail":"too_many_requests"}

# admin (Bearer)
GET  /congresses/{id}/certificate-settings  -> {"congress_id","has_template","pdf_filename","box_x_mm","box_y_mm",
                                               "box_w_mm","box_h_mm","font_max_pt","font_min_pt","text_color","is_open","updated_at"}
PUT  /congresses/{id}/certificate-settings  body: любое подмножество {box_*_mm, font_max_pt, font_min_pt, text_color, is_open} -> как GET
POST /congresses/{id}/certificate-template  multipart file=<pdf> -> как GET settings
     400 {"detail":"not_pdf"} | 413 {"detail":"too_large"}
POST /congresses/{id}/certificate-preview   body {"name": str} -> application/pdf (inline), 400 {"detail":"no_template"}
GET  /congresses/{id}/certificate-recipients?q=&skip=0&limit=50
     -> {"items":[{"id","full_name","phone_digits","download_count","created_at"}], "total": int}
POST /congresses/{id}/certificate-recipients body {"full_name": str, "phone": str|null} -> item
PUT  /certificate-recipients/{rid}           body {"full_name"?: str, "phone"?: str|null} -> item
DELETE /certificate-recipients/{rid}         -> {"ok": true}
POST /certificate-recipients/{rid}/reset     -> item
POST /congresses/{id}/certificate-recipients/import  multipart file, form mode=append|replace, dry_run=true|false
     -> {"accepted": int, "empty_rows": int, "duplicates_in_file": int, "skipped_existing": int,
         "inserted": int, "sample": [str, ...до 5], "columns": [str]}
     400 {"detail":"no_name_column", ...} — detail может быть объектом {"code":"no_name_column","columns":[...]}
```
`inserted` при `dry_run=true` = 0. `MAX_DOWNLOADS = 5` — константа сервера; фронт показывает «N из 5» по `download_count` (5 зашито и на фронте константой).

---

## Задача B — сервер (исполнитель B)

Образцы стиля: `backend/api/congress.py` (роутер, `_ensure_exists`, `get_current_admin`), `backend/alembic/versions/004_*.py` (миграция) + `backend/tests/test_migration_004.py` (тест миграции), `backend/tests/conftest.py` (фикстуры клиента/админа), `backend/tests/workflows/` + `_specs/processes.yaml` (сценарии).

### B1. Зависимости и шрифт
- [ ] В `backend/requirements.txt` добавить с точным пином актуальные версии `reportlab` и `pypdf` (проверить, что колёса ставятся на Python 3.11 — версия в CI и в `backend/Dockerfile`). `fonttools` — в `requirements-dev.txt` (только для прибора покрытия); если reportlab уже тянет его как зависимость — всё равно пин в dev.
- [ ] Шрифт: `backend/assets/fonts/<Имя>.ttf` + `backend/assets/fonts/OFL.txt`. Файл и URL даст главная сессия в поручении (итог подбора). Не выбирать шрифт самостоятельно.

### B2. Чистые функции имён — `backend/functions/certificate_names.py`, тест `backend/tests/test_certificate_names.py`
- [ ] Тесты (минимум):
  ```python
  assert normalize_name("  Шодиева   Ситора Баходировна ") == normalize_name("шодиева ситора баходировна")
  assert normalize_name("Ёлкина") == normalize_name("Елкина")
  assert normalize_name("Oʻgʻiloy") == normalize_name("O'g'iloy") == normalize_name("O’g’iloy")
  assert phone_digits("+998 (90) 123-45-67") == "998901234567"
  for entered in ["+998 90 123 45 67", "998901234567", "90 123 45 67", "901234567"]:
      assert phones_match("998901234567", entered)
  assert not phones_match("998901234567", "1234567")        # < 9 цифр
  assert not phones_match("998901234567", "+998 91 123 45 67")
  assert certificate_filename("Shodieva Sitora Baxodirovna") == "Certificate_Shodieva_Sitora_Baxodirovna.pdf"
  assert certificate_filename("Шодиева Ситора Баходировна") == "Certificate_Shodieva_Sitora_Bakhodirovna.pdf"  # RU: х→kh
  assert certificate_filename("Қодирова Ўғилой Ҳасановна") == "Certificate_Qodirova_Ogiloy_Hasanovna.pdf"
  assert certificate_filename("Oʻgʻiloy") == "Certificate_Ogiloy.pdf"
  ```
  Таблица транслитерации: а a, б b, в v, г g, д d, е e, ё yo, ж zh, з z, и i, й y, к k, л l, м m, н n, о o, п p, р r, с s, т t, у u, ф f, х kh, ц ts, ч ch, ш sh, щ shch, ъ «», ы y, ь «», э e, ю yu, я ya, ў o, қ q, ғ g, ҳ h; заглавные — с заглавной первой буквой (`Ш` → `Sh`). Итог: апострофы вон, пробелы/прочее → `_`, схлопнуть `_`, оставить `[A-Za-z0-9_-]`; пусто → `Certificate.pdf`.
- [ ] CSV — тест-файлы генерировать в тесте байтами:
  - `"ФИО;Телефон\nАлиев Али;+998 90 111 22 33\n;\nАлиев Али;+998 90 111 22 33\nKarimov Bobur;\n"` → accepted 2, empty_rows 1, duplicates_in_file 1, у Karimov phone `None`.
  - та же таблица в `cp1251` и с BOM `utf-8-sig` — тот же результат.
  - `"Фамилия,Имя,Отчество,phone\nШодиева,Ситора,Баходировна,901234567\n"` → full_name `"Шодиева Ситора Баходировна"`.
  - заголовок `"Name\tTel"` (табуляция) — распознаётся.
  - `"Город;Возраст\n..."` → `ValueError`/собственное исключение `NoNameColumn(columns=[...])`.
  - `full_name` сохраняет исходный вид строки, но схлопывает внутренние пробелы и обрезает края (на сертификат не должно уйти `"Алиев  Али "`).
- [ ] Реализовать; прогнать `pytest backend/tests/test_certificate_names.py -v` — зелёный; коммит `feat(certificates): нормализация имён, телефонов, CSV и имя файла`.

### B3. Сборка PDF — `backend/functions/certificate_pdf.py`, тест `backend/tests/test_certificate_pdf.py`
Интерфейс:
```python
@dataclass(frozen=True)
class Box:
    x_mm: float; y_mm: float; w_mm: float; h_mm: float   # от левого ВЕРХНЕГО угла первой страницы

FONT_PATH: Path  # backend/assets/fonts/<файл>.ttf
REQUIRED_CHARS: str  # набор из design-doc §8, используется прибором покрытия

def fit_lines(name: str, box_w_pt: float, box_h_pt: float, font_max: float, font_min: float) -> tuple[list[str], float]:
    """Одна строка при max..min шагом 0.5; иначе две строки по пробелу ближе к середине; иначе две строки на font_min."""

def render_certificate(template_pdf: bytes, name: str, box: Box, font_max: float, font_min: float,
                       color: str = "#1F2937", outline: bool = False) -> bytes: ...
```
Ядро наложения (ориентир, не догма):
```python
reader = PdfReader(io.BytesIO(template_pdf))
page = reader.pages[0]
w, h = float(page.mediabox.width), float(page.mediabox.height)
# /Rotate 90/270 — поменять w/h местами и повернуть слой; покрыть тестом, если реализуется, иначе 400 "rotated_template" при загрузке
buf = io.BytesIO(); c = canvas.Canvas(buf, pagesize=(w, h))
# box: x = x_mm*mm, y_bottom = h - (y_mm + h_mm)*mm
...
overlay = PdfReader(buf).pages[0]
page.merge_page(overlay)
writer = PdfWriter(); writer.append_pages_from_reader(reader)  # или add_page для каждой; первая уже с наложением
```
Шрифт регистрировать один раз на модуль (`pdfmetrics.registerFont(TTFont("CertName", FONT_PATH))`). Если в шрифте нет `U+02BB` — подменять его перед отрисовкой на `’`, затем на `'` (проверка по cmap один раз при импорте).
- [ ] Тесты: фикстура-шаблон — reportlab A4 альбомный, 2 страницы, на первой текст «CERTIFICATE»; и A4 книжный.
  - итог открывается `PdfReader`, страниц столько же;
  - `extract_text()` первой страницы содержит имя (для кириллицы, узб. кириллицы и латиницы с `ʻ` — проверять хотя бы нормализованно, если подмена апострофа);
  - в ресурсах первой страницы есть шрифт с `FontFile2` (встроен);
  - `fit_lines("Алиев Али", …)` даёт кегль больше, чем `"Абдурахманова Маликахон Шухратжоновна"`; для второго `stringWidth ≤ box_w`;
  - строка из 80 символов → 2 строки, каждая ≤ box_w;
  - `outline=True` не падает и меняет байты по сравнению с `outline=False`;
  - прибор покрытия: `fontTools.ttLib.TTFont(FONT_PATH).getBestCmap()` содержит все `REQUIRED_CHARS` (кроме допущенной подмены `ʻ`, если шрифт её не имеет — тогда тест проверяет наличие `’` или `'`); таблица `glyf` есть.
- [ ] Коммит `feat(certificates): наложение имени на PDF-шаблон`.

### B4. Модели и миграция `005`
- [ ] `backend/database/models.py`: `CertificateTemplate`, `CertificateRecipient` по design-doc §3 (`LargeBinary` для `pdf`; `ondelete="CASCADE"`; relationship не обязателен).
- [ ] `backend/alembic/versions/005_add_certificates.py`, `down_revision` = ревизия `004`. Тест `backend/tests/test_migration_005.py` по образцу `test_migration_004.py`.
- [ ] Коммит `feat(certificates): таблицы получателей и шаблона (миграция 005)`.

### B5. Роутер — `backend/api/certificates.py`, подключить в `backend/api/__init__.py` под `/api/congress`; схемы — `backend/schemas/certificates.py` (Pydantic v2, `model_config = ConfigDict(from_attributes=True)`)
- [ ] Ограничитель частоты — маленький класс в том же модуле: `dict[str, deque[float]]` по ключу `f"{bucket}:{ip}"`, окно 60 с, лимиты `suggest` 30, `issue` 10; IP из `X-Real-IP`, иначе `request.client.host`. В тестах — фикстура, очищающая состояние между тестами (autouse в `conftest.py` или в тест-модуле).
- [ ] Условное списание:
  ```python
  res = await db.execute(
      update(CertificateRecipient)
      .where(CertificateRecipient.id == rid, CertificateRecipient.download_count < MAX_DOWNLOADS)
      .values(download_count=CertificateRecipient.download_count + 1)
      .returning(CertificateRecipient.id)
  )
  if res.scalar_one_or_none() is None: -> 403 limit_reached
  try: pdf = render_certificate(...)
  except Exception: откат счётчика (download_count - 1), commit, 500
  ```
  Сборку PDF (CPU) звать через `run_in_threadpool`.
- [ ] Порядок проверок в `issue`: частота → шаблон есть и `is_open` → получатель этого конгресса → телефон (если `phone_digits` в базе) → списание → сборка. Всё до списания — `404 not_found`.
- [ ] `suggest`: `q` — нормализовать `normalize_name`, слова; если суммарно < 3 непробельных символов → `[]`; `WHERE name_key LIKE %word%` на каждое слово (экранировать `%` `_` `\`), `ORDER BY full_name LIMIT 7`.
- [ ] Загрузка шаблона: `%PDF-` в начале, pypdf открывает, ≤ 20 МБ (`413 too_large`), иначе `400 not_pdf`. Строку `CertificateTemplate` создавать лениво (GET settings без строки → значения по умолчанию, `has_template: false`).
- [ ] Импорт: `parse_recipients_csv` → для `append` пропустить пары (`name_key`, `phone_digits`) уже в базе этого конгресса (`skipped_existing`); `replace` — `DELETE` всех получателей конгресса; `dry_run` — ничего не писать.
- [ ] Тесты `backend/tests/test_certificates_api.py` — всё из design-doc §7 «pytest, API». Шаблон грузить через API, не ORM.
- [ ] Коммит `feat(certificates): публичная выдача и админские маршруты`.

### B6. Сценарий `P-07`
- [ ] `_specs/processes.yaml`: процесс `P-07` «Участник получает именной сертификат конгресса», `status: active`, `roles: [admin, visitor]`, `layers: [api]`, цепочка из design-doc §7 (ключи `create_congress`, `upload_template`, `import_recipients`, `open_issuing`, `suggest`, `issue_with_phone`, `official_name_on_pdf` (readback), `limit_after_five`). Номер проверить — должен быть следующим свободным.
- [ ] Прогон в `backend/tests/workflows/` по образцу существующих journey (только HTTP).
- [ ] Полный прогон `cd backend && pytest` — зелёный; коммит `test(certificates): сценарий P-07`.

### B7. Отчёт главной сессии
Список коммитов, вывод полного `pytest` (итоговая строка), отклонения от плана/дизайна с причиной, открытые вопросы.

---

## Задача F — фронт (исполнитель F)

Образцы: `frontend/src/App.jsx` (ленивые маршруты `К-10`), `frontend/src/pages/CongressProgram.jsx` и `YoungScientists*` (страница конгресса по `:id`, i18n, hero), `frontend/src/services/api.js`, `frontend/src/pages/admin/CongressAdmin.jsx` (вкладки `TABS`, выбор конгресса), `frontend/src/components/admin/*`, существующие тесты в `__tests__/` и `src/test/i18n-test-utils.jsx`.

### F1. Клиент API — `frontend/src/services/api.js`
- [ ] Публичные: `getCertificateStatus(congressId)`, `suggestCertificateRecipients(congressId, q)`, `issueCertificate(congressId, {recipient_id, phone})` (`responseType: 'blob'`). Админские: по одному методу на каждый админский маршрут контракта. Размещение — в тех объектах, где лежат соседние методы конгресса.
- [ ] Хелпер `readBlobError(err)` → код из `detail` (блоб → `text()` → JSON), `null` если не разобрать.

### F2. Публичная страница — `frontend/src/pages/CongressCertificate.jsx`, маршрут `/congress/:id/certificate` ленивым куском
- [ ] Тест первым: `frontend/src/pages/__tests__/CongressCertificate.test.jsx` (мок `services/api`):
  - ввод 2 символов — `suggest` не вызывается; 3 символа — вызывается после задержки (фейковые таймеры);
  - в выпадающем списке только имена, никаких телефонов;
  - кнопка «Найти сертификат» `disabled` до выбора; правка текста после выбора снова её отключает;
  - `needs_phone: true` → появляется поле телефона, `false` → нет;
  - `issue` 404 / 403 / 429 → соответствующий текст из локали;
  - успех → кнопка «Скачать сертификат»; клик создаёт ссылку с `download="Certificate_...pdf"` (имя из `Content-Disposition`, запасное `Certificate.pdf`);
  - `status.open === false` → сообщение «выдача не открыта», формы нет.
- [ ] Реализация по design-doc §6 (combobox с клавиатурой, `inputmode="tel"`, `aria-*`). Стиль — как у соседних страниц конгресса.

### F3. Ссылка на странице конгресса
- [ ] В `frontend/src/pages/Congress.jsx` рядом со ссылкой на программу — «Получить сертификат» на `/congress/:id/certificate`, только при `getCertificateStatus(id).open`. Ошибка запроса → ссылки нет, страница не ломается. Тест.

### F4. Локали
- [ ] `certificate.*` во всех трёх `frontend/src/i18n/locales/{ru,uz,en}.json`: `title`, `instruction`, `nameLabel`, `phoneLabel`, `find`, `download`, `notFound`, `limitReached`, `tooMany`, `closed`, `noMatches`, `link`, `error`. RU — дословно из ТЗ («Получить сертификат участника», «Введите Ф.И.О., указанные при регистрации на конгресс», «Найти сертификат», «Скачать сертификат», «Участник с указанными данными не найден. Пожалуйста, проверьте правильность введённых данных.», «Достигнуто максимальное количество скачиваний сертификата.»). UZ — латиница. `i18n.test.js` зелёный.

### F5. Вкладка админки
- [ ] Новый файл `frontend/src/pages/admin/congress/CertificatesTab.jsx` (или по сложившейся структуре каталога — посмотреть; если подкаталога нет, создать). В `CongressAdmin.jsx` — только запись в `TABS`, загрузка при переключении и рендер `<CertificatesTab congressId={selectedCongressId} />`.
- [ ] Блоки из design-doc §6: настройки (FileUpload PDF, числа рамки мм, кегль, цвет `<input type="color">`, чекбокс «Выдача открыта», «Имя для пробы» + «Пробный PDF» → `window.open(URL.createObjectURL(blob))`), импорт (файл, режим, «Проверить» = dry_run → сводка, «Загрузить»; `replace` через `ConfirmDialog` с текстом «Все получатели будут удалены, счётчики скачиваний обнулятся»), таблица (`AdminTable`: поиск, Ф.И.О., телефон, «N из 5», изменить / сбросить / удалить, «Добавить» через `AdminModal`). Строки админки — русские без i18n.
- [ ] Тест `frontend/src/pages/admin/__tests__/CertificatesTab.test.jsx`: dry-run показывает сводку и не вызывает запись; `replace` без подтверждения не уходит; сброс счётчика вызывает `reset`.

### F6. Проверка и отчёт
- [ ] `npm run lint` (0 ошибок), `npm test` (полный прогон, итоговая строка), `npm run build` — всё зелёное; сторож сборки `К-09` (код админки не в публичных кусках) не краснеет.
- [ ] Коммиты по смыслу (`feat(certificates): …`), трейлер `Plan-Item: К-11`.
- [ ] Отчёт: коммиты, выводы трёх команд, отклонения, вопросы.

---

## Главная сессия после B и F
1. Принять отчёты: открыть руками несущие места (списание счётчика, отсутствие телефона в `suggest`, где лежит шаблон), прогнать `pytest` и `npm test`/`build` самой.
2. Слить `feat/congress-certificates-fe` в `feat/congress-certificates` (merge, без rebase/force).
3. Ревью (`superpowers:code-reviewer` / `/code-review`), поправить найденное.
4. Живая проверка: локальный стенд, пробный шаблон, пройти путь участника в браузере.
5. `_specs/PLAN.md`: узел `К-11` → `в работе` с веткой и PR; PR в `main` с образцами шрифта. Мерж — Alex.
