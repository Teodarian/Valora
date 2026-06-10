from pathlib import Path

from flask import Flask, render_template


BASE_DIR = Path(__file__).resolve().parent


def create_app():
    app = Flask(
        __name__,
        root_path=str(BASE_DIR),
        template_folder="templates",
        static_folder="static",
    )

    # ── Sider ──────────────────────────────────────────────────────────────────

    @app.route("/")
    def index():
        return render_template("index.html")

    @app.route("/booking/frisor")
    def booking_frisor():
        return render_template("booking-frisor.html")

    @app.route("/booking/restaurant")
    def booking_restaurant():
        return render_template("booking-restaurant.html")

    @app.route("/booking/treningssenter")
    def booking_treningssenter():
        return render_template("booking-treningssenter.html")

    return app


app = create_app()


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5001)
