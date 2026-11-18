import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Search,
  Plus,
  Eye,
  FileText,
  Presentation,
  Video,
  FlaskConical,
  BookOpen,
  CheckCircle2,
  Play,
  RotateCcw,
  Share2,
  Trash2,
  X,
  Layers,
  GraduationCap,
  ExternalLink,
  Users,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  formatClassMobileLabel,
  getAvailableClassOptions,
  normalizeClassKey,
} from '../../utils/scheduleSubjects';
import {
  getCrewEntryForMaterial,
  getCrewOverallMaterialSummary,
  getCrewStatusCategory,
  getMaterialCrewSummary,
} from '../../utils/materialCrewProgress';
import { PASTEL_THEMES } from '../../constants/theme';
import {
  ACTION_BTN_DANGER_SOFT,
  ACTION_BTN_PRIMARY,
  ACTION_BTN_SECONDARY,
  ACTION_BTN_SOFT_PRIMARY,
} from '../../constants/buttonStyles';
import { ClassMaterial } from '../../types';
import { CustomSelect } from '../ui/CustomSelect';
import { useBottomSheetMotion } from '../../hooks/useBottomSheetMotion';
import { SplitFilterButton } from '../ui/SplitFilterButton';

type MaterialsViewTab = 'materials' | 'crew';
type ProgressFilterMode = 'All' | 'Completed' | 'InProgress' | 'NotStarted';

