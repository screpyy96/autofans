import { useState } from 'react';
import { ExternalLink, MessageCircle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Textarea } from './Textarea';
import type { Car, Seller } from '~/types';

export interface ContactFormData {
  message: string;
  carId: string;
  sellerId: string;
}

export interface WhatsAppData {
  carId: string;
  sellerId: string;
  message: string;
}

export interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  car: Car;
  seller: Seller;
  onSendMessage?: (data: ContactFormData) => Promise<void>;
  onWhatsAppContact?: (data: WhatsAppData) => void;
}

export function ContactModal({ isOpen, onClose, car, seller, onSendMessage, onWhatsAppContact }: ContactModalProps) {
  const defaultMessage = `Bună! Sunt interesat de ${car.brand} ${car.model} (${car.year}). Mai este disponibilă?`;
  const [message, setMessage] = useState(defaultMessage);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasWhatsApp = Boolean(seller.phone?.replace(/[^0-9]/g, ''));

  const sendMessage = async () => {
    const body = message.trim();
    if (!body) { setError('Scrie un mesaj înainte să continui.'); return; }
    setIsSubmitting(true); setError(null);
    try {
      await onSendMessage?.({ message: body, carId: car.id, sellerId: seller.id });
      onClose();
    } catch (sendError: any) {
      setError(sendError?.message || 'Mesajul nu a putut fi trimis. Încearcă din nou.');
    } finally { setIsSubmitting(false); }
  };

  const openWhatsApp = () => {
    const body = message.trim() || defaultMessage;
    onWhatsAppContact?.({ carId: car.id, sellerId: seller.id, message: body });
    window.open(`https://wa.me/${seller.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(body)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Contactează vânzătorul" size="md">
      <div className="space-y-5">
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-gold/15 text-accent-gold"><MessageCircle className="h-5 w-5" /></div>
          <div className="min-w-0"><p className="truncate font-semibold text-white">{seller.name}</p><p className="truncate text-sm text-gray-400">despre {car.title}</p></div>
        </div>
        <div>
          <label htmlFor="contact-message" className="mb-2 block text-sm font-medium text-white">Mesaj</label>
          <Textarea id="contact-message" value={message} onChange={(event) => setMessage(event.target.value)} rows={5} maxLength={2000} placeholder="Scrie un mesaj…" />
          <p className="mt-2 text-xs text-gray-500">Mesajul intră în conversația ta privată de pe AutoFans.</p>
        </div>
        {error && <p className="text-sm text-red-300">{error}</p>}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          {hasWhatsApp && <Button type="button" variant="outline" onClick={openWhatsApp} className="border-white/20 text-white"><ExternalLink className="mr-2 h-4 w-4" />WhatsApp</Button>}
          <Button type="button" onClick={sendMessage} loading={isSubmitting} className="bg-gold-gradient text-secondary-900"><MessageCircle className="mr-2 h-4 w-4" />Trimite mesaj</Button>
        </div>
      </div>
    </Modal>
  );
}
