from __future__ import annotations

import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


def _load_env_file() -> None:
    candidates = [
        Path(__file__).resolve().parents[2] / ".env",
        Path.cwd() / ".env",
    ]

    for env_path in candidates:
        if not env_path.exists():
            continue

        for raw_line in env_path.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue

            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


_load_env_file()


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _normalize_email(email: str) -> str:
    return email.strip().lower()


class AuthStore:
    def __init__(self) -> None:
        self._mode = "memory"
        self._memory: dict[str, dict[str, Any]] = {}
        self._container = None

        endpoint = os.getenv("COSMOS_ENDPOINT", "").strip()
        key = os.getenv("COSMOS_KEY", "").strip()
        database_name = os.getenv("COSMOS_DATABASE", "hireflow-ai").strip()
        container_name = os.getenv("COSMOS_CONTAINER", "accounts").strip()
        partition_key_path = os.getenv("COSMOS_PARTITION_KEY_PATH", "/a3189094").strip() or "/a3189094"
        self._partition_key_path = partition_key_path
        self._partition_key_name = partition_key_path.lstrip("/")

        if not endpoint or not key:
            return

        try:
            from azure.cosmos import CosmosClient, PartitionKey
        except Exception:
            return

        client = CosmosClient(endpoint, credential=key)
        database = client.create_database_if_not_exists(id=database_name)
        self._container = database.create_container_if_not_exists(
            id=container_name,
            partition_key=PartitionKey(path=partition_key_path),
            offer_throughput=400,
        )
        self._mode = "cosmos"

    def _partition_value(self, email: str, payload: dict[str, Any] | None = None) -> str:
        if payload is not None:
            value = payload.get(self._partition_key_name, "")
            if value:
                return str(value)
        return email

    def get_account(self, email: str) -> dict[str, Any] | None:
        normalized = _normalize_email(email)

        if self._mode == "cosmos" and self._container is not None:
            try:
                query = "SELECT * FROM c WHERE c.email = @email"
                items = list(
                    self._container.query_items(
                        query=query,
                        parameters=[{"name": "@email", "value": normalized}],
                        partition_key=self._partition_value(normalized),
                    )
                )
                if items:
                    return items[0]
            except Exception:
                return None

        return self._memory.get(normalized)

    def login_account(self, email: str, password: str) -> dict[str, Any] | None:
        normalized = _normalize_email(email)
        account = self.get_account(normalized)

        if not account:
            return None

        stored_password = str(account.get("password", "")).strip()
        if not stored_password or stored_password != password.strip():
            return None

        return account

    def upsert_account(self, payload: dict[str, Any]) -> dict[str, Any]:
        email = _normalize_email(str(payload.get("email", "")))
        existing = self.get_account(email)
        now = _utc_now()
        partition_value = self._partition_value(email, payload)
        account = {
            "id": email,
            "email": email,
            "display_name": str(payload.get("display_name", "")).strip(),
            "role": str(payload.get("role", "")).strip().lower(),
            "password": str(payload.get("password", "")).strip(),
            "provider": str(payload.get("provider", "google")).strip().lower(),
            "firebase_uid": str(payload.get("firebase_uid", "")).strip(),
            self._partition_key_name: partition_value,
            "created_at": existing.get("created_at", now) if existing else now,
            "updated_at": now,
        }

        if existing and not account["display_name"]:
            account["display_name"] = existing.get("display_name", "")
        if existing and not account["firebase_uid"]:
            account["firebase_uid"] = existing.get("firebase_uid", "")
        if existing and not account["role"]:
            account["role"] = existing.get("role", "")
        if existing and not account["password"]:
            account["password"] = existing.get("password", "")

        if self._mode == "cosmos" and self._container is not None:
            self._container.upsert_item(account)
        else:
            self._memory[email] = account

        return account


auth_store = AuthStore()
