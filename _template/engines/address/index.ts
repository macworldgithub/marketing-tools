export type AddressCountry = 'US' | 'UK' | 'Canada' | 'Australia' | 'India';

export interface AddressOptions {
  country?: AddressCountry;
  count?: number;
  seed?: number;
}

export interface GeneratedAddress {
  streetAddress: string;
  city: string;
  stateOrProvince: string;
  postalCode: string;
  country: string;
  fullAddress: string;
}

// PRNG for deterministic address generation
function createPrng(seed: number) {
  let s = Math.floor(seed);
  return function () {
    let t = (s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// US State to ZIP prefix range table
const US_STATES = [
  { name: 'California', abbr: 'CA', zipMin: 90001, zipMax: 96162, cities: ['Los Angeles', 'San Francisco', 'San Diego', 'San Jose', 'Sacramento', 'Fresno', 'Oakland'] },
  { name: 'New York', abbr: 'NY', zipMin: 10001, zipMax: 14925, cities: ['New York', 'Buffalo', 'Rochester', 'Yonkers', 'Syracuse', 'Albany'] },
  { name: 'Texas', abbr: 'TX', zipMin: 75001, zipMax: 79999, cities: ['Houston', 'San Antonio', 'Dallas', 'Austin', 'Fort Worth', 'El Paso', 'Arlington'] },
  { name: 'Illinois', abbr: 'IL', zipMin: 60001, zipMax: 62999, cities: ['Chicago', 'Aurora', 'Naperville', 'Joliet', 'Springfield', 'Rockford', 'Peoria'] },
  { name: 'Florida', abbr: 'FL', zipMin: 32003, zipMax: 34997, cities: ['Miami', 'Orlando', 'Tampa', 'Jacksonville', 'St. Petersburg', 'Hialeah', 'Tallahassee'] },
  { name: 'Washington', abbr: 'WA', zipMin: 98001, zipMax: 99403, cities: ['Seattle', 'Spokane', 'Tacoma', 'Vancouver', 'Bellevue', 'Kent', 'Everett'] },
  { name: 'Massachusetts', abbr: 'MA', zipMin: 1001, zipMax: 2791, cities: ['Boston', 'Worcester', 'Springfield', 'Cambridge', 'Lowell', 'Brockton'] },
  { name: 'Colorado', abbr: 'CO', zipMin: 80001, zipMax: 81658, cities: ['Denver', 'Colorado Springs', 'Aurora', 'Fort Collins', 'Lakewood', 'Boulder'] },
];

const STREET_NAMES = [
  'Main', 'Oak', 'Maple', 'Cedar', 'Elm', 'Pine', 'Washington', 'Lake', 'Hill', 'Park',
  'View', 'Valley', 'Chestnut', 'Highland', 'Walnut', 'Spring', 'Willow', 'Lincoln', 'Sunset', 'Church'
];

const STREET_TYPES = ['Street', 'Avenue', 'Boulevard', 'Drive', 'Road', 'Lane', 'Way', 'Court', 'Terrace'];

const UK_REGIONS = [
  { city: 'London', area: 'NW', dist: '1', sector: '6XE', streets: ['Baker Lane', 'Abbey Road', 'Oxford Street', 'Piccadilly'] },
  { city: 'Manchester', area: 'M', dist: '1', sector: '4ET', streets: ['Deansgate', 'Market Street', 'Oxford Road', 'Princess Street'] },
  { city: 'Birmingham', area: 'B', dist: '2', sector: '5ER', streets: ['Broad Street', 'Colmore Row', 'Corporation Street', 'New Street'] },
  { city: 'Edinburgh', area: 'EH', dist: '1', sector: '2NG', streets: ['Princes Street', 'Royal Mile', 'George Street', 'Canongate'] },
  { city: 'Bristol', area: 'BS', dist: '1', sector: '4UZ', streets: ['Corn Street', 'Park Street', 'King Street', 'Gloucester Road'] },
];

const CANADA_PROVINCES = [
  { name: 'Ontario', abbr: 'ON', cities: ['Toronto', 'Ottawa', 'Mississauga', 'Hamilton'], fsa: 'M4B' },
  { name: 'British Columbia', abbr: 'BC', cities: ['Vancouver', 'Victoria', 'Surrey', 'Burnaby'], fsa: 'V5K' },
  { name: 'Quebec', abbr: 'QC', cities: ['Montreal', 'Quebec City', 'Laval', 'Gatineau'], fsa: 'H2X' },
  { name: 'Alberta', abbr: 'AB', cities: ['Calgary', 'Edmonton', 'Red Deer'], fsa: 'T2P' },
];

const AUSTRALIA_STATES = [
  { name: 'New South Wales', abbr: 'NSW', cities: ['Sydney', 'Newcastle', 'Wollongong'], postMin: 2000, postMax: 2999 },
  { name: 'Victoria', abbr: 'VIC', cities: ['Melbourne', 'Geelong', 'Ballarat'], postMin: 3000, postMax: 3999 },
  { name: 'Queensland', abbr: 'QLD', cities: ['Brisbane', 'Gold Coast', 'Cairns'], postMin: 4000, postMax: 4999 },
  { name: 'Western Australia', abbr: 'WA', cities: ['Perth', 'Fremantle', 'Bunbury'], postMin: 6000, postMax: 6999 },
];

const INDIA_STATES = [
  { name: 'Maharashtra', abbr: 'MH', cities: ['Mumbai', 'Pune', 'Nagpur'], pinPrefix: '400' },
  { name: 'Karnataka', abbr: 'KA', cities: ['Bengaluru', 'Mysuru', 'Hubballi'], pinPrefix: '560' },
  { name: 'Delhi', abbr: 'DL', cities: ['New Delhi', 'North Delhi', 'South Delhi'], pinPrefix: '110' },
  { name: 'Tamil Nadu', abbr: 'TN', cities: ['Chennai', 'Coimbatore', 'Madurai'], pinPrefix: '600' },
  { name: 'Telangana', abbr: 'TG', cities: ['Hyderabad', 'Warangal', 'Nizamabad'], pinPrefix: '500' },
];

export function generateAddresses(options: AddressOptions = {}): GeneratedAddress[] {
  const { country = 'US', count = 10, seed } = options;
  const clampedCount = Math.max(1, Math.min(50, count));
  const prng = seed !== undefined ? createPrng(seed) : Math.random;

  const results: GeneratedAddress[] = [];

  for (let i = 0; i < clampedCount; i++) {
    const num = Math.floor(prng() * 9000 + 100);
    const streetName = STREET_NAMES[Math.floor(prng() * STREET_NAMES.length)];
    const streetType = STREET_TYPES[Math.floor(prng() * STREET_TYPES.length)];

    let streetAddress = `${num} ${streetName} ${streetType}`;
    let city = '';
    let stateOrProvince = '';
    let postalCode = '';
    let countryName = 'United States';

    if (country === 'US') {
      const stateObj = US_STATES[Math.floor(prng() * US_STATES.length)];
      city = stateObj.cities[Math.floor(prng() * stateObj.cities.length)];
      stateOrProvince = stateObj.abbr;
      const zip = Math.floor(prng() * (stateObj.zipMax - stateObj.zipMin) + stateObj.zipMin);
      postalCode = String(zip).padStart(5, '0');
      countryName = 'United States';
    } else if (country === 'UK') {
      const ukObj = UK_REGIONS[Math.floor(prng() * UK_REGIONS.length)];
      city = ukObj.city;
      stateOrProvince = 'UK';
      streetAddress = `${Math.floor(prng() * 300 + 1)} ${ukObj.streets[Math.floor(prng() * ukObj.streets.length)]}`;
      postalCode = `${ukObj.area}${ukObj.dist} ${ukObj.sector}`;
      countryName = 'United Kingdom';
    } else if (country === 'Canada') {
      const canObj = CANADA_PROVINCES[Math.floor(prng() * CANADA_PROVINCES.length)];
      city = canObj.cities[Math.floor(prng() * canObj.cities.length)];
      stateOrProvince = canObj.abbr;
      const ldu = `${Math.floor(prng() * 9 + 1)}A${Math.floor(prng() * 9 + 1)}`;
      postalCode = `${canObj.fsa} ${ldu}`;
      countryName = 'Canada';
    } else if (country === 'Australia') {
      const ausObj = AUSTRALIA_STATES[Math.floor(prng() * AUSTRALIA_STATES.length)];
      city = ausObj.cities[Math.floor(prng() * ausObj.cities.length)];
      stateOrProvince = ausObj.abbr;
      const post = Math.floor(prng() * (ausObj.postMax - ausObj.postMin) + ausObj.postMin);
      postalCode = String(post);
      countryName = 'Australia';
    } else if (country === 'India') {
      const indObj = INDIA_STATES[Math.floor(prng() * INDIA_STATES.length)];
      city = indObj.cities[Math.floor(prng() * indObj.cities.length)];
      stateOrProvince = indObj.abbr;
      const suffix = String(Math.floor(prng() * 900 + 100)).padStart(3, '0');
      postalCode = `${indObj.pinPrefix}${suffix}`;
      streetAddress = `${Math.floor(prng() * 500 + 1)}, MG Road`;
      countryName = 'India';
    }

    const fullAddress = `${streetAddress}, ${city}, ${stateOrProvince} ${postalCode}, ${countryName}`;
    results.push({
      streetAddress,
      city,
      stateOrProvince,
      postalCode,
      country: countryName,
      fullAddress,
    });
  }

  return results;
}

export function addressesToCSV(addresses: GeneratedAddress[]): string {
  if (addresses.length === 0) return '';
  const headers = ['Street Address', 'City', 'State/Province', 'Postal Code', 'Country', 'Full Address'];
  const rows = addresses.map((a) => [
    `"${a.streetAddress}"`,
    `"${a.city}"`,
    `"${a.stateOrProvince}"`,
    `"${a.postalCode}"`,
    `"${a.country}"`,
    `"${a.fullAddress}"`,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}
