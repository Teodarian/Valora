from flask import Blueprint, jsonify, request, session

try:
    from ..extensions import db, limiter
    from ..models import Product
    from .auth import login_required
except ImportError:
    from extensions import db, limiter
    from models import Product
    from routes.auth import login_required


products_bp = Blueprint("products", __name__)
MAX_NAME_LENGTH = 150
MAX_DESCRIPTION_LENGTH = 255
MAX_CATEGORY_LENGTH = 100


def parse_non_negative_number(value, field_name):
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None, jsonify({"error": f"{field_name} must be a valid number"}), 400

    if number < 0:
        return None, jsonify({"error": f"{field_name} must be zero or greater"}), 400

    return number, None, None


def parse_non_negative_integer(value, field_name):
    try:
        number = int(value)
    except (TypeError, ValueError):
        return None, jsonify({"error": f"{field_name} must be a valid integer"}), 400

    if number < 0:
        return None, jsonify({"error": f"{field_name} must be zero or greater"}), 400

    return number, None, None


def validate_product_payload(payload):
    name = str(payload.get("name", "")).strip()
    description = str(payload.get("description", "")).strip()
    category = str(payload.get("category", "")).strip()

    if not name:
        return None, jsonify({"error": "Name is required"}), 400

    if (
        len(name) > MAX_NAME_LENGTH
        or len(description) > MAX_DESCRIPTION_LENGTH
        or len(category) > MAX_CATEGORY_LENGTH
    ):
        return None, jsonify({"error": "Product fields exceed maximum length"}), 400

    price, error_response, status_code = parse_non_negative_number(payload.get("price", 0), "Price")
    if error_response:
        return None, error_response, status_code

    cost, error_response, status_code = parse_non_negative_number(payload.get("cost", 0), "Cost")
    if error_response:
        return None, error_response, status_code

    stock, error_response, status_code = parse_non_negative_integer(payload.get("stock", 0), "Stock")
    if error_response:
        return None, error_response, status_code

    product_data = {
        "name": name,
        "description": description,
        "category": category,
        "price": price,
        "cost": cost,
        "stock": stock,
    }
    return product_data, None, None


def get_product_for_company(product_id, company_id):
    return Product.query.filter_by(id=product_id, company_id=company_id).first()


@products_bp.route("/api/products", methods=["GET"])
@login_required
def list_products():
    company_id = session["company_id"]
    products = Product.query.filter_by(company_id=company_id).order_by(Product.id.asc()).all()
    return jsonify({"products": [product.to_dict() for product in products]})


@products_bp.route("/api/products", methods=["POST"])
@login_required
@limiter.limit("30 per minute")
def create_product():
    product_data, error_response, status_code = validate_product_payload(request.get_json() or {})
    if error_response:
        return error_response, status_code

    product = Product(company_id=session["company_id"], **product_data)
    db.session.add(product)
    db.session.commit()

    return jsonify({
        "message": "Product created",
        "product": product.to_dict(),
    }), 201


@products_bp.route("/api/products/<int:product_id>", methods=["PUT"])
@login_required
@limiter.limit("60 per minute")
def update_product(product_id):
    product = get_product_for_company(product_id, session["company_id"])
    if product is None:
        return jsonify({"error": "Product not found"}), 404

    product_data, error_response, status_code = validate_product_payload(request.get_json() or {})
    if error_response:
        return error_response, status_code

    product.name = product_data["name"]
    product.description = product_data["description"]
    product.category = product_data["category"]
    product.price = product_data["price"]
    product.cost = product_data["cost"]
    product.stock = product_data["stock"]
    db.session.commit()

    return jsonify({
        "message": "Product updated",
        "product": product.to_dict(),
    })


@products_bp.route("/api/products/<int:product_id>", methods=["DELETE"])
@login_required
@limiter.limit("30 per minute")
def delete_product(product_id):
    product = get_product_for_company(product_id, session["company_id"])
    if product is None:
        return jsonify({"error": "Product not found"}), 404

    db.session.delete(product)
    db.session.commit()
    return jsonify({"message": "Product deleted"})
