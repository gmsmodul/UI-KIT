import React, { useMemo, useState } from 'react';
import {
  Plus,
  MapPin,
  Users,
  BookOpen,
  CheckCircle2,
  QrCode,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Clock,
} from 'lucide-react';
import { useApp, normalizeAttendanceClassKey } from '../../context/AppContext';
import { getAvailableClassOptions, normalizeClassKey } from '../../utils/scheduleSubjects';
import { PASTEL_THEMES } from '../../constants/theme';
import {
  ACTION_BTN_PRIMARY,
  ACTION_BTN_SECONDARY,
  ACTION_BTN_SOFT_PRIMARY,
} from '../../constants/buttonStyles';
import { ScheduleItem } from '../../types';
import { CustomSelect } from '../ui/CustomSelect';

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

const WEEKDAY_LONG_ID: Record<number, string> = {
  0: 'Minggu',
  1: 'Senin',
  2: 'Selasa',
  3: 'Rabu',
  4: 'Kamis',
  5: 'Jumat',
  6: 'Sabtu',
};

const WEEKDAY_TO_SCHEDULE_DAY: Record<number, ScheduleItem['day'] | null> = {
  0: null,
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: null,
};

function computeCutoffTimeLabel(startHour: string, toleranceMin: number): string {
  const match = String(startHour || '08:00').match(/(\d{1,2}):(\d{2})/);
  const h = match ? Math.min(23, Math.max(0, Number(match[1]))) : 8;
  const m = match ? Math.min(59, Math.max(0, Number(match[2]))) : 0;
  const totalMinutes = h * 60 + m + toleranceMin;
  const outH = Math.floor(totalMinutes / 60) % 24;
  const outM = totalMinutes % 60;
  return `${String(outH).padStart(2, '0')}:${String(outM).padStart(2, '0')}`;
}

