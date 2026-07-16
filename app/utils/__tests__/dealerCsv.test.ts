import { describe, expect, it } from 'vitest';
import { parseDealerCsv } from '../dealerCsv';

const headers = 'stock_id,title,description,make,model,year,mileage,price,currency,fuel_type,transmission,body_type,vin,city,county';

describe('parseDealerCsv', () => {
  it('normalizes Romanian dealer data into a publish-ready draft payload', () => {
    const result = parseDealerCsv(`${headers}\nA-101,BMW 320d 2019,"BMW întreținută, cu revizii documentate și disponibilă pentru verificare în service.",BMW,320d,2019,124000,"18.500,00",EUR,Motorină,Automată,Sedan,,Cluj-Napoca,Cluj`);

    expect(result.missingHeaders).toEqual([]);
    expect(result.rows[0].errors).toEqual([]);
    expect(result.rows[0].listing).toMatchObject({
      externalStockId: 'A-101',
      fuelType: 'diesel',
      transmission: 'automatic',
      price: 18500,
    });
  });

  it('reports missing required columns before importing anything', () => {
    const result = parseDealerCsv('stock_id,make\nA-101,BMW');
    expect(result.missingHeaders).toContain('description');
    expect(result.rows).toEqual([]);
  });

  it('flags duplicate dealer stock IDs in the same file', () => {
    const row = 'A-101,BMW 320d 2019,"BMW întreținută, cu revizii documentate și disponibilă pentru verificare în service.",BMW,320d,2019,124000,18500,EUR,diesel,automatic,Sedan,,Cluj-Napoca,Cluj';
    const result = parseDealerCsv(`${headers}\n${row}\n${row}`);
    expect(result.rows[1].errors).toContain('stock_id este duplicat în acest CSV.');
  });

  it('does not silently truncate a dealer inventory larger than the import limit', () => {
    const rows = Array.from({ length: 101 }, (_, index) => `A-${index},BMW 320d 2019,"BMW întreținută, cu revizii documentate și disponibilă pentru verificare în service.",BMW,320d,2019,124000,18500,EUR,diesel,automatic,Sedan,,Cluj-Napoca,Cluj`);
    expect(() => parseDealerCsv(`${headers}\n${rows.join('\n')}`)).toThrow('Un import poate conține cel mult 100 mașini.');
  });
});
