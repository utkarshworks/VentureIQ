# VentureIQ

> **Model the business. Understand the trade-offs. Make better decisions.**

VentureIQ is a production-oriented financial decision-making web application designed for startup founders, finance teams, growth leaders, and investors. Unlike static spreadsheets or passive KPI dashboards, VentureIQ connects growth, pricing, retention, hiring, and marketing expenditure directly to deterministic financial consequences (cash runway, net burn, ARR/MRR run rate, profitability, and unit economics).

The defining feature of VentureIQ is **Reverse Planning**: specify a strategic milestone (e.g. ₹1 Crore ARR run rate within 12 months with a maximum cash burn of ₹25 Lakh) and let the engine determine feasibility, solve for bounded assumption sets, and reveal binding operational bottlenecks.

---

## Key Features

- **Deterministic Financial Engine:** 100% deterministic, zero-division safe calculations for MRR, ARR run rate, gross margin, contribution margin, CAC, CAC payback, simplified & cohort LTV, LTV:CAC, net burn, and reserve-aware runway.
- **Reverse Planner (Constrained Optimization):** Bounded optimization using SciPy to work backwards from ARR, MRR, or break-even targets, with independent engine verification and infeasibility bottleneck diagnosis.
- **Scenario Planning:** Compare Base, Optimistic, Downside, and Custom scenarios using a unified financial engine.
- **Cash Flow & Hiring Planner:** Dynamic headcount schedule with employer burden rates, start months, annual increments, and automatic detection of cash-out and reserve-breach periods.
- **Sensitivity Analysis:** 1-variable sweeps, 2-variable matrix tables, and Tornado charts ranking driver elasticity.
- **Assumption & Data Quality Management:** Differentiates observed historical facts, user assumptions, and calculated outputs; supports validated CSV imports with preview and mapping.
- **Reporting & Exports:** Detailed monthly audit tables, interactive Recharts visualizations (supporting Indian Rupee ₹ Lakhs/Crores and global currencies), CSV exports, and executive PDF summaries.
- **Multi-Tenant Security:** Organization and workspace scoping, JWT authentication, and full model history audit trails.
- **Optional AI Explanation Layer:** Contextual narrative insights that explain calculated outputs without ever hallucinating financial formulas.

---

## Architecture Overview

VentureIQ is structured as a modular monorepo:

```
VentureIQ/
├── apps/
│   └── web/                   # Next.js 15+ (React 19 / TypeScript / Tailwind CSS / Recharts)
├── services/
│   └── api/                   # Python 3.12+ / FastAPI / Pydantic / SQLAlchemy / SciPy
│       ├── app/
│       │   ├── api/           # HTTP Endpoints & Route Handlers
│       │   ├── core/          # Config, Security, Middleware, Database Session
│       │   ├── engine/        # PURE FINANCIAL ENGINE (Zero DB/HTTP dependencies)
│       │   ├── models/        # SQLAlchemy ORM Models
│       │   ├── schemas/       # Pydantic v2 Request/Response Data Transfer Objects
│       │   ├── services/      # Business logic orchestration (Scenario, Optimization, Sensitivity)
│       │   └── repositories/  # Data Access Layer & Tenant Scoping
│       ├── migrations/        # Alembic Schema Migrations
│       └── tests/             # Pytest Unit, Integration, & Reconciliation Tests
└── docs/                      # Architectural, Formula, & Operational Documentation
```

---

## Prerequisites

- **Python:** 3.12+ (Python 3.14 compatible)
- **Node.js:** 20.x or 24.x (with npm)
- **PostgreSQL:** 16+ (or SQLite for local zero-dependency testing)
- **Docker & Docker Compose** (optional, for containerized execution)

---

## Installation & Local Development

### 1. Clone & Setup Repository
```bash
git clone https://github.com/ventureiq/ventureiq.git
cd VentureIQ
cp .env.example .env
```

### 2. Backend Setup
```bash
cd services/api

# Create and activate Python virtual environment
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
# source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations (or initialize database)
alembic upgrade head

# Start API server
uvicorn app.main:app --reload --port 8000
```
API Documentation is available interactively at `http://localhost:8000/docs`.

### 3. Frontend Setup
```bash
cd apps/web

# Install npm dependencies
npm install

# Start Next.js development server
npm run dev
```
The web dashboard is accessible at `http://localhost:3000`.

---

## Running Tests

### Backend Financial Engine & API Tests (Pytest)
```bash
cd services/api
pytest -v
```

### Frontend Tests (Vitest)
```bash
cd apps/web
npm run test
```

---

## Documentation Index

- [Product Requirements](docs/PRODUCT_REQUIREMENTS.md)
- [System Architecture](docs/ARCHITECTURE.md)
- [Financial Formulas & Engine Specification](docs/FINANCIAL_FORMULAS.md)
- [Relational Data Model](docs/DATA_MODEL.md)
- [API Specification](docs/API_SPECIFICATION.md)
- [Quality Assurance & Test Plan](docs/TEST_PLAN.md)
- [Deployment & Operations](docs/DEPLOYMENT.md)
- [Roadmap](docs/ROADMAP.md)
- [Changelog](docs/CHANGELOG.md)

---

## Known Limitations

- **Model Scope:** Release 1.0 specifically models recurring-revenue subscription businesses (B2B SaaS, B2C subscriptions). Transactional marketplaces and ad-driven models are reserved for future engine plugins.
- **Cash Receipts:** Revenue collection defaults to month-of-billing; payment term delays (DSO receivables lag) are configurable in advanced settings.
- **AI Explanations:** The AI explanation layer requires a valid API key (`GEMINI_API_KEY` or `OPENAI_API_KEY`) and strictly references computed outputs.

---

## License

MIT License. See [LICENSE](LICENSE) for details.
