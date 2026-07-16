import { isValidVin, normalizeVin } from './vin';

const REQUIRED_FIELDS = [
  'stock_id',
  'title',
  'description',
  'make',
  'model',
  'year',
  'mileage',
  'price',
  'currency',
  'fuel_type',
  'transmission',
  'body_type',
  'vin',
  'city',
  'county',
] as const;

type RequiredField = typeof REQUIRED_FIELDS[number];

/** Romanian headers are the public dealer contract. English aliases keep the
 * first template and exports from existing dealer systems compatible. */
const HEADER_ALIASES: Record<RequiredField, readonly string[]> = {
  stock_id: ['id_stoc', 'stock_id'],
  title: ['titlu', 'title'],
  description: ['descriere', 'description'],
  make: ['marca', 'make'],
  model: ['model'],
  year: ['an_fabricatie', 'year'],
  mileage: ['kilometraj', 'mileage'],
  price: ['pret', 'preț', 'price'],
  currency: ['moneda', 'monedă', 'currency'],
  fuel_type: ['combustibil', 'fuel_type'],
  transmission: ['transmisie', 'transmission'],
  body_type: ['caroserie', 'body_type'],
  vin: ['vin'],
  city: ['oras', 'oraș', 'city'],
  county: ['judet', 'județ', 'county'],
};

export const DEALER_CSV_HEADERS = REQUIRED_FIELDS.map((field) => HEADER_ALIASES[field][0]);

export const DEALER_CSV_MAX_ROWS = 100;

export type DealerCsvListing = {
  externalStockId: string;
  title: string;
  description: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  price: number;
  currency: 'EUR' | 'RON';
  fuelType: 'petrol' | 'diesel' | 'hybrid' | 'electric' | 'lpg' | 'cng';
  transmission: 'manual' | 'automatic' | 'semi_automatic' | 'cvt';
  bodyType: string | null;
  vin: string | null;
  city: string;
  county: string;
};

export type DealerCsvRow = {
  rowNumber: number;
  externalStockId: string;
  errors: string[];
  listing?: DealerCsvListing;
  raw: Record<string, string>;
};

export type DealerCsvParseResult = {
  rows: DealerCsvRow[];
  missingHeaders: string[];
};

const FUEL_ALIASES: Record<string, DealerCsvListing['fuelType']> = {
  petrol: 'petrol', benzina: 'petrol', benzină: 'petrol',
  diesel: 'diesel', motorina: 'diesel', motorină: 'diesel',
  hybrid: 'hybrid', hibrid: 'hybrid',
  electric: 'electric', electrica: 'electric', electrică: 'electric',
  lpg: 'lpg', gpl: 'lpg', cng: 'cng',
};

const TRANSMISSION_ALIASES: Record<string, DealerCsvListing['transmission']> = {
  manual: 'manual', manuala: 'manual', 'manuală': 'manual',
  automatic: 'automatic', automata: 'automatic', 'automată': 'automatic',
  semi_automatic: 'semi_automatic', semiautomata: 'semi_automatic', 'semi-automată': 'semi_automatic',
  cvt: 'cvt',
};

function detectDelimiter(value: string) {
  let quoted = false;
  let commas = 0;
  let semicolons = 0;
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    const next = value[index + 1];
    if (char === '"' && quoted && next === '"') {
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (!quoted && (char === '\n' || char === '\r')) {
      break;
    } else if (!quoted && char === ',') {
      commas += 1;
    } else if (!quoted && char === ';') {
      semicolons += 1;
    }
  }
  return semicolons > commas ? ';' : ',';
}

