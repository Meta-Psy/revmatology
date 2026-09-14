"""Загрузка и валидация машинного реестра сквозных процессов.

Реестр живёт в `_specs/processes.yaml`. Схема — один в один с Mentis
(`mentis.uz/_specs/processes.yaml`), дизайн описан в
`Mentis/mentis.uz/_specs/2026-08-13-workflow-testing-design.md`.
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

import yaml
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

# backend/tests/workflows/registry.py -> parents[3] == корень репозитория
REPO_ROOT = Path(__file__).resolve().parents[3]
REGISTRY_PATH = REPO_ROOT / "_specs" / "processes.yaml"

LAYERS = ("api", "browser")
KINDS = ("mutation", "list", "readback")
STATUSES = ("active", "planned", "retired")


class ChainLink(BaseModel):
    """Одно звено сквозной цепочки."""

    model_config = ConfigDict(extra="forbid")

    key: str = Field(..., min_length=1)
    step: str = Field(..., min_length=1)
    kind: str
    positive_control: str | None = None

    @field_validator("kind")
    @classmethod
    def _kind_is_known(cls, value: str) -> str:
        if value not in KINDS:
            raise ValueError(f"неизвестный kind звена: {value!r}, ожидается один из {KINDS}")
        return value

    @model_validator(mode="after")
    def _list_link_needs_positive_control(self) -> "ChainLink":
        if self.kind == "list" and not (self.positive_control or "").strip():
            raise ValueError(
                f"звено {self.key!r}: kind=list обязано объявить positive_control — "
                "пустая коллекция отдаётся с кодом 200 и иначе не отличается от рабочей"
            )
        return self


class ProcessSpec(BaseModel):
    """Один сквозной процесс."""

    model_config = ConfigDict(extra="forbid")

    id: str = Field(..., min_length=2)
    title: str = Field(..., min_length=1)
    status: str
    roles: list[str] = Field(..., min_length=1)
    layers: list[str] = Field(..., min_length=1)
    chain: list[ChainLink] = Field(..., min_length=1)
    touches: list[str] = Field(default_factory=list)
    tests: dict[str, str] = Field(default_factory=dict)

    @field_validator("status")
    @classmethod
    def _status_is_known(cls, value: str) -> str:
        if value not in STATUSES:
            raise ValueError(f"неизвестный status: {value!r}, ожидается один из {STATUSES}")
        return value

    @model_validator(mode="after")
    def _chain_keys_are_unique(self) -> "ProcessSpec":
        keys = [link.key for link in self.chain]
        if len(keys) != len(set(keys)):
            raise ValueError(f"{self.id}: дубли ключей звеньев {keys}")
        return self

    def link(self, key: str) -> ChainLink:
        for candidate in self.chain:
            if candidate.key == key:
                return candidate
        known = [c.key for c in self.chain]
        raise KeyError(f"{self.id}: звена {key!r} в реестре нет, объявлены {known}")

    @property
    def expected_keys(self) -> list[str]:
        return [link.key for link in self.chain]

    @property
    def list_keys(self) -> set[str]:
        return {link.key for link in self.chain if link.kind == "list"}


@lru_cache(maxsize=1)
def load_registry() -> dict[str, ProcessSpec]:
    """Реестр как отображение id -> ProcessSpec."""
    raw = yaml.safe_load(REGISTRY_PATH.read_text(encoding="utf-8")) or []
    specs = [ProcessSpec.model_validate(entry) for entry in raw]
    return {spec.id: spec for spec in specs}


def get_process(process_id: str) -> ProcessSpec:
    """Процесс по id — с внятной ошибкой вместо голого KeyError."""
    registry = load_registry()
    if process_id not in registry:
        raise KeyError(f"процесса {process_id!r} в реестре нет, объявлены {sorted(registry)}")
    return registry[process_id]
