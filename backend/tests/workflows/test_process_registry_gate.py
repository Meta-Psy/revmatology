"""Гейт покрытия реестра сквозных процессов.

Красный гейт означает одно из двух: процесс остался без прогона, или реестр
разошёлся с кодом. Оба случая требуют правки, а не отключения гейта.
"""

import ast

import pytest
import yaml

from tests.workflows.registry import (
    LAYERS,
    REGISTRY_PATH,
    REPO_ROOT,
    ChainLink,
    load_registry,
)

WORKFLOW_TEST_DIR = "backend/tests/workflows"
# Служебные файлы пакета прогонов — они не являются прогонами процессов.
NON_PROCESS_FILES = {
    "__init__.py",
    "conftest.py",
    "registry.py",
    "test_journey_harness.py",
    "test_process_registry_gate.py",
}


def test_registry_file_exists():
    assert REGISTRY_PATH.is_file(), f"реестра нет по пути {REGISTRY_PATH}"


def test_registry_parses_and_is_not_empty():
    assert load_registry(), "реестр разобрался, но пуст"


def test_process_ids_are_unique():
    raw = yaml.safe_load(REGISTRY_PATH.read_text(encoding="utf-8"))
    ids = [entry["id"] for entry in raw]
    assert len(ids) == len(set(ids)), f"дубли id в реестре: {ids}"


def test_declared_layers_are_known():
    for spec in load_registry().values():
        unknown = set(spec.layers) - set(LAYERS)
        assert not unknown, f"{spec.id}: неизвестные слои {sorted(unknown)}"


def test_active_process_declares_a_test_for_every_layer():
    for spec in load_registry().values():
        if spec.status != "active":
            continue
        assert set(spec.tests) == set(spec.layers), (
            f"{spec.id}: слои {spec.layers}, а прогоны объявлены для {sorted(spec.tests)}"
        )


def test_every_declared_test_path_exists():
    for spec in load_registry().values():
        for layer, ref in spec.tests.items():
            path = REPO_ROOT / ref.split("::")[0]
            assert path.is_file(), f"{spec.id}/{layer}: файла {path} нет"


def test_declared_test_functions_exist_in_their_files():
    """Проверяем разбором AST, а не запуском pytest внутри pytest."""
    for spec in load_registry().values():
        for layer, ref in spec.tests.items():
            file_ref, _, node = ref.partition("::")
            assert node, f"{spec.id}/{layer}: в пути нет узла после '::'"
            source = (REPO_ROOT / file_ref).read_text(encoding="utf-8")
            names = {
                n.name
                for n in ast.walk(ast.parse(source))
                if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef))
            }
            assert node in names, f"{spec.id}/{layer}: в {file_ref} нет функции {node}"


def test_touched_paths_exist():
    """Реестр указывает на живой код, а не на файлы, которых больше нет."""
    for spec in load_registry().values():
        for ref in spec.touches:
            assert (REPO_ROOT / ref).exists(), f"{spec.id}: touches указывает на несуществующий {ref}"


def test_list_links_require_positive_control():
    """Правило кодифицировано в модели — проверяем, что модель его правда держит."""
    with pytest.raises(ValueError, match="positive_control"):
        ChainLink(key="k", step="s", kind="list")


def test_no_orphan_workflow_test_files():
    referenced = {ref.split("::")[0] for spec in load_registry().values() for ref in spec.tests.values()}
    directory = REPO_ROOT / WORKFLOW_TEST_DIR
    for path in directory.iterdir():
        if not path.is_file() or path.name in NON_PROCESS_FILES:
            continue
        rel = path.relative_to(REPO_ROOT).as_posix()
        assert rel in referenced, f"{rel} не упомянут ни в одном процессе реестра"
