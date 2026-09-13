"""Самотесты харнесса.

Гейт «у процесса есть привязанный тест» дыру не закрывает: тест может
существовать и быть зелёным на сломанном поведении, проверяя наличие ключей
вместо содержимого. Эти тесты доказывают, что харнесс такой прогон не пропустит.
"""

import pytest

from tests.workflows.conftest import Journey, JourneyViolation
from tests.workflows.registry import ProcessSpec


def _spec() -> ProcessSpec:
    return ProcessSpec(
        id="PTEST",
        title="Синтетический процесс для самотестов харнесса",
        status="planned",
        roles=["admin"],
        layers=["api"],
        chain=[
            {"key": "first", "step": "меняем состояние", "kind": "mutation"},
            {
                "key": "second",
                "step": "читаем коллекцию",
                "kind": "list",
                "positive_control": "содержит элемент 42",
            },
            {"key": "third", "step": "читаем результат обратно", "kind": "readback"},
        ],
        tests={},
    )


async def _ok(value="ответ"):
    return value


async def test_full_pass_verifies_clean():
    j = Journey(_spec())
    await j.step("first", _ok())
    await j.step("second", _ok())
    j.contains("second", [1, 42], lambda item: item == 42)
    await j.step("third", _ok())
    j.verify()


async def test_unknown_link_key_is_rejected():
    j = Journey(_spec())
    pending = _ok()
    with pytest.raises(KeyError, match="unknown"):
        await j.step("unknown", pending)
    pending.close()  # звено отвергнуто до await — корутину закрываем сами


async def test_skipped_link_is_caught():
    j = Journey(_spec())
    await j.step("first", _ok())
    await j.step("second", _ok())
    j.contains("second", [42], lambda item: item == 42)
    with pytest.raises(JourneyViolation, match="цепочка пройдена"):
        j.verify()


async def test_wrong_order_is_caught():
    j = Journey(_spec())
    await j.step("second", _ok())
    j.contains("second", [42], lambda item: item == 42)
    await j.step("first", _ok())
    await j.step("third", _ok())
    with pytest.raises(JourneyViolation, match="реестр требует"):
        j.verify()


async def test_repeated_link_is_rejected():
    j = Journey(_spec())
    await j.step("first", _ok())
    pending = _ok()
    with pytest.raises(JourneyViolation, match="пройдено повторно"):
        await j.step("first", pending)
    pending.close()


async def test_list_link_without_positive_control_is_caught():
    j = Journey(_spec())
    await j.step("first", _ok())
    await j.step("second", _ok())
    await j.step("third", _ok())
    with pytest.raises(JourneyViolation, match="без положительного контроля"):
        j.verify()


async def test_empty_collection_fails_with_control_text_in_message():
    """Пустая коллекция отдаётся с кодом 200 — ловит её только контроль."""
    j = Journey(_spec())
    await j.step("first", _ok())
    await j.step("second", _ok())
    with pytest.raises(JourneyViolation, match="содержит элемент 42"):
        j.contains("second", [], lambda item: item == 42)


async def test_contains_on_non_list_link_is_rejected():
    j = Journey(_spec())
    await j.step("first", _ok())
    with pytest.raises(JourneyViolation, match="kind=mutation"):
        j.contains("first", [1], lambda item: True)


async def test_contains_before_step_is_rejected():
    j = Journey(_spec())
    await j.step("first", _ok())
    with pytest.raises(JourneyViolation, match="до step"):
        j.contains("second", [42], lambda item: item == 42)
