from datetime import datetime

from flask import Blueprint, jsonify, request, session

try:
    from ..extensions import db, limiter
    from ..models import Contact, Purchase
    from .auth import login_required
except ImportError:
    from extensions import db, limiter
    from models import Contact, Purchase
    from routes.auth import login_required


purchases_bp = Blueprint("purchases", __name__)
MAX_NAME_LENGTH = 150
MAX_DESCRIPTION_LENGTH = 255
MAX_CATEGORY_LENGTH = 100
ALLOWED_CATEGORIES = {"Materialer", "Utstyr", "MarkedsfÃ¸ring", "Transport", "Annet", "Markedsføring"}


def get_company_contact(contact_id, company_id):
    if not contact_id:
        return None

    return Contact.query.filter_by(id=contact_id, company_id=company_id).first()


def validate_purchase_payload(payload, company_id):
    supplier_name = str(payload.get("supplierName", payload.get("supplier", ""))).strip()
    description = str(payload.get("description", "")).strip()
    category = str(payload.get("category", "")).strip()

    if not supplier_name or not description or not category:
        return None, jsonify({"error": "Supplier, description, and category are required"}), 400

    if (
        len(supplier_name) > MAX_NAME_LENGTH
        or len(description) > MAX_DESCRIPTION_LENGTH
        or len(category) > MAX_CATEGORY_LENGTH
    ):
        return None, jsonify({"error": "Purchase fields exceed maximum length"}), 400

    if category not in ALLOWED_CATEGORIES:
        return None, jsonify({"error": "Invalid purchase category"}), 400

    try:
        amount = float(payload.get("amount", 0))
    except (TypeError, ValueError):
        return None, jsonify({"error": "Amount must be a valid number"}), 400

    if amount < 0:
        return None, jsonify({"error": "Amount must be zero or greater"}), 400

    raw_contact_id = payload.get("contactId")
    contact = get_company_contact(raw_contact_id, company_id)
    if raw_contact_id and contact is None:
        return None, jsonify({"error": "Contact not found"}), 404
    if contact is None and supplier_name:
        contact = Contact.query.filter_by(company_id=company_id, name=supplier_name).first()

    purchase_data = {
        "contact": contact,
        "supplier_name": contact.name if contact is not None else supplier_name,
        "description": description,
        "category": category,
        "amount": amount,
    }
    return purchase_data, None, None


def payload_date(payload):
    raw_date = str(payload.get("date", "")).strip()
    if raw_date:
        return raw_date

    return datetime.now().strftime("%d.%m.%Y")


@purchases_bp.route("/api/purchases", methods=["GET"])
@login_required
def list_purchases():
    company_id = session["company_id"]
    purchases = Purchase.query.filter_by(company_id=company_id).order_by(Purchase.id.asc()).all()
    return jsonify({"purchases": [purchase.to_dict() for purchase in purchases]})


@purchases_bp.route("/api/purchases", methods=["POST"])
@login_required
@limiter.limit("30 per minute")
def create_purchase():
    company_id = session["company_id"]
    payload = request.get_json() or {}
    purchase_data, error_response, status_code = validate_purchase_payload(payload, company_id)
    if error_response:
        return error_response, status_code

    purchase = Purchase(
        company_id=company_id,
        contact_id=purchase_data["contact"].id if purchase_data["contact"] is not None else None,
        supplier_name=purchase_data["supplier_name"],
        description=purchase_data["description"],
        category=purchase_data["category"],
        amount=purchase_data["amount"],
        date=payload_date(payload),
    )

    db.session.add(purchase)
    db.session.commit()

    return jsonify({
        "message": "Purchase created",
        "purchase": purchase.to_dict(),
    }), 201


@purchases_bp.route("/api/purchases/<int:purchase_id>", methods=["PUT"])
@login_required
@limiter.limit("60 per minute")
def update_purchase(purchase_id):
    company_id = session["company_id"]
    purchase = Purchase.query.filter_by(id=purchase_id, company_id=company_id).first()
    if purchase is None:
        return jsonify({"error": "Purchase not found"}), 404

    payload = request.get_json() or {}
    purchase_data, error_response, status_code = validate_purchase_payload(payload, company_id)
    if error_response:
        return error_response, status_code

    purchase.contact_id = purchase_data["contact"].id if purchase_data["contact"] is not None else None
    purchase.supplier_name = purchase_data["supplier_name"]
    purchase.description = purchase_data["description"]
    purchase.category = purchase_data["category"]
    purchase.amount = purchase_data["amount"]
    db.session.commit()

    return jsonify({
        "message": "Purchase updated",
        "purchase": purchase.to_dict(),
    })


@purchases_bp.route("/api/purchases/<int:purchase_id>", methods=["DELETE"])
@login_required
@limiter.limit("30 per minute")
def delete_purchase(purchase_id):
    company_id = session["company_id"]
    purchase = Purchase.query.filter_by(id=purchase_id, company_id=company_id).first()
    if purchase is None:
        return jsonify({"error": "Purchase not found"}), 404

    db.session.delete(purchase)
    db.session.commit()
    return jsonify({"message": "Purchase deleted"})
