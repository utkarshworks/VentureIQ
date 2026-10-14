"""
Integration tests for FastAPI endpoints: Auth, Models, Scenarios, Reverse Planning, Exports, and Tenant Security.
"""
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_health_check():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/v1/health")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_stateless_simulation_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        payload = {
            "company_name": "Test SaaS",
            "business_model": "b2b_saas",
            "currency": "INR",
            "start_date": "2026-01",
            "planning_horizon": 12,
            "initial_paying_customers": 50,
            "arpu": 4000.0,
            "customer_churn_rate": 0.03,
            "monthly_leads": 1000,
            "lead_conversion_rate": 0.03,
            "cost_per_lead": 200.0,
        }
        response = await ac.post("/api/v1/simulate", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "projections" in data
        assert "summary" in data
        assert len(data["projections"]) == 12
        assert data["summary"]["final_month_arr"] > 0.0


@pytest.mark.asyncio
async def test_auth_registration_and_login():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        reg_payload = {
            "email": "founder1@test.com",
            "password": "SecurePassword123!",
            "full_name": "Test Founder",
            "organization_name": "Acme Ventures",
        }
        res = await ac.post("/api/v1/auth/register", json=reg_payload)
        assert res.status_code == 201
        data = res.json()
        assert "access_token" in data
        assert data["user"]["email"] == "founder1@test.com"

        # Login
        login_payload = {
            "email": "founder1@test.com",
            "password": "SecurePassword123!",
        }
        login_res = await ac.post("/api/v1/auth/login", json=login_payload)
        assert login_res.status_code == 200
        assert "access_token" in login_res.json()


@pytest.mark.asyncio
async def test_model_crud_and_tenant_isolation():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Register User 1
        res1 = await ac.post("/api/v1/auth/register", json={
            "email": "tenant1@test.com",
            "password": "SecurePassword123!",
            "full_name": "User One",
            "organization_name": "Org One",
        })
        token1 = res1.json()["access_token"]
        headers1 = {"Authorization": f"Bearer {token1}"}

        # User 1 creates a model
        model_payload = {
            "name": "Org 1 Growth Model",
            "business_model": "b2b_saas",
            "currency": "INR",
            "start_date": "2026-01",
            "planning_horizon": 12,
            "inputs": {
                "initial_paying_customers": 20,
                "arpu": 5000.0,
            }
        }
        create_res = await ac.post("/api/v1/models", json=model_payload, headers=headers1)
        assert create_res.status_code == 201
        model_id = create_res.json()["id"]

        # User 1 can retrieve model
        get_res1 = await ac.get(f"/api/v1/models/{model_id}", headers=headers1)
        assert get_res1.status_code == 200

        # User 1 executes model run
        run_res = await ac.post(f"/api/v1/models/{model_id}/run", headers=headers1)
        assert run_res.status_code == 200
        assert "summary" in run_res.json()

        # Register User 2 in a different organization
        res2 = await ac.post("/api/v1/auth/register", json={
            "email": "tenant2@test.com",
            "password": "SecurePassword123!",
            "full_name": "User Two",
            "organization_name": "Org Two",
        })
        token2 = res2.json()["access_token"]
        headers2 = {"Authorization": f"Bearer {token2}"}

        # User 2 attempts to access User 1's model -> Must be 404 Not Found (Data Isolation)
        get_res2 = await ac.get(f"/api/v1/models/{model_id}", headers=headers2)
        assert get_res2.status_code == 404


@pytest.mark.asyncio
async def test_exports_csv_and_pdf():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        inputs = {
            "company_name": "Export SaaS",
            "initial_paying_customers": 40,
            "arpu": 3000.0,
        }
        # CSV Export
        csv_res = await ac.post("/api/v1/export/csv", json=inputs)
        assert csv_res.status_code == 200
        assert "Month Index" in csv_res.text
        assert "MRR" in csv_res.text

        # PDF Export
        pdf_res = await ac.post("/api/v1/export/pdf", json=inputs)
        assert pdf_res.status_code == 200
        assert pdf_res.headers["content-type"] == "application/pdf"
        assert len(pdf_res.content) > 1000  # Non-empty valid PDF binary

