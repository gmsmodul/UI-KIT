import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Check,
  X,
  FileText,
  QrCode,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  formatClassMobileLabel,
  getAvailableClassOptions,
  normalizeClassKey,
} from '../../utils/scheduleSubjects';
import { ClassAttendanceData, StudentAttendanceRecord, StudentDirectoryItem } from '../../types';
import { SplitFilterButton } from '../ui/SplitFilterButton';
import { AllAttendanceRecordsCard } from '../attendance/AllAttendanceRecordsCard';
import { ACTION_BTN_PRIMARY } from '../../constants/buttonStyles';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const ITEMS_PER_COLUMN = 10;
const COLUMNS_PER_SLIDE = 3;
const ITEMS_PER_SLIDE = ITEMS_PER_COLUMN * COLUMNS_PER_SLIDE;

type AttendanceCategoryKey = 'attendance' | 'absences' | 'excuse';

export const AttendancePage: React.FC = () => {
  const {
    schedules,
    attendanceByClass,
    selectedAttendanceClass,
    setSelectedAttendanceClass,
    setSelectedStudentDrawer,
    setActiveQrCheckInSessionId,
    setActiveQrScanKey,
    setIsCrewQrScannerOpen,
  } = useApp();

  const [calYear, setCalYear] = useState(2026);
  const [calMonth, setCalMonth] = useState(1); // February
  const [attendanceDay, setAttendanceDay] = useState(9);

  const [expandedCol, setExpandedCol] = useState<AttendanceCategoryKey | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);

  const baseLayerRef = useRef<HTMLDivElement>(null);
  const expandedMeasureRef = useRef<HTMLDivElement>(null);
  const [baseHeight, setBaseHeight] = useState<number>(0);
  const [expandedHeight, setExpandedHeight] = useState<number>(0);

  const classOptions = useMemo(() => {
    const classes = getAvailableClassOptions(
      Object.keys(attendanceByClass),
      schedules.map((s) => s.classCode)
    );
    return [...classes, 'All Classes'].map((cls) => ({
      value: cls,
      label: cls,
      mobileLabel: formatClassMobileLabel(cls),
    }));
  }, [attendanceByClass, schedules]);

  const activeClassValue = useMemo(() => {
    const normalized = normalizeClassKey(selectedAttendanceClass);
    if (classOptions.some((o) => o.value === normalized)) {
      return normalized;
    }
    return classOptions[0]?.value || 'Class 302';
  }, [classOptions, selectedAttendanceClass]);

  const currentData: ClassAttendanceData = useMemo(() => {
    if (activeClassValue !== 'All Classes') {
      return (
        attendanceByClass[activeClassValue] || {
          attendance: [],
          absences: [],
          excuse: [],
        }
      );
    }

    const dedupe = (items: StudentAttendanceRecord[]) => {
      const seen = new Set<string>();
      const out: StudentAttendanceRecord[] = [];
      items.forEach((item) => {
        const key = `${item.id}-${item.name}`.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          out.push(item);
        }
      });
      return out;
    };

    const allBuckets = Object.values(attendanceByClass);
    return {
      attendance: dedupe(allBuckets.flatMap((b) => b.attendance || [])),
      absences: dedupe(allBuckets.flatMap((b) => b.absences || [])),
      excuse: dedupe(allBuckets.flatMap((b) => b.excuse || [])),
    };
  }, [attendanceByClass, activeClassValue]);

  const attList = currentData.attendance || [];
  const absList = currentData.absences || [];
  const excList = currentData.excuse || [];

  const attCount = attList.length;
  const absCount = absList.length;
  const excCount = excList.length;
  const totalCount = attCount + absCount + excCount;
  const denom = Math.max(1, totalCount);

  const attBars = Math.round((attCount / denom) * 14);
  const absBars = Math.round((absCount / denom) * 14);
  const excBars = Math.round((excCount / denom) * 14);

  const daysInMonth = useMemo(() => new Date(calYear, calMonth + 1, 0).getDate(), [calYear, calMonth]);
  const firstDayOffset = useMemo(() => {
    const jsDay = new Date(calYear, calMonth, 1).getDay();
    return (jsDay + 6) % 7;
  }, [calYear, calMonth]);

  useEffect(() => {
    setSlideIndex(0);
  }, [activeClassValue, expandedCol]);

  useLayoutEffect(() => {
    if (baseLayerRef.current) {
      setBaseHeight(baseLayerRef.current.offsetHeight);
    }
    if (expandedMeasureRef.current) {
      setExpandedHeight(expandedMeasureRef.current.offsetHeight);
    }
  }, [expandedCol, slideIndex, activeClassValue, attCount, absCount, excCount]);

  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => {
      if (baseLayerRef.current) {
        setBaseHeight(baseLayerRef.current.offsetHeight);
      }
      if (expandedMeasureRef.current) {
        setExpandedHeight(expandedMeasureRef.current.offsetHeight);
      }
    });
    if (baseLayerRef.current) observer.observe(baseLayerRef.current);
    if (expandedMeasureRef.current) observer.observe(expandedMeasureRef.current);
    return () => observer.disconnect();
  }, [expandedCol]);

  const handlePrevMonth = () => {
    if (calMonth === 0) {
      setCalYear((y) => y - 1);
      setCalMonth(11);
    } else {
      setCalMonth((m) => m - 1);
    }
    setAttendanceDay(1);
  };

  const handleNextMonth = () => {
    if (calMonth === 11) {
      setCalYear((y) => y + 1);
      setCalMonth(0);
    } else {
      setCalMonth((m) => m + 1);
    }
    setAttendanceDay(1);
  };

  const handleOpenScanner = () => {
    setActiveQrCheckInSessionId(null);
    setActiveQrScanKey('');
    setIsCrewQrScannerOpen(true);
  };

  const columnConfigs = useMemo(
    () => [
      {
        key: 'attendance' as const,
        title: 'Attendance',
        icon: Check,
        iconColor: 'text-[#10B981]',
        headerBg: 'bg-[#E6F9F0]/65',
        solidHeaderBg: 'bg-[#EBFBF3]',
        badgeClass: 'bg-white text-[#146C43]',
        arrowHoverClass: 'text-[#146C43] hover:bg-[#10B981]/15',
        indicatorActiveClass: 'bg-[#10B981]',
        clipFrom: 'inset(0% 66.6667% 0% 0%)',
        headerStartLeft: '16.6667%',
      },
      {
        key: 'absences' as const,
        title: 'Absences',
        icon: X,
        iconColor: 'text-[#D97706]',
        headerBg: 'bg-[#FFF5E6]/75',
        solidHeaderBg: 'bg-[#FFF7EB]',
        badgeClass: 'bg-white text-[#8C5811]',
        arrowHoverClass: 'text-[#8C5811] hover:bg-[#D97706]/15',
        indicatorActiveClass: 'bg-[#D97706]',
        clipFrom: 'inset(0% 33.3333% 0% 33.3333%)',
        headerStartLeft: '50%',
      },
      {
        key: 'excuse' as const,
        title: 'Excuse',
        icon: FileText,
        iconColor: 'text-[#ee2e65]',
        headerBg: 'bg-[#FEF1F5]/75',
        solidHeaderBg: 'bg-[#FEF4F7]',
        badgeClass: 'bg-white text-[#9D113C]',
        arrowHoverClass: 'text-[#9D113C] hover:bg-[#ee2e65]/15',
        indicatorActiveClass: 'bg-[#ee2e65]',
        clipFrom: 'inset(0% 0% 0% 66.6667%)',
        headerStartLeft: '83.3333%',
      },
    ],
    []
  );

  const activeColConfig = useMemo(
    () => columnConfigs.find((c) => c.key === expandedCol) || null,
    [columnConfigs, expandedCol]
  );

  const expandedList: StudentAttendanceRecord[] = useMemo(() => {
    if (!expandedCol) return [];
    return currentData[expandedCol] || [];
  }, [currentData, expandedCol]);

  const totalSlides = Math.max(1, Math.ceil(expandedList.length / ITEMS_PER_SLIDE));
  const safeSlideIndex = Math.min(slideIndex, totalSlides - 1);

  const slides = useMemo(() => {
    if (!expandedCol) return [];
    return Array.from({ length: totalSlides }, (_, sIdx) => {
      const start = sIdx * ITEMS_PER_SLIDE;
      const chunk = expandedList.slice(start, start + ITEMS_PER_SLIDE);
      return [
        chunk.slice(0, ITEMS_PER_COLUMN),
        chunk.slice(ITEMS_PER_COLUMN, ITEMS_PER_COLUMN * 2),
        chunk.slice(ITEMS_PER_COLUMN * 2, ITEMS_PER_SLIDE),
      ];
    });
  }, [expandedCol, expandedList, totalSlides]);

  const goToSlide = (target: number) => {
    const clamped = Math.max(0, Math.min(totalSlides - 1, target));
    setSlideIndex(clamped);
  };

  const openStudentDrawer = (st: StudentAttendanceRecord) => {
    setSelectedStudentDrawer({
      id: st.id,
      initials: st.initials,
      name: st.name,
      email: st.email,
      classCode: activeClassValue === 'All Classes' ? 'Class 302' : activeClassValue,
      grade: 'Grade 12',
      status: 'Active',
      rate: st.rate,
      score: st.score,
      guardian: 'Parent / Guardian',
      phone: '+62 812-3401-8821',
      color: st.color,
    } as StudentDirectoryItem);
  };

  const renderStudentRow = (st: StudentAttendanceRecord) => (
    <button
      key={st.id}
      type="button"
      onClick={() => openStudentDrawer(st)}
      className="w-full bg-white hover:bg-[#FAFBFD] px-4 py-3 flex items-center justify-between gap-2 transition-colors text-left cursor-pointer"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <span
          className={`w-7 h-7 rounded-full flex items-center justify-center text-[10.5px] font-bold shrink-0 ${st.color}`}
        >
          {st.initials}
        </span>
        <div className="min-w-0">
          <div className="text-[12.5px] font-medium text-[#1C1D21] truncate">{st.name}</div>
          {(st.checkInTime || st.attendanceStatus || st.excuseReason) && (
            <div className="flex items-center gap-1.5 mt-0.5 text-[10.5px] tabular-nums">
              {st.checkInTime && (
                <span className="text-[#6E717A] font-medium">{st.checkInTime}</span>
              )}
              {st.attendanceStatus && (
                <span
                  className={`font-bold ${
                    st.attendanceStatus === 'Late' ? 'text-[#9D113C]' : 'text-[#146C43]'
                  }`}
                >
                  · {st.attendanceStatus}
                </span>
              )}
              {!st.checkInTime && !st.attendanceStatus && st.excuseReason && (
                <span className="text-[#9D113C] font-medium truncate">{st.excuseReason}</span>
              )}
            </div>
          )}
        </div>
      </div>
      <ChevronRight className="w-3.5 h-3.5 text-[#9496A1] shrink-0" />
    </button>
  );

  return (
    <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 md:pb-6 border-b border-black/[0.05]">
        <div className="hidden md:block">
          <h1 className="text-[24px] font-semibold tracking-tight text-[#1C1D21]">Attendance</h1>
        </div>

        {/* Actions: Scan QR + Class Switcher Split Button */}
        <div className="flex items-center justify-end gap-2.5 w-full md:w-auto">
          <button
            onClick={handleOpenScanner}
            className={ACTION_BTN_PRIMARY}
          >
            <QrCode className="w-4 h-4 shrink-0" />
            <span className="sm:hidden">Scan QR</span>
            <span className="hidden sm:inline">Scan QR Absensi</span>
          </button>

          <SplitFilterButton
            value={activeClassValue}
            onChange={setSelectedAttendanceClass}
            prefix="Class"
            icon={CheckCircle2}
            variant="surface"
            align="right"
            ariaLabel="Pilih class absensi"
            options={classOptions}
          />
        </div>
      </div>

      {/* 12-Col Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 lg:gap-7">
        {/* Left Columns */}
        <div className="md:col-span-5 lg:col-span-4 space-y-5">
          {/* Compact Calendar */}
          <div className="bg-white rounded-2xl p-5 border border-black/[0.07]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevMonth}
                  aria-label="Bulan sebelumnya"
                  className="w-7 h-7 rounded-full border border-black/[0.09] flex items-center justify-center hover:bg-[#FAFBFD] cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-[14px] font-semibold text-[#1C1D21] tabular-nums">
                  {MONTH_NAMES[calMonth]} {calYear}
                </span>
                <button
                  onClick={handleNextMonth}
                  aria-label="Bulan berikutnya"
                  className="w-7 h-7 rounded-full border border-black/[0.09] flex items-center justify-center hover:bg-[#FAFBFD] cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <button
                onClick={() => {
                  setCalYear(2026);
                  setCalMonth(1);
                  setAttendanceDay(9);
                }}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-black/[0.09] text-[12px] font-medium hover:bg-[#FAFBFD] cursor-pointer"
              >
                <Filter className="w-3 h-3" />
                <span>Filter</span>
                <span className="w-4 h-4 rounded-full bg-[#FEF1F5] text-[#9D113C] text-[10px] font-bold flex items-center justify-center">
                  1
                </span>
              </button>
            </div>

            <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-[#8A8D98] mb-2">
              {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1.5 text-center text-[12px] tabular-nums">
              {Array.from({ length: firstDayOffset }).map((_, idx) => (
                <div key={`empty-${idx}`} className="h-8" />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                const isSelected = Math.min(attendanceDay, daysInMonth) === day;
                return (
                  <button
                    key={day}
                    onClick={() => setAttendanceDay(day)}
                    className={`h-8 rounded-full font-medium transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#ee2e65] text-white font-semibold'
                        : 'bg-white text-[#1C1D21] hover:bg-[#FEF1F5] hover:text-[#9D113C]'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Unified Segmented Progress Summary Block */}
          <div className="rounded-2xl border border-black/[0.06] divide-y divide-black/[0.06] overflow-hidden">
            <div className="p-4 bg-[#E6F9F0] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#10B981]">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[14px] font-bold text-[#1C1D21] tabular-nums">
                    {attCount}/{totalCount}
                  </div>
                  <div className="text-[11.5px] font-medium text-[#146C43]">Attendance</div>
                </div>
              </div>
              <div className="flex items-center gap-[3px]">
                {Array.from({ length: 14 }).map((_, i) => (
                  <span
                    key={i}
                    className={`w-1.5 h-5 rounded-full ${i < attBars ? 'bg-[#10B981]' : 'bg-black/[0.08]'}`}
                  />
                ))}
              </div>
            </div>

            <div className="p-4 bg-[#FFF5E6] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#D97706]">
                  <X className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[14px] font-bold text-[#1C1D21] tabular-nums">
                    {absCount}/{totalCount}
                  </div>
                  <div className="text-[11.5px] font-medium text-[#8C5811]">Absences</div>
                </div>
              </div>
              <div className="flex items-center gap-[3px]">
                {Array.from({ length: 14 }).map((_, i) => (
                  <span
                    key={i}
                    className={`w-1.5 h-5 rounded-full ${i < absBars ? 'bg-[#D97706]' : 'bg-black/[0.08]'}`}
                  />
                ))}
              </div>
            </div>

            <div className="p-4 bg-[#FEF1F5] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#ee2e65]">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[14px] font-bold text-[#1C1D21] tabular-nums">
                    {excCount}/{totalCount}
                  </div>
                  <div className="text-[11.5px] font-medium text-[#9D113C]">Excuse</div>
                </div>
              </div>
              <div className="flex items-center gap-[3px]">
                {Array.from({ length: 14 }).map((_, i) => (
                  <span
                    key={i}
                    className={`w-1.5 h-5 rounded-full ${i < excBars ? 'bg-[#ee2e65]' : 'bg-black/[0.08]'}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Columns: Default 3-Category View + Directional Widening Single-Category Carousel */}
        <motion.div
          animate={
            (activeColConfig ? expandedHeight : baseHeight) > 0
              ? { height: activeColConfig ? expandedHeight || baseHeight : baseHeight }
              : undefined
          }
          transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
          className="md:col-span-7 lg:col-span-8 bg-white rounded-2xl border border-black/[0.07] overflow-hidden self-start relative"
        >
          {/* Base 3-Category Grid (always in steady flow so closing never jumps) */}
          <div
            ref={baseLayerRef}
            aria-hidden={Boolean(activeColConfig)}
            className={`grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-black/[0.06] relative z-0 ${
              activeColConfig ? 'pointer-events-none' : ''
            }`}
          >
            {columnConfigs.map((col) => {
              const list = currentData[col.key] || [];
              const visibleItems = list.slice(0, ITEMS_PER_COLUMN);
              const ColIcon = col.icon;

              return (
                <div key={col.key} className="flex flex-col">
                  <div
                    className={`flex items-center justify-between px-4 py-3.5 ${col.headerBg} border-b border-black/[0.06]`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <ColIcon className={`w-4 h-4 shrink-0 ${col.iconColor}`} />
                      <span className="text-[13.5px] font-semibold text-[#1C1D21] truncate">
                        {col.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`min-w-[22px] h-[22px] px-1.5 rounded-full text-[11px] font-bold flex items-center justify-center tabular-nums shadow-2xs ${col.badgeClass}`}
                      >
                        {list.length}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSlideIndex(0);
                          setExpandedCol(col.key);
                        }}
                        aria-label={`Perlebar kolom ${col.title}`}
                        title={`Tampilkan ${col.title} dalam 3 kolom`}
                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors cursor-pointer ${col.arrowHoverClass}`}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="divide-y divide-black/[0.05] flex-1">
                    {visibleItems.length === 0 ? (
                      <div className="text-center py-8 text-[12px] text-[#9496A1]">No records</div>
                    ) : (
                      visibleItems.map(renderStudentRow)
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Expanded Single-Category Layer Widening & Shrinking Directionally */}
          <AnimatePresence initial={false}>
            {activeColConfig &&
              (() => {
                const ActiveIcon = activeColConfig.icon;
                return (
                  <motion.div
                    key={`expanded-${activeColConfig.key}`}
                    initial={{ clipPath: activeColConfig.clipFrom }}
                    animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
                    exit={{ clipPath: activeColConfig.clipFrom }}
                    transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
                    className="absolute inset-x-0 top-0 min-h-full z-10 bg-white flex flex-col w-full"
                  >
                    <div ref={expandedMeasureRef} className="flex flex-col flex-none">
                      {/* Expanded Single-Category Header Spanning Full 3 Columns */}
                      <div
                        className={`relative flex items-center justify-center px-4 h-[53px] ${activeColConfig.solidHeaderBg} border-b border-black/[0.06]`}
                      >
                        <motion.button
                          type="button"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.16 }}
                          onClick={() => setExpandedCol(null)}
                          aria-label="Kembali ke 3 kolom"
                          className={`absolute left-3.5 w-6 h-6 rounded-full flex items-center justify-center transition-colors cursor-pointer z-10 ${activeColConfig.arrowHoverClass}`}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </motion.button>

                        <motion.div
                          initial={{ left: activeColConfig.headerStartLeft, x: '-50%' }}
                          animate={{ left: '50%', x: '-50%' }}
                          exit={{ left: activeColConfig.headerStartLeft, x: '-50%' }}
                          transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
                          className="absolute inset-y-0 flex items-center gap-2 whitespace-nowrap"
                        >
                          <ActiveIcon className={`w-4 h-4 shrink-0 ${activeColConfig.iconColor}`} />
                          <span className="text-[13.5px] font-semibold text-[#1C1D21]">
                            {activeColConfig.title}
                          </span>
                          <span
                            className={`min-w-[22px] h-[22px] px-1.5 rounded-full text-[11px] font-bold inline-flex items-center justify-center tabular-nums shadow-2xs ${activeColConfig.badgeClass}`}
                          >
                            {expandedList.length}
                          </span>
                        </motion.div>
                      </div>

                      {/* Horizontal Slide Viewport (3 columns x 10 items per slide = 30 items/slide) */}
                      {expandedList.length === 0 ? (
                        <div className="text-center py-12 text-[12.5px] text-[#9496A1]">No records</div>
                      ) : (
                        <div className="overflow-hidden">
                          <motion.div
                            className="flex select-none"
                            style={{ touchAction: totalSlides > 1 ? 'pan-y' : 'auto' }}
                            animate={{ x: `-${safeSlideIndex * 100}%` }}
                            transition={{ duration: 0.26, ease: [0.23, 1, 0.32, 1] }}
                            onPanEnd={(_event, info) => {
                              if (totalSlides <= 1) return;
                              if (info.offset.x < -45 || info.velocity.x < -300) {
                                goToSlide(safeSlideIndex + 1);
                              } else if (info.offset.x > 45 || info.velocity.x > 300) {
                                goToSlide(safeSlideIndex - 1);
                              }
                            }}
                          >
                            {slides.map((cols, sIdx) => (
                              <div
                                key={`slide-${activeColConfig.key}-${sIdx}`}
                                className="w-full shrink-0 grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-black/[0.06]"
                              >
                                {cols.map((colItems, cIdx) => (
                                  <div
                                    key={`col-${sIdx}-${cIdx}`}
                                    className="divide-y divide-black/[0.05] flex flex-col"
                                  >
                                    {colItems.map(renderStudentRow)}
                                  </div>
                                ))}
                              </div>
                            ))}
                          </motion.div>
                        </div>
                      )}

                      {/* Centered Slide Indicator Only */}
                      <div className="px-4 py-3 bg-[#FAFBFD] border-t border-black/[0.06] flex items-center justify-center">
                        <div className="flex items-center gap-1.5" role="tablist" aria-label="Slide indikator kolom">
                          {Array.from({ length: totalSlides }, (_, idx) => {
                            const isActive = idx === safeSlideIndex;
                            return (
                              <button
                                key={idx}
                                type="button"
                                role="tab"
                                aria-selected={isActive}
                                aria-label={`Slide ${idx + 1}`}
                                onClick={() => goToSlide(idx)}
                                className={`h-2 rounded-full transition-all duration-200 cursor-pointer ${
                                  isActive
                                    ? `w-6 ${activeColConfig.indicatorActiveClass}`
                                    : 'w-2 bg-black/[0.15] hover:bg-black/[0.3]'
                                }`}
                              />
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })()}
          </AnimatePresence>
        </motion.div>
      </div>

      <AllAttendanceRecordsCard selectedDay={Math.min(attendanceDay, daysInMonth)} />
    </div>
  );
};
