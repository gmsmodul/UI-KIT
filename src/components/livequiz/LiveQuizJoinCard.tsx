import React, { useEffect, useRef, useState } from 'react';
import { ACTION_BTN_DARK } from '../../constants/buttonStyles';

interface LiveQuizJoinCardProps {
  code: string;
  name: string;
  onCodeChange: (val: string) => void;
  onNameChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  errorMessage?: string | null;
  isSubmitting?: boolean;
  embedded?: boolean;
}

export const LiveQuizJoinCard: React.FC<LiveQuizJoinCardProps> = ({
  code,
  name,
  onCodeChange,
  onNameChange,
  onSubmit,
  errorMessage,
  isSubmitting = false,
  embedded = false,
}) => {
  const [infoOpen, setInfoOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!infoOpen) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setInfoOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setInfoOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [infoOpen]);

  return (
    <div
      className={
        embedded
          ? 'p-5 sm:p-6 bg-[#FAFBFD] rounded-b-2xl'
          : 'bg-[#FAFBFD] rounded-2xl border border-black/[0.07] p-5 sm:p-6'
      }
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-2 relative" ref={popoverRef}>
          <h2 className="text-[17px] font-semibold text-[#1C1D21]">
            Masukkan Kode Ruangan dari Host
          </h2>

          <button
            type="button"
            aria-label="Informasi mode LiveQuiz"
            aria-expanded={infoOpen}
            onClick={() => setInfoOpen((prev) => !prev)}
            className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors shrink-0 cursor-pointer ${
              infoOpen
                ? 'bg-[#FEF1F5] border-[#ee2e65] text-[#9D113C]'
                : 'bg-white border-black/[0.15] text-[#6E717A] hover:text-[#1C1D21] hover:border-black/[0.3]'
            }`}
          >
            <span className="text-[10px] font-bold leading-none">?</span>
          </button>

          {infoOpen && (
            <div
              role="dialog"
              aria-label="Informasi mode LiveQuiz"
              className="absolute left-0 top-full mt-2 z-30 w-[min(320px,calc(100vw-4rem))] bg-white rounded-2xl border border-black/[0.08] shadow-[0_14px_34px_-10px_rgba(15,23,42,0.18)] p-3.5 text-[12.5px] leading-relaxed text-[#4B4E57] animate-ui-pop"
            >
              Mendukung mode Classic maupun Test Mode secara langsung lintas tab atau perangkat.
            </div>
          )}
        </div>

        <form
          onSubmit={onSubmit}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 lg:max-w-xl"
        >
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => onCodeChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="Kode 6 digit"
            className="sm:w-36 h-9 px-4 rounded-full border border-black/[0.1] bg-white text-[13.5px] font-mono font-bold tracking-widest text-center text-[#1C1D21] outline-none focus:border-[#ee2e65] tabular-nums transition-colors"
          />
          <input
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Nama peserta..."
            className="flex-1 h-9 px-4 rounded-full border border-black/[0.1] bg-white text-[13px] text-[#1C1D21] outline-none focus:border-[#ee2e65] transition-colors"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className={ACTION_BTN_DARK}
          >
            {isSubmitting ? 'Memeriksa...' : 'Gabung Sesi'}
          </button>
        </form>
      </div>

      {errorMessage && (
        <div className="mt-3 px-4 py-2.5 rounded-xl bg-[#FFECEB] border border-[#F5B7B1] text-[#942922] text-[12.5px] font-medium">
          {errorMessage}
        </div>
      )}
    </div>
  );
};
