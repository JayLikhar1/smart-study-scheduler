from flask import Blueprint, request

from src.services.auth_middleware import require_auth
from src.services.ml_service import get_productivity_patterns

ml_bp = Blueprint("ml", __name__)


@ml_bp.get("/patterns")
@require_auth
def patterns():
    """
    K-Means productivity-pattern clustering (Phase 8).
    Returns cluster descriptions and an explainability string.
    """
    data = get_productivity_patterns(request.user["id"])
    return {"ok": True, **data}
