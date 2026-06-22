from flask import Blueprint, jsonify, request, session

try:
    from ..extensions import db, limiter
    from ..models import Contact
    from .auth import login_required
except ImportError:
    from extensions import db, limiter
    from models import Contact
    from routes.auth import login_required


contacts_bp = Blueprint("contacts", __name__)
MAX_NAME_LENGTH = 150
MAX_TYPE_LENGTH = 80
MAX_CONTACT_LENGTH = 150
MAX_EMAIL_LENGTH = 150
MAX_PHONE_LENGTH = 50
MAX_NOTES_LENGTH = 2000


def validate_contact_payload(payload):
    name = str(payload.get("name", "")).strip()
    contact_type = str(payload.get("type", "")).strip()
    contact_person = str(payload.get("contact", "")).strip()
    email = str(payload.get("email", "")).strip().lower()
    phone = str(payload.get("phone", "")).strip()
    notes = str(payload.get("notes", "")).strip()

    if not name or not contact_type:
        return None, jsonify({"error": "Name and type are required"}), 400

    if (
        len(name) > MAX_NAME_LENGTH
        or len(contact_type) > MAX_TYPE_LENGTH
        or len(contact_person) > MAX_CONTACT_LENGTH
        or len(email) > MAX_EMAIL_LENGTH
        or len(phone) > MAX_PHONE_LENGTH
        or len(notes) > MAX_NOTES_LENGTH
    ):
        return None, jsonify({"error": "Contact fields exceed maximum length"}), 400

    contact_data = {
        "name": name,
        "type": contact_type,
        "contact": contact_person,
        "email": email,
        "phone": phone,
        "notes": notes,
    }
    return contact_data, None, None


def get_contact_for_company(contact_id, company_id):
    return Contact.query.filter_by(id=contact_id, company_id=company_id).first()


@contacts_bp.route("/api/contacts", methods=["GET"])
@login_required
def list_contacts():
    company_id = session["company_id"]
    contacts = Contact.query.filter_by(company_id=company_id).order_by(Contact.id.asc()).all()
    return jsonify({"contacts": [contact.to_dict() for contact in contacts]})


@contacts_bp.route("/api/contacts", methods=["POST"])
@login_required
@limiter.limit("30 per minute")
def create_contact():
    contact_data, error_response, status_code = validate_contact_payload(request.get_json() or {})
    if error_response:
        return error_response, status_code

    contact = Contact(company_id=session["company_id"], **contact_data)
    db.session.add(contact)
    db.session.commit()

    return jsonify({
        "message": "Contact created",
        "contact": contact.to_dict(),
    }), 201


@contacts_bp.route("/api/contacts/<int:contact_id>", methods=["PUT"])
@login_required
@limiter.limit("60 per minute")
def update_contact(contact_id):
    contact = get_contact_for_company(contact_id, session["company_id"])
    if contact is None:
        return jsonify({"error": "Contact not found"}), 404

    contact_data, error_response, status_code = validate_contact_payload(request.get_json() or {})
    if error_response:
        return error_response, status_code

    contact.name = contact_data["name"]
    contact.type = contact_data["type"]
    contact.contact = contact_data["contact"]
    contact.email = contact_data["email"]
    contact.phone = contact_data["phone"]
    contact.notes = contact_data["notes"]
    db.session.commit()

    return jsonify({
        "message": "Contact updated",
        "contact": contact.to_dict(),
    })


@contacts_bp.route("/api/contacts/<int:contact_id>", methods=["DELETE"])
@login_required
@limiter.limit("30 per minute")
def delete_contact(contact_id):
    contact = get_contact_for_company(contact_id, session["company_id"])
    if contact is None:
        return jsonify({"error": "Contact not found"}), 404

    db.session.delete(contact)
    db.session.commit()
    return jsonify({"message": "Contact deleted"})
