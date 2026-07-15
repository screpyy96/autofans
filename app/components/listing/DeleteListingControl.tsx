import { useState } from 'react';
import { Form } from 'react-router';
import { Button } from '~/components/ui/Button';

interface DeleteListingControlProps {
  listingId: number;
  className?: string;
}

/** Keeps a destructive action reversible until the seller explicitly confirms it. */
export function DeleteListingControl({ listingId, className = '' }: DeleteListingControlProps) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <Button type="button" variant="danger" size="sm" className={className} onClick={() => setConfirming(true)}>
        Șterge
      </Button>
    );
  }

  return (
    <div className="col-span-full flex flex-wrap items-center justify-end gap-2 rounded-xl border border-red-400/30 bg-red-500/10 p-2" role="alert">
      <span className="text-xs font-medium text-red-100">Ștergi definitiv acest anunț?</span>
      <button type="button" onClick={() => setConfirming(false)} className="min-h-9 rounded-lg px-2 text-xs font-semibold text-gray-200 hover:bg-white/10">Anulează</button>
      <Form method="post">
        <input type="hidden" name="intent" value="delete" />
        <input type="hidden" name="id" value={String(listingId)} />
        <Button type="submit" variant="danger" size="sm">Confirmă ștergerea</Button>
      </Form>
    </div>
  );
}
