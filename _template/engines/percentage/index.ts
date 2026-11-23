import Decimal from 'decimal.js';

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

function formatNumber(d: Decimal): string {
  // Show up to 6 significant digits or decimal places and trim trailing zeros
  const rounded = d.toDecimalPlaces(6, Decimal.ROUND_HALF_UP);
  return rounded.toString();
}

export function percentageOf(x: number | string, y: number | string): string {
  const decX = new Decimal(x);
  const decY = new Decimal(y);
  // Y * X / 100
  const result = decY.times(decX).dividedBy(100);
  return formatNumber(result);
}

export function whatPercentageOf(x: number | string, y: number | string): string {
  const decX = new Decimal(x);
  const decY = new Decimal(y);
  if (decY.isZero()) throw new Error('Cannot divide by zero.');
  // X / Y * 100
  const result = decX.dividedBy(decY).times(100);
  return formatNumber(result);
}

export function percentageOfWhat(x: number | string, y: number | string): string {
  const decX = new Decimal(x);
  const decY = new Decimal(y);
  if (decY.isZero()) throw new Error('Percentage cannot be zero.');
  // X * 100 / Y
  const result = decX.times(100).dividedBy(decY);
  return formatNumber(result);
}

export function increaseDecreaseBy(y: number | string, x: number | string, isIncrease: boolean): string {
  const decY = new Decimal(y);
  const decX = new Decimal(x);
  // Y * (1 ± X/100)
  const factor = isIncrease ? new Decimal(1).plus(decX.dividedBy(100)) : new Decimal(1).minus(decX.dividedBy(100));
  const result = decY.times(factor);
  return formatNumber(result);
}

export function percentageChange(a: number | string, b: number | string): { change: string; isIncrease: boolean } {
  const decA = new Decimal(a);
  const decB = new Decimal(b);
  if (decA.isZero()) throw new Error('Initial value A cannot be zero.');
  // (B - A) / |A| * 100
  const diff = decB.minus(decA);
  const result = diff.dividedBy(decA.abs()).times(100);
  const isIncrease = diff.gte(0);
  return {
    change: formatNumber(result.abs()),
    isIncrease,
  };
}

export function percentageDifference(a: number | string, b: number | string): string {
  const decA = new Decimal(a);
  const decB = new Decimal(b);
  const sum = decA.plus(decB);
  if (sum.isZero()) throw new Error('Sum of A and B cannot be zero.');
  // |A - B| / ((A + B) / 2) * 100
  const diff = decA.minus(decB).abs();
  const avg = sum.dividedBy(2);
  const result = diff.dividedBy(avg.abs()).times(100);
  return formatNumber(result);
}

