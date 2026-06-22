from datetime import datetime

from flask import Blueprint, jsonify, request, session

try:
    from ..extensions import db, limiter
    from ..models import Contact, Product, Sale
    from .auth import login_required
except ImportError:
    from extensions import db, limiter
    from models import Contact, Product, Sale
    from routes.auth import login_required


sales_bp = Blueprint("sales", __name__)
MAX_NAME_LENGTH = 150
MAX_PRODUCT_LENGTH = 150
MAX_STATUS_LENGTH = 50
ALLOWED_STATUSES = {"Betalt", "Ikke betalt"}


def get_company_contact(contact_id, company_id):
    if not contact_id:
        return None

    return Contact.query.filter_by(id=contact_id, company_id=company_id).first()


def get_company_product(product_id, company_id):
    if not product_id:
        return None

    return Product.query.filter_by(id=product_id, company_id=company_id).first()


def validate_sale_payload(payload, company_id):
    customer_name = str(payload.get("customerName", payload.get("customer", ""))).strip()
    manual_product_name = str(payload.get("product", "")).strip()
    status = str(payload.get("status", "")).strip()

    if not customer_name:
        return None, jsonify({"error": "Customer name is required"}), 400

    if len(customer_name) > MAX_NAME_LENGTH or len(manual_product_name) > MAX_PRODUCT_LENGTH or len(status) > MAX_STATUS_LENGTH:
        return None, jsonify({"error": "Sale fields exceed maximum length"}), 400

    if status not in ALLOWED_STATUSES:
        return None, jsonify({"error": "Invalid sale status"}), 400

    try:
        quantity = int(payload.get("quantity", 0))
    except (TypeError, ValueError):
        return None, jsonify({"error": "Quantity must be a valid integer"}), 400

    if quantity <= 0:
        return None, jsonify({"error": "Quantity must be greater than zero"}), 400

    try:
        price = float(payload.get("price", 0))
    except (TypeError, ValueError):
        return None, jsonify({"error": "Price must be a valid number"}), 400

    if price < 0:
        return None, jsonify({"error": "Price must be zero or greater"}), 400

    raw_contact_id = payload.get("contactId")
    contact = get_company_contact(raw_contact_id, company_id)
    if raw_contact_id and contact is None:
        return None, jsonify({"error": "Contact not found"}), 404
    if contact is None and customer_name:
        contact = Contact.query.filter_by(company_id=company_id, name=customer_name).first()

    raw_product_id = payload.get("productId")
    product = get_company_product(raw_product_id, company_id)
    if raw_product_id and product is None:
        return None, jsonify({"error": "Product not found"}), 404

    if product is not None:
        product_name = product.name
    else:
        product_name = manual_product_name

    if not product_name:
        return None, jsonify({"error": "Product name is required"}), 400

    sale_data = {
        "contact": contact,
        "product": product,
        "customer_name": contact.name if contact is not None else customer_name,
        "product_name": product_name,
        "quantity": quantity,
        "price": float(product.price) if product is not None else price,
        "status": status,
    }
    sale_data["total"] = sale_data["quantity"] * sale_data["price"]
    return sale_data, None, None


def ensure_stock_available(product, required_quantity):
    if product is None:
        return None

    if product.stock < required_quantity:
        return jsonify({"error": "Not enough stock available"}), 400

    return None


def apply_stock_change(product, quantity_delta):
    if product is None:
        return

    product.stock += quantity_delta


def serialize_related_products(products):
    seen_ids = set()
    serialized = []

    for product in products:
        if product is None or product.id in seen_ids:
            continue

        seen_ids.add(product.id)
        serialized.append(product.to_dict())

    return serialized


@sales_bp.route("/api/sales", methods=["GET"])
@login_required
def list_sales():
    company_id = session["company_id"]
    sales = Sale.query.filter_by(company_id=company_id).order_by(Sale.id.asc()).all()
    return jsonify({"sales": [sale.to_dict() for sale in sales]})


@sales_bp.route("/api/sales", methods=["POST"])
@login_required
@limiter.limit("30 per minute")
def create_sale():
    company_id = session["company_id"]
    sale_data, error_response, status_code = validate_sale_payload(request.get_json() or {}, company_id)
    if error_response:
        return error_response, status_code

    stock_error = ensure_stock_available(sale_data["product"], sale_data["quantity"])
    if stock_error:
        return stock_error

    sale = Sale(
        company_id=company_id,
        contact_id=sale_data["contact"].id if sale_data["contact"] is not None else None,
        product_id=sale_data["product"].id if sale_data["product"] is not None else None,
        customer_name=sale_data["customer_name"],
        product=sale_data["product_name"],
        quantity=sale_data["quantity"],
        price=sale_data["price"],
        total=sale_data["total"],
        status=sale_data["status"],
        date=str(payload_date(request.get_json() or {})),
    )

    apply_stock_change(sale_data["product"], -sale_data["quantity"])
    db.session.add(sale)
    db.session.commit()

    return jsonify({
        "message": "Sale created",
        "sale": sale.to_dict(),
        "products": serialize_related_products([sale_data["product"]]),
    }), 201


def payload_date(payload):
    raw_date = str(payload.get("date", "")).strip()
    if raw_date:
        return raw_date

    return datetime.now().strftime("%d.%m.%Y")


@sales_bp.route("/api/sales/<int:sale_id>", methods=["PUT"])
@login_required
@limiter.limit("60 per minute")
def update_sale(sale_id):
    company_id = session["company_id"]
    sale = Sale.query.filter_by(id=sale_id, company_id=company_id).first()
    if sale is None:
        return jsonify({"error": "Sale not found"}), 404

    payload = request.get_json() or {}
    sale_data, error_response, status_code = validate_sale_payload(payload, company_id)
    if error_response:
        return error_response, status_code

    previous_product = get_company_product(sale.product_id, company_id)
    if previous_product is not None:
        apply_stock_change(previous_product, sale.quantity)

    stock_error = ensure_stock_available(sale_data["product"], sale_data["quantity"])
    if stock_error:
        if previous_product is not None:
            apply_stock_change(previous_product, -sale.quantity)
        return stock_error

    apply_stock_change(sale_data["product"], -sale_data["quantity"])

    sale.contact_id = sale_data["contact"].id if sale_data["contact"] is not None else None
    sale.product_id = sale_data["product"].id if sale_data["product"] is not None else None
    sale.customer_name = sale_data["customer_name"]
    sale.product = sale_data["product_name"]
    sale.quantity = sale_data["quantity"]
    sale.price = sale_data["price"]
    sale.total = sale_data["total"]
    sale.status = sale_data["status"]
    db.session.commit()

    return jsonify({
        "message": "Sale updated",
        "sale": sale.to_dict(),
        "products": serialize_related_products([previous_product, sale_data["product"]]),
    })


@sales_bp.route("/api/sales/<int:sale_id>", methods=["DELETE"])
@login_required
@limiter.limit("30 per minute")
def delete_sale(sale_id):
    company_id = session["company_id"]
    sale = Sale.query.filter_by(id=sale_id, company_id=company_id).first()
    if sale is None:
        return jsonify({"error": "Sale not found"}), 404

    product = get_company_product(sale.product_id, company_id)
    if product is not None:
        apply_stock_change(product, sale.quantity)

    db.session.delete(sale)
    db.session.commit()

    return jsonify({
        "message": "Sale deleted",
        "products": serialize_related_products([product]),
    })
