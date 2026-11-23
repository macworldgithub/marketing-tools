import { describe, it, expect } from 'vitest';
import { calculateGPA, CourseEntry } from './index';

describe('GPA Calculator Engine', () => {
  // Vectors: (A,3) (B+,4) (B,3) (C,2) → points 38.2 / credits 12 = 3.18.
  // With previous 3.40 over 60 credits → 3.36.
  it('correctly calculates specification test vectors', () => {
    const courses: CourseEntry[] = [
      { id: '1', grade: 'A', credits: 3 },
      { id: '2', grade: 'B+', credits: 4 },
      { id: '3', grade: 'B', credits: 3 },
      { id: '4', grade: 'C', credits: 2 },
    ];

    const result = calculateGPA(courses);

    expect(result.totalCredits).toBe(12);
    expect(result.totalQualityPoints).toBe('38.20');
    expect(result.gpa).toBe('3.18');

    // With cumulative
    const cumResult = calculateGPA(courses, { previousGpa: '3.40', previousCredits: '60' });
    expect(cumResult.cumulativeGpa).toBe('3.36');
    expect(cumResult.cumulativeTotalCredits).toBe(72);
  });

  it('correctly handles weighted courses bonus (excluding F)', () => {
    const courses: CourseEntry[] = [
      { id: '1', grade: 'A', credits: 3, level: 'AP/IB/Dual' }, // 4.0 + 1.0 = 5.0 * 3 = 15.0
      { id: '2', grade: 'B', credits: 3, level: 'Honors' },     // 3.0 + 0.5 = 3.5 * 3 = 10.5
      { id: '3', grade: 'F', credits: 3, level: 'AP/IB/Dual' }, // F has NO bonus = 0.0 * 3 = 0.0
    ];

    const result = calculateGPA(courses);
    // Total points = 25.5, credits = 9 -> 2.8333... -> 2.83
    expect(result.totalCredits).toBe(9);
    expect(result.gpa).toBe('2.83');
  });

  it('ignores courses with 0 credits or P/F status', () => {
    const courses: CourseEntry[] = [
      { id: '1', grade: 'A', credits: 4 },
      { id: '2', grade: 'P', credits: 3 }, // P/F excluded
      { id: '3', grade: 'A', credits: 0 }, // 0 credits ignored
    ];

    const result = calculateGPA(courses);
    expect(result.totalCredits).toBe(4);
    expect(result.gpa).toBe('4.00');
  });
});

