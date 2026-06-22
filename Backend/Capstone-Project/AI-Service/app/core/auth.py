"""
JWT authentication dependency for FastAPI.

Reuses the SAME HS256 secret as the Spring `Secure` service so any token
issued by `/person/login` is accepted here without any extra registration step.

The Spring service puts the personId (as a string) into the `sub` claim:
    String token = jwtService.generateToken(String.valueOf(existingPerson.getId()));
We extract that and attach a small CurrentUser object to the request.
"""
from __future__ import annotations

from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import settings

# auto_error=True -> automatic 403 if the header is missing/malformed.
bearer_scheme = HTTPBearer(auto_error=True)


class CurrentUser:
    """Resolved current user info, derived from a valid JWT."""

    __slots__ = ("person_id", "username", "raw_token")

    def __init__(self, person_id: str, username: str | None, raw_token: str):
        self.person_id = person_id
        self.username = username
        self.raw_token = raw_token

    def __repr__(self) -> str:  # pragma: no cover - debug only
        return f"CurrentUser(person_id={self.person_id!r}, username={self.username!r})"


def get_current_user(
    creds: Annotated[HTTPAuthorizationCredentials, Depends(bearer_scheme)],
) -> CurrentUser:
    """FastAPI dependency: validates the Bearer JWT and returns CurrentUser."""
    token = creds.credentials
    try:
        payload = jwt.decode(
            token,
            key=settings.jwt_secret_bytes,
            algorithms=[settings.jwt_algorithm],
            options={"require": ["sub", "exp"]},
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {exc}",
            headers={"WWW-Authenticate": "Bearer"},
        )

    person_id = payload.get("sub")
    if not person_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing 'sub' (personId) claim.",
        )

    return CurrentUser(
        person_id=str(person_id),
        username=payload.get("username"),
        raw_token=token,
    )


# Convenience type alias so endpoints stay concise:
#     async def my_endpoint(user: CurrentUserDep): ...
CurrentUserDep = Annotated[CurrentUser, Depends(get_current_user)]
