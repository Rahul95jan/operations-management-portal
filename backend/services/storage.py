import os
import uuid
from pathlib import Path

# Local-disk storage for development, mirroring the existing pdfs/ pattern.
# Swap the body of save_file() for an S3/Cloudinary/etc. client later —
# callers only depend on the returned dict shape, never on how/where it's stored.

BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIR = os.getenv("RESOURCE_UPLOAD_DIR", "uploads/resources")


def _resolve_upload_dir() -> Path:
    if os.path.isabs(UPLOAD_DIR):
        return Path(UPLOAD_DIR)
    return (BASE_DIR / UPLOAD_DIR).resolve()


def save_file(upload_file) -> dict:
    target_dir = _resolve_upload_dir()
    target_dir.mkdir(parents=True, exist_ok=True)

    ext = Path(upload_file.filename).suffix
    stored_name = f"{uuid.uuid4().hex}{ext}"
    dest_path = target_dir / stored_name

    contents = upload_file.file.read()

    with open(dest_path, "wb") as f:
        f.write(contents)

    return {
        "file_path": str(dest_path),
        "file_name": upload_file.filename,
        "file_size": len(contents),
        "mime_type": upload_file.content_type,
    }


def resolve_path(file_path: str) -> str:
    if not file_path:
        return file_path
    path = Path(file_path)
    if path.is_absolute():
        return str(path)
    return str((BASE_DIR / path).resolve())
