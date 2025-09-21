// Accessibility utility functions

export const generateId = (prefix: string = 'id'): string => {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
};

export const getAriaLabel = (
  label: string,
  description?: string,
  required?: boolean,
  invalid?: boolean
): string => {
  let ariaLabel = label;
  
  if (description) {
    ariaLabel += `, ${description}`;
  }
  
  if (required) {
    ariaLabel += ', obligatoriu';
  }
  
  if (invalid) {
    ariaLabel += ', invalid';
  }
  
  return ariaLabel;
};

export const getAriaDescribedBy = (
  errorId?: string,
  helpId?: string,
  descriptionId?: string
): string | undefined => {
  const ids = [errorId, helpId, descriptionId].filter(Boolean);
  return ids.length > 0 ? ids.join(' ') : undefined;
};

export const isElementVisible = (element: HTMLElement): boolean => {
  const style = window.getComputedStyle(element);
  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0' &&
    element.offsetWidth > 0 &&
    element.offsetHeight > 0
  );
};

export const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
  const focusableSelectors = [
    'button:not([disabled])',
    '[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]'
  ].join(', ');

  const elements = Array.from(container.querySelectorAll(focusableSelectors)) as HTMLElement[];
  return elements.filter(element => isElementVisible(element));
};

export const getNextFocusableElement = (
  current: HTMLElement,
  container: HTMLElement,
  direction: 'next' | 'previous' = 'next'
): HTMLElement | null => {
  const focusableElements = getFocusableElements(container);
  const currentIndex = focusableElements.indexOf(current);
  
  if (currentIndex === -1) return null;
  
  let nextIndex: number;
  if (direction === 'next') {
    nextIndex = (currentIndex + 1) % focusableElements.length;
  } else {
    nextIndex = (currentIndex - 1 + focusableElements.length) % focusableElements.length;
  }
  
  return focusableElements[nextIndex];
};

export const createAriaLiveRegion = (
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void => {
  const existingRegion = document.getElementById('aria-live-region');
  if (existingRegion) {
    existingRegion.textContent = message;
    return;
  }

  const region = document.createElement('div');
  region.id = 'aria-live-region';
  region.setAttribute('aria-live', priority);
  region.setAttribute('aria-atomic', 'true');
  region.className = 'sr-only';
  region.textContent = message;
  
  document.body.appendChild(region);
  
  setTimeout(() => {
    if (document.body.contains(region)) {
      document.body.removeChild(region);
    }
  }, 1000);
};

export const handleEscapeKey = (
  event: KeyboardEvent,
  callback: () => void
): void => {
  if (event.key === 'Escape') {
    event.preventDefault();
    callback();
  }
};

export const handleEnterKey = (
  event: KeyboardEvent,
  callback: () => void
): void => {
  if (event.key === 'Enter') {
    event.preventDefault();
    callback();
  }
};

export const handleSpaceKey = (
  event: KeyboardEvent,
  callback: () => void
): void => {
  if (event.key === ' ') {
    event.preventDefault();
    callback();
  }
};

export const createSkipLink = (
  targetId: string,
  text: string = 'Sari la conținutul principal'
): HTMLElement => {
  const skipLink = document.createElement('a');
  skipLink.href = `#${targetId}`;
  skipLink.textContent = text;
  skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:rounded-md focus:shadow-lg';
  
  skipLink.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
  
  return skipLink;
};

// Color contrast utilities
export const getContrastRatio = (color1: string, color2: string): number => {
  const getLuminance = (color: string): number => {
    const rgb = color.match(/\d+/g);
    if (!rgb) return 0;
    
    const [r, g, b] = rgb.map(c => {
      const sRGB = parseInt(c) / 255;
      return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
};

export const meetsWCAGContrast = (
  color1: string,
  color2: string,
  level: 'AA' | 'AAA' = 'AA',
  size: 'normal' | 'large' = 'normal'
): boolean => {
  const ratio = getContrastRatio(color1, color2);
  
  if (level === 'AAA') {
    return size === 'large' ? ratio >= 4.5 : ratio >= 7;
  } else {
    return size === 'large' ? ratio >= 3 : ratio >= 4.5;
  }
};

// ARIA utilities
export const setAriaExpanded = (element: HTMLElement, expanded: boolean): void => {
  element.setAttribute('aria-expanded', expanded.toString());
};

export const setAriaSelected = (element: HTMLElement, selected: boolean): void => {
  element.setAttribute('aria-selected', selected.toString());
};

export const setAriaChecked = (element: HTMLElement, checked: boolean | 'mixed'): void => {
  element.setAttribute('aria-checked', checked.toString());
};

export const setAriaPressed = (element: HTMLElement, pressed: boolean): void => {
  element.setAttribute('aria-pressed', pressed.toString());
};

export const setAriaHidden = (element: HTMLElement, hidden: boolean): void => {
  if (hidden) {
    element.setAttribute('aria-hidden', 'true');
  } else {
    element.removeAttribute('aria-hidden');
  }
};