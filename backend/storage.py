from pathlib import Path
import secrets

from .config import settings


def save_upload(file_obj, suffix: str = ".png") -> Path:
    suffix = suffix if suffix.startswith(".") else "." + suffix
    safe_suffix = suffix.lower()[:10] if suffix else ".png"
    path = settings.upload_dir / (secrets.token_hex(16) + safe_suffix)
    with path.open("wb") as output:
        while True:
            chunk = file_obj.read(1024 * 1024)
            if not chunk:
                break
            output.write(chunk)
    return path
