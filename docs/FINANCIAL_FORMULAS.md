# VentureIQ: Financial Formulas and Calculation Engine Specification

## 1. Guiding Principles & Conventions
1. **Determinism:** Given identical model inputs, the engine must produce bit-for-bit identical outputs.
2. **Safety Against Division by Zero:** When a denominator is zero, the engine must never return `inf`, `-inf`, or `NaN`. It returns `None` (or `0.0` with an explicit status flag `status: UNDEFINED` and documented explanation).
3. **Accounting vs. Cash:** Revenue is recognized over the subscription period; cash is received based on payment terms (default: month of transaction $t$).
4. **Rounding Policy:** Customer counts are tracked as real numbers internally for exact math and rounded using half-up integer rounding (`round(val + 1e-9)`) for customer bridge reporting, ensuring:
   $$\text{Closing Customers}_t = \text{Opening Customers}_t - \text{Churned Customers}_t + \text{New Customers}_t$$
   without drift.

---

## 2. Customer Movement Bridge

For month $t \in [1, H]$ where $H$ is planning horizon in months:

### 2.1 Opening Customers
$$\text{OpeningCustomers}_1 = \text{InitialPayingCustomers}$$
$$\text{OpeningCustomers}_t = \text{ClosingCustomers}_{t-1} \quad (t > 1)$$

### 2.2 Customer Churn
$$\text{ChurnedCustomers}_t = \min(\text{OpeningCustomers}_t, \, \text{OpeningCustomers}_t \times \text{CustomerChurnRate}_t)$$
*Note:* Churn is assessed on opening customer base.

### 2.3 New Customer Acquisition
Depending on chosen acquisition mode:
- **Lead-Based Acquisition:**
  $$\text{NewCustomers}_t = \text{OrganicCustomers}_t + (\text{Leads}_t \times \text{LeadConversionRate}_t)$$
- **Budget-Based Acquisition:**
  $$\text{NewCustomers}_t = \text{OrganicCustomers}_t + \begin{cases} 
  \frac{\text{AcquisitionBudget}_t}{\text{TargetCAC}_t} & \text{if } \text{TargetCAC}_t > 0 \\
  0 & \text{if } \text{TargetCAC}_t = 0 
  \end{cases}$$

### 2.4 Closing Customers
$$\text{ClosingCustomers}_t = \max(0, \, \text{OpeningCustomers}_t - \text{ChurnedCustomers}_t + \text{NewCustomers}_t)$$

### 2.5 Average Active Customers
$$\text{AvgActiveCustomers}_t = \frac{\text{OpeningCustomers}_t + \text{ClosingCustomers}_t}{2}$$

---

## 3. Revenue Metrics

### 3.1 Monthly Recurring Revenue (MRR)
$$\text{BaseMRR}_t = \text{AvgActiveCustomers}_t \times \text{ARPU}_t$$
$$\text{ExpansionMRR}_t = \text{OpeningCustomers}_t \times \text{ARPU}_t \times \text{ExpansionRate}_t$$
$$\text{ContractionMRR}_t = \text{OpeningCustomers}_t \times \text{ARPU}_t \times \text{ContractionRate}_t$$
$$\text{MRR}_t = \max(0, \, \text{BaseMRR}_t + \text{ExpansionMRR}_t - \text{ContractionMRR}_t)$$

### 3.2 Annual Recurring Revenue (ARR Run Rate)
For subscription businesses:
$$\text{ARRRunRate}_t = \text{MRR}_t \times 12$$
*(Explicit disclosure: This represents the annualized recurring run rate at month $t$, not contracted cumulative 12-month trailing revenue).*

---

## 4. Cost Structure & Margins

### 4.1 Cost of Goods Sold (COGS) / Direct Delivery Cost
$$\text{PaymentProcessingCost}_t = \text{MRR}_t \times \text{PaymentProcessingFeeRate}_t$$
$$\text{HostingInfrastructureCost}_t = \text{DirectInfrastructureFixed}_t + (\text{AvgActiveCustomers}_t \times \text{InfrastructureCostPerCustomer}_t)$$
$$\text{ServicingCost}_t = \text{AvgActiveCustomers}_t \times \text{ServicingCostPerCustomer}_t$$
$$\text{COGS}_t = \text{PaymentProcessingCost}_t + \text{HostingInfrastructureCost}_t + \text{ServicingCost}_t$$

