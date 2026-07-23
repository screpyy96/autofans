import * as cheerio from 'cheerio';

export const AUTOPORT_INVENTORY_URL = 'https://autoport.ro/autoturisme-masini-rulate-la-comanda-in-rate-buy-back/';
export const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
export const FETCH_TIMEOUT_MS = 20000;

export interface AutoportInventoryItem {
  sourceUrl: string;
  sourceSlug: string;
  sourceStatus: string;
  title: string;
  priceText?: string;
  price?: number;
}

export interface AutoportInventoryScanResult {
  importBatchName: string;
  total: number;
  items: AutoportInventoryItem[];
}

export interface AutoportScrapedVehicle {
  sourceUrl: string;
  sourceSlug: string;
  sourceStatus: string;
  title: string;
  price: number;
  currency: string;
  make: string;
  model: string;
  version?: string;
  year: number;
  mileage: number;
  fuel: string;
  transmission: string;
  bodyType?: string;
  vin?: string;
  engineCapacity?: number;
  power?: number;
  consumption?: string;
  emissions?: string;
  drivetrain?: string;
  description: string;
  equipment: string[];
  imageUrls: string[];
}

export function isAutoportUrlAllowed(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname === 'autoport.ro' && parsed.pathname.startsWith('/auto/');
  } catch {
    return false;
  }
}

export function parseRomanianPrice(text: string): number | null {
  if (!text) return null;

  // Try to find a price near EUR/€ marker
  // Support formats: 34.472 / 34,472 / 34 472 / 34.472,00 / 34,472.00
  const pricePatterns = [
    // "34.472 EUR" or "34.472,00 EUR" (Romanian: dots = thousands, comma = decimals)
    /(\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?)\s*(?:EUR|€)/i,
    // "34,472 EUR" or "34,472.00 EUR" (English: commas = thousands, dot = decimals)
    /(\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?)\s*(?:EUR|€)/i,
    // "34 472 EUR" (space as thousands separator)
    /(\d{1,3}(?:\s\d{3})+)\s*(?:EUR|€)/i,
    // Simple "34472 EUR" (no separator)
    /(\d{4,6})\s*(?:EUR|€)/i,
    // EUR/€ before number: "€ 34.472" / "EUR 34.472"
    /(?:€|EUR)\s*:?\s*(\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?)/i,
    /(?:€|EUR)\s*:?\s*(\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?)/i,
    /(?:€|EUR|Preț|Pret)\s*:?\s*(\d{4,6})/i,
  ];

  for (const pattern of pricePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      // Remove all thousands separators (dots, commas used as thousands, spaces)
      // Determine format: if last separator is comma followed by 1-2 digits at end, it's decimal
      let raw = match[1];

      // Check if format is like "34.472,00" (Romanian) - comma is decimal
      if (/\.\d{3}.*,\d{1,2}$/.test(raw)) {
        raw = raw.replace(/\./g, '').replace(',', '.');
      }
      // Check if format is like "34,472.00" (English) - dot is decimal
      else if (/,\d{3}.*\.\d{1,2}$/.test(raw)) {
        raw = raw.replace(/,/g, '');
      }
      // Otherwise just remove all non-digit characters (dots, commas, spaces as thousands separators)
      else {
        raw = raw.replace(/[.\s,]/g, '');
      }

      const val = Math.round(parseFloat(raw));
      if (!Number.isNaN(val) && val > 0) return val;
    }
  }

  return null;
}

export function parseRomanianMileage(text: string): number | null {
  if (!text) return null;
  const match = text.match(/(\d{1,3}(?:\.\d{3})+|\d+)\s*(?:km|kilometri)/i) ||
                text.match(/(\d{1,3}(?:\.\d{3})+|\d+)/);
  if (!match) return null;
  const rawNum = match[1].replace(/\./g, '');
  const val = parseInt(rawNum, 10);
  return Number.isNaN(val) || val < 0 ? null : val;
}

