import React, { useState } from 'react';
import { UserPreferences as UserPrefsType, NotificationPreferences } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Checkbox } from '../ui/Checkbox';

interface UserPreferencesProps {
    preferences: UserPrefsType;
    onUpdatePreferences: (preferences: Partial<UserPrefsType>) => void;
    className?: string;
}

export const UserPreferences: React.FC<UserPreferencesProps> = ({
    preferences,
    onUpdatePreferences,
    className = ''
}) => {
    const [localPrefs, setLocalPrefs] = useState(preferences);
    const [hasChanges, setHasChanges] = useState(false);

    const handleChange = (field: keyof UserPrefsType, value: any) => {
        setLocalPrefs(prev => ({ ...prev, [field]: value }));
        setHasChanges(true);
    };

    const handleNotificationChange = (field: keyof UserPrefsType['notifications'], value: boolean) => {
        const newNotifications = { ...localPrefs.notifications, [field]: value };
        setLocalPrefs(prev => ({ ...prev, notifications: newNotifications }));
        setHasChanges(true);
    };

    const handleSave = () => {
        onUpdatePreferences(localPrefs);
        setHasChanges(false);
    };

    const handleReset = () => {
        setLocalPrefs(preferences);
        setHasChanges(false);
    };

    const languageOptions = [
        { value: 'ro', label: 'Română' },
        { value: 'en', label: 'English' }
    ];

    const currencyOptions = [
        { value: 'RON', label: 'RON (Lei)' },
        { value: 'EUR', label: 'EUR (Euro)' },
        { value: 'USD', label: 'USD (Dolari)' }
    ];

    const radiusOptions = [
        { value: '10', label: '10 km' },
        { value: '25', label: '25 km' },
        { value: '50', label: '50 km' },
        { value: '100', label: '100 km' },
        { value: '200', label: '200 km' },
        { value: '500', label: 'Toată țara' }
    ];

    return (
        <div className={className}>
            <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Preferințe Utilizator
                </h2>
                <p className="text-gray-600">
                    Personalizează experiența ta pe platformă
                </p>
            </div>

            <div className="space-y-6">
                {/* General Settings */}
                <Card className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Setări Generale
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Limba
                            </label>
                            <Select
                                value={localPrefs.language}
                                onChange={(value) => handleChange('language', value)}
                                options={languageOptions}
                                className="w-full"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Moneda
                            </label>
                            <Select
                                value={localPrefs.currency}
                                onChange={(value) => handleChange('currency', value)}
                                options={currencyOptions}
                                className="w-full"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Raza de căutare implicită
                            </label>
                            <Select
                                value={localPrefs.searchRadius.toString()}
                                onChange={(value) => handleChange('searchRadius', Number(value))}
                                options={radiusOptions}
                                className="w-full"
                            />
                        </div>
                    </div>
                </Card>

                {/* Notification Settings */}
                <Card className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Setări Notificări
                    </h3>

                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Checkbox
                                id="email-notifications"
                                checked={localPrefs.notifications.email}
                                onChange={(e) => handleNotificationChange('email', e.target.checked)}
                                label="Notificări email"
                            />

                            <Checkbox
                                id="push-notifications"
                                checked={localPrefs.notifications.push}
                                onChange={(e) => handleNotificationChange('push', e.target.checked)}
                                label="Notificări push"
                            />

                            <Checkbox
                                id="sms-notifications"
                                checked={localPrefs.notifications.sms}
                                onChange={(e) => handleNotificationChange('sms', e.target.checked)}
                                label="Notificări SMS"
                            />
                        </div>

                        <div className="border-t pt-4">
                            <h4 className="font-medium text-gray-900 mb-3">Tipuri de notificări</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <Checkbox
                                    id="saved-search-alerts"
                                    checked={localPrefs.notifications.savedSearchAlerts}
                                    onChange={(e) => handleNotificationChange('savedSearchAlerts', e.target.checked)}
                                    label="Alerte căutări salvate"
                                />

                                <Checkbox
                                    id="price-drop-alerts"
                                    checked={localPrefs.notifications.priceDropAlerts}
                                    onChange={(e) => handleNotificationChange('priceDropAlerts', e.target.checked)}
                                    label="Alerte reduceri preț"
                                />

                                <Checkbox
                                    id="new-listing-alerts"
                                    checked={localPrefs.notifications.newListingAlerts}
                                    onChange={(e) => handleNotificationChange('newListingAlerts', e.target.checked)}
                                    label="Alerte anunțuri noi"
                                />
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Search Preferences */}
                <Card className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Preferințe Căutare
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Locația implicită pentru căutări
                            </label>
                            <Input
                                value={localPrefs.defaultLocation?.city || ''}
                                onChange={(e) => {
                                    const city = e.target.value;
                                    handleChange('defaultLocation', city ? {
                                        id: 'default',
                                        city,
                                        county: '',
                                        country: 'România'
                                    } : undefined);
                                }}
                                placeholder="ex: București, Cluj-Napoca"
                                className="w-full"
                            />
                        </div>

                        <div className="p-4 bg-blue-50 rounded-lg">
                            <h4 className="font-medium text-blue-900 mb-2">
                                Filtre favorite
                            </h4>
                            <p className="text-sm text-blue-800">
                                Setează filtrele care se vor aplica automat la fiecare căutare nouă.
                                Această funcționalitate va fi disponibilă în curând.
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3">
                    <Button
                        variant="outline"
                        onClick={handleReset}
                        disabled={!hasChanges}
                    >
                        Resetează
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={!hasChanges}
                    >
                        Salvează Modificările
                    </Button>
                </div>
            </div>
        </div>
    );
};