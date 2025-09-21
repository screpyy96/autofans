import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';

// Simple loading component
const SimpleLoading = ({ message }: { message?: string }) => (
  <div className="flex items-center justify-center min-h-screen bg-premium-gradient">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-gold mx-auto mb-4"></div>
      {message && <p className="text-white text-lg">{message}</p>}
    </div>
  </div>
);

// Route transition wrapper
interface RouteTransitionProps {
  children: React.ReactNode;
}

export function RouteTransition({ children }: RouteTransitionProps) {
  const location = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => setIsTransitioning(false), 150);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{
          duration: 0.3,
          ease: [0.4, 0, 0.2, 1]
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// Page transition with loading
interface PageTransitionProps {
  children: React.ReactNode;
  isLoading?: boolean;
  loadingMessage?: string;
}

export function PageTransition({ 
  children, 
  isLoading = false, 
  loadingMessage 
}: PageTransitionProps) {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <SimpleLoading message={loadingMessage} />
        </motion.div>
      ) : (
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{
            duration: 0.4,
            ease: [0.4, 0, 0.2, 1]
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Slide transition for mobile navigation
export function SlideTransition({ 
  children, 
  direction = 'right' 
}: { 
  children: React.ReactNode;
  direction?: 'left' | 'right' | 'up' | 'down';
}) {
  const location = useLocation();

  const variants = {
    left: {
      initial: { x: -100, opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: 100, opacity: 0 }
    },
    right: {
      initial: { x: 100, opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: -100, opacity: 0 }
    },
    up: {
      initial: { y: -100, opacity: 0 },
      animate: { y: 0, opacity: 1 },
      exit: { y: 100, opacity: 0 }
    },
    down: {
      initial: { y: 100, opacity: 0 },
      animate: { y: 0, opacity: 1 },
      exit: { y: -100, opacity: 0 }
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={variants[direction].initial}
        animate={variants[direction].animate}
        exit={variants[direction].exit}
        transition={{
          duration: 0.3,
          ease: [0.4, 0, 0.2, 1]
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// Fade transition for modals and overlays
interface FadeTransitionProps {
  children: React.ReactNode;
  isVisible: boolean;
  duration?: number;
}

export function FadeTransition({ 
  children, 
  isVisible, 
  duration = 0.2 
}: FadeTransitionProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Scale transition for cards and components
interface ScaleTransitionProps {
  children: React.ReactNode;
  isVisible: boolean;
  scale?: number;
  duration?: number;
}

export function ScaleTransition({ 
  children, 
  isVisible, 
  scale = 0.9,
  duration = 0.2 
}: ScaleTransitionProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale }}
          transition={{ duration }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Stagger animation for lists
interface StaggerTransitionProps {
  children: React.ReactNode[];
  staggerDelay?: number;
  className?: string;
}

export function StaggerTransition({ 
  children, 
  staggerDelay = 0.1,
  className 
}: StaggerTransitionProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay
          }
        }
      }}
    >
      {children.map((child, index) => (
        <motion.div
          key={index}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
          }}
          transition={{ duration: 0.3 }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}