### 4.2 Gross Profit & Gross Margin
$$\text{GrossProfit}_t = \text{MRR}_t - \text{COGS}_t$$
$$\text{GrossMarginPercentage}_t = \begin{cases}
\frac{\text{GrossProfit}_t}{\text{MRR}_t} & \text{if } \text{MRR}_t > 0 \\
0.0 & \text{if } \text{MRR}_t = 0
\end{cases}$$

### 4.3 Contribution Margin
Variable customer costs include direct servicing, processing fees, and variable sales commissions/costs directly tied to marginal revenue.
$$\text{TotalVariableCosts}_t = \text{COGS}_t + \text{VariableSalesCosts}_t$$
$$\text{ContributionMargin}_t = \text{MRR}_t - \text{TotalVariableCosts}_t$$
$$\text{ContributionMarginPercentage}_t = \begin{cases}
\frac{\text{ContributionMargin}_t}{\text{MRR}_t} & \text{if } \text{MRR}_t > 0 \\
0.0 & \text{if } \text{MRR}_t = 0
\end{cases}$$

---

## 5. Headcount & Operating Expenses (OpEx)

### 5.1 Payroll Outflow
For each active employee role $i$ active in month $t$ ($\text{StartMonth}_i \le t$):
$$\text{BaseSalary}_{i, t} = \text{MonthlySalary}_i \times \left(1 + \text{AnnualIncreaseRate}_i \times \lfloor \frac{t - \text{StartMonth}_i}{12} \rfloor \right)$$
$$\text{TotalRoleCost}_{i, t} = \text{Headcount}_i \times \text{BaseSalary}_{i, t} \times (1 + \text{EmployerBurdenRate}_i)$$
$$\text{TotalPayroll}_t = \sum_{i \in \text{RolesActive}_t} \text{TotalRoleCost}_{i, t}$$

### 5.2 Marketing & Sales OpEx
$$\text{TotalAcquisitionSpend}_t = \begin{cases}
\text{AcquisitionBudget}_t & \text{if Budget-Based} \\
\text{Leads}_t \times \text{CostPerLead}_t + \text{FixedMarketingOps}_t & \text{if Lead-Based}
\end{cases}$$

### 5.3 General & Administrative (G&A) / Fixed OpEx
$$\text{FixedOpEx}_t = \text{Rent}_t + \text{SoftwareTools}_t + \text{LegalAccounting}_t + \text{OtherFixed}_t$$
$$\text{TotalOpEx}_t = \text{TotalPayroll}_t + \text{TotalAcquisitionSpend}_t + \text{FixedOpEx}_t$$

---

## 6. Unit Economics & Efficiency Ratios

### 6.1 Customer Acquisition Cost (CAC)
$$\text{BlendedCAC}_t = \begin{cases}
\frac{\text{TotalAcquisitionSpend}_t}{\text{NewCustomers}_t} & \text{if } \text{NewCustomers}_t > 0 \\
\text{Undefined} & \text{if } \text{NewCustomers}_t = 0
\end{cases}$$

### 6.2 CAC Payback Period (Months)
Monthly gross profit per acquired customer:
$$\text{MonthlyGrossProfitPerCustomer}_t = \text{ARPU}_t \times \text{GrossMarginPercentage}_t$$
$$\text{CACPayback}_t = \begin{cases}
\frac{\text{BlendedCAC}_t}{\text{MonthlyGrossProfitPerCustomer}_t} & \text{if } \text{MonthlyGrossProfitPerCustomer}_t > 0 \text{ and } \text{BlendedCAC}_t \text{ defined} \\
\text{Undefined} & \text{otherwise}
\end{cases}$$

### 6.3 Customer Lifetime Value (LTV)

#### Method A: Simplified Subscription LTV
Assumes geometric retention with constant monthly churn $c$ and monthly gross margin $m$:
$$\text{SimplifiedLTV}_t = \begin{cases}
\frac{\text{ARPU}_t \times \text{GrossMarginPercentage}_t}{\text{CustomerChurnRate}_t} & \text{if } \text{CustomerChurnRate}_t > 0 \\
\text{Undefined} & \text{if } \text{CustomerChurnRate}_t = 0
\end{cases}$$

