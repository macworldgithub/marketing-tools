// GENERATED from _template — do not edit here
import Decimal from 'decimal.js';

Decimal.set({ rounding: Decimal.ROUND_HALF_UP });

export interface AmortizationPeriod {
  period: number;
  payment: string;
  principal: string;
  interest: string;
  remainingBalance: string;
}

export interface LoanResult {
  monthlyPayment: string;
  totalInterest: string;
  totalPaid: string;
  finalPayment: string;
  totalMonths: number;
  schedule: AmortizationPeriod[];
  interestSaved?: string;
  monthsSaved?: number;
}

export interface LoanParams {
  amount: number | string;
  annualRatePct: number | string;
  termMonths: number;
  extraMonthlyPayment?: number | string;
  isFlatRate?: boolean;
}

export function calculateLoan(params: LoanParams): LoanResult {
  const P = new Decimal(params.amount);
  const ratePct = new Decimal(params.annualRatePct);
  const n = params.termMonths;
  const extra = params.extraMonthlyPayment ? new Decimal(params.extraMonthlyPayment) : new Decimal(0);

  if (P.lte(0) || n <= 0) {
    throw new Error('Principal amount and term must be greater than zero.');
  }

  // Handle Flat-Rate Mode (used by EMI calculator)
  if (params.isFlatRate) {
    const years = new Decimal(n).dividedBy(12);
    const totalInterestDec = P.times(ratePct).dividedBy(100).times(years).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    const totalPaidDec = P.plus(totalInterestDec);
    const emiDec = totalPaidDec.dividedBy(n).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

    return {
      monthlyPayment: emiDec.toFixed(2),
      totalInterest: totalInterestDec.toFixed(2),
      totalPaid: totalPaidDec.toFixed(2),
      finalPayment: emiDec.toFixed(2),
      totalMonths: n,
      schedule: [],
    };
  }

  // Standard Reducing Balance Loan
  const r = ratePct.dividedBy(100).dividedBy(12);
  let basePaymentDec: Decimal;

  if (r.isZero()) {
    basePaymentDec = P.dividedBy(n).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  } else {
    // payment = P * r * (1+r)^n / ((1+r)^n - 1)
    const onePlusR = r.plus(1);
    const onePlusRPowN = onePlusR.pow(n);
    const numerator = P.times(r).times(onePlusRPowN);
    const denominator = onePlusRPowN.minus(1);
    basePaymentDec = numerator.dividedBy(denominator).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  }

  // Generate schedule
  let balance = P;
  let totalInterestAccum = new Decimal(0);
  let totalPaidAccum = new Decimal(0);
  const schedule: AmortizationPeriod[] = [];
  let period = 0;
  let finalPaymentStr = basePaymentDec.toFixed(2);

  while (balance.gt(0) && period < 1200) {
    period++;
    const interest = balance.times(r).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    const targetPayment = basePaymentDec.plus(extra);

    if (balance.plus(interest).lte(targetPayment) || (extra.isZero() && period === n)) {
      // Final payoff payment
      const actualPayment = balance.plus(interest);
      const principal = balance;
      balance = new Decimal(0);

      totalInterestAccum = totalInterestAccum.plus(interest);
      totalPaidAccum = totalPaidAccum.plus(actualPayment);
      finalPaymentStr = actualPayment.toFixed(2);

      schedule.push({
        period,
        payment: actualPayment.toFixed(2),
        principal: principal.toFixed(2),
        interest: interest.toFixed(2),
        remainingBalance: '0.00',
      });
      break;
    } else {
      const principal = targetPayment.minus(interest);
      balance = balance.minus(principal);

      totalInterestAccum = totalInterestAccum.plus(interest);
      totalPaidAccum = totalPaidAccum.plus(targetPayment);

      schedule.push({
        period,
        payment: targetPayment.toFixed(2),
        principal: principal.toFixed(2),
        interest: interest.toFixed(2),
        remainingBalance: balance.toFixed(2),
      });
    }
  }

  // If extra payment was provided, calculate savings vs baseline
  let interestSaved: string | undefined;
  let monthsSaved: number | undefined;

  if (extra.gt(0)) {
    const baseline = calculateLoan({
      amount: params.amount,
      annualRatePct: params.annualRatePct,
      termMonths: params.termMonths,
      extraMonthlyPayment: 0,
    });
    const baselineInterest = new Decimal(baseline.totalInterest);
    interestSaved = baselineInterest.minus(totalInterestAccum).toFixed(2);
    monthsSaved = baseline.totalMonths - period;
  }

  return {
    monthlyPayment: basePaymentDec.toFixed(2),
    totalInterest: totalInterestAccum.toFixed(2),
    totalPaid: totalPaidAccum.toFixed(2),
    finalPayment: finalPaymentStr,
    totalMonths: period,
    schedule,
    interestSaved,
    monthsSaved,
  };
}

export function formatCurrency(amount: number | string, currency: string = 'USD'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0.00';

  if (currency === 'INR' || currency === '₹') {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  }

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}


