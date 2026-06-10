import { Variants, TargetAndTransition } from 'framer-motion';

// Container variant for staggering children
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

// Item variant for sliding up and fading in
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24,
    },
  },
};

// Item variant for sliding in from the right
export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  show: {
    opacity: 1,
    x: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24,
    },
  },
};

// Scale on hover for interactive elements like cards
export const hoverScale: TargetAndTransition = {
  scale: 1.02,
  transition: {
    type: 'spring',
    stiffness: 400,
    damping: 10,
  },
};

// Tap effect for buttons/clickable cards
export const tapScale: TargetAndTransition = {
  scale: 0.98,
};
