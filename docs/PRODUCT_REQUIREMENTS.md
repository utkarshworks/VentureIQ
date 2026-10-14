# VentureIQ: Product Requirements Document (PRD)

## 1. Product Overview

**Product Name:** VentureIQ (VentureMath Engine)  
**Tagline:** *Model the business. Understand the trade-offs. Make better decisions.*  
**Category:** Startup Financial Planning & Unit Economics Decision Intelligence  
**Target Users:** Early-stage Founders, Startup Operators, Finance Teams, Growth Leaders, Advisors, and Investors.

VentureIQ is a production-grade financial decision-making web application designed to connect startup growth, marketing, pricing, retention, and operational hiring decisions directly to deterministic financial consequences (cash runway, burn rate, ARR/MRR run rate, profitability, and unit economics).

---

## 2. Core Value Proposition & Differentiator

Traditional financial tools act as static spreadsheets or passive KPI dashboards—they tell you what happened historically or calculate straightforward linear projections.

**VentureIQ's Defining Feature is Reverse Planning:**
Founders start with a strategic milestone (e.g., reaching ₹1 Crore ARR run rate within 12 months with a maximum cash burn of ₹25 Lakh and maintaining a ₹10 Lakh minimum cash reserve). VentureIQ determines mathematical and operational feasibility, optimizes bounded assumptions (pricing, churn, lead conversion, CAC, gross margin, marketing budget), highlights binding bottlenecks, and outputs actionable, reconciled financial models.

---

## 3. Supported Initial Business Models

For Release 1.0, the calculation engine focuses on recurring revenue:
1. **B2B SaaS** (Subscription tiers, seat/usage approximations, annual/monthly billing, churn & expansion).
2. **B2C Subscriptions** (High lead volume, marketing-funnel conversion, higher monthly churn rates).
3. **Subscription-based Services** (Recurring monthly retainers with higher cost of delivery / variable servicing costs).
4. **Recurring Digital Businesses** (Digital content / membership platforms).

*Scope Boundary:* Marketplaces, usage-based compute meters, and transaction-fee models are explicitly reserved for future engine plugins.

---

## 4. Functional Modules & Requirements

### Module A: Financial Model Builder
- **Business Configuration:** Company name, business model selector, currency (support for INR `₹` with Indian number formatting `₹ Lakh / ₹ Crore` and International currencies USD `$`, EUR `€`, GBP `£`), planning horizon (12 to 36 months, default 12), start date (YYYY-MM).
- **Opening Balances:** Opening paying customers, starting cash balance, minimum cash reserve buffer.
- **Revenue Inputs:** Average monthly price per customer (ARPU), free-to-paid conversion rate (if lead-driven), monthly expansion rate (%), contraction rate (%).
- **Acquisition Inputs:** Two mutually exclusive / cleanly reconciled methods:
  - *Lead-based acquisition:* Monthly leads $\times$ lead-to-paid conversion rate.
  - *Budget-based acquisition:* Monthly marketing budget $\div$ target CAC.
  - Organic/referral customer additions per month.
- **Retention & Churn:** Monthly customer churn rate (%), revenue churn rate (%).
- **Direct Costs (COGS):** Hosting/infrastructure cost, payment processing fees (%), variable customer servicing cost per account.
- **Operating Expenses:** Fixed non-headcount overhead (rent, software/SaaS tools, legal, marketing operations).
- **Financing Events:** Planned equity investments, venture debt, or grants with specific injection months.

### Module B: Deterministic Unit Economics Engine
Provides exact calculation for every month $t$:
- **MRR & ARR Run Rate:** Monthly recurring revenue and annualized run rate ($\text{MRR} \times 12$).
- **Customer Bridge:** Opening customers, churned customers, new customers, closing active customers.
- **Customer Acquisition Cost (CAC):** Total acquisition expenditure $\div$ new customers acquired.
- **Gross Profit & Gross Margin %:** Revenue minus COGS.
- **Contribution Margin & %:** Revenue minus direct variable costs (COGS + variable acquisition/servicing).
- **CAC Payback Period:** $\text{CAC} \div (\text{Monthly Gross Profit per New Customer})$.
- **Customer Lifetime Value (LTV):**
  - *Simplified LTV:* $(\text{Monthly ARPU} \times \text{Gross Margin}) \div \text{Monthly Customer Churn Rate}$.
  - *Cohort-based LTV:* Horizon-limited sum of retention probability $\times$ expected gross profit per customer.
- **LTV:CAC Ratio:** Normalized lifetime value over CAC.
- **Net Burn & Cash Runway:** Cash outflows minus inflows; months until cash breaches the minimum reserve threshold.

### Module C: Growth Simulator
- Monthly step-by-step projection generation across 12-36 months.
- Clean customer rounding policy (deterministic rounding with non-negative lower bounds).
- Separation of accounting revenue recognition from actual cash collections (immediate cash collection standard; configurable collection lags).

### Module D: Scenario Comparison Engine
- Standard scenarios: **Base Case**, **Optimistic Case**, **Downside Case**, plus **Custom User Scenarios**.
- Shared single calculation engine: Scenarios differ strictly by input parameters, eliminating formula discrepancy.
- Comprehensive side-by-side comparison matrix and variance delta indicators.

### Module E: Cash Flow, Headcount & Hiring Planner
- Detailed headcount table: Role title, department, headcount count, monthly salary, employer tax/benefits overhead (%), hire start month, optional annual increment percentage.
- Monthly payroll rollout and cash outflow reconciliation.
- Detection of exact "Cash Out" month and "Reserve Breach" month.

### Module F: Reverse Planner (Constrained Optimization)
- Target goals: Target ARR run rate, target MRR, break-even month, target LTV:CAC, target revenue within budget.
- Input bounds: User defines allowable lower and upper ranges for variables (Price, Churn, Conversion, CAC, Gross Margin, Marketing Spend).
- Solver: Deterministic bounded optimization (SciPy / SLSQP / L-BFGS-B / grid evaluation) with hard feasibility validation.
- Infeasibility diagnostic: When a target cannot be reached within specified bounds, explains which constraint is binding.

### Module G: Sensitivity Analysis
- One-variable sensitivity: Impact of sweeping a single driver across $\pm 10\%$, $\pm 20\%$, $\pm 30\%$.
- Two-variable sensitivity matrix (e.g., Conversion Rate vs. Pricing or Churn vs. CAC).
- Tornado chart ranking: Sensitivity elasticity ranking showing highest leverage drivers.

### Module H: Historical Data & Assumption Management
- Input classification: `OBSERVED_DATA` (historical facts), `USER_ASSUMPTION` (planning estimates), `MODEL_OUTPUT` (derived).
- CSV import with template download, column mapping, validation, duplicate checking, and user preview before overwrite.

### Module I: Reporting, Dashboards & Exporting
- Responsive financial dashboard with KPI summary cards, interactive charts (Recharts), and full monthly audit tables.
- Formatted currency rendering (support for Indian Lakhs/Crores `₹1,00,000` / `₹1,00,00,000`).
- CSV export of monthly projections and assumptions.
- Professional PDF financial summary report generation.

### Module J: User Authentication, Security & Workspaces
- Multi-tenant architecture: Users belong to Organizations/Workspaces.
- Row-level ownership validation on every model, scenario, run, and export.
- Secure password hashing (Argon2 / bcrypt) and JWT session handling.

### Module K: AI Explanation & Advisory Layer
- Optional post-processing explanation: Context-aware natural language explanations of calculated outputs.
- Guardrail: AI never calculates financial math or generates unsubstantiated forecasts. All explanations cite deterministic model outputs.
