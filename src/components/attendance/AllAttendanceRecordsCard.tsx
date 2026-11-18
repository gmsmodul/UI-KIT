import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CheckCircle2,
  Clock,
  XCircle,
  CalendarX2,
  History,
  MapPin,
} from 'lucide-react';
import { useApp, normalizeAttendanceClassKey } from '../../context/AppContext';
import { CustomSelect } from '../ui/CustomSelect';

interface AttendanceHistoryEntry {
  id: string;
  timeLabel: string;
  classLabel: string;
  subject: string;
  source: 'QR' | 'Roster';
  status: 'On Time' | 'Late' | 'Present';
}

interface MissedClassEntry {
  id: string;
  dayDateLabel: string;
  timeRange: string;
  classLabel: string;
  subject: string;
  room: string;
  reason: 'Absent' | 'Excuse' | 'Tidak Hadir';
}

interface AggregatedUserRecord {
  key: string;
  name: string;
  initials: string;
  color: string;
  niu: string;
  latestTime: string;
  latestClass: string;
  division: string;
  latestStatus: 'On Time' | 'Late' | 'Absent' | 'Excuse' | 'Present';
  sortPriority: number;
  attendedHistory: AttendanceHistoryEntry[];
  missedClasses: MissedClassEntry[];
}

const DAY_NUMBER_LABEL: Record<string, string> = {
  Mon: '09 Feb 2026',
  Tue: '10 Feb 2026',
  Wed: '11 Feb 2026',
  Thu: '12 Feb 2026',
  Fri: '13 Feb 2026',
};

const CLASS_DIVISION_MAP: Record<string, string> = {
  'Class 302': 'Grade 12 · Science',
  'Class 303': 'Grade 10 · Physics',
  'Class 304': 'Grade 9 · Creative Arts',
  'Class 305': 'Grade 11 · Literature',
  'All Classes': 'Servolution Crew',
};

function getStatusBadgeStyle(status: AggregatedUserRecord['latestStatus']) {
  switch (status) {
    case 'On Time':
    case 'Present':
      return {
        pill: 'bg-[#E6F9F0] text-[#146C43]',
        dot: 'bg-[#10B981]',
      };
    case 'Late':
    case 'Excuse':
      return {
        pill: 'bg-[#FFF5E6] text-[#8C5811]',
        dot: 'bg-[#D97706]',
      };
    case 'Absent':
    default:
      return {
        pill: 'bg-[#FEF1F5] text-[#9D113C]',
        dot: 'bg-[#ee2e65]',
      };
  }
}

