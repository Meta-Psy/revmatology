"""POST /api/content/upload: белый список, лимит размера, сжатие изображений.

Каталог загрузок подменяется на tmp_path, чтобы тесты не писали в backend/uploads.
"""
import logging
import random
from io import BytesIO
from pathlib import Path

import pillow_heif
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from PIL import ExifTags, Image, ImageDraw, JpegImagePlugin

import api.content as content_module
from image_processing import compress_for_upload
from tests import image_samples as samples
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


async def test_photo_png_without_transparency_becomes_jpeg(client, upload_dir):
    # альфа-канал есть, но целиком непрозрачный — как у экспортов из редакторов
    data = samples.to_bytes(samples.noise((2000, 1000), "RGBA"))

    response = await _upload(client, "banner.png", data, "image/png")

    assert response.status_code == 200, response.text
    assert response.json()["url"].endswith(".jpg")
    with Image.open(_saved(upload_dir, response)) as out:
        assert out.format == "JPEG"
        assert out.size == (1600, 800)


async def test_flat_opaque_logo_png_stays_png(client, upload_dir):
    # плоский логотип: PNG меньше JPEG и без ореолов вокруг букв
    logo = Image.new("RGB", (1200, 400), "white")
    draw = ImageDraw.Draw(logo)
    draw.rectangle((40, 100, 600, 250), fill=(200, 0, 40))
    draw.rectangle((40, 300, 1160, 330), fill=(0, 70, 160))
    data = samples.to_bytes(logo, optimize=True)

    response = await _upload(client, "sponsor.png", data, "image/png")

    assert response.status_code == 200, response.text
    assert response.json()["url"].endswith(".png")
    with Image.open(_saved(upload_dir, response)) as out:
        assert out.format == "PNG"
        assert out.size == (1200, 400)
        assert len(out.convert("RGB").getcolors(1 << 24)) == 3  # цвета не «поплыли»


@pytest.mark.parametrize("mode", ["P", "RGB", "L"])
async def test_png_key_transparency_is_preserved(client, upload_dir, mode):
    data = samples.key_transparent_png(mode, (400, 200))

    response = await _upload(client, f"logo-{mode}.png", data, "image/png")

    assert response.status_code == 200, response.text
    assert response.json()["url"].endswith(".png")
    with Image.open(_saved(upload_dir, response)) as out:
        assert out.format == "PNG"
        samples.assert_left_transparent_right_opaque(out)


async def test_16bit_png_is_not_whitened(client, upload_dir):
    response = await _upload(client, "scan16.png", samples.i16_png((300, 200), 30000), "image/png")

    assert response.status_code == 200, response.text
    with Image.open(_saved(upload_dir, response)) as out:
        gray = out.convert("L").getpixel((150, 100))
    assert 110 <= gray <= 125  # 30000 / 256 ≈ 117, а не 255


@pytest.mark.parametrize(
    ("filename", "fmt"),
    [("photo.jfif", "JPEG"), ("photo.jpe", "JPEG"), ("photo.avif", "AVIF"),
     ("scan.bmp", "BMP"), ("scan.tif", "TIFF"), ("scan.tiff", "TIFF")],
)
async def test_more_image_formats_are_accepted(client, upload_dir, filename, fmt):
    data = samples.to_bytes(samples.noise((2000, 1000)), fmt)

    response = await _upload(client, filename, data)

    assert response.status_code == 200, response.text
    body = response.json()
    assert Path(body["url"]).suffix in (".jpg", ".png")
    assert (body["width"], body["height"]) == (1600, 800)
    with Image.open(_saved(upload_dir, response)) as out:
        assert out.format in ("JPEG", "PNG")


async def test_animated_webp_saved_as_is(client, upload_dir):
    frames = [Image.new("RGB", (60, 40), (i * 80, 0, 0)) for i in range(3)]
    data = samples.to_bytes(frames[0], "WEBP", save_all=True, append_images=frames[1:], duration=100)

    response = await _upload(client, "anim.webp", data, "image/webp")

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["url"].endswith(".webp")
    assert (body["width"], body["height"]) == (60, 40)
    assert _saved(upload_dir, response).read_bytes() == data


def test_large_jpeg_is_decoded_at_reduced_scale(monkeypatch):
    """8064×6048 не должен декодироваться целиком: draft до thumbnail."""
    decoded = []
    original_draft = JpegImagePlugin.JpegImageFile.draft

    def spy(self, mode, size):
        result = original_draft(self, mode, size)
        decoded.append(self.size)
        return result

    monkeypatch.setattr(JpegImagePlugin.JpegImageFile, "draft", spy)
    data = samples.to_bytes(Image.new("L", (8064, 6048), 128), "JPEG")

    image = compress_for_upload(data)

    assert decoded and decoded[0] == (4032, 3024)  # масштаб 1/2 при декодировании
    assert (image.width, image.height) == (1600, 1200)


async def test_image_over_50_megapixels_rejected_with_clear_message(client, upload_dir):
    data = samples.to_bytes(Image.new("1", (8000, 7000)))  # 56 Мп, файл — десятки КБ

    response = await _upload(client, "huge.png", data, "image/png")

    assert response.status_code == 400
    detail = response.json()["detail"]
    assert "слишком большое" in detail and "50 Мп" in detail
    assert list(upload_dir.iterdir()) == []


async def test_decompression_bomb_rejected_with_clear_message(client, upload_dir, monkeypatch):
    monkeypatch.setattr(Image, "MAX_IMAGE_PIXELS", 1000)  # порог «бомбы» Pillow — 2×1000 пикселей

    response = await _upload(client, "bomb.png", samples.to_bytes(Image.new("1", (100, 100))), "image/png")

    assert response.status_code == 400
    assert "слишком большое" in response.json()["detail"]
    assert list(upload_dir.iterdir()) == []


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
async def test_broken_image_rejected_400(client, upload_dir, data, caplog):
    with caplog.at_level(logging.WARNING, logger="api.content"):
        response = await _upload(client, "broken.jpg", data, "image/jpeg")

    assert response.status_code == 400
    assert "изображени" in response.json()["detail"]
    assert list(upload_dir.iterdir()) == []
    assert any("broken.jpg" in r.getMessage() for r in caplog.records)  # причина — в лог


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