export function parseEngineCapacity(text: string): number | null {
  if (!text) return null;
  // Handle 1.995 cc -> 1995, 1598 cmc -> 1598
  const cleaned = text.replace(/(\d)\.(\d{3})/g, '$1$2');
  const match = cleaned.match(/(\d{3,4})\s*(?:cmc|cc|cm³)/i) || cleaned.match(/(\d{3,4})/);
  if (!match) return null;
  const val = parseInt(match[1], 10);
  return Number.isNaN(val) || val < 400 || val > 10000 ? null : val;
}

export function parsePower(text: string): number | null {
  if (!text) return null;
  const match = text.match(/(\d{2,4})\s*(?:cp|hp|kw)/i) || text.match(/(\d{2,4})/);
  if (!match) return null;
  const val = parseInt(match[1], 10);
  return Number.isNaN(val) || val < 20 || val > 2000 ? null : val;
}

export function mapFuelType(text: string): string {
  const normalized = (text || '').toLowerCase().trim();
  if (normalized.includes('diesel') || normalized.includes('motorină') || normalized.includes('motorina')) {
    return 'diesel';
  }
  if (normalized.includes('electric') || normalized.includes('electrică') || normalized.includes('electrica')) {
    return 'electric';
  }
  if (normalized.includes('gpl') || normalized.includes('lpg')) {
    return 'lpg';
  }
  if (normalized.includes('hybrid') || normalized.includes('hibrid') || normalized.includes('plugin') || normalized.includes('electro')) {
    return 'hybrid';
  }
  return 'petrol';
}

export function mapTransmission(text: string): string {
  const normalized = (text || '').toLowerCase().trim();
  if (normalized.includes('manual') || normalized.includes('manuală') || normalized.includes('manuala')) {
    return 'manual';
  }
  if (normalized.includes('cvt') || normalized.includes('xtronic')) {
    return 'cvt';
  }
  if (
    normalized.includes('automat') ||
    normalized.includes('automată') ||
    normalized.includes('automata') ||
    normalized.includes('automatic') ||
    normalized.includes('dsg') ||
    normalized.includes('geartronic') ||
    normalized.includes('g-tronic') ||
    normalized.includes('s-tronic') ||
    normalized.includes('steptronic') ||
    normalized.includes('tiptronic')
  ) {
    return 'automatic';
  }
  return 'manual';
}

export function isCardIncludedByStatus(status: string): boolean {
  const normalized = (status || '').toLowerCase().trim();
  return (
    normalized.includes('in stoc') ||
    normalized.includes('în stoc') ||
    normalized.includes('in transport') ||
    normalized.includes('în transport') ||
    normalized.includes('rezervat')
  );
}

// Equipment category definitions for smart grouping
const EQUIPMENT_CATEGORIES: Array<{ label: string; icon: string; keywords: string[] }> = [
  {
    label: 'Audio & Multimedia',
    icon: '🎵',
    keywords: ['android', 'bluetooth', 'audio', 'navigat', 'radio', 'touch screen', 'monitor', 'hands-free', 'hands free', 'usb', 'vocal', 'internet', 'display', 'multimedia', 'spotify', 'apple carplay', 'carplay', 'wireless charg'],
  },
  {
    label: 'Climatizare & Confort',
    icon: '❄️',
    keywords: ['climatronic', 'climatizar', 'aer conditionat', 'aer condiționat', 'incalzire', 'încălzire', 'cotiera', 'cotieră', 'senzor ploaie', 'stergatoare', 'ștergătoare', 'parasolar', 'trapa', 'trapă'],
  },
  {
    label: 'Scaune & Interior',
    icon: '💺',
    keywords: ['scaun', 'tapiterie', 'tapițerie', 'piele', 'lombar', 'ventilat', 'masaj', 'memorie', 'tetier', 'reglabil', 'rabatabil spate', 'bancheta'],
  },
  {
    label: 'Volan & Comenzi',
    icon: '🎯',
    keywords: ['volan', 'cruise', 'pilot automat', 'keyless', 'start/stop', 'start stop', 'limitator'],
  },
  {
    label: 'Geamuri & Oglinzi',
    icon: '🪟',
    keywords: ['geamuri', 'geam', 'privacy glass', 'oglinzi', 'oglindă', 'oglinda', 'unghi mort'],
  },
  {
    label: 'Siguranță & Airbag',
    icon: '🛡️',
    keywords: ['airbag', 'abs', 'esp', 'tractiune', 'tracțiune', 'rampa', 'rampă', 'panta', 'pantă', 'senzori presiune', 'servodirecti', 'isofix', 'centur'],
  },
  {
    label: 'Asistență la Condus',
    icon: '🤖',
    keywords: ['asistenta', 'asistență', 'lane assist', 'schimbare banda', 'schimbare bandă', 'control distan', 'recunoaster', 'recunoaștere', 'faza lunga', 'faza lungă', 'semne trafic', 'indicatoare'],
  },
  {
    label: 'Faruri & Lumini',
    icon: '💡',
    keywords: ['faruri', 'far ', 'led', 'lumini', 'xenon', 'bixenon', 'laser', 'adaptiv', 'directional', 'direcțional', 'ceata', 'ceață', 'follow me', 'iluminare'],
  },
  {
    label: 'Parcare & Camere',
    icon: '📸',
    keywords: ['parcare', 'camera video', 'cameră video', 'camera 360', 'senzori parcare', 'parktronic', 'park assist'],
  },
  {
    label: 'Motor & Performanță',
    icon: '⚡',
    keywords: ['turbo', '4x4', 'awd', '4wd', 'sport', 'paddle', 'launch control', 'mod condus', 'suspensie', 'amortizo'],
  },
];

