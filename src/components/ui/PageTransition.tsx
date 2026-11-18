import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { PageId } from '../../types';
import { useIsMobile } from '../../hooks/useIsMobile';

const MOBILE_PAGE_ORDER: PageId[] = [
  'overview',
  'schedule',
  'materials',
  'prep',
  'attendance',
  'exams',
  'assignments',
  'livequiz',
  'students',
  'trainers',
  'messages',
  'analytics',
  'reports',
  'settings',
  'uikit',
];

const DESKTOP_PAGE_ORDER: PageId[] = [
  'overview',
  'materials',
  'prep',
  'attendance',
  'exams',
  'assignments',
  'livequiz',
  'schedule',
  'students',
  'trainers',
  'messages',
  'analytics',
  'reports',
  'settings',
  'uikit',
];

export function getOrderedDirection(
  prevKey: string,
  nextKey: string,
  order: readonly string[]
): 1 | -1 {
  const prevIdx = order.indexOf(prevKey);
  const nextIdx = order.indexOf(nextKey);
  if (prevIdx === -1 || nextIdx === -1 || prevIdx === nextIdx) return 1;
  return nextIdx > prevIdx ? 1 : -1;
}

export function getPageDirection(
  prevPage: PageId,
  activePage: PageId,
  isMobile: boolean
): 1 | -1 {
  const order = isMobile ? MOBILE_PAGE_ORDER : DESKTOP_PAGE_ORDER;
  return getOrderedDirection(prevPage, activePage, order);
}

interface PageTransitionProps {
  activePage?: PageId;
  prevPage?: PageId;
  transitionKey?: string;
  directionOverride?: 1 | -1;
  scrollResetOnChange?: boolean;
  className?: string;
  children: React.ReactNode;
}

interface TransitionCustom {
  direction: 1 | -1;
  isMobile: boolean;
}

const pageVariants = {
  enter: ({ direction, isMobile }: TransitionCustom) =>
    isMobile
      ? {
          opacity: 0,
          x: direction * 28,
          y: 0,
          scale: 0.986,
        }
      : {
          opacity: 0,
          x: 0,
          y: direction * 16,
          scale: 0.992,
        },
  center: {
    opacity: 1,
    x: 0,
    y: 0,
    scale: 1,
    transition: {
      x: { type: 'spring' as const, stiffness: 400, damping: 36, mass: 0.85 },
      y: { type: 'spring' as const, stiffness: 420, damping: 36, mass: 0.82 },
      scale: { duration: 0.26, ease: [0.22, 1, 0.36, 1] as const },
      opacity: { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const },
    },
  },
  exit: ({ direction, isMobile }: TransitionCustom) =>
    isMobile
      ? {
          opacity: 0,
          x: direction * -20,
          y: 0,
          scale: 0.99,
          pointerEvents: 'none' as const,
          transition: {
            x: { duration: 0.2, ease: [0.32, 0.72, 0, 1] as const },
            scale: { duration: 0.2, ease: [0.32, 0.72, 0, 1] as const },
            opacity: { duration: 0.16, ease: 'easeOut' as const },
          },
        }
      : {
          opacity: 0,
          x: 0,
          y: direction * -12,
          scale: 0.994,
          pointerEvents: 'none' as const,
          transition: {
            y: { duration: 0.18, ease: [0.32, 0.72, 0, 1] as const },
            scale: { duration: 0.18, ease: [0.32, 0.72, 0, 1] as const },
            opacity: { duration: 0.15, ease: 'easeOut' as const },
          },
        },
};

export const PageTransition: React.FC<PageTransitionProps> = ({
  activePage = 'uikit',
  prevPage = 'uikit',
  transitionKey,
  directionOverride,
  scrollResetOnChange = true,
  className = 'flex-1 min-h-0 flex flex-col w-full',
  children,
}) => {
  const isMobile = useIsMobile();
  const key = transitionKey ?? activePage;
  const direction = directionOverride ?? getPageDirection(prevPage, activePage, isMobile);

  useEffect(() => {
    if (scrollResetOnChange && isMobile && typeof window !== 'undefined' && window.scrollY > 0) {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
  }, [key, isMobile, scrollResetOnChange]);

  return (
    <AnimatePresence mode="popLayout" initial={false} custom={{ direction, isMobile }}>
      <motion.div
        key={key}
        custom={{ direction, isMobile }}
        variants={pageVariants}
        initial="enter"
        animate="center"
        exit="exit"
        style={{ willChange: 'transform, opacity' }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};
