# Standard resource requirements auto-created when a session is marked
# Completed (see _ensure_default_requirements in main.py). Deliberately small —
# ops can still add more via POST /resource-requirements, and a mentor can
# submit extra ad-hoc resources regardless of what's required.
DEFAULT_REQUIREMENTS = [
    {"resource_category": "session_notes", "resource_type": "pdf", "resource_name": "Session Notes"},
    {"resource_category": "code_notebook", "resource_type": "github", "resource_name": "Code / Notebook"},
]
