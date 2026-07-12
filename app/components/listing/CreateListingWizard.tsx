import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '~/lib/utils';
import {
    FuelType,
    TransmissionType,
    ConditionType,
    ListingStatus
} from '~/types';
import type {
    Car,
    CarDraft,
    Location,
    Feature,
    CarSpecs,
    ConditionReport,
    Image
} from '~/types';
import {
    Button,
    Input,
    Select,
    Textarea,
    Card,
    CardHeader,
    CardTitle,
    CardContent
} from '~/components/ui';
import { ImageUpload } from './ImageUpload';

export interface CreateListingWizardProps {
    onSubmit: (listing: CarDraft) => Promise<void>;
    onSaveDraft: (draft: Partial<CarDraft>) => Promise<void>;
    initialData?: Partial<CarDraft>;
    onClose?: () => void;
    onFilesSelected?: (files: File[]) => Promise<void>;
}

interface WizardStep {
    id: string;
    title: string;
    description: string;
    isCompleted: boolean;
    isValid: boolean;
}

interface FormErrors {
    [key: string]: string;
}

const STEPS: Omit<WizardStep, 'isCompleted' | 'isValid'>[] = [
    {
        id: 'basic',
        title: 'Informații de bază',
        description: 'Marca, modelul și anul mașinii'
    },
    {
        id: 'details',
        title: 'Detalii tehnice',
        description: 'Specificații și caracteristici'
    },
    {
        id: 'condition',
        title: 'Starea mașinii',
        description: 'Condiția și istoricul vehiculului'
    },
    {
        id: 'images',
        title: 'Imagini',
        description: 'Încarcă fotografii ale mașinii'
    },
    {
        id: 'pricing',
        title: 'Preț și locație',
        description: 'Stabilirea prețului și locației'
    },
    {
        id: 'description',
        title: 'Descriere și finalizare',
        description: 'Descrierea detaliată și publicarea'
    }
];

