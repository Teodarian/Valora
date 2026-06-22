from flask import Blueprint, jsonify, request, session

try:
    from ..extensions import db, limiter
    from ..models import Budget
    from .auth import login_required
except ImportError:
    from extensions import db, limiter
    from models import Budget
    from routes.auth import login_required


budget_bp = Blueprint("budget", __name__)


def validate_budget_payload(payload):
    fields = {
        "expected_sales": payload.get("expectedSales", 0),
        "expected_sponsors": payload.get("expectedSponsors", 0),
        "expected_purchases": payload.get("expectedPurchases", 0),
        "expected_other_costs": payload.get("expectedOtherCosts", 0),
    }

    normalized = {}
    for key, value in fields.items():
        try:
            number = float(value)
        except (TypeError, ValueError):
            return None, jsonify({"error": f"{key} must be a valid number"}), 400

        if number < 0:
            return None, jsonify({"error": f"{key} must be zero or greater"}), 400

        normalized[key] = number

    return normalized, None, None


def get_company_budget(company_id):
    return Budget.query.filter_by(company_id=company_id).first()


@budget_bp.route("/api/budget", methods=["GET"])
@login_required
def get_budget():
    budget = get_company_budget(session["company_id"])
    if budget is None:
        return jsonify({"error": "Budget not found"}), 404

    return jsonify({"budget": budget.to_dict()})


@budget_bp.route("/api/budget", methods=["PUT"])
@login_required
@limiter.limit("30 per minute")
def update_budget():
    budget = get_company_budget(session["company_id"])
    if budget is None:
        return jsonify({"error": "Budget not found"}), 404

    budget_data, error_response, status_code = validate_budget_payload(request.get_json() or {})
    if error_response:
        return error_response, status_code

    budget.expected_sales = budget_data["expected_sales"]
    budget.expected_sponsors = budget_data["expected_sponsors"]
    budget.expected_purchases = budget_data["expected_purchases"]
    budget.expected_other_costs = budget_data["expected_other_costs"]
    db.session.commit()

    return jsonify({
        "message": "Budget updated",
        "budget": budget.to_dict(),
    })
