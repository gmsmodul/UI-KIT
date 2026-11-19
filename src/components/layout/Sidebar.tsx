import React, { useRef, useState, useLayoutEffect } from 'react';
import { PanelLeft, Layers } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UI_KIT_CATALOG } from '../uikit/uiKitCatalog';
import { getUiKitCategoryIcon } from '../uikit/uiKitIcons';
import { preloadCategoryModule } from '../uikit/uiKitPreload';

export const Sidebar: React.FC = () => {
  const {
    uiCategory,
    selectUiNode,
    sidebarOpen,
    setSidebarOpen,
  } = useApp();

  const totalElements = UI_KIT_CATALOG.reduce((acc, g) => acc + g.items.length, 0);

  const mainMenuRef = useRef<HTMLDivElement>(null);
  const scrollWrapperRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeMenuBtnRef = useRef<HTMLButtonElement | null>(null);
  const [menuIndicator, setMenuIndicator] = useState({ top: 0, height: 0, visible: false });
  const [peekMaxHeight, setPeekMaxHeight] = useState<number | null>(null);

  useLayoutEffect(() => {
    const updateMenuIndicator = () => {
      const container = mainMenuRef.current;
      const activeBtn = activeMenuBtnRef.current;
      if (!container || !activeBtn) {
        setMenuIndicator((prev) => (prev.visible ? { ...prev, visible: false } : prev));
        return;
      }
      const cRect = container.getBoundingClientRect();
      const bRect = activeBtn.getBoundingClientRect();
      if (bRect.height === 0) return;
      setMenuIndicator({
        top: bRect.top - cRect.top,
        height: bRect.height,
        visible: true,
      });
    };

    updateMenuIndicator();
    const container = mainMenuRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(updateMenuIndicator);
    ro.observe(container);
    return () => ro.disconnect();
  }, [uiCategory, sidebarOpen]);

  useLayoutEffect(() => {
    const computePeekHeight = () => {
      const wrapper = scrollWrapperRef.current;
      const scroller = scrollContainerRef.current;
      if (!wrapper || !scroller) return;

      const availableHeight = wrapper.clientHeight;
      const totalHeight = scroller.scrollHeight;

      if (availableHeight <= 0 || totalHeight <= availableHeight + 2) {
        setPeekMaxHeight((prev) => (prev !== null ? null : prev));
        return;
      }

      const scrollerRect = scroller.getBoundingClientRect();
      const items = Array.from(
        scroller.querySelectorAll<HTMLElement>('[data-sidebar-item="true"]')
      );

      let targetMid: number | null = null;
      for (const item of items) {
        const rect = item.getBoundingClientRect();
        const topInContent = rect.top - scrollerRect.top + scroller.scrollTop;
        const midInContent = topInContent + rect.height * 0.5;
        if (midInContent <= availableHeight) {
          targetMid = Math.round(midInContent);
        } else {
          break;
        }
      }

      setPeekMaxHeight((prev) => (prev !== targetMid ? targetMid : prev));
    };

    computePeekHeight();
    const wrapper = scrollWrapperRef.current;
    const scroller = scrollContainerRef.current;
    const ro =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(computePeekHeight) : null;
    if (ro && wrapper) ro.observe(wrapper);
    if (ro && scroller) ro.observe(scroller);
    window.addEventListener('resize', computePeekHeight);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', computePeekHeight);
    };
  }, [sidebarOpen]);

  return (
    <aside
      className={`hidden md:flex md:static inset-y-0 left-0 z-50 h-full max-h-full overflow-hidden shrink-0 flex-col transition-all duration-[240ms] ease-[cubic-bezier(0.23,1,0.32,1)] bg-transparent backdrop-blur-md border-r border-black/[0.12] dark:border-white/[0.08] ${
        sidebarOpen ? 'w-[260px]' : 'w-[84px]'
      } p-4 select-none`}
    >
      {/* Brand Logo Header */}
      <div className="shrink-0 flex items-center justify-between px-2 pt-1 pb-4">
        <button
          type="button"
          onClick={() => selectUiNode('utilities', 'Grid')}
          className="flex items-center gap-3 min-w-0 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-full bg-[#ee2e65] flex items-center justify-center text-white shadow-[0_4px_12px_-3px_rgba(238,46,101,0.45)] shrink-0 group-hover:brightness-105 transition-all">
            <Layers className="w-4 h-4 text-white" />
          </div>
          {sidebarOpen && (
            <div className="min-w-0 text-left">
              <span className="block font-semibold text-[16px] tracking-tight text-[#1C1D21] dark:text-[#F3F4F6] leading-tight">
                UI KIT
              </span>
              <span className="block text-[10.5px] font-medium text-[#646772] dark:text-gray-400 leading-tight">
                Design System
              </span>
            </div>
          )}
        </button>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          title="Toggle Sidebar"
          className="hidden md:flex w-8 h-8 rounded-lg hover:bg-black/5 dark:hover:bg-white/[0.06] items-center justify-center text-[#5A5D67] dark:text-gray-400 transition-colors cursor-pointer shrink-0"
        >
          <PanelLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable UI KIT Categories Region */}
      <div ref={scrollWrapperRef} className="flex-1 min-h-0 flex flex-col">
        <div
          ref={scrollContainerRef}
          className="overflow-y-auto no-scrollbar"
          style={peekMaxHeight !== null ? { maxHeight: `${peekMaxHeight}px` } : undefined}
        >
          <div ref={mainMenuRef} className="relative space-y-1 pb-2">
            <span
              aria-hidden="true"
              className={`pointer-events-none absolute left-0 right-0 top-0 rounded-lg bg-white dark:bg-[#121418] shadow-xs dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] transition-[transform,height,opacity] duration-[220ms] ease-[cubic-bezier(0.23,1,0.32,1)] ${
                menuIndicator.visible ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                height: `${menuIndicator.height}px`,
                transform: `translate3d(0, ${menuIndicator.top}px, 0)`,
              }}
            />
            {sidebarOpen && (
              <div className="relative z-10 px-3 pb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Design System
              </div>
            )}
            {UI_KIT_CATALOG.map((group) => {
              const Icon = getUiKitCategoryIcon(group.id);
              const isActive = uiCategory === group.id;
              return (
                  <button
                    key={group.id}
                    data-sidebar-item="true"
                    ref={isActive ? activeMenuBtnRef : undefined}
                    onClick={() => selectUiNode(group.id)}
                    onMouseEnter={() => preloadCategoryModule(group.id)}
                    onFocus={() => preloadCategoryModule(group.id)}
                    onTouchStart={() => preloadCategoryModule(group.id)}
                    title={!sidebarOpen ? group.label : undefined}
                  className={`relative z-10 w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold transition-colors duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] group cursor-pointer ${
                    isActive
                      ? `text-gray-900 dark:text-white ${menuIndicator.visible ? '' : 'bg-white dark:bg-[#121418] shadow-xs'}`
                      : 'text-gray-600 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-white/[0.05] hover:text-gray-950 dark:hover:text-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors duration-200 ${
                        isActive ? 'text-[#ee2e65]' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-100'
                      }`}
                    />
                    {sidebarOpen && <span className="truncate">{group.label}</span>}
                  </div>
                  {sidebarOpen && (
                    <span
                      className={`min-w-5 h-5 px-1.5 rounded-full text-[11px] font-semibold flex items-center justify-center shrink-0 tabular-nums transition-colors ${
                        isActive
                          ? 'bg-[#FEF1F5] dark:bg-[#ee2e65]/20 text-[#9D113C] dark:text-[#f895b5]'
                          : 'bg-white/70 dark:bg-[#121418]/80 text-gray-500 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200'
                      }`}
                    >
                      {group.items.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Compact UI KIT System Footer */}
      <div className="shrink-0 pt-3 mt-2 border-t border-black/[0.12] dark:border-white/[0.08]">
        <div className="flex items-center justify-between gap-2.5 p-2 rounded-2xl bg-white/75 dark:bg-[#121418]/90 border border-black/[0.10] dark:border-white/[0.08]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-[#ee2e65] text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-xs">
              UI
            </div>
            {sidebarOpen && (
              <div className="min-w-0">
                <div className="text-[13px] font-semibold text-[#1C1D21] dark:text-[#F3F4F6] truncate">UI KIT</div>
                <div className="text-[11px] text-[#646772] dark:text-gray-400 truncate">Design System</div>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <span className="px-2 py-0.5 rounded-full bg-[#FEF1F5] dark:bg-[#ee2e65]/20 text-[#9D113C] dark:text-[#f895b5] text-[10.5px] font-semibold whitespace-nowrap shrink-0 tabular-nums">
              {totalElements} Items
            </span>
          )}
        </div>
      </div>
    </aside>
  );
};

