"""POST /api/content/upload: белый список, лимит размера, сжатие изображений.

Каталог загрузок подменяется на tmp_path, чтобы тесты не писали в backend/uploads.
"""
import random
from io import BytesIO
from pathlib import Path

import pillow_heif
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from PIL import ExifTags, Image

import api.content as content_module
from database import get_db
from database.models import User, UserRole
from functions.auth import get_current_user
from main import app

pillow_heif.register_heif_opener()

URL = "/api/content/upload"
MAX_UPLOAD_SIZE = 20 * 1024 * 1024


@pytest.fixture
def upload_dir(tmp_path, monkeypatch):
    monkeypatch.setattr(content_module, "UPLOAD_DIR", str(tmp_path))
    return tmp_path


def _image_bytes(size, fmt="JPEG", mode="RGB", color=(200, 30, 30), **save_kwargs):
    buf = BytesIO()
    Image.new(mode, size, color).save(buf, fmt, **save_kwargs)
    return buf.getvalue()


def _noisy_jpeg(size):
    """JPEG с шумом — чтобы размер файла был «как у фото», а не пару КБ."""
    buf = BytesIO()
    Image.effect_noise(size, 60).convert("RGB").save(buf, "JPEG", quality=95)
    return buf.getvalue()


async def _upload(client, filename, data, content_type="application/octet-stream"):
    return await client.post(URL, files={"file": (filename, data, content_type)})


def _saved(upload_dir: Path, response) -> Path:
    body = response.json()
    assert body["url"] == f"/uploads/{body['filename']}"
    path = upload_dir / body["filename"]
    assert path.is_file()
    return path


# ---------------------------------------------------------------- изображения

async def test_large_jpeg_is_downscaled_to_1600(client, upload_dir):
    data = _noisy_jpeg((4000, 3000))

    response = await _upload(client, "photo.jpg", data, "image/jpeg")

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["url"].endswith(".jpg")
    assert (body["width"], body["height"]) == (1600, 1200)
    path = _saved(upload_dir, response)
    with Image.open(path) as im:
        assert im.format == "JPEG"
        assert im.size == (1600, 1200)
    assert path.stat().st_size < len(data)


async def test_small_image_is_not_upscaled(client, upload_dir):
    response = await _upload(client, "small.jpg", _image_bytes((800, 600)), "image/jpeg")

    assert response.status_code == 200, response.text
    assert (response.json()["width"], response.json()["height"]) == (800, 600)
    with Image.open(_saved(upload_dir, response)) as im:
        assert im.size == (800, 600)


async def test_exif_orientation_applied_and_exif_stripped(client, upload_dir):
    exif = Image.Exif()
    exif[ExifTags.Base.Orientation] = 6  # повернуть на 90° по часовой
    exif[ExifTags.Base.Make] = "TestPhone"
    gps = exif.get_ifd(ExifTags.IFD.GPSInfo)
    gps[ExifTags.GPS.GPSLatitudeRef] = "N"
    gps[ExifTags.GPS.GPSLatitude] = (41.0, 18.0, 0.0)
    data = _image_bytes((400, 200), exif=exif.tobytes())
    with Image.open(BytesIO(data)) as src:  # предусловие: EXIF и GPS в исходнике есть
        assert src.getexif()[ExifTags.Base.Orientation] == 6
        assert src.getexif().get_ifd(ExifTags.IFD.GPSInfo)

    response = await _upload(client, "rotated.jpg", data, "image/jpeg")

    assert response.status_code == 200, response.text
    assert (response.json()["width"], response.json()["height"]) == (200, 400)
    with Image.open(_saved(upload_dir, response)) as im:
        assert im.size == (200, 400)
        assert "exif" not in im.info
        assert len(im.getexif()) == 0
        assert not im.getexif().get_ifd(ExifTags.IFD.GPSInfo)


async def test_heic_is_converted_to_jpeg(client, upload_dir):
    exif = Image.Exif()
    exif[ExifTags.Base.Orientation] = 6
    data = _image_bytes((2000, 1000), fmt="HEIF", exif=exif.tobytes())

    response = await _upload(client, "IMG_0001.HEIC", data, "image/heic")

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["url"].endswith(".jpg")
    # поворот применён ровно один раз: портрет, длинная сторона 1600
    assert (body["width"], body["height"]) == (800, 1600)
    with Image.open(_saved(upload_dir, response)) as im:
        assert im.format == "JPEG"
        assert im.size == (800, 1600)


async def test_png_with_transparency_stays_png(client, upload_dir):
    im = Image.new("RGBA", (2400, 1200), (0, 120, 255, 255))
    im.paste((0, 0, 0, 0), (0, 0, 1200, 1200))  # левая половина прозрачная
    buf = BytesIO()
    im.save(buf, "PNG")

    response = await _upload(client, "logo.png", buf.getvalue(), "image/png")

    assert response.status_code == 200, response.text
    assert response.json()["url"].endswith(".png")
    with Image.open(_saved(upload_dir, response)) as out:
        assert out.format == "PNG"
        assert out.size == (1600, 800)
        assert out.mode == "RGBA"
        assert out.getchannel("A").getextrema()[0] == 0


