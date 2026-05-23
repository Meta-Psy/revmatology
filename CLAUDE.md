# CLAUDE.md

Guidance for AI assistants working on the **Rheumatology Association of Uzbekistan** (`rheumassociation.uz`) website.

## Project overview

Trilingual (RU/UZ/EN) public site + admin panel for the Association. Content is fully managed through the admin UI (board members, chief rheumatologists, centres, partners, diseases, news/events, congresses, education events, media resources, history, hero images, the Charter document, school applications). Russian is the canonical language; UZ/EN fall back to RU when missing.

Production host: `rheumassociation.uz` (DigitalOcean droplet `138.68.59.141`). Deployed automatically on push to `master` via `.github/workflows/deploy.yml`.

## Stack

| Layer    | Tech                                                                                  |
| -------- | ------------------------------------------------------------------------------------- |
| Frontend | React 19 + Vite 7, React Router 7, Tailwind CSS v4 (via `@tailwindcss/vite`), axios, i18next, lucide-react / heroicons, Vitest + Testing Library |
| Backend  | FastAPI 0.109, SQLAlchemy 2 (async) + asyncpg, Pydantic v2, Alembic, python-jose JWT, passlib/bcrypt 4.0.1 |
| Database | PostgreSQL 15                                                                         |
| Infra    | Docker Compose, Nginx (TLS via Certbot), GitHub Actions deploy over SSH               |

## Repository layout

```
revmatology/
├── backend/                FastAPI app
│   ├── main.py             App entrypoint, CORS, /uploads static mount, lifespan create_all
│   ├── config.py           Pydantic Settings (DATABASE_URL, SECRET_KEY, ...) from .env
│   ├── api/                Route modules: auth, content, congress, admin (and unused news, rheumatology)
│   ├── database/           SQLAlchemy Base, async engine, models.py (all ORM models)
│   ├── schemas/            Pydantic v2 request/response schemas
│   ├── functions/          auth helpers (JWT, hashing, get_current_user/admin) + legacy crud.py
│   ├── alembic/            Alembic env + versions/ (001, 002…)
│   ├── migrations/         Ad-hoc one-off scripts — DO NOT add new ones, use Alembic
│   ├── seed_data.py        Initial data + admin user (admin@revmatology.uz / admin123)
│   ├── reset_db.py         Drops & recreates all tables — destructive
│   └── requirements.txt
├── frontend/               React SPA
│   ├── src/
│   │   ├── App.jsx         Router with public Layout + /admin AdminLayout
│   │   ├── main.jsx        Entry, imports i18n
│   │   ├── services/api.js Single axios client, authAPI/contentAPI/adminAPI
│   │   ├── context/AuthContext.jsx  Token in localStorage, exposes login/logout/isAdmin
│   │   ├── components/
│   │   │   ├── admin/      Shared admin component library (AdminTable, AdminModal,
│   │   │   │               AdminForm, AdminFormField, LangTabs, FileUpload,
│   │   │   │               ConfirmDialog, PageHeader, StatCard, StatusBadge,
│   │   │   │               EmptyState, Skeleton, Toast)
│   │   │   ├── layout/     Header, HeaderV1 (unused legacy), Footer, Layout, ScrollToTop
│   │   │   └── ui/         AnimatedSection, LanguageSwitcher
│   │   ├── pages/          Public pages (Home, About/*, Rheumatology, Congress, News, …)
│   │   ├── pages/admin/    Admin CRUD pages, one per resource
│   │   ├── hooks/          useHeroImage, useInView
│   │   ├── i18n/           index.js + locales/{ru,uz,en}.json (must stay in sync)
│   │   └── test/setup.js   Vitest setup (@testing-library/jest-dom)
│   ├── public/             Static assets (logo, charter PDF/docx, hero-bg.jpg)
│   ├── vite.config.js      Dev proxy /api → :8000, /uploads → :8000; vitest jsdom
│   └── eslint.config.js
├── nginx/nginx.conf        Prod TLS, proxies /api → backend:8000, serves /uploads
├── docker-compose.yml      Dev: db + backend + frontend dev server
├── docker-compose.prod.yml Prod: db + backend + nginx + certbot, uses .env
├── deploy.sh               Manual build + compose up (the GitHub Action is preferred)
├── DEPLOY.md               Full server bring-up + SSL instructions
├── .github/workflows/deploy.yml  Auto-deploy on push to master
└── .claude/settings.local.json
```

## Development workflows

### First-time setup

```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate    # PowerShell: .\venv\Scripts\Activate.ps1
pip install -r requirements.txt
cp .env.example .env                                # then edit DATABASE_URL / SECRET_KEY

# Frontend
cd ../frontend
npm install
```

