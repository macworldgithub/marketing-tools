// GENERATED from _template — do not edit here
import Decimal from 'decimal.js';

Decimal.set({ rounding: Decimal.ROUND_HALF_UP });

export type BMICategory =
  | 'Underweight'
  | 'Normal'
  | 'Overweight'
  | 'Obesity Class I'
  | 'Obesity Class II'
  | 'Obesity Class III';

export interface BMICalculationResult {
  bmi: string; // 1 decimal half-up
  rawBmi: number;
  category: BMICategory;
  healthyWeightMin: string;
  healthyWeightMax: string;
  healthyWeightUnit: 'kg' | 'lb';
  isUnder20: boolean;
}

export interface MetricBMIParams {
  unit: 'metric';
  weightKg: number | string;
  heightCm: number | string;
  age?: number | string;
}

export interface ImperialBMIParams {
  unit: 'imperial';
  weightLb: number | string;
  heightIn?: number | string;
  heightFt?: number | string;
  heightInRemainder?: number | string;
  age?: number | string;
}

export type BMIParams = MetricBMIParams | ImperialBMIParams;

export interface ValidationError {
  field: string;
  message: string;
}

export function parseStrictNumber(value: number | string, fieldName: string): Decimal {
  if (typeof value === 'number') {
    if (isNaN(value) || !isFinite(value)) {
      throw new Error(`Invalid number for ${fieldName}.`);
    }
    return new Decimal(value);
  }

  const cleaned = String(value).trim().replace(/,/g, '').replace(/\s/g, '');
  if (!cleaned) {
    throw new Error(`${fieldName} cannot be empty.`);
  }

  try {
    const d = new Decimal(cleaned);
    if (d.isNaN() || !d.isFinite()) {
      throw new Error(`Invalid number for ${fieldName}.`);
    }
    return d;
  } catch {
    throw new Error(`Invalid number format for ${fieldName}.`);
  }
}

export function calculateBMI(params: BMIParams): BMICalculationResult {
  const ageNum = params.age ? Number(params.age) : undefined;
  const isUnder20 = typeof ageNum === 'number' && !isNaN(ageNum) && ageNum > 0 && ageNum < 20;

  let rawBmiDecimal: Decimal;
  let healthyMinDecimal: Decimal;
  let healthyMaxDecimal: Decimal;
  let healthyUnit: 'kg' | 'lb';

  if (params.unit === 'metric') {
    const weight = parseStrictNumber(params.weightKg, 'Weight');
    const height = parseStrictNumber(params.heightCm, 'Height');

    if (weight.lt(1) || weight.gt(700)) {
      throw new Error('Weight must be between 1 and 700 kg.');
    }
    if (height.lt(50) || height.gt(260)) {
      throw new Error('Height must be between 50 and 260 cm.');
    }

    const heightM = height.dividedBy(100);
    const heightMSq = heightM.times(heightM);

    rawBmiDecimal = weight.dividedBy(heightMSq);
    healthyMinDecimal = new Decimal('18.5').times(heightMSq);
    healthyMaxDecimal = new Decimal('24.9').times(heightMSq);
    healthyUnit = 'kg';
  } else {
    const weight = parseStrictNumber(params.weightLb, 'Weight');
    let totalInches: Decimal;

    if (params.heightFt !== undefined || params.heightInRemainder !== undefined) {
      const ft = params.heightFt !== undefined && params.heightFt !== '' ? parseStrictNumber(params.heightFt, 'Height (feet)') : new Decimal(0);
      const inches = params.heightInRemainder !== undefined && params.heightInRemainder !== '' ? parseStrictNumber(params.heightInRemainder, 'Height (inches)') : new Decimal(0);
      totalInches = ft.times(12).plus(inches);
    } else if (params.heightIn !== undefined) {
      totalInches = parseStrictNumber(params.heightIn, 'Height (inches)');
    } else {
      throw new Error('Height is required.');
    }

    if (weight.lt(2) || weight.gt(1550)) {
      throw new Error('Weight must be between 2 and 1,550 lbs.');
    }
    if (totalInches.lt(20) || totalInches.gt(105)) {
      throw new Error('Height must be between 20 and 105 inches.');
    }

    const inSq = totalInches.times(totalInches);
    rawBmiDecimal = new Decimal(703).times(weight).dividedBy(inSq);
    healthyMinDecimal = new Decimal('18.5').times(inSq).dividedBy(703);
    healthyMaxDecimal = new Decimal('24.9').times(inSq).dividedBy(703);
    healthyUnit = 'lb';
  }

  // Determine category by unrounded value
  let category: BMICategory;
  if (rawBmiDecimal.lt(18.5)) {
    category = 'Underweight';
  } else if (rawBmiDecimal.lt(25)) {
    category = 'Normal';
  } else if (rawBmiDecimal.lt(30)) {
    category = 'Overweight';
  } else if (rawBmiDecimal.lt(35)) {
    category = 'Obesity Class I';
  } else if (rawBmiDecimal.lt(40)) {
    category = 'Obesity Class II';
  } else {
    category = 'Obesity Class III';
  }

  return {
    bmi: rawBmiDecimal.toFixed(1, Decimal.ROUND_HALF_UP),
    rawBmi: rawBmiDecimal.toNumber(),
    category,
    healthyWeightMin: healthyMinDecimal.toFixed(1, Decimal.ROUND_HALF_UP),
    healthyWeightMax: healthyMaxDecimal.toFixed(1, Decimal.ROUND_HALF_UP),
    healthyWeightUnit: healthyUnit,
    isUnder20,
  };
}

