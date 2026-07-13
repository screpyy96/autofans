const VIN_PATTERN = /^[A-HJ-NPR-Z0-9]{17}$/;

export function normalizeVin(value: unknown): string | null {
  const normalized = String(value ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');

  return normalized || null;
}

export function isValidVin(value: unknown): boolean {
  const vin = normalizeVin(value);
  return vin !== null && VIN_PATTERN.test(vin);
}
