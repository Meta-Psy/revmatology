"""Харнесс сквозных прогонов: сверяет прогон с реестром во время выполнения.

Правило голой базы: прогон строит состояние только через HTTP — фикстурой
`client`. ORM-фабрики из корневого conftest (`congress`, `make_day`,
`make_section`) здесь запрещены: состояние, собранное в обход API, скрывает
ровно те дефекты, ради которых слой и заводился.
"""

from __future__ import annotations

import inspect
from collections.abc import Callable, Iterable
from typing import Any

import pytest

from tests.workflows.registry import ProcessSpec, get_process


class JourneyViolation(AssertionError):
    """Прогон разошёлся с реестром."""


class Journey:
    """Обёртка над одним сквозным прогоном.

    `step` отмечает пройденное звено, `contains` — выполненный положительный
    контроль, `verify` на teardown требует, чтобы цепочка была пройдена целиком
    и в объявленном порядке, а каждое звено kind=list получило контроль.
    """

    def __init__(self, spec: ProcessSpec) -> None:
        self.spec = spec
        self._visited: list[str] = []
        self._controlled: set[str] = set()

    async def step(self, key: str, call: Callable[[], Any]) -> Any:
        """Отметить звено и выполнить его вызов: `await j.step(key, lambda: client.get(...))`.

        Вызов передаётся замыканием, а не готовым awaitable: отвергнутое звено
        тогда вообще не доходит до запроса и не оставляет незавершённой корутины.
        """
        self.spec.link(key)  # KeyError, если звена нет в реестре
        if key in self._visited:
            raise JourneyViolation(f"{self.spec.id}: звено {key!r} пройдено повторно")
        result = call()
        if inspect.isawaitable(result):
            result = await result
        self._visited.append(key)
        return result

    def contains(
        self,
        key: str,
        collection: Iterable[Any],
        predicate: Callable[[Any], bool],
    ) -> Any:
        link = self.spec.link(key)
        if link.kind != "list":
            raise JourneyViolation(
                f"{self.spec.id}: contains() вызван на звене {key!r} с kind={link.kind}; "
                "положительный контроль имеет смысл только для звеньев kind=list"
            )
        if key not in self._visited:
            raise JourneyViolation(f"{self.spec.id}: contains() вызван до step() на звене {key!r}")

        items = list(collection)
        matched = [item for item in items if predicate(item)]
        if not matched:
            raise JourneyViolation(
                f"{self.spec.id}, звено {key!r}: положительный контроль не выполнен — "
                f"ожидалось «{link.positive_control}», в коллекции элементов: {len(items)}"
            )
        self._controlled.add(key)
        return matched[0]

    def verify(self) -> None:
        if self._visited != self.spec.expected_keys:
            raise JourneyViolation(
                f"{self.spec.id}: цепочка пройдена как {self._visited}, "
                f"реестр требует {self.spec.expected_keys}"
            )
        missing = self.spec.list_keys - self._controlled
        if missing:
            raise JourneyViolation(
                f"{self.spec.id}: звенья kind=list без положительного контроля: {sorted(missing)}"
            )


@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_makereport(item, call):
    """Запоминаем отчёт фазы, чтобы не заслонять исходное падение теста."""
    outcome = yield
    report = outcome.get_result()
    setattr(item, f"rep_{report.when}", report)


@pytest.fixture
def journey(request):
    """Фабрика прогонов: `j = journey("P-01")`."""
    created: list[Journey] = []

    def _make(process_id: str) -> Journey:
        instance = Journey(get_process(process_id))
        created.append(instance)
        return instance

    yield _make

    call_report = getattr(request.node, "rep_call", None)
    if call_report is None or not call_report.passed:
        # Отчёта нет — тело теста не выполнялось (упала фикстура в setup).
        # Отчёт не passed — тест упал по своей причине либо был пропущен.
        # Цепочка оборвана не по вине прогона, и жалоба харнесса заслонила бы
        # настоящую причину.
        return
    for instance in created:
        instance.verify()
