from flask import Blueprint, request

from src.db.mongo import get_db
from src.models.user_model import UserCreate
from src.services.auth_middleware import require_auth
from src.services.jwt_service import create_access_token
from src.services.password_service import hash_password, verify_password

# Blueprint
auth_bp = Blueprint("auth", __name__)

# -----------------------------
# Register
# POST /auth/register
# -----------------------------
@auth_bp.route("/register", methods=["POST"])
def register():
    body = request.get_json(silent=True) or {}

    name = (body.get("name") or "").strip()
    email = (body.get("email") or "").strip().lower()
    password = body.get("password") or ""

    if not name or not email or not password:
        return {"message": "name, email, and password are required"}, 400

    if len(password) < 8:
        return {"message": "Password must be at least 8 characters"}, 400

    db = get_db()

    if db.users.find_one({"email": email}):
        return {"message": "Email already registered"}, 409

    user = UserCreate(
        name=name,
        email=email,
        password_hash=hash_password(password),
    )

    result = db.users.insert_one(user.to_doc())

    return {
        "ok": True,
        "userId": str(result.inserted_id),
    }, 201


# -----------------------------
# Login
# POST /auth/login
# -----------------------------
@auth_bp.route("/login", methods=["POST"])
def login():
    body = request.get_json(silent=True) or {}

    email = (body.get("email") or "").strip().lower()
    password = body.get("password") or ""

    if not email or not password:
        return {"message": "email and password are required"}, 400

    db = get_db()
    user = db.users.find_one({"email": email})

    if not user:
        return {"message": "Invalid credentials"}, 401

    if not verify_password(password, user.get("passwordHash", "")):
        return {"message": "Invalid credentials"}, 401

    token = create_access_token(str(user["_id"]))

    return {
        "token": token,
        "user": {
            "id": str(user["_id"]),
            "name": user.get("name", ""),
            "email": user.get("email", ""),
        },
    }, 200


# -----------------------------
# Get Current User
# GET /auth/me
# -----------------------------
@auth_bp.route("/me", methods=["GET"])
@require_auth
def me():
    return {"user": request.user}, 200
