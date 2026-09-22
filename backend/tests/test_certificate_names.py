"""Чистые функции сертификатов (К-11): имена, телефоны, имя файла, разбор CSV."""
import pytest

from functions.certificate_names import (
    NoNameColumn,
    certificate_filename,
    clean_phone,
    normalize_name,
    parse_recipients_csv,
    phone_digits,
    phones_match,
)


# ==================== normalize_name ====================

def test_normalize_ignores_case_and_spaces():
    assert normalize_name("  Шодиева   Ситора Баходировна ") == normalize_name("шодиева ситора баходировна")


def test_normalize_yo_equals_ye():
    assert normalize_name("Ёлкина") == normalize_name("Елкина")


def test_normalize_all_apostrophes_are_one():
    assert normalize_name("Oʻgʻiloy") == normalize_name("O'g'iloy") == normalize_name("O’g’iloy")
    assert normalize_name("Oʼgʼiloy") == normalize_name("O‘g‘iloy") == normalize_name("O`g`iloy") == normalize_name("O\u00b4g\u00b4iloy") == "o'g'iloy"


def test_normalize_decomposed_letters_equal_composed():
    """й и ё, набранные разложенными (буква + комбинирующий знак), — те же буквы."""
    assert normalize_name("Сергеи\u0306") == normalize_name("Сергей")
    assert normalize_name("Е\u0308лкина") == normalize_name("Елкина") == normalize_name("Ёлкина")


# ==================== телефоны ====================

def test_phone_digits_keeps_only_digits():
    assert phone_digits("+998 (90) 123-45-67") == "998901234567"
    assert phone_digits(None) == ""


@pytest.mark.parametrize("entered", ["+998 90 123 45 67", "998901234567", "90 123 45 67", "901234567"])
def test_phones_match_three_forms(entered):
    assert phones_match("998901234567", entered)


def test_phones_match_rejects_short_input():
    assert not phones_match("998901234567", "1234567")


def test_phones_match_rejects_other_number():
    assert not phones_match("998901234567", "+998 91 123 45 67")


def test_phones_match_short_stored_never_matches():
    """Короткие телефоны в базу не попадают (clean_phone → None); если такой всё же
    есть — он не совпадает ни с чем, отдельной ветки «сравнить целиком» нет."""
    assert phones_match("12345678", "12345678") is False
    assert phones_match("12345678", "112345678") is False
    assert phones_match("", "901234567") is False


# ==================== clean_phone ====================

@pytest.mark.parametrize("raw, expected", [
    (None, (None, None)),
    ("", (None, None)),
    ("  -  ", (None, None)),
    ("901234567", ("901234567", None)),
    ("+998 90 123 45 67", ("998901234567", None)),
    ("1234", (None, "short")),
    ("12345678", (None, "short")),
    ("123456789012345", ("123456789012345", None)),  # 15 цифр — предел E.164
    ("+998 90 123 45 67, +998 91 765 43 21", (None, "invalid")),  # два номера в ячейке
])
def test_clean_phone(raw, expected):
    assert clean_phone(raw) == expected


# ==================== certificate_filename ====================

def test_filename_latin():
    assert certificate_filename("Shodieva Sitora Baxodirovna") == "Certificate_Shodieva_Sitora_Baxodirovna.pdf"


def test_filename_russian():
    assert certificate_filename("Шодиева Ситора Баходировна") == "Certificate_Shodieva_Sitora_Bakhodirovna.pdf"


def test_filename_uzbek_cyrillic():
    assert certificate_filename("Қодирова Ўғилой Ҳасановна") == "Certificate_Qodirova_Ogiloy_Hasanovna.pdf"


def test_filename_uzbek_latin_apostrophe():
    assert certificate_filename("Oʻgʻiloy") == "Certificate_Ogiloy.pdf"


def test_filename_multiletter_capitals_and_signs():
    assert certificate_filename("Щукин Юрий Ёж-Чайковский") == "Certificate_Shchukin_Yuriy_Yozh-Chaykovskiy.pdf"
    assert certificate_filename("Объедков Ильич") == "Certificate_Obedkov_Ilich.pdf"


def test_filename_empty_or_unmappable():
    assert certificate_filename("") == "Certificate.pdf"
    assert certificate_filename("  ***  ") == "Certificate.pdf"


# ==================== parse_recipients_csv ====================

BASIC = "ФИО;Телефон\nАлиев Али;+998 90 111 22 33\n;\nАлиев Али;+998 90 111 22 33\nKarimov Bobur;\n"


