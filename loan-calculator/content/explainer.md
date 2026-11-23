# How the Loan Calculator Works

An amortized installment loan distributes repayment across a predetermined series of equal monthly installments. Each installment is composed of two components: accrued interest on the outstanding balance, and repayment of the principal loan amount.

### The Amortization Formula

The fixed periodic payment is calculated using standard financial mathematics:

$$\text{Payment} = P \times \frac{r(1 + r)^n}{(1 + r)^n - 1}$$

Where:
- $P$ = Principal loan amount
- $r$ = Periodic interest rate per month: $\frac{\text{APR}}{12 \times 100}$
- $n$ = Total number of payment periods (months)

For example, on a **$10,000** loan at **6.0% APR** over **36 months**:
- $r = 6.0 / 12 / 100 = 0.005$
- $(1 + 0.005)^{36} = 1.19668...$
- Payment = $10,000 \times \frac{0.005 \times 1.19668}{1.19668 - 1} = \mathbf{304.22}$

### Schedule Progression and Cent Rounding

In accordance with banking conventions:
1. **Periodic Interest:** $\text{Interest}_t = \text{round}(\text{Balance}_{t-1} \times r, 2)$
2. **Periodic Principal:** $\text{Principal}_t = \text{Payment} - \text{Interest}_t$
3. **Ending Balance:** $\text{Balance}_t = \text{Balance}_{t-1} - \text{Principal}_t$
4. **Final Payment:** On the final month ($t = n$), the payment exactly equals $\text{Remaining Balance} + \text{Interest}_n$, accounting for slight fractional cent deviations.

For our 10,000 @ 6% / 36 mo vector:
- Month 1: Interest = 50.00, Principal = 254.22, Balance = 9,745.78
- Month 36 (Final Payment): **304.18**
- **Total Interest:** **$951.88** | **Total Paid:** **$10,951.88**

### Impact of Extra Monthly Principal Payments

Applying additional funds directly toward your principal balance each month dramatically compresses the repayment timeline and reduces cumulative interest charges. For example, adding $100 per month to a $10,000 loan at 6% APR truncates the loan tenure from 36 months down to 27 months, saving over $250 in total finance charges.

**Financial Disclaimer:** This calculator provides estimates for personal planning. Official loan amortization schedules should always be obtained directly from your lending institution.