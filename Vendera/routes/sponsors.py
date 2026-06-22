from flask import Blueprint, jsonify, request, session

try:
    from ..extensions import db, limiter
    from ..models import Sponsor
    from .auth import login_required
except ImportError:
    from extensions import db, limiter
    from models import Sponsor
    from routes.auth import login_required


sponsors_bp = Blueprint("sponsors", __name__)
MAX_NAME_LENGTH = 150
MAX_TYPE_LENGTH = 80


def validate_sponsor_payload(payload):
    name = str(payload.get("name", "")).strip()
    sponsor_type = str(payload.get("type", "")).strip()

    if not name or not sponsor_type:
        return None, jsonify({"error": "Name and type are required"}), 400

    if len(name) > MAX_NAME_LENGTH or len(sponsor_type) > MAX_TYPE_LENGTH:
        return None, jsonify({"error": "Sponsor fields exceed maximum length"}), 400

    try:
        value = float(payload.get("value", 0))
    except (TypeError, ValueError):
        return None, jsonify({"error": "Value must be a valid number"}), 400

    if value < 0:
        return None, jsonify({"error": "Value must be zero or greater"}), 400

    sponsor_data = {
        "name": name,
        "type": sponsor_type,
        "value": value,
    }
    return sponsor_data, None, None


@sponsors_bp.route("/api/sponsors", methods=["GET"])
@login_required
def list_sponsors():
    company_id = session["company_id"]
    sponsors = Sponsor.query.filter_by(company_id=company_id).order_by(Sponsor.id.asc()).all()
    return jsonify({"sponsors": [sponsor.to_dict() for sponsor in sponsors]})


@sponsors_bp.route("/api/sponsors", methods=["POST"])
@login_required
@limiter.limit("30 per minute")
def create_sponsor():
    sponsor_data, error_response, status_code = validate_sponsor_payload(request.get_json() or {})
    if error_response:
        return error_response, status_code

    sponsor = Sponsor(company_id=session["company_id"], **sponsor_data)
    db.session.add(sponsor)
    db.session.commit()

    return jsonify({
        "message": "Sponsor created",
        "sponsor": sponsor.to_dict(),
    }), 201


@sponsors_bp.route("/api/sponsors/<int:sponsor_id>", methods=["PUT"])
@login_required
@limiter.limit("60 per minute")
def update_sponsor(sponsor_id):
    sponsor = Sponsor.query.filter_by(id=sponsor_id, company_id=session["company_id"]).first()
    if sponsor is None:
        return jsonify({"error": "Sponsor not found"}), 404

    sponsor_data, error_response, status_code = validate_sponsor_payload(request.get_json() or {})
    if error_response:
        return error_response, status_code

    sponsor.name = sponsor_data["name"]
    sponsor.type = sponsor_data["type"]
    sponsor.value = sponsor_data["value"]
    db.session.commit()

    return jsonify({
        "message": "Sponsor updated",
        "sponsor": sponsor.to_dict(),
    })


@sponsors_bp.route("/api/sponsors/<int:sponsor_id>", methods=["DELETE"])
@login_required
@limiter.limit("30 per minute")
def delete_sponsor(sponsor_id):
    sponsor = Sponsor.query.filter_by(id=sponsor_id, company_id=session["company_id"]).first()
    if sponsor is None:
        return jsonify({"error": "Sponsor not found"}), 404

    db.session.delete(sponsor)
    db.session.commit()
    return jsonify({"message": "Sponsor deleted"})
