export interface DateParts {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
}

export interface AgeResult {
  years: number;
  months: number;
  days: number;
  totalDays: number;
  totalWeeks: number;
  totalMonths: number;
  dayOfWeekBorn: string;
  daysUntilNextBirthday: number;
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function daysInMonth(year: number, month: number): number {
  switch (month) {
    case 2:
      return isLeapYear(year) ? 29 : 28;
    case 4:
    case 6:
    case 9:
    case 11:
      return 30;
    default:
      return 31;
  }
}

export function parseDateString(dateStr: string): DateParts {
  const match = dateStr.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    throw new Error('Invalid date format. Expected YYYY-MM-DD.');
  }
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);

  if (month < 1 || month > 12) {
    throw new Error('Month must be between 1 and 12.');
  }
  const maxDay = daysInMonth(year, month);
  if (day < 1 || day > maxDay) {
    throw new Error(`Day must be between 1 and ${maxDay} for ${year}-${month.toString().padStart(2, '0')}.`);
  }

  return { year, month, day };
}

export function calculateAge(from: DateParts, to: DateParts): AgeResult {
  // Validate to >= from
  const fromUtc = Date.UTC(from.year, from.month - 1, from.day);
  const toUtc = Date.UTC(to.year, to.month - 1, to.day);

  if (toUtc < fromUtc) {
    throw new Error('"Age at" date cannot be earlier than Date of Birth.');
  }

  const fy = from.year;
  const fm = from.month;
  const fd = from.day;

  const ty = to.year;
  const tm = to.month;
  const td = to.day;

  // Algorithm from specification:
  // m = (ty - fy) * 12 + (tm - fm)
  // if td < min(fd, daysInMonth(ty, tm)): m -= 1
  // years = floor(m / 12); months = m % 12
  // anchor = fromDate + m months, with day = min(fd, daysInMonth(anchorYear, anchorMonth))
  // days = daysBetween(anchor, toDate)
  let m = (ty - fy) * 12 + (tm - fm);
  const limitDay = Math.min(fd, daysInMonth(ty, tm));
  if (td < limitDay) {
    m -= 1;
  }

  const years = Math.floor(m / 12);
  const months = m % 12;

  // Calculate anchor date
  const anchorTotalMonths = (fy * 12 + (fm - 1)) + m;
  const anchorYear = Math.floor(anchorTotalMonths / 12);
  const anchorMonth = (anchorTotalMonths % 12) + 1;
  const anchorDay = Math.min(fd, daysInMonth(anchorYear, anchorMonth));

  const anchorUtc = Date.UTC(anchorYear, anchorMonth - 1, anchorDay);
  const days = Math.round((toUtc - anchorUtc) / 86400000);

  const totalDays = Math.round((toUtc - fromUtc) / 86400000);
  const totalWeeks = Math.floor(totalDays / 7);

  const dayOfWeekNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayOfWeekBorn = dayOfWeekNames[new Date(fromUtc).getUTCDay()];

  // Days until next birthday
  // A Feb 29 birthday is treated as Feb 28 in non-leap years
  let nextBdayYear = ty;
  let bdayMonth = fm;
  let bdayDay = fd;

  const bdayThisYearDay = (fm === 2 && fd === 29 && !isLeapYear(ty)) ? 28 : fd;
  const bdayThisYearUtc = Date.UTC(ty, fm - 1, bdayThisYearDay);

  if (toUtc >= bdayThisYearUtc) {
    nextBdayYear += 1;
  }

  const nextBdayDay = (fm === 2 && fd === 29 && !isLeapYear(nextBdayYear)) ? 28 : fd;
  const nextBdayUtc = Date.UTC(nextBdayYear, fm - 1, nextBdayDay);
  const daysUntilNextBirthday = Math.round((nextBdayUtc - toUtc) / 86400000);

  return {
    years,
    months,
    days,
    totalDays,
    totalWeeks,
    totalMonths: m,
    dayOfWeekBorn,
    daysUntilNextBirthday,
  };
}

