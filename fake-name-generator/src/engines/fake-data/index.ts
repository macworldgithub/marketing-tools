// GENERATED from _template — do not edit here
import { FAKE_DATA_LOCALES } from './data';

export type LocaleKey = 'US' | 'UK' | 'India' | 'Pakistan' | 'Canada' | 'Australia';
export type GenderOption = 'any' | 'male' | 'female';

export interface FakePersonOptions {
  count?: number;
  locale?: LocaleKey;
  gender?: GenderOption;
  includeEmail?: boolean;
  includePhone?: boolean;
  includeUsername?: boolean;
  includeDob?: boolean;
  seed?: number;
}

export interface FakePerson {
  firstName: string;
  lastName: string;
  fullName: string;
  gender: 'Male' | 'Female';
  locale: LocaleKey;
  username?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
}

// PRNG (Mulberry32) for deterministic seeding when seed is provided
function createPrng(seed: number) {
  let s = Math.floor(seed);
  return function () {
    let t = (s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateFakePeople(options: FakePersonOptions = {}): FakePerson[] {
  const {
    count = 10,
    locale = 'US',
    gender = 'any',
    includeEmail = true,
    includePhone = true,
    includeUsername = true,
    includeDob = true,
    seed,
  } = options;

  const clampedCount = Math.max(1, Math.min(100, count));
  const prng = seed !== undefined ? createPrng(seed) : Math.random;

  const dataset = FAKE_DATA_LOCALES[locale] || FAKE_DATA_LOCALES['US'];
  const results: FakePerson[] = [];

  const safeDomains = ['example.com', 'example.org', 'example.net'];

  for (let i = 0; i < clampedCount; i++) {
    // Determine gender
    let chosenGender: 'Male' | 'Female';
    if (gender === 'male') chosenGender = 'Male';
    else if (gender === 'female') chosenGender = 'Female';
    else chosenGender = prng() < 0.5 ? 'Male' : 'Female';

    const firstPool = chosenGender === 'Male' ? dataset.maleFirst : dataset.femaleFirst;
    const firstName = firstPool[Math.floor(prng() * firstPool.length)];
    const lastName = dataset.last[Math.floor(prng() * dataset.last.length)];
    const fullName = `${firstName} ${lastName}`;

    const cleanFirst = firstName.toLowerCase().replace(/[^a-z]/g, '');
    const cleanLast = lastName.toLowerCase().replace(/[^a-z]/g, '');
    const userNumber = Math.floor(prng() * 900 + 100);

    const person: FakePerson = {
      firstName,
      lastName,
      fullName,
      gender: chosenGender,
      locale,
    };

    if (includeUsername) {
      person.username = `${cleanFirst}.${cleanLast}${userNumber}`;
    }

    if (includeEmail) {
      const domain = safeDomains[Math.floor(prng() * safeDomains.length)];
      person.email = `${cleanFirst}.${cleanLast}${userNumber}@${domain}`;
    }

    if (includePhone) {
      if (locale === 'US' || locale === 'Canada') {
        // Spec: US phone numbers strictly in fictional range 555-0100 – 555-0199
        const suffix = Math.floor(prng() * 100);
        const suffixStr = String(suffix).padStart(2, '0');
        const areaCode = Math.floor(prng() * 800 + 200);
        person.phone = `+1 (${areaCode}) 555-01${suffixStr}`;
      } else if (locale === 'UK') {
        const num = Math.floor(prng() * 900000 + 100000);
        person.phone = `+44 7700 9${String(num).slice(0, 5)}`;
      } else if (locale === 'India') {
        const num = Math.floor(prng() * 900000000 + 100000000);
        person.phone = `+91 9${num}`;
      } else if (locale === 'Pakistan') {
        const num = Math.floor(prng() * 9000000 + 1000000);
        person.phone = `+92 300 ${num}`;
      } else if (locale === 'Australia') {
        const num = Math.floor(prng() * 900000 + 100000);
        person.phone = `+61 491 570 ${String(num).slice(0, 3)}`;
      }
    }

    if (includeDob) {
      // Age between 18 and 75
      const currentYear = new Date().getFullYear();
      const birthYear = currentYear - Math.floor(prng() * 57 + 18);
      const birthMonth = Math.floor(prng() * 12 + 1);
      const birthDay = Math.floor(prng() * 28 + 1);
      person.dateOfBirth = `${birthYear}-${String(birthMonth).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`;
    }

    results.push(person);
  }

  return results;
}

export function toCSV(people: FakePerson[]): string {
  if (people.length === 0) return '';
  const headers = ['First Name', 'Last Name', 'Full Name', 'Gender', 'Country', 'Username', 'Email', 'Phone', 'Date of Birth'];
  const rows = people.map((p) => [
    `"${p.firstName}"`,
    `"${p.lastName}"`,
    `"${p.fullName}"`,
    `"${p.gender}"`,
    `"${p.locale}"`,
    `"${p.username || ''}"`,
    `"${p.email || ''}"`,
    `"${p.phone || ''}"`,
    `"${p.dateOfBirth || ''}"`,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}
