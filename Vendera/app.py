from pathlib import Path

from flask import Flask, render_template

from config import Config
from extensions import db
from routes.auth import auth_bp


BASE_DIR = Path(__file__).resolve().parent


def create_app():
    app = Flask(
        __name__,
        root_path=str(BASE_DIR),
        template_folder="templates",
        static_folder="static",
    )

    app.config.from_object(Config)

    db.init_app(app)

    app.register_blueprint(auth_bp)

    @app.route("/")
    def index():
        return render_template("index.html")

    @app.route("/test-template")
    def test_template():
        return "Template folder works"

    @app.cli.command("init-db")
    def init_db():
        with app.app_context():
            db.create_all()
            print("Database initialized.")

    return app


app = create_app()


if __name__ == "__main__":
    print("BASE_DIR:", BASE_DIR)
    print("Template folder:", app.template_folder)
    print("Static folder:", app.static_folder)
    app.run(debug=False, host="0.0.0.0", port=5000)