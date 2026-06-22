from pathlib import Path

from flask import Flask, abort, g, jsonify, render_template, request
from werkzeug.exceptions import HTTPException
from werkzeug.middleware.proxy_fix import ProxyFix

try:
    from .config import INSTANCE_DIR, generate_csrf_token, get_config
    from .extensions import db, limiter, migrate
    from .routes.auth import auth_bp
    from .routes.budget import budget_bp
    from .routes.company import company_bp
    from .routes.contacts import contacts_bp
    from .routes.employees import employees_bp
    from .routes.purchases import purchases_bp
    from .routes.products import products_bp
    from .routes.sales import sales_bp
    from .routes.sponsors import sponsors_bp
    from . import models
except ImportError:
    from config import INSTANCE_DIR, generate_csrf_token, get_config
    from extensions import db, limiter, migrate
    from routes.auth import auth_bp
    from routes.budget import budget_bp
    from routes.company import company_bp
    from routes.contacts import contacts_bp
    from routes.employees import employees_bp
    from routes.purchases import purchases_bp
    from routes.products import products_bp
    from routes.sales import sales_bp
    from routes.sponsors import sponsors_bp
    import models


BASE_DIR = Path(__file__).resolve().parent


def build_csp_header(policy):
    return "; ".join(f"{directive} {value}" for directive, value in policy.items())


def register_security_hooks(app):
    @app.before_request
    def enforce_api_request_rules():
        if request.path.startswith("/api/") and request.method in {"POST", "PUT", "PATCH"}:
            if not request.is_json:
                abort(415, description="API requests must use application/json.")

        csrf_cookie_name = app.config["CSRF_COOKIE_NAME"]
        csrf_header_name = app.config["CSRF_HEADER_NAME"]
        csrf_cookie_value = request.cookies.get(csrf_cookie_name)
        g.csrf_token = csrf_cookie_value or generate_csrf_token(app.config["CSRF_TOKEN_LENGTH"])

        if request.path.startswith("/api/") and request.method in {"POST", "PUT", "PATCH", "DELETE"}:
            csrf_header_value = request.headers.get(csrf_header_name)

            if not csrf_cookie_value or not csrf_header_value or csrf_cookie_value != csrf_header_value:
                abort(403, description="CSRF validation failed.")

    @app.after_request
    def add_security_headers(response):
        response.set_cookie(
            app.config["CSRF_COOKIE_NAME"],
            g.csrf_token,
            secure=app.config.get("SESSION_COOKIE_SECURE", False),
            httponly=False,
            samesite=app.config.get("SESSION_COOKIE_SAMESITE", "Lax"),
        )

        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        response.headers.setdefault("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
        response.headers.setdefault("Cross-Origin-Opener-Policy", "same-origin")
        response.headers.setdefault("Cross-Origin-Resource-Policy", "same-origin")

        csp = app.config.get("CONTENT_SECURITY_POLICY")
        if csp:
            response.headers.setdefault("Content-Security-Policy", build_csp_header(csp))

        if request.is_secure or app.config.get("ENV_NAME") == "production":
            response.headers.setdefault(
                "Strict-Transport-Security",
                "max-age=31536000; includeSubDomains"
            )

        return response


def register_error_handlers(app):
    @app.errorhandler(HTTPException)
    def handle_http_error(error):
        if request.path.startswith("/api/"):
            return jsonify({
                "error": error.name,
                "message": error.description,
                "status": error.code,
            }), error.code

        return error

    @app.errorhandler(Exception)
    def handle_unexpected_error(error):
        app.logger.exception("Unhandled application error", exc_info=error)

        if request.path.startswith("/api/"):
            return jsonify({
                "error": "Internal Server Error",
                "message": "An unexpected error occurred.",
                "status": 500,
            }), 500

        return render_template("500.html"), 500


def validate_runtime_config(app):
    secret_key = app.config.get("SECRET_KEY")

    if app.config.get("ENV_NAME") == "production" and secret_key == "dev-secret-key-change-later":
        raise RuntimeError("SECRET_KEY must be set in production.")


def create_app(config_class=None):
    INSTANCE_DIR.mkdir(exist_ok=True)

    app = Flask(
        __name__,
        root_path=str(BASE_DIR),
        template_folder="templates",
        static_folder="static",
        instance_path=str(INSTANCE_DIR),
        instance_relative_config=False,
    )

    app.config.from_object(config_class or get_config())
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_port=1)

    validate_runtime_config(app)

    db.init_app(app)
    migrate.init_app(app, db)
    limiter.init_app(app)

    app.register_blueprint(auth_bp)
    app.register_blueprint(budget_bp)
    app.register_blueprint(company_bp)
    app.register_blueprint(contacts_bp)
    app.register_blueprint(employees_bp)
    app.register_blueprint(purchases_bp)
    app.register_blueprint(products_bp)
    app.register_blueprint(sales_bp)
    app.register_blueprint(sponsors_bp)
    register_security_hooks(app)
    register_error_handlers(app)

    @app.route("/")
    def index():
        return render_template("index.html")

    @app.route("/health")
    def health():
        return jsonify({
            "status": "ok",
            "environment": app.config.get("ENV_NAME", "development"),
        }), 200

    @app.route("/test-template")
    def test_template():
        return "Template folder works"

    @app.cli.command("init-db")
    def init_db():
        with app.app_context():
            db.create_all()
            print("Database initialized with create_all(). Prefer 'flask --app Vendera/app.py db upgrade' once migrations are set up.")

    return app


app = create_app()


if __name__ == "__main__":
    print("BASE_DIR:", BASE_DIR)
    print("Template folder:", app.template_folder)
    print("Static folder:", app.static_folder)
    app.run(debug=False, host="0.0.0.0", port=5000)
