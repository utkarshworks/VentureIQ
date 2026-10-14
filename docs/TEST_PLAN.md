# VentureIQ: Quality Assurance & Test Plan

## 1. Quality Strategy & Objectives
Financial calculation correctness is non-negotiable. An incorrect number in a decision model is worse than a system crash.

Testing is tiered across four rigorous layers:
1. **Mathematical Unit Tests (Pure Engine):** Every financial formula tested in isolation under normal, edge, and pathological conditions.
2. **Financial Reconciliation & Accounting Invariant Tests:** Projections verified against fundamental accounting and balance-sheet identities.
3. **Integration & API Service Tests:** FastAPI endpoints, authorization scopes, multi-tenant isolation, database migrations, and export formats.
4. **End-to-End Browser & Component Tests:** Vitest component tests and Playwright end-to-end tests for core user journeys.

---

## 2. Calculation Engine Invariants (Pytest)

Every model projection $t \in [1, H]$ must satisfy these invariants:
- **Customer Bridge Reconciliation:**
  $$\text{ClosingCustomers}_t == \text{OpeningCustomers}_t - \text{ChurnedCustomers}_t + \text{NewCustomers}_t$$
- **Gross Profit Invariant:**
  $$\text{GrossProfit}_t == \text{MRR}_t - \text{COGS}_t$$
- **Cash Flow Reconciliation:**
  $$\text{EndingCash}_t == \text{BeginningCash}_t + \text{CashInflows}_t - \text{CashOutflows}_t$$
  $$\text{BeginningCash}_{t+1} == \text{EndingCash}_t$$
- **Net Burn Invariant:**
  $$\text{NetBurn}_t == \max(0, \, \text{CashOutflows}_t - \text{CashInflows}_t)$$
- **Non-Negative Constraints:**
  $$\text{Customers}_t \ge 0, \quad \text{MRR}_t \ge 0$$
- **Zero-Division Handlers:**
  $$\text{CAC} \to \text{None if NewCustomers} == 0$$
  $$\text{LTV:CAC} \to \text{None if CAC} == 0 \text{ or None}$$
  $$\text{Payback} \to \text{None if GrossProfit} \le 0$$

---

## 3. Mandatory Edge Case Test Suite

| Test Identifier | Scenario Tested | Expected Engine Behavior |
| :--- | :--- | :--- |
| `TC_EDGE_01` | Zero opening customers, zero leads | All revenue is 0.0, churn is 0, closing is 0. No NaN or ZeroDivisionError. |
| `TC_EDGE_02` | Zero customer churn (0.0%) | Customer base monotonically increases. Simplified LTV flagged as infinite/horizon-capped. |
| `TC_EDGE_03` | 100% customer churn | Entire customer base drops to 0 at month start before new acquisitions. |
| `TC_EDGE_04` | Zero acquisition spend | Organic additions only; Blended CAC returns `None` (undefined). |
| `TC_EDGE_05` | Negative cash balance (Insolvency) | Engine continues math, tracks exact negative cash, flags Runway = breached in month $t$. |
| `TC_EDGE_06` | Negative contribution margin | Variable costs exceed price; Break-even revenue returns `None` with negative unit economics warning. |
| `TC_EDGE_07` | Extreme values | Very high values (e.g. ₹100,000,000 ARPU, 10,000,000 leads) calculate without overflow. |
| `TC_EDGE_08` | Reverse planner: Impossible Target | Target ₹50 Crore ARR with ₹5 Lakh budget and max CAC ₹10k. Solver terminates with `feasible: false` and identifies binding constraint. |
| `TC_EDGE_09` | Reverse planner: Feasible Target | Solver identifies parameter combination within $[\mathbf{l}, \mathbf{u}]$ and engine verification passes 100%. |

---

## 4. Multi-Tenant Authorization Tests

- **Tenant Isolation:** User A creates Model 1 under Org A. User B under Org B attempts to `GET /api/v1/models/{Model_1_ID}` $\to$ Must return `404 Not Found` or `403 Forbidden`.
- **Injection Safety:** Ensure all ORM queries filter through tenant foreign key.
- **Export Ownership:** Exporting CSV or PDF requires matching user organization.

---

## 5. End-to-End User Journeys (Playwright & Vitest)

1. **Journey 1: Model Creation & Live Simulation**
   - User inputs B2B SaaS parameters, modifies conversion rate slider, verifies charts update immediately without latency.
2. **Journey 2: Scenario Comparison**
   - User navigates to Scenarios, creates Optimistic & Downside, verifies scenario comparison matrix.
3. **Journey 3: Reverse Planning Flow**
   - User specifies ₹1 Crore ARR target in 12 months with ₹25L cash budget.
   - User runs reverse plan, inspects proposed bounded values, and saves feasible solution as a scenario.
4. **Journey 4: Export Verification**
   - User triggers CSV export and PDF export; downloads verified for valid content headers and structural integrity.
