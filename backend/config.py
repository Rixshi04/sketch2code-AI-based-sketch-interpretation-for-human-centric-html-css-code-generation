import os
from dataclasses import dataclass
from pathlib import Path


def _bool(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _origins() -> list[str]:
    raw = os.getenv("BACKEND_CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
    return [item.strip() for item in raw.split(",") if item.strip()]


@dataclass(frozen=True)
class Settings:
    app_name: str = os.getenv("APP_NAME", "SketchMaster ML Backend")
    api_prefix: str = os.getenv("API_PREFIX", "/api")
    debug: bool = _bool("DEBUG", False)
    jwt_secret: str = os.getenv("JWT_SECRET", os.getenv("NEXTAUTH_SECRET", "change-me-in-development"))
    jwt_expire_minutes: int = int(os.getenv("JWT_EXPIRE_MINUTES", "1440"))
    pipeline_timeout_seconds: float = float(os.getenv("PIPELINE_TIMEOUT_SECONDS", "28"))
    backend_cors_origins: list[str] = None  # type: ignore[assignment]
    upload_dir: Path = Path(os.getenv("UPLOAD_DIR", "uploads"))

    def __post_init__(self):
        if self.backend_cors_origins is None:
            object.__setattr__(self, "backend_cors_origins", _origins())
        self.upload_dir.mkdir(parents=True, exist_ok=True)


settings = Settings()
