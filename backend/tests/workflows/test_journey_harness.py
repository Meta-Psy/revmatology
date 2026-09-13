"""Самотесты харнесса.

Гейт «у процесса есть привязанный тест» дыру не закрывает: тест может
существовать и быть зелёным на сломанном поведении, проверяя наличие ключей
вместо содержимого. Эти тесты доказывают, что харнесс такой прогон не пропустит.
"""

from contextlib import contextmanager
from types import SimpleNamespace

import pytest

from tests.workflows.conftest import Journey, JourneyViolation
from tests.workflows.conftest import journey as journey_fixture
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
    await j.step("first", _ok)
    await j.step("second", _ok)
    j.contains("second", [1, 42], lambda item: item == 42)
    await j.step("third", _ok)
    j.verify()


async def test_unknown_link_key_is_rejected():
    j = Journey(_spec())
    with pytest.raises(KeyError, match="unknown"):
        await j.step("unknown", _ok)


async def test_skipped_link_is_caught():
    j = Journey(_spec())
    await j.step("first", _ok)
    await j.step("second", _ok)
    j.contains("second", [42], lambda item: item == 42)
    with pytest.raises(JourneyViolation, match="цепочка пройдена"):
        j.verify()


async def test_wrong_order_is_caught():
    j = Journey(_spec())
    await j.step("second", _ok)
    j.contains("second", [42], lambda item: item == 42)
    await j.step("first", _ok)
    await j.step("third", _ok)
    with pytest.raises(JourneyViolation, match="реестр требует"):
        j.verify()


async def test_repeated_link_is_rejected():
    j = Journey(_spec())
    await j.step("first", _ok)
    with pytest.raises(JourneyViolation, match="пройдено повторно"):
        await j.step("first", _ok)


async def test_list_link_without_positive_control_is_caught():
    j = Journey(_spec())
    await j.step("first", _ok)
    await j.step("second", _ok)
    await j.step("third", _ok)
    with pytest.raises(JourneyViolation, match="без положительного контроля"):
        j.verify()


async def test_empty_collection_fails_with_control_text_in_message():
    """Пустая коллекция отдаётся с кодом 200 — ловит её только контроль."""
    j = Journey(_spec())
    await j.step("first", _ok)
    await j.step("second", _ok)
    with pytest.raises(JourneyViolation, match="содержит элемент 42"):
        j.contains("second", [], lambda item: item == 42)


async def test_contains_on_non_list_link_is_rejected():
    j = Journey(_spec())
    await j.step("first", _ok)
    with pytest.raises(JourneyViolation, match="kind=mutation"):
        j.contains("first", [1], lambda item: True)


async def test_contains_before_step_is_rejected():
    j = Journey(_spec())
    await j.step("first", _ok)
    with pytest.raises(JourneyViolation, match="до step"):
        j.contains("second", [42], lambda item: item == 42)


# ==================== teardown: харнесс не заслоняет чужую причину ====================
# Фикстура `journey` гоняется вручную (setup → тело → teardown): так проверяется
# настоящий финализатор, а не его пересказ. `rep_call` подделываем — от отчёта
# нужны только флаги passed/failed/skipped.


def _report(*, passed=False, failed=False, skipped=False):
    return SimpleNamespace(passed=passed, failed=failed, skipped=skipped, when="call")


@contextmanager
def _fixture_run(node):
    """Прогон фикстуры `journey` вокруг тела теста с заданным узлом."""
    gen = journey_fixture.__wrapped__(SimpleNamespace(node=SimpleNamespace(**node)))
    yield next(gen)
    next(gen, None)  # teardown: StopIteration гасим, JourneyViolation — нет


@pytest.fixture
def synthetic_process(monkeypatch):
    """Фикстура строит прогон по синтетическому процессу, а не по реестру."""
    monkeypatch.setattr("tests.workflows.conftest.get_process", lambda _id: _spec())


@pytest.mark.usefixtures("synthetic_process")
async def test_setup_error_does_not_add_teardown_violation():
    """Фикстура упала в setup — `rep_call` не существует, тело не выполнялось."""
    with _fixture_run({}) as make:
        make("PTEST")  # ни одного звена не пройдено


@pytest.mark.usefixtures("synthetic_process")
async def test_skipped_test_does_not_add_teardown_violation():
    """Тело вызвало pytest.skip() — цепочка оборвана намеренно."""
    with _fixture_run({"rep_call": _report(skipped=True)}) as make:
        make("PTEST")


@pytest.mark.usefixtures("synthetic_process")
async def test_failed_test_does_not_add_teardown_violation():
    with _fixture_run({"rep_call": _report(failed=True)}) as make:
        make("PTEST")


@pytest.mark.usefixtures("synthetic_process")
async def test_incomplete_chain_on_passing_test_still_raises():
    """Обратный контроль: молчать на teardown можно не всегда."""
    with pytest.raises(JourneyViolation, match="цепочка пройдена"):
        with _fixture_run({"rep_call": _report(passed=True)}) as make:
            make("PTEST")


async def test_rejected_step_never_invokes_the_call():
    """Смысл замыкания: отвергнутое звено не доходит до запроса."""
    j = Journey(_spec())
    calls = []

    with pytest.raises(KeyError, match="unknown"):
        await j.step("unknown", lambda: calls.append("вызвано"))
    assert calls == [], "звено отвергнуто, а вызов всё-таки произошёл"


async def test_step_accepts_a_plain_return_value():
    """Не всякое звено асинхронно — синхронный результат тоже проходит."""
    j = Journey(_spec())
    assert await j.step("first", lambda: 42) == 42