const EQUIPMENT_KEYWORDS = Array.from(new Set(
  EQUIPMENT_CATEGORIES.flatMap((category) => category.keywords),
));

const OBSERVATION_SIGNAL_WORDS = [
  'istoric',
  'revizie',
  'proprietar',
  'garan',
  'stare',
  'import',
  'accident',
  'defect',
  'întreținut',
  'intretinut',
  'schimbat',
  'service',
  'carte service',
];

export function categorizeEquipment(equipment: string[]): string {
  if (!equipment.length) return '';

  const categorized = new Map<string, string[]>();
  const uncategorized: string[] = [];

  for (const item of equipment) {
    const lower = item.toLowerCase();
    let matched = false;

    for (const cat of EQUIPMENT_CATEGORIES) {
      if (cat.keywords.some(kw => lower.includes(kw))) {
        const key = cat.label;
        if (!categorized.has(key)) categorized.set(key, []);
        categorized.get(key)!.push(item);
        matched = true;
        break;
      }
    }

    if (!matched) {
      uncategorized.push(item);
    }
  }

  // If very few items, don't bother categorizing
  if (equipment.length <= 5) {
    return `DOTĂRI ȘI ECHIPAMENTE\n${equipment.map(e => `- ${e}`).join('\n')}`;
  }

  const sections: string[] = ['DOTĂRI ȘI ECHIPAMENTE'];

  for (const [categoryHeader, items] of categorized) {
    sections.push(`\n${categoryHeader}`);
    for (const item of items) {
      sections.push(`- ${item}`);
    }
  }

  if (uncategorized.length > 0) {
    sections.push(`\nAltele`);
    for (const item of uncategorized) {
      sections.push(`- ${item}`);
    }
  }

  return sections.join('\n');
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeDescriptionText(value: string) {
  return value
    .replace(/Acasă|Masini rulate|Contact|Termeni și condiții|Politica de confidențialitate/gi, '')
    .replace(/Distribuie\s*:?.*/gi, '')
    .replace(/finanțare posibilă/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractRichDescriptionParts($: cheerio.CheerioAPI) {
  const candidateBlocks = $('.descriere, .entry-content, .product-description, #tab-description');
  const parts = candidateBlocks
    .find('p, li')
    .map((_, el) => normalizeDescriptionText($(el).text()))
    .get()
    .filter((text) => text.length > 30);

  if (parts.length) {
    return Array.from(new Set(parts));
  }

  return $('p')
    .map((_, el) => normalizeDescriptionText($(el).text()))
    .get()
    .filter((text) => text.length > 30);
}

function isLikelyEquipmentLine(text: string) {
  const normalized = text.toLowerCase();
  if (!normalized || normalized.length > 100) return false;
  if (OBSERVATION_SIGNAL_WORDS.some((word) => normalized.includes(word))) return false;
  if (/[.!?]/.test(text)) return false;

  const hasEquipmentKeyword = EQUIPMENT_KEYWORDS.some((keyword) => normalized.includes(keyword));
  if (hasEquipmentKeyword) return true;

  if (normalized.includes(':')) {
    const [left, right] = normalized.split(':', 2).map((part) => part.trim());
    if (left.length <= 40 && right.length <= 60) return true;
  }

  const words = normalized.split(/\s+/).filter(Boolean);
  return words.length <= 8;
}

function shouldKeepObservationText(rawDesc: string, equipment: string[]) {
  if (!rawDesc || rawDesc.length < 40) return false;

  const normalized = rawDesc.toLowerCase();
  const hasNarrativeSignal = OBSERVATION_SIGNAL_WORDS.some((word) => normalized.includes(word));
  const hasSentenceStructure = /[.!?]/.test(rawDesc);
  const equipmentHits = equipment.filter((item) => normalized.includes(item.toLowerCase())).length;

  if (!hasNarrativeSignal && !hasSentenceStructure) return false;
  if (equipment.length >= 8 && equipmentHits >= Math.max(4, Math.floor(equipment.length / 3))) return false;

  return true;
}

export function normalizeWpImageUrl(url: string): string {
  if (!url) return '';
  let clean = url.trim();
  if (clean.startsWith('//')) {
    clean = `https:${clean}`;
  }
  // Remove WordPress thumbnail suffix like -350x196 or -1024x768 before file extension
  clean = clean.replace(/-\d{2,4}x\d{2,4}(?=\.[a-zA-Z]+(?:\?|$))/i, '');
  // Remove query params
  clean = clean.split('?')[0];
  return clean;
}

export function filterAndDeduplicateImages(urls: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const raw of urls) {
    const normalized = normalizeWpImageUrl(raw);
    if (!normalized) continue;
    const lower = normalized.toLowerCase();

    // Filter logos, icons, banners, financing graphics, SVG, avatars
    if (
      lower.endsWith('.svg') ||
      lower.includes('logo') ||
      lower.includes('finantare') ||
      lower.includes('banner') ||
      lower.includes('icon') ||
      lower.includes('avatar') ||
      lower.includes('favicon') ||
      lower.includes('service') ||
      lower.includes('autoport-logo') ||
      lower.includes('facebook') ||
      lower.includes('instagram') ||
      lower.includes('whatsapp')
    ) {
      continue;
    }

    if (!seen.has(normalized)) {
      seen.add(normalized);
      result.push(normalized);
    }
    if (result.length >= 15) break;
  }

  return result;
}

export function extractVehicleCardsFromHtml(html: string): AutoportInventoryItem[] {
  const $ = cheerio.load(html);
  const items: AutoportInventoryItem[] = [];
  const seenUrls = new Set<string>();

  // Find all elements containing links to /auto/
  $('a[href*="/auto/"]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;

    let fullUrl = href.trim();
    if (fullUrl.startsWith('/')) {
      fullUrl = `https://autoport.ro${fullUrl}`;
    }
    if (!isAutoportUrlAllowed(fullUrl)) return;

    // Normalize URL (strip trailing slash for slug matching, then format)
    const urlObj = new URL(fullUrl);
    const pathname = urlObj.pathname.replace(/\/+$/, '');
    const sourceSlug = pathname.split('/').pop() || '';
    if (!sourceSlug || sourceSlug === 'auto') return;

    const canonicalUrl = `https://autoport.ro/auto/${sourceSlug}/`;
    if (seenUrls.has(canonicalUrl)) return;

    // Find card container
    const $card = $(el).closest('.car-card, .vehicle-card, .elementor-widget-container, article, .item, .col, div.elementor-column, div');
    const cardText = $card.text() || '';

    // Status detection
    let sourceStatus = 'In Stoc';
    const lowerCardText = cardText.toLowerCase();

    if (lowerCardText.includes('vândut') || lowerCardText.includes('vandut')) {
      sourceStatus = 'Vândut';
    } else if (lowerCardText.includes('rezervat')) {
      sourceStatus = 'Rezervat';
    } else if (lowerCardText.includes('in transport') || lowerCardText.includes('în transport')) {
      sourceStatus = 'În Transport';
    } else if (lowerCardText.includes('in stoc') || lowerCardText.includes('în stoc')) {
      sourceStatus = 'În Stoc';
    }

    // Exclude if card status is not allowed
    if (!isCardIncludedByStatus(sourceStatus)) {
      return;
    }

    // Extract title & price
    const cardTitle = $(el).text().trim() || $card.find('h2, h3, h4, .title, .car-title').first().text().trim() || sourceSlug.replace(/-/g, ' ');
    const priceText = $card.find('.price, .pret, .amount').text().trim() || cardText;
    const price = parseRomanianPrice(priceText);

    // Exclude historical entries that have no valid EUR price
    if (!price) {
      return;
    }

    seenUrls.add(canonicalUrl);
    items.push({
      sourceUrl: canonicalUrl,
      sourceSlug,
      sourceStatus,
      title: cardTitle.length > 3 ? cardTitle : sourceSlug.replace(/-/g, ' '),
      priceText: `${price.toLocaleString('ro-RO')} EUR`,
      price,
    });
  });

  return items;
}

export function parseVehicleFromHtml(html: string, pageUrl: string): AutoportScrapedVehicle {
  const $ = cheerio.load(html);
  const urlObj = new URL(pageUrl);
  const sourceSlug = urlObj.pathname.replace(/\/+$/, '').split('/').pop() || '';

  // 1. JSON-LD extraction
  let jsonLdData: any = null;
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const parsed = JSON.parse($(el).html() || '');
      if (parsed['@type'] === 'Car' || parsed['@type'] === 'Vehicle' || parsed['@type'] === 'Product') {
        jsonLdData = parsed;
      } else if (Array.isArray(parsed['@graph'])) {
        const item = parsed['@graph'].find((g: any) => g['@type'] === 'Car' || g['@type'] === 'Vehicle' || g['@type'] === 'Product');
        if (item) jsonLdData = item;
      }
    } catch {}
  });

  // Title
  const title = (
    jsonLdData?.name ||
    $('h1.entry-title, h1.product_title, h1').first().text().trim() ||
    $('title').text().split('|')[0].trim() ||
    sourceSlug.replace(/-/g, ' ')
  ).replace(/\s+/g, ' ');

  // Status
  const bodyText = $('body').text() || '';
  let sourceStatus = 'În Stoc';
  if (bodyText.includes('Rezervat') || bodyText.includes('REZERVAT')) {
    sourceStatus = 'Rezervat';
  } else if (bodyText.includes('În Transport') || bodyText.includes('In Transport') || bodyText.includes('ÎN TRANSPORT')) {
    sourceStatus = 'În Transport';
  }

  // Price (pick reduced/current price if available)
  let rawPriceText = '';
  const $insPrice = $('ins .amount, ins, .current-price, .new-price, .pret-reducere').first();
  if ($insPrice.length) {
    rawPriceText = $insPrice.text();
  } else {
    const $priceContainer = $('.price-block, .price-title, .price, .pret-produs, .amount-container').first().clone();
    $priceContainer.find('del, .old-price, .crossed-out, .pret-vechi').remove();
    rawPriceText = $priceContainer.text()
      || $('.price-title, .price-block, .price, .pret-produs').first().text()
      || bodyText;
  }

  let price = parseRomanianPrice(rawPriceText);

  // JSON-LD fallback — only use if currency is EUR (WooCommerce may store prices in RON)
  if (!price && jsonLdData?.offers?.price) {
    const jsonLdCurrency = (jsonLdData.offers.priceCurrency || '').toUpperCase();
    const jsonLdPrice = Number(jsonLdData.offers.price);
    if (jsonLdCurrency === 'EUR' && jsonLdPrice > 0) {
      price = Math.round(jsonLdPrice);
    }
  }
  price = price || 0;

  // Key-value specifications map from table / dl / list
  const specs = new Map<string, string>();
  $('.attribute-box, .attributes-box, .attribute-item').each((_, el) => {
    const key = $(el).find('.label-text, .label, .attribute-label').first().text().trim().toLowerCase();
    const val = $(el).find('.value-text, .value, .attribute-value').first().text().trim();
    if (key && val) specs.set(key, val);
  });

  $('ul.car-attributes li, .details-block li').each((_, el) => {
    const key = $(el).find('strong').first().text().trim().toLowerCase();
    const val = $(el).find('span').first().text().trim();
    if (key && val) specs.set(key, val);
  });

  $('table tr, dl, li, div.spec-item, div.elementor-icon-box-wrapper, tr').each((_, el) => {
    const text = $(el).text().trim();
    if (text.includes(':')) {
      const parts = text.split(':');
      const key = parts[0].trim().toLowerCase();
      const val = parts.slice(1).join(':').trim();
      if (key && val) specs.set(key, val);
    }
  });

  // Extract fields
  const make = (
    jsonLdData?.brand?.name ||
    jsonLdData?.manufacturer?.name ||
    specs.get('marcă') ||
    specs.get('marca') ||
    title.split(' ')[0] ||
    'Auto'
  ).trim();

  const model = (
    jsonLdData?.model ||
    specs.get('model') ||
    title.split(' ').slice(1, 3).join(' ') ||
    'Model'
  ).trim();

  const version = (
    specs.get('versiune') ||
    specs.get('varianta') ||
    specs.get('trim') ||
    title.split(' ').slice(2).join(' ') ||
    ''
  ).trim();

  // Year
  const yearText = specs.get('an') || specs.get('anul') || specs.get('an fabricație') || specs.get('an fabricatie') || '';
  let year = parseInt(yearText, 10);
  if (Number.isNaN(year) || year < 1950 || year > 2030) {
    const yearMatch = title.match(/\b(19\d\d|20\d\d)\b/) || bodyText.match(/An\s*:?\s*\b(19\d\d|20\d\d)\b/i);
    year = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear();
  }

  // Mileage
  let mileageText = (
    specs.get('rulaj') ||
    specs.get('rulaj (km)') ||
    specs.get('kilometri') ||
    specs.get('km') ||
    specs.get('kilometraj') ||
    specs.get('kilometraj (km)') ||
    jsonLdData?.mileageFromOdometer?.value ||
    bodyText.match(/(?:Rulaj|Kilometraj|Km)\s*:?\s*([\d\.\s]+)/i)?.[1] ||
    bodyText.match(/(\d{1,3}(?:\.\d{3})+)\s*km/i)?.[1] ||
    ''
  ).toString();
  const mileage = parseRomanianMileage(mileageText) || (jsonLdData?.mileageFromOdometer?.value ? Number(jsonLdData.mileageFromOdometer.value) : 0);

  // Fuel & Transmission
  const fuelText = specs.get('combustibil') || specs.get('carburant') || jsonLdData?.fuelType || bodyText;
  const fuel = mapFuelType(fuelText);

  const transText = specs.get('transmisie') || specs.get('cutie de viteze') || specs.get('cutie') || jsonLdData?.vehicleTransmission || bodyText;
  const transmission = mapTransmission(transText);

  // Body Type & VIN (with 17-char VIN regex fallback)
  const bodyType = (specs.get('caroserie') || specs.get('tip caroserie') || jsonLdData?.bodyType || '').trim();

  let vin = (specs.get('vin') || specs.get('serie sasiu') || specs.get('serie de șasiu') || specs.get('serie șasiu') || jsonLdData?.vehicleIdentificationNumber || '').trim().toUpperCase();
  if (!vin || vin.length !== 17) {
    const vinMatch = bodyText.match(/\b([A-HJ-NPR-Z0-9]{17})\b/i);
    if (vinMatch && vinMatch[1] && !vinMatch[1].startsWith('00000')) {
      vin = vinMatch[1].toUpperCase();
    } else {
      vin = '';
    }
  }
  // Strict DB constraint validation: vin must be exactly 17 valid chars or null
  if (vin && !/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) {
    vin = '';
  }

  // Consumption, Emissions & Drivetrain
  const consumption = (
    specs.get('consum') ||
    specs.get('consum mixt') ||
    specs.get('consum mediu') ||
    bodyText.match(/(\d+(?:[\.,]\d+)?\s*l\s*\/\s*100\s*km)/i)?.[1] ||
    ''
  ).trim();

  const emissions = (
    specs.get('emisii') ||
    specs.get('emisii co2') ||
    specs.get('norma poluare') ||
    specs.get('normă poluare') ||
    bodyText.match(/(\d+\s*g\s*\/\s*km(?:\s*CO2)?|Euro\s*[456][a-z]*)/i)?.[1] ||
    ''
  ).trim();

  const drivetrain = (
    specs.get('tracțiune') ||
    specs.get('tractiune') ||
    specs.get('propulsie') ||
    bodyText.match(/(4x4|AWD|4WD|tracțiune integrală|tractiune integrala|tracțiune față|tracțiune spate)/i)?.[1] ||
    ''
  ).trim();

  // Engine capacity & Power
  const engineText = specs.get('capacitate cilindrică') || specs.get('capacitate cilindrica') || specs.get('motor') || specs.get('cmc') || bodyText;
  const engineCapacity = parseEngineCapacity(engineText) || undefined;

  const powerText = specs.get('putere') || specs.get('cp') || bodyText;
  const power = parsePower(powerText) || undefined;

  // Equipment / Features
  const equipment: string[] = [];
  $('.dotari li, .equipments li, ul.dotari-list li, ul.features li, .elementor-icon-list-item').each((_, el) => {
    const txt = $(el).text().trim();
    if (txt && txt.length > 2 && !txt.includes('http') && !equipment.includes(txt)) {
      equipment.push(txt);
    }
  });

  // Images
  const rawImageUrls: string[] = [];
  if (jsonLdData?.image) {
    if (Array.isArray(jsonLdData.image)) {
      rawImageUrls.push(...jsonLdData.image);
    } else if (typeof jsonLdData.image === 'string') {
      rawImageUrls.push(jsonLdData.image);
    }
  }

  $('img, a[href*="wp-content/uploads"]').each((_, el) => {
    const src = $(el).attr('href') || $(el).attr('data-full-src') || $(el).attr('data-large-file') || $(el).attr('data-src') || $(el).attr('src');
    if (src && (src.includes('wp-content/uploads') || src.includes('.jpg') || src.includes('.png') || src.includes('.webp'))) {
      rawImageUrls.push(src);
    }
  });

  const imageUrls = filterAndDeduplicateImages(rawImageUrls);

  // Original Description cleaning (exclude header, footer, navigation)
  const rawDescriptionParts = extractRichDescriptionParts($);
  const inferredEquipment = rawDescriptionParts.filter(isLikelyEquipmentLine);
  for (const item of inferredEquipment) {
    if (!equipment.some((existing) => existing.toLowerCase() === item.toLowerCase())) {
      equipment.push(item);
    }
  }
  let rawDesc = rawDescriptionParts.filter((part) => !isLikelyEquipmentLine(part)).join('\n\n');

  // Generate AutoFans rich structured description
  const specSection = [
    `IDENTIFICARE ȘI STATUS`,
    `- Stare stoc: ${sourceStatus}`,
    `- Model: ${make} ${model} ${version}`.trim(),
    `- An fabricație: ${year}`,
    `- Rulaj declarat: ${mileage.toLocaleString('ro-RO')} km`,
    vin ? `- Serie șasiu (VIN): ${vin}` : '',
    '',
    `SPECIFICAȚII TEHNICE`,
    `- Combustibil: ${fuel.toUpperCase()}`,
    `- Transmisie: ${transmission.toUpperCase()}`,
    engineCapacity ? `- Motorizare: ${engineCapacity} cmc` : '',
    power ? `- Putere: ${power} CP` : '',
    drivetrain ? `- Tracțiune: ${drivetrain}` : '',
    bodyType ? `- Caroserie: ${bodyType}` : '',
    consumption ? `- Consum: ${consumption}` : '',
    emissions ? `- Normă poluare / emisii: ${emissions}` : '',
  ].filter(line => line !== '').join('\n');

  // Categorize equipment into smart groups for a premium description
  const equipmentSection = categorizeEquipment(equipment);

  // Clean rawDesc: remove equipment items that are already categorized
  if (rawDesc && equipment.length > 5) {
    for (const item of equipment) {
      rawDesc = rawDesc.replace(new RegExp(escapeRegExp(item), 'gi'), '');
    }
    rawDesc = rawDesc
      .replace(/\bDotări\b/gi, '')
      .replace(/\bDescriere\b/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  const origDescSection = shouldKeepObservationText(rawDesc, equipment)
    ? `\n\nOBSERVAȚII SUPLIMENTARE\n${rawDesc.slice(0, 1000)}`
    : '';

  const description = `${specSection}\n\n${equipmentSection}${origDescSection}\n\nSURSĂ\n- Importat din prezentarea dealerului Autoport Suceava`;

  return {
    sourceUrl: pageUrl,
    sourceSlug,
    sourceStatus,
    title,
    price: price || 0,
    currency: 'EUR',
    make,
    model,
    version,
    year,
    mileage,
    fuel,
    transmission,
    bodyType: bodyType || undefined,
    vin: vin || undefined,
    engineCapacity,
    power,
    consumption: consumption || undefined,
    emissions: emissions || undefined,
    drivetrain: drivetrain || undefined,
    description,
    equipment,
    imageUrls,
  };
}

export async function scanAutoportInventory(): Promise<AutoportInventoryScanResult> {
  const allItems: AutoportInventoryItem[] = [];
  const seenUrls = new Set<string>();

  // Scan multiple pages (page 1 to 10) to capture entire Autoport inventory
  for (let page = 1; page <= 10; page++) {
    const pageUrl = page === 1 ? AUTOPORT_INVENTORY_URL : `${AUTOPORT_INVENTORY_URL}page/${page}/`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(pageUrl, {
        headers: {
          'User-Agent': DEFAULT_USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        // If page 2+ returns 404, we reached the end of pagination
        if (page > 1 && (response.status === 404 || response.status === 403)) {
          break;
        }
        if (page === 1) {
          throw new Error(`Autoport.ro a returnat statusul HTTP ${response.status}`);
        }
        break;
      }

      const html = await response.text();
      const pageItems = extractVehicleCardsFromHtml(html);

      let newItemsOnPage = 0;
      for (const item of pageItems) {
        if (!seenUrls.has(item.sourceUrl)) {
          seenUrls.add(item.sourceUrl);
          allItems.push(item);
          newItemsOnPage++;
        }
      }

      // If page had no new items, stop pagination
      if (newItemsOnPage === 0 && page > 1) {
        break;
      }
    } catch (error) {
      if (page === 1) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('Conexiunea cu Autoport.ro a expirat (timeout 20 secunde).');
        }
        throw error;
      }
      break;
    } finally {
      clearTimeout(timeout);
    }
  }

  const now = new Date();
  const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const importBatchName = `Autoport sync ${formattedDate}`;

  return {
    importBatchName,
    total: allItems.length,
    items: allItems,
  };
}

export async function scrapeAutoportVehicle(url: string): Promise<AutoportScrapedVehicle> {
  if (!isAutoportUrlAllowed(url)) {
    throw new Error('URL-ul trebuie să aparțină domeniului autoport.ro și să înceapă cu /auto/.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': DEFAULT_USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Nu am putut accesa pagina vehiculului Autoport (status ${response.status}).`);
    }

    const html = await response.text();
    return parseVehicleFromHtml(html, url);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Conexiunea pentru descărcarea mașinii de pe Autoport.ro a expirat (timeout 20 secunde).');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
