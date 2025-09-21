import type { Variants } from 'framer-motion';

// Common animation variants
export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

export const fadeInDown: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 }
};

export const fadeInLeft: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 }
};

export const fadeInRight: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 }
};

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 }
};

export const scaleInBounce: Variants = {
  initial: { opacity: 0, scale: 0.3 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 10
    }
  },
  exit: { opacity: 0, scale: 0.3 }
};

export const slideInFromBottom: Variants = {
  initial: { opacity: 0, y: 100 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30
    }
  },
  exit: { opacity: 0, y: 100 }
};

export const slideInFromTop: Variants = {
  initial: { opacity: 0, y: -100 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30
    }
  },
  exit: { opacity: 0, y: -100 }
};

// Stagger animations for lists
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30
    }
  }
};

// Hover animations
export const hoverScale: Variants = {
  initial: { scale: 1 },
  hover: { 
    scale: 1.05,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 10
    }
  }
};

export const hoverLift: Variants = {
  initial: { y: 0, boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" },
  hover: { 
    y: -4,
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 10
    }
  }
};

export const hoverGlow: Variants = {
  initial: { 
    boxShadow: "0 0 0 rgba(251, 191, 36, 0)" 
  },
  hover: { 
    boxShadow: "0 0 20px rgba(251, 191, 36, 0.3)",
    transition: {
      duration: 0.3
    }
  }
};

// Button animations
export const buttonPress: Variants = {
  initial: { scale: 1 },
  tap: { scale: 0.95 }
};

export const buttonPulse: Variants = {
  initial: { scale: 1 },
  animate: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

// Loading animations
export const spin: Variants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: "linear"
    }
  }
};

export const bounce: Variants = {
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

export const pulse: Variants = {
  animate: {
    scale: [1, 1.1, 1],
    opacity: [1, 0.8, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

// Modal animations
export const modalBackdrop: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
};

export const modalContent: Variants = {
  initial: { opacity: 0, scale: 0.9, y: 20 },
  animate: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.9, 
    y: 20,
    transition: {
      duration: 0.2
    }
  }
};

// Notification animations
export const notificationSlide: Variants = {
  initial: { opacity: 0, x: 300, scale: 0.3 },
  animate: { 
    opacity: 1, 
    x: 0, 
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 30
    }
  },
  exit: { 
    opacity: 0, 
    x: 300, 
    scale: 0.5,
    transition: {
      duration: 0.2
    }
  }
};

// Card animations
export const cardHover: Variants = {
  initial: { 
    y: 0, 
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" 
  },
  hover: { 
    y: -8,
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 10
    }
  }
};

export const cardPress: Variants = {
  initial: { scale: 1 },
  tap: { 
    scale: 0.98,
    transition: {
      duration: 0.1
    }
  }
};

// Navigation animations
export const navItemHover: Variants = {
  initial: { scale: 1, backgroundColor: "rgba(0, 0, 0, 0)" },
  hover: { 
    scale: 1.05,
    backgroundColor: "rgba(251, 191, 36, 0.1)",
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 10
    }
  }
};

// Search animations
export const searchExpand: Variants = {
  initial: { width: "auto" },
  focus: { 
    width: "100%",
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30
    }
  }
};

// Progress animations
export const progressFill: Variants = {
  initial: { width: "0%" },
  animate: (progress: number) => ({
    width: `${progress}%`,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  })
};

// Floating animations
export const float: Variants = {
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

export const floatDelay: Variants = {
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut",
      delay: 1
    }
  }
};

// Transition configurations
export const springTransition = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30
};

export const smoothTransition = {
  duration: 0.3,
  ease: [0.4, 0, 0.2, 1] as const
};

export const quickTransition = {
  duration: 0.15,
  ease: "easeOut" as const
};

export const slowTransition = {
  duration: 0.6,
  ease: [0.4, 0, 0.2, 1] as const
};

// Animation presets for common use cases
export const animationPresets = {
  // Page transitions
  pageEnter: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: smoothTransition
  },
  
  // Component reveals
  reveal: {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: springTransition
  },
  
  // Interactive elements
  interactive: {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
    transition: quickTransition
  },
  
  // Floating elements
  floating: {
    animate: {
      y: [0, -8, 0],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  }
};