A local Postgres is required for the backend (or use `docker compose up db`). After the backend starts the first time it runs `Base.metadata.create_all` for any new tables; for established DBs use Alembic.

### Run locally

```bash
# Backend (port 8000, OpenAPI at /docs)
cd backend && uvicorn main:app --reload

# Frontend (port 5173, proxies /api and /uploads to :8000)
cd frontend && npm run dev

# Or full stack via docker
docker compose up
```

Default admin (from `seed_data.py`): `admin@revmatology.uz` / `admin123`. Change immediately in any environment that matters with `backend/change_admin_password.py`.

### Tests

```bash
# Frontend — Vitest + jsdom
cd frontend
npm test              # one-shot
npm run test:watch    # watch mode
npm run lint          # eslint

# Backend — no test suite yet. test_import.py is a smoke check, not a real test.
```

### Database migrations

Use **Alembic**. Versions live in `backend/alembic/versions/` (`001_*`, `002_*`, …). The async engine is wired up in `alembic/env.py` and pulls `DATABASE_URL` from `config.settings`.

```bash
cd backend
alembic revision --autogenerate -m "describe change"
alembic upgrade head
alembic downgrade -1
```

In prod, the GitHub Action runs `alembic upgrade head` inside the backend container after each deploy.

Do **not** add new ad-hoc scripts under `backend/migrations/`; those are legacy. `backend/main.py` still calls `Base.metadata.create_all` on startup as a safety net for fresh installs — it does not modify existing columns.

### Deployment

Push to `master` → GitHub Actions builds the frontend, SSHes to the server, pulls, rebuilds the backend container, runs `alembic upgrade head`, SCPs `frontend/dist/` and restarts nginx. Required secrets: `SERVER_HOST`, `SERVER_USER`, `SSH_PRIVATE_KEY`. See `DEPLOY.md` for first-time server bring-up and SSL.

## Architectural conventions

### Multilingual content

Every user-visible content field exists in three columns: `<field>_ru`, `<field>_uz`, `<field>_en` (Russian required, UZ/EN optional). Frontend uses this resolver pattern (tested in `frontend/src/test/getField.test.js`):

```js
const getField = (item, field, lang) =>
  item?.[`${field}_${lang}`] || item?.[`${field}_ru`] || '';
```

The Congress page uses an `L(item, field, lang)` alias with the same semantics. **Always fall back to RU**, never throw on missing UZ/EN.

UI translations live in `frontend/src/i18n/locales/{ru,uz,en}.json`. They must stay key-for-key in sync — `i18n.test.js` enforces this with `flattenObject` diffing. RU is `fallbackLng`. Selected language persists in `localStorage.language`.

### Admin component library

All admin pages in `frontend/src/pages/admin/` build on the shared kit in `frontend/src/components/admin/` (re-exported from `components/admin/index.js`). When adding a new admin page, reuse these primitives — do not reinvent tables/modals/forms:

- `PageHeader` — title + action buttons
- `AdminTable` — sortable, paginated table with row actions
- `AdminModal` — overlay modal with ESC/click-outside close
- `AdminForm` + `AdminFormField` — form wrapper + typed input (text/textarea/select/checkbox/file)
- `LangTabs` — RU/UZ/EN tab switcher; pass children as render-prop `(lang) => <fields />`
- `FileUpload` — drag-and-drop, supports images (incl. HEIC/HEIF) and docs
- `ConfirmDialog`, `StatusBadge`, `EmptyState`, `Skeleton`, `StatCard`, `useToast`

`AdminLayout.jsx` provides the sidebar+topbar shell, gates on `isAdmin`, and persists collapsed state in `localStorage`. Sidebar nav is configured by `NAV_GROUPS` — add new resources there.

### Backend API surface

Routes are grouped under `/api` and split into routers in `backend/api/__init__.py`:

| Prefix         | File                | Purpose                                           |
| -------------- | ------------------- | ------------------------------------------------- |
| `/api/auth`    | `api/auth.py`       | `POST /register`, `POST /login`, `GET /me`        |
| `/api/content` | `api/content.py`    | All public/admin CRUD + `POST /upload` (files)    |
| `/api/congress`| `api/congress.py`   | Congresses, sponsors, program days/sections, speakers, registrations |
| `/api/admin`   | `api/admin.py`      | Dashboard stats, user management, school applications, congress registrations |

`api/news.py` and `api/rheumatology.py` exist but are **not wired into the router**. Treat them as legacy until intentionally restored.

Patterns to follow when extending an endpoint:

