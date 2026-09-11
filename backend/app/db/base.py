"""
Shared declarative base class. All SQLAlchemy models will inherit
from this in later steps (Step 5+).
"""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass