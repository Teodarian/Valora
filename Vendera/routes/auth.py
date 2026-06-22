from functools import wraps

from flask import Blueprint, jsonify, request, session

try:
    from ..extensions import db, limiter
    from ..models import Budget, Company, User
except ImportError:
    from extensions import db, limiter
    from models import Budget, Company, User


auth_bp = Blueprint("auth", __name__)
MIN_PASSWORD_LENGTH = 8
MAX_NAME_LENGTH = 150
MAX_EMAIL_LENGTH = 150


def is_valid_email(email):
    return "@" in email and "." in email.rsplit("@", 1)[-1]


def set_authenticated_session(user):
    session.clear()
    session["user_id"] = user.id
    session["company_id"] = user.company_id


def build_session_payload(user):
    return {
        "user": user.to_dict(),
        "company": user.company.to_dict(),
        "employees": [employee.to_dict() for employee in user.company.employees],
        "contacts": [contact.to_dict() for contact in user.company.contacts],
        "products": [product.to_dict() for product in user.company.products],
        "purchases": [purchase.to_dict() for purchase in user.company.purchases],
        "sales": [sale.to_dict() for sale in user.company.sales],
        "sponsors": [sponsor.to_dict() for sponsor in user.company.sponsors],
        "budget": user.company.budget.to_dict() if user.company.budget else None,
    }


def login_required(route_function):
    @wraps(route_function)
    def wrapper(*args, **kwargs):
        if "user_id" not in session or "company_id" not in session:
            return jsonify({"error": "Not logged in"}), 401

        return route_function(*args, **kwargs)

    return wrapper


@auth_bp.route("/api/register", methods=["POST"])
@limiter.limit("5 per minute")
def register():
    data = request.get_json() or {}

    company_name = str(data.get("companyName", "")).strip()
    school = str(data.get("school", "")).strip()
    user_name = str(data.get("userName", "")).strip()
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))

    if not company_name or not school or not user_name or not email or not password:
        return jsonify({"error": "Missing required fields"}), 400

    if len(company_name) > MAX_NAME_LENGTH or len(school) > MAX_NAME_LENGTH or len(user_name) > MAX_NAME_LENGTH:
        return jsonify({"error": "Fields exceed maximum length"}), 400

    if len(email) > MAX_EMAIL_LENGTH or not is_valid_email(email):
        return jsonify({"error": "Invalid email address"}), 400

    if len(password) < MIN_PASSWORD_LENGTH:
        return jsonify({"error": f"Password must be at least {MIN_PASSWORD_LENGTH} characters"}), 400

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

    set_authenticated_session(user)

    payload = build_session_payload(user)
    payload["message"] = "Elevbedrift registrert"
    return jsonify(payload)


@auth_bp.route("/api/login", methods=["POST"])
@limiter.limit("10 per minute")
def login():
    data = request.get_json() or {}

    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))

    if not email or not password:
        return jsonify({"error": "Missing email or password"}), 400

    user = User.query.filter_by(email=email).first()

    if user is None or not user.check_password(password):
        return jsonify({"error": "Feil e-post eller passord"}), 401

    set_authenticated_session(user)

    payload = build_session_payload(user)
    payload["message"] = "Innlogget"
    return jsonify(payload)


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

    return jsonify(build_session_payload(user))
