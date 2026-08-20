import os
import uuid
from pathlib import Path

# Local-disk storage for development, mirroring the existing pdfs/ pattern.
# Swap the body of save_file() for an S3/Cloudinary/etc. client later —
# callers only depend on the returned dict shape, never on how/where it's stored.

UPLOAD_DIR = os.getenv("RESOURCE_UPLOAD_DIR", "uploads/resources")


def save_file(upload_file) -> dict:
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    ext = Path(upload_file.filename).suffix
    stored_name = f"{uuid.uuid4().hex}{ext}"
    dest_path = os.path.join(UPLOAD_DIR, stored_name)

    contents = upload_file.file.read()

    with open(dest_path, "wb") as f:
        f.write(contents)

    return {
        "file_path": dest_path,
        "file_name": upload_file.filename,
        "file_size": len(contents),
        "mime_type": upload_file.content_type,
    }


def resolve_path(file_path: str) -> str:
    return file_path
