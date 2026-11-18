export interface WaygroundTilePalette {
  letter: string;
  label: string;
  bg: string;
  hoverBg: string;
  borderBottom: string;
  badgeBg: string;
  shape: 'diamond' | 'circle' | 'square' | 'triangle';
}

export const WAYGROUND_OPTION_TILES: WaygroundTilePalette[] = [
  {
    letter: 'A',
    label: 'Opsi A',
    bg: 'bg-[#2F6DAE]',
    hoverBg: 'hover:bg-[#377CC4]',
    borderBottom: 'border-b-4 border-[#1D4878]',
    badgeBg: 'bg-[#1D4878]/65',
    shape: 'diamond',
  },
  {
    letter: 'B',
    label: 'Opsi B',
    bg: 'bg-[#2C9CA6]',
    hoverBg: 'hover:bg-[#33B0BB]',
    borderBottom: 'border-b-4 border-[#196870]',
    badgeBg: 'bg-[#196870]/65',
    shape: 'circle',
  },
  {
    letter: 'C',
    label: 'Opsi C',
    bg: 'bg-[#EDA92A]',
    hoverBg: 'hover:bg-[#F5B73D]',
    borderBottom: 'border-b-4 border-[#B0770D]',
    badgeBg: 'bg-[#B0770D]/65',
    shape: 'square',
  },
  {
    letter: 'D',
    label: 'Opsi D',
    bg: 'bg-[#D5546D]',
    hoverBg: 'hover:bg-[#E2647D]',
    borderBottom: 'border-b-4 border-[#992D43]',
    badgeBg: 'bg-[#992D43]/65',
    shape: 'triangle',
  },
];

export const WAYGROUND_TF_TILES = [
  {
    letter: 'A',
    bg: 'bg-[#2C9CA6]',
    hoverBg: 'hover:bg-[#33B0BB]',
    borderBottom: 'border-b-4 border-[#196870]',
    badgeBg: 'bg-[#196870]/65',
  },
  {
    letter: 'B',
    bg: 'bg-[#D5546D]',
    hoverBg: 'hover:bg-[#E2647D]',
    borderBottom: 'border-b-4 border-[#992D43]',
    badgeBg: 'bg-[#992D43]/65',
  },
];

export const WAYGROUND_ARENA_SHELL =
  'rounded-2xl overflow-hidden bg-[radial-gradient(ellipse_at_top,_#4A1C59_0%,_#2A0E35_55%,_#1A0722_100%)] text-white border border-white/10 shadow-[0_24px_60px_-20px_rgba(26,7,34,0.55)]';
