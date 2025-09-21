import { useState } from 'react';
import { motion } from 'framer-motion';
import { BellRing, Clock, Laptop2, Mail, MessageSquare, Smartphone } from 'lucide-react';
import { Button } from './Button';
import { Checkbox } from './Checkbox';
import { Input } from './Input';
import { cn } from '~/lib/utils';
import { NotificationType } from '~/types';
import type { NotificationPreferences as NotificationPreferencesType } from '~/types';

export interface NotificationPreferencesProps {
  preferences: NotificationPreferencesType;
  onSave: (preferences: NotificationPreferencesType) => Promise<void>;
  className?: string;
}

const notificationTypeLabels: Record<NotificationType, { label: string; description: string }> = {
  [NotificationType.MESSAGE]: {
    label: 'Mesaje noi',
    description: 'Notificări când primești mesaje de la vânzători sau cumpărători'
  },
  [NotificationType.PRICE_DROP]: {
    label: 'Scăderi de preț',
    description: 'Alertă când prețul unei mașini din lista ta de favorite scade'
  },
  [NotificationType.NEW_LISTING]: {
    label: 'Anunțuri noi',
    description: 'Notificări pentru anunțuri noi care se potrivesc căutărilor tale salvate'
  },
  [NotificationType.SAVED_SEARCH_ALERT]: {
    label: 'Alerte căutări salvate',
    description: 'Notificări pentru rezultate noi ale căutărilor tale salvate'
  },
  [NotificationType.APPOINTMENT_REMINDER]: {
    label: 'Reminder programări',
    description: 'Notificări pentru programările tale de vizionare sau apeluri'
  },
  [NotificationType.SYSTEM]: {
    label: 'Notificări sistem',
    description: 'Actualizări importante despre platformă și contul tău'
  }
};

const deliveryChannels = [
  {
    key: 'inApp',
    label: 'În aplicație',
    description: 'Notificări în timp real direct în aplicație.',
    icon: Laptop2
  },
  {
    key: 'email',
    label: 'Email',
    description: 'Sumar zilnic și alerte imediate pe email.',
    icon: Mail
  },
  {
    key: 'push',
    label: 'Notificări push',
    description: 'Notificări în browser sau aplicația mobilă.',
    icon: Smartphone
  },
  {
    key: 'sms',
    label: 'SMS',
    description: 'Doar pentru notificări urgente și de securitate.',
    icon: MessageSquare
  }
] satisfies Array<{
  key: 'inApp' | 'email' | 'push' | 'sms';
  label: string;
  description: string;
  icon: typeof Mail;
}>;

