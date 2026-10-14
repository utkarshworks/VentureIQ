# VentureIQ: REST API Specification

## 1. API Architecture & Standards
- **Base URL:** `/api/v1`
- **Protocol:** HTTP/2 over TLS (HTTPS)
- **Data Exchange Format:** JSON (`application/json`)
- **Authentication:** Bearer JWT in `Authorization` header (`Bearer <access_token>`)
- **Error Standard:** RFC 7807 Problem Details for HTTP APIs

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Conversion rate cannot exceed 1.0 (100%)",
    "details": [{"field": "lead_conversion_rate", "issue": "Value 1.4 exceeds upper limit 1.0"}]
  }
}
```

---

## 2. Authentication & Workspace Endpoints

### 2.1 `POST /api/v1/auth/register`
Creates user account and default personal workspace organization.
- **Request:**
  ```json
  {
    "email": "founder@ventureiq.io",
    "password": "SecurePassword123!",
    "full_name": "Rohan Gupta",
    "organization_name": "Acme SaaS"
  }
  ```
- **Response:** `201 Created`
  ```json
  {
    "user": { "id": "uuid", "email": "founder@ventureiq.io", "full_name": "Rohan Gupta" },
    "organization": { "id": "uuid", "name": "Acme SaaS", "role": "owner" },
    "access_token": "jwt_token_string",
    "token_type": "bearer"
  }
  ```

### 2.2 `POST /api/v1/auth/login`
- **Request:** OAuth2 password form or JSON `{ "email": "...", "password": "..." }`
- **Response:** `200 OK` with access token and profile info.

---

## 3. Financial Models Management

### 3.1 `GET /api/v1/models`
Lists all financial models belonging to user's organization.

### 3.2 `POST /api/v1/models`
Creates a new financial model with default or custom assumption vectors.
- **Request:**
  ```json
  {
    "name": "B2B SaaS Core Model 2026",
    "business_model": "b2b_saas",
    "currency": "INR",
    "start_date": "2026-01",
    "planning_horizon": 12,
    "initial_paying_customers": 50,
    "initial_cash_balance": 5000000.0,
    "minimum_cash_reserve": 1000000.0,
    "arpu": 4500.0,
    "customer_churn_rate": 0.03,
    "acquisition_mode": "lead_based",
    "monthly_leads": 1200,
    "lead_conversion_rate": 0.04,
    "cost_per_lead": 250.0,
    "payment_processing_rate": 0.025,
    "hosting_fixed_cost": 40000.0,
    "servicing_cost_per_customer": 120.0,
    "fixed_opex": 150000.0
  }
  ```
- **Response:** `201 Created` with full model details, ID, and initialized Base Case scenario.

### 3.3 `GET /api/v1/models/{model_id}`
Retrieves model configuration, active inputs, and scenario list.

### 3.4 `PATCH /api/v1/models/{model_id}`
Updates baseline configuration or assumptions.

---

## 4. Financial Engine Simulation Endpoints

### 4.1 `POST /api/v1/models/{model_id}/run`
Executes simulation for a saved model and scenario, records a `model_run`, and returns monthly projections and unit economics.
- **Query Params:** `scenario_id` (optional, defaults to Base Case).
- **Response:** `200 OK`
  ```json
  {
    "run_id": "uuid",
    "scenario_id": "uuid",
    "engine_version": "1.0.0",
    "summary": {
      "month_12_arr": 11520000.0,
      "month_12_mrr": 960000.0,
      "month_12_customers": 213,
      "ending_cash": 3450000.0,
      "peak_cash_deficit": 1550000.0,
      "runway_months": 28,
      "blended_cac": 6250.0,
      "simplified_ltv": 135000.0,
      "ltv_to_cac_ratio": 21.6,
      "cac_payback_months": 1.54,
      "break_even_month": 8
    },
    "monthly_projections": [
      {
        "month_index": 1,
        "period": "2026-01",
        "opening_customers": 50,
        "churned_customers": 2,
        "new_customers": 48,
        "closing_customers": 96,
        "mrr": 432000.0,
        "arr_run_rate": 5184000.0,
        "gross_profit": 388800.0,
        "gross_margin_pct": 0.90,
        "cogs": 43200.0,
        "payroll": 450000.0,
        "acquisition_spend": 300000.0,
        "fixed_opex": 150000.0,
        "total_opex": 900000.0,
        "net_profit": -554400.0,
        "beginning_cash": 5000000.0,
        "cash_inflows": 432000.0,
        "cash_outflows": 943200.0,
        "ending_cash": 4488800.0,
        "net_burn": 511200.0,
        "cac": 6250.0,
        "cac_payback": 1.54
      }
    ],
    "warnings": []
  }
  ```

### 4.2 `POST /api/v1/simulate` (Pure Stateless Simulation)
Accepts arbitrary input vector and returns full calculation trajectory without requiring database authentication or persistence. Used for real-time frontend slider responsiveness.

---

## 5. Scenario Comparison Endpoints

### 5.1 `POST /api/v1/models/{model_id}/scenarios`
Creates an Optimistic, Downside, or Custom scenario with input overrides.

### 5.2 `POST /api/v1/models/{model_id}/compare`
Executes and compares Base, Optimistic, Downside, and custom scenarios simultaneously.
- **Response:** Detailed multi-column scenario comparison table and delta analysis.

---

## 6. Reverse Planning & Optimization Endpoints

### 6.1 `POST /api/v1/models/{model_id}/reverse-plan`
Executes constrained bounded optimization to solve for target outcome.
- **Request:**
  ```json
  {
    "goal": "target_arr_run_rate",
    "target_value": 10000000.0,
    "target_month": 12,
    "minimum_cash_reserve": 1000000.0,
    "max_cumulative_cash_burn": 4000000.0,
    "adjustable_variables": [
      { "name": "arpu", "min_value": 3000.0, "max_value": 7000.0 },
      { "name": "lead_conversion_rate", "min_value": 0.02, "max_value": 0.07 },
      { "name": "customer_churn_rate", "min_value": 0.015, "max_value": 0.045 },
      { "name": "monthly_marketing_budget", "min_value": 150000.0, "max_value": 450000.0 }
    ]
  }
  ```
- **Response:**
  ```json
  {
    "feasible": true,
    "status": "OPTIMAL_SOLUTION_FOUND",
    "solution_assumptions": {
      "arpu": 5200.0,
      "lead_conversion_rate": 0.052,
      "customer_churn_rate": 0.024,
      "monthly_marketing_budget": 310000.0
    },
    "projected_summary": {
      "achieved_arr": 10048000.0,
      "month_12_customers": 161,
      "minimum_cash_balance": 1840000.0,
      "total_cash_consumed": 3160000.0
    },
    "binding_constraints": ["lead_conversion_rate near upper bound"],
    "independent_verification_passed": true
  }
  ```

---

## 7. Sensitivity Analysis Endpoints

### 7.1 `POST /api/v1/models/{model_id}/sensitivity`
Computes 1-variable sweeps, 2-variable matrix grids, and Tornado chart sensitivity rankings.

---

## 8. Export Endpoints

### 8.1 `GET /api/v1/models/{model_id}/export/csv?type=projections|assumptions|scenarios`
Returns streaming CSV download with headers `Content-Disposition: attachment; filename="ventureiq_model_projections.csv"`.

### 8.2 `GET /api/v1/models/{model_id}/export/pdf`
Returns formatted financial executive summary PDF.
