from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import logging
import uuid
import random
import string
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Annotated

import bcrypt
import jwt
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, UploadFile, File
import base64
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, ConfigDict

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("testseries")

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 1  # Reduced from 30 days for enhanced security

# Razorpay Configuration (optional, for production)
RAZORPAY_KEY_ID = os.environ.get('RAZORPAY_KEY_ID', '')
RAZORPAY_KEY_SECRET = os.environ.get('RAZORPAY_KEY_SECRET', '')

# CORS Configuration
ALLOWED_ORIGIN = os.environ.get('ALLOWED_ORIGIN', 'http://localhost:3000')

# OTP Exposure Control
EXPOSE_OTP = os.environ.get('EXPOSE_OTP', 'false').lower() == 'true'

app = FastAPI(title="TestSeries API")
api = APIRouter(prefix="/api")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def verify_razorpay_signature(order_id: str, payment_id: str, signature: str) -> bool:
    """
    Verify Razorpay payment signature.
    Returns False if Razorpay keys are not configured (for development).
    """
    if not RAZORPAY_KEY_ID or not RAZORPAY_KEY_SECRET:
        logger.warning("Razorpay keys not configured, skipping signature verification")
        return False
    
    try:
        import hashlib
        import hmac
        
        message = f"{order_id}|{payment_id}"
        expected_signature = hmac.new(
            RAZORPAY_KEY_SECRET.encode(),
            message.encode(),
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(expected_signature, signature)
    except Exception as e:
        logger.error(f"Error verifying Razorpay signature: {e}")
        return False


def create_token(user_id: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])


async def get_current_user(request: Request) -> dict:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = auth[7:]
    try:
        payload = decode_token(token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    # Check if token is revoked
    revoked = await db.revoked_tokens.find_one({"token": token})
    if revoked:
        raise HTTPException(status_code=401, detail="Token has been revoked")
    
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return user

# SECURITY FIXES IMPLEMENTED:
# 1. Razorpay signature verification with environment variables
# 2. CORS protection via ALLOWED_ORIGIN environment variable  
# 3. OTP system redesigned - admin-managed, no auto-generation
# 4. JWT expiration reduced to 1 day
# 5. Logout endpoint with token revocation
# 6. All configuration via environment variables
# See DEPLOYMENT.md and SECURITY_IMPROVEMENTS.md for details