def _check_basic(result):
    assert result.accepted == 2
    assert result.empty_rows == 1
    assert result.duplicates_in_file == 1
    assert [(r.full_name, r.phone_digits) for r in result.rows] == [
        ("Алиев Али", "998901112233"),
        ("Karimov Bobur", None),
    ]
    assert result.rows[0].name_key == normalize_name("Алиев Али")
    assert result.columns == ["ФИО", "Телефон"]


def test_csv_basic_utf8():
    _check_basic(parse_recipients_csv(BASIC.encode("utf-8")))


def test_csv_cp1251():
    _check_basic(parse_recipients_csv(BASIC.encode("cp1251")))


def test_csv_utf8_bom():
    _check_basic(parse_recipients_csv(BASIC.encode("utf-8-sig")))


def test_csv_comma_and_name_triple():
    result = parse_recipients_csv("Фамилия,Имя,Отчество,phone\nШодиева,Ситора,Баходировна,901234567\n".encode())
    assert [(r.full_name, r.phone_digits) for r in result.rows] == [("Шодиева Ситора Баходировна", "901234567")]


def test_csv_triple_latin_headers_without_patronymic_value():
    result = parse_recipients_csv(b"last_name;first_name;patronymic\nKarimov;Bobur;\n")
    assert [r.full_name for r in result.rows] == ["Karimov Bobur"]


def test_csv_tab_delimiter():
    result = parse_recipients_csv("Name\tTel\nKarimov Bobur\t+998 90 123 45 67\n".encode())
    assert [(r.full_name, r.phone_digits) for r in result.rows] == [("Karimov Bobur", "998901234567")]


@pytest.mark.parametrize("header", ["Ф.И.О.", " фио ", "full_name", "NAME", "F.I.Sh."])
def test_csv_name_header_variants(header):
    result = parse_recipients_csv(f"{header};phone\nАлиев Али;\n".encode())
    assert [r.full_name for r in result.rows] == ["Алиев Али"]


def test_csv_single_column_without_phone():
    result = parse_recipients_csv("ФИО\nАлиев Али\nKarimov Bobur\n".encode())
    assert [(r.full_name, r.phone_digits) for r in result.rows] == [("Алиев Али", None), ("Karimov Bobur", None)]


def test_csv_no_name_column():
    with pytest.raises(NoNameColumn) as info:
        parse_recipients_csv("Город;Возраст\nТашкент;30\n".encode())
    assert info.value.columns == ["Город", "Возраст"]
    assert isinstance(info.value, ValueError)


def test_csv_full_name_is_trimmed_and_collapsed():
    result = parse_recipients_csv("ФИО;Телефон\n  Алиев   Али  ;\n".encode())
    assert result.rows[0].full_name == "Алиев Али"


def test_csv_same_name_different_phone_is_not_duplicate():
    result = parse_recipients_csv("ФИО;Телефон\nАлиев Али;901112233\nалиев  али;902223344\n".encode())
    assert result.accepted == 2 and result.duplicates_in_file == 0


def test_csv_duplicate_by_normalized_name():
    result = parse_recipients_csv("ФИО;Телефон\nЁлкина Анна;\nелкина  анна;\n".encode())
    assert result.accepted == 1 and result.duplicates_in_file == 1
    assert result.rows[0].full_name == "Ёлкина Анна"


def test_csv_short_and_invalid_phones_become_none():
    data = (
        "ФИО;Телефон\n"
        "Алиев Али;1234\n"
        "Karimov Bobur;+998 90 123 45 67 / +998 91 765 43 21\n"
        "Шодиева Ситора;901234567\n"
    ).encode()
    result = parse_recipients_csv(data)
    assert [(r.full_name, r.phone_digits) for r in result.rows] == [
        ("Алиев Али", None), ("Karimov Bobur", None), ("Шодиева Ситора", "901234567"),
    ]
    assert (result.accepted, result.short_phones, result.invalid_phones) == (3, 1, 1)


def test_csv_short_phone_duplicate_of_no_phone():
    """Короткий телефон = нет телефона, поэтому совпадает с той же строкой без телефона."""
    result = parse_recipients_csv("ФИО;Телефон\nАлиев Али;\nАлиев Али;12\n".encode())
    assert (result.accepted, result.duplicates_in_file, result.short_phones) == (1, 1, 1)


def test_csv_too_long_name_is_dropped():
    result = parse_recipients_csv(f"ФИО\n{'А' * 301}\n{'Б' * 300}\n".encode())
    assert [len(r.full_name) for r in result.rows] == [300]
    assert (result.accepted, result.too_long_names) == (1, 1)


