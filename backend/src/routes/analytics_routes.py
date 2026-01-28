from flask import Blueprint, request

from src.services.analytics_service import get_analytics_summary
from src.services.auth_middleware import require_auth

analytics_bp = Blueprint("analytics", __name__)


@analytics_bp.get("/summary")
@require_auth
def summary():
    data = get_analytics_summary(request.user["id"])
    return {"ok": True, "summary": data}

