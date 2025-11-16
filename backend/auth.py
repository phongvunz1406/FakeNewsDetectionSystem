from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import sqlite3
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Security configurations
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here-change-in-production")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# Database path
DB_PATH = os.getenv("DB_PATH", "prediction.db")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password."""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def init_users_table():
    """Initialize users table in database."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            hashed_password TEXT NOT NULL,
            is_active INTEGER DEFAULT 1,
            is_admin INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Create sessions table for logout tracking
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            token TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            revoked INTEGER DEFAULT 0
        )
    """)
    conn.commit()
    conn.close()


def get_user(username: str):
    """Retrieve user from database."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
    row = cursor.fetchone()
    conn.close()

    if row:
        return {
            "id": row[0],
            "username": row[1],
            "hashed_password": row[2],
            "is_active": bool(row[3]),
            "is_admin": bool(row[4]) if len(row) > 4 else False,
            "created_at": row[5] if len(row) > 5 else row[4]
        }
    return None


def create_user(username: str, password: str, is_admin: bool = False):
    """Create a new user in the database."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        hashed_password = get_password_hash(password)
        cursor.execute(
            "INSERT INTO users (username, hashed_password, is_admin) VALUES (?, ?, ?)",
            (username, hashed_password, 1 if is_admin else 0)
        )
        conn.commit()
        user_id = cursor.lastrowid
        conn.close()
        return {"id": user_id, "username": username, "is_admin": is_admin}
    except sqlite3.IntegrityError:
        conn.close()
        raise ValueError("Username already exists")


def authenticate_user(username: str, password: str):
    """Authenticate a user by username and password."""
    user = get_user(username)
    if not user:
        return False
    if not verify_password(password, user["hashed_password"]):
        return False
    return user


def revoke_token(token: str):
    """Revoke a token (logout)."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("UPDATE user_sessions SET revoked = 1 WHERE token = ?", (token,))
    conn.commit()
    conn.close()


def is_token_revoked(token: str) -> bool:
    """Check if a token has been revoked."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT revoked FROM user_sessions WHERE token = ?", (token,))
    row = cursor.fetchone()
    conn.close()

    if row:
        return bool(row[0])
    return False


def save_session(username: str, token: str):
    """Save user session token."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO user_sessions (username, token) VALUES (?, ?)",
        (username, token)
    )
    conn.commit()
    conn.close()


async def get_current_user(token: str = Depends(oauth2_scheme)):
    """Dependency to get current authenticated user."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # Check if token is revoked
        if is_token_revoked(token):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has been revoked (logged out)",
                headers={"WWW-Authenticate": "Bearer"},
            )

        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = get_user(username)
    if user is None:
        raise credentials_exception
    return user


async def get_current_active_user(current_user: dict = Depends(get_current_user)):
    """Dependency to get current active user."""
    if not current_user["is_active"]:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


async def get_admin_user(current_user: dict = Depends(get_current_active_user)):
    """Dependency to ensure the current user is an admin."""
    if not current_user.get("is_admin", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Admin privileges required."
        )
    return current_user


# Initialize database tables
init_users_table()