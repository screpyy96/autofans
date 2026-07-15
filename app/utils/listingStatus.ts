export function listingStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: 'Ciornă',
    published: 'Publicat',
    pending: 'În verificare',
    sold: 'Vândut',
    archived: 'Arhivat',
    rejected: 'Respins',
  };
  return labels[status] || status;
}

export function formatListingUpdatedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Dată indisponibilă';
  return new Intl.DateTimeFormat('ro-RO', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Europe/Bucharest',
  }).format(date);
}
