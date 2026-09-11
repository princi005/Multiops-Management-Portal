"""
Supabase admin client — uses the service_role key to create Auth users
directly (bypassing email confirmation). Used only for HR-initiated
onboarding, never exposed to regular request flows.
"""

from functools import lru_cache

from supabase import Client, create_client

from app.core.config import get_settings


@lru_cache
def get_supabase_admin() -> Client:
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_service_role_key)