function parseCsvRecords(value: string): string[][] {
  const delimiter = detectDelimiter(value);
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    const next = value[index + 1];

    if (char === '"' && quoted && next === '"') {
      field += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      row.push(field.trim());
      field = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') index += 1;
      row.push(field.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }

  if (quoted) throw new Error('CSV-ul are un câmp cu ghilimele neînchise.');
  row.push(field.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function clean(value: string, maxLength: number) {
  return value.trim().replace(/\s+/g, ' ').slice(0, maxLength);
}

function parseDecimal(value: string) {
  const compact = value.replace(/\s/g, '');
  const normalized = compact.includes(',')
    ? compact.replace(/\./g, '').replace(',', '.')
    : compact;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function parseWholeNumber(value: string) {
  const number = parseDecimal(value);
  return number !== null && Number.isInteger(number) ? number : null;
}

function normalizeLookup(value: string) {
  return clean(value, 40).toLocaleLowerCase('ro-RO').replace(/\s+/g, '_');
}

function toRecord(headers: string[], values: string[]) {
  return REQUIRED_FIELDS.reduce<Record<string, string>>((result, field) => {
    const index = headers.findIndex((header) => HEADER_ALIASES[field].includes(header));
    result[field] = index >= 0 ? values[index] || '' : '';
    return result;
  }, {});
}

export function parseDealerCsv(value: string): DealerCsvParseResult {
  const records = parseCsvRecords(value.replace(/^\uFEFF/, ''));
  if (records.length < 2) throw new Error('CSV-ul trebuie să aibă un antet și cel puțin o mașină.');
  if (records.length - 1 > DEALER_CSV_MAX_ROWS) {
    throw new Error(`Un import poate conține cel mult ${DEALER_CSV_MAX_ROWS} mașini.`);
  }

  const headers = records[0].map((header) => clean(header, 60).toLocaleLowerCase('ro-RO'));
  const missingHeaders = REQUIRED_FIELDS
    .filter((field) => !HEADER_ALIASES[field].some((header) => headers.includes(header)))
    .map((field) => HEADER_ALIASES[field][0]);
  if (missingHeaders.length) return { rows: [], missingHeaders: [...missingHeaders] };

  const currentYear = new Date().getFullYear();
  const seenStockIds = new Set<string>();
  const rows = records.slice(1).map((values, index): DealerCsvRow => {
    const raw = toRecord(headers, values);
    const errors: string[] = [];
    const externalStockId = clean(raw.stock_id, 100);
    const title = clean(raw.title, 150);
    const description = raw.description.trim().slice(0, 5000);
    const make = clean(raw.make, 60);
    const model = clean(raw.model, 80);
    const year = parseWholeNumber(raw.year);
    const mileage = parseWholeNumber(raw.mileage);
    const price = parseDecimal(raw.price);
    const currency = clean(raw.currency || 'EUR', 3).toUpperCase();
    const fuelType = FUEL_ALIASES[normalizeLookup(raw.fuel_type)];
    const transmission = TRANSMISSION_ALIASES[normalizeLookup(raw.transmission)];
    const city = clean(raw.city, 100);
    const county = clean(raw.county, 100);
    const vin = raw.vin ? normalizeVin(raw.vin) : null;

    if (!externalStockId) errors.push('Lipsește stock_id.');
    else if (seenStockIds.has(externalStockId)) errors.push('stock_id este duplicat în acest CSV.');
    seenStockIds.add(externalStockId);
    if (title.length < 8) errors.push('Titlul trebuie să aibă cel puțin 8 caractere.');
    if (description.length < 50) errors.push('Descrierea trebuie să aibă cel puțin 50 de caractere.');
    if (!make || !model) errors.push('Marca și modelul sunt obligatorii.');
    if (year === null || year < 1950 || year > currentYear + 1) errors.push('Anul fabricației nu este valid.');
    if (mileage === null || mileage < 0 || mileage > 2_500_000) errors.push('Kilometrajul nu este valid.');
    if (price === null || price <= 0 || price > 100_000_000) errors.push('Prețul nu este valid.');
    if (currency !== 'EUR' && currency !== 'RON') errors.push('Moneda trebuie să fie EUR sau RON.');
    if (!fuelType) errors.push('Combustibil nerecunoscut.');
    if (!transmission) errors.push('Transmisie nerecunoscută.');
    if (city.length < 2 || county.length < 2) errors.push('Orașul și județul sunt obligatorii.');
    if (vin && !isValidVin(vin)) errors.push('VIN-ul trebuie să aibă 17 caractere valide.');

    const row: DealerCsvRow = { rowNumber: index + 2, externalStockId, errors, raw };
    if (!errors.length && year !== null && mileage !== null && price !== null && fuelType && transmission && (currency === 'EUR' || currency === 'RON')) {
      row.listing = {
        externalStockId,
        title,
        description,
        make,
        model,
        year,
        mileage,
        price,
        currency,
        fuelType,
        transmission,
        bodyType: clean(raw.body_type, 50) || null,
        vin,
        city,
        county,
      };
    }
    return row;
  });

  return { rows, missingHeaders: [] };
}
