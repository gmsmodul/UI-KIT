import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronRight, Zap } from 'lucide-react';
import { LiveQuizJoinCard } from './LiveQuizJoinCard';

interface LiveQuizJoinAccordionProps {
  code: string;
  name: string;
  onCodeChange: (val: string) => void;
  onNameChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  errorMessage?: string | null;
  isSubmitting?: boolean;
  open?: boolean;
  onToggle?: () => void;
  defaultOpen?: boolean;
}

export const LiveQuizJoinAccordion: React.FC<LiveQuizJoinAccordionProps> = ({
  code,
  name,
  onCodeChange,
  onNameChange,
  onSubmit,
  errorMessage,
  isSubmitting = false,
  open,
  onToggle,
  defaultOpen = false,
}) => {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = open !== undefined ? open : internalOpen;
  const [settled, setSettled] = useState(isOpen);

  const handleToggle = () => {
    setSettled(false);
    if (onToggle) {
      onToggle();
    } else {
      setInternalOpen((prev) => !prev);
    }
  };

  return (
    <div className="rounded-2xl border border-black/[0.07] bg-white">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={handleToggle}
        className={`w-full px-5 py-3.5 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer ${
          isOpen ? 'rounded-t-2xl bg-white' : 'rounded-2xl hover:bg-[#FAFBFD]'
        }`}
      >
        <span className="flex items-center gap-2.5 text-[14px] font-semibold text-[#1C1D21]">
          <Zap className="w-4 h-4 text-[#ee2e65] shrink-0" />
          <span>Gabung Sesi dengan Kode Ruangan</span>
        </span>
        <ChevronRight
          className={`w-4 h-4 text-[#6E717A] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] shrink-0 ${
            isOpen ? 'rotate-90 text-[#ee2e65]' : ''
          }`}
        />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="livequiz-join-accordion"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: { duration: 0.36, ease: [0.22, 1, 0.36, 1] },
              opacity: { duration: 0.24, ease: [0.22, 1, 0.36, 1] },
            }}
            onAnimationStart={() => setSettled(false)}
            onAnimationComplete={() => {
              if (isOpen) {
                setSettled(true);
              }
            }}
            style={{
              overflow: settled ? 'visible' : 'hidden',
              willChange: 'height, opacity',
            }}
          >
            <motion.div
              initial={{ y: -10 }}
              animate={{ y: 0 }}
              exit={{ y: -8 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="border-t border-black/[0.06] rounded-b-2xl"
            >
              <LiveQuizJoinCard
                embedded
                code={code}
                name={name}
                onCodeChange={onCodeChange}
                onNameChange={onNameChange}
                onSubmit={onSubmit}
                errorMessage={errorMessage}
                isSubmitting={isSubmitting}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