async def test_png_without_transparency_becomes_jpeg(client, upload_dir):
    data = _image_bytes((2000, 1000), fmt="PNG", mode="RGBA", color=(10, 20, 30, 255))

    response = await _upload(client, "banner.png", data, "image/png")

    assert response.status_code == 200, response.text
    assert response.json()["url"].endswith(".jpg")
    with Image.open(_saved(upload_dir, response)) as out:
        assert out.format == "JPEG"
        assert out.size == (1600, 800)


async def test_webp_stays_webp(client, upload_dir):
    data = _image_bytes((3200, 1600), fmt="WEBP")

    response = await _upload(client, "pic.webp", data, "image/webp")

    assert response.status_code == 200, response.text
    assert response.json()["url"].endswith(".webp")
    with Image.open(_saved(upload_dir, response)) as out:
        assert out.format == "WEBP"
        assert out.size == (1600, 800)


async def test_gif_saved_as_is(client, upload_dir):
    frames = [Image.new("P", (50, 40), i) for i in range(3)]
    buf = BytesIO()
    frames[0].save(buf, "GIF", save_all=True, append_images=frames[1:], duration=100, loop=0)
    data = buf.getvalue()

    response = await _upload(client, "anim.gif", data, "image/gif")

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["url"].endswith(".gif")
    assert (body["width"], body["height"]) == (50, 40)
    assert _saved(upload_dir, response).read_bytes() == data


async def test_uppercase_extension_is_normalized(client, upload_dir):
    response = await _upload(client, "PHOTO.JPEG", _image_bytes((100, 100)), "image/jpeg")

    assert response.status_code == 200, response.text
    assert response.json()["url"].endswith(".jpg")


@pytest.mark.parametrize(
    "data",
    [
        b"definitely not an image",
        _noisy_jpeg((600, 400))[:3000],  # обрезанный JPEG
    ],
    ids=["garbage", "truncated"],
)
async def test_broken_image_rejected_400(client, upload_dir, data):
    response = await _upload(client, "broken.jpg", data, "image/jpeg")

    assert response.status_code == 400
    assert "изображени" in response.json()["detail"]
    assert list(upload_dir.iterdir()) == []


# ---------------------------------------------------------------- документы

@pytest.mark.parametrize("filename", ["charter.pdf", "Устав.PDF", "doc.doc", "doc.docx"])
async def test_document_saved_byte_for_byte(client, upload_dir, filename):
    data = b"%PDF-1.4\n" + bytes(range(256)) * 100

    response = await _upload(client, filename, data, "application/pdf")

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["url"].endswith(Path(filename).suffix.lower())
    assert "width" not in body
    assert _saved(upload_dir, response).read_bytes() == data


# ---------------------------------------------------------------- отказы

@pytest.mark.parametrize("filename", ["virus.exe", "page.html", "icon.svg", "noext"])
async def test_unknown_extension_rejected_400(client, upload_dir, filename):
    response = await _upload(client, filename, b"whatever")

    assert response.status_code == 400
    assert "Недопустимый тип файла" in response.json()["detail"]
    assert list(upload_dir.iterdir()) == []


def _random_bytes(size):
    # не b"0" * size: python-multipart 0.0.6 разбирает поток одинаковых байтов
    # десятки секунд (символ есть в границе httpx), настоящие файлы — мгновенно
    return random.Random(0).randbytes(size)


async def test_file_larger_than_20mb_rejected_413(client, upload_dir):
    response = await _upload(client, "big.pdf", _random_bytes(MAX_UPLOAD_SIZE + 1))

    assert response.status_code == 413
    assert list(upload_dir.iterdir()) == []


async def test_file_of_exactly_20mb_accepted(client, upload_dir):
    response = await _upload(client, "big.pdf", _random_bytes(MAX_UPLOAD_SIZE))

    assert response.status_code == 200, response.text


@pytest_asyncio.fixture
async def anon_client(session_factory):
    """Клиент без подмены админ-зависимости — работает настоящая проверка токена."""
    async def override_get_db():
        async with session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as http_client:
        yield http_client
    app.dependency_overrides.clear()


async def test_upload_without_token_rejected(anon_client, upload_dir):
    response = await _upload(anon_client, "photo.jpg", _image_bytes((10, 10)), "image/jpeg")

    assert response.status_code == 401
    assert list(upload_dir.iterdir()) == []


async def test_upload_by_non_admin_rejected(anon_client, upload_dir):
    async def regular_user():
        return User(id=2, email="user@test.local", hashed_password="x",
                    last_name="П", first_name="П", role=UserRole.USER, is_active=True)

    app.dependency_overrides[get_current_user] = regular_user

    response = await _upload(anon_client, "photo.jpg", _image_bytes((10, 10)), "image/jpeg")

    assert response.status_code == 403
    assert list(upload_dir.iterdir()) == []
