from pydantic import BaseModel


class GoogleAuthRequest(BaseModel):
    id_token: str


class MockAuthRequest(BaseModel):
    email: str = "arjun@conviction.vc"
    name: str = "Arjun Mehta"


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    onboarding_completed: bool
