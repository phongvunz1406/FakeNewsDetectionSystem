from pydantic import BaseModel, Field, field_validator

#user input class which is for input data validation
class UserInput(BaseModel):
    statement: str = Field(..., description="News headline/claim")
    fullText_based_content: str = Field(default="", description="Full article text")
    speaker: str = Field(default="", description="Person or organization")
    sources: str = Field(default="", description="Comma-separated URLs or source list")

#username and password schemas
class CreateUser(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, description="Username (3-50 characters)")
    password: str = Field(..., min_length=6, max_length=72, description="Password (6-72 characters)")

    @field_validator('password')
    @classmethod
    def validate_password_length(cls, v):
        if len(v.encode('utf-8')) > 72:
            raise ValueError('Password cannot be longer than 72 bytes')
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters long')
        return v

    @field_validator('username')
    @classmethod
    def validate_username(cls, v):
        if not v.strip():
            raise ValueError('Username cannot be empty or whitespace only')
        return v.strip()

#Token
class Token(BaseModel):
    access_token: str
    token_type: str