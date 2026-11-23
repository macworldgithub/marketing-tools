import { calculateBMI } from '../_template/engines/bmi';
import { calculateAge, parseDateString } from '../_template/engines/age';
import { calculateGPA } from '../_template/engines/gpa';
import { calculateLoan } from '../_template/engines/loan';
import {
  percentageOf,
  whatPercentageOf,
  percentageOfWhat,
  percentageChange,
  percentageDifference,
  increaseDecreaseBy,
} from '../_template/engines/percentage';
import { analyzeText } from '../_template/engines/text-stats';
import { encodeBase64 } from '../_template/engines/base64';
import { calculateEntropy } from '../_template/engines/password';
import { sortList } from '../_template/engines/sorter';
import { formatJSON, validateJSON } from '../_template/engines/json';
import {
  calculateDimensionsByWidth,
  calculateDimensionsByPercentage,
} from '../_template/engines/image-io';
import { computeImagePlacement } from '../_template/engines/pdf';
import { formatWiFiPayload } from '../_template/engines/qr';

console.log('=== FORMULA AUDIT RESULTS ===\n');

// 1. BMI
const bmi1 = calculateBMI({ unit: 'metric', weightKg: 70, heightCm: 175 });
const bmi2 = calculateBMI({ unit: 'imperial', weightLb: 154, heightIn: 69 });
console.log('BMI 70kg, 175cm:', bmi1.bmi, bmi1.category, '| Expected: 22.9 Normal');
console.log('BMI 154lb, 69in:', bmi2.bmi, '| Expected: 22.7');
console.log('BMI healthy range 175cm:', `${bmi1.healthyWeightMin}–${bmi1.healthyWeightMax} kg`, '| Expected: 56.7–76.3 kg');

// 2. Age
const age1 = calculateAge(parseDateString('1990-05-15'), parseDateString('2026-11-23'));
console.log('Age 1990-05-15 -> 2026-11-23:', `${age1.years}y ${age1.months}m ${age1.days}d, ${age1.totalDays.toLocaleString()} days`, '| Expected: 36y 6m 8d, 13,341 days');
const age2 = calculateAge(parseDateString('2000-02-29'), parseDateString('2026-02-28'));
console.log('Age 2000-02-29 -> 2026-02-28:', `${age2.years}y ${age2.months}m ${age2.days}d`, '| Expected: 26y 0m 0d');
const age3 = calculateAge(parseDateString('2000-02-29'), parseDateString('2026-03-01'));
console.log('Age 2000-02-29 -> 2026-03-01:', `${age3.years}y ${age3.months}m ${age3.days}d`, '| Expected: 26y 0m 1d');
const age4 = calculateAge(parseDateString('2000-01-31'), parseDateString('2000-03-01'));
console.log('Age 2000-01-31 -> 2000-03-01:', `${age4.years}y ${age4.months}m ${age4.days}d`, '| Expected: 0y 1m 1d');
const age5 = calculateAge(parseDateString('2000-01-31'), parseDateString('2000-02-29'));
console.log('Age 2000-01-31 -> 2000-02-29:', `${age5.years}y ${age5.months}m ${age5.days}d`, '| Expected: 0y 1m 0d');
const age6 = calculateAge(parseDateString('2024-02-29'), parseDateString('2026-11-23'));
console.log('Age 2024-02-29 -> 2026-11-23:', `${age6.years}y ${age6.months}m ${age6.days}d`, '| Expected: 2y 8m 25d');

// 3. GPA
const gpa1 = calculateGPA([
  { id: '1', grade: 'A', credits: 3 },
  { id: '2', grade: 'B+', credits: 4 },
  { id: '3', grade: 'B', credits: 3 },
  { id: '4', grade: 'C', credits: 2 },
]);
console.log('GPA:', gpa1.gpa, '| Expected: 3.18');
const gpa2 = calculateGPA(
  [
    { id: '1', grade: 'A', credits: 3 },
    { id: '2', grade: 'B+', credits: 4 },
    { id: '3', grade: 'B', credits: 3 },
    { id: '4', grade: 'C', credits: 2 },
  ],
  { previousGpa: '3.40', previousCredits: 60 }
);
console.log('GPA with prior 3.40 over 60 credits:', gpa2.cumulativeGpa, '| Expected: 3.36');

// 4. Loan
const loan1 = calculateLoan({ amount: 10000, annualRatePct: 6, termMonths: 36 });
console.log('Loan 10k 6% 36m:', `pmt=${loan1.monthlyPayment}, int=${loan1.totalInterest}, tot=${loan1.totalPaid}, m1_int=${loan1.schedule[0].interest}, final_pmt=${loan1.finalPayment}`);
console.log('Expected: payment 304.22, total interest 951.88, total paid 10,951.88, month-1 interest 50.00, final payment 304.18');

const loan2 = calculateLoan({ amount: 250000, annualRatePct: 6.5, termMonths: 360 });
console.log('Loan 250k 6.5% 360m:', `pmt=${loan2.monthlyPayment}, int=${loan2.totalInterest}, final_pmt=${loan2.finalPayment}`);
console.log('Expected: 1,580.17, interest 318,861.58, final payment 1,580.55');

const loan3 = calculateLoan({ amount: 12000, annualRatePct: 0, termMonths: 12 });
console.log('Loan 12k 0% 12m:', `pmt=${loan3.monthlyPayment}`, '| Expected: 1,000.00');