- Async only. Inject the session via `db: AsyncSession = Depends(get_db)`.
- Admin-only mutations use `admin = Depends(get_current_admin)` (alias of `get_current_admin_user`); public reads have no dep.
- Most list endpoints accept `include_inactive: bool = False` and filter on `is_active`.
- Update endpoints use `data.model_dump(exclude_unset=True)` to allow partial updates.
- Uploaded files go to `uploads/` with a UUID filename; the route returns `{"url": "/uploads/<uuid>.<ext>"}`. Nginx serves them in prod; vite proxy serves them in dev.

### Frontend API client

`frontend/src/services/api.js` is the single axios instance. It:

- Reads `VITE_API_URL` (defaults to `/api`).
- Auto-attaches `Authorization: Bearer <token>` from `localStorage.token`.
- On 401, redirects to `/login` **only** on admin routes; public pages stay put.
- Exports three flat objects: `authAPI`, `contentAPI`, `adminAPI`. Add new endpoints there rather than calling axios directly from pages.

### Auth & roles

JWT in `localStorage.token` (subject = email, includes `role` claim). `AuthContext` exposes `user`, `loading`, `login`, `register`, `logout`, `isAdmin`. Admin routes are guarded inside `AdminLayout` (`!isAdmin → Navigate("/login")`). The backend re-validates on every admin endpoint via `get_current_admin_user`.

`User.role` is `UserRole.USER | UserRole.ADMIN`. Promote a user with `PUT /api/admin/users/{id}/role?role=admin`.

### Hero images

Each public page can have an admin-managed hero background via the `hero_images` table, keyed by `page_key`. Use the `useHeroImage(pageKey)` hook on the page. Manage values from `/admin/hero-images`.

## Code style

### Python (backend)

- Async SQLAlchemy 2.0 style: `select(...)`, `await db.execute(...)`, `.scalar_one_or_none()`, `.scalars().all()`.
- Pydantic v2: `model_dump()`, `model_dump(exclude_unset=True)`; response models use `class Config: from_attributes = True`.
- Bcrypt is pinned to `4.0.1` for passlib compatibility — do not bump.
- Russian docstrings/comments are fine and prevalent.

### JavaScript (frontend)

- JSX only (no TypeScript). React 19, function components, hooks, no class components.
- ESLint rule `'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }]` — unused PascalCase/UPPER imports are allowed (icon libraries).
- Tailwind v4 via `@import "tailwindcss"` in `index.css` with `@theme` custom colors; no `tailwind.config.js`.
- Admin UI strings are Russian (the admin panel is Russian-only); public UI strings go through `t('namespace.key')`.

### Tests

Frontend tests sit alongside components in `__tests__/` and follow the `import { describe, it, expect } from 'vitest'` + Testing Library pattern. `setup.js` brings in `@testing-library/jest-dom`. Use `vitest run` (default `npm test`), not `vitest --watch`, in CI-like checks.

## Gotchas

- **CORS** in `backend/main.py` is hard-coded to `http://localhost:5173` and `http://localhost:3000`. Adjust if running the frontend on another port.
- **SQLite file** `backend/rheumatology.db` is committed by accident-ish — it's not used at runtime (PostgreSQL is). Ignore it. `.gitignore` does have `*.db` so future ones will be excluded.
- **`backend/change_admin_password.py`** contains a hard-coded production password. If you touch it, do not commit a new credential.
- **`backend/seed_data.py`** is idempotent — it bails if any `BoardMember` exists. Run it once after `reset_db.py` (which is destructive).
- **`docker-compose.yml`** uses the dev secret `your-secret-key-change-in-production`; never use this in prod (`docker-compose.prod.yml` reads from `.env`).
- **Two header components** exist: `Header.jsx` is current, `HeaderV1.jsx` is legacy. Edit `Header.jsx`.
- **`api/news.py` / `api/rheumatology.py`** are unrouted — content news lives under `/api/content/news` and school applications under `/api/content/school-applications`.
- Pre-1.0 — no formal versioning. Schema changes ship with Alembic migrations and the deploy action; nothing else.

## Conventions for AI changes

- Make multilingual schema/UI changes for all three languages in the same change (RU/UZ/EN columns, all three locale JSONs).
- Reuse `components/admin/*` primitives; resist the urge to introduce a new table/modal pattern.
- Add new endpoints in the existing routers (`content`, `congress`, `admin`) before creating a new module; if you do create one, wire it up in `api/__init__.py`.
- For DB schema changes, write an Alembic migration in `backend/alembic/versions/` with a sequential numeric prefix and matching `down_revision`. Do not add to `backend/migrations/`.
- Default to small, surgical diffs. Russian comments are fine; do not translate existing ones.
- Don't push to `master` directly. Develop on the feature branch you were told to use, commit, push that branch, and only open a PR if explicitly asked.
