import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronRight,
  Bell,
  Search,
  CheckCheck,
  Download,
  Layers,
  Sun,
  Moon,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { PASTEL_THEMES } from '../../constants/theme';
import { getOrderedDirection } from '../ui/PageTransition';
import { UI_KIT_CATALOG } from '../uikit/uiKitCatalog';
import { getUiKitCategoryIcon } from '../uikit/uiKitIcons';
import { playUiMotionSound } from '../../utils/uiMotionSound';

const UI_KIT_ORDER = UI_KIT_CATALOG.flatMap((g) =>
  g.items.map((item) => `${g.id}::${item.label}`)
);

export const Header: React.FC = () => {
  const {
    uiCategory,
    prevUiCategory,
    uiSubJump,
    prevUiSubJump,
    selectUiNode,
    uiUpdates,
    unreadUiUpdatesCount,
    markAllUiUpdatesRead,
    handleUiUpdateClick,
    triggerUiSearchFocus,
    setIsUiMobileSearchOpen,
    triggerToast,
    theme,
    toggleTheme,
  } = useApp();

  const direction = getOrderedDirection(
    `${prevUiCategory}::${prevUiSubJump}`,
    `${uiCategory}::${uiSubJump}`,
    UI_KIT_ORDER
  );

  const [updatesOpen, setUpdatesOpen] = useState(false);
  const [updatesFilter, setUpdatesFilter] = useState<'All' | 'Unread'>('All');
  const [popoverCoords, setPopoverCoords] = useState<{
    top: number;
    right: number;
    isSm: boolean;
  }>({ top: 68, right: 16, isSm: false });
  const notifWrapperRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const updatePopoverPosition = useCallback(() => {
    const el = notifWrapperRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPopoverCoords({
      top: Math.round(rect.bottom + 8),
      right: Math.max(12, Math.round(window.innerWidth - rect.right)),
      isSm: window.innerWidth >= 640,
    });
  }, []);

  useEffect(() => {
    if (!updatesOpen) return;
    updatePopoverPosition();

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (
        notifWrapperRef.current &&
        !notifWrapperRef.current.contains(target) &&
        popoverRef.current &&
        !popoverRef.current.contains(target)
      ) {
        setUpdatesOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setUpdatesOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', updatePopoverPosition);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', updatePopoverPosition);
    };
  }, [updatesOpen, updatePopoverPosition]);

  const filteredUpdates = uiUpdates.filter(
    (u) => updatesFilter === 'All' || u.unread
  );

  const activeGroup = UI_KIT_CATALOG.find((g) => g.id === uiCategory) || UI_KIT_CATALOG[0];
  const ActiveCategoryIcon = getUiKitCategoryIcon(activeGroup.id);

  const handlePrintPdf = () => {
    triggerToast('Mencetak Komponen', `Menyiapkan cetak PDF untuk ${uiSubJump}...`, 'info');
    setTimeout(() => {
      window.print();
    }, 220);
  };

  const handleHeaderSearch = () => {
    if (window.innerWidth < 768) {
      setIsUiMobileSearchOpen(true);
    } else {
      triggerUiSearchFocus();
    }
  };

  return (
    <header className="relative z-30 h-16 px-4 sm:px-7 border-b border-black/[0.12] dark:border-white/[0.08] flex items-center justify-between gap-3 sm:gap-4 shrink-0 bg-white/80 dark:bg-[#121418]/90 backdrop-blur-sm no-print transition-colors duration-200">
      <div className="relative flex items-center gap-3 min-w-0 flex-1 overflow-hidden">
        {/* Mobile Header Left: Clean Category Icon + Active Component Title (no breadcrumb, no photo) */}
        <div className="flex md:hidden items-center min-w-0 flex-1 relative">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={`mobile-header-${uiCategory}-${uiSubJump}`}
              initial={{ opacity: 0, x: direction * 14, scale: 0.95, filter: 'blur(3px)' }}
              animate={{ opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: direction * -10, scale: 0.95, filter: 'blur(2px)' }}
              transition={{
                x: { type: 'spring', stiffness: 420, damping: 28, mass: 0.8 },
                scale: { type: 'spring', stiffness: 420, damping: 26 },
                opacity: { duration: 0.18, ease: [0.23, 1, 0.32, 1] },
                filter: { duration: 0.2, ease: [0.23, 1, 0.32, 1] },
              }}
              className="flex items-center gap-2 min-w-0 w-full"
            >
              <ActiveCategoryIcon className="w-[18px] h-[18px] text-[#ee2e65] shrink-0" />
              <h1 className="text-[17px] font-semibold tracking-tight text-[#1C1D21] dark:text-[#F3F4F6] truncate">
                {uiSubJump}
              </h1>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Tablet & PC Breadcrumbs: UI KIT > Category > Component */}
        <nav className="hidden md:flex items-center gap-2 text-[13px] min-w-0">
          <button
            type="button"
            onClick={() => selectUiNode('utilities', 'Grid')}
            className="inline-flex items-center gap-1.5 text-[#1C1D21] dark:text-[#F3F4F6] hover:text-[#ee2e65] font-bold tracking-tight shrink-0 transition-colors cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-[#ee2e65]" />
            <span>UI KIT</span>
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-[#5A5D67] dark:text-gray-500 shrink-0" />
          <button
            type="button"
            onClick={() => selectUiNode(activeGroup.id)}
            className="text-[#5A5D67] dark:text-gray-400 hover:text-[#1C1D21] dark:hover:text-white font-medium truncate transition-colors cursor-pointer"
          >
            {activeGroup.label}
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-[#5A5D67] dark:text-gray-500 shrink-0" />
          <div className="relative flex items-center min-w-0 overflow-hidden py-0.5">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={`desktop-crumb-${uiCategory}-${uiSubJump}`}
                initial={{ opacity: 0, y: direction * 8, scale: 0.95, filter: 'blur(3px)' }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: direction * -8, scale: 0.95, filter: 'blur(2px)' }}
                transition={{
                  y: { type: 'spring', stiffness: 420, damping: 28, mass: 0.8 },
                  scale: { type: 'spring', stiffness: 420, damping: 26 },
                  opacity: { duration: 0.18, ease: [0.23, 1, 0.32, 1] },
                  filter: { duration: 0.2, ease: [0.23, 1, 0.32, 1] },
                }}
                className="flex items-center gap-1.5 font-semibold text-[#1C1D21] dark:text-[#F3F4F6] min-w-0"
              >
                <ActiveCategoryIcon className="w-4 h-4 text-[#ee2e65] shrink-0" />
                <span className="truncate">{uiSubJump}</span>
              </motion.div>
            </AnimatePresence>
          </div>
        </nav>
      </div>

      {/* Top Right UI KIT Utility Icons */}
      <div className="flex items-center gap-2 sm:gap-2.5 relative shrink-0">
        {/* Theme Toggle Button (placed immediately to the left of the Notification button) */}
        <button
          type="button"
          onClick={() => {
            playUiMotionSound('pop');
            toggleTheme();
          }}
          aria-label={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          title={theme === 'dark' ? 'Tema Terang (Light)' : 'Tema Gelap (Dark)'}
          className={`w-9 h-9 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
            theme === 'dark'
              ? 'bg-[#1B1E24] border-white/[0.14] text-[#C6F135] hover:bg-[#232730]'
              : 'border-black/[0.14] text-[#1C1D21] hover:bg-[#F4F5F8]'
          }`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* UI KIT Updates Popover Trigger */}
        <div ref={notifWrapperRef} className="relative">
          <button
            onClick={() =>
              setUpdatesOpen((prev) => {
                playUiMotionSound(!prev ? 'pop' : 'tick');
                return !prev;
              })
            }
            aria-label="UI KIT Updates"
            title="UI KIT Changelog & Updates"
            className={`w-9 h-9 rounded-full border flex items-center justify-center transition-colors relative cursor-pointer ${
              updatesOpen
                ? 'bg-[#FEF1F5] dark:bg-[#ee2e65]/20 text-[#9D113C] dark:text-[#f895b5] border-[#FBC2D4] dark:border-[#ee2e65]/40'
                : 'border-black/[0.14] dark:border-white/[0.12] text-[#1C1D21] dark:text-gray-200 hover:bg-[#F4F5F8] dark:hover:bg-[#1B1E24]'
            }`}
          >
            <Bell className="w-4 h-4" />
            {unreadUiUpdatesCount > 0 && (
              <span className="min-w-[17px] h-[17px] px-1 rounded-full bg-[#ee2e65] text-white text-[10px] font-bold flex items-center justify-center absolute -top-1 -right-1 ring-2 ring-white dark:ring-[#121418] tabular-nums">
                {unreadUiUpdatesCount}
              </span>
            )}
          </button>

          {updatesOpen &&
            createPortal(
              <div
                ref={popoverRef}
                data-no-pull="true"
                style={{
                  top: popoverCoords.top,
                  right: popoverCoords.isSm ? popoverCoords.right : 12,
                  left: popoverCoords.isSm ? undefined : 12,
                }}
                className="fixed sm:w-[380px] bg-white dark:bg-[#15181E] rounded-[24px] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.22)] dark:shadow-[0_24px_56px_-12px_rgba(0,0,0,0.65)] border border-black/[0.14] dark:border-white/[0.10] p-4 z-[9999] space-y-3 animate-ui-pop"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-semibold text-[#1C1D21] dark:text-gray-100">UI KIT Updates</span>
                    {unreadUiUpdatesCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-[#FEF1F5] dark:bg-[#ee2e65]/20 text-[#9D113C] dark:text-[#f895b5] text-[10.5px] font-bold tabular-nums">
                        {unreadUiUpdatesCount} New
                      </span>
                    )}
                  </div>
                  <button
                    onClick={markAllUiUpdatesRead}
                    className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#ee2e65] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5 sm:hidden shrink-0" />
                    <span className="sm:hidden">Read</span>
                    <span className="hidden sm:inline">Mark all read</span>
                  </button>
                </div>

                {/* Segmented Filter Control */}
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-[#1B1E24] p-0.5 rounded-lg">
                  {(['All', 'Unread'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setUpdatesFilter(tab)}
                      className={`flex-1 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                        updatesFilter === tab
                          ? 'bg-white dark:bg-[#121418] text-gray-900 dark:text-gray-100 shadow-2xs'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Updates List */}
                <div className="max-h-[60vh] sm:max-h-72 overflow-y-auto space-y-2 pr-0.5 overscroll-contain">
                  {filteredUpdates.map((item) => {
                    const themeCfg = PASTEL_THEMES[item.theme] || PASTEL_THEMES.periwinkle;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          handleUiUpdateClick(item);
                          setUpdatesOpen(false);
                        }}
                        className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 cursor-pointer ${
                          item.unread
                            ? `${themeCfg.bg} dark:bg-[#1B1E24] border-black/[0.12] dark:border-white/[0.10]`
                            : 'bg-gray-50 dark:bg-[#121418] border-gray-300 dark:border-white/[0.08] hover:bg-gray-100/70 dark:hover:bg-[#1B1E24]'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${item.unread ? themeCfg.dot : 'bg-gray-400'}`} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{item.title}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">{item.time}</span>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">{item.desc}</p>
                          <span className="inline-block mt-1.5 text-xs font-semibold px-2 py-0.5 rounded-full bg-white dark:bg-[#121418] text-gray-900 dark:text-gray-200 shadow-2xs dark:border dark:border-white/[0.08]">
                            Jump to {item.itemLabel} →
                          </span>
                        </div>
                      </button>
                    );
                  })}
                  {filteredUpdates.length === 0 && (
                    <div className="text-center py-8 text-xs text-gray-500 dark:text-gray-400">
                      All UI KIT updates have been reviewed.
                    </div>
                  )}
                </div>
              </div>,
              document.body
            )}
        </div>

        {/* Search Trigger (Desktop focuses UI search bar; Mobile opens UI Search Bottom Sheet) */}
        <button
          onClick={handleHeaderSearch}
          title="Search UI KIT Components (/)"
          aria-label="Search UI KIT Components"
          className="w-9 h-9 rounded-full border border-black/[0.14] dark:border-white/[0.12] flex items-center justify-center text-[#1C1D21] dark:text-gray-200 hover:bg-[#FEF1F5] dark:hover:bg-[#1B1E24] hover:text-[#ee2e65] dark:hover:text-[#ee2e65] hover:border-[#FBC2D4] dark:hover:border-[#ee2e65]/50 transition-colors cursor-pointer"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Export PDF Quick Action */}
        <button
          onClick={handlePrintPdf}
          title="Export Component Sheet PDF"
          aria-label="Export Component Sheet PDF"
          className="hidden sm:flex w-9 h-9 rounded-full border border-black/[0.14] dark:border-white/[0.12] items-center justify-center text-[#1C1D21] dark:text-gray-200 hover:bg-[#FEF1F5] dark:hover:bg-[#1B1E24] hover:text-[#ee2e65] dark:hover:text-[#ee2e65] hover:border-[#FBC2D4] dark:hover:border-[#ee2e65]/50 transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

