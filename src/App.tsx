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
import { ProfilePage } from './components/pages/ProfilePage';
import { UI_KIT_CATALOG } from './components/uikit/uiKitCatalog';
import {
  MENU_SHELL_TINTS,
  PROFILE_SHELL_TINT,
  SHELL_TINT_MASK_LIGHT,
  SHELL_TINT_MASK_DARK,
} from './constants/shellThemes';

function MainLayout() {
  const { activePage, uiCategory, uiSubJump, theme, triggerToast } = useApp();
  const shellTint =
    activePage === 'profile'
      ? PROFILE_SHELL_TINT
      : MENU_SHELL_TINTS[uiCategory] || MENU_SHELL_TINTS.utilities;
  const activeTintColor = theme === 'dark' ? shellTint.dark : shellTint.light;
  const activeMask = theme === 'dark' ? SHELL_TINT_MASK_DARK : SHELL_TINT_MASK_LIGHT;

  const handleWorkspaceRefresh = async () => {
    if (activePage === 'profile') {
      triggerToast('Profil Disinkronkan', 'Data akun dan sesi aktif telah diperbarui.', 'success');
      return;
    }
    const activeGroup = UI_KIT_CATALOG.find((g) => g.id === uiCategory);
    triggerToast(
      'UI KIT Disinkronkan',
      `${activeGroup?.label || 'Design System'} · ${uiSubJump} siap digunakan.`,
      'success'
    );
  };

  return (
    <div className="min-h-screen md:h-screen md:overflow-hidden bg-[#E8E9F0] dark:bg-[#0B0D10] p-2.5 sm:p-3.5 md:p-4 lg:p-5 font-sans text-[#1C1D21] dark:text-[#F3F4F6] flex justify-center items-stretch selection:bg-[#D6D4FF] selection:text-[#1C1D21] dark:selection:bg-[#C6F135]/30 dark:selection:text-white transition-colors duration-200">
      {/* Main Container Shell — Crisp white base with whisper-soft sidebar tint morphing on menu change */}
      <div className="app-shell-container w-full md:h-full bg-white dark:bg-[#16191F] rounded-[22px] sm:rounded-[26px] md:rounded-[28px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] dark:shadow-[0_24px_70px_-15px_rgba(0,0,0,0.65)] border border-white/80 dark:border-white/[0.08] flex overflow-hidden relative min-w-0 min-h-0 transition-colors duration-200">
        {/* Ultra-light masked gradient wash that smoothly morphs tint into white without distraction */}
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

        <main className="relative z-10 flex-1 bg-white dark:bg-[#121418] m-1.5 sm:m-2.5 rounded-[14px] sm:rounded-[16px] md:rounded-[18px] border border-[#E4E7EE] dark:border-white/[0.10] flex flex-col min-w-0 min-h-0 overflow-hidden isolate bg-clip-padding pb-[calc(5.25rem+env(safe-area-inset-bottom,0px))] md:pb-0 transition-colors duration-200">
          <Header />

          <ElasticPullToRefresh onRefresh={handleWorkspaceRefresh}>
            {activePage === 'profile' ? <ProfilePage /> : <UiKitPage />}
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

