from functools import wraps

from flask import Blueprint, jsonify, request, session

from extensions import db
from models import Budget, Company, User


auth_bp = Blueprint("auth", __name__)


def login_required(route_function):
    @wraps(route_function)
    def wrapper(*args, **kwargs):
        if "user_id" not in session or "company_id" not in session:
            return jsonify({"error": "Not logged in"}), 401

        return route_function(*args, **kwargs)

    return wrapper


@auth_bp.route("/api/register", methods=["POST"])
def register():
    data = request.get_json() or {}

    company_name = str(data.get("companyName", "")).strip()
    school = str(data.get("school", "")).strip()
    user_name = str(data.get("userName", "")).strip()
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))

    if not company_name or not school or not user_name or not email or not password:
        return jsonify({"error": "Missing required fields"}), 400

    existing_user = User.query.filter_by(email=email).first()

    if existing_user:
        return jsonify({"error": "E-post er allerede registrert"}), 400

    company = Company(
        name=company_name,
        school=school,
    )

    user = User(
        company=company,
        name=user_name,
        email=email,
        role="Daglig leder",
    )
    user.set_password(password)

    budget = Budget(company=company)

    db.session.add(company)
    db.session.add(user)
    db.session.add(budget)
    db.session.commit()

    session["user_id"] = user.id
    session["company_id"] = company.id

    return jsonify({
        "message": "Elevbedrift registrert",
        "user": user.to_dict(),
        "company": company.to_dict(),
    })


@auth_bp.route("/api/login", methods=["POST"])
def login():
    data = request.get_json() or {}

    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))

    user = User.query.filter_by(email=email).first()

    if user is None or not user.check_password(password):
        return jsonify({"error": "Feil e-post eller passord"}), 401

    session["user_id"] = user.id
    session["company_id"] = user.company_id

    return jsonify({
        "message": "Innlogget",
        "user": user.to_dict(),
        "company": user.company.to_dict(),
    })


@auth_bp.route("/api/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"message": "Logget ut"})


@auth_bp.route("/api/me", methods=["GET"])
@login_required
def me():
    user = User.query.get(session["user_id"])

    if user is None:
        session.clear()
        return jsonify({"error": "User not found"}), 404

    return jsonify({
        "user": user.to_dict(),
        "company": user.company.to_dict(),
    })