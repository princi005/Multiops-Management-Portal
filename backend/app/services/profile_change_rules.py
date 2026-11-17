"""
Validation for profile change requests (no web or database imports, so it is
easy to test on its own). A request is either a name/phone change (checked
strictly, applied automatically on approval) or free text that HR handles by
hand.
"""

import re
import unicodedata

CHANGEABLE_FIELDS = ("full_name", "phone", "general")

GENERAL_MIN, GENERAL_MAX = 5, 1000
MAX_PENDING_GENERAL = 5
_CONTROL_CHARS = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")

_NAME_EXTRA = set(" .'-\u2019")
_PHONE_PATTERN = re.compile(r"^\+?[0-9 ()\-]+$")


class ChangeValueError(ValueError):
    pass


def _clean_name(value: str) -> str:
    if not 2 <= len(value) <= 100:
        raise ChangeValueError("Name must be between 2 and 100 characters.")
    if not value[0].isalpha():
        raise ChangeValueError("Name must start with a letter.")
    for ch in value:
        # Letters in any language, the marks that attach to them (for example
        # Hindi vowel signs), spaces, apostrophes, hyphens and full stops.
        if ch.isalpha() or ch in _NAME_EXTRA or unicodedata.category(ch).startswith("M"):
            continue
        raise ChangeValueError("Name can only contain letters, spaces, apostrophes, hyphens and full stops.")
    return value


def _clean_phone(value: str) -> str:
    if not _PHONE_PATTERN.match(value):
        raise ChangeValueError("Phone can only contain digits, spaces, hyphens, brackets and a leading +.")
    digits = re.sub(r"[^0-9]", "", value)
    if not 7 <= len(digits) <= 15:
        raise ChangeValueError("Phone number must have 7 to 15 digits.")
    if len(value) > 20:
        raise ChangeValueError("Phone number is too long.")
    return value


def _clean_general(raw: str) -> str:
    """Free text: keeps line breaks, drops control characters and runaway blank lines."""
    value = raw.replace("\r\n", "\n").replace("\r", "\n")
    value = _CONTROL_CHARS.sub("", value)
    value = "\n".join(line.rstrip() for line in value.split("\n")).strip()
    value = re.sub(r"\n{3,}", "\n\n", value)
    if len(value) < GENERAL_MIN:
        raise ChangeValueError(f"Please describe the change in at least {GENERAL_MIN} characters.")
    if len(value) > GENERAL_MAX:
        raise ChangeValueError(f"Please keep the request under {GENERAL_MAX} characters.")
    return value


def normalize_value(field: str, raw: str) -> str:
    """Return the cleaned value to store, or raise ChangeValueError with a message for the user."""
    if field == "general":
        return _clean_general(raw)
    value = " ".join(raw.split())
    if field == "full_name":
        return _clean_name(value)
    if field == "phone":
        return _clean_phone(value)
    raise ChangeValueError("This field cannot be changed.")