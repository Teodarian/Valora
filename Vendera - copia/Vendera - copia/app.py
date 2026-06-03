from pathlib import Path

from flask import Flask, render_template

from config import Config
from extensions import db
from routes.auth import auth_bp


BASE_DIR = Path(__file__).resolve().parent


def create_app():
    app = Flask(
        __name__,
        template_folder=str(BASE_DIR / "templates"),
        static_folder=str(BASE_DIR / "static"),
    )

    app.config.from_object(Config)

    db.init_app(app)

    app.register_blueprint(auth_bp)

    @app.route("/")
    def index():
        return render_template("index.html")

    @app.cli.command("init-db")
    def init_db():
        with app.app_context():
            db.create_all()
            print("Database initialized.")

    return app


app = create_app()


if __name__ == "__main__":
    app.run(debug=True)