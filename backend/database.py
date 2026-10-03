from pathlib import Path
import os

from sqlmodel import SQLModel, Session, create_engine


def _database_url() -> str:
    raw = os.getenv("BACKEND_DATABASE_URL", os.getenv("DATABASE_URL", "sqlite:///./prisma/dev.db"))
    if raw.startswith("file:"):
        raw = raw[5:]
        if raw.startswith("./"):
            raw = raw[2:]
        path = Path(raw)
        path.parent.mkdir(parents=True, exist_ok=True)
        return "sqlite:///" + path.as_posix()
    if raw.startswith("sqlite:///"):
        Path(raw.replace("sqlite:///", "", 1)).parent.mkdir(parents=True, exist_ok=True)
    return raw


DATABASE_URL = _database_url()
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)


def init_db() -> None:
    from .models import User, Page, SessionToken  # noqa: F401
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
