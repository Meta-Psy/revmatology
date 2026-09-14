# Design: конкурс молодых учёных — PDF положения и быстрый просмотр PDF страницами

**Узел:** `К-08` · **Родитель:** `Л-01` (конгресс) · **Реестр:** `_specs/PLAN.md` · **Дата:** 2026-09-14 · **Одобрено:** Alex, 2026-09-14 («Да приступай и сразу к исполнению»)
**Срок-ограничитель:** конгресс LEAR 2026-09-25; код и ревью — до 2026-09-19, заморозка — 2026-09-21.
**Опирается на:** PR #13 (`К-07`: `program_file_*`, миграция `003`, `PdfFileField`), PR #15 (`К-04`: Pillow), PR #14 (`О-02`: CI).

## 1. Задача

Админ загружает PDF положения конкурса молодых учёных (один файл на язык RU/UZ/EN); участники открывают публичную страницу конкурса и быстро читают документ — в основном с телефонов, на неровном мобильном интернете. Тот же просмотр получает программа конгресса (заменяет встроенный `<object>` из `К-07`).

Решения Alex (brainstorming 2026-09-14): конкурс — часть конгресса; один PDF на язык; страница публичная; срок — до конгресса; подход A «страницы-картинки»; из читалки ScienceAI (`10_Projects/ScienceAI/frontend/src/components/PDFViewer.tsx`) берём навигацию, «N из M», масштаб, оглавление, ссылку на страницу, повтор при ошибке, **полный экран** и **постраничный режим**; поиск и выделение текста — не сейчас.

## 2. Почему страницы-картинки, а не PDF.js / iframe

Исследование 2026-09-14 (замеры, первоисточники — отчёт агента, выводы проверены выборочно):

| | WebP-страницы (выбрано) | PDF.js | iframe/`<object>` |
|---|---|---|---|
| 1-я страница при 2 Мбит/с | 16–344 КБ → доли секунды – 1,5 с | ~530 КБ JS + 1–3,8 МБ PDF → 9–31 с | Android: не рисует |
| Браузеры | WebP: iOS 14+, любой Chromium | modern — Chrome 145+; legacy — Chrome 125+/iOS 18+ (−17 % iPhone UZ) | десктоп |
| Безопасность | pdfium на сервере, в отдельном процессе | CVE-2024-4367, CVE-2026-16633 | — |

