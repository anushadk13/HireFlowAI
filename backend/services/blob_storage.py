from __future__ import annotations

import logging
import os
import re
import uuid
from datetime import datetime, timezone
from typing import Any

logger = logging.getLogger(__name__)

_SAFE_NAME_PATTERN = re.compile(r"[^A-Za-z0-9._-]+")


def _safe_filename(filename: str) -> str:
    name = _SAFE_NAME_PATTERN.sub("_", filename or "resume").strip("_") or "resume"
    return name[:150]


class ResumeBlobStorage:
    def __init__(self) -> None:
        self._client = None
        self._container_name = os.getenv("AZURE_STORAGE_CONTAINER", "resumes").strip() or "resumes"
        self._enabled = False

        connection_string = os.getenv("AZURE_STORAGE_CONNECTION_STRING", "").strip()
        if not connection_string:
            return

        try:
            from azure.storage.blob import BlobServiceClient
        except Exception:
            logger.warning("azure-storage-blob is not installed; resume blob storage is disabled.")
            return

        try:
            service_client = BlobServiceClient.from_connection_string(connection_string)
            container_client = service_client.get_container_client(self._container_name)
            if not container_client.exists():
                container_client.create_container()
            self._client = container_client
            self._enabled = True
        except Exception as exc:  # noqa: BLE001 - storage must never block resume upload
            logger.warning("Failed to initialize Azure Blob Storage; resume blob storage is disabled: %s", exc)
            self._client = None

    @property
    def enabled(self) -> bool:
        return self._enabled

    def upload_resume(self, filename: str, content: bytes, content_type: str = "") -> dict[str, Any] | None:
        if not self._enabled or self._client is None:
            return None

        timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        blob_name = f"{timestamp}_{uuid.uuid4().hex[:8]}_{_safe_filename(filename)}"

        try:
            from azure.storage.blob import ContentSettings

            blob_client = self._client.get_blob_client(blob_name)
            blob_client.upload_blob(
                content,
                overwrite=False,
                content_settings=ContentSettings(content_type=content_type or "application/octet-stream"),
            )
            return {"blob_name": blob_name, "container": self._container_name, "url": blob_client.url}
        except Exception as exc:  # noqa: BLE001 - storage must never block resume upload
            logger.warning("Failed to upload resume to Azure Blob Storage: %s", exc)
            return None


resume_blob_storage = ResumeBlobStorage()
