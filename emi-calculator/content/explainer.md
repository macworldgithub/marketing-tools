# How EMI Calculator Works

The Equated Monthly Installment (EMI) Calculator models loan amortizations under reducing-balance and flat-rate credit structures using arbitrary-precision decimal arithmetic.

## Reducing Balance Formula
For standard mortgages, auto loans, and personal financing, the reducing balance monthly installment is computed as:
$$\text{EMI} = \frac{P \times r \times (1 + r)^n}{(1 + r)^n - 1}$$
where:
- $P$ is the principal loan amount.
- $r = \frac{\text{Annual Interest Rate}}{12 \times 100}$ represents the periodic monthly interest rate.
- $n = \text{tenure in months}$.

## Flat Rate Mode
In retail consumer electronics or vehicle dealer financing, lenders occasionally advertise "flat rate" interest. In flat-rate loans, interest is computed against the entire original principal regardless of ongoing repayments:
$$\text{EMI}_{\text{flat}} = \frac{P + \left(P \times \frac{\text{Rate}}{100} \times \text{Years}\right)}{n}$$
Our tool labels this mode explicitly to help borrowers identify the substantially higher effective interest cost of flat loans compared to diminishing balance financing.

## South Asian (en-IN) Number Formatting
When INR (₹) is selected, numeric figures format according to South Asian grouping conventions: the rightmost three digits are grouped together, followed by pairs of two digits (e.g. ₹ 1,00,000 for 1 Lakh and ₹ 1,00,00,000 for 1 Crore).

## Amortization Schedule Integrity
Each month, interest is calculated on the remaining balance: $\text{interest} = \text{round}(\text{balance} \times r, 2)$, and principal repayment is $\text{EMI} - \text{interest}$. The final payment adjusts by the few accumulated fractional cents to guarantee the ending balance is exactly $0.00$.

## Important Financial Disclaimer
This EMI calculator is provided exclusively for personal educational and informational modeling purposes. It does not constitute formal financial, investment, lending, or tax advice. Actual loan terms, processing fees, insurance charges, and prepayment penalties vary across banking institutions. Always consult your financial advisor or lending officer before finalizing credit agreements.