// Re-export all types for easy importing
export * from './index';
export * from '../utils/typeGuards';
export * from '../utils/helpers';
export * from '../data/mockData';
export * from '../constants';

// Additional utility types for React components
export interface ComponentWithChildren {
  children: React.ReactNode;
}

export interface ComponentWithClassName {
  className?: string;
}

export interface ComponentWithOptionalChildren {
  children?: React.ReactNode;
}

// Common component prop combinations
export type BaseProps = ComponentWithClassName & ComponentWithOptionalChildren;

// Form field props
export interface FormFieldProps extends BaseProps {
  label?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

// Modal props
export interface ModalProps extends BaseProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

// Button props
export interface ButtonProps extends BaseProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

// Card props
export interface CardProps extends BaseProps {
  variant?: 'default' | 'outlined' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

// Input props
export interface InputProps extends FormFieldProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
}

// Select props
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends FormFieldProps {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  multiple?: boolean;
  searchable?: boolean;
}

// Checkbox props
export interface CheckboxProps extends FormFieldProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  indeterminate?: boolean;
}

// Radio props
export interface RadioProps extends FormFieldProps {
  name: string;
  value: string;
  checked?: boolean;
  onChange?: (value: string) => void;
}

// Range slider props
export interface RangeSliderProps extends FormFieldProps {
  min: number;
  max: number;
  step?: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  formatValue?: (value: number) => string;
}

// Image props
export interface ImageProps extends ComponentWithClassName {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  loading?: 'lazy' | 'eager';
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  fallback?: string;
  onLoad?: () => void;
  onError?: () => void;
}

// Badge props
export interface BadgeProps extends BaseProps {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

// Tooltip props
export interface TooltipProps extends BaseProps {
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  trigger?: 'hover' | 'click' | 'focus';
}

// Dropdown props
export interface DropdownProps extends BaseProps {
  trigger: React.ReactNode;
  items: Array<{
    key: string;
    label: string;
    icon?: string;
    disabled?: boolean;
    onClick?: () => void;
  }>;
  position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
}

// Pagination props
export interface PaginationProps extends BaseProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showFirstLast?: boolean;
  showPrevNext?: boolean;
  maxVisiblePages?: number;
}

// Loading spinner props
export interface SpinnerProps extends ComponentWithClassName {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

// Alert props
export interface AlertProps extends BaseProps {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
}

// Tabs props
export interface TabItem {
  key: string;
  label: string;
  content: React.ReactNode;
  disabled?: boolean;
}

export interface TabsProps extends BaseProps {
  items: TabItem[];
  activeTab?: string;
  onTabChange?: (key: string) => void;
  variant?: 'default' | 'pills' | 'underline';
}

// Accordion props
export interface AccordionItem {
  key: string;
  title: string;
  content: React.ReactNode;
  disabled?: boolean;
}

export interface AccordionProps extends BaseProps {
  items: AccordionItem[];
  allowMultiple?: boolean;
  defaultOpen?: string[];
}

// Search input props
export interface SearchInputProps extends InputProps {
  onSearch?: (query: string) => void;
  suggestions?: string[];
  onSuggestionSelect?: (suggestion: string) => void;
  showSuggestions?: boolean;
  loading?: boolean;
}

// File upload props
export interface FileUploadProps extends FormFieldProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  maxFiles?: number;
  onFilesChange?: (files: File[]) => void;
  preview?: boolean;
  dragAndDrop?: boolean;
}

// Date picker props
export interface DatePickerProps extends FormFieldProps {
  value?: Date;
  onChange?: (date: Date | null) => void;
  minDate?: Date;
  maxDate?: Date;
  format?: string;
  showTime?: boolean;
}

// Color picker props
export interface ColorPickerProps extends FormFieldProps {
  value?: string;
  onChange?: (color: string) => void;
  presets?: string[];
  format?: 'hex' | 'rgb' | 'hsl';
}