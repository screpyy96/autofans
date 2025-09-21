import { forwardRef, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '~/lib/utils';
import { useFocusManagement, useAccessibility } from '~/hooks/useAccessibility';
import { generateId, createAriaLiveRegion } from '~/utils/accessibility';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  className?: string;
}

const modalSizes = {
      sm: '',
    md: '',
    lg: '',
    xl: '',
};

export const Modal = forwardRef<HTMLDivElement, ModalProps>(
  ({ isOpen, onClose, title, description, size = 'md', children, className }, ref) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const { saveFocus, restoreFocus, focusFirst, trapFocus } = useFocusManagement();
    const { reduceMotion } = useAccessibility();
    
    const titleId = useRef(generateId('modal-title')).current;
    const descriptionId = useRef(generateId('modal-description')).current;

    useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };

      if (isOpen) {
        // Save current focus and manage focus
        saveFocus();
        document.addEventListener('keydown', handleEscape);
        document.body.style.overflow = 'hidden';
        
        // Announce modal opening to screen readers
        createAriaLiveRegion(title ? `Modal deschis: ${title}` : 'Modal deschis', 'assertive');
        
        // Focus first element in modal after animation
        setTimeout(() => {
          if (modalRef.current) {
            focusFirst(modalRef.current);
            // Set up focus trap
            const cleanup = trapFocus(modalRef.current);
            return cleanup;
          }
        }, reduceMotion ? 0 : 200);
      }

      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = 'unset';
        if (!isOpen) {
          restoreFocus();
        }
      };
    }, [isOpen, onClose, saveFocus, restoreFocus, focusFirst, trapFocus, title, reduceMotion]);

    return (
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
            
            {/* Modal */}
            <motion.div
              ref={modalRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={title ? titleId : undefined}
              aria-describedby={description ? descriptionId : undefined}
              className={cn(
                'relative bg-glass backdrop-blur-xl rounded-3xl shadow-modal mx-4 w-full border border-premium',
                modalSizes[size],
                className
              )}
              initial={reduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: reduceMotion ? 0 : 0.2 }}
            >
              {/* Header */}
              {(title || description) && (
                <div className="px-6 py-4 border-b border-premium">
                  {title && (
                    <h2 id={titleId} className="text-lg font-semibold text-white">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p id={descriptionId} className="mt-1 text-sm text-gray-400">
                      {description}
                    </p>
                  )}
                </div>
              )}
              
              {/* Content */}
              <div className="px-6 py-4">
                {children}
              </div>
              
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-accent-gold transition-colors focus:outline-none focus:ring-2 focus:ring-accent-gold focus:ring-offset-2 focus:ring-offset-secondary-800 rounded-xl p-2 hover:bg-accent-gold/10"
                aria-label="Închide modalul"
                type="button"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );
  }
);

Modal.displayName = 'Modal';