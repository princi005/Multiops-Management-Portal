"""
Central application configuration.
Reads values from environment variables (loaded from backend/.env),
so no secrets are ever hardcoded in source code.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Database
    database_url: str

    # Supabase project (used for auth verification in a later step)
    supabase_url: str
    supabase_project_ref: str
    supabase_anon_key: str
    supabase_service_role_key: str

    # App metadata
    app_name: str = "Company Knowledge Platform API"
    environment: str = "development"


@lru_cache
def get_settings() -> Settings:
    """
    Cached so Settings is only parsed from .env once per process,
    not re-read on every request.
    """
    return Settings()