#### Method B: Finite-Horizon Cohort-Based LTV ($H$ months, e.g., 36 months)
$$\text{SurvivalProbability}_k = \prod_{j=1}^k (1 - \text{CustomerChurnRate}_j)$$
$$\text{CohortLTV} = \sum_{k=1}^H \frac{\text{SurvivalProbability}_k \times (\text{ARPU}_k \times \text{GrossMarginPercentage}_k)}{(1 + d)^k}$$
Where $d$ is the optional monthly discount rate (default $0.0\%$).

### 6.4 LTV:CAC Ratio
$$\text{LTVToCACRatio}_t = \begin{cases}
\frac{\text{LTV}_t}{\text{BlendedCAC}_t} & \text{if } \text{BlendedCAC}_t > 0 \text{ and } \text{LTV}_t \text{ defined} \\
\text{Undefined} & \text{otherwise}
\end{cases}$$

### 6.5 Operating Break-Even Revenue
$$\text{BreakEvenRevenue}_t = \begin{cases}
\frac{\text{TotalOpEx}_t}{\text{ContributionMarginPercentage}_t} & \text{if } \text{ContributionMarginPercentage}_t > 0 \\
\text{Undefined (Negative Unit Economics)} & \text{if } \text{ContributionMarginPercentage}_t \le 0
\end{cases}$$

---

## 7. Monthly Cash Flow & Runway Engine

### 7.1 Cash Reconciliation
$$\text{BeginningCash}_1 = \text{InitialCashBalance}$$
$$\text{CashInflows}_t = \text{CustomerCashReceipts}_t + \text{FinancingInjections}_t + \text{OtherIncome}_t$$
$$\text{CashOutflows}_t = \text{COGS}_t + \text{TotalOpEx}_t + \text{CapEx}_t + \text{TaxesDebt}_t$$
$$\text{NetCashFlow}_t = \text{CashInflows}_t - \text{CashOutflows}_t$$
$$\text{EndingCash}_t = \text{BeginningCash}_t + \text{NetCashFlow}_t$$
$$\text{BeginningCash}_{t+1} = \text{EndingCash}_t$$

### 7.2 Monthly Net Burn
$$\text{MonthlyNetBurn}_t = \max(0, \, -\text{NetCashFlow}_t)$$

### 7.3 Runway Determination
Rather than assuming static current-month burn:
$$\text{RunwayMonths} = \begin{cases}
\text{First month } t \text{ where } \text{EndingCash}_t < \text{MinimumCashReserve} & \text{if breached within } H \\
> H \text{ (Safe through planning horizon)} & \text{if cash never breaches reserve}
\end{cases}$$

---

## 8. Reverse Planning Optimization Engine

### 8.1 Mathematical Formulation
Let $\mathbf{x} = [x_1, x_2, \dots, x_k]$ be the vector of adjustable decision variables chosen by the user (e.g., $\text{ARPU}$, $\text{LeadConversionRate}$, $\text{CustomerChurnRate}$, $\text{AcquisitionBudget}$, $\text{COGS%}$).

Each variable is bounded by explicit user constraints:
$$l_i \le x_i \le u_i \quad \forall i \in \{1, \dots, k\}$$

**Objective Function:**
- Goal: Target ARR run rate $R^*$ at month $T$ ($T \le H$) minimizing required cash deficit:
$$\min_{\mathbf{x}} f(\mathbf{x}) = \max_{t \in [1, T]} (\text{PeakCashDeficit}_t(\mathbf{x})) + \lambda \cdot \|\mathbf{x} - \mathbf{x}_{\text{base}}\|^2$$
Subject to:
1. $\text{ARRRunRate}_T(\mathbf{x}) \ge R^*$ (Target achievement)
2. $\text{EndingCash}_t(\mathbf{x}) \ge \text{MinimumReserve} \quad \forall t \in [1, T]$ (Solvency constraint)
3. $l_i \le x_i \le u_i \quad \forall i$ (Operational plausibility bounds)

### 8.2 Infeasibility & Bottleneck Diagnostics
If no point $\mathbf{x} \in [\mathbf{l}, \mathbf{u}]$ satisfies all constraints:
1. Max achievable ARR under upper bounds is calculated.
2. The specific binding constraints preventing achievement (e.g., "Cash reserve breached in Month 7: Cash deficit ₹12,40,000" or "Max possible ARR within conversion cap 8.0% is ₹62,00,000") are isolated and returned with clear explanations.
