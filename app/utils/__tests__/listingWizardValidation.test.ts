import { describe, expect, it } from 'vitest';
import { FuelType, TransmissionType } from '~/types';
import { isListingWizardStepValid, validateListingWizardStep } from '../listingWizardValidation';

describe('listing wizard step validation', () => {
  it('uses the basic vehicle fields for step one, without requiring later pricing fields', () => {
    expect(isListingWizardStepValid({ brand: 'Audi', model: 'A4', year: 2021 }, 0)).toBe(true);
    expect(validateListingWizardStep({ brand: 'Audi' }, 0)).toMatchObject({ model: expect.any(String), year: expect.any(String) });
  });

  it('validates each later step against its own fields', () => {
    expect(isListingWizardStepValid({ mileage: 120_000, fuelType: FuelType.DIESEL, transmission: TransmissionType.AUTOMATIC }, 1)).toBe(true);
    expect(isListingWizardStepValid({ mileage: 0, fuelType: FuelType.ELECTRIC, transmission: TransmissionType.AUTOMATIC }, 1)).toBe(true);
    expect(isListingWizardStepValid({ condition: { overall: 3 } as any, owners: 1 }, 2)).toBe(true);
    expect(isListingWizardStepValid({ images: [{ id: '1' }] as any }, 3)).toBe(true);
    expect(isListingWizardStepValid({ price: 20_000, location: { city: 'Cluj-Napoca' } as any }, 4)).toBe(true);
    expect(isListingWizardStepValid({ title: 'Audi A4 2021', description: 'O descriere suficient de lungă pentru ca anunțul să poată fi publicat corect.' }, 5)).toBe(true);
  });

  it('does not treat zero price or a short description as publishable', () => {
    expect(isListingWizardStepValid({ price: 0, location: { city: 'Iași' } as any }, 4)).toBe(false);
    expect(isListingWizardStepValid({ title: 'Audi A4', description: 'Prea scurtă' }, 5)).toBe(false);
  });
});
