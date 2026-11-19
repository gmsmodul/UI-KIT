import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Settings,
  Layers,
  Sparkles,
  Check,
  PanelLeft,
  Sun,
  Moon,
  CornerUpLeft,
} from 'lucide-react';
import { UiDocPage, UiDocSection } from './UiDocBlock';
import { useApp } from '../../context/AppContext';
import { ProfileCard } from '../ui/ProfileCard';
import {
  MENU_SHELL_TINTS,
  MENU_SHELL_TINT_LIST,
  SHELL_TINT_MASK_LIGHT,
  SHELL_TINT_MASK_DARK,
} from '../../constants/shellThemes';

export const AppShellSidebarUiKit: React.FC = () => {
  const { uiCategory, selectUiNode, setActivePage, userProfile, triggerToast } = useApp();

  // Section 1: Interactive Sidebar Gradient Shell Preview
  const [previewCategoryId, setPreviewCategoryId] = useState<string>(uiCategory || 'utilities');
  const [previewDark, setPreviewDark] = useState(false);

  // Section 2: Interactive Sidebar Footer & Account Profile Preview
  const [footerCollapsed, setFooterCollapsed] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  // Section 3: Crisp Concentric Content Frame Corners Comparison
  const [cornerMode, setCornerMode] = useState<'crisp' | 'hazy'>('crisp');

  // Section 4: Glassmorphic Portrait Profile Card Preview
  const [cardBezelPreview, setCardBezelPreview] = useState<'dark' | 'light'>('dark');

  const activePreviewTint = MENU_SHELL_TINTS[previewCategoryId] || MENU_SHELL_TINTS.utilities;
  const activePreviewColor = previewDark ? activePreviewTint.dark : activePreviewTint.light;
  const activePreviewMask = previewDark ? SHELL_TINT_MASK_DARK : SHELL_TINT_MASK_LIGHT;

  return (
    <UiDocPage
      title="App Shell & Sidebar"
      subLinks={[
        { id: 'shl-sidebar-gradient', label: 'Sidebar Gradient Shell' },
        { id: 'shl-sidebar-profile', label: 'Sidebar Footer & Profile' },
        { id: 'shl-concentric-frame', label: 'Crisp Content Frame Corners' },
        { id: 'shl-profile-card', label: 'Portrait Glass Profile Card' },
      ]}
    >
      {/* SECTION 1: Ultra-Light Sidebar Gradient Shell & Menu Morph */}
      <UiDocSection
        id="shl-sidebar-gradient"
        title="Ultra-Light Sidebar Gradient Shell & Menu Color Morph"
        description="Gradasi lembut berbasis putih di sisi kiri (sidebar) yang bermorfosis halus mengikuti kategori menu aktif tanpa mengganggu fokus konten utama. Menggunakan layer motion backgroundColor dengan maskImage diagonal 46% ke putih solid."
        classesHint="bg-white + motion.div maskImage: linear-gradient(135deg, rgba(0,0,0,0.44) 0%, rgba(0,0,0,0.14) 22%, rgba(0,0,0,0) 46%)"
        codeSnippet={`import { motion } from 'motion/react';
import { MENU_SHELL_TINTS, SHELL_TINT_MASK_LIGHT } from '@/constants/shellThemes';

<div className="relative flex overflow-hidden rounded-[28px] bg-white dark:bg-[#16191F]">
  {/* Whisper-soft tint fading fast to pure white */}
  <motion.div
    aria-hidden="true"
    animate={{ backgroundColor: MENU_SHELL_TINTS[activeMenu].light }}
    transition={{ duration: 0.48, ease: [0.23, 1, 0.32, 1] }}
    style={{
      maskImage: SHELL_TINT_MASK_LIGHT,
      WebkitMaskImage: SHELL_TINT_MASK_LIGHT,
    }}
    className="pointer-events-none absolute inset-0 z-0"
  />
  <Sidebar />
  <main className="relative z-10 flex-1 bg-white m-2.5 rounded-[18px] border border-[#E4E7EE] overflow-hidden isolate bg-clip-padding">
    {children}
  </main>
</div>`}
      >
        <div className="space-y-5">
          {/* Controls bar */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
              <Sparkles className="w-3.5 h-3.5 text-[#ee2e65]" />
              <span>
                Klik kategori di bawah untuk melihat motion gradasi ultra-muda:{' '}
                <strong className="text-gray-900 dark:text-white">{activePreviewTint.toneName}</strong>{' '}
                <code className="text-[11px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-[#1B1E24] text-gray-700 dark:text-gray-300 font-mono">
                  {activePreviewColor}
                </code>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPreviewDark((d) => !d)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-white/[0.12] bg-white dark:bg-[#1B1E24] text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#232730] transition-colors cursor-pointer"
              >
                {previewDark ? <Sun className="w-3.5 h-3.5 text-[#C6F135]" /> : <Moon className="w-3.5 h-3.5" />}
                <span>{previewDark ? 'Dark Preview' : 'Light Preview'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  selectUiNode(activePreviewTint.id);
                  triggerToast('Tema Shell Diterapkan', `Berpindah ke ${activePreviewTint.label} (${activePreviewTint.toneName}).`, 'success');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1C1D21] dark:bg-white text-white dark:text-[#121418] text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
              >
                <span>Terapkan ke App Shell</span>
              </button>
            </div>
          </div>

          {/* Interactive Mini App Shell Stage */}
          <div className="p-3 sm:p-4 rounded-2xl bg-[#E8E9F0] dark:bg-[#0B0D10] border border-gray-300/70 dark:border-white/[0.08]">
            <div
              className={`relative flex rounded-[24px] overflow-hidden border transition-colors duration-200 min-h-[250px] ${
                previewDark
                  ? 'bg-[#16191F] border-white/[0.08] text-gray-100'
                  : 'bg-white border-white/90 text-[#1C1D21]'
              }`}
            >
              {/* Animated Ultra-Light Gradient Wash */}
              <motion.div
                aria-hidden="true"
                animate={{ backgroundColor: activePreviewColor }}
                transition={{ duration: 0.48, ease: [0.23, 1, 0.32, 1] }}
                style={{
                  backgroundColor: activePreviewColor,
                  maskImage: activePreviewMask,
                  WebkitMaskImage: activePreviewMask,
                }}
                className="pointer-events-none absolute inset-0 z-0"
              />

              {/* Mini Sidebar */}
              <div
                className={`relative z-10 w-[180px] sm:w-[200px] shrink-0 p-3 flex flex-col justify-between border-r ${
                  previewDark ? 'border-white/[0.08]' : 'border-black/[0.07]'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 px-1.5 pb-2.5">
                    <div className="w-7 h-7 rounded-full bg-[#ee2e65] text-white flex items-center justify-center shrink-0">
                      <Layers className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold leading-tight">UI KIT</div>
                      <div className={`text-[10px] ${previewDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Design System
                      </div>
                    </div>
                  </div>
                  {MENU_SHELL_TINT_LIST.slice(0, 5).map((item) => {
                    const isSelected = previewCategoryId === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setPreviewCategoryId(item.id)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11.5px] font-semibold transition-colors cursor-pointer ${
                          isSelected
                            ? previewDark
                              ? 'bg-[#121418] text-white shadow-xs'
                              : 'bg-white text-[#1C1D21] shadow-xs'
                            : previewDark
                              ? 'text-gray-400 hover:text-gray-100 hover:bg-white/[0.05]'
                              : 'text-gray-600 hover:text-gray-950 hover:bg-white/60'
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
                <div className={`pt-2 mt-2 border-t text-[10.5px] px-1.5 ${previewDark ? 'border-white/[0.08] text-gray-400' : 'border-black/[0.07] text-gray-500'}`}>
                  Mask: 44% → 14% → 0%
                </div>
              </div>

              {/* Mini Inner Content Panel (Concentric Crisp Corners) */}
              <div
                className={`relative z-10 flex-1 m-2.5 rounded-[14px] border overflow-hidden isolate bg-clip-padding flex flex-col ${
                  previewDark
                    ? 'bg-[#121418] border-white/[0.10]'
                    : 'bg-white border-[#E4E7EE]'
                }`}
              >
                <div
                  className={`h-10 px-3.5 border-b flex items-center justify-between text-[11.5px] font-semibold ${
                    previewDark
                      ? 'bg-[#121418] border-white/[0.08] text-gray-100'
                      : 'bg-white border-[#E4E7EE] text-[#1C1D21]'
                  }`}
                >
                  <span>UI KIT &gt; {activePreviewTint.label}</span>
                  <span className="inline-flex items-center gap-1.5 text-[10.5px] font-medium opacity-75">
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-black/15"
                      style={{ backgroundColor: activePreviewColor }}
                    />
                    {activePreviewTint.toneName}
                  </span>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-center gap-2">
                  <div className="text-xs font-semibold">White-Dominant Surface</div>
                  <p className={`text-[11.5px] leading-relaxed max-w-md ${previewDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Warna gradasi hanya hadir sebagai aksen sangat muda di sudut kiri atas sidebar lalu melarut ke putih bersih sebelum melewati pertengahan layar — bebas distraksi saat berpindah menu.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* All 12 Category Tokens Palette */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {MENU_SHELL_TINT_LIST.map((token) => {
              const isSelected = previewCategoryId === token.id;
              const swatchHex = previewDark ? token.dark : token.light;
              return (
                <button
                  key={token.id}
                  type="button"
                  onClick={() => setPreviewCategoryId(token.id)}
                  className={`flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#ee2e65] bg-[#FEF1F5]/50 dark:bg-[#ee2e65]/10'
                      : 'border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#15181E] hover:border-gray-300 dark:hover:border-white/[0.16]'
                  }`}
                >
                  <span
                    className="w-7 h-7 rounded-lg border border-black/[0.08] dark:border-white/[0.12] shrink-0 flex items-center justify-center"
                    style={{
                      background: previewDark
                        ? `linear-gradient(135deg, ${token.dark} 0%, #16191F 85%)`
                        : `linear-gradient(135deg, ${token.light} 0%, #FFFFFF 85%)`,
                    }}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#ee2e65]" />}
                  </span>
                  <div className="min-w-0">
                    <div className="text-[11.5px] font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {token.label}
                    </div>
                    <div className="text-[10.5px] text-gray-500 dark:text-gray-400 font-mono truncate">
                      {swatchHex} · {token.toneName}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </UiDocSection>

      {/* SECTION 2: Sidebar Footer Actions & Account Profile */}
      <UiDocSection
        id="shl-sidebar-profile"
        title="Sidebar Footer Actions & Account Profile"
        description="Struktur bawah sidebar tanpa kotak kartu (unboxed): garis pemisah halus di atas, item Back to Home dan Settings (statis tanpa perpindahan halaman), label seksi ACCOUNT, serta baris profil User / Role yang membuka halaman Profile saat diklik."
        classesHint="border-t border-black/[0.08] pt-3 / text-[11px] uppercase tracking-[0.06em] / w-10 h-10 rounded-full object-cover"
        codeSnippet={`<div className="shrink-0 pt-3 mt-2 border-t border-black/[0.08] dark:border-white/[0.08]">
  <div className="space-y-1">
    <button type="button" onClick={(e) => e.preventDefault()} className="w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-[14px] font-medium text-[#374151] dark:text-gray-200 hover:bg-black/[0.04]">
      <ArrowLeft className="w-[18px] h-[18px] text-[#525866]" />
      <span>Back to Home</span>
    </button>
    <button type="button" onClick={(e) => e.preventDefault()} className="w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-[14px] font-medium text-[#374151] dark:text-gray-200 hover:bg-black/[0.04]">
      <Settings className="w-[18px] h-[18px] text-[#525866]" />
      <span>Settings</span>
    </button>
  </div>

  <div className="px-2.5 pt-3.5 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#6B7280]">
    ACCOUNT
  </div>

  <button type="button" onClick={() => setActivePage('profile')} className="w-full flex items-center gap-3 px-2 py-1.5 rounded-xl hover:bg-black/[0.04] text-left">
    <img src={userProfile.avatarSrc} alt="User" className="w-10 h-10 rounded-full object-cover" />
    <div className="min-w-0">
      <div className="text-[14px] font-semibold text-[#1C1D21] truncate">User</div>
      <div className="text-[12.5px] text-[#6B7280] truncate">Role</div>
    </div>
  </button>
</div>`}
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-gray-600 dark:text-gray-400">
              Uji mode sidebar melebar (260px) dan ringkas (84px). Klik baris profil untuk membuka halaman Profile.
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFooterCollapsed((prev) => !prev)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-white/[0.12] bg-white dark:bg-[#1B1E24] text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#232730] transition-colors cursor-pointer"
              >
                <PanelLeft className="w-3.5 h-3.5" />
                <span>{footerCollapsed ? 'Mode Expanded (260px)' : 'Mode Collapsed (84px)'}</span>
              </button>
              <button
                type="button"
                onClick={() => setActivePage('profile')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1C1D21] dark:bg-white text-white dark:text-[#121418] text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
              >
                <span>Buka Halaman Profile</span>
              </button>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#F7F7FA] dark:bg-[#0E1015] border border-gray-200 dark:border-white/[0.08] flex justify-start">
            <div
              className={`rounded-2xl bg-white dark:bg-[#16191F] border border-black/[0.08] dark:border-white/[0.08] p-4 transition-all duration-200 ${
                footerCollapsed ? 'w-[84px]' : 'w-[260px]'
              }`}
            >
              <div className="pt-3 border-t border-black/[0.08] dark:border-white/[0.08]">
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={(e) => e.preventDefault()}
                    title="Back to Home"
                    className={`w-full flex items-center ${
                      footerCollapsed ? 'justify-center px-0' : 'gap-3 px-2.5'
                    } py-2 rounded-lg text-[14px] font-medium text-[#374151] dark:text-gray-200 hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-colors cursor-pointer`}
                  >
                    <ArrowLeft className="w-[18px] h-[18px] text-[#525866] dark:text-gray-400 shrink-0" />
                    {!footerCollapsed && <span className="truncate">Back to Home</span>}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => e.preventDefault()}
                    title="Settings"
                    className={`w-full flex items-center ${
                      footerCollapsed ? 'justify-center px-0' : 'gap-3 px-2.5'
                    } py-2 rounded-lg text-[14px] font-medium text-[#374151] dark:text-gray-200 hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-colors cursor-pointer`}
                  >
                    <Settings className="w-[18px] h-[18px] text-[#525866] dark:text-gray-400 shrink-0" />
                    {!footerCollapsed && <span className="truncate">Settings</span>}
                  </button>
                </div>

                {!footerCollapsed && (
                  <div className="px-2.5 pt-4 pb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#6B7280] dark:text-gray-400">
                    ACCOUNT
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setActivePage('profile')}
                  title={`${userProfile.name} — ${userProfile.role}`}
                  className={`w-full flex items-center ${
                    footerCollapsed ? 'justify-center mt-3 px-0' : 'gap-3 px-2'
                  } py-1.5 rounded-xl hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-colors text-left cursor-pointer`}
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
                  {!footerCollapsed && (
                    <div className="min-w-0">
                      <div className="text-[14px] font-semibold text-[#1C1D21] dark:text-[#F3F4F6] leading-snug truncate">
                        {userProfile.name}
                      </div>
                      <div className="text-[12.5px] text-[#6B7280] dark:text-gray-400 leading-snug truncate">
                        {userProfile.role}
                      </div>
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </UiDocSection>

      {/* SECTION 3: Crisp Concentric Content Frame Corners */}
      <UiDocSection
        id="shl-concentric-frame"
        title="Crisp Concentric Content Frame Corners"
        description="Memperbaiki tampilan sudut konten bagian dalam (<main>) yang tampak buram/tidak jelas tanpa mengubah sudut wadah luar (.app-shell-container). Kunci perbaikannya: radius konsentris r_inner = r_outer - margin (28px - 10px = 18px), header solid tanpa backdrop-blur-sm, border solid #E4E7EE, serta bg-clip-padding isolate."
        classesHint="rounded-[14px] sm:rounded-[16px] md:rounded-[18px] border border-[#E4E7EE] bg-clip-padding isolate overflow-hidden (Header: bg-white solid)"
        codeSnippet={`{/* Outer Shell (unchanged): rounded-[28px] */}
<div className="rounded-[28px] bg-white overflow-hidden flex">
  <Sidebar />
  {/* Inner Content Panel: concentric 18px radius (28px - 10px margin), solid hairline border, zero blur smear */}
  <main className="flex-1 m-2.5 rounded-[18px] bg-white dark:bg-[#121418] border border-[#E4E7EE] dark:border-white/[0.10] overflow-hidden isolate bg-clip-padding">
    <header className="h-16 bg-white dark:bg-[#121418] border-b border-[#E4E7EE]">
      {/* Solid header prevents Chromium backdrop-blur rounded corner haze */}
    </header>
  </main>
</div>`}
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-gray-100 dark:bg-[#1B1E24] border border-gray-200 dark:border-white/[0.08]">
              <button
                type="button"
                onClick={() => setCornerMode('crisp')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  cornerMode === 'crisp'
                    ? 'bg-white dark:bg-[#121418] text-gray-900 dark:text-white shadow-2xs'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Sesudah: Sudut Konten Tajam (18px)
              </button>
              <button
                type="button"
                onClick={() => setCornerMode('hazy')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  cornerMode === 'hazy'
                    ? 'bg-white dark:bg-[#121418] text-gray-900 dark:text-white shadow-2xs'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Sebelum: Sudut Buram (24px + Blur)
              </button>
            </div>
            <span className="inline-flex items-center gap-1.5 text-[11.5px] font-mono text-gray-600 dark:text-gray-400">
              <CornerUpLeft className="w-3.5 h-3.5 text-[#ee2e65]" />
              Outer 28px − Inset 10px = Inner 18px
            </span>
          </div>

          {/* Magnified Top-Left & Top-Right Corner Preview */}
          <div className="p-4 rounded-2xl bg-[#E8E9F0] dark:bg-[#0B0D10]">
            <div className="relative rounded-[28px] bg-white dark:bg-[#16191F] p-2.5 border border-white/80 dark:border-white/[0.08] overflow-hidden">
              <div
                aria-hidden="true"
                style={{
                  backgroundColor: '#ECE7FF',
                  maskImage: SHELL_TINT_MASK_LIGHT,
                  WebkitMaskImage: SHELL_TINT_MASK_LIGHT,
                }}
                className="pointer-events-none absolute inset-0 dark:opacity-20"
              />
              <div
                className={`relative z-10 overflow-hidden transition-all duration-200 ${
                  cornerMode === 'crisp'
                    ? 'rounded-[18px] bg-white dark:bg-[#121418] border border-[#E4E7EE] dark:border-white/[0.12] isolate bg-clip-padding'
                    : 'rounded-[24px] bg-white dark:bg-[#121418] border border-black/[0.12] dark:border-white/[0.08] shadow-[0_2px_20px_rgba(0,0,0,0.03)]'
                }`}
              >
                <div
                  className={`h-14 px-5 border-b flex items-center justify-between text-xs ${
                    cornerMode === 'crisp'
                      ? 'bg-white dark:bg-[#121418] border-[#E4E7EE] dark:border-white/[0.08]'
                      : 'bg-white/80 dark:bg-[#121418]/85 backdrop-blur-sm border-black/[0.12] dark:border-white/[0.08]'
                  }`}
                >
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    UI KIT &gt; 10. Layout &gt; App Shell &amp; Sidebar
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                      cornerMode === 'crisp'
                        ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                        : 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300'
                    }`}
                  >
                    {cornerMode === 'crisp' ? 'Crisp 18px + Solid Header' : 'Hazy 24px + backdrop-blur-sm'}
                  </span>
                </div>
                <div className="p-5 grid sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#16191F] border border-gray-200 dark:border-white/[0.08]">
                    <div className="font-semibold text-gray-900 dark:text-gray-100 mb-1">1. Concentric Radius</div>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      Mengunci sudut dalam ke <code className="font-mono">18px</code> agar sejajar sempurna dengan outer shell <code className="font-mono">28px</code> (jarak 10px).
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#16191F] border border-gray-200 dark:border-white/[0.08]">
                    <div className="font-semibold text-gray-900 dark:text-gray-100 mb-1">2. Solid Header Surface</div>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      Menghapus <code className="font-mono">backdrop-blur-sm</code> pada header agar tidak memicu halo buram di sudut melengkung Chromium.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#16191F] border border-gray-200 dark:border-white/[0.08]">
                    <div className="font-semibold text-gray-900 dark:text-gray-100 mb-1">3. Crisp Solid Border</div>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      Mengganti border alpha &amp; bayangan pudar dengan <code className="font-mono">border-[#E4E7EE] bg-clip-padding isolate</code>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </UiDocSection>

      {/* SECTION 4: Portrait Glass Profile Card */}
      <UiDocSection
        id="shl-profile-card"
        title="Portrait Glass Profile Card"
        description="Kartu profil potret full-bleed dengan bingkai konsentris (42px luar / 32px dalam), efek progressive blur halus tanpa bocor sudut, menampilkan Nama + lencana verifikasi, Email di bawahnya, satu Role tertinggi, serta tombol Change untuk mengganti foto profil."
        classesHint="rounded-[42px] p-[10px] / inner rounded-[32px] clip-path: inset(0 round 32px) / masked blur-[18px] scale-[1.12]"
        codeSnippet={`<ProfileCard
  name="User"
  email="user@designsystem.app"
  role="Role"
  avatarSrc={userProfile.avatarSrc}
  verified
  bezel="dark"
  onAvatarSelect={(dataUrl) => updateUserProfile({ avatarSrc: dataUrl })}
/>`}
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-gray-100 dark:bg-[#1B1E24] border border-gray-200 dark:border-white/[0.08]">
              <button
                type="button"
                onClick={() => setCardBezelPreview('dark')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  cardBezelPreview === 'dark'
                    ? 'bg-white dark:bg-[#121418] text-gray-900 dark:text-white shadow-2xs'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Dark Bezel Frame
              </button>
              <button
                type="button"
                onClick={() => setCardBezelPreview('light')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  cardBezelPreview === 'light'
                    ? 'bg-white dark:bg-[#121418] text-gray-900 dark:text-white shadow-2xs'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Light Bezel Frame
              </button>
            </div>
            <button
              type="button"
              onClick={() => setActivePage('profile')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1C1D21] dark:bg-white text-white dark:text-[#121418] text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
            >
              <span>Lihat di Halaman Profile</span>
            </button>
          </div>

          <div className="p-6 sm:p-8 rounded-2xl bg-[#16171B] dark:bg-[#0B0D10] border border-black/15 dark:border-white/[0.08] flex items-center justify-center">
            <ProfileCard
              name={userProfile.name}
              email={userProfile.email}
              role={userProfile.role}
              avatarSrc={userProfile.avatarSrc}
              initials={userProfile.initials}
              verified={userProfile.verified}
              bezel={cardBezelPreview}
              onChangeClick={() => setActivePage('profile')}
            />
          </div>
        </div>
      </UiDocSection>
    </UiDocPage>
  );
};
