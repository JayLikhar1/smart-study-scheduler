from bson import ObjectId
from flask import Blueprint, request

from src.db.mongo import get_db
from src.models.subject_model import SubjectCreate
from src.services.auth_middleware import require_auth

subject_bp = Blueprint("subjects", __name__)


@subject_bp.get("")
@require_auth
def list_subjects():
    db = get_db()
    docs = list(
        db.subjects.find({"userId": request.user["id"]}).sort("name", 1)
    )
    return {
        "items": [{"id": str(d["_id"]), "name": d.get("name", "")} for d in docs]
    }


@subject_bp.post("")
@require_auth
def create_subject():
    body = request.get_json(silent=True) or {}
    name = (body.get("name") or "").strip()
    if not name:
        return {"message": "name is required"}, 400

    db = get_db()
    subj = SubjectCreate(user_id=request.user["id"], name=name)
    try:
        result = db.subjects.insert_one(subj.to_doc())
    except Exception:
        # duplicate subject names for same user hit unique index
        return {"message": "Subject already exists"}, 409

    return {"id": str(result.inserted_id), "name": name}, 201


@subject_bp.delete("/<subject_id>")
@require_auth
def delete_subject(subject_id: str):
    db = get_db()
    res = db.subjects.delete_one(
        {"_id": ObjectId(subject_id), "userId": request.user["id"]}
    )
    if res.deleted_count == 0:
        return {"message": "Subject not found"}, 404
    return {"ok": True}

