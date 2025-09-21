import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { Textarea } from './Textarea';
import { Select } from './Select';
import { cn } from '~/lib/utils';
import type { Car, Seller } from '~/types';

export interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  car: Car;
  seller: Seller;
  onSendMessage?: (data: ContactFormData) => Promise<void>;
  onScheduleCall?: (data: CallScheduleData) => Promise<void>;
  onWhatsAppContact?: (data: WhatsAppData) => void;
}

export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  message: string;
  carId: string;
  sellerId: string;
  contactMethod: 'email' | 'phone' | 'whatsapp';
  preferredContactTime?: string;
}

export interface CallScheduleData {
  name: string;
  email: string;
  phone: string;
  carId: string;
  sellerId: string;
  preferredDate: string;
  preferredTime: string;
  message?: string;
}

export interface WhatsAppData {
  carId: string;
  sellerId: string;
  message: string;
}

type ContactTab = 'message' | 'call' | 'whatsapp';

const contactMethods = [
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Telefon' },
  { value: 'whatsapp', label: 'WhatsApp' }
];

const timeSlots = [
  { value: '09:00', label: '09:00' },
  { value: '10:00', label: '10:00' },
  { value: '11:00', label: '11:00' },
  { value: '12:00', label: '12:00' },
  { value: '13:00', label: '13:00' },
  { value: '14:00', label: '14:00' },
  { value: '15:00', label: '15:00' },
  { value: '16:00', label: '16:00' },
  { value: '17:00', label: '17:00' },
  { value: '18:00', label: '18:00' }
];

