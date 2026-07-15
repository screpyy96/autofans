import { useEffect, useState } from 'react';
import { CalendarDays, ExternalLink, MessageCircle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Textarea } from './Textarea';
import type { Car, Seller } from '~/types';
import { trackAnalyticsEvent } from '~/utils/analytics.client';

export type ContactMode = 'message' | 'viewing';

export interface ContactFormData {
  message: string;
  carId: string;
  sellerId: string;
  mode: ContactMode;
}

export interface WhatsAppData {
  carId: string;
  sellerId: string;
  message: string;
  mode: ContactMode;
}

export interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  car: Car;
  seller: Seller;
  initialMode?: ContactMode;
  onSendMessage?: (data: ContactFormData) => Promise<void>;
  onWhatsAppContact?: (data: WhatsAppData) => void;
}

function todayAsInputValue() {
  const today = new Date();
  const timezoneOffset = today.getTimezoneOffset() * 60_000;
  return new Date(today.getTime() - timezoneOffset).toISOString().slice(0, 10);
}

function formatDate(value: string) {
  if (!value) return '';
  const [year, month, day] = value.split('-');
  return year && month && day ? `${day}.${month}.${year}` : value;
}

export function ContactModal({
  isOpen,
  onClose,
  car,
  seller,
  initialMode = 'message',
  onSendMessage,
  onWhatsAppContact,
}: ContactModalProps) {
  const defaultMessage = `Bună! Sunt interesat de ${car.brand} ${car.model} (${car.year}). Mai este disponibilă?`;
  const [mode, setMode] = useState<ContactMode>(initialMode);
  const [message, setMessage] = useState(defaultMessage);
  const [viewingDate, setViewingDate] = useState('');
  const [viewingTime, setViewingTime] = useState('');
  const [viewingNote, setViewingNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasWhatsApp = Boolean(seller.phone?.replace(/[^0-9]/g, ''));

  useEffect(() => {
    if (!isOpen) return;
    setMode(initialMode);
    setError(null);
  }, [initialMode, isOpen]);

  const viewingMessage = () => {
    const note = viewingNote.trim();
    return [
      `Bună! Aș vrea să programez o vizionare pentru ${car.brand} ${car.model} (${car.year}).`,
      `Data propusă: ${formatDate(viewingDate)}, ora ${viewingTime}.`,
      note ? `Detalii: ${note}` : '',
    ].filter(Boolean).join('\n');
  };

  const activeMessage = () => mode === 'viewing' ? viewingMessage() : message.trim();

  const selectMode = (nextMode: ContactMode) => {
    setMode(nextMode);
    setError(null);
  };

  const sendMessage = async () => {
    if (mode === 'viewing' && (!viewingDate || !viewingTime)) {
      setError('Alege data și ora dorite pentru vizionare.');
      return;
    }
    const body = activeMessage();
    if (!body) {
      setError('Scrie un mesaj înainte să continui.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await onSendMessage?.({ message: body, carId: car.id, sellerId: seller.id, mode });
      trackAnalyticsEvent(mode === 'viewing' ? 'viewing_request_sent' : 'seller_message_sent', {
        listing_id: car.id,
      });
      onClose();
    } catch (sendError: any) {
      setError(sendError?.message || 'Mesajul nu a putut fi trimis. Încearcă din nou.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openWhatsApp = () => {
    if (mode === 'viewing' && (!viewingDate || !viewingTime)) {
      setError('Alege data și ora înainte de a trimite cererea pe WhatsApp.');
      return;
    }
    const body = activeMessage() || defaultMessage;
    onWhatsAppContact?.({ carId: car.id, sellerId: seller.id, message: body, mode });
    trackAnalyticsEvent(mode === 'viewing' ? 'viewing_request_whatsapp' : 'seller_whatsapp_opened', {
      listing_id: car.id,
    });
    window.open(`https://wa.me/${seller.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(body)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Contactează vânzătorul" size="md">
      <div className="space-y-5">
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-gold/15 text-accent-gold">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-white">{seller.name}</p>
            <p className="truncate text-sm text-gray-400">despre {car.title}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 rounded-xl border border-white/10 bg-white/[0.03] p-1" aria-label="Tip contact">
          <button
            type="button"
            aria-pressed={mode === 'message'}
            onClick={() => selectMode('message')}
            className={`flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold transition ${mode === 'message' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
          >
            <MessageCircle className="h-4 w-4" /> Mesaj
          </button>
          <button
            type="button"
            aria-pressed={mode === 'viewing'}
            onClick={() => selectMode('viewing')}
            className={`flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold transition ${mode === 'viewing' ? 'bg-accent-gold/15 text-accent-gold shadow-sm' : 'text-gray-400 hover:text-white'}`}
          >
            <CalendarDays className="h-4 w-4" /> Vizionare
          </button>
        </div>

        {mode === 'message' ? (
          <div>
            <label htmlFor="contact-message" className="mb-2 block text-sm font-medium text-white">Mesaj</label>
            <Textarea id="contact-message" value={message} onChange={(event) => setMessage(event.target.value)} rows={5} maxLength={2000} placeholder="Scrie un mesaj…" />
            <p className="mt-2 text-xs text-gray-500">Mesajul intră în conversația ta privată de pe AutoFans.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-white">Propune o vizionare</p>
              <p className="mt-1 text-xs leading-relaxed text-gray-400">Vânzătorul primește cererea în chat și confirmă direct cu tine. Nu rezervăm automat mașina.</p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block text-sm font-medium text-white">
                Data
                <input
                  type="date"
                  value={viewingDate}
                  min={todayAsInputValue()}
                  onChange={(event) => setViewingDate(event.target.value)}
                  className="mt-2 block min-h-12 w-full rounded-xl border border-accent-gold/30 bg-secondary-800/50 px-3 text-white outline-none transition focus:border-accent-gold focus:ring-2 focus:ring-accent-gold"
                  aria-label="Data propusă pentru vizionare"
                />
              </label>
              <label className="block text-sm font-medium text-white">
                Ora
                <input
                  type="time"
                  value={viewingTime}
                  onChange={(event) => setViewingTime(event.target.value)}
                  className="mt-2 block min-h-12 w-full rounded-xl border border-accent-gold/30 bg-secondary-800/50 px-3 text-white outline-none transition focus:border-accent-gold focus:ring-2 focus:ring-accent-gold"
                  aria-label="Ora propusă pentru vizionare"
                />
              </label>
            </div>
            <div>
              <label htmlFor="viewing-note" className="mb-2 block text-sm font-medium text-white">Detalii pentru vânzător <span className="font-normal text-gray-500">(opțional)</span></label>
              <Textarea id="viewing-note" value={viewingNote} onChange={(event) => setViewingNote(event.target.value)} rows={3} maxLength={1000} placeholder="De exemplu: pot ajunge după serviciu și aș vrea să fac un test drive." />
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-300" role="alert">{error}</p>}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          {hasWhatsApp && (
            <Button type="button" variant="outline" onClick={openWhatsApp} className="border-white/20 text-white">
              <ExternalLink className="mr-2 h-4 w-4" /> WhatsApp
            </Button>
          )}
          <Button type="button" onClick={sendMessage} loading={isSubmitting} className="bg-gold-gradient text-secondary-900">
            {mode === 'viewing' ? <CalendarDays className="mr-2 h-4 w-4" /> : <MessageCircle className="mr-2 h-4 w-4" />}
            {mode === 'viewing' ? 'Trimite cererea' : 'Trimite mesaj'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
