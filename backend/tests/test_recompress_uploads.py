"""scripts/recompress_uploads.py: пережатие уже загруженных изображений на месте."""
import os
import stat
from io import BytesIO

import pytest
from PIL import ExifTags, Image

from scripts.recompress_uploads import main


def _write(path, im, fmt, **kwargs):
    im.save(path, fmt, **kwargs)
    return path.read_bytes()


def _noise(size, mode="RGB"):
    return Image.effect_noise(size, 60).convert(mode)


@pytest.fixture
def uploads(tmp_path):
    """Каталог, похожий на прод: большие JPEG/PNG/WEBP, PDF и GIF."""
    files = {}
    files["photo.jpg"] = _write(tmp_path / "photo.jpg", _noise((2400, 1600)), "JPEG", quality=95)
    files["banner.png"] = _write(tmp_path / "banner.png", _noise((2400, 1200), "RGBA"), "PNG")
    files["pic.webp"] = _write(tmp_path / "pic.webp", _noise((1800, 1800)), "WEBP", quality=95)
    files["charter.pdf"] = b"%PDF-1.4 fake"
    (tmp_path / "charter.pdf").write_bytes(files["charter.pdf"])
    buf = BytesIO()
    Image.new("P", (3000, 10)).save(buf, "GIF")
    files["anim.gif"] = buf.getvalue()
    (tmp_path / "anim.gif").write_bytes(files["anim.gif"])
    return tmp_path, files


def test_dry_run_is_default_and_writes_nothing(uploads, capsys):
    directory, files = uploads

    code = main([str(directory)])

    assert code == 0
    for name, data in files.items():
        assert (directory / name).read_bytes() == data
    out = capsys.readouterr().out
    assert "photo.jpg" in out and "banner.png" in out and "pic.webp" in out
    assert "→" in out
    assert "charter.pdf" not in out
    assert sorted(p.name for p in directory.iterdir()) == sorted(files)


def test_apply_recompresses_in_place_keeping_name_and_format(uploads):
    directory, files = uploads

    code = main([str(directory), "--apply"])

    assert code == 0
    expected = {"photo.jpg": ("JPEG", (1600, 1067)), "banner.png": ("PNG", (1600, 800)),
                "pic.webp": ("WEBP", (1600, 1600))}
    for name, (fmt, size) in expected.items():
        path = directory / name
        with Image.open(path) as im:
            assert im.format == fmt, name
            assert im.size == size, name
        assert path.stat().st_size < len(files[name]), name
    # документы и GIF не тронуты, временных файлов не осталось
    assert (directory / "charter.pdf").read_bytes() == files["charter.pdf"]
    assert (directory / "anim.gif").read_bytes() == files["anim.gif"]
    assert sorted(p.name for p in directory.iterdir()) == sorted(files)


def test_apply_rotates_by_exif_and_strips_exif(tmp_path):
    exif = Image.Exif()
    exif[ExifTags.Base.Orientation] = 6
    gps = exif.get_ifd(ExifTags.IFD.GPSInfo)
    gps[ExifTags.GPS.GPSLatitudeRef] = "N"
    _write(tmp_path / "rot.jpg", _noise((2400, 1200)), "JPEG", quality=95, exif=exif.tobytes())

    assert main([str(tmp_path), "--apply"]) == 0

    with Image.open(tmp_path / "rot.jpg") as im:
        assert im.size == (800, 1600)
        assert len(im.getexif()) == 0


def test_result_not_smaller_keeps_original(tmp_path, capsys):
    # маленький JPEG низкого качества: пережатие в q85 только увеличит его
    data = _write(tmp_path / "tiny.jpg", _noise((200, 200)), "JPEG", quality=20)

    assert main([str(tmp_path), "--apply"]) == 0

    assert (tmp_path / "tiny.jpg").read_bytes() == data
    assert "оставлен" in capsys.readouterr().out


def test_broken_file_reported_others_processed(tmp_path, capsys):
    (tmp_path / "broken.jpg").write_bytes(b"not an image")
    _write(tmp_path / "photo.jpg", _noise((2400, 1600)), "JPEG", quality=95)

    code = main([str(tmp_path), "--apply"])

    assert code == 1
    assert (tmp_path / "broken.jpg").read_bytes() == b"not an image"
    with Image.open(tmp_path / "photo.jpg") as im:
        assert im.size == (1600, 1067)
    assert "broken.jpg" in capsys.readouterr().out


@pytest.mark.skipif(os.name == "nt", reason="права доступа POSIX")
def test_apply_preserves_file_permissions(tmp_path):
    # tempfile создаёт файлы с 0600 — nginx (другой пользователь) их бы не прочитал
    path = tmp_path / "photo.jpg"
    _write(path, _noise((2400, 1600)), "JPEG", quality=95)
    path.chmod(0o644)

    assert main([str(tmp_path), "--apply"]) == 0

    assert stat.S_IMODE(path.stat().st_mode) == 0o644


def test_missing_directory_is_an_error(tmp_path):
    with pytest.raises(SystemExit):
        main([str(tmp_path / "nope")])
