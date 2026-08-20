import os
import re
import zipfile
from datetime import datetime

LMS_PACKAGE_DIR = os.getenv("LMS_PACKAGE_DIR", "uploads/lms_packages")


def slugify(text):
    text = re.sub(r"[^A-Za-z0-9]+", "_", text or "").strip("_")
    return text or "Resource"


def lms_filename(resource, session=None):
    ext = os.path.splitext(resource.file_name or "")[1]
    batch = slugify(resource.batch_name or (session.batch_name if session else ""))
    title = slugify(resource.resource_title)
    return f"{batch}_{title}{ext}"


def package_filename(session):
    date_slug = slugify(session.session_date or "")
    return f"{slugify(session.topic)}_{slugify(session.batch_name)}_{date_slug}.zip"


def _resource_text_entry(resource):
    lines = [
        "Resource Type:",
        resource.resource_type,
        "",
        "Resource Title:",
        resource.resource_title,
        "",
        "URL:",
        resource.resource_url or "(no URL provided)",
    ]

    if resource.description:
        lines += ["", "Description:", resource.description]

    return "\n".join(lines)


def build_manifest_text(session, resources):
    lines = [
        f"Session: {session.topic}",
        f"Course: {session.course_name}",
        f"Batch: {session.batch_name}",
        f"Mentor: {session.mentor_name}",
        f"Session Date: {session.session_date}",
        "",
        "Resources:",
        "",
    ]

    for i, r in enumerate(resources, start=1):
        lines.append(f"{i}. {r.resource_title}")
        lines.append(f"Type: {r.resource_type}")

        if r.file_name:
            lines.append(f"Submitted: {r.submitted_at}")
        elif r.resource_url:
            lines.append(f"URL: {r.resource_url}")

        lines.append("")

    return "\n".join(lines)


def build_lms_package(db, session_id):
    from models.session import Session as SessionModel
    from models.resource import Resource

    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session:
        return None

    resources = db.query(Resource).filter(Resource.session_id == session_id).all()
    if not resources:
        return None

    os.makedirs(LMS_PACKAGE_DIR, exist_ok=True)
    zip_name = package_filename(session)
    zip_path = os.path.join(LMS_PACKAGE_DIR, f"{session_id}_{datetime.utcnow().timestamp():.0f}.zip")

    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for i, r in enumerate(resources, start=1):
            if r.file_path and os.path.exists(r.file_path):
                ext = os.path.splitext(r.file_name or "")[1]
                arcname = f"{i:02d}_{slugify(r.resource_title)}{ext}"
                zf.write(r.file_path, arcname)
            else:
                arcname = f"{i:02d}_{slugify(r.resource_title)}_{r.resource_type}.txt"
                zf.writestr(arcname, _resource_text_entry(r))

        zf.writestr("resource_manifest.txt", build_manifest_text(session, resources))

    return zip_path, zip_name
