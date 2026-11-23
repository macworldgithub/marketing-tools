import Decimal from 'decimal.js';

Decimal.set({ rounding: Decimal.ROUND_HALF_UP });

export type GradeLetter =
  | 'A'
  | 'A-'
  | 'B+'
  | 'B'
  | 'B-'
  | 'C+'
  | 'C'
  | 'C-'
  | 'D+'
  | 'D'
  | 'D-'
  | 'F'
  | 'P'; // Pass/Fail excluded

export type CourseLevel = 'Regular' | 'Honors' | 'AP/IB/Dual';

export interface CourseEntry {
  id: string;
  name?: string;
  grade: GradeLetter;
  credits: number | string;
  level?: CourseLevel;
}

export interface GPAResult {
  gpa: string; // 2 decimals half-up
  rawGpa: number;
  totalCredits: number;
  totalQualityPoints: string;
  cumulativeGpa?: string;
  cumulativeTotalCredits?: number;
}

export const GRADE_POINTS: Record<GradeLetter, number | null> = {
  A: 4.0,
  'A-': 3.7,
  'B+': 3.3,
  B: 3.0,
  'B-': 2.7,
  'C+': 2.3,
  C: 2.0,
  'C-': 1.7,
  'D+': 1.3,
  D: 1.0,
  'D-': 0.7,
  F: 0.0,
  P: null, // excluded
};

export const LEVEL_BONUS: Record<CourseLevel, number> = {
  Regular: 0.0,
  Honors: 0.5,
  'AP/IB/Dual': 1.0,
};

export function calculateGPA(
  courses: CourseEntry[],
  cumulative?: { previousGpa: number | string; previousCredits: number | string }
): GPAResult {
  let totalPointsDecimal = new Decimal(0);
  let totalCreditsDecimal = new Decimal(0);

  for (const course of courses) {
    const basePoints = GRADE_POINTS[course.grade];
    if (basePoints === null) continue; // P/F excluded

    const creditsDecimal = new Decimal(course.credits || 0);
    if (creditsDecimal.lte(0)) continue; // 0 credits ignored

    let pointsPerCredit = new Decimal(basePoints);
    // Weight bonus applies only to grades above F (i.e. > 0)
    if (course.level && course.level !== 'Regular' && basePoints > 0) {
      pointsPerCredit = pointsPerCredit.plus(LEVEL_BONUS[course.level]);
    }

    totalPointsDecimal = totalPointsDecimal.plus(pointsPerCredit.times(creditsDecimal));
    totalCreditsDecimal = totalCreditsDecimal.plus(creditsDecimal);
  }

  if (totalCreditsDecimal.isZero()) {
    return {
      gpa: '0.00',
      rawGpa: 0,
      totalCredits: 0,
      totalQualityPoints: '0.00',
    };
  }

  const gpaDecimal = totalPointsDecimal.dividedBy(totalCreditsDecimal);

  let cumulativeGpa: string | undefined;
  let cumulativeTotalCredits: number | undefined;

  if (cumulative && cumulative.previousCredits && Number(cumulative.previousCredits) > 0) {
    const prevGpaDec = new Decimal(cumulative.previousGpa || 0);
    const prevCreditsDec = new Decimal(cumulative.previousCredits);

    const prevPoints = prevGpaDec.times(prevCreditsDec);
    const cumPoints = prevPoints.plus(totalPointsDecimal);
    const cumCredits = prevCreditsDec.plus(totalCreditsDecimal);

    cumulativeGpa = cumPoints.dividedBy(cumCredits).toFixed(2, Decimal.ROUND_HALF_UP);
    cumulativeTotalCredits = cumCredits.toNumber();
  }

  return {
    gpa: gpaDecimal.toFixed(2, Decimal.ROUND_HALF_UP),
    rawGpa: gpaDecimal.toNumber(),
    totalCredits: totalCreditsDecimal.toNumber(),
    totalQualityPoints: totalPointsDecimal.toFixed(2, Decimal.ROUND_HALF_UP),
    cumulativeGpa,
    cumulativeTotalCredits,
  };
}

