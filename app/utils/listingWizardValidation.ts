import type { CarDraft } from '~/types';

export type ListingWizardErrors = Record<string, string>;

/** One source of truth for both the next button and the step progress rail. */
export function validateListingWizardStep(formData: Partial<CarDraft>, stepIndex: number): ListingWizardErrors {
  const errors: ListingWizardErrors = {};

  switch (stepIndex) {
    case 0:
      if (!formData.brand) errors.brand = 'Marca este obligatorie';
      if (!formData.model) errors.model = 'Modelul este obligatoriu';
      if (!formData.year) errors.year = 'Anul este obligatoriu';
      if (formData.year && (formData.year < 1900 || formData.year > new Date().getFullYear() + 1)) {
        errors.year = 'Anul nu este valid';
      }
      break;
    case 1:
      if (!formData.fuelType) errors.fuelType = 'Tipul de combustibil este obligatoriu';
      if (!formData.transmission) errors.transmission = 'Tipul de transmisie este obligatoriu';
      if (formData.mileage === undefined || formData.mileage === null || Number.isNaN(formData.mileage)) {
        errors.mileage = 'Kilometrajul este obligatoriu';
      } else if (formData.mileage < 0) {
        errors.mileage = 'Kilometrajul nu poate fi negativ';
      }
      break;
    case 2:
      if (!formData.condition?.overall) errors['condition.overall'] = 'Starea generală este obligatorie';
      if (!formData.owners) errors.owners = 'Numărul de proprietari este obligatoriu';
      break;
    case 3:
      if (!formData.images?.length) errors.images = 'Cel puțin o imagine este obligatorie';
      break;
    case 4:
      if (!formData.price) errors.price = 'Prețul este obligatoriu';
      if (formData.price && formData.price <= 0) errors.price = 'Prețul trebuie să fie pozitiv';
      if (!formData.location?.city) errors['location.city'] = 'Orașul este obligatoriu';
      break;
    case 5:
      if (!formData.title) errors.title = 'Titlul anunțului este obligatoriu';
      if (!formData.description) errors.description = 'Descrierea este obligatorie';
      if (formData.description && formData.description.length < 50) {
        errors.description = 'Descrierea trebuie să aibă cel puțin 50 de caractere';
      }
      break;
  }

  return errors;
}

export function isListingWizardStepValid(formData: Partial<CarDraft>, stepIndex: number) {
  return Object.keys(validateListingWizardStep(formData, stepIndex)).length === 0;
}
