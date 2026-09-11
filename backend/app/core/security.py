"""
Supabase JWT verification using JWKS (asymmetric keys), not a static
shared secret — see the architecture decision from Step-0 confirmation.
"""

import jwt
from jwt import PyJWKClient
from fastapi import HTTPException, status

from app.core.config import get_settings

settings = get_settings()

JWKS_URL = f"{settings.supabase_url}/auth/v1/.well-known/jwks.json"

# Cached client: fetches Supabase's public keys once, reuses them across
# requests, and refreshes automatically if a token references an unknown kid.
_jwk_client = PyJWKClient(JWKS_URL, cache_keys=True)


def verify_supabase_jwt(token: str) -> dict:
    """
    Verifies signature, expiry, and audience of a Supabase-issued JWT.
    Returns the decoded claims (includes "sub" = Supabase auth user UUID).
    Raises HTTPException(401) if the token is invalid or expired.
    """
    try:
        signing_key = _jwk_client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256", "RS256"],
            audience="authenticated",
        )
        return payload
    except jwt.PyJWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired authentication token: {exc}",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc