"""Чистые функции сертификатов (К-11): поиск по имени, телефоны, имя файла, CSV.

Без БД — покрываются tests/test_certificate_names.py.
"""
import csv
import io
import re
import unicodedata
from dataclasses import dataclass, field
from typing import Optional

# Все виды апострофа, которыми пишут узбекскую латиницу (Oʻgʻiloy / O'g'iloy / O’g’iloy)
APOSTROPHES = "ʻʼ'’‘`"
_APOSTROPHE_TABLE = str.maketrans({ch: "'" for ch in APOSTROPHES})


def normalize_name(s: str) -> str:
    """Ключ поиска: регистр, пробелы, ё=е и апострофы не различаются."""
    s = (s or "").casefold().replace("ё", "е").translate(_APOSTROPHE_TABLE)
    return " ".join(s.split())


def phone_digits(s: Optional[str]) -> str:
    return "".join(ch for ch in (s or "") if ch.isdigit())


def phones_match(stored: str, entered: str) -> bool:
    """Сравнение по последним 9 цифрам: +998 90 123 45 67 = 998901234567 = 90 123 45 67.

    Введено меньше 9 цифр — не совпало; в базе меньше 9 — сравнение целиком.
    """
    stored, entered = phone_digits(stored), phone_digits(entered)
    if len(entered) < 9:
        return False
    if len(stored) < 9:
        return stored == entered
    return stored[-9:] == entered[-9:]


# ==================== имя файла ====================

_TRANSLIT = {
    "а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "e", "ё": "yo", "ж": "zh",
    "з": "z", "и": "i", "й": "y", "к": "k", "л": "l", "м": "m", "н": "n", "о": "o",
    "п": "p", "р": "r", "с": "s", "т": "t", "у": "u", "ф": "f", "х": "kh", "ц": "ts",
    "ч": "ch", "ш": "sh", "щ": "shch", "ъ": "", "ы": "y", "ь": "", "э": "e", "ю": "yu",
    "я": "ya", "ў": "o", "қ": "q", "ғ": "g", "ҳ": "h",
}


def _transliterate(s: str) -> str:
    out = []
    for ch in s:
        low = ch.lower()
        if low in _TRANSLIT:
            latin = _TRANSLIT[low]
            out.append(latin.capitalize() if ch != low else latin)
        else:
            out.append(ch)
    return "".join(out)


def certificate_filename(full_name: str) -> str:
    """Certificate_<латиница>.pdf — ASCII-имя для Content-Disposition."""
    s = _transliterate(full_name or "")
    s = "".join(ch for ch in s if ch not in APOSTROPHES)
    # оставшаяся латиница с диакритикой (é, ü) — к базовой букве
    s = "".join(ch for ch in unicodedata.normalize("NFKD", s) if not unicodedata.combining(ch))
    s = re.sub(r"[^A-Za-z0-9_-]+", "_", s)
    s = re.sub(r"_+", "_", s).strip("_")
    return f"Certificate_{s}.pdf" if s else "Certificate.pdf"


# ==================== CSV ====================

NAME_HEADERS = {"фио", "фиш", "fullname", "name", "fio", "fish"}
LAST_HEADERS = {"фамилия", "lastname"}
FIRST_HEADERS = {"имя", "firstname"}
PATRONYMIC_HEADERS = {"отчество", "patronymic"}
PHONE_HEADERS = {"телефон", "phone", "tel"}
DELIMITERS = ",;\t"


class NoNameColumn(ValueError):
    """В заголовке CSV нет ни колонки Ф.И.О., ни тройки Фамилия/Имя/Отчество."""

    def __init__(self, columns: list[str]):
        super().__init__(f"no_name_column: {columns}")
        self.columns = columns


@dataclass(frozen=True)
class ParsedRecipient:
    full_name: str
    name_key: str
    phone_digits: Optional[str]


@dataclass
class ParsedCsv:
    rows: list[ParsedRecipient] = field(default_factory=list)
    empty_rows: int = 0
    duplicates_in_file: int = 0
    columns: list[str] = field(default_factory=list)

    @property
    def accepted(self) -> int:
        return len(self.rows)


def _header_key(cell: str) -> str:
    """'Ф.И.О.' / ' full_name ' / 'F.I.Sh.' → 'фио' / 'fullname' / 'fish'."""
    return re.sub(r"[\s._\-]+", "", cell.casefold())


def _decode(data: bytes) -> str:
    try:
        return data.decode("utf-8-sig")
    except UnicodeDecodeError:
        return data.decode("cp1251")


def _detect_delimiter(text: str) -> str:
    sample = text[:4096]
    try:
        return csv.Sniffer().sniff(sample, delimiters=DELIMITERS).delimiter
    except csv.Error:
        # одна колонка или Sniffer не решился — по числу разделителей в заголовке
        header = sample.splitlines()[0] if sample else ""
        counts = {d: header.count(d) for d in DELIMITERS}
        best = max(counts, key=counts.get)
        return best if counts[best] else ","


def _find(keys: list[str], variants: set[str]) -> Optional[int]:
    return next((i for i, k in enumerate(keys) if k in variants), None)


def _cell(row: list[str], index: Optional[int]) -> str:
    if index is None or index >= len(row):
        return ""
    return row[index]


def parse_recipients_csv(data: bytes) -> ParsedCsv:
    text = _decode(data)
    reader = csv.reader(io.StringIO(text), delimiter=_detect_delimiter(text))
    header = next(reader, [])
    columns = [c.strip() for c in header]
    keys = [_header_key(c) for c in columns]

    name_i = _find(keys, NAME_HEADERS)
    last_i, first_i = _find(keys, LAST_HEADERS), _find(keys, FIRST_HEADERS)
    patronymic_i = _find(keys, PATRONYMIC_HEADERS)
    if name_i is None and (last_i is None or first_i is None):
        raise NoNameColumn(columns)
    phone_i = _find(keys, PHONE_HEADERS)

    result = ParsedCsv(columns=columns)
    seen: set[tuple[str, Optional[str]]] = set()
    for row in reader:
        if name_i is not None:
            raw_name = _cell(row, name_i)
        else:
            raw_name = " ".join(_cell(row, i) for i in (last_i, first_i, patronymic_i))
        full_name = " ".join(raw_name.split())
        if not full_name:
            result.empty_rows += 1
            continue
        phone = phone_digits(_cell(row, phone_i)) or None
        key = normalize_name(full_name)
        if (key, phone) in seen:
            result.duplicates_in_file += 1
            continue
        seen.add((key, phone))
        result.rows.append(ParsedRecipient(full_name=full_name, name_key=key, phone_digits=phone))
    return result
