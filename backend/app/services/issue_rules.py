"""
Validation and status rules for employee issues (no web or database imports,
so they are easy to test on their own).

Life of an issue:  open -> in_progress -> resolved
An employee can withdraw an issue while it is open or in progress. Resolved
and withdrawn issues are final.
"""

import re

MAX_OPEN_ISSUES = 10
SUBJECT_MIN, SUBJECT_MAX = 3, 150
DESCRIPTION_MIN, DESCRIPTION_MAX = 10, 2000
RESPONSE_MIN, RESPONSE_MAX = 3, 1000

_CONTROL_CHARS = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")

# What Accounts may move an issue to, from each current status.
_RESPOND_TRANSITIONS = {
    "open": {"in_progress", "resolved"},
    "in_progress": {"in_progress", "resolved"},
}
_WITHDRAWABLE = {"open", "in_progress"}


class IssueValueError(ValueError):
    pass


def clean_subject(raw: str) -> str:
    value = " ".join(_CONTROL_CHARS.sub("", raw).split())
    if len(value) < SUBJECT_MIN:
        raise IssueValueError(f"Subject must be at least {SUBJECT_MIN} characters.")
    if len(value) > SUBJECT_MAX:
        raise IssueValueError(f"Subject can be at most {SUBJECT_MAX} characters.")
    return value


def clean_text(raw: str, minimum: int, maximum: int, label: str) -> str:
    """Multi-line text: keeps line breaks, drops control characters and runaway blank lines."""
    value = raw.replace("\r\n", "\n").replace("\r", "\n")
    value = _CONTROL_CHARS.sub("", value)
    value = "\n".join(line.rstrip() for line in value.split("\n")).strip()
    value = re.sub(r"\n{3,}", "\n\n", value)
    if len(value) < minimum:
        raise IssueValueError(f"{label} must be at least {minimum} characters.")
    if len(value) > maximum:
        raise IssueValueError(f"{label} can be at most {maximum} characters.")
    return value


def clean_description(raw: str) -> str:
    return clean_text(raw, DESCRIPTION_MIN, DESCRIPTION_MAX, "Description")


def clean_response(raw: str) -> str:
    return clean_text(raw, RESPONSE_MIN, RESPONSE_MAX, "Response")


def can_respond(current: str, target: str) -> bool:
    return target in _RESPOND_TRANSITIONS.get(current, set())


def can_withdraw(current: str) -> bool:
    return current in _WITHDRAWABLE