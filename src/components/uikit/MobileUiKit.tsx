import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Bell,
  MessageSquare,
  Search,
  Library,
  Calendar,
  BookOpen,
  Users,
  Award,
  Layers,
  Plus,
  Download,
  CheckCheck,
  ArrowLeft,
  BarChart2,
  Save,
  RefreshCw,
  X,
  CheckCircle2,
  Sparkles,
  FileText,
  Palette,
  FormInput,
  Table2,
  Smartphone,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { UiDocPage, UiDocSection } from './UiDocBlock';
import { MobileNavUiKitDemo } from './MobileNavUiKitDemo';
import { SplitFilterButton } from '../ui/SplitFilterButton';
import { HorizontalSlideTrack } from '../ui/HorizontalSlideTrack';
import { ElasticPullToRefresh } from '../ui/ElasticPullToRefresh';
import { useBottomSheetMotion } from '../../hooks/useBottomSheetMotion';
import { PASTEL_THEMES } from '../../constants/theme';

interface MobileUiKitProps {
  activeSubJump: string;
}

export const MobileUiKit: React.FC<MobileUiKitProps> = ({ activeSubJump }) => {
  const { triggerToast } = useApp();

  // 1. Mobile Header Demo State
  const [headerMode, setHeaderMode] = useState<'utilities' | 'dataentry' | 'datadisplay' | 'tables'>('utilities');

  // 3. Mobile Split Filter Demo State
  const [demoClass, setDemoClass] = useState('All');
  const [demoStatus, setDemoStatus] = useState('All');
  const [demoType, setDemoType] = useState('All');

  // 4. Mobile Hairline List Preview State
  const [hairlineMode, setHairlineMode] = useState<'mobile' | 'desktop'>('mobile');

  // 5. Mobile Bottom Sheet Demo State
  const [sheetOpen, setSheetOpen] = useState(false);
  const { setSheetElement, backdropRef, animateClose, sheetGestureProps } = useBottomSheetMotion({
    onClose: () => setSheetOpen(false),
  });

  // 6. Mobile Gestures & Slide Demo State
  const [ptrDemoSeq, setPtrDemoSeq] = useState(0);
  const [slideMonth, setSlideMonth] = useState('Feb');
  const [transitionTab, setTransitionTab] = useState(0);
  const [transitionDir, setTransitionDir] = useState<1 | -1>(1);
  const [depthPullDemo, setDepthPullDemo] = useState(false);

  // 7. Mobile Notification Popover Demo State
  const [notifTab, setNotifTab] = useState<'All' | 'Unread'>('All');
  const [demoNotifs, setDemoNotifs] = useState([
    {
      id: 'mn-1',
      title: 'Quiz 3 Grade Published',
      desc: 'Class 302 Calculus results are now available for review.',
      time: '5m ago',
      unread: true,
      theme: 'periwinkle' as const,
    },
    {
      id: 'mn-2',
      title: 'Parent Message Received',
      desc: 'Mrs. Anderson sent an excuse note for tomorrow.',
      time: '24m ago',
      unread: true,
      theme: 'peach' as const,
    },
    {
      id: 'mn-3',
      title: 'Lesson Slides Approved',
      desc: 'Unit 4: Derivatives slides marked Ready to Teach.',
      time: '2h ago',
      unread: false,
      theme: 'mint' as const,
    },
  ]);

  const headerPageMeta = {
    utilities: { title: 'Grid', category: '1. Utilities', icon: Palette },
    dataentry: { title: 'Buttons', category: '3. Data Entry', icon: FormInput },
    datadisplay: { title: 'Accordion', category: '2. Data Display', icon: Layers },
    tables: { title: 'Data Tables', category: '5. Tables', icon: Table2 },
  };
  const ActiveHeaderIcon = headerPageMeta[headerMode].icon;

  const filteredDemoNotifs = demoNotifs.filter((n) => notifTab === 'All' || n.unread);
  const unreadDemoCount = demoNotifs.filter((n) => n.unread).length;

  return (
    <div className="space-y-8">
      {/* 1. Mobile Header */}
      {activeSubJump === 'Mobile Header' && (
          <UiDocPage
          title="Mobile Header"
          description="Header responsif khusus UI KIT tanpa breadcrumb di mobile: menampilkan ikon kategori + nama komponen pada layar kecil, serta breadcrumb UI KIT > Kategori > Komponen di desktop."
          subLinks={[
            { id: 'mhd-overview', label: 'Category Header vs Inner Breadcrumb' },
            { id: 'mhd-inner', label: 'Breadcrumb Removal Rule (Mobile vs Tablet/PC)' },
            { id: 'mhd-subbar', label: 'Right-Aligned Sub-Header Action Bar' },
          ]}
        >
          <UiDocSection
            id="mhd-overview"
            title="Category Header vs Inner Breadcrumb"
            classesHint="h-16 px-4 border-b bg-white/80 / flex md:hidden items-center gap-2"
            codeSnippet={`{/* Mobile Header (< 768px) */}\n<div className="flex md:hidden items-center gap-2 min-w-0">\n  <CategoryIcon className="w-[18px] h-[18px] text-[#ee2e65] shrink-0" />\n  <h1 className="text-[17px] font-semibold truncate">{uiSubJump}</h1>\n</div>\n\n{/* Desktop Header (>= 768px) */}\n<nav className="hidden md:flex items-center gap-2 text-[13px]">\n  <span>UI KIT</span> <ChevronRight /> <span>{category}</span> <ChevronRight /> <span>{uiSubJump}</span>\n</nav>`}
          >
            <div className="space-y-4">
              <div className="flex flex-wrap gap-1.5">
                {(['utilities', 'dataentry', 'datadisplay', 'tables'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setHeaderMode(m)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      headerMode === m
                        ? 'bg-[#ee2e65] text-white shadow-xs'
                        : 'bg-[#F4F5F8] text-[#6E717A] hover:text-[#1C1D21]'
                    }`}
                  >
                    {headerPageMeta[m].category}
                  </button>
                ))}
              </div>

              <div className="bg-[#E8EAEE] rounded-2xl p-4 sm:p-6 flex justify-center">
                <div className="w-full max-w-[375px] bg-white rounded-[24px] shadow-md border border-black/[0.06] overflow-hidden">
                  {/* Simulated Mobile Top Header */}
                  <div className="h-16 px-4 border-b border-black/[0.06] flex items-center justify-between gap-3 bg-white">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-[#FEF1F5] text-[#ee2e65] flex items-center justify-center shrink-0">
                        <ActiveHeaderIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="block text-[10.5px] font-semibold uppercase tracking-wider text-[#8A8D98] leading-tight">
                          UI KIT · {headerPageMeta[headerMode].category.replace(/^\d+\.\s*/, '')}
                        </span>
                        <span className="block text-[16px] font-semibold tracking-tight text-[#1C1D21] truncate leading-tight">
                          {headerPageMeta[headerMode].title}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => triggerToast('UI KIT Updates', 'Membuka panel pembaruan komponen.', 'info')}
                        className="w-9 h-9 rounded-full border border-black/[0.07] flex items-center justify-center text-[#1C1D21] relative cursor-pointer"
                      >
                        <Bell className="w-4 h-4" />
                        <span className="min-w-[16px] h-[16px] px-1 rounded-full bg-[#EF4444] text-white text-[9.5px] font-bold flex items-center justify-center absolute -top-1 -right-1 ring-2 ring-white tabular-nums">
                          3
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => triggerToast('Search UI KIT', 'Membuka pencarian cepat komponen.', 'info')}
                        className="w-9 h-9 rounded-full border border-black/[0.07] flex items-center justify-center text-[#1C1D21] cursor-pointer"
                      >
                        <Search className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Simulated Body Below Mobile Header */}
                  <div className="p-4 space-y-3 bg-white">
                    <div className="flex items-center justify-end gap-2">
                      <span className="mr-auto px-2.5 py-1 rounded-full bg-[#FEF1F5] text-[#9D113C] text-[11px] font-bold">
                        Token v2.4
                      </span>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full border border-black/[0.09] text-xs font-medium text-[#1C1D21] whitespace-nowrap shrink-0"
                      >
                        <Download className="w-3.5 h-3.5 text-gray-500" />
                        <span>PDF</span>
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-[#ee2e65] hover:bg-[#d82256] text-white text-xs font-medium whitespace-nowrap shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </button>
                    </div>
                    <div className="h-14 rounded-2xl bg-[#F4F5F8] border border-black/[0.04] flex items-center justify-center text-[11.5px] text-[#8A8D98]">
                      Konten UI KIT tampil bersih tanpa duplikasi judul
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </UiDocSection>

          <UiDocSection
            id="mhd-inner"
            title="Breadcrumb Removal Rule (Mobile vs Tablet/PC)"
            classesHint="flex md:hidden (Icon + Title) | hidden md:flex (Breadcrumb)"
            codeSnippet={`{/* Mobile: Category Title */}\n<div className="flex md:hidden items-center gap-2 min-w-0">\n  <Icon className="w-[18px] h-[18px] text-[#ee2e65]" />\n  <h1 className="text-[17px] font-semibold truncate">{uiSubJump}</h1>\n</div>\n\n{/* Tablet & PC: Breadcrumb */}\n<nav className="hidden md:flex items-center gap-2 text-[13px]">\n  <span>UI KIT</span> <ChevronRight /> <span>{category}</span> <ChevronRight /> <span>{uiSubJump}</span>\n</nav>`}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-4 rounded-xl bg-[#FAFBFD] border border-black/[0.05] space-y-1.5">
                <div className="font-semibold text-[#1C1D21]">Mobile (&lt; 768px)</div>
                <p className="text-[#6E717A] leading-relaxed">
                  Sidebar &amp; breadcrumb disembunyikan. Header menampilkan ikon kategori + nama komponen aktif secara ringkas untuk menghindari dua baris judul yang sempit.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#FAFBFD] border border-black/[0.05] space-y-1.5">
                <div className="font-semibold text-[#1C1D21]">Tablet &amp; PC (&ge; 768px)</div>
                <p className="text-[#6E717A] leading-relaxed">
                  Sidebar kiri menampilkan seluruh kategori, dan header menampilkan breadcrumb animasi <code className="px-1 py-0.5 rounded bg-gray-100">UI KIT &gt; Kategori &gt; Komponen</code>.
                </p>
              </div>
            </div>
          </UiDocSection>

          <UiDocSection
            id="mhd-subbar"
            title="Right-Aligned Sub-Header Action Bar"
            classesHint="flex items-center justify-end gap-2.5 w-full md:w-auto"
            codeSnippet={`<div className="flex items-center justify-end gap-2.5 w-full md:w-auto">\n  <button className={ACTION_BTN_SECONDARY}>...</button>\n  <button className={ACTION_BTN_PRIMARY}>...</button>\n</div>`}
          >
            <div className="max-w-[375px] bg-[#FAFBFD] p-3.5 rounded-2xl border border-black/[0.05]">
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => triggerToast('Export Tokens', 'Mengunduh konfigurasi JSON token.', 'success')}
                  className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full border border-black/[0.09] bg-white text-xs font-medium text-[#1C1D21] whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>JSON</span>
                </button>
                <button
                  type="button"
                  onClick={() => triggerToast('New Token', 'Menambahkan varian token baru.', 'info')}
                  className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-[#ee2e65] hover:bg-[#d82256] text-white text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Generate</span>
                </button>
              </div>
            </div>
          </UiDocSection>
        </UiDocPage>
      )}

      {/* 2. Mobile Bottom Dock */}
      {activeSubJump === 'Mobile Bottom Dock' && <MobileNavUiKitDemo />}

      {/* 3. Mobile Split Filters */}
      {activeSubJump === 'Mobile Split Filters' && (
        <UiDocPage
          title="Mobile Split Filters"
          description="Split Button filter pengganti deretan pill panjang: klik sisi kiri untuk berpindah cepat ke opsi berikutnya, klik panah kanan untuk membuka dropdown lengkap."
          subLinks={[
            { id: 'msf-variants', label: 'Variant Styles (Dark / Primary / Surface)' },
            { id: 'msf-badges', label: 'Status Split with Count Badges' },
          ]}
        >
          <UiDocSection
            id="msf-variants"
            title="Split Filter Button Variants"
            classesHint="SplitFilterButton variant='dark' | 'primary' | 'surface' (1 kata di mobile, prefix di desktop)"
            codeSnippet={`<SplitFilterButton\n  value={selectedClass}\n  onChange={setSelectedClass}\n  prefix="Kelas"\n  icon={Users}\n  variant="dark"\n  options={[\n    { value: 'All', label: 'Semua', mobileLabel: 'Semua' },\n    { value: '302', label: 'Class 302', mobileLabel: '302' },\n  ]}\n/>`}
          >
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <SplitFilterButton
                  value={demoClass}
                  onChange={setDemoClass}
                  prefix="Kelas"
                  icon={Users}
                  variant="dark"
                  options={[
                    { value: 'All', label: 'Semua', mobileLabel: 'Semua' },
                    { value: '302', label: 'Class 302', mobileLabel: '302' },
                    { value: '303', label: 'Class 303', mobileLabel: '303' },
                    { value: '304', label: 'Class 304', mobileLabel: '304' },
                    { value: '305', label: 'Class 305', mobileLabel: '305' },
                  ]}
                />

                <SplitFilterButton
                  value={demoType}
                  onChange={setDemoType}
                  prefix="Tipe"
                  icon={Layers}
                  variant="surface"
                  options={[
                    { value: 'All', label: 'Semua Tipe', mobileLabel: 'Semua' },
                    { value: 'video', label: 'Video', mobileLabel: 'Video' },
                    { value: 'document', label: 'Dokumen', mobileLabel: 'Dokumen' },
                    { value: 'slides', label: 'Slides', mobileLabel: 'Slides' },
                    { value: 'lab', label: 'Lab', mobileLabel: 'Lab' },
                  ]}
                />
              </div>

              <div className="text-xs text-[#6E717A] bg-[#FAFBFD] px-3.5 py-2.5 rounded-xl border border-black/[0.04]">
                Kelas aktif: <strong className="text-[#1C1D21]">{demoClass}</strong> · Tipe aktif:{' '}
                <strong className="text-[#1C1D21]">{demoType}</strong> — klik sisi kiri untuk beralih cepat, atau tekan panah untuk memilih dari daftar.
              </div>
            </div>
          </UiDocSection>

          <UiDocSection
            id="msf-badges"
            title="Status Split Filter with KPI Count Badges"
            classesHint="variant='primary' + options[].badge + options[].badgeClassName"
            codeSnippet={`<SplitFilterButton\n  value={status}\n  onChange={setStatus}\n  prefix="Status"\n  icon={Award}\n  variant="primary"\n  options={[\n    { value: 'All', label: 'All', mobileLabel: 'All', badge: 10, badgeClassName: 'bg-[#FEF1F5] text-[#9D113C]' },\n    { value: 'Honor Roll', label: 'Honor Roll', mobileLabel: 'Honor', badge: 4, badgeClassName: 'bg-[#E6F9F0] text-[#146C43]' },\n  ]}\n/>`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <SplitFilterButton
                value={demoStatus}
                onChange={setDemoStatus}
                prefix="Status"
                icon={Award}
                variant="primary"
                options={[
                  {
                    value: 'All',
                    label: 'All',
                    mobileLabel: 'All',
                    badge: 10,
                    badgeClassName: 'bg-[#FEF1F5] text-[#9D113C]',
                  },
                  {
                    value: 'Honor Roll',
                    label: 'Honor Roll',
                    mobileLabel: 'Honor',
                    badge: 4,
                    badgeClassName: 'bg-[#E6F9F0] text-[#146C43]',
                  },
                  {
                    value: 'Active',
                    label: 'Active',
                    mobileLabel: 'Active',
                    badge: 5,
                    badgeClassName: 'bg-[#F4F5F8] text-[#1C1D21]',
                  },
                  {
                    value: 'Needs Support',
                    label: 'Needs Support',
                    mobileLabel: 'Support',
                    badge: 1,
                    badgeClassName: 'bg-[#FFECEB] text-[#942922]',
                  },
                ]}
              />

              <span className="text-xs text-[#6E717A]">
                Status terpilih: <strong className="text-[#9D113C]">{demoStatus}</strong>
              </span>
            </div>
          </UiDocSection>
        </UiDocPage>
      )}

      {/* 4. Mobile Compact Buttons */}
      {activeSubJump === 'Mobile Compact Buttons' && (
        <UiDocPage
          title="Mobile Compact Buttons"
          description="Standar tombol & daftar mobile: setiap CTA utama memakai Primary Rose (#ee2e65), ketinggian seragam h-9, Ikon + 1 Kata singkat di layar kecil tanpa membungkus baris, serta daftar garis tipis di mobile."
          subLinks={[
            { id: 'mbtn-oneword', label: 'Icon + 1-Word Action Set' },
            { id: 'mbtn-badges', label: 'Compact Status & Metric Pills' },
            { id: 'mlt-hairline-table', label: 'Mobile Hairline List vs Desktop Table' },
          ]}
        >
          <UiDocSection
            id="mbtn-oneword"
            title="Icon + 1-Word Action Set"
            classesHint="inline-flex items-center gap-1.5 h-9 px-3.5 sm:px-4 rounded-full whitespace-nowrap shrink-0 bg-[#ee2e65]"
            codeSnippet={`<button className="inline-flex items-center gap-1.5 h-9 px-3.5 sm:px-4 rounded-full bg-[#ee2e65] hover:bg-[#d82256] text-white text-[13px] font-medium whitespace-nowrap shrink-0">\n  <Plus className="w-4 h-4 shrink-0" />\n  <span className="sm:hidden">Create</span>\n  <span className="hidden sm:inline">Create Component</span>\n</button>`}
          >
            <div className="flex flex-wrap items-center gap-2.5">
              {[
                { label: 'Create', icon: Plus, style: 'bg-[#ee2e65] text-white hover:bg-[#d82256]' },
                { label: 'Add', icon: Plus, style: 'bg-[#ee2e65] text-white hover:bg-[#d82256]' },
                { label: 'Save', icon: Save, style: 'bg-[#ee2e65] text-white hover:bg-[#d82256]' },
                { label: 'Export', icon: Download, style: 'bg-white text-[#1C1D21] border border-black/[0.09] hover:bg-[#FAFBFD]' },
                { label: 'CSV', icon: FileText, style: 'bg-white text-[#1C1D21] border border-black/[0.09] hover:bg-[#FAFBFD]' },
                { label: 'Statistics', icon: BarChart2, style: 'bg-white text-[#1C1D21] border border-black/[0.09] hover:bg-[#FAFBFD]' },
                { label: 'Read', icon: CheckCheck, style: 'bg-[#FEF1F5] text-[#9D113C] border border-[#FBC2D4]/70 hover:bg-[#FDE0E9]' },
                { label: 'Back', icon: ArrowLeft, style: 'bg-[#F4F5F8] text-[#1C1D21] hover:bg-gray-200/70' },
              ].map((btn) => {
                const Icon = btn.icon;
                return (
                  <button
                    key={btn.label}
                    type="button"
                    onClick={() => triggerToast(btn.label, `Tombol mobile "${btn.label}" ditekan.`, 'info')}
                    className={`inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-full text-[13px] font-medium transition-colors active:scale-95 whitespace-nowrap shrink-0 cursor-pointer ${btn.style}`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{btn.label}</span>
                  </button>
                );
              })}
            </div>
          </UiDocSection>

          <UiDocSection
            id="mbtn-badges"
            title="Compact Mobile Inline Badges"
            classesHint="px-2.5 py-1 rounded-full text-[11.5px] font-bold"
            codeSnippet={`<span className="px-2.5 py-1 rounded-full bg-[#FFF5E6] text-[#8C5811] text-[11.5px] font-bold">Avg 93%</span>`}
          >
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-2.5 py-1 rounded-full bg-[#FFF5E6] text-[#8C5811] text-[11.5px] font-bold tabular-nums">
                Avg 93%
              </span>
              <span className="px-2.5 py-1 rounded-full bg-[#FFECEB] text-[#942922] text-[11.5px] font-bold tabular-nums">
                4 Unread
              </span>
              <span className="px-2.5 py-1 rounded-full bg-[#E6F9F0] text-[#146C43] text-[11.5px] font-bold tabular-nums">
                4 Honor
              </span>
              <span className="px-2.5 py-1 rounded-full bg-[#FEF1F5] text-[#9D113C] text-[11.5px] font-bold tabular-nums">
                10 Total
              </span>
            </div>
          </UiDocSection>

          <UiDocSection
            id="mlt-hairline-table"
            title="Mobile Hairline List vs Desktop Table"
            description="Pada layar kecil (< 768px), tabel lebar diganti daftar garis tipis tanpa kartu berat (divide-y divide-black/[0.06]) yang merender langsung di kanvas putih."
            classesHint="md:hidden divide-y divide-black/[0.06] | hidden md:block rounded-2xl border overflow-hidden"
            codeSnippet={`{/* Mobile Hairline List */}\n<div className="md:hidden divide-y divide-black/[0.06]">\n  {rows.map(r => (\n    <div className="py-3 flex items-center justify-between gap-3">\n      <div className="flex items-center gap-2.5 min-w-0">...</div>\n      <span className="text-xs font-bold tabular-nums">{r.score}</span>\n    </div>\n  ))}\n</div>`}
            actions={
              <div className="inline-flex bg-gray-100 p-0.5 rounded-lg text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setHairlineMode('mobile')}
                  className={`px-2.5 py-1 rounded-md cursor-pointer transition-all ${
                    hairlineMode === 'mobile' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-500'
                  }`}
                >
                  Mobile List
                </button>
                <button
                  type="button"
                  onClick={() => setHairlineMode('desktop')}
                  className={`px-2.5 py-1 rounded-md cursor-pointer transition-all ${
                    hairlineMode === 'desktop' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-500'
                  }`}
                >
                  Desktop Table
                </button>
              </div>
            }
          >
            {hairlineMode === 'mobile' ? (
              <div className="max-w-sm mx-auto bg-white rounded-[22px] border border-black/[0.06] px-4 py-1 divide-y divide-black/[0.06]">
                {[
                  { init: 'SA', name: 'Sarah Anderson', sub: 'Token Layout · 14 Sep', val: '96%', tone: 'bg-[#E6F9F0] text-[#146C43]' },
                  { init: 'JW', name: 'James Wilson', sub: 'Motion Spec · 15 Sep', val: '92%', tone: 'bg-[#FEF1F5] text-[#9D113C]' },
                  { init: 'EC', name: 'Emily Carter', sub: 'Grid Audit · 16 Sep', val: '85%', tone: 'bg-[#FFF5E6] text-[#8C5811]' },
                ].map((item) => (
                  <div key={item.name} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-[#FEF1F5] text-[#9D113C] text-[11px] font-bold flex items-center justify-center shrink-0">
                        {item.init}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[13px] font-semibold text-[#1C1D21] truncate">{item.name}</div>
                        <div className="text-[11px] text-[#8A8D98] truncate">{item.sub}</div>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold tabular-nums shrink-0 ${item.tone}`}>
                      {item.val}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-gray-200 overflow-x-auto bg-white text-xs">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
                    <tr>
                      <th className="py-2.5 px-3.5 font-semibold">Reviewer</th>
                      <th className="py-2.5 px-3.5 font-semibold">Scope</th>
                      <th className="py-2.5 px-3.5 font-semibold text-right">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 tabular-nums">
                    <tr>
                      <td className="py-2.5 px-3.5 font-semibold text-gray-900">Sarah Anderson</td>
                      <td className="py-2.5 px-3.5 text-gray-600">Token Layout · 14 Sep</td>
                      <td className="py-2.5 px-3.5 text-right font-bold text-[#146C43]">96%</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3.5 font-semibold text-gray-900">James Wilson</td>
                      <td className="py-2.5 px-3.5 text-gray-600">Motion Spec · 15 Sep</td>
                      <td className="py-2.5 px-3.5 text-right font-bold text-[#9D113C]">92%</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3.5 font-semibold text-gray-900">Emily Carter</td>
                      <td className="py-2.5 px-3.5 text-gray-600">Grid Audit · 16 Sep</td>
                      <td className="py-2.5 px-3.5 text-right font-bold text-[#8C5811]">85%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </UiDocSection>
        </UiDocPage>
      )}

      {/* 5. Mobile Bottom Sheet */}
      {activeSubJump === 'Mobile Bottom Sheet' && (
        <UiDocPage
          title="Mobile Bottom Sheet"
          description="Panel lembaran bawah khusus mobile dengan handle seret (swipe-down to dismiss), animasi spring lembut, dan tombol tutup X."
          subLinks={[{ id: 'mbs-interactive', label: 'Interactive Swipeable Bottom Sheet' }]}
        >
          <UiDocSection
            id="mbs-interactive"
            title="Interactive Swipeable Bottom Sheet"
            classesHint="rounded-t-[28px] shadow-2xl animate-bottom-sheet / useBottomSheetMotion"
            codeSnippet={`const { setSheetElement, backdropRef, animateClose, sheetGestureProps } = useBottomSheetMotion({ onClose });\n\n<div ref={backdropRef} data-modal-sheet-backdrop="true" className="fixed inset-0 z-50 flex items-end">\n  <div ref={setSheetElement} {...sheetGestureProps} className="w-full bg-white rounded-t-[28px] p-5 animate-bottom-sheet">\n    <div data-sheet-handle="true" className="w-10 h-1 bg-black/15 rounded-full mx-auto" />\n    ...\n  </div>\n</div>`}
          >
            <div className="bg-[#E8EAEE] rounded-2xl p-5 sm:p-6 flex flex-col items-center gap-4">
              <div className="w-full max-w-[340px] bg-white rounded-[26px] p-4 space-y-3 shadow-lg border border-black/[0.06]">
                <div className="flex justify-center">
                  <div className="w-10 h-1 bg-black/15 rounded-full animate-sheet-handle" />
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-[#FEF1F5] text-[#9D113C] flex items-center justify-center font-bold text-xs">
                      UI
                    </div>
                    <div>
                      <div className="text-[13.5px] font-semibold text-[#1C1D21]">Component Sheet</div>
                      <div className="text-[11px] text-[#8A8D98]">Tarik handle ke bawah untuk menutup</div>
                    </div>
                  </div>
                  <span className="w-7 h-7 rounded-full bg-[#F4F5F8] flex items-center justify-center text-[#6E717A]">
                    <X className="w-3.5 h-3.5" />
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-2xl bg-[#E6F9F0] text-[#146C43] font-semibold">
                    Tokens · 96%
                  </div>
                  <div className="p-2.5 rounded-2xl bg-[#FEF1F5] text-[#9D113C] font-semibold">
                    Coverage · 92.4%
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSheetOpen(true)}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-[#ee2e65] hover:bg-[#d82256] text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Buka Live Bottom Sheet</span>
              </button>
            </div>

            {sheetOpen &&
              createPortal(
                <div
                  ref={backdropRef}
                  data-modal-sheet-backdrop="true"
                  className="animate-ui-fade fixed inset-0 z-[9999] bg-black/35 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
                >
                  <div
                    ref={setSheetElement}
                    {...sheetGestureProps}
                    className="w-full sm:max-w-md bg-white rounded-t-[28px] sm:rounded-[28px] p-5 sm:p-6 shadow-2xl space-y-4 animate-bottom-sheet"
                  >
                    <div
                      data-sheet-handle="true"
                      className="flex justify-center py-2 -mt-2 cursor-grab active:cursor-grabbing touch-none sm:hidden"
                    >
                      <div className="w-10 h-1 bg-black/15 rounded-full animate-sheet-handle" />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-[16px] font-semibold text-[#1C1D21]">Live Mobile Bottom Sheet</h3>
                        <p className="text-[12px] text-[#8A8D98]">
                          Tarik handle ke bawah di layar sentuh atau tekan Tutup.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={animateClose}
                        aria-label="Close sheet"
                        className="w-8 h-8 rounded-full hover:bg-[#F4F5F8] flex items-center justify-center text-[#6E717A] cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-[#FAFBFD] border border-black/[0.05] text-xs text-[#5A5D67] leading-relaxed">
                      Sheet ini memakai hook <code className="px-1 py-0.5 rounded bg-gray-100">useBottomSheetMotion</code> untuk mendukung gestur seret ke bawah secara halus dengan akselerasi spring.
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={animateClose}
                        className="h-9 px-4 rounded-full bg-[#ee2e65] hover:bg-[#d82256] text-white text-xs font-semibold cursor-pointer"
                      >
                        Tutup
                      </button>
                    </div>
                  </div>
                </div>,
                document.body
              )}
          </UiDocSection>
        </UiDocPage>
      )}

      {/* 6. Mobile Gestures & Slide */}
      {activeSubJump === 'Mobile Gestures & Slide' && (
        <UiDocPage
          title="Mobile Gestures & Slide"
          description="Interaksi sentuh khusus mobile: Elastic Header Pull-to-Refresh bergaya pegas, Horizontal Slide Indicator tanpa scrollbar, serta transisi halaman arah adaptif dan Sheet Depth Pull-Back."
          subLinks={[
            { id: 'mgs-ptr', label: 'Elastic Header Pull to Refresh' },
            { id: 'mgs-slide', label: 'Horizontal Slide Indicator' },
            { id: 'mgs-transition-depth', label: 'Responsive PageTransition & Sheet Pull-Back' },
          ]}
        >
          <UiDocSection
            id="mgs-ptr"
            title="Elastic Header Pull to Refresh"
            classesHint="ElasticPullToRefresh onRefresh={...} allowDesktopMousePull"
            codeSnippet={`<ElasticPullToRefresh onRefresh={handleWorkspaceRefresh}>\n  <PageContent />\n</ElasticPullToRefresh>`}
            actions={
              <button
                type="button"
                onClick={() => setPtrDemoSeq((s) => s + 1)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FEF1F5] text-[#9D113C] text-xs font-semibold hover:bg-[#FDE0E9] cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Simulasi Pull</span>
              </button>
            }
          >
            <div className="bg-[#E8EAEE] rounded-2xl p-4 sm:p-6 flex justify-center">
              <div className="w-full max-w-[340px] h-[250px] bg-white rounded-[24px] border border-black/[0.06] shadow-md overflow-hidden flex flex-col">
                <ElasticPullToRefresh
                  allowDesktopMousePull
                  demoTriggerSeq={ptrDemoSeq}
                  onRefresh={() => triggerToast('Segarkan', 'Data mobile berhasil diperbarui.', 'success')}
                >
                  <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                    <div className="text-xs font-semibold text-[#1C1D21]">Tarik ke bawah area ini</div>
                    <div className="p-3 rounded-2xl bg-[#EEF8F3] text-xs text-[#146C43] font-medium">
                      Design Tokens · Synced
                    </div>
                    <div className="p-3 rounded-2xl bg-[#FEF1F5] text-xs text-[#9D113C] font-medium">
                      Motion Specs · 12 Categories
                    </div>
                  </div>
                </ElasticPullToRefresh>
              </div>
            </div>
          </UiDocSection>

          <UiDocSection
            id="mgs-slide"
            title="Horizontal Slide Indicator (Pengganti Scrollbar)"
            classesHint="HorizontalSlideTrack activeKey={active} accent='dark'"
            codeSnippet={`<HorizontalSlideTrack activeKey={month} accent="dark">\n  {months.map(m => <button data-slide-active={month === m}>{m}</button>)}\n</HorizontalSlideTrack>`}
          >
            <div className="max-w-sm bg-[#FAFBFD] p-4 rounded-2xl border border-black/[0.05] space-y-3">
              <HorizontalSlideTrack
                activeKey={slideMonth}
                trackClassName="inline-flex items-center gap-1.5 bg-white p-1 rounded-full border border-black/[0.06] max-w-full select-none"
                accent="dark"
              >
                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    data-slide-active={slideMonth === m ? 'true' : undefined}
                    onClick={() => setSlideMonth(m)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer ${
                      slideMonth === m ? 'bg-[#ee2e65] text-white' : 'text-[#6E717A] hover:text-[#1C1D21]'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </HorizontalSlideTrack>
              <div className="text-[11.5px] text-[#8A8D98]">
                Bulan terpilih: <strong className="text-[#1C1D21]">{slideMonth}</strong>
              </div>
            </div>
          </UiDocSection>

          <UiDocSection
            id="mgs-transition-depth"
            title="Responsive PageTransition & Sheet Pull-Back"
            description="Transisi konten adaptif menggunakan spring X-axis di mobile & Y-axis di desktop (dibungkus MotionConfig reducedMotion='user'), serta efek depth pull-back pada .app-shell-container saat Bottom Sheet aktif."
            classesHint="PageTransition transitionKey={key} directionOverride={dir} | .app-shell-container"
            codeSnippet={`<MotionConfig reducedMotion="user">\n  <PageTransition transitionKey={\`\${uiCategory}-\${uiSubJump}\`} directionOverride={dir}>\n    <Content />\n  </PageTransition>\n</MotionConfig>`}
            actions={
              <button
                type="button"
                onClick={() => setDepthPullDemo((v) => !v)}
                className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[11.5px] font-semibold cursor-pointer ${
                  depthPullDemo ? 'bg-[#ee2e65] text-white' : 'bg-[#F4F5F8] text-[#1C1D21]'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 shrink-0" />
                <span>{depthPullDemo ? 'Tutup Sheet Pull-Back' : 'Simulasi Depth Pull-Back'}</span>
              </button>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* PageTransition axis preview */}
              <div className="rounded-2xl border border-gray-200 bg-[#FAFBFD] p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#1C1D21]">Adaptive Axis Switch (Mobile X vs Desktop Y)</span>
                  <div className="flex items-center gap-1">
                    {['Grid', 'Buttons', 'Cards'].map((lbl, idx) => (
                      <button
                        key={lbl}
                        type="button"
                        onClick={() => {
                          setTransitionDir(idx >= transitionTab ? 1 : -1);
                          setTransitionTab(idx);
                        }}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold cursor-pointer transition-colors ${
                          transitionTab === idx ? 'bg-[#ee2e65] text-white' : 'bg-white text-gray-600 border border-gray-200'
                        }`}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="h-24 rounded-xl bg-white border border-gray-200 overflow-hidden relative flex items-center justify-center p-4">
                  <AnimatePresence mode="popLayout" initial={false} custom={transitionDir}>
                    <motion.div
                      key={transitionTab}
                      custom={transitionDir}
                      initial={{ opacity: 0, x: transitionDir * 24, scale: 0.985 }}
                      animate={{
                        opacity: 1,
                        x: 0,
                        scale: 1,
                        transition: {
                          x: { type: 'spring', stiffness: 400, damping: 34, mass: 0.85 },
                          opacity: { duration: 0.2 },
                        },
                      }}
                      exit={{
                        opacity: 0,
                        x: transitionDir * -20,
                        scale: 0.99,
                        transition: { duration: 0.16 },
                      }}
                      className="text-center space-y-1"
                    >
                      <div className="text-xs font-bold text-[#1C1D21]">
                        Halaman {['1. Grid System', '2. Action Buttons', '3. Pastel Cards'][transitionTab]}
                      </div>
                      <div className="text-[11px] text-[#6E717A]">
                        Spring directional transition (stiffness: 400, damping: 36)
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              {/* App Shell Depth Pull-Back Preview */}
              <div className="rounded-2xl border border-gray-200 bg-[#E8EAEE] p-4 flex items-center justify-center relative overflow-hidden min-h-[164px]">
                <div
                  className="w-full max-w-[260px] h-[132px] bg-white rounded-[20px] p-3 border border-black/[0.06] shadow-sm transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
                  style={{
                    transform: depthPullDemo ? 'scale(0.945)' : 'scale(1)',
                    filter: depthPullDemo ? 'brightness(0.88)' : 'none',
                  }}
                >
                  <div className="text-[11px] font-bold text-[#1C1D21]">.app-shell-container</div>
                  <div className="text-[10px] text-[#8A8D98] mt-1">
                    {depthPullDemo ? 'Tarik mundur (scale 0.945, brightness 0.88)' : 'Latar normal (scale 1)'}
                  </div>
                </div>
                <AnimatePresence>
                  {depthPullDemo && (
                    <motion.div
                      initial={{ y: 40, opacity: 0 }}
                      animate={{ y: 0, opacity: 1, transition: { type: 'spring', stiffness: 380, damping: 32 } }}
                      exit={{ y: 36, opacity: 0, transition: { duration: 0.16 } }}
                      className="absolute inset-x-4 bottom-2 bg-white rounded-t-[20px] p-3 shadow-xl border border-black/[0.08] flex items-center justify-between"
                    >
                      <span className="text-[11px] font-semibold text-[#1C1D21]">Bottom Sheet Aktif</span>
                      <span className="px-2 py-0.5 rounded-full bg-[#FEF1F5] text-[#ee2e65] text-[10px] font-bold">
                        Pull-Back
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </UiDocSection>
        </UiDocPage>
      )}

      {/* 7. Mobile Notifications */}
      {activeSubJump === 'Mobile Notifications' && (
        <UiDocPage
          title="Mobile Notifications"
          description="Pusat notifikasi portal edge-to-edge di mobile dan notifikasi toast yang ditempatkan di atas bottom nav bar agar tidak tertumpuk."
          subLinks={[
            { id: 'mnf-popover', label: 'Mobile Notification Center Popover' },
            { id: 'mnf-toast', label: 'Mobile Elevated Toast Position' },
          ]}
        >
          <UiDocSection
            id="mnf-popover"
            title="Mobile Notification Center Popover"
            classesHint="createPortal(..., document.body) / fixed inset-x-3 z-[9999] rounded-[24px]"
            codeSnippet={`createPortal(\n  <div style={{ top, left: 12, right: 12 }} className="fixed bg-white rounded-[24px] shadow-2xl p-4 z-[9999]">\n    <NotificationsHeader />\n    <SegmentedFilter />\n    <NotificationCards />\n  </div>,\n  document.body\n)`}
          >
            <div className="bg-[#E8EAEE] rounded-2xl p-4 sm:p-6 flex justify-center">
              <div className="w-full max-w-[352px] bg-white rounded-[24px] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.2)] border border-black/[0.08] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-semibold text-[#1C1D21]">Notifications</span>
                    {unreadDemoCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-[#FFECEB] text-[#942922] text-[10.5px] font-bold">
                        {unreadDemoCount} New
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setDemoNotifs((prev) => prev.map((n) => ({ ...n, unread: false })))
                    }
                    className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#9D113C] hover:underline cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5 shrink-0" />
                    <span>Read</span>
                  </button>
                </div>

                <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg">
                  {(['All', 'Unread'] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setNotifTab(tab)}
                      className={`flex-1 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                        notifTab === tab
                          ? 'bg-white text-gray-900 shadow-2xs font-semibold'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  {filteredDemoNotifs.map((n) => {
                    const theme = PASTEL_THEMES[n.theme] || PASTEL_THEMES.periwinkle;
                    return (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() =>
                          setDemoNotifs((prev) =>
                            prev.map((item) => (item.id === n.id ? { ...item, unread: false } : item))
                          )
                        }
                        className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-2.5 cursor-pointer ${
                          n.unread ? `${theme.bg} border-black/[0.05]` : 'bg-gray-50 border-gray-100'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                            n.unread ? theme.dot : 'bg-gray-300'
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-gray-900 truncate">{n.title}</span>
                            <span className="text-[10.5px] text-gray-400 shrink-0">{n.time}</span>
                          </div>
                          <p className="text-[11px] text-gray-600 mt-0.5 line-clamp-2">{n.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                  {filteredDemoNotifs.length === 0 && (
                    <div className="py-5 text-center text-xs text-gray-500">
                      Semua notifikasi sudah dibaca.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </UiDocSection>

          <UiDocSection
            id="mnf-toast"
            title="Mobile Elevated Toast Position"
            classesHint="fixed bottom-20 md:bottom-4 inset-x-4 sm:inset-x-auto sm:right-4 z-[9999]"
            codeSnippet={`<div className="fixed bottom-20 md:bottom-4 inset-x-4 sm:inset-x-auto sm:right-4 z-[9999]">\n  <ToastCard />\n</div>`}
          >
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => triggerToast('Berhasil Disimpan', 'Perubahan jadwal kelas tersimpan.', 'success')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-emerald-600 text-white text-xs font-semibold cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Success</span>
              </button>
              <button
                type="button"
                onClick={() => triggerToast('Info Terbaru', 'Materi baru siap ditinjau.', 'info')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#1C1D21] text-white text-xs font-semibold cursor-pointer"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Info</span>
              </button>
              <button
                type="button"
                onClick={() => triggerToast('Perhatian', 'Ada 1 siswa perlu bimbingan.', 'warning')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-amber-500 text-white text-xs font-semibold cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Warning</span>
              </button>
            </div>
          </UiDocSection>
        </UiDocPage>
      )}
    </div>
  );
};