export const AllAttendanceRecordsCard: React.FC<{ selectedDay: number }> = ({ selectedDay }) => {
  const { attendanceByClass, qrCheckIns, schedules, studentsDirectory } = useApp();

  const [sectionOpen, setSectionOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const infoPopoverRef = useRef<HTMLDivElement>(null);
  const [expandedUserKey, setExpandedUserKey] = useState<string | null>(null);
  const [rowsPerPage, setRowsPerPage] = useState<number>(20);
  const [page, setPage] = useState<number>(1);

  useEffect(() => {
    if (!infoOpen) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (infoPopoverRef.current && !infoPopoverRef.current.contains(e.target as Node)) {
        setInfoOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setInfoOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [infoOpen]);

  const selectedDayPadded = String(selectedDay).padStart(2, '0');

  const aggregatedUsers = useMemo<AggregatedUserRecord[]>(() => {
    const userMap = new Map<
      string,
      {
        key: string;
        name: string;
        initials: string;
        color: string;
        niu: string;
        primaryClass: string;
        division: string;
        latestTime: string;
        latestClass: string;
        latestStatus: AggregatedUserRecord['latestStatus'];
        sortPriority: number;
        attendedHistory: AttendanceHistoryEntry[];
        rosterClassesAttended: Set<string>;
        rosterClassesAbsent: Set<string>;
        rosterClassesExcused: Set<string>;
      }
    >();

    const ensureUser = (name: string, initials: string, color: string, idHint?: string, classHint?: string) => {
      const key = name.trim().toLowerCase();
      let entry = userMap.get(key);
      if (!entry) {
        const dirMatch = studentsDirectory.find((s) => s.name.trim().toLowerCase() === key);
        const resolvedClass = classHint || dirMatch?.classCode || 'Class 302';
        entry = {
          key,
          name: dirMatch?.name || name,
          initials: dirMatch?.initials || initials,
          color: dirMatch?.color || color,
          niu: dirMatch?.id || idHint || '—',
          primaryClass: resolvedClass,
          division: CLASS_DIVISION_MAP[resolvedClass] || dirMatch?.grade || 'Servolution Crew',
          latestTime: `${selectedDayPadded} Feb 2026, 08:00`,
          latestClass: resolvedClass,
          latestStatus: 'Present',
          sortPriority: 100,
          attendedHistory: [],
          rosterClassesAttended: new Set<string>(),
          rosterClassesAbsent: new Set<string>(),
          rosterClassesExcused: new Set<string>(),
        };
        userMap.set(key, entry);
      }
      return entry;
    };

    // 1. Ingest all roster records across all classes
    Object.entries(attendanceByClass).forEach(([className, buckets]) => {
      const classSchedules = schedules.filter(
        (s) => normalizeAttendanceClassKey(s.classCode) === className
      );
      const defaultSubject = classSchedules[0]?.subject || className;

      buckets.attendance.forEach((st, idx) => {
        const u = ensureUser(st.name, st.initials, st.color, st.id, className);
        u.rosterClassesAttended.add(className);
        const isQr = st.checkedInVia === 'QR';
        if (!isQr) {
          u.attendedHistory.push({
            id: `roster-att-${className}-${st.id}`,
            timeLabel: `${selectedDayPadded} Feb 2026, 08:00`,
            classLabel: className,
            subject: st.scheduleSubject || defaultSubject,
            source: 'Roster',
            status: 'Present',
          });
          u.latestTime = `${selectedDayPadded} Feb 2026, 08:00`;
          u.latestClass = `${className} · ${st.scheduleSubject || defaultSubject}`;
          u.latestStatus = 'Present';
          u.sortPriority = Math.min(u.sortPriority, 50 + idx);
        }
      });

      (buckets.excuse || []).forEach((st, idx) => {
        const u = ensureUser(st.name, st.initials, st.color, st.id, className);
        u.rosterClassesExcused.add(className);
        u.latestTime = `${selectedDayPadded} Feb 2026, 08:00`;
        u.latestClass = st.excuseReason
          ? `${className} · ${st.excuseReason}`
          : `${className} · ${defaultSubject}`;
        u.latestStatus = 'Excuse';
        u.sortPriority = Math.min(u.sortPriority, 30 + idx);
      });

      buckets.absences.forEach((st, idx) => {
        const u = ensureUser(st.name, st.initials, st.color, st.id, className);
        u.rosterClassesAbsent.add(className);
        u.latestTime = `${selectedDayPadded} Feb 2026, 08:00`;
        u.latestClass = `${className} · ${defaultSubject}`;
        u.latestStatus = 'Absent';
        u.sortPriority = Math.min(u.sortPriority, 20 + idx);
      });
    });

    // 2. Ingest live & persisted QR check-ins (highest priority / newest first)
    qrCheckIns.forEach((rec, idx) => {
      const className = normalizeAttendanceClassKey(rec.classCode);
      const u = ensureUser(
        rec.crewName,
        rec.initials,
        rec.status === 'Late'
          ? 'bg-[#FDE0E9] text-[#9D113C]'
          : 'bg-[#C4F0DC] text-[#146C43]',
        undefined,
        className
      );
      const formattedTime = `Hari ini, ${rec.checkInTime.slice(0, 5)}`;
      u.attendedHistory.unshift({
        id: `qr-${rec.id}`,
        timeLabel: formattedTime,
        classLabel: className,
        subject: rec.subject,
        source: 'QR',
        status: rec.status,
      });
      u.latestTime = formattedTime;
      u.latestClass = `${className} · ${rec.subject}`;
      u.latestStatus = rec.status;
      u.sortPriority = idx; // Bring fresh QR check-ins straight to the top
    });

    // 3. Build missed classes list for each user from schedules
    return Array.from(userMap.values())
      .map<AggregatedUserRecord>((u) => {
        const qrScheduleIds = new Set(
          qrCheckIns
            .filter((c) => c.crewName.trim().toLowerCase() === u.key)
            .map((c) => c.scheduleId)
        );

        const missedClasses: MissedClassEntry[] = [];
        schedules.forEach((sch) => {
          const schClassName = normalizeAttendanceClassKey(sch.classCode);
          const attendedViaQr = qrScheduleIds.has(sch.id);
          const attendedViaRosterOnDay =
            u.rosterClassesAttended.has(schClassName) &&
            !u.rosterClassesAbsent.has(schClassName) &&
            !u.rosterClassesExcused.has(schClassName) &&
            sch.date === selectedDayPadded;

          if (!attendedViaQr && !attendedViaRosterOnDay) {
            const isExcusedInClass = u.rosterClassesExcused.has(schClassName);
            const isExplicitAbsentInOwnClass = u.rosterClassesAbsent.has(schClassName);
            missedClasses.push({
              id: `${u.key}-missed-${sch.id}`,
              dayDateLabel: `${sch.day}, ${DAY_NUMBER_LABEL[sch.day] || `${sch.date} Feb 2026`}`,
              timeRange: `${sch.startHour}–${sch.endHour}`,
              classLabel: schClassName,
              subject: sch.subject,
              room: sch.room,
              reason: isExcusedInClass
                ? 'Excuse'
                : isExplicitAbsentInOwnClass
                  ? 'Absent'
                  : 'Tidak Hadir',
            });
          }
        });

        return {
          key: u.key,
          name: u.name,
          initials: u.initials,
          color: u.color,
          niu: u.niu,
          latestTime: u.latestTime,
          latestClass: u.latestClass,
          division: u.division,
          latestStatus: u.latestStatus,
          sortPriority: u.sortPriority,
          attendedHistory: u.attendedHistory,
          missedClasses,
        };
      })
      .sort((a, b) => a.sortPriority - b.sortPriority || a.name.localeCompare(b.name));
  }, [attendanceByClass, qrCheckIns, schedules, studentsDirectory, selectedDayPadded]);

  const totalItems = aggregatedUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));
  const safePage = Math.min(page, totalPages);
  const startIdx = (safePage - 1) * rowsPerPage;
  const endIdx = Math.min(startIdx + rowsPerPage, totalItems);
  const pageRows = aggregatedUsers.slice(startIdx, endIdx);

  const toggleUserRow = (key: string) => {
    setExpandedUserKey((curr) => (curr === key ? null : key));
  };

  return (
    <section className="bg-white rounded-2xl border border-black/[0.07] overflow-hidden">
      {/* Outer Section Collapsible Header with ? Info Popover */}
      <div
        role="button"
        tabIndex={0}
        aria-expanded={sectionOpen}
        onClick={() => setSectionOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setSectionOpen((prev) => !prev);
          }
        }}
        className="w-full px-5 sm:px-6 py-4 sm:py-5 flex items-center gap-2 flex-wrap text-left cursor-pointer hover:bg-[#FAFBFD]/70 transition-colors select-none"
      >
        <ChevronDown
          className={`w-4 h-4 text-[#1C1D21] transition-transform duration-200 shrink-0 ${
            sectionOpen ? 'rotate-0' : '-rotate-90'
          }`}
        />
        <span className="text-[14.5px] font-semibold text-[#1C1D21] tabular-nums">
          All attendance records - {totalItems}
        </span>

        <div
          className="relative flex items-center"
          ref={infoPopoverRef}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            aria-label="Informasi catatan kehadiran"
            aria-expanded={infoOpen}
            onClick={() => setInfoOpen((prev) => !prev)}
            className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors shrink-0 cursor-pointer ${
              infoOpen
                ? 'bg-[#FEF1F5] border-[#ee2e65] text-[#9D113C]'
                : 'bg-white border-black/[0.15] text-[#6E717A] hover:text-[#1C1D21] hover:border-black/[0.3]'
            }`}
          >
            <span className="text-[10px] font-bold leading-none">?</span>
          </button>

          {infoOpen && (
            <div
              role="dialog"
              aria-label="Informasi catatan kehadiran"
              className="absolute left-0 top-full mt-2 z-30 w-[min(340px,calc(100vw-4rem))] bg-white rounded-2xl border border-black/[0.08] shadow-[0_14px_34px_-10px_rgba(15,23,42,0.18)] p-3.5 text-[12.5px] leading-relaxed text-[#4B4E57] animate-ui-pop select-text cursor-default"
            >
              Satu catatan terbaru per pengguna. Buka baris pengguna untuk seluruh riwayat kehadiran dan kelas yang tidak dihadiri pada periode aktif.
            </div>
          )}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {sectionOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0, filter: 'blur(2px)' }}
            animate={{ height: 'auto', opacity: 1, filter: 'blur(0px)' }}
            exit={{ height: 0, opacity: 0, filter: 'blur(2px)' }}
            transition={{
              height: { type: 'spring', stiffness: 420, damping: 30, mass: 0.8 },
              opacity: { duration: 0.2, ease: [0.23, 1, 0.32, 1] },
              filter: { duration: 0.2, ease: [0.23, 1, 0.32, 1] },
            }}
            className="overflow-hidden"
          >
            <div className="px-5 sm:px-6 pb-5 sm:pb-6 space-y-4">
            {/* Table Container */}
            <div className="rounded-2xl border border-black/[0.07] overflow-hidden bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[720px]">
                  <thead>
                    <tr className="bg-[#FAFBFD] border-b border-black/[0.06] text-[11.5px] font-medium text-[#6E717A]">
                      <th className="py-3 px-4 w-[160px]">Time</th>
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4 w-[100px]">NIU</th>
                      <th className="py-3 px-4">Class</th>
                      <th className="py-3 px-4">Division</th>
                      <th className="py-3 px-4 w-[130px]">Status</th>
                      <th className="py-3 px-4 w-[44px]" aria-label="Expand" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.06] text-[13px]">
                    {pageRows.map((row) => {
                      const isExpanded = expandedUserKey === row.key;
                      const badgeStyle = getStatusBadgeStyle(row.latestStatus);

                      return (
                        <React.Fragment key={row.key}>
                          <tr
                            onClick={() => toggleUserRow(row.key)}
                            className={`cursor-pointer transition-colors ${
                              isExpanded ? 'bg-[#FAFBFD]' : 'bg-white hover:bg-[#FAFBFD]'
                            }`}
                          >
                            <td className="py-3.5 px-4 text-[12px] text-[#6E717A] tabular-nums whitespace-nowrap">
                              {row.latestTime}
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-[#1C1D21] whitespace-nowrap">
                              {row.name}
                            </td>
                            <td className="py-3.5 px-4 text-[12px] text-[#6E717A] tabular-nums whitespace-nowrap">
                              {row.niu}
                            </td>
                            <td className="py-3.5 px-4 text-[12.5px] text-[#1C1D21] whitespace-nowrap">
                              {row.latestClass}
                            </td>
                            <td className="py-3.5 px-4 text-[12.5px] text-[#6E717A] whitespace-nowrap">
                              {row.division}
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-semibold ${badgeStyle.pill}`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${badgeStyle.dot}`} />
                                <span>{row.latestStatus}</span>
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <ChevronDown
                                className={`w-4 h-4 text-[#6E717A] transition-transform duration-200 inline-block ${
                                  isExpanded ? 'rotate-180 text-[#ee2e65]' : ''
                                }`}
                              />
                            </td>
                          </tr>

                          {/* Expanded Accordion Details Row */}
                          {isExpanded && (
                            <tr className="bg-[#FAFBFD]/80">
                              <td colSpan={7} className="p-0">
                                <AnimatePresence initial={true}>
                                  <motion.div
                                    initial={{ height: 0, opacity: 0, filter: 'blur(2px)' }}
                                    animate={{ height: 'auto', opacity: 1, filter: 'blur(0px)' }}
                                    exit={{ height: 0, opacity: 0, filter: 'blur(2px)' }}
                                    transition={{
                                      height: { type: 'spring', stiffness: 420, damping: 30, mass: 0.8 },
                                      opacity: { duration: 0.2, ease: [0.23, 1, 0.32, 1] },
                                      filter: { duration: 0.2, ease: [0.23, 1, 0.32, 1] },
                                    }}
                                    className="overflow-hidden"
                                  >
                                    <div className="p-4 sm:p-5 border-t border-black/[0.05] space-y-4">
                                      {/* Table 1: Seluruh Data Kehadiran User */}
                                      <div className="bg-white rounded-xl border border-black/[0.07] overflow-hidden">
                                        <div className="px-4 py-3 bg-[#E6F9F0]/60 border-b border-black/[0.06] flex items-center justify-between gap-2">
                                          <div className="flex items-center gap-2">
                                            <History className="w-4 h-4 text-[#146C43]" />
                                            <span className="text-[12.5px] font-semibold text-[#1C1D21]">
                                              Seluruh Data Kehadiran ({row.name})
                                            </span>
                                          </div>
                                          <span className="px-2 py-0.5 rounded-full bg-white text-[#146C43] text-[11px] font-bold tabular-nums">
                                            {row.attendedHistory.length}
                                          </span>
                                        </div>

                                        {row.attendedHistory.length === 0 ? (
                                          <div className="p-5 text-center text-[12px] text-[#8A8D98]">
                                            Belum ada riwayat kehadiran tercatat untuk pengguna ini.
                                          </div>
                                        ) : (
                                          <div className="overflow-x-auto max-h-[260px] overflow-y-auto">
                                            <table className="w-full text-left border-collapse min-w-[540px]">
                                              <thead className="sticky top-0 z-10 bg-[#FAFBFD] border-b border-black/[0.06] text-[11px] font-medium text-[#6E717A]">
                                                <tr>
                                                  <th className="py-2.5 px-4 w-[160px]">Waktu</th>
                                                  <th className="py-2.5 px-4">Mata Pelajaran</th>
                                                  <th className="py-2.5 px-4 w-[130px]">Kelas</th>
                                                  <th className="py-2.5 px-4 w-[100px]">Sumber</th>
                                                  <th className="py-2.5 px-4 w-[130px]">Status</th>
                                                </tr>
                                              </thead>
                                              <tbody className="divide-y divide-black/[0.05] text-[12.5px]">
                                                {row.attendedHistory.map((item) => {
                                                  const isLate = item.status === 'Late';
                                                  return (
                                                    <tr key={item.id} className="hover:bg-[#FAFBFD] transition-colors">
                                                      <td className="py-2.5 px-4 text-[12px] text-[#6E717A] tabular-nums whitespace-nowrap">
                                                        {item.timeLabel}
                                                      </td>
                                                      <td className="py-2.5 px-4 font-semibold text-[#1C1D21] whitespace-nowrap">
                                                        {item.subject}
                                                      </td>
                                                      <td className="py-2.5 px-4 text-[#1C1D21] whitespace-nowrap">
                                                        {item.classLabel}
                                                      </td>
                                                      <td className="py-2.5 px-4 text-[12px] text-[#6E717A] whitespace-nowrap">
                                                        {item.source}
                                                      </td>
                                                      <td className="py-2.5 px-4 whitespace-nowrap">
                                                        <span
                                                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                                            isLate
                                                              ? 'bg-[#FFF5E6] text-[#8C5811]'
                                                              : 'bg-[#E6F9F0] text-[#146C43]'
                                                          }`}
                                                        >
                                                          {isLate ? (
                                                            <Clock className="w-3 h-3" />
                                                          ) : (
                                                            <CheckCircle2 className="w-3 h-3" />
                                                          )}
                                                          <span>{item.status}</span>
                                                        </span>
                                                      </td>
                                                    </tr>
                                                  );
                                                })}
                                              </tbody>
                                            </table>
                                          </div>
                                        )}
                                      </div>

                                      {/* Table 2: Seluruh Kelas yang Tidak Dihadiri User */}
                                      <div className="bg-white rounded-xl border border-black/[0.07] overflow-hidden">
                                        <div className="px-4 py-3 bg-[#FEF1F5]/75 border-b border-black/[0.06] flex items-center justify-between gap-2">
                                          <div className="flex items-center gap-2">
                                            <CalendarX2 className="w-4 h-4 text-[#9D113C]" />
                                            <span className="text-[12.5px] font-semibold text-[#1C1D21]">
                                              Seluruh Kelas yang Tidak Dihadiri
                                            </span>
                                          </div>
                                          <span className="px-2 py-0.5 rounded-full bg-white text-[#9D113C] text-[11px] font-bold tabular-nums">
                                            {row.missedClasses.length}
                                          </span>
                                        </div>

                                        {row.missedClasses.length === 0 ? (
                                          <div className="p-5 text-center text-[12px] text-[#146C43] font-medium">
                                            Pengguna ini menghadiri seluruh kelas terjadwal pada periode aktif.
                                          </div>
                                        ) : (
                                          <div className="overflow-x-auto max-h-[260px] overflow-y-auto">
                                            <table className="w-full text-left border-collapse min-w-[540px]">
                                              <thead className="sticky top-0 z-10 bg-[#FAFBFD] border-b border-black/[0.06] text-[11px] font-medium text-[#6E717A]">
                                                <tr>
                                                  <th className="py-2.5 px-4 w-[210px]">Tanggal & Jam</th>
                                                  <th className="py-2.5 px-4">Mata Pelajaran</th>
                                                  <th className="py-2.5 px-4 w-[130px]">Kelas</th>
                                                  <th className="py-2.5 px-4">Ruangan</th>
                                                  <th className="py-2.5 px-4 w-[130px]">Status</th>
                                                </tr>
                                              </thead>
                                              <tbody className="divide-y divide-black/[0.05] text-[12.5px]">
                                                {row.missedClasses.map((missed) => (
                                                  <tr key={missed.id} className="hover:bg-[#FAFBFD] transition-colors">
                                                    <td className="py-2.5 px-4 text-[12px] text-[#6E717A] tabular-nums whitespace-nowrap">
                                                      {missed.dayDateLabel}, {missed.timeRange}
                                                    </td>
                                                    <td className="py-2.5 px-4 font-semibold text-[#1C1D21] whitespace-nowrap">
                                                      {missed.subject}
                                                    </td>
                                                    <td className="py-2.5 px-4 text-[#1C1D21] whitespace-nowrap">
                                                      {missed.classLabel}
                                                    </td>
                                                    <td className="py-2.5 px-4 text-[12px] text-[#6E717A] whitespace-nowrap">
                                                      <span className="inline-flex items-center gap-1">
                                                        <MapPin className="w-3 h-3 text-[#8A8D98]" />
                                                        {missed.room}
                                                      </span>
                                                    </td>
                                                    <td className="py-2.5 px-4 whitespace-nowrap">
                                                      <span
                                                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                                          missed.reason === 'Excuse'
                                                            ? 'bg-[#FFF5E6] text-[#8C5811]'
                                                            : 'bg-[#FEF1F5] text-[#9D113C]'
                                                        }`}
                                                      >
                                                        <XCircle className="w-3 h-3" />
                                                        <span>{missed.reason}</span>
                                                      </span>
                                                    </td>
                                                  </tr>
                                                ))}
                                              </tbody>
                                            </table>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </motion.div>
                                </AnimatePresence>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}

                    {pageRows.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-10 text-center text-[13px] text-[#8A8D98]">
                          Belum ada data kehadiran tercatat.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer Pagination matching screenshot */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2.5 text-[12.5px] text-[#6E717A]">
                <span>Rows</span>
                <CustomSelect
                  value={String(rowsPerPage)}
                  onChange={(val) => {
                    setRowsPerPage(Number(val));
                    setPage(1);
                  }}
                  ariaLabel="Jumlah baris per halaman"
                  className="min-w-[74px]"
                  triggerClassName="py-1.5 px-3 text-[12.5px] rounded-full border-black/[0.1]"
                  options={[
                    { value: '10', label: '10' },
                    { value: '20', label: '20' },
                    { value: '50', label: '50' },
                  ]}
                />
                <span className="tabular-nums">
                  Showing {totalItems === 0 ? 0 : startIdx + 1}–{endIdx} of {totalItems}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setPage(1)}
                  aria-label="Halaman pertama"
                  className="w-8 h-8 rounded-full border border-black/[0.08] bg-white hover:bg-[#FAFBFD] disabled:opacity-40 flex items-center justify-center text-[#6E717A] cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronsLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  aria-label="Halaman sebelumnya"
                  className="w-8 h-8 rounded-full border border-black/[0.08] bg-white hover:bg-[#FAFBFD] disabled:opacity-40 flex items-center justify-center text-[#6E717A] cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="px-3.5 h-8 rounded-full border border-black/[0.08] bg-white text-[12px] font-semibold text-[#1C1D21] inline-flex items-center justify-center tabular-nums">
                  {safePage} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  aria-label="Halaman berikutnya"
                  className="w-8 h-8 rounded-full border border-black/[0.08] bg-white hover:bg-[#FAFBFD] disabled:opacity-40 flex items-center justify-center text-[#6E717A] cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage(totalPages)}
                  aria-label="Halaman terakhir"
                  className="w-8 h-8 rounded-full border border-black/[0.08] bg-white hover:bg-[#FAFBFD] disabled:opacity-40 flex items-center justify-center text-[#6E717A] cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronsRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
