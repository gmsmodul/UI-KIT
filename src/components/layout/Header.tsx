import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronRight,
  Bell,
  Search,
  CheckCheck,
  Download,
  Layers,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { PASTEL_THEMES } from '../../constants/theme';
import { getOrderedDirection } from '../ui/PageTransition';
import { UI_KIT_CATALOG } from '../uikit/uiKitCatalog';
import { getUiKitCategoryIcon } from '../uikit/uiKitIcons';

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
    <header className="relative z-30 h-16 px-4 sm:px-7 border-b border-black/[0.05] flex items-center justify-between gap-3 sm:gap-4 shrink-0 bg-white/80 backdrop-blur-sm no-print">
      <div className="relative flex items-center gap-3 min-w-0 flex-1 overflow-hidden">
        {/* Mobile Header Left: Clean Category Icon + Active Component Title (no breadcrumb, no photo) */}
        <div className="flex md:hidden items-center min-w-0 flex-1 relative">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={`mobile-header-${uiCategory}-${uiSubJump}`}
              initial={{ opacity: 0, x: direction * 14 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -12 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center gap-2 min-w-0 w-full"
            >
              <ActiveCategoryIcon className="w-[18px] h-[18px] text-[#ee2e65] shrink-0" />
              <h1 className="text-[17px] font-semibold tracking-tight text-[#1C1D21] truncate">
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
            className="inline-flex items-center gap-1.5 text-[#1C1D21] hover:text-[#ee2e65] font-bold tracking-tight shrink-0 transition-colors cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-[#ee2e65]" />
            <span>UI KIT</span>
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-[#B4B6C1] shrink-0" />
          <button
            type="button"
            onClick={() => selectUiNode(activeGroup.id)}
            className="text-[#6E717A] hover:text-[#1C1D21] font-medium truncate transition-colors cursor-pointer"
          >
            {activeGroup.label}
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-[#B4B6C1] shrink-0" />
          <div className="relative flex items-center min-w-0 overflow-hidden py-0.5">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={`desktop-crumb-${uiCategory}-${uiSubJump}`}
                initial={{ opacity: 0, y: direction * 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: direction * -8 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-center gap-1.5 font-semibold text-[#1C1D21] min-w-0"
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
        {/* UI KIT Updates Popover Trigger */}
        <div ref={notifWrapperRef} className="relative">
          <button
            onClick={() => setUpdatesOpen(!updatesOpen)}
            aria-label="UI KIT Updates"
            title="UI KIT Changelog & Updates"
            className={`w-9 h-9 rounded-full border flex items-center justify-center transition-colors relative cursor-pointer ${
              updatesOpen
                ? 'bg-[#FEF1F5] text-[#9D113C] border-[#FBC2D4]'
                : 'border-black/[0.07] text-[#1C1D21] hover:bg-[#F4F5F8]'
            }`}
          >
            <Bell className="w-4 h-4" />
            {unreadUiUpdatesCount > 0 && (
              <span className="min-w-[17px] h-[17px] px-1 rounded-full bg-[#ee2e65] text-white text-[10px] font-bold flex items-center justify-center absolute -top-1 -right-1 ring-2 ring-white tabular-nums">
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
                className="fixed sm:w-[380px] bg-white rounded-[24px] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.22)] border border-black/[0.08] p-4 z-[9999] space-y-3 animate-ui-pop"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-semibold text-[#1C1D21]">UI KIT Updates</span>
                    {unreadUiUpdatesCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-[#FEF1F5] text-[#9D113C] text-[10.5px] font-bold tabular-nums">
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
                <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg">
                  {(['All', 'Unread'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setUpdatesFilter(tab)}
                      className={`flex-1 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                        updatesFilter === tab
                          ? 'bg-white text-gray-900 shadow-2xs font-semibold'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Updates List */}
                <div className="max-h-[60vh] sm:max-h-72 overflow-y-auto space-y-2 pr-0.5 overscroll-contain">
                  {filteredUpdates.map((item) => {
                    const theme = PASTEL_THEMES[item.theme] || PASTEL_THEMES.periwinkle;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          handleUiUpdateClick(item);
                          setUpdatesOpen(false);
                        }}
                        className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 cursor-pointer ${
                          item.unread
                            ? `${theme.bg} border-black/[0.05]`
                            : 'bg-gray-50 border-gray-100 hover:bg-gray-100/70'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${item.unread ? theme.dot : 'bg-gray-300'}`} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold text-gray-900 truncate">{item.title}</span>
                            <span className="text-xs text-gray-400 shrink-0">{item.time}</span>
                          </div>
                          <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{item.desc}</p>
                          <span className="inline-block mt-1.5 text-xs font-semibold px-2 py-0.5 rounded-full bg-white text-gray-900 shadow-2xs">
                            Jump to {item.itemLabel} →
                          </span>
                        </div>
                      </button>
                    );
                  })}
                  {filteredUpdates.length === 0 && (
                    <div className="text-center py-8 text-xs text-gray-500">
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
          className="w-9 h-9 rounded-full border border-black/[0.07] flex items-center justify-center text-[#1C1D21] hover:bg-[#FEF1F5] hover:text-[#ee2e65] hover:border-[#FBC2D4] transition-colors cursor-pointer"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Export PDF Quick Action */}
        <button
          onClick={handlePrintPdf}
          title="Export Component Sheet PDF"
          aria-label="Export Component Sheet PDF"
          className="hidden sm:flex w-9 h-9 rounded-full border border-black/[0.07] items-center justify-center text-[#1C1D21] hover:bg-[#FEF1F5] hover:text-[#ee2e65] hover:border-[#FBC2D4] transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

