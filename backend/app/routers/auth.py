from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from app.dependencies import get_db
from app.repositories import UserRepository
from app.services.auth_service import create_access_token
from app.schemas.auth import GoogleAuthRequest, MockAuthRequest, TokenResponse
from app.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/google", response_model=TokenResponse)
async def google_auth(body: GoogleAuthRequest, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Verify Google ID token and upsert user."""
    if not settings.google_client_id:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google OAuth is not configured. Set GOOGLE_CLIENT_ID in backend .env",
        )

    try:
        id_info = id_token.verify_oauth2_token(
            body.id_token,
            google_requests.Request(),
            settings.google_client_id,
        )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google token",
        )

    if id_info.get("iss") not in ("accounts.google.com", "https://accounts.google.com"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token issuer",
        )

    google_id = id_info["sub"]
    email = id_info.get("email")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google account must have a verified email",
        )

    name = id_info.get("name", email.split("@")[0])
    avatar_url = id_info.get("picture")

    repo = UserRepository(db)
    user = await repo.upsert_google_user(
        google_id=google_id,
        email=email,
        name=name,
        avatar_url=avatar_url,
    )

    token = create_access_token(user["id"])
    return TokenResponse(
        access_token=token,
        user_id=user["id"],
        onboarding_completed=user.get("onboarding_completed", False),
    )


@router.post("/mock", response_model=TokenResponse)
async def mock_auth(body: MockAuthRequest, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Development-only mock authentication endpoint."""
    if not settings.dev_mock_auth:
        raise HTTPException(status_code=404, detail="Not found")

    repo = UserRepository(db)
    user = await repo.upsert_google_user(
        google_id=f"mock_{body.email}",
        email=body.email,
        name=body.name,
    )
    token = create_access_token(user["id"])
    return TokenResponse(
        access_token=token,
        user_id=user["id"],
        onboarding_completed=user.get("onboarding_completed", False),
    )