export const MaterialsPage: React.FC = () => {
  const {
    schedules,
    studentsDirectory,
    materialsList,
    selectedMaterial,
    setSelectedMaterial,
    setActiveVideoPlayer,
    setIsUploadMaterialOpen,
    handleDeleteMaterial,
    handleUpdateCrewMaterialProgress,
    handleBulkUpdateCrewMaterialProgress,
    setActivePage,
    triggerToast,
  } = useApp();

  const { setSheetElement, backdropRef, animateClose, sheetGestureProps } = useBottomSheetMotion({
    onClose: () => setSelectedMaterial(null),
  });

  const [viewTab, setViewTab] = useState<MaterialsViewTab>('materials');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [progressFilter, setProgressFilter] = useState<ProgressFilterMode>('All');
  const [sortBy, setSortBy] = useState<'latest' | 'progress' | 'title'>('latest');

  // Monitoring Crew Tab state
  const [expandedCrewId, setExpandedCrewId] = useState<string | null>(
    () => studentsDirectory[0]?.id ?? null
  );

  // Material Detail Modal -> Crew Status filter state
  const [modalCrewFilter, setModalCrewFilter] = useState<ProgressFilterMode>('All');
  const [modalCrewSearch, setModalCrewSearch] = useState('');

  const classOptions = useMemo(() => {
    const classes = getAvailableClassOptions(
      materialsList.map((m) => m.classCode),
      schedules.map((s) => s.classCode),
      studentsDirectory.map((s) => s.classCode)
    );
    return [
      { value: 'All', label: 'Semua Kelas', mobileLabel: 'Semua' },
      ...classes.map((cls) => ({
        value: cls,
        label: cls,
        mobileLabel: formatClassMobileLabel(cls),
      })),
    ];
  }, [materialsList, schedules, studentsDirectory]);

  // Overall Admin KPI across all crew-material assignments
  const overallCrewStats = useMemo(() => {
    let totalPairs = 0;
    let completedPairs = 0;
    let sumPct = 0;

    materialsList.forEach((mat) => {
      const summary = getMaterialCrewSummary(mat, studentsDirectory);
      if (summary.totalCrew > 0) {
        totalPairs += summary.totalCrew;
        completedPairs += summary.completedCount;
        sumPct += summary.avgProgress * summary.totalCrew;
      }
    });

    return {
      totalPairs,
      completedPairs,
      avgPct: totalPairs > 0 ? Math.round(sumPct / totalPairs) : 0,
    };
  }, [materialsList, studentsDirectory]);

  // Filtered Materials for "Daftar Materi" view
  const filteredMaterials = useMemo(() => {
    return materialsList
      .filter((item) => {
        const matchesClass =
          selectedClass === 'All' ||
          normalizeClassKey(item.classCode) === selectedClass;
        const matchesType =
          selectedType === 'All' || item.type.toLowerCase() === selectedType.toLowerCase();

        const summary = getMaterialCrewSummary(item, studentsDirectory);
        const allDone =
          summary.totalCrew > 0 && summary.completedCount === summary.totalCrew;

        let matchesProgress = true;
        if (progressFilter === 'Completed') {
          matchesProgress = allDone;
        } else if (progressFilter === 'InProgress') {
          matchesProgress = !allDone && summary.avgProgress > 0;
        } else if (progressFilter === 'NotStarted') {
          matchesProgress = summary.avgProgress === 0;
        }

        const matchesSearch =
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.classCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.unitName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

        return matchesClass && matchesType && matchesProgress && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'title') return a.title.localeCompare(b.title);
        if (sortBy === 'progress') {
          const sumA = getMaterialCrewSummary(a, studentsDirectory);
          const sumB = getMaterialCrewSummary(b, studentsDirectory);
          return sumB.avgProgress - sumA.avgProgress;
        }
        return 0;
      });
  }, [
    materialsList,
    studentsDirectory,
    selectedClass,
    selectedType,
    progressFilter,
    searchQuery,
    sortBy,
  ]);

  // Filtered Servolution Crew for "Monitoring Crew" view
  const filteredCrewRows = useMemo(() => {
    return studentsDirectory
      .map((student) => ({
        student,
        summary: getCrewOverallMaterialSummary(student, materialsList),
      }))
      .filter(({ student, summary }) => {
        const matchesClass =
          selectedClass === 'All' ||
          normalizeClassKey(student.classCode) === selectedClass;

        const allDone =
          summary.totalMaterials > 0 &&
          summary.completedCount === summary.totalMaterials;

        let matchesProgress = true;
        if (progressFilter === 'Completed') {
          matchesProgress = allDone;
        } else if (progressFilter === 'InProgress') {
          matchesProgress = !allDone && summary.avgProgress > 0;
        } else if (progressFilter === 'NotStarted') {
          matchesProgress = summary.avgProgress === 0;
        }

        const q = searchQuery.trim().toLowerCase();
        const matchesSearch =
          !q ||
          student.name.toLowerCase().includes(q) ||
          student.email.toLowerCase().includes(q) ||
          student.classCode.toLowerCase().includes(q) ||
          summary.assignedMaterials.some((m) => m.title.toLowerCase().includes(q));

        return matchesClass && matchesProgress && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'title') return a.student.name.localeCompare(b.student.name);
        if (sortBy === 'progress') return b.summary.avgProgress - a.summary.avgProgress;
        return 0;
      });
  }, [studentsDirectory, materialsList, selectedClass, progressFilter, searchQuery, sortBy]);

  const crewTabKpis = useMemo(() => {
    const total = filteredCrewRows.length;
    const completedAll = filteredCrewRows.filter(
      ({ summary }) =>
        summary.totalMaterials > 0 && summary.completedCount === summary.totalMaterials
    ).length;
    const avgCompletion =
      total > 0
        ? Math.round(
            filteredCrewRows.reduce((acc, row) => acc + row.summary.avgProgress, 0) / total
          )
        : 0;
    return { total, completedAll, avgCompletion };
  }, [filteredCrewRows]);

  const getTypeIcon = (type: ClassMaterial['type']) => {
    switch (type) {
      case 'document':
        return FileText;
      case 'slides':
        return Presentation;
      case 'video':
        return Video;
      case 'lab':
        return FlaskConical;
      case 'reading':
        return BookOpen;
      default:
        return FileText;
    }
  };

  const getTypeIconStyle = (type: ClassMaterial['type']) => {
    switch (type) {
      case 'video':
        return 'bg-[#FEF1F5] text-[#ee2e65]';
      case 'document':
        return 'bg-[#F0EFFC] text-[#3F3B99]';
      case 'slides':
        return 'bg-[#FFF5E6] text-[#8C5811]';
      case 'lab':
        return 'bg-[#E6F9F0] text-[#146C43]';
      case 'reading':
        return 'bg-[#FFECEB] text-[#942922]';
      default:
        return 'bg-[#F0EFFC] text-[#3F3B99]';
    }
  };

  const handleOpenMaterialDetail = (mat: ClassMaterial) => {
    setModalCrewFilter('All');
    setModalCrewSearch('');
    setSelectedMaterial(mat);
  };

  const handlePlayOrOpenMaterial = (mat: ClassMaterial) => {
    if (mat.type === 'video') {
      setActiveVideoPlayer(mat);
      return;
    }
    handleOpenMaterialDetail(mat);
  };

  return (
    <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 md:pb-6 border-b border-black/[0.05]">
        <div className="flex flex-wrap items-center gap-3">
          <div className="hidden md:flex items-center gap-2.5">
            <h1 className="text-[24px] font-semibold tracking-tight text-[#1C1D21]">
              Materi & Progress Crew
            </h1>
            {overallCrewStats.totalPairs > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-[#FEF1F5] text-[#9D113C] text-[11.5px] font-bold tabular-nums">
                {overallCrewStats.completedPairs}/{overallCrewStats.totalPairs} Selesai · {overallCrewStats.avgPct}%
              </span>
            )}
          </div>

          {/* View Switcher: Daftar Materi | Monitoring Crew */}
          <div className="inline-flex items-center p-1 rounded-full bg-[#F4F5F8] border border-black/[0.06]">
            <button
              type="button"
              onClick={() => setViewTab('materials')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-colors cursor-pointer ${
                viewTab === 'materials'
                  ? 'bg-white text-[#1C1D21] shadow-xs'
                  : 'text-[#6E717A] hover:text-[#1C1D21]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Daftar Materi</span>
            </button>
            <button
              type="button"
              onClick={() => setViewTab('crew')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-colors cursor-pointer ${
                viewTab === 'crew'
                  ? 'bg-white text-[#9D113C] shadow-xs'
                  : 'text-[#6E717A] hover:text-[#1C1D21]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Monitoring Crew</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2.5 w-full lg:w-auto">
          <div className="relative flex-1 sm:flex-initial min-w-[180px]">
            <Search className="w-4 h-4 text-[#8A8D98] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                viewTab === 'crew'
                  ? 'Cari nama crew atau materi...'
                  : 'Cari judul atau topik...'
              }
              className="w-full sm:w-64 h-9 pl-9 pr-8 rounded-full border border-black/[0.09] text-[13px] bg-white text-[#1C1D21] placeholder:text-[#8A8D98] outline-none focus:border-[#ee2e65]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Hapus pencarian"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8A8D98] hover:text-[#1C1D21] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={() => setIsUploadMaterialOpen(true)}
            className={ACTION_BTN_PRIMARY}
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span className="sm:hidden">Tambah</span>
            <span className="hidden sm:inline">Tambah Materi</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <SplitFilterButton
            value={selectedClass}
            onChange={setSelectedClass}
            prefix="Kelas"
            icon={GraduationCap}
            variant="primary"
            ariaLabel="Filter class materi"
            options={classOptions}
          />

          {viewTab === 'materials' && (
            <SplitFilterButton
              value={selectedType}
              onChange={setSelectedType}
              prefix="Tipe"
              icon={Layers}
              variant="surface"
              ariaLabel="Filter tipe materi"
              options={[
                { value: 'All', label: 'Semua Tipe', mobileLabel: 'Semua' },
                { value: 'video', label: 'Video', mobileLabel: 'Video' },
                { value: 'document', label: 'Dokumen', mobileLabel: 'Dokumen' },
                { value: 'slides', label: 'Slides', mobileLabel: 'Slides' },
                { value: 'lab', label: 'Lab', mobileLabel: 'Lab' },
              ]}
            />
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 ml-auto">
          <CustomSelect
            value={progressFilter}
            onChange={(val) => setProgressFilter(val as ProgressFilterMode)}
            pill
            ariaLabel="Filter progress"
            className="min-w-[164px]"
            triggerClassName="border-black/[0.08]"
            options={[
              { value: 'All', label: 'Semua Status' },
              { value: 'Completed', label: 'Sudah Selesai' },
              { value: 'InProgress', label: 'Sedang Dipelajari' },
              { value: 'NotStarted', label: 'Belum Dimulai' },
            ]}
          />

          <CustomSelect
            value={sortBy}
            onChange={(val) => setSortBy(val as 'latest' | 'progress' | 'title')}
            pill
            ariaLabel="Urutkan"
            align="right"
            className="min-w-[152px]"
            triggerClassName="border-black/[0.08]"
            options={[
              { value: 'latest', label: 'Urut: Terbaru' },
              { value: 'progress', label: 'Urut: Progress' },
              { value: 'title', label: 'Urut: Nama (A-Z)' },
            ]}
          />
        </div>
      </div>

      {/* VIEW 1: DAFTAR MATERI */}
      {viewTab === 'materials' ? (
        filteredMaterials.length === 0 ? (
          <div className="text-center py-14 bg-white rounded-2xl border border-black/[0.07] p-8">
            <Layers className="w-9 h-9 text-[#B4B6C1] mx-auto mb-3" />
            <h3 className="text-[15px] font-semibold text-[#1C1D21]">Tidak ada materi yang sesuai</h3>
            <p className="text-[12.5px] text-[#8A8D98] max-w-sm mx-auto mt-1">
              Sesuaikan kata kunci pencarian atau ubah filter class dan tipe materi.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedClass('All');
                setSelectedType('All');
                setProgressFilter('All');
              }}
              className={`mt-4 ${ACTION_BTN_PRIMARY}`}
            >
              <RotateCcw className="w-4 h-4 sm:hidden shrink-0" />
              <span className="sm:hidden">Reset</span>
              <span className="hidden sm:inline">Reset Semua Filter</span>
            </button>
          </div>
        ) : (
          <>
            {/* Desktop & Tablet Table */}
            <div className="hidden md:block overflow-hidden rounded-2xl border border-black/[0.07] bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#FAFBFD] border-b border-black/[0.05] text-[11px] font-semibold uppercase tracking-wider text-[#8A8D98]">
                      <th className="py-3.5 px-5">Materi</th>
                      <th className="py-3.5 px-4">Kelas</th>
                      <th className="py-3.5 px-4">Sumber / Tipe</th>
                      <th className="py-3.5 px-4">Progress Servolution Crew</th>
                      <th className="py-3.5 px-5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.05] text-[13px]">
                    {filteredMaterials.map((mat) => {
                      const TypeIcon = getTypeIcon(mat.type);
                      const theme = PASTEL_THEMES[mat.theme] || PASTEL_THEMES.periwinkle;
                      const isVideo = mat.type === 'video';
                      const summary = getMaterialCrewSummary(mat, studentsDirectory);
                      const allDone =
                        summary.totalCrew > 0 && summary.completedCount === summary.totalCrew;

                      return (
                        <tr
                          key={mat.id}
                          className="hover:bg-[#FAFBFD] transition-colors group"
                        >
                          {/* Materi & Unit */}
                          <td className="py-3.5 px-5 align-middle">
                            <div className="flex items-center gap-3 min-w-0">
                              <button
                                type="button"
                                onClick={() => handlePlayOrOpenMaterial(mat)}
                                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 cursor-pointer transition-colors ${getTypeIconStyle(mat.type)}`}
                                title={isVideo ? 'Putar Video' : 'Lihat Detail Materi'}
                              >
                                <TypeIcon className="w-4 h-4" />
                              </button>

                              <div className="min-w-0">
                                <button
                                  type="button"
                                  onClick={() => handleOpenMaterialDetail(mat)}
                                  className="font-semibold text-[#1C1D21] group-hover:text-[#9D113C] transition-colors cursor-pointer text-left line-clamp-1"
                                >
                                  {mat.title}
                                </button>
                                <div className="text-[11.5px] text-[#8A8D98] truncate mt-0.5">
                                  {mat.subject} · {mat.unitName}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Kelas */}
                          <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                            <span className={`px-2.5 py-1 rounded-full ${theme.bg} ${theme.text} text-[11.5px] font-semibold`}>
                              {mat.classCode}
                            </span>
                          </td>

                          {/* Tipe / Sumber */}
                          <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                            <div className="flex items-center gap-2 text-[12px] text-[#6E717A] tabular-nums">
                              <span className={`px-2 py-0.5 rounded-md ${theme.bg} ${theme.text} border ${theme.border} text-[10.5px] font-bold tracking-wide uppercase`}>
                                {mat.type}
                              </span>
                              <span className="truncate max-w-[130px]">
                                {mat.sourceLabel || mat.duration || 'Dalam App'}
                              </span>
                            </div>
                          </td>

                          {/* Progress Servolution Crew */}
                          <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleOpenMaterialDetail(mat)}
                              className="w-48 text-left space-y-1.5 cursor-pointer group/prog"
                              title="Klik untuk melihat & memperbarui status setiap crew"
                            >
                              <div className="flex items-center justify-between text-[11.5px] tabular-nums">
                                <span
                                  className={`font-semibold ${
                                    allDone
                                      ? 'text-[#146C43]'
                                      : summary.avgProgress > 0
                                      ? 'text-[#9D113C]'
                                      : 'text-[#8A8D98]'
                                  }`}
                                >
                                  {summary.totalCrew > 0
                                    ? `${summary.completedCount}/${summary.totalCrew} Crew Selesai`
                                    : 'Belum ada crew'}
                                </span>
                                <span className="text-[#1C1D21] font-bold">
                                  {summary.avgProgress}%
                                </span>
                              </div>
                              <div className="w-full h-1.5 rounded-full bg-[#F4F5F8] overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    allDone
                                      ? 'bg-[#10B981]'
                                      : summary.avgProgress > 0
                                      ? 'bg-[#ee2e65]'
                                      : 'bg-transparent'
                                  }`}
                                  style={{ width: `${summary.avgProgress}%` }}
                                />
                              </div>
                              {summary.totalCrew > 0 && (
                                <div className="text-[10.5px] text-[#8A8D98] tabular-nums">
                                  {allDone
                                    ? 'Semua crew telah menyelesaikan'
                                    : `${summary.inProgressCount} proses · ${summary.notStartedCount} belum`}
                                </div>
                              )}
                            </button>
                          </td>

                          {/* Aksi */}
                          <td className="py-3.5 px-5 align-middle text-right whitespace-nowrap">
                            <div className="inline-flex items-center justify-end gap-1.5">
                              {isVideo && (
                                <button
                                  onClick={() => setActiveVideoPlayer(mat)}
                                  className={ACTION_BTN_SOFT_PRIMARY}
                                >
                                  <Play className="w-3.5 h-3.5 fill-[#9D113C] shrink-0" />
                                  <span>Putar</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleOpenMaterialDetail(mat)}
                                className={ACTION_BTN_SECONDARY}
                                title="Lihat status dan progress setiap Servolution Crew"
                              >
                                <Users className="w-3.5 h-3.5 text-[#9D113C] shrink-0" />
                                <span>Crew</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile View: Unified Clean Hairline List */}
            <div className="md:hidden bg-white rounded-2xl border border-black/[0.07] divide-y divide-black/[0.06] overflow-hidden">
              {filteredMaterials.map((mat) => {
                const TypeIcon = getTypeIcon(mat.type);
                const theme = PASTEL_THEMES[mat.theme] || PASTEL_THEMES.periwinkle;
                const isVideo = mat.type === 'video';
                const summary = getMaterialCrewSummary(mat, studentsDirectory);
                const allDone =
                  summary.totalCrew > 0 && summary.completedCount === summary.totalCrew;

                return (
                  <div key={mat.id} className="p-4 bg-white space-y-3">
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${getTypeIconStyle(mat.type)}`}
                        >
                          <TypeIcon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-semibold text-[14px] text-[#1C1D21] line-clamp-2">
                            {mat.title}
                          </h4>
                          <div className="text-[11.5px] text-[#8A8D98] mt-0.5 truncate">
                            {mat.classCode} · {mat.subject}
                          </div>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-md ${theme.bg} ${theme.text} border ${theme.border} text-[10px] font-bold uppercase shrink-0`}>
                        {mat.type}
                      </span>
                    </div>

                    <div className="space-y-1.5 pt-0.5">
                      <div className="flex items-center justify-between text-[11.5px] tabular-nums">
                        <span
                          className={`font-semibold ${
                            allDone
                              ? 'text-[#146C43]'
                              : summary.avgProgress > 0
                              ? 'text-[#9D113C]'
                              : 'text-[#8A8D98]'
                          }`}
                        >
                          {summary.totalCrew > 0
                            ? `${summary.completedCount}/${summary.totalCrew} Crew Selesai`
                            : 'Belum ada crew'}
                        </span>
                        <span className="font-bold text-[#1C1D21]">{summary.avgProgress}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-[#F4F5F8] overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            allDone
                              ? 'bg-[#10B981]'
                              : summary.avgProgress > 0
                              ? 'bg-[#ee2e65]'
                              : 'bg-transparent'
                          }`}
                          style={{ width: `${summary.avgProgress}%` }}
                        />
                      </div>
                      {summary.totalCrew > 0 && (
                        <div className="text-[10.5px] text-[#8A8D98] tabular-nums">
                          {summary.inProgressCount} proses · {summary.notStartedCount} belum
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      {isVideo && (
                        <button
                          onClick={() => setActiveVideoPlayer(mat)}
                          className={`flex-1 ${ACTION_BTN_SOFT_PRIMARY}`}
                        >
                          <Play className="w-3.5 h-3.5 fill-[#9D113C] shrink-0" />
                          <span>Putar</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleOpenMaterialDetail(mat)}
                        className={`flex-1 ${isVideo ? ACTION_BTN_SECONDARY : ACTION_BTN_SOFT_PRIMARY}`}
                      >
                        <Users className="w-4 h-4 shrink-0" />
                        <span>Monitoring Crew</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )
      ) : (
        /* VIEW 2: MONITORING SERVOLUTION CREW */
        <div className="space-y-4">
          {/* Summary Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl border border-black/[0.07] p-4 flex items-center justify-between">
              <div>
                <div className="text-[11.5px] font-semibold text-[#8A8D98]">Servolution Crew</div>
                <div className="text-[22px] font-bold text-[#1C1D21] mt-0.5 tabular-nums">
                  {crewTabKpis.total} Crew
                </div>
              </div>
              <span className="w-10 h-10 rounded-full bg-[#FEF1F5] text-[#9D113C] flex items-center justify-center">
                <Users className="w-5 h-5" />
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-black/[0.07] p-4 flex items-center justify-between">
              <div>
                <div className="text-[11.5px] font-semibold text-[#8A8D98]">Tuntas Semua Materi</div>
                <div className="text-[22px] font-bold text-[#146C43] mt-0.5 tabular-nums">
                  {crewTabKpis.completedAll}/{crewTabKpis.total}
                </div>
              </div>
              <span className="w-10 h-10 rounded-full bg-[#E6F9F0] text-[#146C43] flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-black/[0.07] p-4 flex items-center justify-between">
              <div>
                <div className="text-[11.5px] font-semibold text-[#8A8D98]">Rata-rata Progress Crew</div>
                <div className="text-[22px] font-bold text-[#9D113C] mt-0.5 tabular-nums">
                  {crewTabKpis.avgCompletion}%
                </div>
              </div>
              <span className="w-10 h-10 rounded-full bg-[#F0EFFC] text-[#3F3B99] flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </span>
            </div>
          </div>

          {filteredCrewRows.length === 0 ? (
            <div className="text-center py-14 bg-white rounded-2xl border border-black/[0.07] p-8">
              <Users className="w-9 h-9 text-[#B4B6C1] mx-auto mb-3" />
              <h3 className="text-[15px] font-semibold text-[#1C1D21]">
                Tidak ada Servolution Crew yang sesuai
              </h3>
              <p className="text-[12.5px] text-[#8A8D98] max-w-sm mx-auto mt-1">
                Ubah kata kunci pencarian atau pilih filter kelas lain.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedClass('All');
                  setProgressFilter('All');
                }}
                className={`mt-4 ${ACTION_BTN_PRIMARY}`}
              >
                <RotateCcw className="w-4 h-4 shrink-0" />
                <span>Reset Filter</span>
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-black/[0.07] divide-y divide-black/[0.06] overflow-hidden">
              {filteredCrewRows.map(({ student, summary }) => {
                const isExpanded = expandedCrewId === student.id;
                const allDone =
                  summary.totalMaterials > 0 &&
                  summary.completedCount === summary.totalMaterials;

                return (
                  <div key={student.id} className="bg-white">
                    {/* Crew Summary Row */}
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedCrewId(isExpanded ? null : student.id)
                      }
                      className="w-full p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FAFBFD] transition-colors text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0 ${student.color}`}
                        >
                          {student.initials}
                        </span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-[14px] text-[#1C1D21] truncate">
                              {student.name}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-[#F4F5F8] text-[#5A5D67] text-[11px] font-semibold">
                              {student.classCode}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold ${
                                allDone
                                  ? 'bg-[#E6F9F0] text-[#146C43]'
                                  : summary.avgProgress > 0
                                  ? 'bg-[#FFF5E6] text-[#8C5811]'
                                  : 'bg-[#F4F5F8] text-[#8A8D98]'
                              }`}
                            >
                              {allDone
                                ? 'Tuntas'
                                : summary.avgProgress > 0
                                ? 'Aktif Belajar'
                                : 'Belum Mulai'}
                            </span>
                          </div>
                          <div className="text-[11.5px] text-[#8A8D98] truncate mt-0.5">
                            {student.email} · {summary.completedCount}/{summary.totalMaterials} Materi Selesai
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                        <div className="w-40 space-y-1">
                          <div className="flex items-center justify-between text-[11.5px] tabular-nums">
                            <span className="text-[#6E717A] font-medium">Progress</span>
                            <span className="font-bold text-[#1C1D21]">
                              {summary.avgProgress}%
                            </span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-[#F4F5F8] overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                allDone
                                  ? 'bg-[#10B981]'
                                  : summary.avgProgress > 0
                                  ? 'bg-[#ee2e65]'
                                  : 'bg-transparent'
                              }`}
                              style={{ width: `${summary.avgProgress}%` }}
                            />
                          </div>
                        </div>

                        <span className="w-8 h-8 rounded-full bg-[#F4F5F8] text-[#6E717A] flex items-center justify-center shrink-0">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </span>
                      </div>
                    </button>

                    {/* Expanded Per-Material Breakdown for this Crew */}
                    {isExpanded && (
                      <div className="bg-[#FAFBFD] border-t border-black/[0.05] px-4 sm:px-5 py-3.5 space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[11.5px] font-semibold uppercase tracking-wider text-[#6E717A]">
                            Daftar Materi {student.classCode} ({summary.assignedMaterials.length})
                          </span>
                          <span className="text-[11.5px] text-[#8A8D98] tabular-nums">
                            {summary.completedCount} selesai · {summary.inProgressCount} proses ·{' '}
                            {summary.notStartedCount} belum
                          </span>
                        </div>

                        {summary.assignedMaterials.length === 0 ? (
                          <div className="p-4 rounded-xl bg-white border border-black/[0.06] text-[12.5px] text-[#8A8D98]">
                            Belum ada materi yang ditugaskan untuk kelas {student.classCode}.
                          </div>
                        ) : (
                          <div className="bg-white rounded-xl border border-black/[0.06] divide-y divide-black/[0.05] overflow-hidden">
                            {summary.assignedMaterials.map((mat) => {
                              const TypeIcon = getTypeIcon(mat.type);
                              const entry = getCrewEntryForMaterial(mat, student.id);
                              const cat = getCrewStatusCategory(entry);

                              return (
                                <div
                                  key={mat.id}
                                  className="px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenMaterialDetail(mat)}
                                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 cursor-pointer ${getTypeIconStyle(mat.type)}`}
                                    >
                                      <TypeIcon className="w-3.5 h-3.5" />
                                    </button>
                                    <div className="min-w-0">
                                      <button
                                        type="button"
                                        onClick={() => handleOpenMaterialDetail(mat)}
                                        className="text-[13px] font-semibold text-[#1C1D21] hover:text-[#9D113C] text-left truncate block max-w-full cursor-pointer"
                                      >
                                        {mat.title}
                                      </button>
                                      <div className="text-[11px] text-[#8A8D98] truncate">
                                        {mat.subject} · {mat.type.toUpperCase()}
                                        {entry.updatedAt ? ` · Update ${entry.updatedAt}` : ''}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[11px] font-semibold tabular-nums ${
                                        cat === 'completed'
                                          ? 'bg-[#E6F9F0] text-[#146C43]'
                                          : cat === 'in_progress'
                                          ? 'bg-[#FFF5E6] text-[#8C5811]'
                                          : 'bg-[#F4F5F8] text-[#6E717A]'
                                      }`}
                                    >
                                      {cat === 'completed'
                                        ? 'Selesai · 100%'
                                        : cat === 'in_progress'
                                        ? `Sedang · ${entry.progress}%`
                                        : 'Belum · 0%'}
                                    </span>

                                    <div className="inline-flex items-center gap-1">
                                      {[0, 50, 100].map((pct) => {
                                        const isActive =
                                          (pct === 100 && cat === 'completed') ||
                                          (pct === 0 && cat === 'not_started') ||
                                          (pct === 50 && entry.progress === 50 && !entry.isCompleted);

                                        return (
                                          <button
                                            key={pct}
                                            type="button"
                                            onClick={() =>
                                              handleUpdateCrewMaterialProgress(
                                                mat.id,
                                                student.id,
                                                pct,
                                                pct >= 100
                                              )
                                            }
                                            className={`px-2 py-1 rounded-full text-[10.5px] font-semibold transition-colors cursor-pointer ${
                                              isActive
                                                ? pct === 100
                                                  ? 'bg-[#10B981] text-white'
                                                  : 'bg-[#1C1D21] text-white'
                                                : 'bg-[#F4F5F8] text-[#6E717A] hover:text-[#1C1D21]'
                                            }`}
                                          >
                                            {pct}%
                                          </button>
                                        );
                                      })}

                                      <button
                                        type="button"
                                        onClick={() => handlePlayOrOpenMaterial(mat)}
                                        title={mat.type === 'video' ? 'Putar Video' : 'Detail Materi'}
                                        className="w-7 h-7 rounded-full border border-black/[0.08] bg-white hover:bg-[#FEF1F5] text-[#6E717A] hover:text-[#9D113C] inline-flex items-center justify-center cursor-pointer"
                                      >
                                        {mat.type === 'video' ? (
                                          <Play className="w-3 h-3" />
                                        ) : (
                                          <Eye className="w-3.5 h-3.5" />
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Material Detail & Crew Progress Inspector Modal */}
      {selectedMaterial &&
        createPortal(
          <div
            ref={backdropRef}
            data-modal-sheet-backdrop="true"
            className="animate-ui-fade fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-5 no-print"
          >
            <div
              ref={setSheetElement}
              {...sheetGestureProps}
              className="bg-white rounded-t-[28px] sm:rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-black/[0.08] max-h-[90vh] overflow-y-auto space-y-4 animate-bottom-sheet"
            >
              <div
                data-sheet-handle="true"
                className="sm:hidden flex justify-center py-2 -mt-3 -mb-1 cursor-grab active:cursor-grabbing touch-none"
              >
                <div className="w-10 h-1 bg-black/15 rounded-full animate-sheet-handle" />
              </div>

              {/* Header */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#FEF1F5] text-[#9D113C]">
                      {selectedMaterial.classCode}
                    </span>
                    <span className="text-xs text-gray-400 font-medium">
                      {selectedMaterial.subject} · {selectedMaterial.grade}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-gray-900 mt-1">
                    {selectedMaterial.title}
                  </h2>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Diunggah oleh {selectedMaterial.author} · {selectedMaterial.uploadedAt}
                  </div>
                </div>
                <button
                  onClick={animateClose}
                  className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <div className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Deskripsi Materi
                </div>
                <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                  {selectedMaterial.description}
                </p>
              </div>

              {/* Source & Metadata */}
              {(selectedMaterial.sourceLabel ||
                selectedMaterial.sourcePage ||
                selectedMaterial.duration) && (
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex flex-wrap items-center justify-between text-xs text-gray-600 gap-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <span>
                      Tipe: <strong className="uppercase">{selectedMaterial.type}</strong>
                    </span>
                    {selectedMaterial.duration && (
                      <span>
                        Durasi: <strong>{selectedMaterial.duration}</strong>
                      </span>
                    )}
                    {selectedMaterial.sourceLabel && (
                      <span>
                        Sumber: <strong>{selectedMaterial.sourceLabel}</strong>
                      </span>
                    )}
                  </div>
                  {selectedMaterial.sourcePage && (
                    <button
                      type="button"
                      onClick={() => {
                        const targetPage = selectedMaterial.sourcePage!;
                        setSelectedMaterial(null);
                        setActivePage(targetPage);
                      }}
                      className="inline-flex items-center gap-1 text-[#9D113C] font-semibold hover:underline cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Buka Halaman</span>
                    </button>
                  )}
                </div>
              )}

              {/* Status & Progress per Servolution Crew */}
              {(() => {
                const summary = getMaterialCrewSummary(selectedMaterial, studentsDirectory);
                const allDone =
                  summary.totalCrew > 0 && summary.completedCount === summary.totalCrew;

                const visibleCrew = summary.crew.filter((member) => {
                  const entry = getCrewEntryForMaterial(selectedMaterial, member.id);
                  const cat = getCrewStatusCategory(entry);
                  if (modalCrewFilter === 'Completed' && cat !== 'completed') return false;
                  if (modalCrewFilter === 'InProgress' && cat !== 'in_progress') return false;
                  if (modalCrewFilter === 'NotStarted' && cat !== 'not_started') return false;
                  if (modalCrewSearch.trim()) {
                    const q = modalCrewSearch.trim().toLowerCase();
                    return (
                      member.name.toLowerCase().includes(q) ||
                      member.email.toLowerCase().includes(q)
                    );
                  }
                  return true;
                });

                return (
                  <div className="p-4 bg-[#FAFBFD] rounded-2xl border border-black/[0.06] space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="text-[13px] font-bold text-[#1C1D21]">
                          Status & Progress Servolution Crew
                        </div>
                        <div className="text-[11.5px] text-[#6E717A] tabular-nums mt-0.5">
                          {summary.completedCount} dari {summary.totalCrew} crew selesai · Rata-rata{' '}
                          <strong className="text-[#1C1D21]">{summary.avgProgress}%</strong>
                        </div>
                      </div>

                      {summary.totalCrew > 0 && (
                        <div className="flex items-center gap-1.5">
                          {!allDone && (
                            <button
                              type="button"
                              onClick={() =>
                                handleBulkUpdateCrewMaterialProgress(
                                  selectedMaterial.id,
                                  summary.crew.map((c) => c.id),
                                  100,
                                  true
                                )
                              }
                              className="px-2.5 py-1 rounded-full bg-[#E6F9F0] text-[#146C43] hover:bg-[#D1F4E2] text-[11px] font-semibold transition-colors cursor-pointer"
                            >
                              Tandai Semua Selesai
                            </button>
                          )}
                          {summary.avgProgress > 0 && (
                            <button
                              type="button"
                              onClick={() =>
                                handleBulkUpdateCrewMaterialProgress(
                                  selectedMaterial.id,
                                  summary.crew.map((c) => c.id),
                                  0,
                                  false
                                )
                              }
                              className="px-2.5 py-1 rounded-full bg-white border border-black/[0.09] text-[#6E717A] hover:text-[#1C1D21] text-[11px] font-semibold transition-colors cursor-pointer"
                            >
                              Reset Semua
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Aggregate Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-black/[0.06] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          allDone
                            ? 'bg-[#10B981]'
                            : summary.avgProgress > 0
                            ? 'bg-[#ee2e65]'
                            : 'bg-transparent'
                        }`}
                        style={{ width: `${summary.avgProgress}%` }}
                      />
                    </div>

                    {/* Filter Pills + Optional Search */}
                    {summary.totalCrew > 0 && (
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {(
                            [
                              { id: 'All', label: `Semua (${summary.totalCrew})` },
                              { id: 'Completed', label: `Selesai (${summary.completedCount})` },
                              { id: 'InProgress', label: `Sedang (${summary.inProgressCount})` },
                              { id: 'NotStarted', label: `Belum (${summary.notStartedCount})` },
                            ] as const
                          ).map((pill) => (
                            <button
                              key={pill.id}
                              type="button"
                              onClick={() => setModalCrewFilter(pill.id)}
                              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
                                modalCrewFilter === pill.id
                                  ? 'bg-[#1C1D21] text-white'
                                  : 'bg-white border border-black/[0.08] text-[#6E717A] hover:text-[#1C1D21]'
                              }`}
                            >
                              {pill.label}
                            </button>
                          ))}
                        </div>

                        {summary.totalCrew > 4 && (
                          <input
                            type="text"
                            value={modalCrewSearch}
                            onChange={(e) => setModalCrewSearch(e.target.value)}
                            placeholder="Cari crew..."
                            className="h-7 px-3 rounded-full border border-black/[0.09] text-[11.5px] bg-white text-[#1C1D21] outline-none focus:border-[#ee2e65] w-36"
                          />
                        )}
                      </div>
                    )}

                    {/* Individual Servolution Crew List */}
                    {summary.totalCrew === 0 ? (
                      <div className="p-4 rounded-xl bg-white border border-black/[0.06] text-xs text-[#8A8D98] text-center">
                        Belum ada Servolution Crew yang terdaftar di {selectedMaterial.classCode}.
                      </div>
                    ) : visibleCrew.length === 0 ? (
                      <div className="p-4 rounded-xl bg-white border border-black/[0.06] text-xs text-[#8A8D98] text-center">
                        Tidak ada crew dengan filter status ini.
                      </div>
                    ) : (
                      <div className="bg-white rounded-xl border border-black/[0.06] divide-y divide-black/[0.05] max-h-60 overflow-y-auto">
                        {visibleCrew.map((member) => {
                          const entry = getCrewEntryForMaterial(selectedMaterial, member.id);
                          const cat = getCrewStatusCategory(entry);

                          return (
                            <div
                              key={member.id}
                              className="px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span
                                  className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${member.color}`}
                                >
                                  {member.initials}
                                </span>
                                <div className="min-w-0">
                                  <div className="text-[12.5px] font-semibold text-[#1C1D21] truncate">
                                    {member.name}
                                  </div>
                                  <div className="text-[11px] text-[#8A8D98] truncate">
                                    {member.classCode}
                                    {entry.updatedAt ? ` · Update ${entry.updatedAt}` : ''}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10.5px] font-semibold tabular-nums ${
                                    cat === 'completed'
                                      ? 'bg-[#E6F9F0] text-[#146C43]'
                                      : cat === 'in_progress'
                                      ? 'bg-[#FFF5E6] text-[#8C5811]'
                                      : 'bg-[#F4F5F8] text-[#6E717A]'
                                  }`}
                                >
                                  {cat === 'completed'
                                    ? 'Selesai · 100%'
                                    : cat === 'in_progress'
                                    ? `Sedang · ${entry.progress}%`
                                    : 'Belum · 0%'}
                                </span>

                                <div className="inline-flex items-center gap-1">
                                  {[0, 50, 100].map((pct) => {
                                    const isActive =
                                      (pct === 100 && cat === 'completed') ||
                                      (pct === 0 && cat === 'not_started') ||
                                      (pct === 50 && entry.progress === 50 && !entry.isCompleted);

                                    return (
                                      <button
                                        key={pct}
                                        type="button"
                                        onClick={() =>
                                          handleUpdateCrewMaterialProgress(
                                            selectedMaterial.id,
                                            member.id,
                                            pct,
                                            pct >= 100
                                          )
                                        }
                                        className={`px-2 py-1 rounded-full text-[10.5px] font-semibold transition-colors cursor-pointer ${
                                          isActive
                                            ? pct === 100
                                              ? 'bg-[#10B981] text-white'
                                              : 'bg-[#1C1D21] text-white'
                                            : 'bg-[#F4F5F8] text-[#6E717A] hover:text-[#1C1D21]'
                                        }`}
                                      >
                                        {pct}%
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Modal Actions */}
              <div className="pt-2 flex flex-row items-center gap-2 justify-between">
                <button
                  onClick={() => {
                    handleDeleteMaterial(selectedMaterial.id);
                  }}
                  className={`flex-1 sm:flex-initial ${ACTION_BTN_DANGER_SOFT}`}
                >
                  <Trash2 className="w-4 h-4 shrink-0" />
                  <span className="sm:hidden">Hapus</span>
                  <span className="hidden sm:inline">Hapus Materi</span>
                </button>

                <div className="flex-[2] sm:flex-initial flex items-center justify-end gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(window.location.href);
                      triggerToast('Tautan Disalin', 'Tautan materi telah disalin.', 'info');
                    }}
                    className={ACTION_BTN_SECONDARY}
                  >
                    <Share2 className="w-4 h-4 text-[#6E717A] shrink-0" />
                    <span>Bagikan</span>
                  </button>

                  {selectedMaterial.type === 'video' ? (
                    <button
                      type="button"
                      onClick={() => {
                        const target = selectedMaterial;
                        setSelectedMaterial(null);
                        setActiveVideoPlayer(target);
                      }}
                      className={ACTION_BTN_PRIMARY}
                    >
                      <Play className="w-4 h-4 shrink-0" />
                      <span>Putar Video</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={animateClose}
                      className={ACTION_BTN_PRIMARY}
                    >
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Tutup</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