export const ContactModal = ({
  isOpen,
  onClose,
  car,
  seller,
  onSendMessage,
  onScheduleCall,
  onWhatsAppContact
}: ContactModalProps) => {
  const [activeTab, setActiveTab] = useState<ContactTab>('message');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Message form state
  const [messageForm, setMessageForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: `Bună ziua,\n\nSunt interesat de ${car.brand} ${car.model} din ${car.year}.\n\nVă rog să mă contactați pentru mai multe detalii.\n\nMulțumesc!`,
    contactMethod: 'email' as const,
    preferredContactTime: ''
  });

  // Call scheduling form state
  const [callForm, setCallForm] = useState({
    name: '',
    email: '',
    phone: '',
    preferredDate: '',
    preferredTime: '',
    message: ''
  });

  // Form validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateMessageForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!messageForm.name.trim()) {
      newErrors.name = 'Numele este obligatoriu';
    }

    if (!messageForm.email.trim()) {
      newErrors.email = 'Email-ul este obligatoriu';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(messageForm.email)) {
      newErrors.email = 'Email-ul nu este valid';
    }

    if (messageForm.contactMethod === 'phone' && !messageForm.phone.trim()) {
      newErrors.phone = 'Numărul de telefon este obligatoriu pentru contactul telefonic';
    }

    if (!messageForm.message.trim()) {
      newErrors.message = 'Mesajul este obligatoriu';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [messageForm]);

  const validateCallForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!callForm.name.trim()) {
      newErrors.callName = 'Numele este obligatoriu';
    }

    if (!callForm.email.trim()) {
      newErrors.callEmail = 'Email-ul este obligatoriu';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(callForm.email)) {
      newErrors.callEmail = 'Email-ul nu este valid';
    }

    if (!callForm.phone.trim()) {
      newErrors.callPhone = 'Numărul de telefon este obligatoriu';
    }

    if (!callForm.preferredDate) {
      newErrors.preferredDate = 'Data este obligatorie';
    }

    if (!callForm.preferredTime) {
      newErrors.preferredTime = 'Ora este obligatorie';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [callForm]);

  const handleSendMessage = async () => {
    if (!validateMessageForm()) return;

    setIsSubmitting(true);
    try {
      const contactData: ContactFormData = {
        ...messageForm,
        carId: car.id,
        sellerId: seller.id
      };

      await onSendMessage?.(contactData);
      
      // Reset form and close modal on success
      setMessageForm({
        name: '',
        email: '',
        phone: '',
        message: `Bună ziua,\n\nSunt interesat de ${car.brand} ${car.model} din ${car.year}.\n\nVă rog să mă contactați pentru mai multe detalii.\n\nMulțumesc!`,
        contactMethod: 'email',
        preferredContactTime: ''
      });
      onClose();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScheduleCall = async () => {
    if (!validateCallForm()) return;

    setIsSubmitting(true);
    try {
      const callData: CallScheduleData = {
        ...callForm,
        carId: car.id,
        sellerId: seller.id
      };

      await onScheduleCall?.(callData);
      
      // Reset form and close modal on success
      setCallForm({
        name: '',
        email: '',
        phone: '',
        preferredDate: '',
        preferredTime: '',
        message: ''
      });
      onClose();
    } catch (error) {
      console.error('Error scheduling call:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWhatsAppContact = () => {
    const message = `Bună ziua! Sunt interesat de ${car.brand} ${car.model} din ${car.year} (${car.price.toLocaleString()} ${car.currency}). Puteți să îmi oferiți mai multe detalii?`;
    
    const whatsappData: WhatsAppData = {
      carId: car.id,
      sellerId: seller.id,
      message
    };

    onWhatsAppContact?.(whatsappData);
    
    // Open WhatsApp with pre-filled message
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${seller.phone.replace(/[^0-9]/g, '')}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const tabs = [
    {
      id: 'message' as const,
      label: 'Trimite Mesaj',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      id: 'call' as const,
      label: 'Programează Apel',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      )
    },
    {
      id: 'whatsapp' as const,
      label: 'WhatsApp',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
        </svg>
      )
    }
  ];

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Contactează Vânzătorul"
      size="lg"
      className="max-h-[90vh] overflow-hidden flex flex-col"
    >
      <div className="flex flex-col h-full">
        {/* Car and Seller Info */}
        <div className="bg-secondary-800/50 -mx-6 -mt-4 px-6 py-4 border-b border-premium">
          <div className="flex items-center space-x-4">
            <img
              src={car.images[0]?.thumbnailUrl || car.images[0]?.url}
              alt={car.title}
              className="w-16 h-12 object-cover rounded-xl border border-premium"
            />
            <div className="flex-1">
              <h3 className="font-semibold text-white">
                {car.brand} {car.model} ({car.year})
              </h3>
              <p className="text-sm text-gray-300">
                {car.price.toLocaleString()} {car.currency} • {car.location.city}
              </p>
            </div>
            <div className="text-right">
              <p className="font-medium text-white">{seller.name}</p>
              <p className="text-sm text-gray-400">{seller.type === 'dealer' ? 'Dealer' : 'Persoană fizică'}</p>
              {seller.rating && (
                <div className="flex items-center justify-end mt-1">
                  <span className="text-accent-gold text-sm">★</span>
                  <span className="text-sm text-gray-400 ml-1">
                    {seller.rating} ({seller.reviewCount} reviews)
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-premium -mx-6 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.id
                  ? 'border-accent-gold text-accent-gold'
                  : 'border-transparent text-gray-400 hover:text-accent-gold'
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto py-6">
          <AnimatePresence mode="wait">
            {activeTab === 'message' && (
              <motion.div
                key="message"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Nume *"
                    value={messageForm.name}
                    onChange={(e) => setMessageForm(prev => ({ ...prev, name: e.target.value }))}
                    error={errors.name}
                    placeholder="Numele tău"
                  />
                  <Input
                    label="Email *"
                    type="email"
                    value={messageForm.email}
                    onChange={(e) => setMessageForm(prev => ({ ...prev, email: e.target.value }))}
                    error={errors.email}
                    placeholder="email@exemplu.com"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Telefon"
                    type="tel"
                    value={messageForm.phone}
                    onChange={(e) => setMessageForm(prev => ({ ...prev, phone: e.target.value }))}
                    error={errors.phone}
                    placeholder="+40 xxx xxx xxx"
                  />
                  <Select
                    label="Metoda preferată de contact"
                    value={messageForm.contactMethod}
                    onChange={(e) => setMessageForm(prev => ({ ...prev, contactMethod: e.target.value as any }))}
                    options={contactMethods}
                  />
                </div>

                <Input
                  label="Ora preferată pentru contact"
                  value={messageForm.preferredContactTime}
                  onChange={(e) => setMessageForm(prev => ({ ...prev, preferredContactTime: e.target.value }))}
                  placeholder="ex: între 10:00 - 18:00"
                  helperText="Opțional - specifică când preferi să fii contactat"
                />

                <Textarea
                  label="Mesaj *"
                  value={messageForm.message}
                  onChange={(e) => setMessageForm(prev => ({ ...prev, message: e.target.value }))}
                  error={errors.message}
                  rows={6}
                  placeholder="Scrie mesajul tău aici..."
                />

                <div className="flex justify-end space-x-3 pt-4">
                  <Button variant="outline" onClick={onClose}>
                    Anulează
                  </Button>
                  <Button 
                    onClick={handleSendMessage}
                    loading={isSubmitting}
                  >
                    Trimite Mesaj
                  </Button>
                </div>
              </motion.div>
            )}

            {activeTab === 'call' && (
              <motion.div
                key="call"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="bg-accent-gold/20 border border-accent-gold/30 rounded-2xl p-4 mb-6">
                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-accent-gold mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h4 className="font-medium text-accent-gold">Programează un apel</h4>
                      <p className="text-gray-300 mt-1">
                        Vânzătorul te va contacta la data și ora specificată pentru a discuta despre mașină.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Nume *"
                    value={callForm.name}
                    onChange={(e) => setCallForm(prev => ({ ...prev, name: e.target.value }))}
                    error={errors.callName}
                    placeholder="Numele tău"
                  />
                  <Input
                    label="Email *"
                    type="email"
                    value={callForm.email}
                    onChange={(e) => setCallForm(prev => ({ ...prev, email: e.target.value }))}
                    error={errors.callEmail}
                    placeholder="email@exemplu.com"
                  />
                </div>

                <Input
                  label="Telefon *"
                  type="tel"
                  value={callForm.phone}
                  onChange={(e) => setCallForm(prev => ({ ...prev, phone: e.target.value }))}
                  error={errors.callPhone}
                  placeholder="+40 xxx xxx xxx"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Data preferată *"
                    type="date"
                    value={callForm.preferredDate}
                    onChange={(e) => setCallForm(prev => ({ ...prev, preferredDate: e.target.value }))}
                    error={errors.preferredDate}
                    min={getTomorrowDate()}
                  />
                  <Select
                    label="Ora preferată *"
                    value={callForm.preferredTime}
                    onChange={(e) => setCallForm(prev => ({ ...prev, preferredTime: e.target.value }))}
                    error={errors.preferredTime}
                    placeholder="Selectează ora"
                    options={timeSlots}
                  />
                </div>

                <Textarea
                  label="Mesaj suplimentar"
                  value={callForm.message}
                  onChange={(e) => setCallForm(prev => ({ ...prev, message: e.target.value }))}
                  rows={4}
                  placeholder="Detalii suplimentare despre ce vrei să discuți..."
                />

                <div className="flex justify-end space-x-3 pt-4">
                  <Button variant="outline" onClick={onClose}>
                    Anulează
                  </Button>
                  <Button 
                    onClick={handleScheduleCall}
                    loading={isSubmitting}
                  >
                    Programează Apel
                  </Button>
                </div>
              </motion.div>
            )}

            {activeTab === 'whatsapp' && (
              <motion.div
                key="whatsapp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="bg-green-900/20 border border-green-500/30 rounded-2xl p-6">
                  <div className="flex items-start space-x-4">
                    <div className="bg-green-500 rounded-full p-3">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-green-400">
                        Contactează prin WhatsApp
                      </h3>
                      <p className="text-gray-300 mt-2">
                        Vorbește direct cu vânzătorul prin WhatsApp pentru răspunsuri rapide și comunicare în timp real.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-secondary-800/50 rounded-2xl p-4 border border-premium">
                  <h4 className="font-medium text-white mb-2">Mesaj pre-completat:</h4>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    "Bună ziua! Sunt interesat de {car.brand} {car.model} din {car.year} ({car.price.toLocaleString()} {car.currency}). Puteți să îmi oferiți mai multe detalii?"
                  </p>
                </div>

                <div className="bg-accent-gold/20 border border-accent-gold/30 rounded-2xl p-4">
                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-accent-gold mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div>
                      <h4 className="font-medium text-accent-gold">Informații importante</h4>
                      <ul className="text-sm text-gray-300 mt-1 space-y-1">
                        <li>• Vei fi redirecționat către WhatsApp</li>
                        <li>• Mesajul va fi pre-completat cu detaliile mașinii</li>
                        <li>• Poți modifica mesajul înainte să îl trimiți</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button variant="outline" onClick={onClose}>
                    Anulează
                  </Button>
                  <Button 
                    onClick={handleWhatsAppContact}
                    className="bg-green-600 hover:bg-green-700 focus:ring-green-500"
                  >
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                    </svg>
                    Deschide WhatsApp
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Modal>
  );
};