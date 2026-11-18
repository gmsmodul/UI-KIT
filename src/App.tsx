import React from 'react';
import { MotionConfig } from 'motion/react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { ToastContainer } from './components/ui/ToastContainer';
import { ModalsContainer } from './components/modals/ModalsContainer';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { ElasticPullToRefresh } from './components/ui/ElasticPullToRefresh';
import { UiKitPage } from './components/pages/UiKitPage';
import { UI_KIT_CATALOG } from './components/uikit/uiKitCatalog';

function MainLayout() {
  const { uiCategory, uiSubJump, triggerToast } = useApp();

  const handleWorkspaceRefresh = async () => {
    const activeGroup = UI_KIT_CATALOG.find((g) => g.id === uiCategory);
    triggerToast(
      'UI KIT Disinkronkan',
      `${activeGroup?.label || 'Design System'} · ${uiSubJump} siap digunakan.`,
      'success'
    );
  };

  return (
    <div className="min-h-screen md:h-screen md:overflow-hidden bg-[#E8E9F0] p-2.5 sm:p-3.5 md:p-4 lg:p-5 font-sans text-[#1C1D21] flex justify-center items-stretch selection:bg-[#D6D4FF] selection:text-[#1C1D21]">
      {/* Main Container Shell */}
      <div className="app-shell-container w-full md:h-full bg-gradient-to-br from-[#F1EFFE] via-[#F8F9FC] to-[#ECF8F2] rounded-[22px] sm:rounded-[26px] md:rounded-[28px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] border border-white/80 flex overflow-hidden relative min-w-0 min-h-0">
        <Sidebar />

        <main className="flex-1 bg-white m-1.5 sm:m-2.5 rounded-[18px] sm:rounded-[24px] shadow-[0_2px_20px_rgba(0,0,0,0.02)] border border-black/[0.12] flex flex-col min-w-0 min-h-0 overflow-hidden pb-[calc(5.25rem+env(safe-area-inset-bottom,0px))] md:pb-0">
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