export const SchedulePage: React.FC = () => {
  const {
    schedules,
    setIsAddScheduleOpen,
    handleUpdateScheduleTolerance,
    setActivePage,
    setSelectedAttendanceClass,
    qrCheckIns,
  } = useApp();

  const [calYear, setCalYear] = useState(2026);
  const [calMonth, setCalMonth] = useState(1); // February (0-indexed)
  const [selectedDay, setSelectedDay] = useState(9); // Mon 09 Feb 2026
  const [scheduleClassFilter, setScheduleClassFilter] = useState('All');

  const classOptions = useMemo(
    () => getAvailableClassOptions(schedules.map((s) => s.classCode)),
    [schedules]
  );

  const daysInMonth = useMemo(() => new Date(calYear, calMonth + 1, 0).getDate(), [calYear, calMonth]);
  const firstDayOffset = useMemo(() => {
    const jsDay = new Date(calYear, calMonth, 1).getDay();
    return (jsDay + 6) % 7; // Monday = 0 ... Sunday = 6
  }, [calYear, calMonth]);

  const safeSelectedDay = Math.min(selectedDay, daysInMonth);
  const selectedDateObj = useMemo(
    () => new Date(calYear, calMonth, safeSelectedDay),
    [calYear, calMonth, safeSelectedDay]
  );
  const selectedWeekdayShort = WEEKDAY_TO_SCHEDULE_DAY[selectedDateObj.getDay()];

  const selectedDateLabel = useMemo(() => {
    const dayName = WEEKDAY_LONG_ID[selectedDateObj.getDay()] || '';
    const dd = String(safeSelectedDay).padStart(2, '0');
    return `${dayName}, ${dd} ${MONTH_NAMES[calMonth]} ${calYear}`;
  }, [selectedDateObj, safeSelectedDay, calMonth, calYear]);

  const filteredSchedules = useMemo(() => {
    if (!selectedWeekdayShort) return [];
    return schedules.filter(
      (s) =>
        s.day === selectedWeekdayShort &&
        (scheduleClassFilter === 'All' || normalizeClassKey(s.classCode) === scheduleClassFilter)
    );
  }, [schedules, selectedWeekdayShort, scheduleClassFilter]);

  const activeScheduleDaysSet = useMemo(() => {
    const set = new Set<ScheduleItem['day']>();
    schedules.forEach((s) => {
      if (scheduleClassFilter === 'All' || normalizeClassKey(s.classCode) === scheduleClassFilter) {
        set.add(s.day);
      }
    });
    return set;
  }, [schedules, scheduleClassFilter]);

  const handlePrevMonth = () => {
    if (calMonth === 0) {
      setCalYear((y) => y - 1);
      setCalMonth(11);
    } else {
      setCalMonth((m) => m - 1);
    }
    setSelectedDay(1);
  };

  const handleNextMonth = () => {
    if (calMonth === 11) {
      setCalYear((y) => y + 1);
      setCalMonth(0);
    } else {
      setCalMonth((m) => m + 1);
    }
    setSelectedDay(1);
  };

  const handleOpenAttendanceForSchedule = (classCode: string) => {
    setSelectedAttendanceClass(normalizeClassKey(classCode));
    setActivePage('attendance');
  };

  const buildQrDisplayUrl = (item: ScheduleItem) => {
    const tol = item.lateToleranceMin ?? 5;
    const params = new URLSearchParams({
      qrDisplay: '1',
      scheduleId: item.id,
      classCode: item.classCode,
      subject: item.subject,
      room: item.room,
      dateStr: selectedDateLabel,
      startHour: item.startHour,
      endHour: item.endHour,
      tol: String(tol),
    });
    return `/?${params.toString()}`;
  };

  const onTimeCount = qrCheckIns.filter((c) => c.status === 'On Time').length;
  const lateCount = qrCheckIns.filter((c) => c.status === 'Late').length;

  return (
    <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 md:pb-6 border-b border-black/[0.05]">
        <div className="hidden md:block">
          <h1 className="text-[24px] font-semibold tracking-tight text-[#1C1D21]">Schedule</h1>
        </div>

        <div className="flex items-center justify-end gap-2.5 w-full md:w-auto">
          <CustomSelect
            value={scheduleClassFilter}
            onChange={setScheduleClassFilter}
            pill
            ariaLabel="Filter class jadwal"
            className="min-w-[160px]"
            triggerClassName="border-black/[0.08]"
            options={[
              { value: 'All', label: 'All Classes' },
              ...classOptions.map((cls) => ({ value: cls, label: cls })),
            ]}
          />
          <button
            onClick={() => setIsAddScheduleOpen(true)}
            className={ACTION_BTN_PRIMARY}
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span className="sm:hidden">Add</span>
            <span className="hidden sm:inline">Add Session</span>
          </button>
        </div>
      </div>

      {/* 12-Col Layout: Calendar Left, Schedules Right */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 lg:gap-7 items-start">
        {/* Left Column: Compact Calendar + QR Summary */}
        <div className="md:col-span-5 lg:col-span-4 space-y-5">
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
                  setSelectedDay(9);
                }}
                className="px-2.5 py-1 rounded-full bg-white border border-black/[0.09] text-[11.5px] font-medium text-[#6E717A] hover:text-[#1C1D21] hover:bg-[#FAFBFD] cursor-pointer"
              >
                09 Feb
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
                const isSelected = safeSelectedDay === day;
                const dObj = new Date(calYear, calMonth, day);
                const schedDay = WEEKDAY_TO_SCHEDULE_DAY[dObj.getDay()];
                const hasSessions = Boolean(schedDay && activeScheduleDaysSet.has(schedDay));
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`relative h-8 rounded-full font-medium transition-colors cursor-pointer flex items-center justify-center ${
                      isSelected
                        ? 'bg-[#ee2e65] text-white font-semibold'
                        : 'bg-white text-[#1C1D21] hover:bg-[#FEF1F5] hover:text-[#9D113C]'
                    }`}
                  >
                    <span>{day}</span>
                    {hasSessions && (
                      <span
                        className={`absolute bottom-1 w-1 h-1 rounded-full ${
                          isSelected ? 'bg-white/90' : 'bg-[#ee2e65]'
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Compact Session & QR Check-in Summary */}
          <div className="rounded-2xl border border-black/[0.06] divide-y divide-black/[0.06] overflow-hidden bg-white">
            <div className="p-4 bg-[#FAFBFD] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white border border-black/[0.06] flex items-center justify-center text-[#ee2e65]">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[13.5px] font-bold text-[#1C1D21] tabular-nums">
                    {filteredSchedules.length} Sesi Terjadwal
                  </div>
                  <div className="text-[11.5px] text-[#6E717A]">{selectedDateLabel}</div>
                </div>
              </div>
            </div>

            <div className="p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#E6F9F0] flex items-center justify-center text-[#146C43]">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[13.5px] font-bold text-[#1C1D21] tabular-nums">
                    {qrCheckIns.length} Scan Crew QR
                  </div>
                  <div className="text-[11.5px] text-[#6E717A] tabular-nums">
                    {onTimeCount} On Time · {lateCount} Late
                  </div>
                </div>
              </div>
              <button
                onClick={() => setActivePage('attendance')}
                className={ACTION_BTN_SOFT_PRIMARY}
              >
                Attendance
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Schedule List for Selected Date */}
        <div className="md:col-span-7 lg:col-span-8 bg-white rounded-2xl border border-black/[0.07] overflow-hidden">
          <div className="px-5 py-4 border-b border-black/[0.06] bg-[#FAFBFD] flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-[15.5px] font-semibold text-[#1C1D21]">{selectedDateLabel}</h2>
              <p className="text-[12px] text-[#6E717A]">
                Atur batas keterlambatan dari jam mulai kelas, lalu klik <span className="font-semibold text-[#1C1D21]">Kode QR</span> untuk membuka layar QR di tab baru
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-black/[0.08] text-[12px] font-semibold text-[#1C1D21] tabular-nums">
              <Clock className="w-3.5 h-3.5 text-[#ee2e65]" />
              <span>{filteredSchedules.length} Sesi</span>
            </span>
          </div>

          <div className="divide-y divide-black/[0.06]">
            {filteredSchedules.map((item) => {
              const theme = PASTEL_THEMES[item.theme] || PASTEL_THEMES.periwinkle;
              const toleranceMin = item.lateToleranceMin ?? 5;
              const cutoffLabel = computeCutoffTimeLabel(item.startHour, toleranceMin);
              const itemCheckInCount = qrCheckIns.filter((c) => c.scheduleId === item.id).length;

              return (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 flex flex-col gap-3.5 hover:bg-[#FAFBFD] transition-colors"
                >
                  <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                    <div className="flex items-start sm:items-center gap-4 min-w-0">
                      <div className="w-[74px] shrink-0 tabular-nums border-r border-black/[0.06] pr-3.5">
                        <div className="text-[13.5px] font-bold text-[#1C1D21]">{item.startHour}</div>
                        <div className="text-[11px] text-[#8A8D98]">{item.endHour}</div>
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${theme.dot}`} />
                          <span className={`${theme.bg} ${theme.text} text-[11px] font-bold px-2.5 py-0.5 rounded-full`}>
                            {normalizeAttendanceClassKey(item.classCode)}
                          </span>
                          <span className="text-[11.5px] font-medium text-[#6E717A]">{item.type}</span>
                          {itemCheckInCount > 0 && (
                            <span className="text-[11px] font-semibold text-[#146C43] bg-[#E6F9F0] px-2 py-0.5 rounded-full tabular-nums">
                              {itemCheckInCount} scan QR
                            </span>
                          )}
                        </div>
                        <h3 className="text-[15.5px] font-semibold text-[#1C1D21] mt-1.5 truncate">
                          {item.subject}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-[#6E717A] mt-1">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-[#8A8D98]" /> {item.room}
                          </span>
                          <span className="flex items-center gap-1 tabular-nums">
                            <Users className="w-3.5 h-3.5 text-[#8A8D98]" /> {item.students} students
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 self-end xl:self-center shrink-0">
                      <a
                        href={buildQrDisplayUrl(item)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={ACTION_BTN_PRIMARY}
                      >
                        <QrCode className="w-4 h-4 shrink-0" />
                        <span>Kode QR</span>
                      </a>
                      <button
                        onClick={() => setActivePage('prep')}
                        className={ACTION_BTN_SECONDARY}
                      >
                        <BookOpen className="w-4 h-4 sm:hidden shrink-0" />
                        <span className="sm:hidden">Prep</span>
                        <span className="hidden sm:inline">Lesson Plan</span>
                      </button>
                      <button
                        onClick={() => handleOpenAttendanceForSchedule(item.classCode)}
                        className={ACTION_BTN_SOFT_PRIMARY}
                      >
                        <CheckCircle2 className="w-4 h-4 sm:hidden shrink-0" />
                        <span>Attendance</span>
                      </button>
                    </div>
                  </div>

                  {/* Per-schedule late tolerance rule tied to class startHour */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-black/[0.04] pl-0 sm:pl-[90px]">
                    <div className="flex items-center gap-2 text-[12px] text-[#6E717A]">
                      <Clock className="w-3.5 h-3.5 text-[#8A8D98] shrink-0" />
                      <span>
                        Batas On Time ({item.startHour} + toleransi):{' '}
                        <strong className="text-[#1C1D21] tabular-nums">{cutoffLabel}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-medium text-[#8A8D98]">Toleransi Late:</span>
                      <div className="inline-flex items-center gap-1">
                        {[0, 5, 10, 15].map((min) => {
                          const active = toleranceMin === min;
                          return (
                            <button
                              key={min}
                              type="button"
                              onClick={() => handleUpdateScheduleTolerance(item.id, min)}
                              className={`px-2 py-1 rounded-lg text-[11px] font-semibold tabular-nums transition-colors cursor-pointer ${
                                active
                                  ? 'bg-[#1C1D21] text-white'
                                  : 'bg-[#FAFBFD] border border-black/[0.07] text-[#6E717A] hover:text-[#1C1D21]'
                              }`}
                            >
                              +{min}m
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredSchedules.length === 0 && (
              <div className="p-10 text-center space-y-3">
                <p className="text-[#8A8D98] text-[13px]">
                  Tidak ada sesi jadwal pada {selectedDateLabel} untuk filter saat ini.
                </p>
                <button
                  onClick={() => setIsAddScheduleOpen(true)}
                  className={ACTION_BTN_SECONDARY}
                >
                  <Plus className="w-4 h-4 shrink-0" />
                  <span>Tambah Sesi Baru</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