export function CreateListingWizard({
    onSubmit,
    onSaveDraft,
    initialData,
    onClose,
    onFilesSelected
}: CreateListingWizardProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState<Partial<CarDraft>>(initialData || {});
    const [errors, setErrors] = useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDraftSaving, setIsDraftSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    // Auto-save functionality
    useEffect(() => {
        const autoSaveInterval = setInterval(() => {
            if (Object.keys(formData).length > 0) {
                handleSaveDraft();
            }
        }, 30000); // Auto-save every 30 seconds

        return () => clearInterval(autoSaveInterval);
    }, [formData]);

    const handleSaveDraft = useCallback(async () => {
        if (isDraftSaving) return;

        setIsDraftSaving(true);
        try {
            await onSaveDraft(formData);
            setLastSaved(new Date());
        } catch (error) {
            console.error('Failed to save draft:', error);
        } finally {
            setIsDraftSaving(false);
        }
    }, [formData, onSaveDraft, isDraftSaving]);

    const updateFormData = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Clear error for this field
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const validateStep = (stepIndex: number): boolean => {
        const newErrors: FormErrors = {};

        switch (stepIndex) {
            case 0: // Basic info
                if (!formData.brand) newErrors.brand = 'Marca este obligatorie';
                if (!formData.model) newErrors.model = 'Modelul este obligatoriu';
                if (!formData.year) newErrors.year = 'Anul este obligatoriu';
                if (formData.year && (formData.year < 1900 || formData.year > new Date().getFullYear() + 1)) {
                    newErrors.year = 'Anul nu este valid';
                }
                break;

            case 1: // Technical details
                if (!formData.fuelType) newErrors.fuelType = 'Tipul de combustibil este obligatoriu';
                if (!formData.transmission) newErrors.transmission = 'Tipul de transmisie este obligatoriu';
                if (!formData.mileage) newErrors.mileage = 'Kilometrajul este obligatoriu';
                if (formData.mileage && formData.mileage < 0) newErrors.mileage = 'Kilometrajul nu poate fi negativ';
                break;

            case 2: // Condition
                if (!formData.condition?.overall) newErrors['condition.overall'] = 'Starea generală este obligatorie';
                if (!formData.owners) newErrors.owners = 'Numărul de proprietari este obligatoriu';
                break;

            case 3: // Images
                if (!formData.images || formData.images.length === 0) {
                    newErrors.images = 'Cel puțin o imagine este obligatorie';
                }
                break;

            case 4: // Pricing
                if (!formData.price) newErrors.price = 'Prețul este obligatoriu';
                if (formData.price && formData.price <= 0) newErrors.price = 'Prețul trebuie să fie pozitiv';
                if (!formData.location?.city) newErrors['location.city'] = 'Orașul este obligatoriu';
                break;

            case 5: // Description
                if (!formData.title) newErrors.title = 'Titlul anunțului este obligatoriu';
                if (!formData.description) newErrors.description = 'Descrierea este obligatorie';
                if (formData.description && formData.description.length < 50) {
                    newErrors.description = 'Descrierea trebuie să aibă cel puțin 50 de caractere';
                }
                break;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
        }
    };

    const handlePrevious = () => {
        setCurrentStep(prev => Math.max(prev - 1, 0));
    };

    const handleSubmit = async () => {
        if (!validateStep(currentStep)) return;

        setIsSubmitting(true);
        try {
            await onSubmit(formData);
        } catch (error) {
            console.error('Failed to submit listing:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Validation function that doesn't trigger state updates (for render-time checks)
    const isStepValid = useCallback((stepIndex: number): boolean => {
        switch (stepIndex) {
            case 0: // Basic Info
                return !!(formData.title && formData.brand && formData.model && formData.year && formData.price);
            case 1: // Details
                return !!(formData.mileage && formData.fuelType && formData.transmission);
            case 2: // Specifications
                return !!(formData.specifications?.engineSize && formData.specifications?.power);
            case 3: // Condition
                return !!(formData.condition?.overall);
            case 4: // Images
                return !!(formData.images && formData.images.length > 0);
            case 5: // Description
                return !!(formData.description && formData.description.length >= 50);
            default:
                return false;
        }
    }, [formData]);

    const getStepStatus = (stepIndex: number): WizardStep => {
        const step = STEPS[stepIndex];
        return {
            ...step,
            isCompleted: stepIndex < currentStep,
            isValid: stepIndex <= currentStep ? isStepValid(stepIndex) : false
        };
    };

    const stepStatuses = useMemo(() => 
        STEPS.map((_, index) => getStepStatus(index)),
        [currentStep, formData, isStepValid]
    );

    const renderProgressIndicator = () => {
        const progressPercent = ((currentStep + 1) / STEPS.length) * 100;
        
        return (
            <div className="mb-8 bg-white/5 border border-white/5 p-4 sm:p-5 rounded-2xl">
                {/* Step Info Row */}
                <div className="flex items-center justify-between mb-3.5">
                    <div className="min-w-0">
                        <span className="text-[10px] sm:text-xs font-bold text-accent-gold uppercase tracking-wider">
                            Pasul {currentStep + 1} din {STEPS.length}
                        </span>
                        <h3 className="text-base sm:text-lg font-extrabold text-white mt-0.5 truncate">
                            {STEPS[currentStep].title}
                        </h3>
                    </div>
                    <span className="text-[10px] sm:text-xs font-bold text-accent-gold bg-accent-gold/10 border border-accent-gold/20 px-2.5 py-1 rounded-lg">
                        {Math.round(progressPercent)}% Complet
                    </span>
                </div>

                {/* Clean Progress Bar */}
                <div className="w-full bg-white/5 border border-white/10 h-2 rounded-full overflow-hidden relative">
                    <motion.div 
                        className="h-full bg-gold-gradient rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                    />
                </div>

                {/* Quick Dot Indicators below progress bar */}
                <div className="flex items-center justify-between mt-4 px-1 gap-2.5">
                    {STEPS.map((step, index) => {
                        const isActive = index === currentStep;
                        const isCompleted = index < currentStep;
                        return (
                            <button
                                key={step.id}
                                onClick={() => {
                                    if (index <= currentStep || isStepValid(index - 1)) {
                                        setCurrentStep(index);
                                    }
                                }}
                                className="flex flex-col items-center flex-1 focus:outline-none group relative py-1"
                                title={step.title}
                                disabled={index > currentStep && !isStepValid(index - 1)}
                            >
                                <div className={cn(
                                    "h-1.5 rounded-full transition-all duration-300 w-full",
                                    isActive ? "bg-accent-gold" : "bg-white/10 group-hover:bg-white/30",
                                    isCompleted && "bg-accent-gold/60"
                                )} />
                                {/* Tooltip */}
                                <span className="absolute bottom-5 left-1/2 transform -translate-x-1/2 bg-secondary-950 text-white text-[10px] py-1 px-2.5 rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-10 shadow-lg">
                                    {step.title}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 0:
                return <BasicInfoStep formData={formData} updateFormData={updateFormData} errors={errors} />;
            case 1:
                return <TechnicalDetailsStep formData={formData} updateFormData={updateFormData} errors={errors} />;
            case 2:
                return <ConditionStep formData={formData} updateFormData={updateFormData} errors={errors} />;
            case 3:
                return <ImagesStep formData={formData} updateFormData={updateFormData} errors={errors} onFilesSelected={onFilesSelected} />;
            case 4:
                return <PricingStep formData={formData} updateFormData={updateFormData} errors={errors} />;
            case 5:
                return <DescriptionStep formData={formData} updateFormData={updateFormData} errors={errors} />;
            default:
                return null;
        }
    };

    return (
        <div className="mx-auto">
            <Card className="bg-glass border-white/10 shadow-2xl backdrop-blur-xl rounded-2xl overflow-hidden">
                <CardHeader className="border-b border-white/5 pb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <span className="text-xs font-bold text-accent-gold uppercase tracking-wider">Pasul {currentStep + 1} din {STEPS.length}</span>
                            <h2 className="text-xl font-extrabold text-white mt-0.5">{STEPS[currentStep].title}</h2>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                            {lastSaved && (
                                <p className="text-xs sm:text-sm text-gray-400">
                                    Salvat: {lastSaved.toLocaleTimeString()}
                                </p>
                            )}
                            {isDraftSaving && (
                                <p className="text-xs sm:text-sm text-accent-gold animate-pulse">Se salvează...</p>
                            )}
                            {onClose && (
                                <Button variant="ghost" onClick={onClose} className="text-xs sm:text-sm text-white/60 hover:text-white">
                                    Închide
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-6 sm:p-8">
                    {renderProgressIndicator()}

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            {renderStepContent()}
                        </motion.div>
                    </AnimatePresence>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-8 pt-6 border-t border-white/5">
                        <div className="w-full sm:w-auto flex justify-center sm:justify-start">
                            <Button
                                variant="outline"
                                onClick={handleSaveDraft}
                                disabled={isDraftSaving}
                                className="w-full sm:w-auto text-xs sm:text-sm border-white/10 hover:border-accent-gold/40 hover:bg-white/5 text-white"
                            >
                                {isDraftSaving ? 'Se salvează...' : 'Salvează ca draft'}
                            </Button>
                        </div>

                        <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                            {currentStep > 0 && (
                                <Button 
                                    variant="outline" 
                                    onClick={handlePrevious} 
                                    className="flex-1 sm:flex-initial text-xs sm:text-sm border-white/10 hover:border-accent-gold/40 hover:bg-white/5 text-white"
                                >
                                    Înapoi
                                </Button>
                            )}

                            {currentStep < STEPS.length - 1 ? (
                                <Button 
                                    onClick={handleNext} 
                                    className="flex-1 sm:flex-initial text-xs sm:text-sm bg-gold-gradient text-secondary-900 font-semibold hover:shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all px-5 py-2.5 rounded-xl border-none"
                                >
                                    Continuă
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="flex-1 sm:flex-initial bg-green-600 hover:bg-green-700 text-xs sm:text-sm text-white font-semibold shadow-md active:scale-95 transition-all px-5 py-2.5 rounded-xl border-none"
                                >
                                    {isSubmitting ? 'Se publică...' : 'Publică anunțul'}
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
// Step Components
interface StepProps {
    formData: Partial<CarDraft>;
    updateFormData: (field: string, value: any) => void;
    errors: FormErrors;
}

function BasicInfoStep({ formData, updateFormData, errors }: StepProps) {
    const currentYear = new Date().getFullYear();
    const yearOptions = Array.from({ length: currentYear - 1950 + 2 }, (_, i) => ({
        value: (currentYear + 1 - i).toString(),
        label: (currentYear + 1 - i).toString()
    }));

    const brandOptions = [
        { value: 'Audi', label: 'Audi' },
        { value: 'BMW', label: 'BMW' },
        { value: 'Mercedes-Benz', label: 'Mercedes-Benz' },
        { value: 'Volkswagen', label: 'Volkswagen' },
        { value: 'Opel', label: 'Opel' },
        { value: 'Ford', label: 'Ford' },
        { value: 'Renault', label: 'Renault' },
        { value: 'Peugeot', label: 'Peugeot' },
        { value: 'Citroen', label: 'Citroen' },
        { value: 'Skoda', label: 'Skoda' },
        { value: 'Toyota', label: 'Toyota' },
        { value: 'Honda', label: 'Honda' },
        { value: 'Nissan', label: 'Nissan' },
        { value: 'Hyundai', label: 'Hyundai' },
        { value: 'Kia', label: 'Kia' },
        { value: 'Mazda', label: 'Mazda' },
        { value: 'Dacia', label: 'Dacia' },
        { value: 'Fiat', label: 'Fiat' },
        { value: 'Alfa Romeo', label: 'Alfa Romeo' },
        { value: 'Volvo', label: 'Volvo' }
    ];

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-white mb-4">
                    Informații de bază despre mașină
                </h3>
                <p className="text-gray-400 text-sm sm:text-base mb-6">
                    Începe cu informațiile esențiale despre vehiculul tău
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Select
                    label="Marca *"
                    placeholder="Selectează marca"
                    options={brandOptions}
                    value={formData.brand || ''}
                    onChange={(e) => updateFormData('brand', e.target.value)}
                    error={errors.brand}
                />

                <Input
                    label="Model *"
                    placeholder="ex: A4, 320d, C-Class"
                    value={formData.model || ''}
                    onChange={(e) => updateFormData('model', e.target.value)}
                    error={errors.model}
                />

                <Select
                    label="Anul fabricației *"
                    placeholder="Selectează anul"
                    options={yearOptions}
                    value={formData.year?.toString() || ''}
                    onChange={(e) => updateFormData('year', parseInt(e.target.value))}
                    error={errors.year}
                />

                <Input
                    label="Generația (opțional)"
                    placeholder="ex: B8, F30, W204"
                    value={formData.generation || ''}
                    onChange={(e) => updateFormData('generation', e.target.value)}
                />

                <Input
                    label="VIN (opțional)"
                    placeholder="Numărul de identificare al vehiculului"
                    value={formData.vin || ''}
                    onChange={(e) => updateFormData('vin', e.target.value)}
                    helperText="VIN-ul ajută la verificarea autenticității vehiculului"
                />

                <Input
                    label="Numărul de înmatriculare (opțional)"
                    placeholder="ex: B 123 ABC"
                    value={formData.registrationNumber || ''}
                    onChange={(e) => updateFormData('registrationNumber', e.target.value)}
                />
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-start">
                    <svg className="w-5 h-5 text-accent-gold mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div>
                        <h4 className="text-sm font-medium text-accent-gold">Sfat util</h4>
                        <p className="text-sm text-gray-300 mt-1">
                            Asigură-te că informațiile sunt corecte. Acestea vor fi afișate în titlul anunțului și vor ajuta cumpărătorii să găsească mașina ta.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function TechnicalDetailsStep({ formData, updateFormData, errors }: StepProps) {
    const fuelTypeOptions = [
        { value: FuelType.PETROL, label: 'Benzină' },
        { value: FuelType.DIESEL, label: 'Diesel' },
        { value: FuelType.HYBRID, label: 'Hibrid' },
        { value: FuelType.ELECTRIC, label: 'Electric' },
        { value: FuelType.LPG, label: 'GPL' },
        { value: FuelType.CNG, label: 'CNG' }
    ];

    const transmissionOptions = [
        { value: TransmissionType.MANUAL, label: 'Manuală' },
        { value: TransmissionType.AUTOMATIC, label: 'Automată' },
        { value: TransmissionType.SEMI_AUTOMATIC, label: 'Semi-automată' },
        { value: TransmissionType.CVT, label: 'CVT' }
    ];

    const updateSpecs = (field: keyof CarSpecs, value: any) => {
        const currentSpecs = formData.specifications || {};
        updateFormData('specifications', {
            ...currentSpecs,
            [field]: value
        });
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-white mb-4">
                    Specificații tehnice
                </h3>
                <p className="text-gray-400 text-sm sm:text-base mb-6">
                    Adaugă detaliile tehnice ale mașinii pentru a oferi informații complete cumpărătorilor
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Select
                    label="Tipul combustibilului *"
                    placeholder="Selectează tipul"
                    options={fuelTypeOptions}
                    value={formData.fuelType || ''}
                    onChange={(e) => updateFormData('fuelType', e.target.value as FuelType)}
                    error={errors.fuelType}
                />

                <Select
                    label="Transmisia *"
                    placeholder="Selectează transmisia"
                    options={transmissionOptions}
                    value={formData.transmission || ''}
                    onChange={(e) => updateFormData('transmission', e.target.value as TransmissionType)}
                    error={errors.transmission}
                />

                <Input
                    label="Kilometraj *"
                    type="number"
                    placeholder="ex: 150000"
                    value={formData.mileage?.toString() || ''}
                    onChange={(e) => updateFormData('mileage', parseInt(e.target.value) || 0)}
                    error={errors.mileage}
                    rightIcon={<span className="text-sm text-gray-300">km</span>}
                />

                <Input
                    label="Capacitatea motorului"
                    type="number"
                    step="0.1"
                    placeholder="ex: 2.0"
                    value={formData.specifications?.engineSize?.toString() || ''}
                    onChange={(e) => updateSpecs('engineSize', parseFloat(e.target.value) || 0)}
                    rightIcon={<span className="text-sm text-gray-300">L</span>}
                />

                <Input
                    label="Puterea motorului"
                    type="number"
                    placeholder="ex: 150"
                    value={formData.specifications?.power?.toString() || ''}
                    onChange={(e) => updateSpecs('power', parseInt(e.target.value) || 0)}
                    rightIcon={<span className="text-sm text-gray-300">CP</span>}
                />

                <Input
                    label="Numărul de uși"
                    type="number"
                    placeholder="ex: 4"
                    value={formData.specifications?.doors?.toString() || ''}
                    onChange={(e) => updateSpecs('doors', parseInt(e.target.value) || 0)}
                />

                <Input
                    label="Numărul de locuri"
                    type="number"
                    placeholder="ex: 5"
                    value={formData.specifications?.seats?.toString() || ''}
                    onChange={(e) => updateSpecs('seats', parseInt(e.target.value) || 0)}
                />

                <Input
                    label="Capacitatea portbagajului"
                    type="number"
                    placeholder="ex: 500"
                    value={formData.specifications?.trunkCapacity?.toString() || ''}
                    onChange={(e) => updateSpecs('trunkCapacity', parseInt(e.target.value) || 0)}
                    rightIcon={<span className="text-sm text-gray-300">L</span>}
                />
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h4 className="text-sm font-medium text-white mb-2">Consum combustibil (opțional)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Input
                        label="Oraș"
                        type="number"
                        step="0.1"
                        placeholder="ex: 8.5"
                        value={formData.specifications?.fuelConsumption?.city?.toString() || ''}
                        onChange={(e) => {
                            const currentConsumption = formData.specifications?.fuelConsumption || {};
                            updateSpecs('fuelConsumption', {
                                ...currentConsumption,
                                city: parseFloat(e.target.value) || 0
                            });
                        }}
                        rightIcon={<span className="text-sm text-gray-400 font-medium">L/100km</span>}
                        className="pr-20"
                    />
                    <Input
                        label="Șosea"
                        type="number"
                        step="0.1"
                        placeholder="ex: 5.5"
                        value={formData.specifications?.fuelConsumption?.highway?.toString() || ''}
                        onChange={(e) => {
                            const currentConsumption = formData.specifications?.fuelConsumption || {};
                            updateSpecs('fuelConsumption', {
                                ...currentConsumption,
                                highway: parseFloat(e.target.value) || 0
                            });
                        }}
                        rightIcon={<span className="text-sm text-gray-400 font-medium">L/100km</span>}
                        className="pr-20"
                    />
                    <Input
                        label="Mixt"
                        type="number"
                        step="0.1"
                        placeholder="ex: 6.8"
                        value={formData.specifications?.fuelConsumption?.combined?.toString() || ''}
                        onChange={(e) => {
                            const currentConsumption = formData.specifications?.fuelConsumption || {};
                            updateSpecs('fuelConsumption', {
                                ...currentConsumption,
                                combined: parseFloat(e.target.value) || 0
                            });
                        }}
                        rightIcon={<span className="text-sm text-gray-400 font-medium">L/100km</span>}
                        className="pr-20"
                    />
                </div>
            </div>
        </div>
    );
}

function ConditionStep({ formData, updateFormData, errors }: StepProps) {
    const conditionOptions = [
        { value: ConditionType.EXCELLENT, label: 'Excelentă' },
        { value: ConditionType.VERY_GOOD, label: 'Foarte bună' },
        { value: ConditionType.GOOD, label: 'Bună' },
        { value: ConditionType.FAIR, label: 'Satisfăcătoare' },
        { value: ConditionType.POOR, label: 'Slabă' }
    ];

    const updateCondition = (field: keyof ConditionReport, value: any) => {
        const currentCondition = formData.condition || {};
        updateFormData('condition', {
            ...currentCondition,
            [field]: value
        });
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-white mb-4">
                    Starea și istoricul mașinii
                </h3>
                <p className="text-gray-400 text-sm sm:text-base mb-6">
                    Oferă informații oneste despre starea vehiculului pentru a câștiga încrederea cumpărătorilor
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Select
                    label="Starea generală *"
                    placeholder="Selectează starea"
                    options={conditionOptions}
                    value={formData.condition?.overall || ''}
                    onChange={(e) => updateCondition('overall', e.target.value as ConditionType)}
                    error={errors['condition.overall']}
                />

                <Input
                    label="Numărul de proprietari *"
                    type="number"
                    placeholder="ex: 2"
                    value={formData.owners?.toString() || ''}
                    onChange={(e) => updateFormData('owners', parseInt(e.target.value) || 0)}
                    error={errors.owners}
                />

                <Select
                    label="Starea exteriorului"
                    placeholder="Selectează starea"
                    options={conditionOptions}
                    value={formData.condition?.exterior || ''}
                    onChange={(e) => updateCondition('exterior', e.target.value as ConditionType)}
                />

                <Select
                    label="Starea interiorului"
                    placeholder="Selectează starea"
                    options={conditionOptions}
                    value={formData.condition?.interior || ''}
                    onChange={(e) => updateCondition('interior', e.target.value as ConditionType)}
                />

                <Select
                    label="Starea motorului"
                    placeholder="Selectează starea"
                    options={conditionOptions}
                    value={formData.condition?.engine || ''}
                    onChange={(e) => updateCondition('engine', e.target.value as ConditionType)}
                />

                <Select
                    label="Starea transmisiei"
                    placeholder="Selectează starea"
                    options={conditionOptions}
                    value={formData.condition?.transmission || ''}
                    onChange={(e) => updateCondition('transmission', e.target.value as ConditionType)}
                />
            </div>

            <div className="space-y-4">
                <div className="flex items-start sm:items-center space-x-3">
                    <input
                        type="checkbox"
                        id="hasAccidents"
                        checked={formData.condition?.hasAccidents || false}
                        onChange={(e) => updateCondition('hasAccidents', e.target.checked)}
                        className="h-4 w-4 text-accent-gold focus:ring-accent-gold border-white/20 rounded mt-0.5 sm:mt-0"
                    />
                    <label htmlFor="hasAccidents" className="text-sm font-medium text-white leading-relaxed">
                        Mașina a fost implicată în accidente
                    </label>
                </div>

                <div className="flex items-start sm:items-center space-x-3">
                    <input
                        type="checkbox"
                        id="serviceHistory"
                        checked={formData.serviceHistory || false}
                        onChange={(e) => updateFormData('serviceHistory', e.target.checked)}
                        className="h-4 w-4 text-accent-gold focus:ring-accent-gold border-white/20 rounded mt-0.5 sm:mt-0"
                    />
                    <label htmlFor="serviceHistory" className="text-sm font-medium text-white leading-relaxed">
                        Istoric complet de service
                    </label>
                </div>

                <Input
                    label="Garanție rămasă (luni)"
                    type="number"
                    placeholder="ex: 12"
                    value={formData.warrantyRemaining?.toString() || ''}
                    onChange={(e) => updateFormData('warrantyRemaining', parseInt(e.target.value) || 0)}
                />
            </div>

            <Textarea
                label="Observații despre starea mașinii"
                placeholder="Descrie orice defecte, reparații recente sau alte aspecte importante..."
                value={formData.condition?.notes || ''}
                onChange={(e) => updateCondition('notes', e.target.value)}
                rows={4}
            />
        </div>
    );
}

function PricingStep({ formData, updateFormData, errors }: StepProps) {
    const updateLocation = (field: keyof Location, value: any) => {
        const currentLocation = formData.location || {};
        updateFormData('location', {
            ...currentLocation,
            [field]: value
        });
    };

    const romanianCounties = [
        'Alba', 'Arad', 'Argeș', 'Bacău', 'Bihor', 'Bistrița-Năsăud', 'Botoșani', 'Brașov',
        'Brăila', 'București', 'Buzău', 'Caraș-Severin', 'Călărași', 'Cluj', 'Constanța',
        'Covasna', 'Dâmbovița', 'Dolj', 'Galați', 'Giurgiu', 'Gorj', 'Harghita', 'Hunedoara',
        'Ialomița', 'Iași', 'Ilfov', 'Maramureș', 'Mehedinți', 'Mureș', 'Neamț', 'Olt',
        'Prahova', 'Satu Mare', 'Sălaj', 'Sibiu', 'Suceava', 'Teleorman', 'Timiș', 'Tulcea',
        'Vaslui', 'Vâlcea', 'Vrancea'
    ].map(county => ({ value: county, label: county }));

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-white mb-4">
                    Preț și locație
                </h3>
                <p className="text-gray-400 text-sm sm:text-base mb-6">
                    Stabilește un preț competitiv și specifică locația pentru a atrage cumpărătorii potriviți
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <Input
                        label="Preț *"
                        type="number"
                        placeholder="ex: 15000"
                        value={formData.price?.toString() || ''}
                        onChange={(e) => updateFormData('price', parseInt(e.target.value) || 0)}
                        error={errors.price}
                        rightIcon={<span className="text-sm text-gray-300">EUR</span>}
                    />

                    <div className="flex items-start sm:items-center space-x-3">
                        <input
                            type="checkbox"
                            id="negotiable"
                            checked={formData.negotiable || false}
                            onChange={(e) => updateFormData('negotiable', e.target.checked)}
                            className="h-4 w-4 text-accent-gold focus:ring-accent-gold border-white/20 rounded mt-0.5 sm:mt-0"
                        />
                        <label htmlFor="negotiable" className="text-sm font-medium text-white leading-relaxed">
                            Preț negociabil
                        </label>
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <h4 className="text-sm font-medium text-accent-gold mb-2">Sugestie de preț</h4>
                    <p className="text-sm text-gray-300">
                        Pe baza anului, kilometrajului și modelului, prețul recomandat este între{' '}
                        <span className="font-semibold text-white">12.000 - 18.000 EUR</span>
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                    label="Orașul *"
                    placeholder="ex: București"
                    value={formData.location?.city || ''}
                    onChange={(e) => updateLocation('city', e.target.value)}
                    error={errors['location.city']}
                />

                <Select
                    label="Județul"
                    placeholder="Selectează județul"
                    options={romanianCounties}
                    value={formData.location?.county || ''}
                    onChange={(e) => updateLocation('county', e.target.value)}
                />
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-start">
                    <svg className="w-5 h-5 text-accent-gold mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>
                        <h4 className="text-sm font-medium text-accent-gold">Sfaturi pentru preț</h4>
                        <ul className="text-sm text-gray-300 mt-1 space-y-1">
                            <li>• Verifică prețurile similare pe piață</li>
                            <li>• Consideră starea și istoricul mașinii</li>
                            <li>• Un preț realist atrage mai mulți cumpărători</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

function DescriptionStep({ formData, updateFormData, errors }: StepProps) {
    const generateTitle = () => {
        const parts = [
            formData.brand,
            formData.model,
            formData.year,
            formData.fuelType && formData.fuelType.charAt(0).toUpperCase() + formData.fuelType.slice(1)
        ].filter(Boolean);

        return parts.join(' ');
    };

    const handleGenerateTitle = () => {
        const title = generateTitle();
        if (title) {
            updateFormData('title', title);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-white mb-4">
                    Descriere și finalizare
                </h3>
                <p className="text-gray-400 text-sm sm:text-base mb-6">
                    Creează un titlu atractiv și o descriere detaliată pentru a convinge cumpărătorii
                </p>
            </div>

            <div className="space-y-6">
                <div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-2">
                        <label className="block text-sm font-medium text-white">
                            Titlul anunțului *
                        </label>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleGenerateTitle}
                            className="text-xs sm:text-sm self-start sm:self-auto"
                        >
                            Generează automat
                        </Button>
                    </div>
                    <Input
                        placeholder="ex: BMW 320d 2018 - Stare impecabilă, istoric complet"
                        value={formData.title || ''}
                        onChange={(e) => updateFormData('title', e.target.value)}
                        error={errors.title}
                        helperText="Un titlu bun include marca, modelul, anul și un element distinctiv"
                    />
                </div>

                <Textarea
                    label="Descrierea detaliată *"
                    placeholder="Descrie mașina în detaliu: starea, echipările, istoricul, motivul vânzării, etc. O descriere completă și onestă atrage cumpărători serioși..."
                    value={formData.description || ''}
                    onChange={(e) => updateFormData('description', e.target.value)}
                    error={errors.description}
                    rows={8}
                    helperText={`${formData.description?.length || 0} caractere (minim 50)`}
                />

                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <h4 className="text-sm font-medium text-accent-gold mb-2">Previzualizare anunț</h4>
                    <div className="bg-white/10 border border-white/20 rounded-lg p-4">
                        <h5 className="font-semibold text-white mb-2">
                            {formData.title || 'Titlul anunțului va apărea aici'}
                        </h5>
                        <div className="flex items-center gap-4 text-sm text-gray-300 mb-2">
                            <span>{formData.year || '----'}</span>
                            <span>•</span>
                            <span>{formData.mileage?.toLocaleString() || '---'} km</span>
                            <span>•</span>
                            <span>{formData.fuelType || '---'}</span>
                            <span>•</span>
                            <span>{formData.location?.city || '---'}</span>
                        </div>
                        <p className="text-lg font-bold text-white">
                            {formData.price ? `${formData.price.toLocaleString()} EUR` : '--- EUR'}
                            {formData.negotiable && <span className="text-sm font-normal text-gray-300 ml-2">(negociabil)</span>}
                        </p>
                        <p className="text-sm text-gray-300 mt-3 line-clamp-3">
                            {formData.description || 'Descrierea va apărea aici...'}
                        </p>
                    </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start">
                        <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <div>
                            <h4 className="text-sm font-medium text-blue-900">Sfaturi pentru o descriere bună</h4>
                            <ul className="text-sm text-blue-700 mt-1 space-y-1">
                                <li>• Menționează toate echipările importante</li>
                                <li>• Fii onest despre defecte sau probleme</li>
                                <li>• Explică motivul vânzării</li>
                                <li>• Adaugă informații despre întreținere</li>
                                <li>• Folosește un ton prietenos și profesional</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} function
    ImagesStep({ formData, updateFormData, errors, onFilesSelected }: StepProps & { onFilesSelected?: (files: File[]) => Promise<void> }) {
    const handleImagesChange = async (files: File[]) => {
        // Convert files to Image objects for the form data
        const imageObjects: Image[] = files.map((file, index) => ({
            id: `temp-${index}`,
            url: URL.createObjectURL(file),
            thumbnailUrl: URL.createObjectURL(file),
            alt: `Car image ${index + 1}`,
            order: index,
            isMain: index === 0
        }));

        updateFormData('images', imageObjects);
        if (onFilesSelected) {
            try {
                await onFilesSelected(files);
            } catch (e) {
                console.error('Image upload error', e);
            }
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-white mb-4">
                    Imagini ale mașinii
                </h3>
                <p className="text-gray-400 text-sm sm:text-base mb-6">
                    Adaugă imagini de calitate pentru a atrage cumpărătorii. Prima imagine va fi afișată ca imagine principală.
                </p>
            </div>

            <ImageUpload
                maxImages={15}
                onImagesChange={handleImagesChange}
                acceptedTypes={['image/jpeg', 'image/jpg', 'image/png', 'image/webp']}
                maxFileSize={10}
                initialImages={formData.images?.map(img => img.url) || []}
            />

            {errors.images && (
                <p className="text-red-400 text-sm mt-2">{errors.images}</p>
            )}

            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                <div className="flex items-start">
                    <svg className="w-5 h-5 text-green-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                        <h4 className="text-sm font-semibold text-green-400">Recomandări pentru imagini</h4>
                        <ul className="text-sm text-gray-300 mt-2 space-y-1">
                            <li>• Fotografiază mașina în lumină naturală</li>
                            <li>• Include imagini din toate unghiurile (față, spate, laterale)</li>
                            <li>• Adaugă fotografii cu interiorul (bord, scaune, volan)</li>
                            <li>• Fotografiază motorul și portbagajul</li>
                            <li>• Evidențiază orice defecte sau uzură vizibilă</li>
                            <li>• Folosește un fundal curat și neutru</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