const loan4 = calculateLoan({ amount: 10000, annualRatePct: 6, termMonths: 36, extraMonthlyPayment: 100 });
console.log('Loan 10k 6% 36m +100:', `months=${loan4.totalMonths}, int=${loan4.totalInterest}`, '| Expected: 27 months, interest 701.63');

// 5. EMI
const emiRed = calculateLoan({ amount: 1000000, annualRatePct: 9, termMonths: 60 });
console.log('EMI 1M 9% 60m reducing:', `pmt=${emiRed.monthlyPayment}, int=${emiRed.totalInterest}, tot=${emiRed.totalPaid}, final_pmt=${emiRed.finalPayment}`);
console.log('Expected: 20,758.36, interest 245,501.23, total 1,245,501.23, final 20,757.99');

const emiFlat = calculateLoan({ amount: 1000000, annualRatePct: 9, termMonths: 60, isFlatRate: true });
console.log('EMI 1M 9% 60m flat:', `pmt=${emiFlat.monthlyPayment}`, '| Expected: 24,166.67');

// 6. Percentage
console.log('15% of 200:', percentageOf(15, 200), '| Expected: 30');
console.log('30 is what % of 200:', whatPercentageOf(30, 200), '| Expected: 15');
console.log('30 is 15% of what:', percentageOfWhat(30, 15), '| Expected: 200');
const change1 = percentageChange(50, 75);
console.log('50 -> 75 change:', `${change1.isIncrease ? '+' : '-'}${change1.change}%`, '| Expected: +50%');
const change2 = percentageChange(75, 50);
console.log('75 -> 50 change:', `${change2.isIncrease ? '+' : '-'}${change2.change}%`, '| Expected: -33.3333%');
console.log('difference 50 vs 75:', `${percentageDifference(50, 75)}%`, '| Expected: 40%');
console.log('increase 200 by 15%:', increaseDecreaseBy(200, 15, true), '| Expected: 230');

// 7. Character Counter
const textStats = analyzeText("Hello, world! It's a well-known fact.");
console.log('Text Stats:', `${textStats.charactersWithSpaces} chars, ${textStats.charactersWithoutSpaces} no spaces, ${textStats.words} words, ${textStats.sentences} sentences`);
console.log('Expected: 37 characters, 32 without spaces, 6 words, 1 sentence');

// 8. Base64
const b64Samples = ['', 'f', 'fo', 'foo', 'foob', 'fooba', 'foobar', 'Hello, World!', 'héllo ✓'];
const b64Results = b64Samples.map((s) => `${s} -> ${encodeBase64(s)}`);
console.log('Base64:\n  ' + b64Results.join('\n  '));

// 9. Password Entropy
console.log('Entropy len 16, pool 94:', calculateEntropy(16, 94).toFixed(2), '| Expected: 104.87');
console.log('Entropy len 12, pool 62:', calculateEntropy(12, 62).toFixed(2), '| Expected: 71.45');
console.log('Entropy 6 words of 7776:', calculateEntropy(6, 7776).toFixed(2), '| Expected: 77.55');

// 10. Sorter
const sorted = sortList('banana, Apple, cherry, apple, 10, 2', {
  delimiter: 'comma',
  numeric: true,
  caseInsensitive: true,
  order: 'asc',
});
console.log('Sorter:', sorted.sorted.join(', '), '| Expected: 2, 10, Apple, apple, banana, cherry');

// 11. JSON
const jsonErr = validateJSON('{"a":1,}');
console.log('JSON error line/col:', `line ${jsonErr.error?.line}, col ${jsonErr.error?.column}`, '| Expected: line 1, column 8');
const jsonLossless = formatJSON('{"id": 12345678901234567890, "v": 1.0}', { minify: true });
console.log('JSON lossless output:', jsonLossless, '| Expected: unchanged 12345678901234567890 and 1.0');

// 12. Image Resizer
const dims1 = calculateDimensionsByWidth(4000, 3000, 1200);
const dims2 = calculateDimensionsByPercentage(4000, 3000, 50);
console.log('Resize 4000x3000 -> w=1200:', `${dims1.width}x${dims1.height}`, '| Expected: 1200x900');
console.log('Resize 4000x3000 -> 50%:', `${dims2.width}x${dims2.height}`, '| Expected: 2000x1500');

// 13. Compressor
const compSavings = (((2000000 - 500000) / 2000000) * 100).toFixed(1);
console.log('Compressor 2MB -> 500KB savings:', `${compSavings} %`, '| Expected: 75.0 %');

// 14. PDF
const pdfDim = computeImagePlacement(1600, 1200, { pageSize: 'A4', orientation: 'portrait', marginPt: 36, fit: 'contain' });
console.log('PDF A4 margin 36 contain 1600x1200:', `${pdfDim.width.toFixed(2)} x ${pdfDim.height.toFixed(2)} at x=${pdfDim.x}, y=${pdfDim.y.toFixed(2)}`);
console.log('Expected: 523.28 × 392.46 pt at x=36, y≈224.72');

// 15. WiFi QR
const wifiPayload = formatWiFiPayload({
  ssid: 'Home;Net',
  password: 'p:ss\\word',
  security: 'WPA',
});
console.log('WiFi QR payload:', wifiPayload);
console.log('Expected: WIFI:T:WPA;S:Home\\;Net;P:p\\:ss\\\\word;;');
