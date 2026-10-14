# Changelog

All notable changes to the VentureIQ platform are documented in this file.

## [1.0.0] - 2026-10-14
### Initial Release
- **Architecture & Foundation:** Monorepo initialized with Next.js frontend, FastAPI backend, and standalone pure Python financial engine.
- **Financial Calculation Engine:** Deterministic calculation of MRR, ARR run rate, Customer bridge, Gross Margin, Contribution Margin, CAC, Payback, Simplified & Cohort LTV, and Cash Runway.
- **Reverse Planner:** Constrained optimization solver with bounded search, feasibility validation, and bottleneck identification.
- **Scenario Planning:** Unified multi-scenario simulation engine for Base, Optimistic, Downside, and Custom scenarios.
- **Cash & Headcount Engine:** Dynamic hiring schedule with payroll tax burden and reserve breach detection.
- **Visual Interface:** Responsive dashboard with Indian Rupee formatting (Lakhs/Crores) and international currency support, interactive Recharts, and monthly audit tables.
- **Persistence & Security:** Multi-tenant organization scoping, JWT authentication, and model history persistence.
- **Reporting & Data Tools:** CSV imports with preview/column mapping, CSV export, and PDF executive summary reports.
- **Testing & Verification:** Comprehensive Pytest and Vitest test suites covering edge cases, invariant checks, and optimization feasibility.
