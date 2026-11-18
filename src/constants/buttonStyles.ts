// Standardized pill action button classes matching the "+ New Lesson Plan" button in Class Preparation (h-9, px-3.5 sm:px-4, text-[13px], font-medium)
export const ACTION_BTN_BASE =
  'touch-target-44 inline-flex items-center justify-center gap-1.5 sm:gap-2 h-9 px-3.5 sm:px-4 rounded-full text-[13px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

export const ACTION_BTN_PRIMARY = `${ACTION_BTN_BASE} bg-[#ee2e65] hover:bg-[#d82256] text-white`;

export const ACTION_BTN_SECONDARY = `${ACTION_BTN_BASE} border border-black/[0.09] bg-white hover:bg-[#FAFBFD] text-[#1C1D21]`;

export const ACTION_BTN_SOFT_PRIMARY = `${ACTION_BTN_BASE} bg-[#FEF1F5] hover:bg-[#FDE0E9] border border-[#FBC2D4]/70 text-[#9D113C]`;

export const ACTION_BTN_DARK = `${ACTION_BTN_BASE} bg-[#1C1D21] hover:bg-black text-white`;

export const ACTION_BTN_DANGER_SOFT = `${ACTION_BTN_BASE} bg-[#FFECEB] hover:bg-[#FAD2CF] text-[#942922]`;
