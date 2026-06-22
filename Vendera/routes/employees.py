from flask import Blueprint, jsonify, request, session

try:
    from ..extensions import db, limiter
    from ..models import Employee
    from .auth import login_required
except ImportError:
    from extensions import db, limiter
    from models import Employee
    from routes.auth import login_required


employees_bp = Blueprint("employees", __name__)
MAX_NAME_LENGTH = 150
MAX_ROLE_LENGTH = 150
MAX_EMAIL_LENGTH = 150


def validate_employee_payload(payload):
    name = str(payload.get("name", "")).strip()
    role = str(payload.get("role", "")).strip()
    email = str(payload.get("email", "")).strip().lower()

    if not name or not role:
        return None, jsonify({"error": "Name and role are required"}), 400

    if len(name) > MAX_NAME_LENGTH or len(role) > MAX_ROLE_LENGTH or len(email) > MAX_EMAIL_LENGTH:
        return None, jsonify({"error": "Employee fields exceed maximum length"}), 400

    employee_data = {
        "name": name,
        "role": role,
        "email": email,
    }
    return employee_data, None, None


def get_employee_for_company(employee_id, company_id):
    return Employee.query.filter_by(id=employee_id, company_id=company_id).first()


@employees_bp.route("/api/employees", methods=["GET"])
@login_required
def list_employees():
    company_id = session["company_id"]
    employees = Employee.query.filter_by(company_id=company_id).order_by(Employee.id.asc()).all()
    return jsonify({"employees": [employee.to_dict() for employee in employees]})


@employees_bp.route("/api/employees", methods=["POST"])
@login_required
@limiter.limit("30 per minute")
def create_employee():
    employee_data, error_response, status_code = validate_employee_payload(request.get_json() or {})
    if error_response:
        return error_response, status_code

    employee = Employee(company_id=session["company_id"], **employee_data)
    db.session.add(employee)
    db.session.commit()

    return jsonify({
        "message": "Employee created",
        "employee": employee.to_dict(),
    }), 201


@employees_bp.route("/api/employees/<int:employee_id>", methods=["PUT"])
@login_required
@limiter.limit("60 per minute")
def update_employee(employee_id):
    employee = get_employee_for_company(employee_id, session["company_id"])
    if employee is None:
        return jsonify({"error": "Employee not found"}), 404

    employee_data, error_response, status_code = validate_employee_payload(request.get_json() or {})
    if error_response:
        return error_response, status_code

    employee.name = employee_data["name"]
    employee.role = employee_data["role"]
    employee.email = employee_data["email"]
    db.session.commit()

    return jsonify({
        "message": "Employee updated",
        "employee": employee.to_dict(),
    })


@employees_bp.route("/api/employees/<int:employee_id>", methods=["DELETE"])
@login_required
@limiter.limit("30 per minute")
def delete_employee(employee_id):
    employee = get_employee_for_company(employee_id, session["company_id"])
    if employee is None:
        return jsonify({"error": "Employee not found"}), 404

    db.session.delete(employee)
    db.session.commit()
    return jsonify({"message": "Employee deleted"})
