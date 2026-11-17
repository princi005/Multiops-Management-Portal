"""
Pure validation helpers for resume uploads (no web or database imports, so
they are easy to test on their own). The client's claimed content type is
never trusted: the file's extension AND its leading bytes must agree.
"""

import re
import zipfile
from io import BytesIO
from pathlib import Path

MAX_RESUME_BYTES = 5 * 1024 * 1024

ALLOWED_TYPES = {
    ".pdf": "application/pdf",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}


class ResumeFileError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def clean_filename(raw: str | None) -> str:
    """Keep only the last path component, drop control characters, cap the length."""
    name = Path((raw or "").replace("\\", "/")).name
    name = re.sub(r"[\x00-\x1f\x7f]", "", name).strip()
    return name[:255]


def validate_resume(filename: str, content: bytes) -> str:
    """Return the file extension (".pdf" or ".docx") or raise ResumeFileError."""
    if not content:
        raise ResumeFileError("The uploaded file is empty.")
    if len(content) > MAX_RESUME_BYTES:
        raise ResumeFileError("Resume must be 5 MB or smaller.", status_code=413)

    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_TYPES:
        raise ResumeFileError("Only PDF and DOCX resumes are supported.")

    if ext == ".pdf":
        if not content.startswith(b"%PDF-"):
            raise ResumeFileError("This file does not look like a valid PDF.")
    else:
        try:
            with zipfile.ZipFile(BytesIO(content)) as archive:
                if "word/document.xml" not in archive.namelist():
                    raise ValueError("not a Word document")
        except (zipfile.BadZipFile, ValueError):
            raise ResumeFileError("This file does not look like a valid DOCX document.")

    return ext