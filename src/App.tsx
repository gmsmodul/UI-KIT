import React from 'react';
import { MotionConfig, motion } from 'motion/react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { ToastContainer } from './components/ui/ToastContainer';
import { ModalsContainer } from './components/modals/ModalsContainer';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { ElasticPullToRefresh } from './components/ui/ElasticPullToRefresh';
import { UiKitPage } from './components/pages/UiKitPage';
import { UI_KIT_CATALOG } from './components/uikit/uiKitCatalog';

interface MenuShellTint {
  light: string;
  dark: string;
}

const MENU_SHELL_TINTS: Record<string, MenuShellTint> = {
  utilities: { light: '#E6E0FF', dark: '#4C3F82' },
  datadisplay: { light: '#DFEEFF', dark: '#2E4C73' },
  dataentry: { light: '#FCE3EC', dark: '#73314B' },
  feedback: { light: '#FDEEDB', dark: '#6E4E28' },
  tables: { light: '#DFF5EB', dark: '#285D49' },
  charts: { light: '#E3E7FF', dark: '#39417A' },
  maps: { light: '#DEF3F7', dark: '#285863' },
  navigation: { light: '#EDE3FE', dark: '#543978' },
  behavioral: { light: '#FCE8E1', dark: '#703D31' },
  layout: { light: '#E6EBF3', dark: '#3D4759' },
  authstate: { light: '#E7F4DF', dark: '#3A5C30' },
  mobilekit: { light: '#F5E3F9', dark: '#663470' },
};

const SHELL_TINT_MASK_LIGHT =
  'linear-gradient(135deg, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.22) 28%, rgba(0,0,0,0) 56%)';
const SHELL_TINT_MASK_DARK =
  'linear-gradient(135deg, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0.14) 28%, rgba(0,0,0,0) 56%)';

function MainLayout() {
  const { uiCategory, uiSubJump, theme, triggerToast } = useApp();
  const shellTint = MENU_SHELL_TINTS[uiCategory] || MENU_SHELL_TINTS.utilities;
  const activeTintColor = theme === 'dark' ? shellTint.dark : shellTint.light;
  const activeMask = theme === 'dark' ? SHELL_TINT_MASK_DARK : SHELL_TINT_MASK_LIGHT;

  const handleWorkspaceRefresh = async () => {
    const activeGroup = UI_KIT_CATALOG.find((g) => g.id === uiCategory);
    triggerToast(
      'UI KIT Disinkronkan',
      `${activeGroup?.label || 'Design System'} · ${uiSubJump} siap digunakan.`,
      'success'
    );
  };

  return (
    <div className="min-h-screen md:h-screen md:overflow-hidden bg-[#E8E9F0] dark:bg-[#0B0D10] p-2.5 sm:p-3.5 md:p-4 lg:p-5 font-sans text-[#1C1D21] dark:text-[#F3F4F6] flex justify-center items-stretch selection:bg-[#D6D4FF] selection:text-[#1C1D21] dark:selection:bg-[#C6F135]/30 dark:selection:text-white transition-colors duration-200">
      {/* Main Container Shell — Mostly crisp white with ultra-light tint fading into white on menu change */}
      <div className="app-shell-container w-full md:h-full bg-white dark:bg-[#16191F] rounded-[22px] sm:rounded-[26px] md:rounded-[28px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] dark:shadow-[0_24px_70px_-15px_rgba(0,0,0,0.65)] border border-white/80 dark:border-white/[0.08] flex overflow-hidden relative min-w-0 min-h-0 transition-colors duration-200">
        {/* Soft masked gradient wash that smoothly morphs tint into white without distraction */}
        <motion.div
          aria-hidden="true"
          animate={{ backgroundColor: activeTintColor }}
          transition={{ duration: 0.48, ease: [0.23, 1, 0.32, 1] }}
          style={{
            backgroundColor: activeTintColor,
            maskImage: activeMask,
            WebkitMaskImage: activeMask,
          }}
          className="pointer-events-none absolute inset-0 z-0"
        />

        <Sidebar />

        <main className="relative z-10 flex-1 bg-white dark:bg-[#121418] m-1.5 sm:m-2.5 rounded-[18px] sm:rounded-[24px] shadow-[0_2px_20px_rgba(0,0,0,0.02)] dark:shadow-none border border-black/[0.12] dark:border-white/[0.08] flex flex-col min-w-0 min-h-0 overflow-hidden pb-[calc(5.25rem+env(safe-area-inset-bottom,0px))] md:pb-0 transition-colors duration-200">
          <Header />

          <ElasticPullToRefresh onRefresh={handleWorkspaceRefresh}>
            <UiKitPage />
          </ElasticPullToRefresh>
        </main>
      </div>

      <MobileBottomNav />
      <ModalsContainer />
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <AppProvider>
        <MainLayout />
      </AppProvider>
    </MotionConfig>
  );
}

