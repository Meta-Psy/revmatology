"""Кого пускает вход: регистр почты и отключённые записи (К-12).

Кабинет сопоставляет сертификаты по нормализованной почте, поэтому и вход, и
`/auth/me`, и любая зависимость от токена обязаны находить человека независимо
от регистра — иначе заведший «Sitora@Mail.UZ» не войдёт как «sitora@mail.uz».
Отключённая запись при этом не должна открывать персональные данные.
"""
import pytest
from sqlalchemy import select

from database.models import User, UserRole
from functions.auth import create_access_token, get_password_hash

AUTH = "/api/auth"
MINE = "/api/congress/my-certificates"
PASSWORD = "sitora-pass-2026"


@pytest.fixture
def make_user(db_session):
    """Учётная запись напрямую в БД — в том числе с почтой в «неправильном» регистре."""
    async def _make(email, *, password=PASSWORD, is_active=True, first_name="Ситора"):
        user = User(
            email=email, hashed_password=get_password_hash(password),
            last_name="Шодиева", first_name=first_name,
            role=UserRole.USER, is_active=is_active,
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)
        return user

    return _make


def _headers(email: str) -> dict:
    return {"Authorization": f"Bearer {create_access_token({'sub': email, 'role': 'user'})}"}


async def _login(client, username, password=PASSWORD):
    return await client.post(f"{AUTH}/login", data={"username": username, "password": password})


# ==================== регистр почты ====================

async def test_register_stores_email_lowercased(client, db_session):
    response = await client.post(f"{AUTH}/register", json={
        "email": "Sitora@Mail.UZ", "password": PASSWORD,
        "last_name": "Шодиева", "first_name": "Ситора",
    })

    assert response.status_code == 200, response.text
    assert response.json()["email"] == "sitora@mail.uz"
    assert (await db_session.execute(select(User.email))).scalars().all() == ["sitora@mail.uz"]


async def test_register_rejects_the_same_email_in_another_case(client):
    body = {"email": "sitora@mail.uz", "password": PASSWORD,
            "last_name": "Шодиева", "first_name": "Ситора"}
    assert (await client.post(f"{AUTH}/register", json=body)).status_code == 200

    again = await client.post(f"{AUTH}/register", json={**body, "email": "SITORA@mail.uz"})

    assert again.status_code == 400, again.text


async def test_login_accepts_another_case(client, make_user):
    await make_user("sitora@mail.uz")

    response = await _login(client, "Sitora@Mail.UZ")

    assert response.status_code == 200, response.text


async def test_login_survives_duplicates_differing_by_case(client, make_user):
    """В живой базе могли осесть две записи, различающиеся регистром."""
    first = await make_user("sitora@mail.uz")
    await make_user("Sitora@Mail.UZ", first_name="Двойник")

    response = await _login(client, "SITORA@MAIL.UZ")

    assert response.status_code == 200, response.text
    me = await client.get(f"{AUTH}/me", headers={
        "Authorization": f"Bearer {response.json()['access_token']}"})
    assert me.json()["id"] == first.id  # детерминированно: младший id


async def test_me_finds_the_owner_of_the_email_in_any_case(client, make_user):
    user = await make_user("sitora@mail.uz")

    me = await client.get(f"{AUTH}/me", headers=_headers("Sitora@Mail.UZ"))

    assert me.status_code == 200, me.text
    assert me.json()["id"] == user.id


async def test_account_page_opens_for_the_email_in_any_case(client, make_user):
    await make_user("sitora@mail.uz")

    mine = await client.get(MINE, headers=_headers("SITORA@Mail.uz"))

    assert mine.status_code == 200, mine.text
    assert mine.json() == []


# ==================== отключённая запись ====================

async def test_disabled_account_sees_nothing_personal(client, make_user):
    user = await make_user("off@mail.uz", is_active=False)
    headers = _headers(user.email)

    assert (await client.get(f"{AUTH}/me", headers=headers)).status_code == 403
    assert (await client.get(MINE, headers=headers)).status_code == 403
    assert (await client.post(f"{MINE}/1/download", headers=headers)).status_code == 403


async def test_active_account_is_not_affected(client, make_user):
    user = await make_user("on@mail.uz")

    me = await client.get(f"{AUTH}/me", headers=_headers(user.email))

    assert me.status_code == 200, me.text
