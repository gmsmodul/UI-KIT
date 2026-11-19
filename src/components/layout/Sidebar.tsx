import React, { useRef, useState, useLayoutEffect } from 'react';
import { PanelLeft, Layers, ArrowLeft, Settings } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UI_KIT_CATALOG } from '../uikit/uiKitCatalog';
import { getUiKitCategoryIcon } from '../uikit/uiKitIcons';
import { preloadCategoryModule } from '../uikit/uiKitPreload';

export const Sidebar: React.FC = () => {
  const {
    activePage,
    setActivePage,
    uiCategory,
    selectUiNode,
    sidebarOpen,
    setSidebarOpen,
    userProfile,
  } = useApp();

  const isProfileActive = activePage === 'profile';

  const mainMenuRef = useRef<HTMLDivElement>(null);
  const scrollWrapperRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeMenuBtnRef = useRef<HTMLButtonElement | null>(null);
  const [menuIndicator, setMenuIndicator] = useState({ top: 0, height: 0, visible: false });
  const [peekMaxHeight, setPeekMaxHeight] = useState<number | null>(null);
  const [avatarError, setAvatarError] = useState(false);

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
  }, [uiCategory, sidebarOpen, isProfileActive]);

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
      className={`hidden md:flex md:static inset-y-0 left-0 z-20 h-full max-h-full overflow-hidden shrink-0 flex-col transition-all duration-[240ms] ease-[cubic-bezier(0.23,1,0.32,1)] bg-transparent border-r border-black/[0.07] dark:border-white/[0.08] ${
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
              const isActive = !isProfileActive && uiCategory === group.id;
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

      {/* Sidebar Footer Actions & Account Profile */}
      <div className="shrink-0 pt-3 mt-2 border-t border-black/[0.08] dark:border-white/[0.08]">
        <div className="space-y-1">
          <button
            type="button"
            onClick={(e) => e.preventDefault()}
            title={!sidebarOpen ? 'Back to Home' : undefined}
            className={`w-full flex items-center ${
              sidebarOpen ? 'gap-3 px-2.5' : 'justify-center px-0'
            } py-2 rounded-lg text-[14px] font-medium text-[#374151] dark:text-gray-200 hover:bg-black/[0.04] dark:hover:bg-white/[0.05] hover:text-[#111827] dark:hover:text-white transition-colors cursor-pointer`}
          >
            <ArrowLeft className="w-[18px] h-[18px] text-[#525866] dark:text-gray-400 shrink-0" />
            {sidebarOpen && <span className="truncate">Back to Home</span>}
          </button>

          <button
            type="button"
            onClick={(e) => e.preventDefault()}
            title={!sidebarOpen ? 'Settings' : undefined}
            className={`w-full flex items-center ${
              sidebarOpen ? 'gap-3 px-2.5' : 'justify-center px-0'
            } py-2 rounded-lg text-[14px] font-medium text-[#374151] dark:text-gray-200 hover:bg-black/[0.04] dark:hover:bg-white/[0.05] hover:text-[#111827] dark:hover:text-white transition-colors cursor-pointer`}
          >
            <Settings className="w-[18px] h-[18px] text-[#525866] dark:text-gray-400 shrink-0" />
            {sidebarOpen && <span className="truncate">Settings</span>}
          </button>
        </div>

        {sidebarOpen && (
          <div className="px-2.5 pt-4 pb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#6B7280] dark:text-gray-400">
            ACCOUNT
          </div>
        )}

        <button
          type="button"
          onClick={() => setActivePage('profile')}
          aria-current={isProfileActive ? 'page' : undefined}
          title={!sidebarOpen ? `${userProfile.name} — ${userProfile.role}` : undefined}
          className={`w-full flex items-center ${
            sidebarOpen ? 'gap-3 px-2' : 'justify-center mt-3 px-0'
          } py-1.5 rounded-xl transition-colors text-left cursor-pointer ${
            isProfileActive
              ? 'bg-white dark:bg-[#121418] shadow-xs ring-1 ring-black/[0.06] dark:ring-white/[0.08]'
              : 'hover:bg-black/[0.04] dark:hover:bg-white/[0.05]'
          }`}
        >
          {avatarError ? (
            <div className="w-10 h-10 rounded-full bg-[#E9EEF5] dark:bg-[#232730] text-[#1C1D21] dark:text-white text-xs font-bold flex items-center justify-center shrink-0 ring-1 ring-black/[0.08] dark:ring-white/[0.12]">
              {userProfile.initials}
            </div>
          ) : (
            <img
              src={userProfile.avatarSrc}
              alt={userProfile.name}
              referrerPolicy="no-referrer"
              onError={() => setAvatarError(true)}
              className="w-10 h-10 rounded-full object-cover shrink-0 ring-1 ring-black/[0.08] dark:ring-white/[0.12]"
            />
          )}
          {sidebarOpen && (
            <div className="min-w-0">
              <div className="text-[14px] font-semibold text-[#1C1D21] dark:text-[#F3F4F6] leading-snug truncate">
                {userProfile.name}
              </div>
              <div className="text-[12.5px] font-normal text-[#6B7280] dark:text-gray-400 leading-snug truncate">
                {userProfile.role}
              </div>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
};

