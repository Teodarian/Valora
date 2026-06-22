import os
import tempfile
import unittest

from Vendera.app import create_app
from Vendera.config import TestingConfig
from Vendera.extensions import db
from Vendera.models import Company


class IntegrationTestConfig(TestingConfig):
    SECRET_KEY = "test-secret-key"


class AppTestCase(unittest.TestCase):
    def setUp(self):
        self.database_file = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
        self.database_file.close()

        IntegrationTestConfig.SQLALCHEMY_DATABASE_URI = f"sqlite:///{self.database_file.name}"
        self.app = create_app(IntegrationTestConfig)
        self.client = self.app.test_client()

        with self.app.app_context():
            db.create_all()

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

        if os.path.exists(self.database_file.name):
            os.unlink(self.database_file.name)

    def test_health_endpoint_reports_ok(self):
        response = self.client.get("/health")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["status"], "ok")
        self.assertEqual(response.get_json()["environment"], "testing")
        self.assertEqual(response.headers["X-Content-Type-Options"], "nosniff")
        self.assertIn("default-src 'self'", response.headers["Content-Security-Policy"])
        self.assertIn("vendera_csrf_token=", response.headers.get("Set-Cookie", ""))

    def get_csrf_headers(self):
        response = self.client.get("/health")
        csrf_cookie = response.headers.get("Set-Cookie", "")
        token = csrf_cookie.split("vendera_csrf_token=", 1)[1].split(";", 1)[0]
        return {"X-CSRF-Token": token}

    def register_and_authenticate(self):
        headers = self.get_csrf_headers()
        response = self.client.post(
            "/api/register",
            json={
                "companyName": "Valora Test",
                "school": "Test School",
                "userName": "Teo",
                "email": "teo@example.com",
                "password": "password123",
            },
            headers=headers,
        )
        return response, headers

    def test_register_creates_user_and_company(self):
        response, _ = self.register_and_authenticate()

        payload = response.get_json()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload["message"], "Elevbedrift registrert")
        self.assertEqual(payload["user"]["email"], "teo@example.com")
        self.assertEqual(payload["company"]["name"], "Valora Test")
        self.assertEqual(payload["employees"], [])
        self.assertEqual(payload["contacts"], [])
        self.assertEqual(payload["products"], [])
        self.assertEqual(payload["purchases"], [])
        self.assertEqual(payload["sales"], [])
        self.assertEqual(payload["sponsors"], [])
        self.assertEqual(payload["budget"]["expectedSales"], 0)

    def test_register_requires_json_requests(self):
        headers = self.get_csrf_headers()
        response = self.client.post(
            "/api/register",
            data="companyName=Valora",
            content_type="application/x-www-form-urlencoded",
            headers=headers,
        )

        payload = response.get_json()

        self.assertEqual(response.status_code, 415)
        self.assertEqual(payload["status"], 415)
        self.assertEqual(payload["error"], "Unsupported Media Type")

    def test_register_requires_csrf_token(self):
        response = self.client.post(
            "/api/register",
            json={
                "companyName": "Valora Test",
                "school": "Test School",
                "userName": "Teo",
                "email": "teo@example.com",
                "password": "password123",
            },
        )

        payload = response.get_json()

        self.assertEqual(response.status_code, 403)
        self.assertEqual(payload["status"], 403)
        self.assertEqual(payload["error"], "Forbidden")

    def test_me_includes_employees(self):
        self.register_and_authenticate()

        response = self.client.get("/api/me")
        payload = response.get_json()

        self.assertEqual(response.status_code, 200)
        self.assertIn("employees", payload)
        self.assertEqual(payload["employees"], [])
        self.assertIn("contacts", payload)
        self.assertEqual(payload["contacts"], [])
        self.assertIn("products", payload)
        self.assertEqual(payload["products"], [])
        self.assertIn("purchases", payload)
        self.assertEqual(payload["purchases"], [])
        self.assertIn("sales", payload)
        self.assertEqual(payload["sales"], [])
        self.assertIn("sponsors", payload)
        self.assertEqual(payload["sponsors"], [])
        self.assertIn("budget", payload)
        self.assertEqual(payload["budget"]["expectedSales"], 0)

    def test_company_update_flow(self):
        _, headers = self.register_and_authenticate()

        get_response = self.client.get("/api/company")
        get_payload = get_response.get_json()

        self.assertEqual(get_response.status_code, 200)
        self.assertEqual(get_payload["company"]["name"], "Valora Test")
        self.assertEqual(get_payload["company"]["school"], "Test School")

        update_response = self.client.put(
            "/api/company",
            json={
                "name": "Valora Updated",
                "school": "Updated School",
            },
            headers=headers,
        )
        update_payload = update_response.get_json()

        self.assertEqual(update_response.status_code, 200)
        self.assertEqual(update_payload["company"]["name"], "Valora Updated")
        self.assertEqual(update_payload["company"]["school"], "Updated School")

        me_response = self.client.get("/api/me")
        me_payload = me_response.get_json()

        self.assertEqual(me_response.status_code, 200)
        self.assertEqual(me_payload["company"]["name"], "Valora Updated")
        self.assertEqual(me_payload["company"]["school"], "Updated School")

    def test_company_delete_flow(self):
        _, headers = self.register_and_authenticate()

        with self.app.app_context():
            self.assertEqual(Company.query.count(), 1)

        wrong_confirmation_response = self.client.delete(
            "/api/company",
            json={"confirmationName": "Wrong Name"},
            headers=headers,
        )
        wrong_confirmation_payload = wrong_confirmation_response.get_json()

        self.assertEqual(wrong_confirmation_response.status_code, 400)
        self.assertEqual(wrong_confirmation_payload["error"], "Company name confirmation does not match")

        delete_response = self.client.delete(
            "/api/company",
            json={"confirmationName": "Valora Test"},
            headers=headers,
        )
        delete_payload = delete_response.get_json()

        self.assertEqual(delete_response.status_code, 200)
        self.assertEqual(delete_payload["message"], "Company deleted")

        with self.app.app_context():
            self.assertEqual(Company.query.count(), 0)

        me_response = self.client.get("/api/me")
        me_payload = me_response.get_json()

        self.assertEqual(me_response.status_code, 401)
        self.assertEqual(me_payload["error"], "Not logged in")

    def test_employee_crud_flow(self):
        _, headers = self.register_and_authenticate()

        create_response = self.client.post(
            "/api/employees",
            json={
                "name": "Alex",
                "role": "Designer",
                "email": "alex@example.com",
            },
            headers=headers,
        )
        create_payload = create_response.get_json()

        self.assertEqual(create_response.status_code, 201)
        self.assertEqual(create_payload["employee"]["name"], "Alex")

        employee_id = create_payload["employee"]["id"]

        list_response = self.client.get("/api/employees")
        list_payload = list_response.get_json()

        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(len(list_payload["employees"]), 1)
        self.assertEqual(list_payload["employees"][0]["role"], "Designer")

        update_response = self.client.put(
            f"/api/employees/{employee_id}",
            json={
                "name": "Alex",
                "role": "Daglig leder",
                "email": "alex@example.com",
            },
            headers=headers,
        )
        update_payload = update_response.get_json()

        self.assertEqual(update_response.status_code, 200)
        self.assertEqual(update_payload["employee"]["role"], "Daglig leder")

        delete_response = self.client.delete(
            f"/api/employees/{employee_id}",
            headers=headers,
        )

        self.assertEqual(delete_response.status_code, 200)

        final_list_response = self.client.get("/api/employees")
        final_list_payload = final_list_response.get_json()

        self.assertEqual(final_list_response.status_code, 200)
        self.assertEqual(final_list_payload["employees"], [])

    def test_contact_crud_flow(self):
        _, headers = self.register_and_authenticate()

        create_response = self.client.post(
            "/api/contacts",
            json={
                "name": "Acme AS",
                "type": "Kunde",
                "contact": "Alex",
                "email": "alex@acme.no",
                "phone": "12345678",
                "notes": "Important customer",
            },
            headers=headers,
        )
        create_payload = create_response.get_json()

        self.assertEqual(create_response.status_code, 201)
        self.assertEqual(create_payload["contact"]["name"], "Acme AS")

        contact_id = create_payload["contact"]["id"]

        list_response = self.client.get("/api/contacts")
        list_payload = list_response.get_json()

        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(len(list_payload["contacts"]), 1)
        self.assertEqual(list_payload["contacts"][0]["type"], "Kunde")

        update_response = self.client.put(
            f"/api/contacts/{contact_id}",
            json={
                "name": "Acme AS",
                "type": "Sponsor",
                "contact": "Alex",
                "email": "alex@acme.no",
                "phone": "12345678",
                "notes": "Updated",
            },
            headers=headers,
        )
        update_payload = update_response.get_json()

        self.assertEqual(update_response.status_code, 200)
        self.assertEqual(update_payload["contact"]["type"], "Sponsor")

        delete_response = self.client.delete(
            f"/api/contacts/{contact_id}",
            headers=headers,
        )

        self.assertEqual(delete_response.status_code, 200)

        final_list_response = self.client.get("/api/contacts")
        final_list_payload = final_list_response.get_json()

        self.assertEqual(final_list_response.status_code, 200)
        self.assertEqual(final_list_payload["contacts"], [])

    def test_product_crud_flow(self):
        _, headers = self.register_and_authenticate()

        create_response = self.client.post(
            "/api/products",
            json={
                "name": "T-skjorte",
                "description": "Bomull",
                "category": "Klær",
                "price": 199,
                "cost": 90,
                "stock": 12,
            },
            headers=headers,
        )
        create_payload = create_response.get_json()

        self.assertEqual(create_response.status_code, 201)
        self.assertEqual(create_payload["product"]["name"], "T-skjorte")

        product_id = create_payload["product"]["id"]

        list_response = self.client.get("/api/products")
        list_payload = list_response.get_json()

        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(len(list_payload["products"]), 1)
        self.assertEqual(list_payload["products"][0]["category"], "Klær")

        update_response = self.client.put(
            f"/api/products/{product_id}",
            json={
                "name": "T-skjorte premium",
                "description": "Bomull",
                "category": "Klær",
                "price": 249,
                "cost": 110,
                "stock": 8,
            },
            headers=headers,
        )
        update_payload = update_response.get_json()

        self.assertEqual(update_response.status_code, 200)
        self.assertEqual(update_payload["product"]["name"], "T-skjorte premium")
        self.assertEqual(update_payload["product"]["stock"], 8)

        delete_response = self.client.delete(
            f"/api/products/{product_id}",
            headers=headers,
        )

        self.assertEqual(delete_response.status_code, 200)

        final_list_response = self.client.get("/api/products")
        final_list_payload = final_list_response.get_json()

        self.assertEqual(final_list_response.status_code, 200)
        self.assertEqual(final_list_payload["products"], [])

    def test_sale_crud_flow_updates_stock(self):
        _, headers = self.register_and_authenticate()

        product_response = self.client.post(
            "/api/products",
            json={
                "name": "T-skjorte",
                "description": "Bomull",
                "category": "KlÃ¦r",
                "price": 199,
                "cost": 90,
                "stock": 10,
            },
            headers=headers,
        )
        product_id = product_response.get_json()["product"]["id"]

        create_response = self.client.post(
            "/api/sales",
            json={
                "customerName": "Walk-in kunde",
                "productId": product_id,
                "quantity": 2,
                "price": 199,
                "status": "Betalt",
            },
            headers=headers,
        )
        create_payload = create_response.get_json()

        self.assertEqual(create_response.status_code, 201)
        self.assertEqual(create_payload["sale"]["quantity"], 2)
        self.assertEqual(create_payload["products"][0]["stock"], 8)

        sale_id = create_payload["sale"]["id"]

        list_response = self.client.get("/api/sales")
        list_payload = list_response.get_json()

        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(len(list_payload["sales"]), 1)
        self.assertEqual(list_payload["sales"][0]["productId"], product_id)

        update_response = self.client.put(
            f"/api/sales/{sale_id}",
            json={
                "customerName": "Walk-in kunde",
                "productId": product_id,
                "quantity": 3,
                "price": 199,
                "status": "Betalt",
            },
            headers=headers,
        )
        update_payload = update_response.get_json()

        self.assertEqual(update_response.status_code, 200)
        self.assertEqual(update_payload["sale"]["quantity"], 3)
        self.assertEqual(update_payload["products"][0]["stock"], 7)

        delete_response = self.client.delete(
            f"/api/sales/{sale_id}",
            headers=headers,
        )
        delete_payload = delete_response.get_json()

        self.assertEqual(delete_response.status_code, 200)
        self.assertEqual(delete_payload["products"][0]["stock"], 10)

        final_list_response = self.client.get("/api/sales")
        final_list_payload = final_list_response.get_json()

        self.assertEqual(final_list_response.status_code, 200)
        self.assertEqual(final_list_payload["sales"], [])

    def test_sale_creation_rejects_insufficient_stock(self):
        _, headers = self.register_and_authenticate()

        product_response = self.client.post(
            "/api/products",
            json={
                "name": "T-skjorte",
                "description": "Bomull",
                "category": "KlÃ¦r",
                "price": 199,
                "cost": 90,
                "stock": 1,
            },
            headers=headers,
        )
        product_id = product_response.get_json()["product"]["id"]

        create_response = self.client.post(
            "/api/sales",
            json={
                "customerName": "Walk-in kunde",
                "productId": product_id,
                "quantity": 2,
                "price": 199,
                "status": "Betalt",
            },
            headers=headers,
        )
        create_payload = create_response.get_json()

        self.assertEqual(create_response.status_code, 400)
        self.assertEqual(create_payload["error"], "Not enough stock available")

    def test_purchase_crud_flow(self):
        _, headers = self.register_and_authenticate()

        create_response = self.client.post(
            "/api/purchases",
            json={
                "supplierName": "Leverandor AS",
                "description": "Stoff",
                "category": "Materialer",
                "amount": 500,
            },
            headers=headers,
        )
        create_payload = create_response.get_json()

        self.assertEqual(create_response.status_code, 201)
        self.assertEqual(create_payload["purchase"]["supplierName"], "Leverandor AS")

        purchase_id = create_payload["purchase"]["id"]

        list_response = self.client.get("/api/purchases")
        list_payload = list_response.get_json()

        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(len(list_payload["purchases"]), 1)
        self.assertEqual(list_payload["purchases"][0]["category"], "Materialer")

        update_response = self.client.put(
            f"/api/purchases/{purchase_id}",
            json={
                "supplierName": "Leverandor AS",
                "description": "Stoff og utstyr",
                "category": "Utstyr",
                "amount": 750,
            },
            headers=headers,
        )
        update_payload = update_response.get_json()

        self.assertEqual(update_response.status_code, 200)
        self.assertEqual(update_payload["purchase"]["category"], "Utstyr")
        self.assertEqual(update_payload["purchase"]["amount"], 750)

        delete_response = self.client.delete(
            f"/api/purchases/{purchase_id}",
            headers=headers,
        )

        self.assertEqual(delete_response.status_code, 200)

        final_list_response = self.client.get("/api/purchases")
        final_list_payload = final_list_response.get_json()

        self.assertEqual(final_list_response.status_code, 200)
        self.assertEqual(final_list_payload["purchases"], [])

    def test_sponsor_crud_flow(self):
        _, headers = self.register_and_authenticate()

        create_response = self.client.post(
            "/api/sponsors",
            json={
                "name": "Sparebanken",
                "type": "Penger",
                "value": 2500,
            },
            headers=headers,
        )
        create_payload = create_response.get_json()

        self.assertEqual(create_response.status_code, 201)
        self.assertEqual(create_payload["sponsor"]["name"], "Sparebanken")

        sponsor_id = create_payload["sponsor"]["id"]

        list_response = self.client.get("/api/sponsors")
        list_payload = list_response.get_json()

        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(len(list_payload["sponsors"]), 1)
        self.assertEqual(list_payload["sponsors"][0]["type"], "Penger")

        update_response = self.client.put(
            f"/api/sponsors/{sponsor_id}",
            json={
                "name": "Sparebanken",
                "type": "Tjeneste",
                "value": 3000,
            },
            headers=headers,
        )
        update_payload = update_response.get_json()

        self.assertEqual(update_response.status_code, 200)
        self.assertEqual(update_payload["sponsor"]["type"], "Tjeneste")
        self.assertEqual(update_payload["sponsor"]["value"], 3000)

        delete_response = self.client.delete(
            f"/api/sponsors/{sponsor_id}",
            headers=headers,
        )

        self.assertEqual(delete_response.status_code, 200)

        final_list_response = self.client.get("/api/sponsors")
        final_list_payload = final_list_response.get_json()

        self.assertEqual(final_list_response.status_code, 200)
        self.assertEqual(final_list_payload["sponsors"], [])

    def test_budget_update_flow(self):
        _, headers = self.register_and_authenticate()

        get_response = self.client.get("/api/budget")
        get_payload = get_response.get_json()

        self.assertEqual(get_response.status_code, 200)
        self.assertEqual(get_payload["budget"]["expectedSales"], 0)

        update_response = self.client.put(
            "/api/budget",
            json={
                "expectedSales": 10000,
                "expectedSponsors": 2000,
                "expectedPurchases": 3000,
                "expectedOtherCosts": 500,
            },
            headers=headers,
        )
        update_payload = update_response.get_json()

        self.assertEqual(update_response.status_code, 200)
        self.assertEqual(update_payload["budget"]["expectedSales"], 10000)
        self.assertEqual(update_payload["budget"]["expectedOtherCosts"], 500)


if __name__ == "__main__":
    unittest.main()
