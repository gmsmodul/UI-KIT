import React, { useState, useRef, useLayoutEffect, useEffect, useMemo } from 'react';
import {
  LayoutGrid,
  SlidersHorizontal,
  Smartphone,
  ChevronsUpDown,
  Search,
  Bell,
  ArrowLeft,
  X,
  ChevronRight,
  CheckCheck,
  Clock,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PASTEL_THEMES } from '../../constants/theme';
import { useBottomSheetMotion } from '../../hooks/useBottomSheetMotion';
import { UI_KIT_CATALOG, UiKitSubSection } from '../uikit/uiKitCatalog';
import { getUiKitCategoryIcon } from '../uikit/uiKitIcons';
import { playUiMotionSound } from '../../utils/uiMotionSound';
import { UiSkeletonSearchPanel } from '../ui/UiSkeleton';
import {
  RecentSearchEntry,
  UI_SUGGESTION_SEARCHES,
  loadRecentSearches,
  saveRecentSearch,
  removeRecentSearch,
  clearRecentSearches,
} from '../../utils/uiSearchHistory';

interface MobileSearchEntry {
  key: string;
  groupId: string;
  groupLabel: string;
  itemLabel: string;
  section?: UiKitSubSection;
  score: number;
}

export const MobileBottomNav: React.FC = () => {
  const {
    uiCategory,
    selectUiNode,
    uiUpdates,
    unreadUiUpdatesCount,
    markAllUiUpdatesRead,
    handleUiUpdateClick,
    isUiMobileSearchOpen,
    setIsUiMobileSearchOpen,
  } = useApp();

  const [menuOpen, setMenuOpen] = useState(false);
  const [menuClosing, setMenuClosing] = useState(false);
  const [menuSubview, setMenuSubview] = useState<'nav' | 'updates'>('nav');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileSearchLoading, setIsMobileSearchLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<RecentSearchEntry[]>(() =>
    loadRecentSearches()
  );

  const menuCloseTimerRef = useRef<number | null>(null);
  const drawerNavScrollRef = useRef<HTMLDivElement>(null);
  const pillBarRef = useRef<HTMLDivElement>(null);
  const slotRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0, ready: false });
  const [drawerPeekHeight, setDrawerPeekHeight] = useState<number | null>(null);

  const openMenuSmoothly = () => {
    if (menuCloseTimerRef.current) {
      window.clearTimeout(menuCloseTimerRef.current);
      menuCloseTimerRef.current = null;
    }
    playUiMotionSound('pop');
    setMenuClosing(false);
    setMenuOpen(true);
  };

  const closeMenuSmoothly = () => {
    if (!menuOpen || menuClosing) return;
    playUiMotionSound('tick');
    setMenuClosing(true);
    menuCloseTimerRef.current = window.setTimeout(() => {
      setMenuOpen(false);
      setMenuClosing(false);
      menuCloseTimerRef.current = null;
    }, 200);
  };

  useEffect(() => {
    return () => {
      if (menuCloseTimerRef.current) window.clearTimeout(menuCloseTimerRef.current);
    };
  }, []);

  const {
    setSheetElement: setSearchSheetEl,
    backdropRef: searchBackdropRef,
    animateClose: animateCloseSearch,
    sheetGestureProps: searchGestureProps,
  } = useBottomSheetMotion({
    onClose: () => {
      setIsUiMobileSearchOpen(false);
      setSearchQuery('');
    },
  });

  // Top 3 primary UI KIT dock slots + 4th slot as category overflow switcher
  const primarySlots: Array<{
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    dot?: boolean;
  }> = [
    { id: 'utilities', label: 'Utilities', icon: LayoutGrid },
    { id: 'dataentry', label: 'Data Entry', icon: SlidersHorizontal },
    { id: 'mobilekit', label: 'Mobile UI Kit', icon: Smartphone, dot: unreadUiUpdatesCount > 0 },
  ];

  const primaryIds = new Set(primarySlots.map((s) => s.id));
  const popupCategories = UI_KIT_CATALOG.filter((g) => !primaryIds.has(g.id));
  const isOverflowActive = !primaryIds.has(uiCategory);
  const activeOverflowGroup = isOverflowActive
    ? UI_KIT_CATALOG.find((g) => g.id === uiCategory)
    : undefined;

  // Which of the 4 dock slots (0..3) is currently active
  const activeSlotIndex = isOverflowActive
    ? 3
    : primarySlots.findIndex((s) => s.id === uiCategory);

  useLayoutEffect(() => {
    const updateIndicator = () => {
      const bar = pillBarRef.current;
      const btn = slotRefs.current[activeSlotIndex];
      if (!bar || !btn) return;
      const barRect = bar.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      if (btnRect.width === 0) return;
      setIndicator({
        left: btnRect.left - barRect.left,
        width: btnRect.width,
        ready: true,
      });
    };

    updateIndicator();
    const bar = pillBarRef.current;
    const ro = typeof ResizeObserver !== 'undefined' && bar ? new ResizeObserver(updateIndicator) : null;
    if (ro && bar) ro.observe(bar);
    window.addEventListener('resize', updateIndicator);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', updateIndicator);
    };
  }, [activeSlotIndex, uiCategory, menuOpen]);

  useEffect(() => {
    if (!menuOpen) {
      setMenuSubview('nav');
      setDrawerPeekHeight(null);
    }
  }, [menuOpen]);

  useLayoutEffect(() => {
    if (!menuOpen || menuSubview !== 'nav') {
      setDrawerPeekHeight(null);
      return;
    }

    const computeDrawerPeek = () => {
      const scroller = drawerNavScrollRef.current;
      if (!scroller) return;

      const capHeight = Math.max(180, window.innerHeight - 156);
      if (scroller.scrollHeight <= capHeight + 2) {
        setDrawerPeekHeight((prev) => (prev !== null ? null : prev));
        return;
      }

      const items = Array.from(
        scroller.querySelectorAll<HTMLElement>('[data-drawer-item="true"]')
      );
      let targetMid: number | null = null;
      for (const item of items) {
        const midInContent = item.offsetTop + item.offsetHeight * 0.5;
        if (midInContent <= capHeight) {
          targetMid = Math.round(midInContent);
        } else {
          break;
        }
      }

      setDrawerPeekHeight((prev) => (prev !== targetMid ? targetMid : prev));
    };

    computeDrawerPeek();
    const scroller = drawerNavScrollRef.current;
    const ro =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(computeDrawerPeek) : null;
    if (ro && scroller) ro.observe(scroller);
    window.addEventListener('resize', computeDrawerPeek);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', computeDrawerPeek);
    };
  }, [menuOpen, menuSubview]);

  useEffect(() => {
    if (isUiMobileSearchOpen) {
      setRecentSearches(loadRecentSearches());
      const id = window.setTimeout(() => searchInputRef.current?.focus(), 140);
      return () => window.clearTimeout(id);
    }
  }, [isUiMobileSearchOpen]);

  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setIsMobileSearchLoading(false);
      return;
    }
    setIsMobileSearchLoading(true);
    const timer = window.setTimeout(() => {
      setIsMobileSearchLoading(false);
    }, 180);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenuSmoothly();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [menuOpen, menuClosing]);

  const handleSelectCategory = (groupId: string, subLabel?: string, sectionId?: string) => {
    selectUiNode(groupId, subLabel, sectionId);
    closeMenuSmoothly();
  };

  // Search across all 12 UI_KIT_CATALOG categories, components, sub-sections & keywords
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const matchedGroups = UI_KIT_CATALOG.filter(
      (g) => !q || g.label.toLowerCase().includes(q) || g.categoryTitle.toLowerCase().includes(q)
    ).slice(0, q ? 4 : 5);

    const matchedElements: MobileSearchEntry[] = [];
    if (q) {
      UI_KIT_CATALOG.forEach((group) => {
        group.items.forEach((item) => {
          const itemLower = item.label.toLowerCase();
          const kwMatch = item.keywords?.some((k) => k.toLowerCase().includes(q));
          const exactItem = itemLower === q;
          const prefixItem = itemLower.startsWith(q);
          const containsItem = itemLower.includes(q);

          if (exactItem || prefixItem || containsItem || kwMatch) {
            matchedElements.push({
              key: `${group.id}::${item.label}`,
              groupId: group.id,
              groupLabel: group.label,
              itemLabel: item.label,
              score: exactItem ? 100 : prefixItem ? 85 : containsItem ? 70 : 50,
            });
          }

          (item.sections ?? []).forEach((sec) => {
            const secLower = sec.title.toLowerCase();
            if (secLower.includes(q)) {
              matchedElements.push({
                key: `${group.id}::${item.label}::${sec.id}`,
                groupId: group.id,
                groupLabel: group.label,
                itemLabel: item.label,
                section: sec,
                score: secLower === q ? 98 : secLower.startsWith(q) ? 80 : 65,
              });
            }
          });
        });
      });
    }

    return {
      matchedGroups,
      matchedElements: matchedElements.sort((a, b) => b.score - a.score).slice(0, 10),
    };
  }, [searchQuery]);

  const ActiveOverflowIcon = activeOverflowGroup
    ? getUiKitCategoryIcon(activeOverflowGroup.id)
    : undefined;

  return (
    <>
      {/* Backdrop + Floating Vertical UI KIT Drawer (outside click auto-closes with fold-down) */}
      {menuOpen && (
        <div
          onClick={closeMenuSmoothly}
          className={`${
            menuClosing ? 'animate-ui-fade-out' : 'animate-ui-fade'
          } fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] md:hidden no-print`}
        >
          <div className="fixed bottom-[calc(4.25rem+env(safe-area-inset-bottom,0px))] inset-x-4 max-w-[352px] mx-auto pointer-events-none">
            <div
              onClick={(e) => e.stopPropagation()}
              className={`${
                menuClosing ? 'animate-menu-fold-down' : 'animate-menu-fold-up'
              } pointer-events-auto w-[min(280px,100%)] max-h-[calc(100vh-92px)] bg-white dark:bg-[#15181E] rounded-[24px] shadow-[0_20px_48px_-12px_rgba(15,23,42,0.28)] dark:shadow-[0_24px_56px_-12px_rgba(0,0,0,0.75)] border border-black/[0.14] dark:border-white/[0.12] flex flex-col overflow-hidden`}
            >
              {/* Top UI KIT Brand Header */}
              <div className="px-3.5 pt-3 pb-2.5 border-b border-black/[0.12] dark:border-white/[0.08] flex items-center justify-between gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleSelectCategory('utilities', 'Grid')}
                  className="flex items-center gap-2 min-w-0 text-left cursor-pointer group"
                >
                  <div className="w-7 h-7 rounded-full bg-[#ee2e65] text-white text-[10px] font-bold flex items-center justify-center shrink-0 shadow-xs">
                    UI
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-[#1C1D21] dark:text-[#F3F4F6] truncate group-hover:text-[#ee2e65] transition-colors">
                      UI KIT
                    </div>
                    <div className="text-[10px] text-[#646772] dark:text-gray-400 leading-tight">
                      Design System
                    </div>
                  </div>
                </button>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    title="UI KIT Updates"
                    onClick={() =>
                      setMenuSubview((prev) => (prev === 'updates' ? 'nav' : 'updates'))
                    }
                    className={`w-7 h-7 rounded-full flex items-center justify-center relative transition-colors cursor-pointer ${
                      menuSubview === 'updates'
                        ? 'bg-[#FEF1F5] dark:bg-[#ee2e65]/20 text-[#ee2e65]'
                        : 'hover:bg-[#F4F5F8] dark:hover:bg-[#1B1E24] text-[#4B4E57] dark:text-gray-300'
                    }`}
                  >
                    <Bell className="w-3.5 h-3.5" />
                    {unreadUiUpdatesCount > 0 && (
                      <span className="w-2 h-2 rounded-full bg-[#ee2e65] absolute top-1 right-1 ring-1 ring-white dark:ring-[#15181E]" />
                    )}
                  </button>
                  <button
                    type="button"
                    title="Mobile UI Kit"
                    onClick={() => handleSelectCategory('mobilekit', 'Mobile Header')}
                    className="w-7 h-7 rounded-full bg-[#ee2e65] text-white flex items-center justify-center hover:brightness-105 shadow-xs transition-all cursor-pointer"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Subview: UI KIT Categories List */}
              {menuSubview === 'nav' && (
                <div
                  ref={drawerNavScrollRef}
                  style={
                    drawerPeekHeight !== null
                      ? { maxHeight: `${drawerPeekHeight}px` }
                      : { maxHeight: 'calc(100vh - 156px)' }
                  }
                  className="relative overflow-y-auto overflow-x-hidden no-scrollbar px-2 pt-2 overscroll-contain"
                >
                  <div className="space-y-0.5 pb-2">
                    {popupCategories.map((group) => {
                      const Icon = getUiKitCategoryIcon(group.id);
                      const isCurrent = uiCategory === group.id;
                      return (
                        <button
                          key={group.id}
                          type="button"
                          data-drawer-item="true"
                          onClick={() => handleSelectCategory(group.id)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-full text-left font-semibold transition-colors duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] cursor-pointer ${
                            isCurrent
                              ? 'bg-[#ee2e65] text-white shadow-[0_6px_16px_-6px_rgba(238,46,101,0.55)]'
                              : 'text-[#1C1D21] dark:text-gray-200 hover:bg-[#F4F5F8] dark:hover:bg-[#1B1E24]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Icon
                              className={`w-4 h-4 shrink-0 ${
                                isCurrent ? 'text-white stroke-[2.2px]' : 'text-[#1C1D21] dark:text-gray-300 stroke-[1.8px]'
                              }`}
                            />
                            <span className="text-[13px] truncate">{group.label}</span>
                          </div>

                          <span
                            className={`min-w-[22px] h-[20px] px-1.5 rounded-full text-[10.5px] font-bold flex items-center justify-center shrink-0 tabular-nums ${
                              isCurrent
                                ? 'bg-white text-[#ee2e65]'
                                : 'bg-gray-100 dark:bg-[#1B1E24] text-gray-600 dark:text-gray-300'
                            }`}
                          >
                            {group.items.length}
                          </span>
                        </button>
                      );
                    })}

                    <div className="my-1 border-t border-black/[0.12] dark:border-white/[0.08] mx-2" />
                    <button
                      type="button"
                      data-drawer-item="true"
                      onClick={() => setMenuSubview('updates')}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-full text-left text-[#1C1D21] dark:text-gray-200 hover:bg-[#F4F5F8] dark:hover:bg-[#1B1E24] font-semibold transition-all duration-200 cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Bell className="w-4 h-4 shrink-0 text-[#1C1D21] dark:text-gray-300 stroke-[1.8px]" />
                        <span className="text-[13px] truncate">UI KIT Updates</span>
                      </div>
                      {unreadUiUpdatesCount > 0 && (
                        <span className="min-w-[22px] h-[20px] px-1.5 rounded-full bg-[#ee2e65] text-white text-[10.5px] font-bold flex items-center justify-center shrink-0 tabular-nums">
                          {unreadUiUpdatesCount}
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Subview: UI KIT Updates Drawer View */}
              {menuSubview === 'updates' && (
                <div className="overflow-y-auto overflow-x-hidden no-scrollbar p-3 space-y-2.5 overscroll-contain">
                  <div className="flex items-center justify-between px-1">
                    <button
                      type="button"
                      onClick={() => setMenuSubview('nav')}
                      className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#1C1D21] dark:text-gray-200 hover:text-[#ee2e65] whitespace-nowrap cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
                      <span>Back</span>
                    </button>
                    {unreadUiUpdatesCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllUiUpdatesRead}
                        className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#ee2e65] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <CheckCheck className="w-3.5 h-3.5 shrink-0" />
                        <span>Read</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    {uiUpdates.map((item) => {
                      const theme = PASTEL_THEMES[item.theme] || PASTEL_THEMES.periwinkle;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            handleUiUpdateClick(item);
                            closeMenuSmoothly();
                          }}
                          className={`w-full text-left p-3 rounded-2xl border transition-all flex items-start gap-2.5 cursor-pointer ${
                            item.unread
                              ? `${theme.bg} dark:bg-[#1B1E24] border-black/[0.12] dark:border-white/[0.10]`
                              : 'bg-[#FAFBFD] dark:bg-[#121418] border-black/[0.12] dark:border-white/[0.08] hover:bg-gray-100/70 dark:hover:bg-[#1B1E24]'
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                              item.unread ? theme.dot : 'bg-gray-400 dark:bg-gray-600'
                            }`}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[12.5px] font-semibold text-[#1C1D21] dark:text-gray-100 truncate">
                                {item.title}
                              </span>
                              <span className="text-[10.5px] text-[#646772] dark:text-gray-400 shrink-0">
                                {item.time}
                              </span>
                            </div>
                            <p className="text-[11.5px] text-[#5A5D67] dark:text-gray-400 mt-0.5 line-clamp-2">
                              {item.desc}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Compact One-Handed Floating Bottom Navigation Bar + Detached Search Button */}
      <div className="fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom,0px))] inset-x-4 max-w-[352px] mx-auto z-40 md:hidden flex items-center gap-2 no-print">
        {/* Main Floating Pill Dock */}
        <nav
          ref={pillBarRef}
          aria-label="UI KIT mobile navigation"
          className="relative flex-1 bg-white/95 dark:bg-[#15181E]/95 backdrop-blur-md rounded-full p-1 shadow-[0_10px_28px_-8px_rgba(15,23,42,0.18)] dark:shadow-[0_14px_36px_-8px_rgba(0,0,0,0.75)] border border-black/[0.14] dark:border-white/[0.12] flex items-center justify-between"
        >
          {/* Gliding Brand-Primary Active Pill */}
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute top-1 bottom-1 left-0 rounded-full bg-[#ee2e65] shadow-[0_5px_14px_-4px_rgba(238,46,101,0.55)] transition-[transform,width,opacity] duration-[240ms] ease-[cubic-bezier(0.23,1,0.32,1)] ${
              indicator.ready ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              width: `${indicator.width}px`,
              transform: `translate3d(${indicator.left}px, 0, 0)`,
            }}
          />

          {primarySlots.map((slot, index) => {
            const Icon = slot.icon;
            const isActive = activeSlotIndex === index;
            return (
              <button
                key={slot.id}
                ref={(el) => {
                  slotRefs.current[index] = el;
                }}
                type="button"
                aria-label={slot.label}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => {
                  selectUiNode(slot.id);
                  closeMenuSmoothly();
                }}
                className={`relative z-10 flex-1 h-10 rounded-full flex items-center justify-center transition-colors duration-200 cursor-pointer ${
                  isActive ? 'text-white' : 'text-[#1C1D21] dark:text-gray-300 hover:text-[#ee2e65]'
                }`}
              >
                <div className="relative flex items-center justify-center">
                  <Icon className={`w-[18px] h-[18px] ${isActive ? 'stroke-[2.2px]' : 'stroke-[1.9px]'}`} />
                  {slot.dot && (
                    <span
                      className={`w-2 h-2 rounded-full absolute -top-0.5 -right-1 ring-[1.5px] ${
                        isActive ? 'bg-white ring-[#ee2e65]' : 'bg-[#ee2e65] ring-white dark:ring-[#15181E]'
                      }`}
                    />
                  )}
                </div>
              </button>
            );
          })}

          {/* Slot 4: Category Overflow Menu Trigger */}
          <button
            ref={(el) => {
              slotRefs.current[3] = el;
            }}
            type="button"
            aria-label="Open UI KIT categories"
            aria-expanded={menuOpen && !menuClosing}
            onClick={() => (menuOpen && !menuClosing ? closeMenuSmoothly() : openMenuSmoothly())}
            className={`relative z-10 flex-1 h-10 rounded-full flex items-center justify-center gap-1 transition-colors duration-200 cursor-pointer ${
              isOverflowActive ? 'text-white' : 'text-[#1C1D21] dark:text-gray-300 hover:text-[#ee2e65]'
            }`}
          >
            {isOverflowActive && ActiveOverflowIcon && (
              <ActiveOverflowIcon className="w-[17px] h-[17px] stroke-[2.1px] shrink-0" />
            )}
            <ChevronsUpDown
              className={`w-[15px] h-[15px] stroke-[2.1px] shrink-0 transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] ${
                menuOpen && !menuClosing ? 'scale-110' : ''
              }`}
            />
          </button>
        </nav>

        {/* Separate Floating Circular Search Button */}
        <button
          type="button"
          aria-label="Search UI KIT elements"
          onClick={() => {
            closeMenuSmoothly();
            setIsUiMobileSearchOpen(true);
          }}
          className={`w-12 h-12 shrink-0 rounded-full backdrop-blur-md shadow-[0_10px_28px_-8px_rgba(15,23,42,0.18)] dark:shadow-[0_14px_36px_-8px_rgba(0,0,0,0.75)] border flex items-center justify-center transition-all duration-200 active:scale-95 cursor-pointer ${
            isUiMobileSearchOpen
              ? 'bg-[#ee2e65] text-white border-[#ee2e65]'
              : 'bg-white/95 dark:bg-[#15181E]/95 text-[#1C1D21] dark:text-gray-200 border-black/[0.14] dark:border-white/[0.12] hover:text-[#ee2e65]'
          }`}
        >
          <Search className="w-[18px] h-[18px] stroke-[2px]" />
        </button>
      </div>

      {/* Mobile UI KIT Search Sheet */}
      {isUiMobileSearchOpen && (
        <div
          ref={searchBackdropRef}
          data-modal-sheet-backdrop="true"
          className="animate-ui-fade fixed inset-0 z-50 bg-black/35 dark:bg-black/60 backdrop-blur-xs flex items-end justify-center md:hidden no-print"
        >
          <div
            ref={setSearchSheetEl}
            {...searchGestureProps}
            className="w-full bg-white dark:bg-[#121418] rounded-t-[28px] p-5 pb-[calc(1.75rem+env(safe-area-inset-bottom,0px))] space-y-4 shadow-2xl border-t border-transparent dark:border-white/[0.10] max-h-[82vh] flex flex-col animate-bottom-sheet"
          >
            <div
              data-sheet-handle="true"
              className="flex justify-center py-2 -mt-3 -mb-1 cursor-grab active:cursor-grabbing touch-none shrink-0"
            >
              <div className="w-10 h-1 bg-black/20 dark:bg-white/25 rounded-full animate-sheet-handle" />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="flex-1 flex items-center gap-2.5 bg-[#F4F5F8] dark:bg-[#1B1E24] rounded-full px-4 py-2.5 border border-black/[0.14] dark:border-white/[0.12] focus-within:border-[#ee2e65] focus-within:bg-white dark:focus-within:bg-[#181B21] transition-colors">
                <Search className="w-4 h-4 text-[#646772] dark:text-gray-400 shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  enterKeyHint="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari kategori, komponen, atau token UI..."
                  className="w-full bg-transparent text-base sm:text-[13.5px] text-[#1C1D21] dark:text-gray-100 placeholder:text-[#646772] dark:placeholder:text-gray-500 outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-[#646772] dark:text-gray-400 hover:text-[#1C1D21] dark:hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <button
                type="button"
                aria-label="Close search"
                onClick={animateCloseSearch}
                className="w-9 h-9 rounded-full hover:bg-[#F4F5F8] dark:hover:bg-[#1B1E24] flex items-center justify-center text-[#5A5D67] dark:text-gray-400 shrink-0 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto overscroll-contain space-y-4 pr-0.5">
              {!searchQuery.trim() ? (
                <>
                  {/* Recent Search */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between px-1">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#646772] dark:text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span>Pencarian Terakhir</span>
                      </span>
                      {recentSearches.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setRecentSearches(clearRecentSearches())}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#ee2e65] cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Hapus</span>
                        </button>
                      )}
                    </div>

                    {recentSearches.length === 0 ? (
                      <div className="px-3.5 py-2.5 rounded-2xl bg-[#FAFBFD] dark:bg-[#1B1E24] border border-dashed border-black/[0.12] dark:border-white/[0.10] text-[12px] text-[#646772] dark:text-gray-400">
                        Belum ada riwayat pencarian. Pilih saran atau kategori di bawah.
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {recentSearches.map((rec) => (
                          <div
                            key={rec.id}
                            className="flex items-center justify-between gap-1.5 rounded-2xl bg-[#FAFBFD] dark:bg-[#1B1E24] border border-black/[0.10] dark:border-white/[0.08] pr-1.5"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                if (rec.groupId && rec.itemLabel) {
                                  setRecentSearches(
                                    saveRecentSearch({
                                      query: rec.query,
                                      groupId: rec.groupId,
                                      groupLabel: rec.groupLabel,
                                      itemLabel: rec.itemLabel,
                                      sectionId: rec.sectionId,
                                      sectionTitle: rec.sectionTitle,
                                    })
                                  );
                                  selectUiNode(rec.groupId, rec.itemLabel, rec.sectionId);
                                  animateCloseSearch();
                                } else {
                                  setSearchQuery(rec.query);
                                }
                              }}
                              className="flex-1 min-w-0 flex items-center gap-2.5 px-3.5 py-2.5 text-left cursor-pointer"
                            >
                              <Clock className="w-4 h-4 text-[#646772] dark:text-gray-400 shrink-0" />
                              <div className="min-w-0 flex-1">
                                <div className="text-[13px] font-semibold text-[#1C1D21] dark:text-gray-100 truncate">
                                  {rec.query}
                                </div>
                                {(rec.groupLabel || rec.itemLabel) && (
                                  <div className="text-[11px] text-[#646772] dark:text-gray-400 truncate">
                                    {[rec.groupLabel, rec.itemLabel, rec.sectionTitle]
                                      .filter(Boolean)
                                      .join(' · ')}
                                  </div>
                                )}
                              </div>
                            </button>
                            <button
                              type="button"
                              aria-label={`Hapus riwayat ${rec.query}`}
                              onClick={() => setRecentSearches(removeRecentSearch(rec.id))}
                              className="w-8 h-8 rounded-full flex items-center justify-center text-[#646772] dark:text-gray-400 hover:bg-gray-200/70 dark:hover:bg-white/[0.08] shrink-0 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Suggestion Search */}
                  <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#646772] dark:text-gray-400 px-1">
                      <Sparkles className="w-3 h-3 text-[#ee2e65]" />
                      <span>Saran Pencarian</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {UI_SUGGESTION_SEARCHES.map((sug) => (
                        <button
                          key={sug.id}
                          type="button"
                          onClick={() => {
                            setRecentSearches(
                              saveRecentSearch({
                                query: sug.label,
                                groupId: sug.groupId,
                                groupLabel: sug.hint.split(' · ')[0],
                                itemLabel: sug.itemLabel,
                                sectionId: sug.sectionId,
                              })
                            );
                            selectUiNode(sug.groupId, sug.itemLabel, sug.sectionId);
                            animateCloseSearch();
                          }}
                          className="px-3 py-1.5 rounded-full bg-[#FAFBFD] dark:bg-[#1B1E24] hover:bg-[#FEF1F5] dark:hover:bg-[#ee2e65]/15 border border-black/[0.10] dark:border-white/[0.10] hover:border-[#FBC2D4] dark:hover:border-[#ee2e65]/40 text-[12px] font-semibold text-[#1C1D21] dark:text-gray-200 hover:text-[#9D113C] dark:hover:text-[#fbc2d4] transition-colors cursor-pointer"
                        >
                          {sug.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : isMobileSearchLoading ? (
                <UiSkeletonSearchPanel mode="results" variant="sheet" rows={4} />
              ) : null}

              {/* Matched UI KIT Elements */}
              {!isMobileSearchLoading && searchResults.matchedElements.length > 0 && (
                <div className="space-y-1.5 animate-ui-fade">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#646772] dark:text-gray-400 px-1">
                    Komponen & Bagian
                  </div>
                  <div className="space-y-1">
                    {searchResults.matchedElements.map((res) => (
                      <button
                        key={res.key}
                        type="button"
                        onClick={() => {
                          setRecentSearches(
                            saveRecentSearch({
                              query: searchQuery.trim() || (res.section ? res.section.title : res.itemLabel),
                              groupId: res.groupId,
                              groupLabel: res.groupLabel,
                              itemLabel: res.itemLabel,
                              sectionId: res.section?.id,
                              sectionTitle: res.section?.title,
                            })
                          );
                          selectUiNode(res.groupId, res.itemLabel, res.section?.id);
                          animateCloseSearch();
                        }}
                        className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-[#FAFBFD] dark:bg-[#1B1E24] hover:bg-[#FEF1F5] dark:hover:bg-[#232730] border border-black/[0.10] dark:border-white/[0.08] text-left transition-colors cursor-pointer"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="text-[13px] font-semibold text-[#1C1D21] dark:text-gray-100 truncate">
                            {res.section ? res.section.title : res.itemLabel}
                          </div>
                          <div className="text-[11px] text-[#646772] dark:text-gray-400 truncate">
                            {res.groupLabel} · {res.itemLabel}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#5A5D67] dark:text-gray-400 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Categories */}
              {!isMobileSearchLoading && searchResults.matchedGroups.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#646772] dark:text-gray-400 px-1">
                    {searchQuery ? 'Kategori' : 'Akses Cepat Kategori UI KIT'}
                  </div>
                  <div className="space-y-1">
                    {searchResults.matchedGroups.map((group) => {
                      const Icon = getUiKitCategoryIcon(group.id);
                      const isCurrent = uiCategory === group.id;
                      return (
                        <button
                          key={group.id}
                          type="button"
                          onClick={() => {
                            selectUiNode(group.id);
                            animateCloseSearch();
                          }}
                          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl border transition-colors text-left cursor-pointer ${
                            isCurrent
                              ? 'bg-[#ee2e65] border-[#ee2e65] text-white font-semibold'
                              : 'bg-[#FAFBFD] dark:bg-[#1B1E24] border-black/[0.10] dark:border-white/[0.08] hover:bg-[#F4F5F8] dark:hover:bg-[#232730] text-[#1C1D21] dark:text-gray-100 font-medium'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Icon className="w-4 h-4 shrink-0" />
                            <span className="text-[13px] truncate">{group.label}</span>
                          </div>
                          <ChevronRight
                            className={`w-4 h-4 shrink-0 ${
                              isCurrent ? 'text-white/80' : 'text-[#5A5D67] dark:text-gray-400'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {searchQuery &&
                !isMobileSearchLoading &&
                searchResults.matchedGroups.length === 0 &&
                searchResults.matchedElements.length === 0 && (
                  <div className="py-6 text-center space-y-3">
                    <p className="text-[12.5px] text-[#646772] dark:text-gray-400">
                      Tidak ada komponen untuk &ldquo;{searchQuery}&rdquo;
                    </p>
                    <div className="flex flex-wrap justify-center gap-1.5">
                      {UI_SUGGESTION_SEARCHES.slice(0, 4).map((sug) => (
                        <button
                          key={sug.id}
                          type="button"
                          onClick={() => setSearchQuery(sug.query)}
                          className="px-3 py-1.5 rounded-full bg-[#FEF1F5] dark:bg-[#ee2e65]/15 border border-[#FBC2D4] dark:border-[#ee2e65]/35 text-[11.5px] font-semibold text-[#9D113C] dark:text-[#fbc2d4] cursor-pointer"
                        >
                          {sug.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

