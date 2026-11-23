import { describe, it, expect } from 'vitest';
import { calculateBMI } from './index';

describe('BMI Calculator Engine', () => {
  // Test Vector 1: 70 kg, 175 cm → 22.9 Normal. Healthy range at 175 cm → 56.7–76.3 kg.
  it('correctly calculates metric vector: 70 kg, 175 cm', () => {
    const result = calculateBMI({
      unit: 'metric',
      weightKg: 70,
      heightCm: 175,
    });

    expect(result.bmi).toBe('22.9');
    expect(result.category).toBe('Normal');
    expect(result.healthyWeightMin).toBe('56.7');
    expect(result.healthyWeightMax).toBe('76.3');
    expect(result.healthyWeightUnit).toBe('kg');
  });

  // Test Vector 2: 154 lb, 69 in → 22.7 (22.739…)
  it('correctly calculates imperial vector: 154 lb, 69 in', () => {
    const result = calculateBMI({
      unit: 'imperial',
      weightLb: 154,
      heightIn: 69,
    });

    expect(result.bmi).toBe('22.7');
    expect(result.category).toBe('Normal');
    expect(result.rawBmi).toBeCloseTo(22.739, 3);
  });

  it('correctly calculates imperial with feet and inches: 154 lb, 5 ft 9 in', () => {
    const result = calculateBMI({
      unit: 'imperial',
      weightLb: 154,
      heightFt: 5,
      heightInRemainder: 9,
    });

    expect(result.bmi).toBe('22.7');
    expect(result.category).toBe('Normal');
  });

  it('classifies all adult BMI categories accurately based on unrounded values', () => {
    // Underweight: < 18.5 (e.g. 18.49)
    const h = 175; // h^2 = 3.0625
    // 18.49 * 3.0625 = 56.625
    const under = calculateBMI({ unit: 'metric', weightKg: 56.625, heightCm: h });
    expect(under.category).toBe('Underweight');

    // Overweight: 25 - <30
    const over = calculateBMI({ unit: 'metric', weightKg: 80, heightCm: h });
    expect(over.category).toBe('Overweight');

    // Obesity I: 30 - <35
    const ob1 = calculateBMI({ unit: 'metric', weightKg: 95, heightCm: h });
    expect(ob1.category).toBe('Obesity Class I');

    // Obesity II: 35 - <40
    const ob2 = calculateBMI({ unit: 'metric', weightKg: 110, heightCm: h });
    expect(ob2.category).toBe('Obesity Class II');

    // Obesity III: >= 40
    const ob3 = calculateBMI({ unit: 'metric', weightKg: 130, heightCm: h });
    expect(ob3.category).toBe('Obesity Class III');
  });

  it('flags age under 20', () => {
    const result = calculateBMI({
      unit: 'metric',
      weightKg: 50,
      heightCm: 160,
      age: 16,
    });
    expect(result.isUnder20).toBe(true);
  });

  it('rejects invalid inputs strictly', () => {
    expect(() => calculateBMI({ unit: 'metric', weightKg: 0, heightCm: 170 })).toThrow();
    expect(() => calculateBMI({ unit: 'metric', weightKg: 800, heightCm: 170 })).toThrow();
    expect(() => calculateBMI({ unit: 'metric', weightKg: 70, heightCm: 40 })).toThrow();
    expect(() => calculateBMI({ unit: 'metric', weightKg: 'abc', heightCm: 170 })).toThrow();
  });
});

