"""
Turns an uploaded resume into skill suggestions. Everything here is pure
(no web or database code) so it can be tested on its own. The resume text is
only held in memory for the duration of a request - it is never stored.

PDF text comes from pypdf (first pages only, capped length). DOCX text is
read straight out of the file's XML with a regular expression, so no XML
parser (and no zip-bomb or entity-expansion risk) is involved.
"""

import html
import re
import zipfile
from collections.abc import Iterable, Mapping
from io import BytesIO
from typing import NamedTuple

MAX_PDF_PAGES = 15
MAX_TEXT_CHARS = 200_000
MAX_DOCX_XML_BYTES = 20 * 1024 * 1024
MAX_SUGGESTIONS = 40
MIN_CATALOG_USERS = 2
MIN_CATALOG_NAME_LENGTH = 3


class ResumeTextError(Exception):
    def __init__(self, message: str):
        super().__init__(message)
        self.message = message


class VocabEntry(NamedTuple):
    name: str
    terms: tuple[str, ...]
    case_sensitive: bool


def _pdf_text(content: bytes) -> str:
    try:
        from pypdf import PdfReader
    except ImportError as exc:
        raise ResumeTextError("PDF scanning is not available on this server.") from exc

    reader = PdfReader(BytesIO(content))
    if reader.is_encrypted:
        # Many PDFs are "encrypted" with an empty password; anything else cannot be read.
        if int(reader.decrypt("")) == 0:
            raise ResumeTextError("This PDF is password protected, so it cannot be scanned.")

    parts: list[str] = []
    total = 0
    for page in reader.pages[:MAX_PDF_PAGES]:
        text = page.extract_text() or ""
        parts.append(text)
        total += len(text)
        if total >= MAX_TEXT_CHARS:
            break
    return "\n".join(parts)[:MAX_TEXT_CHARS]


def _docx_text(content: bytes) -> str:
    with zipfile.ZipFile(BytesIO(content)) as archive:
        info = archive.getinfo("word/document.xml")
        if info.file_size > MAX_DOCX_XML_BYTES:
            raise ResumeTextError("This document is too large to scan.")
        xml = archive.read("word/document.xml").decode("utf-8", errors="ignore")

    # Mark paragraph and table-cell ends with a text node so words never run together.
    xml = xml.replace("</w:p>", "</w:p><w:t>\n</w:t>").replace("</w:tc>", "</w:tc><w:t> </w:t>")
    pieces = re.findall(r"<w:t(?:\s[^>]*)?>([^<]*)</w:t>", xml)
    return html.unescape("".join(pieces))[:MAX_TEXT_CHARS]


def extract_text(extension: str, content: bytes) -> str:
    try:
        if extension == ".pdf":
            return _pdf_text(content)
        if extension == ".docx":
            return _docx_text(content)
    except ResumeTextError:
        raise
    except Exception as exc:
        raise ResumeTextError("We could not read text from this file.") from exc
    raise ResumeTextError("Only PDF and DOCX resumes can be scanned.")


def build_vocabulary(
    builtin: Mapping[str, tuple[str, ...]],
    case_sensitive: Iterable[str],
    catalog_names: Iterable[str],
    popular_names: Iterable[str],
) -> list[VocabEntry]:
    """
    Built-in skills, shown with the company catalog's own spelling when the
    catalog has one ("react" in the catalog becomes the suggestion "react"),
    plus catalog skills that at least MIN_CATALOG_USERS employees already
    have. A skill only one person typed in is not trusted as vocabulary.
    """
    spelling = {name.lower(): name for name in catalog_names}
    sensitive = set(case_sensitive)

    entries: list[VocabEntry] = []
    known_terms: set[str] = set()
    used_names: set[str] = set()
    for canonical, aliases in builtin.items():
        display = spelling.get(canonical.lower(), canonical)
        entries.append(VocabEntry(display, (canonical, *aliases), canonical in sensitive))
        used_names.add(display.lower())
        known_terms.update(t.lower() for t in (canonical, *aliases))

    for name in popular_names:
        key = name.lower()
        if len(name) >= MIN_CATALOG_NAME_LENGTH and key not in known_terms and key not in used_names:
            entries.append(VocabEntry(name, (name,), False))
            used_names.add(key)
    return entries


def compile_vocabulary(entries: Iterable[VocabEntry]) -> list[tuple[str, re.Pattern[str]]]:
    # A match must not touch a letter, digit, "+", "#" or "." on its left, nor a
    # letter, digit, "+" or "#" on its right. That keeps "Java" out of
    # "JavaScript", "SQL" out of "MySQL", ".NET" out of "ASP.NET" and "JS" out
    # of "Node.js", while still matching "Python," or "C++." at a sentence end.
    compiled = []
    for entry in entries:
        alternation = "|".join(sorted((re.escape(t) for t in entry.terms), key=len, reverse=True))
        flags = 0 if entry.case_sensitive else re.IGNORECASE
        pattern = re.compile(rf"(?<![A-Za-z0-9+#.])(?:{alternation})(?![A-Za-z0-9+#])", flags)
        compiled.append((entry.name, pattern))
    return compiled


def find_skills(text: str, compiled: list[tuple[str, re.Pattern[str]]]) -> list[tuple[str, int]]:
    """
    Return (skill, mentions) for every skill found, most-mentioned first.

    A match that sits entirely inside a longer match of another skill is not
    counted on its own: "Tally ERP 9" counts for Tally (not also ERP), and
    "GitHub Actions" counts for GitHub Actions (not also GitHub). If the
    shorter skill is written elsewhere by itself, it still counts there.
    """
    spans: list[tuple[int, int, str]] = []
    for name, pattern in compiled:
        for match in pattern.finditer(text):
            spans.append((match.start(), match.end(), name))
    spans.sort(key=lambda s: (-(s[1] - s[0]), s[0]))

    covered = bytearray(len(text))
    counts: dict[str, int] = {}
    for start, end, name in spans:
        if covered.find(0, start, end) == -1:  # no uncovered character: already inside a longer match
            continue
        covered[start:end] = b"\x01" * (end - start)
        counts[name] = counts.get(name, 0) + 1

    return sorted(counts.items(), key=lambda item: (-item[1], item[0].lower()))