from flask import Blueprint, jsonify, request, session

try:
    from ..extensions import db, limiter
    from ..models import Company
    from .auth import login_required
except ImportError:
    from extensions import db, limiter
    from models import Company
    from routes.auth import login_required


company_bp = Blueprint("company", __name__)
MAX_NAME_LENGTH = 150


def validate_company_payload(payload):
    name = str(payload.get("name", "")).strip()
    school = str(payload.get("school", "")).strip()

    if not name or not school:
        return None, jsonify({"error": "Company name and school are required"}), 400

    if len(name) > MAX_NAME_LENGTH or len(school) > MAX_NAME_LENGTH:
        return None, jsonify({"error": "Company fields exceed maximum length"}), 400

    company_data = {
        "name": name,
        "school": school,
    }
    return company_data, None, None


def get_company_for_session():
    return Company.query.filter_by(id=session["company_id"]).first()


@company_bp.route("/api/company", methods=["GET"])
@login_required
def get_company():
    company = get_company_for_session()
    if company is None:
        return jsonify({"error": "Company not found"}), 404

    return jsonify({"company": company.to_dict()})


@company_bp.route("/api/company", methods=["PUT"])
@login_required
@limiter.limit("30 per minute")
def update_company():
    company = get_company_for_session()
    if company is None:
        return jsonify({"error": "Company not found"}), 404

    company_data, error_response, status_code = validate_company_payload(request.get_json() or {})
    if error_response:
        return error_response, status_code

    company.name = company_data["name"]
    company.school = company_data["school"]
    db.session.commit()

    return jsonify({
        "message": "Company updated",
        "company": company.to_dict(),
    })


@company_bp.route("/api/company", methods=["DELETE"])
@login_required
@limiter.limit("10 per minute")
def delete_company():
    company = get_company_for_session()
    if company is None:
        session.clear()
        return jsonify({"error": "Company not found"}), 404

    payload = request.get_json(silent=True) or {}
    confirmation_name = str(payload.get("confirmationName", "")).strip()

    if confirmation_name != company.name:
        return jsonify({"error": "Company name confirmation does not match"}), 400

    db.session.delete(company)
    db.session.commit()
    session.clear()

    return jsonify({"message": "Company deleted"})
