from pydantic import AliasChoices, BaseModel, Field


class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: str = "mentor"
    hourly_rate: float = 0.0


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    hourly_rate: float

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    # The deployed login form labels this value "username", while the API
    # and user records use email addresses. Accept both request shapes.
    email: str = Field(validation_alias=AliasChoices("email", "username"))
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    name: str
    email: str
    role: str
