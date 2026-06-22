from werkzeug.security import generate_password_hash, check_password_hash

try:
    from .extensions import db
except ImportError:
    from extensions import db


class Company(db.Model):
    __tablename__ = "companies"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    school = db.Column(db.String(150), nullable=False)

    users = db.relationship("User", backref="company", cascade="all, delete-orphan")
    employees = db.relationship("Employee", backref="company", cascade="all, delete-orphan")
    contacts = db.relationship("Contact", backref="company", cascade="all, delete-orphan")
    products = db.relationship("Product", backref="company", cascade="all, delete-orphan")
    sales = db.relationship("Sale", backref="company", cascade="all, delete-orphan")
    purchases = db.relationship("Purchase", backref="company", cascade="all, delete-orphan")
    sponsors = db.relationship("Sponsor", backref="company", cascade="all, delete-orphan")
    budget = db.relationship(
        "Budget",
        backref="company",
        uselist=False,
        cascade="all, delete-orphan"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "school": self.school,
        }


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey("companies.id"), nullable=False)

    name = db.Column(db.String(150), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(100), default="Daglig leder")

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "id": self.id,
            "companyId": self.company_id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
        }


class Employee(db.Model):
    __tablename__ = "employees"

    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey("companies.id"), nullable=False)

    name = db.Column(db.String(150), nullable=False)
    role = db.Column(db.String(150), nullable=False)
    email = db.Column(db.String(150), default="")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "role": self.role,
            "email": self.email,
        }


class Contact(db.Model):
    __tablename__ = "contacts"

    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey("companies.id"), nullable=False)

    name = db.Column(db.String(150), nullable=False)
    type = db.Column(db.String(80), nullable=False)
    contact = db.Column(db.String(150), default="")
    email = db.Column(db.String(150), default="")
    phone = db.Column(db.String(50), default="")
    notes = db.Column(db.Text, default="")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "type": self.type,
            "contact": self.contact,
            "email": self.email,
            "phone": self.phone,
            "notes": self.notes,
        }


class Product(db.Model):
    __tablename__ = "products"

    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey("companies.id"), nullable=False)

    name = db.Column(db.String(150), nullable=False)
    description = db.Column(db.String(255), default="")
    category = db.Column(db.String(100), default="")
    price = db.Column(db.Float, default=0)
    cost = db.Column(db.Float, default=0)
    stock = db.Column(db.Integer, default=0)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "category": self.category,
            "price": self.price,
            "cost": self.cost,
            "stock": self.stock,
        }


class Sale(db.Model):
    __tablename__ = "sales"

    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey("companies.id"), nullable=False)

    contact_id = db.Column(db.Integer, db.ForeignKey("contacts.id"), nullable=True)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=True)

    customer_name = db.Column(db.String(150), nullable=False)
    product = db.Column(db.String(150), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Float, nullable=False)
    total = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(50), nullable=False)
    date = db.Column(db.String(50), nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "contactId": self.contact_id,
            "productId": self.product_id,
            "customerName": self.customer_name,
            "product": self.product,
            "quantity": self.quantity,
            "price": self.price,
            "total": self.total,
            "status": self.status,
            "date": self.date,
        }


class Purchase(db.Model):
    __tablename__ = "purchases"

    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey("companies.id"), nullable=False)

    contact_id = db.Column(db.Integer, db.ForeignKey("contacts.id"), nullable=True)

    supplier_name = db.Column(db.String(150), nullable=False)
    description = db.Column(db.String(255), nullable=False)
    category = db.Column(db.String(100), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    date = db.Column(db.String(50), nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "contactId": self.contact_id,
            "supplierName": self.supplier_name,
            "description": self.description,
            "category": self.category,
            "amount": self.amount,
            "date": self.date,
        }


class Sponsor(db.Model):
    __tablename__ = "sponsors"

    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey("companies.id"), nullable=False)

    name = db.Column(db.String(150), nullable=False)
    type = db.Column(db.String(80), nullable=False)
    value = db.Column(db.Float, default=0)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "type": self.type,
            "value": self.value,
        }


class Budget(db.Model):
    __tablename__ = "budgets"

    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(
        db.Integer,
        db.ForeignKey("companies.id"),
        nullable=False,
        unique=True
    )

    expected_sales = db.Column(db.Float, default=0)
    expected_sponsors = db.Column(db.Float, default=0)
    expected_purchases = db.Column(db.Float, default=0)
    expected_other_costs = db.Column(db.Float, default=0)

    def to_dict(self):
        return {
            "expectedSales": self.expected_sales,
            "expectedSponsors": self.expected_sponsors,
            "expectedPurchases": self.expected_purchases,
            "expectedOtherCosts": self.expected_other_costs,
        }
