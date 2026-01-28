import os
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

from src.db.mongo import init_mongo
from src.routes.auth_routes import auth_bp
from src.routes.analytics_routes import analytics_bp
from src.routes.ml_routes import ml_bp
from src.routes.notifications_routes import notifications_bp
from src.routes.subject_routes import subject_bp
from src.routes.task_routes import task_bp
from src.routes.schedule_routes import schedule_bp


def create_app():
    load_dotenv()

    app = Flask(__name__)

    # --------------------------------------------------
    # CORS CONFIG (PRODUCTION SAFE)
    # --------------------------------------------------
    client_origin = os.getenv(
        "CLIENT_ORIGIN",
        "https://smart-study-scheduler-8b7c-git-main-jaylikhar1s-projects.vercel.app"
    )

    CORS(
        app,
        resources={r"/api/*": {"origins": client_origin}},
        supports_credentials=False,
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    )

    # --------------------------------------------------
    # INIT DATABASE
    # --------------------------------------------------
    init_mongo()

    # --------------------------------------------------
    # REGISTER ROUTES
    # --------------------------------------------------
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(analytics_bp, url_prefix="/api/analytics")
    app.register_blueprint(ml_bp, url_prefix="/api/ml")
    app.register_blueprint(notifications_bp, url_prefix="/api/notifications")
    app.register_blueprint(subject_bp, url_prefix="/api/subjects")
    app.register_blueprint(task_bp, url_prefix="/api/tasks")
    app.register_blueprint(schedule_bp, url_prefix="/api/schedule")

    # --------------------------------------------------
    # HEALTH CHECK
    # --------------------------------------------------
    @app.get("/api/health")
    def health():
        return {"ok": True, "service": "smart-study-scheduler-api"}

    # --------------------------------------------------
    # ERROR HANDLERS
    # --------------------------------------------------
    @app.errorhandler(404)
    def not_found(_e):
        return {"message": "Not found"}, 404

    @app.errorhandler(500)
    def internal_error(e):
        if app.debug:
            return {"message": "Internal server error", "detail": str(e)}, 500
        return {"message": "Internal server error"}, 500

    return app


app = create_app()

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.getenv("PORT", "5000")),
        debug=False,
    )