export const NotificationPreferences = ({
  preferences,
  onSave,
  className
}: NotificationPreferencesProps) => {
  const [localPreferences, setLocalPreferences] = useState<NotificationPreferencesType>(preferences);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const notificationTypeEntries = Object.entries(notificationTypeLabels) as [
    NotificationType,
    { label: string; description: string }
  ][];
  const enabledDeliveryChannels = deliveryChannels.filter(option => localPreferences[option.key]);
  const enabledTypeLabels = notificationTypeEntries
    .filter(([type]) => localPreferences.types[type])
    .map(([, config]) => config.label);
  const quietHoursEnabled = localPreferences.quietHours?.enabled ?? false;

  const updatePreference = <K extends keyof NotificationPreferencesType>(
    key: K,
    value: NotificationPreferencesType[K]
  ) => {
    setLocalPreferences((prev: NotificationPreferencesType) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const updateTypePreference = (type: NotificationType, enabled: boolean) => {
    setLocalPreferences((prev: NotificationPreferencesType) => ({
      ...prev,
      types: { ...prev.types, [type]: enabled }
    }));
    setHasChanges(true);
  };

  const updateQuietHours = (field: 'enabled' | 'startTime' | 'endTime', value: boolean | string) => {
    setLocalPreferences((prev: NotificationPreferencesType) => ({
      ...prev,
      quietHours: {
        ...prev.quietHours,
        enabled: prev.quietHours?.enabled || false,
        startTime: prev.quietHours?.startTime || '22:00',
        endTime: prev.quietHours?.endTime || '08:00',
        [field]: value
      }
    }));
    setHasChanges(true);
  };

  const requestPushPermission = () => {
    if (typeof window === 'undefined') return;
    if ('Notification' in window) {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          console.log('Notification permission granted');
        }
      });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(localPreferences);
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving preferences:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setLocalPreferences(preferences);
    setHasChanges(false);
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-3xl border border-primary-700/40 bg-secondary-900/70 text-white shadow-[0_20px_60px_rgba(8,12,24,0.45)] backdrop-blur-xl',
        className
      )}
    >
      <div className="pointer-events-none absolute -top-24 -right-32 h-64 w-64 rounded-full bg-primary-600/30 blur-3xl opacity-50" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-24 -left-20 h-56 w-56 rounded-full bg-accent-gold/20 blur-3xl opacity-40" aria-hidden="true" />

      <div className="relative border-b border-primary-700/40 px-6 py-5 lg:px-8 lg:py-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold leading-tight">Preferințe notificări</h3>
            <p className="mt-1 text-sm text-white/60">
              Configurează cum și când vrei să primești notificări.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-wide text-white/60">
            <span className="flex items-center gap-2 rounded-full border border-primary-700/50 bg-primary-700/20 px-3 py-1">
              <BellRing className="h-3.5 w-3.5 text-accent-gold" />
              {enabledDeliveryChannels.length} metode active
            </span>
            <span className="hidden sm:flex items-center gap-2 rounded-full border border-primary-700/50 bg-primary-700/20 px-3 py-1">
              {enabledTypeLabels.length} tipuri active
            </span>
          </div>
        </div>
      </div>

      <div className="relative px-6 py-6 lg:px-8 lg:py-8">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-primary-700/40 bg-secondary-900/60 p-6 lg:p-7">
              <header>
                <h4 className="text-lg font-semibold">Metode de livrare</h4>
                <p className="mt-1 text-sm text-white/60">
                  Alege canalele prin care vrei să primești notificări.
                </p>
              </header>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {deliveryChannels.map((option) => {
                  const Icon = option.icon;
                  const isEnabled = localPreferences[option.key];

                  return (
                    <div
                      key={option.key}
                      className={cn(
                        'rounded-2xl border border-transparent bg-secondary-800/60 p-5 transition-all duration-200',
                        isEnabled
                          ? 'border-accent-gold/60 shadow-[0_12px_30px_rgba(10,12,24,0.35)]'
                          : 'hover:border-primary-600/40'
                      )}
                    >
                      <div className="mb-3 flex items-center gap-3 text-sm text-white/60">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600/20 text-primary-200">
                          <Icon className="h-5 w-5" />
                        </span>
                        <span className="text-xs uppercase tracking-wide">
                          Canal preferat
                        </span>
                      </div>
                      <Checkbox
                        checked={isEnabled}
                        onChange={(e) => updatePreference(option.key, e.target.checked)}
                        label={option.label}
                        description={option.description}
                      />
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-2xl border border-primary-700/40 bg-secondary-900/60 p-6 lg:p-7">
              <header>
                <h4 className="text-lg font-semibold">Tipuri de notificări</h4>
                <p className="mt-1 text-sm text-white/60">
                  Activează alertele care contează cel mai mult pentru tine.
                </p>
              </header>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {notificationTypeEntries.map(([type, config]) => {
                  const isEnabled = localPreferences.types[type];

                  return (
                    <div
                      key={type}
                      className={cn(
                        'rounded-2xl border border-transparent bg-secondary-800/60 p-5 transition-colors duration-200',
                        isEnabled
                          ? 'border-accent-gold/60 shadow-[0_12px_30px_rgba(10,12,24,0.35)]'
                          : 'hover:border-primary-600/40'
                      )}
                    >
                      <Checkbox
                        checked={isEnabled}
                        onChange={(e) => updateTypePreference(type, e.target.checked)}
                        label={config.label}
                        description={config.description}
                      />
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="space-y-5 rounded-2xl border border-primary-700/40 bg-secondary-900/60 p-6 lg:p-7">
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-600/20 text-accent-gold">
                  <Clock className="h-5 w-5" />
                </span>
                <div>
                  <h4 className="text-lg font-semibold">Ore de liniște</h4>
                  <p className="text-sm text-white/60">
                    Oprește notificările într-un interval ales de tine.
                  </p>
                </div>
              </div>

              <Checkbox
                checked={quietHoursEnabled}
                onChange={(e) => updateQuietHours('enabled', e.target.checked)}
                label="Activează orele de liniște"
                description="Nu primi notificări în intervalul specificat"
              />

              {quietHoursEnabled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid gap-4 md:grid-cols-2"
                >
                  <Input
                    type="time"
                    label="Ora de început"
                    value={localPreferences.quietHours?.startTime || '22:00'}
                    onChange={(e) => updateQuietHours('startTime', e.target.value)}
                  />
                  <Input
                    type="time"
                    label="Ora de sfârșit"
                    value={localPreferences.quietHours?.endTime || '08:00'}
                    onChange={(e) => updateQuietHours('endTime', e.target.value)}
                  />
                </motion.div>
              )}
            </section>
          </div>

          <aside className="space-y-5">
            <div className="rounded-2xl border border-primary-700/40 bg-secondary-900/60 p-6">
              <h5 className="text-xs font-semibold uppercase tracking-wider text-white/60">
                Rezumat rapid
              </h5>
              <div className="mt-4 space-y-4 text-sm text-white/70">
                <div>
                  <p className="text-xs uppercase tracking-wide text-white/50">Metode active</p>
                  <p className="mt-1 text-sm font-medium text-white">
                    {enabledDeliveryChannels.length > 0
                      ? enabledDeliveryChannels.map((channel) => channel.label).join(', ')
                      : 'Nicio metodă activă'}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-white/50">Tipuri activate</p>
                  <p className="mt-1 text-sm font-medium text-white">
                    {enabledTypeLabels.length} din {notificationTypeEntries.length}
                  </p>
                  <ul className="mt-2 space-y-1">
                    {enabledTypeLabels.length > 0 ? (
                      enabledTypeLabels.map((label) => (
                        <li key={label} className="flex items-center gap-2 text-xs text-white/60">
                          <span className="h-1.5 w-1.5 rounded-full bg-accent-gold" />
                          {label}
                        </li>
                      ))
                    ) : (
                      <li className="text-xs text-white/40">Nicio notificare activă</li>
                    )}
                  </ul>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-white/50">Ore de liniște</p>
                  {quietHoursEnabled && localPreferences.quietHours ? (
                    <p className="mt-1 text-sm font-medium text-white">
                      {localPreferences.quietHours.startTime} – {localPreferences.quietHours.endTime}
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-white/60">Dezactivate</p>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-primary-700/40 bg-primary-900/40 p-6">
              <div className="flex items-start gap-3">
                <span className="mt-1 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-600/30 text-accent-gold">
                  <BellRing className="h-5 w-5" />
                </span>
                <div className="space-y-3">
                  <div>
                    <h5 className="text-base font-semibold text-white">
                      Permisiuni browser
                    </h5>
                    <p className="mt-1 text-sm text-white/60">
                      Pentru notificări push, oferă permisiunea din browser.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={requestPushPermission}
                  >
                    Activează notificările push
                  </Button>
                  <p className="text-xs text-white/40">
                    Nu trimitem notificări fără acordul tău.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {hasChanges && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative border-t border-primary-700/40 bg-secondary-900/80 px-6 py-5 lg:px-8"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-white/70">
              <span className="flex h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-accent-gold" />
              Ai modificări nesalvate
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                disabled={isSaving}
              >
                Anulează
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                loading={isSaving}
              >
                Salvează
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
