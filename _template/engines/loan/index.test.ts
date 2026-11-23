import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import Decimal from 'decimal.js';
import { calculateLoan } from './index';

describe('Loan Calculator Engine', () => {
  // Vector 1: 10,000 @ 6% / 36 mo → payment 304.22, total interest 951.88, total paid 10,951.88.
  // Month 1: interest 50.00, principal 254.22, balance 9,745.78. Final payment 304.18.
  it('correctly calculates vector 1: 10,000 @ 6% / 36 mo', () => {
    const res = calculateLoan({
      amount: 10000,
      annualRatePct: 6,
      termMonths: 36,
    });

    expect(res.monthlyPayment).toBe('304.22');
    expect(res.totalInterest).toBe('951.88');
    expect(res.totalPaid).toBe('10951.88');
    expect(res.finalPayment).toBe('304.18');
    expect(res.totalMonths).toBe(36);

    // Month 1 schedule check
    expect(res.schedule[0].interest).toBe('50.00');
    expect(res.schedule[0].principal).toBe('254.22');
    expect(res.schedule[0].remainingBalance).toBe('9745.78');
  });

  // Vector 2: 250,000 @ 6.5% / 360 mo → payment 1,580.17, total interest 318,861.58, final payment 1,580.55.
  it('correctly calculates vector 2: 250,000 @ 6.5% / 360 mo', () => {
    const res = calculateLoan({
      amount: 250000,
      annualRatePct: 6.5,
      termMonths: 360,
    });

    expect(res.monthlyPayment).toBe('1580.17');
    expect(res.totalInterest).toBe('318861.58');
    expect(res.finalPayment).toBe('1580.55');
  });

  // Vector 3: 12,000 @ 0% / 12 → payment 1,000.00, interest 0.
  it('correctly calculates vector 3: 0% interest loan', () => {
    const res = calculateLoan({
      amount: 12000,
      annualRatePct: 0,
      termMonths: 12,
    });

    expect(res.monthlyPayment).toBe('1000.00');
    expect(res.totalInterest).toBe('0.00');
    expect(res.totalPaid).toBe('12000.00');
  });

  // Vector 4: 10,000 @ 6% / 36 with extra 100/mo → 27 months, total interest 701.63.
  it('correctly calculates vector 4: extra payments', () => {
    const res = calculateLoan({
      amount: 10000,
      annualRatePct: 6,
      termMonths: 36,
      extraMonthlyPayment: 100,
    });

    expect(res.totalMonths).toBe(27);
    expect(res.totalInterest).toBe('701.63');
  });

  // Vector 5: EMI 1,000,000 @ 9% / 60 mo reducing → EMI 20,758.36, total interest 245,501.23, total payment 1,245,501.23, final EMI 20,757.99.
  it('correctly calculates vector 5: reducing EMI', () => {
    const res = calculateLoan({
      amount: 1000000,
      annualRatePct: 9,
      termMonths: 60,
    });

    expect(res.monthlyPayment).toBe('20758.36');
    expect(res.totalInterest).toBe('245501.23');
    expect(res.totalPaid).toBe('1245501.23');
    expect(res.finalPayment).toBe('20757.99');
  });

  // Vector 6: Flat: 1,000,000 @ 9% / 5 yr → 24,166.67.
  it('correctly calculates vector 6: flat rate EMI', () => {
    const res = calculateLoan({
      amount: 1000000,
      annualRatePct: 9,
      termMonths: 60,
      isFlatRate: true,
    });

    expect(res.monthlyPayment).toBe('24166.67');
  });

  // Property test: Σ principal = P exactly, and final balance is 0.00.
  it('guarantees sum of principal equals amount P and final balance is 0.00', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1000, max: 100000 }),
        fc.float({ min: 1, max: 15, noNaN: true }),
        fc.integer({ min: 6, max: 60 }),
        (p, rate, months) => {
          const res = calculateLoan({
            amount: p,
            annualRatePct: rate,
            termMonths: months,
          });

          let principalSum = new Decimal(0);
          for (const item of res.schedule) {
            principalSum = principalSum.plus(item.principal);
          }

          expect(principalSum.toFixed(2)).toBe(new Decimal(p).toFixed(2));
          expect(res.schedule[res.schedule.length - 1].remainingBalance).toBe('0.00');
        }
      ),
      { numRuns: 30 }
    );
  });
});

