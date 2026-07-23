import { describe, expect, it } from 'vitest';
import {
  extractVehicleCardsFromHtml,
  filterAndDeduplicateImages,
  isAutoportUrlAllowed,
  isCardIncludedByStatus,
  mapFuelType,
  mapTransmission,
  normalizeWpImageUrl,
  parseEngineCapacity,
  parsePower,
  parseRomanianMileage,
  parseRomanianPrice,
  parseVehicleFromHtml,
} from '../autoportScraper.server';

describe('autoportScraper unit tests', () => {
  it('parses Romanian price formats correctly', () => {
    expect(parseRomanianPrice('5.990 EUR')).toBe(5990);
    expect(parseRomanianPrice('15.490 €')).toBe(15490);
    expect(parseRomanianPrice('Preț: 24.990 EUR (TVA Inclus)')).toBe(24990);
    expect(parseRomanianPrice('invalida')).toBeNull();
  });

  it('parses Romanian mileage correctly', () => {
    expect(parseRomanianMileage('307.126 km')).toBe(307126);
    expect(parseRomanianMileage('12.500 km')).toBe(12500);
    expect(parseRomanianMileage('0 km')).toBe(0);
    expect(parseRomanianMileage('fără date')).toBeNull();
  });

  it('parses engine capacity and power correctly', () => {
    expect(parseEngineCapacity('1598 cmc')).toBe(1598);
    expect(parseEngineCapacity('1.995 cc')).toBe(1995);
    expect(parsePower('130 CP')).toBe(130);
    expect(parsePower('190 HP')).toBe(190);
  });

  it('maps fuel types to AutoFans standardized values', () => {
    expect(mapFuelType('diesel')).toBe('diesel');
    expect(mapFuelType('Motorină')).toBe('diesel');
    expect(mapFuelType('electrică')).toBe('electric');
    expect(mapFuelType('Electric')).toBe('electric');
    expect(mapFuelType('GPL')).toBe('lpg');
    expect(mapFuelType('hybrid / hibrid')).toBe('hybrid');
    expect(mapFuelType('Plugin Electro-Hybrid')).toBe('hybrid');
    expect(mapFuelType('benzină')).toBe('petrol');
  });

  it('maps transmission types to AutoFans standardized values', () => {
    expect(mapTransmission('manuală')).toBe('manual');
    expect(mapTransmission('Manual')).toBe('manual');
    expect(mapTransmission('CVT')).toBe('cvt');
    expect(mapTransmission('Xtronic')).toBe('cvt');
    expect(mapTransmission('automată')).toBe('automatic');
    expect(mapTransmission('DSG')).toBe('automatic');
    expect(mapTransmission('Geartronic')).toBe('automatic');
    expect(mapTransmission('S-Tronic')).toBe('automatic');
  });

  it('validates Autoport URL allowlist strictly', () => {
    expect(isAutoportUrlAllowed('https://autoport.ro/auto/bmw-x5-2020/')).toBe(true);
    expect(isAutoportUrlAllowed('https://autoport.ro/auto/audi-a4')).toBe(true);
    expect(isAutoportUrlAllowed('https://evil.com/auto/bmw-x5')).toBe(false);
    expect(isAutoportUrlAllowed('https://autoport.ro/despre-noi/')).toBe(false);
  });

  it('filters card statuses properly', () => {
    expect(isCardIncludedByStatus('In Stoc')).toBe(true);
    expect(isCardIncludedByStatus('În Stoc')).toBe(true);
    expect(isCardIncludedByStatus('În Transport')).toBe(true);
    expect(isCardIncludedByStatus('Rezervat')).toBe(true);
    expect(isCardIncludedByStatus('Vândut')).toBe(false);
    expect(isCardIncludedByStatus('Istoric')).toBe(false);
  });

  it('normalizes WordPress thumbnail URLs and strips dimension suffixes', () => {
    expect(normalizeWpImageUrl('https://autoport.ro/wp-content/uploads/car-350x196.jpg')).toBe(
      'https://autoport.ro/wp-content/uploads/car.jpg'
    );
    expect(normalizeWpImageUrl('//autoport.ro/wp-content/uploads/car-1024x768.png?v=1')).toBe(
      'https://autoport.ro/wp-content/uploads/car.png'
    );
  });

  it('filters out logos and deduplicates images', () => {
    const urls = [
      'https://autoport.ro/wp-content/uploads/autoport-logo.png',
      'https://autoport.ro/wp-content/uploads/car-350x196.jpg',
      'https://autoport.ro/wp-content/uploads/car-1024x768.jpg',
      'https://autoport.ro/wp-content/uploads/finantare-banner.jpg',
      'https://autoport.ro/wp-content/uploads/car2.jpg',
    ];
    const filtered = filterAndDeduplicateImages(urls);
    expect(filtered).toEqual([
      'https://autoport.ro/wp-content/uploads/car.jpg',
      'https://autoport.ro/wp-content/uploads/car2.jpg',
    ]);
  });

  it('extracts vehicle cards from HTML fixture including In Stoc and excluding historical without valid price', () => {
    const fixtureHtml = `
      <div class="car-card">
        <a href="https://autoport.ro/auto/vw-passat-2019/">VW Passat 2.0 TDI</a>
        <span class="status">În Stoc</span>
        <span class="price">14.990 EUR</span>
      </div>
      <div class="car-card">
        <a href="https://autoport.ro/auto/audi-a6-old/">Audi A6 Vândut</a>
        <span class="status">Vândut</span>
        <span class="price">12.000 EUR</span>
      </div>
      <div class="car-card">
        <a href="https://autoport.ro/auto/bmw-320d-no-price/">BMW 320d Fără Preț</a>
        <span class="status">In Stoc</span>
      </div>
    `;

    const cards = extractVehicleCardsFromHtml(fixtureHtml);
    expect(cards).toHaveLength(1);
    expect(cards[0].sourceSlug).toBe('vw-passat-2019');
    expect(cards[0].sourceStatus).toBe('În Stoc');
    expect(cards[0].price).toBe(14990);
  });

  it('parses single vehicle page HTML fixture selecting reduced price', () => {
    const pageHtml = `
      <html>
        <head>
          <title>Skoda Octavia 1.6 TDI 2018 | Autoport</title>
        </head>
        <body>
          <h1 class="entry-title">Skoda Octavia 1.6 TDI Style</h1>
          <div class="price">
            <del class="amount">13.500 EUR</del>
            <ins class="amount">12.490 EUR</ins>
          </div>
          <div class="spec-item">Marcă: Skoda</div>
          <div class="spec-item">Model: Octavia</div>
          <div class="spec-item">An fabricație: 2018</div>
          <div class="spec-item">Rulaj: 145.000 km</div>
          <div class="spec-item">Combustibil: Diesel</div>
          <div class="spec-item">Transmisie: Manuală</div>
          <div class="spec-item">Capacitate cilindrică: 1598 cmc</div>
          <div class="spec-item">Putere: 115 CP</div>
          <div class="spec-item">VIN: TMBAG7NE9J0123456</div>
          <div class="entry-content">
            <p>Mașină în stare impecabilă, adusă recent. Istoric service complet la reprezentanță.</p>
          </div>
          <img src="https://autoport.ro/wp-content/uploads/skoda-front-600x400.jpg" />
        </body>
      </html>
    `;

    const vehicle = parseVehicleFromHtml(pageHtml, 'https://autoport.ro/auto/skoda-octavia-2018/');
    expect(vehicle.title).toBe('Skoda Octavia 1.6 TDI Style');
    expect(vehicle.price).toBe(12490);
    expect(vehicle.make).toBe('Skoda');
    expect(vehicle.model).toBe('Octavia');
    expect(vehicle.year).toBe(2018);
    expect(vehicle.mileage).toBe(145000);
    expect(vehicle.fuel).toBe('diesel');
    expect(vehicle.transmission).toBe('manual');
    expect(vehicle.engineCapacity).toBe(1598);
    expect(vehicle.power).toBe(115);
    expect(vehicle.vin).toBe('TMBAG7NE9J0123456');
    expect(vehicle.imageUrls).toEqual(['https://autoport.ro/wp-content/uploads/skoda-front.jpg']);
    expect(vehicle.description).toContain('SURSĂ');
  });

  it('parses attribute-box specs for year and mileage from the live Autoport layout', () => {
    const pageHtml = `
      <html>
        <body>
          <h1 class="entry-title">BMW X3 xDrive20d</h1>
          <div class="price"><span class="amount">27.990 EUR</span></div>
          <div class="attribute-box">
            <p class="label-text">An fabricație</p>
            <p class="value-text">2021</p>
          </div>
          <div class="attribute-box">
            <p class="label-text">Kilometri</p>
            <p class="value-text">90.230 km</p>
          </div>
          <div class="attribute-box">
            <p class="label-text">Combustibil</p>
            <p class="value-text">Motorină</p>
          </div>
          <div class="attribute-box">
            <p class="label-text">Transmisie</p>
            <p class="value-text">Automată</p>
          </div>
          <img src="https://autoport.ro/wp-content/uploads/bmw-x3-1024x768.jpg" />
        </body>
      </html>
    `;

    const vehicle = parseVehicleFromHtml(pageHtml, 'https://autoport.ro/auto/bmw-x3-xdrive20d/');
    expect(vehicle.year).toBe(2021);
    expect(vehicle.mileage).toBe(90230);
    expect(vehicle.fuel).toBe('diesel');
    expect(vehicle.transmission).toBe('automatic');
  });

  it('parses the live Autoport price-block layout correctly', () => {
    const pageHtml = `
      <html>
        <body>
          <div class="col-sm-12 col-md-4">
            <h1 class="title auto_title">Mercedes-Benz V300d 4Matic G-Tronic Extralong exterior Maybach</h1>
            <div class="param-block">
              <span class="param-block-item">2023</span>
              <span class="param-block-item">90.230 km</span>
              <span class="param-block-item">Diesel</span>
              <span class="param-block-item">Monovolum</span>
            </div>
            <div class="price-block">
              <span class="price-title">47.990 <span>EUR</span></span>
              <p>finanțare posibilă</p>
            </div>
            <div class="details-block">
              <ul class="car-attributes">
                <li><strong>An fabricație</strong><span>2023</span></li>
                <li><strong>Marcă</strong><span>Mercedes-Benz</span></li>
                <li><strong>Model</strong><span>V Class Extralong</span></li>
                <li><strong>Versiune</strong><span>300d 4Matic G-Tronic</span></li>
                <li><strong>Kilometri</strong><span>90.230 km</span></li>
                <li><strong>Combustibil</strong><span>Diesel</span></li>
                <li><strong>Cutie de viteze</strong><span>Automată</span></li>
                <li><strong>Caroserie</strong><span>Monovolum</span></li>
              </ul>
            </div>
          </div>
        </body>
      </html>
    `;

    const vehicle = parseVehicleFromHtml(pageHtml, 'https://autoport.ro/auto/mercedes-benz-v300d-4matic-g-tronic-extralong-avantgarde/');
    expect(vehicle.price).toBe(47990);
    expect(vehicle.year).toBe(2023);
    expect(vehicle.mileage).toBe(90230);
    expect(vehicle.make).toBe('Mercedes-Benz');
    expect(vehicle.model).toBe('V Class Extralong');
    expect(vehicle.version).toBe('300d 4Matic G-Tronic');
  });

  it('drops noisy observations when the source block only repeats equipment labels', () => {
    const pageHtml = `
      <html>
        <body>
          <h1 class="entry-title">Audi Q7 3.0 TDI</h1>
          <div class="price"><span class="amount">31.990 EUR</span></div>
          <div class="spec-item">An fabricație: 2020</div>
          <div class="spec-item">Rulaj: 122.000 km</div>
          <div class="spec-item">Combustibil: Diesel</div>
          <div class="spec-item">Transmisie: Automată</div>
          <ul class="features">
            <li>Bluetooth</li>
            <li>Sistem audio</li>
            <li>Navigație</li>
            <li>Climatronic</li>
            <li>Pilot automat</li>
            <li>ABS</li>
            <li>ESP</li>
            <li>Airbag</li>
          </ul>
          <div class="entry-content">
            <p>Dotări Bluetooth Sistem audio Navigație Climatronic Pilot automat ABS ESP Airbag Descriere</p>
          </div>
        </body>
      </html>
    `;

    const vehicle = parseVehicleFromHtml(pageHtml, 'https://autoport.ro/auto/audi-q7-30-tdi/');
    expect(vehicle.description).not.toContain('OBSERVAȚII SUPLIMENTARE');
    expect(vehicle.description).toContain('DOTĂRI ȘI ECHIPAMENTE');
  });

  it('promotes short feature-like observation lines into equipment instead of keeping them as notes', () => {
    const pageHtml = `
      <html>
        <body>
          <h1 class="entry-title">Mercedes-Benz V300d</h1>
          <div class="price"><span class="amount">47.990 EUR</span></div>
          <div class="spec-item">An fabricație: 2023</div>
          <div class="spec-item">Rulaj: 90.230 km</div>
          <div class="spec-item">Combustibil: Diesel</div>
          <div class="spec-item">Transmisie: Automată</div>
          <div class="entry-content">
            <p>Scaun pasager ajustabil electric</p>
            <p>Suport lombar electric scaun șofer</p>
            <p>Oglinzi exterioare rabatabile electric</p>
            <p>Sistem recunoaștere semne trafic</p>
          </div>
        </body>
      </html>
    `;

    const vehicle = parseVehicleFromHtml(pageHtml, 'https://autoport.ro/auto/mercedes-benz-v300d/');
    expect(vehicle.description).not.toContain('OBSERVAȚII SUPLIMENTARE');
    expect(vehicle.description).toContain('- Scaun pasager ajustabil electric');
    expect(vehicle.description).toContain('- Oglinzi exterioare rabatabile electric');
  });
});