- Android — 83 % мобильного трафика Узбекистана (StatCounter, 08.2026); Chromium на Android не содержит встроенного PDF-просмотрщика (`pdf/features.gni`).
- Линеаризация PDF.js почти не помогает (hint tables — WONTFIX, pdf.js #18736); в ScienceAI Range-загрузку пришлось отключить (`disableRange: true` — «fixes images not loading»), т. е. PDF качается целиком.
- Резкость ограничена ~190 dpi (1600 px по ширине A4) — для больших увеличений есть «Открыть PDF» (оригинал, вектор).

## 3. Данные

- `Congress.young_scientists_file_ru/uz/en` — `String(500)`, nullable; схемы Create/Update/Response; Alembic `004_add_congress_young_scientists_files.py` (`down_revision='003'`), идемпотентный upgrade через `sa.inspect` (как `003`).
- Для страниц колонок нет: всё лежит рядом с PDF, имена выводятся из имени файла.

## 4. Договор сервер ↔ фронт (контракт)

Для файла `/uploads/<name>.pdf` (только наш каталог, имя `[A-Za-z0-9._-]+\.pdf` — одинаково на сервере и фронте):

```
/uploads/<name>.pdf                   оригинал, не меняется
/uploads/<name>.pages/manifest.json   появляется последним, атомарно (переименованием каталога)
/uploads/<name>.pages/p<N>-800.webp   N = 1..rendered
/uploads/<name>.pages/p<N>-1600.webp
/uploads/<name>.pages.error.json      только при неудаче
```

`manifest.json`, версия 1:
```json
{
  "version": 1,
  "source": "<name>.pdf",
  "page_count": 22,
  "rendered": 22,
  "truncated": false,
  "widths": [800, 1600],
  "pages": [{ "n": 1, "w": 1600, "h": 2263 }],
  "outline": [{ "title": "Секция 1", "page": 3, "level": 0, "children": [] }]
}
```
- `pages[].w/h` — пиксели версии 1600 (для пропорций и `width/height` у `<img>`).
- `outline` — закладки PDF (вложенные), `page` 1-based; нет закладок — `[]`; ссылки на страницы > `rendered` отбрасываются.
- `truncated: true`, если `page_count > 60`; тогда `rendered = 60`.

`<name>.pages.error.json`:
```json
{ "version": 1, "source": "<name>.pdf", "error": "encrypted", "message": "Файл защищён паролем" }
```
`error` ∈ `encrypted | corrupt | empty | timeout | internal`; `message` — по-русски, для админа.

## 5. Сервер

**Модуль `backend/pdf_pages.py`** (чистая логика, без FastAPI): `render(pdf_path) -> manifest` — pypdfium2 рисует страницы, Pillow кодирует WebP q75 (method 2 — по замеру ревью в 2,1 раза быстрее method 4 при +2,6 % объёма) в 800 и 1600 px по ширине; извлекает закладки; пишет во временный каталог `.<name>.pages.tmp-<rand>` рядом, `manifest.json` последним, затем `os.replace` в `<name>.pages`. Уже есть валидный `manifest.json` → ничего не делает (UUID-файлы неизменны). Остаток временного каталога от прошлой неудачи удаляется. При ошибке — `<name>.pages.error.json` (атомарно), каталог страниц не создаётся; при успехе старый `error.json` удаляется.

**CLI `backend/scripts/render_pdf_pages.py`:** `python -m scripts.render_pdf_pages <путь.pdf>` и `--backfill` (все `program_file_*` и `young_scientists_file_*` конгрессов из БД, только `/uploads/*.pdf`, только недостающие). Внутри — межпроцессная блокировка (файл-замок в каталоге uploads, `fcntl.flock` на Linux; на Windows допустима работа без замка) → одновременно рисуется один PDF (1 vCPU, два воркера uvicorn). Ограничения: 60 страниц; на Linux в дочернем процессе `RLIMIT_CPU` ≈ 180+30 с процессорного времени (SIGXCPU прерывает и внутри PDFium; ожидание замка не считается), `RLIMIT_AS` ~1,5 ГБ, `RLIMIT_CORE` 0, `nice 10`. Мягкий дедлайн между страницами публикует уже нарисованное с `truncated: true`; `timeout` — только если не нарисовано ничего. Если процесс умер без `error.json`, его пишет родитель (`timeout`/`internal`), а повторное сохранение конгресса перезапускает рисование для файлов без манифеста (кроме `encrypted/corrupt/empty`). Замок — во временном каталоге системы, не в `uploads/`.

**Запуск:** `api/congress.py`, эндпоинты создания/обновления конгресса — после коммита, для каждого изменившегося поля `program_file_*`/`young_scientists_file_*`, значение которого `/uploads/<name>.pdf`, ставится `BackgroundTasks` → `asyncio.create_subprocess_exec(sys.executable, "-m", "scripts.render_pdf_pages", <путь>)` с тайм-аутом. Отдельный процесс обязателен: PDFium нельзя вызывать из нескольких потоков (документация pypdfium2); заодно изоляция падений и памяти. Ответ API не ждёт рисования; сбой рисования не влияет на сохранение.

**Зависимость:** `pypdfium2==5.13.0` (Apache-2.0/BSD-3, wheel `manylinux2014_x86_64`, проверено). Dockerfile не меняется.

**Безопасность:** рисуются только файлы из `uploads/` (путь нормализуется, выход за каталог запрещён); внешние `https://` не трогаются; загрузка — только админом (как сейчас).

## 6. Фронт

**`frontend/src/components/pdf/`:** `PdfPages.jsx` (корень), `usePdfManifest.js` (вывод URL манифеста, загрузка, проверка `version`, состояния), `PdfToolbar.jsx`, `PdfOutline.jsx`; при необходимости — `pdfUrls.js` (вывод путей). Пропсы `PdfPages`: `pdfUrl`, `title`, `downloadName`.

- **Непрерывный режим (по умолчанию):** `<img srcSet="…p1-800.webp 800w, …p1-1600.webp 1600w" sizes={ширина_контейнера×масштаб px} width height alt>`; обёртка с `aspect-ratio` из манифеста — вёрстка не прыгает; стр. 1 — `loading="eager" fetchPriority="high"`, остальные — `lazy`; целевая страница из `#page=N` — тоже `eager`.
- **Панель (sticky):** [Содержание — если `outline` не пуст] · [← `N`/M →, поле ввода номера] · [− 100 % +, 50–200 %, шаг 25 %] · [Непрерывно / По одной] · [Полный экран — если `document.fullscreenEnabled`] · [Открыть PDF — `target=_blank rel=noopener noreferrer`] · [Скачать — `download={downloadName}`]. На узком экране — значки с `aria-label`.
- **Номер страницы** — `IntersectionObserver`; `#page=N` обновляется через `history.replaceState` (без засорения истории); при загрузке `#page=N` — прокрутка к странице.
- **Постраничный режим:** одна страница; ←/→ кнопками, клавишами (←/→, PageUp/PageDown) и свайпом (|dx| > 50 px, свайп выключен при масштабе > 100 %); следующая страница подгружается заранее. Режим запоминается в `localStorage` (с `try/catch`).
- **Оглавление:** на ПК — боковая панель, на телефоне — выдвижная; подсвечен текущий раздел (последний пункт с `page ≤ текущей`); клик — переход, на телефоне закрывает панель.
- **Полный экран:** Fullscreen API на контейнере просмотрщика; на iPhone кнопки нет.
- **Состояния:** загрузка манифеста — заготовка первой страницы; 404/ошибка/неверная версия — «Документ готовится к просмотру» + «Открыть PDF», «Скачать», «Повторить»; внешний URL — только кнопки, без запроса; `truncated` — внизу «Показаны первые 60 страниц из N — полный документ: Открыть PDF».
- Масштаб > 100 % — контейнер прокручивается по горизонтали; щипок на телефоне не блокируется.
- i18n: ключи `pdfViewer.*` и `congress.youngScientists.*` во всех трёх локалях.

**Страницы:**
- Новый маршрут `/congress/:id/young-scientists` → `pages/CongressYoungScientists.jsx`: шапка/хлебные крошки как у `CongressProgram.jsx`; заголовок «Конкурс молодых учёных»; текст `young_scientists_*` (фолбэк RU, как сейчас рендерится во вкладке); `PdfPages` с `young_scientists_file_<lang>` → фолбэк RU; `downloadName = polozhenie-konkursa-<id>-<lang>.pdf` (язык — по фактическому файлу); ни текста, ни файла — «Информация будет опубликована позже».
- `Congress.jsx`, вкладка «Конкурс молодых учёных»: текст как сейчас + кнопка «Положение конкурса» → новая страница (если есть файл).
- `CongressProgram.jsx`: блок встроенного просмотра (`<object>` + `useIsWideScreen`) заменяется на `PdfPages`.

**Админка (`CongressAdmin.jsx`):** новая вкладка формы **«Конкурс»** — `LangTabs`: текст `young_scientists_<lang>` (переезжает из вкладки «Вкладки») + `PdfFileField` для `young_scientists_file_<lang>` (PDF, до 20 МБ). Под PDF (и во вкладке «Программа») — строка состояния по статичным файлам: есть `manifest.json` → «Страницы готовы — N стр.»; есть `error.json` → «Ошибка: <message>»; иначе → «Готовятся…» (после сохранения). Сохранение не ждёт рисования.

## 7. Тесты

**pytest:** рисование на сгенерированных PDF (pypdfium2 умеет создавать страницы; для закладок/пароля — маленькие фикстуры в `backend/tests/fixtures/`); размеры и число картинок; обе ширины; обрезка на 60 (65 страниц); пароль → `encrypted`; мусор → `corrupt`; повторный вызов не перерисовывает; при сбое нет частичного каталога; оглавление; путь вне `uploads/` отвергается; тайм-аут; API ставит задачу только для изменившихся `/uploads/*.pdf` (подменённый запускатель); `--backfill`; миграция `004` офлайн (`--sql`) и, если есть Docker, на Postgres. **Сценарий P-06** «Секретарь публикует положение конкурса молодых учёных» в `_specs/processes.yaml` + journey в `backend/tests/workflows/`: вход → загрузка PDF → сохранение конгресса → рисование (синхронно) → публичный `/detail` отдаёт файл → манифест на месте.

**vitest:** `PdfPages` — картинки и атрибуты (`srcSet`, `sizes`, `width/height`, eager/high у первой, lazy у остальных), 404 → кнопки + «Повторить», внешний URL без запроса, `#page=N`, стрелки и поле номера, масштаб меняет `sizes`, постраничный режим (одна картинка, клавиши, свайп, выключен при зуме), полный экран скрыт без `fullscreenEnabled`, оглавление и переход, `truncated`; страница конкурса (текст + просмотр, фолбэк UZ→RU, пустое состояние); кнопка во вкладке `Congress.jsx`; вкладка «Конкурс» в админке; `CongressProgram` использует `PdfPages`.

**Руками после выкатки:** Android Chrome, iPhone Safari, Samsung Internet; реальный PDF положения.

## 8. Исполнение

Два Opus-агента, разведённые по файлам; общий договор — §4.

| Агент | Ветка / рабочая копия | Файлы |
|---|---|---|
| сервер | `feat/pdf-pages-backend` · `_wt/revmatology-k08b` | `backend/database/models.py`, `backend/schemas/congress.py`, `backend/alembic/versions/004_*`, `backend/pdf_pages.py`, `backend/scripts/render_pdf_pages.py`, `backend/api/congress.py`, `backend/requirements.txt`, `backend/tests/**`, `_specs/processes.yaml` |
| фронт | `feat/pdf-pages-frontend` · `_wt/revmatology-k08f` | `frontend/src/components/pdf/**`, `frontend/src/pages/CongressYoungScientists.jsx`, `frontend/src/App.jsx`, `frontend/src/pages/Congress.jsx`, `frontend/src/pages/CongressProgram.jsx`, `frontend/src/pages/admin/CongressAdmin.jsx`, `frontend/src/i18n/locales/*.json`, тесты фронта |

База обеих веток — локальное слияние PR #14, #13, #15 поверх `main` (`base/k08`). Агенты коммитят локально и **не пушат**; после мержа трёх PR главная сессия переносит коммиты `git rebase --onto origin/main base/k08 <ветка>` (ветки ещё не опубликованы — force-push не нужен), затем push и два PR. Мерж: сервер → фронт (фронт без сервера просто покажет кнопки — безопасно в любом порядке).

После выкатки: `docker compose -f docker-compose.prod.yml exec backend python -m scripts.render_pdf_pages --backfill` — с разрешения Alex (только добавляет файлы).

## 9. Вне объёма (зафиксировано)

Поиск по тексту с подсветкой (текст с координатами из pdfium → `text.json`, нормализация из ScienceAI) — узел после конгресса. Выделение/копирование текста. PDF.js-режим (основа — читалка ScienceAI). Ghostscript «лёгкая версия» (AGPL, +78 МБ). HTTP/2 и год кэша для `/assets`, `/uploads` — вместе с `О-03` после 2026-09-27. Страницы для `info_letter_file_*`.

## 10. Критерии приёмки

1. Админ загружает PDF во вкладке «Конкурс», сохраняет; через ≤ 1 мин в админке «Страницы готовы — N стр.».
2. `/congress/1/young-scientists` на Android Chrome при «Slow 4G» показывает первую страницу быстрее 2 с после загрузки HTML; все страницы прокручиваются, «N из M», масштаб, постраничный режим и оглавление работают.
3. Для UZ/EN без своего файла показывается RU; «Скачать» даёт осмысленное имя.
4. Программа конгресса открывается тем же просмотром.
5. Битый/защищённый PDF не ломает страницу: кнопки «Открыть/Скачать», в админке — причина.
6. pytest, vitest, lint, build зелёные в CI.
