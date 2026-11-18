import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertCircle,
  Award,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Download,
  RotateCcw,
  Save,
  Search,
  Trash2,
  UserCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  getScaleForPosition,
  getScaleOptionAnalogousColors,
  normalizeScaleValueToExamMax,
  resolveExamAssessmentConfig,
} from '../../data/examPositions';
import { applyScoreRounding, resolveGradeBand } from '../../data/batchDefaults';
import { ExamParameterScore, ExamPositionParameter, ScheduleItem } from '../../types';
import { CustomSelect } from '../ui/CustomSelect';
import { ACTION_BTN_PRIMARY, ACTION_BTN_SECONDARY } from '../../constants/buttonStyles';

const WEEKDAY_TO_SCHEDULE_DAY: Record<number, ScheduleItem['day'] | null> = {
  0: null,
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: null,
};

const WEEKDAY_LONG_ID: Record<number, string> = {
  0: 'Minggu',
  1: 'Senin',
  2: 'Selasa',
  3: 'Rabu',
  4: 'Kamis',
  5: 'Jumat',
  6: 'Sabtu',
};

const MONTH_SHORT_ID = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

function getTodayLocalIsoDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseIsoDateLocal(iso: string): Date {
  const parts = String(iso || '').split('-').map(Number);
  if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  return new Date();
}

function formatIndonesianDate(iso: string): string {
  const d = parseIsoDateLocal(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const dayName = WEEKDAY_LONG_ID[d.getDay()] || '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mon = MONTH_SHORT_ID[d.getMonth()] || '';
  return `${dayName}, ${dd} ${mon} ${d.getFullYear()}`;
}

interface ScheduleSubjectResolution {
  dayShort: ScheduleItem['day'] | null;
  dayName: string;
  matchedOnDate: ScheduleItem[];
  allSubjects: string[];
  autoSubject: string;
  sourceKind: 'exam_session' | 'schedule_session' | 'fallback_exam' | 'none';
}

function resolveScheduleSubjectsForDate(
  dateIso: string,
  schedules: ScheduleItem[]
): ScheduleSubjectResolution {
  const dateObj = parseIsoDateLocal(dateIso);
  const jsDay = dateObj.getDay();
  const dayShort = WEEKDAY_TO_SCHEDULE_DAY[jsDay] ?? null;
  const dayName = WEEKDAY_LONG_ID[jsDay] || '';

  const prioritizeExam = (items: ScheduleItem[]) =>
    [...items].sort((a, b) => {
      const aExam = a.type.toLowerCase() === 'exam' ? 0 : 1;
      const bExam = b.type.toLowerCase() === 'exam' ? 0 : 1;
      if (aExam !== bExam) return aExam - bExam;
      return a.startHour.localeCompare(b.startHour);
    });

  const matchedOnDate = dayShort
    ? prioritizeExam(schedules.filter((s) => s.day === dayShort))
    : [];

  const seenSubjects = new Set<string>();
  const allSubjects: string[] = [];
  prioritizeExam(schedules).forEach((s) => {
    const clean = s.subject.trim();
    if (clean && !seenSubjects.has(clean)) {
      seenSubjects.add(clean);
      allSubjects.push(clean);
    }
  });

  if (matchedOnDate.length > 0) {
    const top = matchedOnDate[0];
    return {
      dayShort,
      dayName,
      matchedOnDate,
      allSubjects,
      autoSubject: top.subject,
      sourceKind: top.type.toLowerCase() === 'exam' ? 'exam_session' : 'schedule_session',
    };
  }

  const anyExam = prioritizeExam(schedules).find((s) => s.type.toLowerCase() === 'exam');
  if (anyExam) {
    return {
      dayShort,
      dayName,
      matchedOnDate: [],
      allSubjects,
      autoSubject: anyExam.subject,
      sourceKind: 'fallback_exam',
    };
  }

  return {
    dayShort,
    dayName,
    matchedOnDate: [],
    allSubjects,
    autoSubject: allSubjects[0] || '',
    sourceKind: 'none',
  };
}

export const ExamsPage: React.FC = () => {
  const {
    schedules,
    studentsDirectory,
    activeBatch,
    examGradingRule,
    examAssessments,
    handleAddExamAssessment,
    handleDeleteExamAssessment,
    triggerToast,
  } = useApp();

  const todayIso = useMemo(() => getTodayLocalIsoDate(), []);

  // Form identity state
  const [examDate, setExamDate] = useState<string>(todayIso);
  const [subject, setSubject] = useState<string>('');
  const [customSubjectMode, setCustomSubjectMode] = useState<boolean>(false);

  const [examineeMode, setExamineeMode] = useState<'directory' | 'manual'>(() =>
    studentsDirectory.length > 0 ? 'directory' : 'manual'
  );
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [manualExamineeName, setManualExamineeName] = useState<string>('');

  const [selectedPositionId, setSelectedPositionId] = useState<string>('');
  const [parameterScores, setParameterScores] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<string>('');

  // History list & accordion state
  const [historyOpen, setHistoryOpen] = useState<boolean>(false);
  const [historySearch, setHistorySearch] = useState<string>('');
  const [expandedAssessmentId, setExpandedAssessmentId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const scheduleResolution = useMemo(
    () => resolveScheduleSubjectsForDate(examDate, schedules),
    [examDate, schedules]
  );

  // Auto-populate Subject Ujian from Schedule whenever examDate or schedules change
  useEffect(() => {
    if (customSubjectMode) return;
    if (scheduleResolution.autoSubject) {
      setSubject(scheduleResolution.autoSubject);
    } else {
      setSubject('');
    }
  }, [scheduleResolution.autoSubject, customSubjectMode]);

  // Keep directory/manual examinee mode valid if batch switches
  useEffect(() => {
    if (studentsDirectory.length === 0) {
      setExamineeMode('manual');
      setSelectedStudentId('');
    } else if (
      selectedStudentId &&
      !studentsDirectory.some((s) => s.id === selectedStudentId)
    ) {
      setSelectedStudentId('');
    }
  }, [studentsDirectory, selectedStudentId]);

  const selectedStudent = useMemo(
    () => studentsDirectory.find((s) => s.id === selectedStudentId) || null,
    [studentsDirectory, selectedStudentId]
  );

  const examineeName =
    examineeMode === 'directory'
      ? selectedStudent?.name || ''
      : manualExamineeName.trim();

  const assessmentConfig = useMemo(
    () => resolveExamAssessmentConfig(examGradingRule),
    [examGradingRule]
  );

  const availablePositions = assessmentConfig.positions;

  useEffect(() => {
    if (
      selectedPositionId &&
      !availablePositions.some((p) => p.id === selectedPositionId)
    ) {
      setSelectedPositionId('');
      setParameterScores({});
    }
  }, [availablePositions, selectedPositionId]);

  const selectedPosition = useMemo(
    () => availablePositions.find((p) => p.id === selectedPositionId) || null,
    [availablePositions, selectedPositionId]
  );

  const selectedPositionSegments = useMemo(
    () =>
      selectedPosition
        ? assessmentConfig.segments.filter((seg) => seg.positionId === selectedPosition.id)
        : [],
    [assessmentConfig.segments, selectedPosition]
  );

  const activeScale = useMemo(
    () => getScaleForPosition(assessmentConfig, selectedPosition, examGradingRule),
    [assessmentConfig, selectedPosition, examGradingRule]
  );

  const sortedScaleOptions = useMemo(
    () => [...activeScale.options].sort((a, b) => a.value - b.value),
    [activeScale.options]
  );

  const groupedCriteria = useMemo(() => {
    if (!selectedPosition) return [] as { segmentName: string | null; items: ExamPositionParameter[] }[];
    if (selectedPositionSegments.length === 0) {
      return [{ segmentName: null, items: selectedPosition.parameters }];
    }

    const groups: { segmentName: string | null; items: ExamPositionParameter[] }[] = [];
    const assignedParamIds = new Set<string>();

    selectedPositionSegments.forEach((seg) => {
      const items = selectedPosition.parameters.filter((p) => p.segmentId === seg.id);
      if (items.length > 0) {
        items.forEach((item) => assignedParamIds.add(item.id));
        groups.push({ segmentName: seg.name, items });
      }
    });

    const unassigned = selectedPosition.parameters.filter(
      (p) => !assignedParamIds.has(p.id)
    );
    if (unassigned.length > 0) {
      groups.push({ segmentName: 'Kriteria Umum', items: unassigned });
    }

    return groups;
  }, [selectedPosition, selectedPositionSegments]);

  const handleSelectPosition = (nextPosId: string) => {
    setSelectedPositionId(nextPosId);
    setParameterScores({});
  };

  const handleSelectParameterScore = (paramId: string, value: number) => {
    setParameterScores((prev) => ({
      ...prev,
      [paramId]: value,
    }));
  };

  // Live calculation across selected position's parameters
  const assessmentSummary = useMemo(() => {
    if (!selectedPosition) {
      return {
        totalParams: 0,
        scoredParams: 0,
        allScored: false,
        finalScore: 0,
        gradeBand: resolveGradeBand(0, examGradingRule),
        passed: false,
      };
    }

    const totalParams = selectedPosition.parameters.length;
    const hasPositiveWeights = selectedPosition.parameters.some((p) => (Number(p.weightPct) || 0) > 0);
    let scoredParams = 0;
    let weightedSum = 0;
    let totalScoredWeight = 0;

    selectedPosition.parameters.forEach((param) => {
      const val = parameterScores[param.id];
      if (typeof val === 'number') {
        scoredParams += 1;
        const normalizedVal = normalizeScaleValueToExamMax(
          val,
          activeScale,
          examGradingRule.scaleMax
        );
        const effWeight = hasPositiveWeights ? Math.max(0, Number(param.weightPct) || 0) : 1;
        weightedSum += normalizedVal * effWeight;
        totalScoredWeight += effWeight;
      }
    });

    const rawScore = totalScoredWeight > 0 ? weightedSum / totalScoredWeight : 0;
    const finalScore =
      scoredParams > 0 ? applyScoreRounding(rawScore, examGradingRule.roundingMode) : 0;
    const gradeBand = resolveGradeBand(finalScore, examGradingRule);
    const passed =
      scoredParams > 0 && finalScore >= examGradingRule.passingScore && gradeBand.passed;

    return {
      totalParams,
      scoredParams,
      allScored: totalParams > 0 && scoredParams === totalParams,
      finalScore,
      gradeBand,
      passed,
    };
  }, [selectedPosition, parameterScores, activeScale, examGradingRule]);

  const handleResetForm = () => {
    setExamDate(getTodayLocalIsoDate());
    setCustomSubjectMode(false);
    setSelectedStudentId('');
    setManualExamineeName('');
    setSelectedPositionId('');
    setParameterScores({});
    setNotes('');
  };

  const handleSubmitAssessment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) {
      triggerToast('Subject Diperlukan', 'Pastikan subject ujian terisi atau pilih dari jadwal.', 'warning');
      return;
    }
    if (!examineeName) {
      triggerToast('Nama Peserta Diperlukan', 'Pilih atau ketik nama peserta yang akan diuji.', 'warning');
      return;
    }
    if (!selectedPosition) {
      triggerToast('Posisi Belum Dipilih', 'Pilih posisi yang diuji untuk menilai parameter.', 'warning');
      return;
    }
    if (!assessmentSummary.allScored) {
      triggerToast(
        'Penilaian Belum Lengkap',
        `Lengkapi seluruh ${assessmentSummary.totalParams} parameter penilaian sebelum menyimpan.`,
        'warning'
      );
      return;
    }

    const paramScoreList: ExamParameterScore[] = selectedPosition.parameters.map((p) => {
      const rawVal = parameterScores[p.id];
      const matchedOpt = sortedScaleOptions.find((o) => o.value === rawVal);
      const matchedSegment = selectedPositionSegments.find((s) => s.id === p.segmentId);
      const normalized = Math.round(
        normalizeScaleValueToExamMax(rawVal, activeScale, examGradingRule.scaleMax)
      );
      return {
        parameterId: p.id,
        segmentName: matchedSegment?.name,
        label: p.label,
        weightPct: p.weightPct,
        score: normalized,
        rawValue: rawVal,
        scaleLabel: matchedOpt?.label,
      };
    });

    const saved = handleAddExamAssessment({
      examDate,
      examDateLabel: formatIndonesianDate(examDate),
      subject: subject.trim(),
      examineeName,
      studentId: examineeMode === 'directory' ? selectedStudent?.id : undefined,
      positionId: selectedPosition.id,
      positionName: selectedPosition.name,
      parameterScores: paramScoreList,
      finalScore: assessmentSummary.finalScore,
      grade: assessmentSummary.gradeBand.grade,
      gradeLabel: assessmentSummary.gradeBand.label,
      passed: assessmentSummary.passed,
      notes: notes.trim() || undefined,
    });

    setHistoryOpen(true);
    setExpandedAssessmentId(saved.id);
    // Keep examDate & subject ready for next examinee, reset examinee, position, scores & notes
    setSelectedStudentId('');
    setManualExamineeName('');
    setSelectedPositionId('');
    setParameterScores({});
    setNotes('');
  };

  const handleExportAssessmentsCsv = () => {
    if (examAssessments.length === 0) {
      triggerToast('Belum Ada Data', 'Simpan minimal 1 penilaian ujian sebelum mengekspor CSV.', 'info');
      return;
    }
    const header =
      'Tanggal Ujian,Subject,Nama Peserta,Posisi,Nilai Akhir,Grade,Predikat,Status,Catatan\n';
    const rows = examAssessments
      .map((item) => {
        const esc = (v: string) => `"${String(v || '').replace(/"/g, '""')}"`;
        return [
          esc(item.examDateLabel),
          esc(item.subject),
          esc(item.examineeName),
          esc(item.positionName),
          item.finalScore,
          esc(item.grade),
          esc(item.gradeLabel),
          esc(item.passed ? 'Lulus' : 'Tidak Lulus'),
          esc(item.notes || ''),
        ].join(',');
      })
      .join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Penilaian_Exams_${activeBatch.batchName.replace(/\s+/g, '_')}_${activeBatch.year}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    triggerToast('CSV Diekspor', `${examAssessments.length} data penilaian berhasil diunduh.`, 'success');
  };

  const filteredAssessments = useMemo(() => {
    const q = historySearch.trim().toLowerCase();
    if (!q) return examAssessments;
    return examAssessments.filter(
      (a) =>
        a.examineeName.toLowerCase().includes(q) ||
        a.positionName.toLowerCase().includes(q) ||
        a.subject.toLowerCase().includes(q)
    );
  }, [examAssessments, historySearch]);

  const subjectDropdownOptions = useMemo(() => {
    const dateSubjects = scheduleResolution.matchedOnDate.map((s) => ({
      value: s.subject,
      label: `${s.subject} (${s.type} · ${s.startHour})`,
    }));

    const seen = new Set(dateSubjects.map((o) => o.value));
    const otherSubjects = scheduleResolution.allSubjects
      .filter((subj) => !seen.has(subj))
      .map((subj) => ({
        value: subj,
        label: subj,
      }));

    return [...dateSubjects, ...otherSubjects];
  }, [scheduleResolution]);

  return (
    <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 md:pb-6 border-b border-black/[0.05]">
        <div className="hidden md:block">
          <h1 className="text-[24px] font-semibold tracking-tight text-[#1C1D21]">
            Exam Assessment
          </h1>
          <p className="text-[12.5px] text-[#6E717A] mt-0.5 tabular-nums">
            {activeBatch.batchName} · Tahun {activeBatch.year} · KKM Lulus{' '}
            {examGradingRule.passingScore}/{examGradingRule.scaleMax}
          </p>
        </div>

        <div className="flex items-center justify-end gap-2.5 w-full md:w-auto">
          <button
            type="button"
            onClick={handleResetForm}
            className={ACTION_BTN_SECONDARY}
          >
            <RotateCcw className="w-4 h-4 shrink-0" />
            <span>Reset Form</span>
          </button>
          <button
            type="button"
            onClick={handleExportAssessmentsCsv}
            className={ACTION_BTN_PRIMARY}
          >
            <Download className="w-4 h-4 shrink-0" />
            <span className="sm:hidden">CSV</span>
            <span className="hidden sm:inline">Export Hasil CSV</span>
          </button>
        </div>
      </div>

      {/* Main Vertical Assessment Layout */}
      <form
        onSubmit={handleSubmitAssessment}
        className="space-y-6"
      >
        {/* Card 1: Identitas Ujian & Pemilihan Posisi */}
        <div className="bg-white rounded-2xl border border-black/[0.07] p-5 sm:p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3.5 border-b border-black/[0.06]">
            <h2 className="text-[16px] font-semibold text-[#1C1D21]">
              Formulir Penilaian Ujian
            </h2>
            <span className="text-[12px] font-medium text-[#6E717A] tabular-nums">
              {formatIndonesianDate(examDate)}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Subject Ujian (Auto from Schedule on that Date) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2 min-h-[20px]">
                <label className="text-[12.5px] font-semibold text-[#1C1D21]">
                  Subject Ujian
                </label>
                <button
                  type="button"
                  onClick={() => setCustomSubjectMode((prev) => !prev)}
                  className="text-[11.5px] font-semibold text-[#6E717A] hover:text-[#1C1D21] cursor-pointer"
                >
                  {customSubjectMode ? 'Ambil dari Schedule' : 'Ketik Manual'}
                </button>
              </div>

              {customSubjectMode || subjectDropdownOptions.length === 0 ? (
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Masukkan nama subject ujian..."
                  className="w-full h-10 rounded-xl border border-black/[0.1] px-3.5 text-[13px] font-medium text-[#1C1D21] bg-white outline-none focus:border-[#ee2e65]"
                />
              ) : (
                <CustomSelect
                  value={subject}
                  onChange={setSubject}
                  ariaLabel="Subject Ujian"
                  className="w-full"
                  triggerClassName="h-10 rounded-xl border-black/[0.1] text-[13px] font-medium"
                  options={subjectDropdownOptions}
                />
              )}
            </div>

            {/* 2. Posisi yang Diuji */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2 min-h-[20px]">
                <label className="text-[12.5px] font-semibold text-[#1C1D21]">
                  Posisi yang Diuji
                </label>
              </div>
              <CustomSelect
                value={selectedPositionId}
                onChange={handleSelectPosition}
                placeholder="Pilih posisi yang diuji..."
                ariaLabel="Posisi yang diuji"
                className="w-full"
                triggerClassName="h-10 rounded-xl border-black/[0.1] text-[13px] font-medium"
                options={availablePositions.map((pos) => ({
                  value: pos.id,
                  label: `${pos.name} (${pos.parameters.length} parameter)`,
                }))}
              />
            </div>

            {/* 3. Nama yang Akan Diuji */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2 min-h-[20px]">
                <label className="text-[12.5px] font-semibold text-[#1C1D21]">
                  Nama yang Akan Diuji
                </label>
                {studentsDirectory.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setExamineeMode((prev) =>
                        prev === 'directory' ? 'manual' : 'directory'
                      );
                    }}
                    className="text-[11.5px] font-semibold text-[#6E717A] hover:text-[#1C1D21] cursor-pointer"
                  >
                    {examineeMode === 'directory' ? 'Ketik Nama Baru' : 'Pilih dari Batch'}
                  </button>
                )}
              </div>

              {examineeMode === 'directory' && studentsDirectory.length > 0 ? (
                <CustomSelect
                  value={selectedStudentId}
                  onChange={setSelectedStudentId}
                  placeholder="Pilih peserta yang diuji..."
                  ariaLabel="Nama yang akan diuji"
                  className="w-full"
                  triggerClassName="h-10 rounded-xl border-black/[0.1] text-[13px] font-medium"
                  options={studentsDirectory.map((st) => ({
                    value: st.id,
                    label: `${st.name} (${st.classCode})`,
                  }))}
                />
              ) : (
                <input
                  type="text"
                  required
                  value={manualExamineeName}
                  onChange={(e) => setManualExamineeName(e.target.value)}
                  placeholder="Ketik nama lengkap peserta uji..."
                  className="w-full h-10 rounded-xl border border-black/[0.1] px-3.5 text-[13px] font-medium text-[#1C1D21] bg-white outline-none focus:border-[#ee2e65]"
                />
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Parameter yang Dinilai & Button-Button Nilai (Appears ONLY after Position is selected) */}
        <AnimatePresence mode="wait">
          {selectedPosition ? (
            <motion.div
              key={selectedPosition.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white rounded-2xl border border-black/[0.07] overflow-hidden"
            >
              <div className="px-5 sm:px-6 py-4 bg-[#FAFBFD] border-b border-black/[0.06] flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2 min-w-0">
                  <h3 className="text-[15.5px] font-semibold text-[#1C1D21]">
                    Parameter Penilaian · {selectedPosition.name}
                  </h3>
                  <span className="text-[12px] text-[#6E717A]">
                    · {activeScale.name}
                  </span>
                </div>
                <span className="text-[12.5px] font-semibold text-[#1C1D21] tabular-nums">
                  {assessmentSummary.scoredParams}/{assessmentSummary.totalParams} Parameter Dinilai
                </span>
              </div>

              <div className="divide-y divide-black/[0.06]">
                {(() => {
                  let runningIdx = 0;
                  const gridColsClass =
                    sortedScaleOptions.length <= 4
                      ? 'grid-cols-2 sm:grid-cols-4'
                      : sortedScaleOptions.length === 5
                        ? 'grid-cols-2 sm:grid-cols-5'
                        : sortedScaleOptions.length === 6
                          ? 'grid-cols-3 sm:grid-cols-6'
                          : 'grid-cols-3 sm:grid-cols-5 md:grid-cols-9';

                  return groupedCriteria.map((group, groupIdx) => (
                    <div key={group.segmentName || `grp-${groupIdx}`} className="divide-y divide-black/[0.06]">
                      {group.segmentName && (
                        <div className="px-5 sm:px-6 py-2.5 bg-[#FAFBFD]/70 flex items-center justify-between gap-2">
                          <span className="text-[12.5px] font-semibold text-[#1C1D21]">
                            Segment · {group.segmentName}
                          </span>
                          <span className="text-[11.5px] text-[#6E717A] tabular-nums">
                            {group.items.length} kriteria
                          </span>
                        </div>
                      )}

                      {group.items.map((param) => {
                        runningIdx += 1;
                        const currentNumber = runningIdx;
                        const chosenScore = parameterScores[param.id];
                        const hasScore = typeof chosenScore === 'number';
                        const normalizedChosen = hasScore
                          ? normalizeScaleValueToExamMax(
                              chosenScore,
                              activeScale,
                              examGradingRule.scaleMax
                            )
                          : 0;
                        const meetsPassing =
                          hasScore && normalizedChosen >= examGradingRule.passingScore;
                        const matchedOpt = hasScore
                          ? sortedScaleOptions.find((o) => o.value === chosenScore)
                          : undefined;

                        return (
                          <div key={param.id} className="p-5 sm:px-6 space-y-3.5">
                            {/* Parameter Header */}
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                              <div className="space-y-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 text-[14px] font-semibold text-[#1C1D21]">
                                  <span className="tabular-nums text-[#8A8D98]">
                                    {String(currentNumber).padStart(2, '0')}.
                                  </span>
                                  <span>{param.label}</span>
                                  <span className="text-[12px] font-medium text-[#6E717A] tabular-nums">
                                    · Bobot {param.weightPct}%
                                  </span>
                                </div>
                                {param.description && (
                                  <p className="text-[12.5px] text-[#6E717A] leading-relaxed">
                                    {param.description}
                                  </p>
                                )}
                              </div>

                              <div className="shrink-0 sm:text-right">
                                {hasScore ? (
                                  <span
                                    className={`inline-flex items-center gap-1.5 text-[13px] font-bold tabular-nums ${
                                      meetsPassing ? 'text-[#146C43]' : 'text-[#942922]'
                                    }`}
                                  >
                                    {meetsPassing ? (
                                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                                    ) : (
                                      <AlertCircle className="w-4 h-4 shrink-0" />
                                    )}
                                    <span>
                                      Nilai: {chosenScore}%
                                      {matchedOpt?.label ? ` · ${matchedOpt.label}` : ''}
                                    </span>
                                  </span>
                                ) : (
                                  <span className="text-[12px] font-medium text-[#8A8D98]">
                                    Belum dinilai
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Button-Button Nilai di Bawah Parameter */}
                            <div
                              className={`grid ${gridColsClass} gap-2 pt-1`}
                              role="radiogroup"
                              aria-label={`Nilai untuk ${param.label}`}
                            >
                              {sortedScaleOptions.map((opt, optIdx) => {
                                const isSelected = chosenScore === opt.value;
                                const colorSpec = getScaleOptionAnalogousColors(
                                  opt.value,
                                  sortedScaleOptions,
                                  optIdx
                                );

                                return (
                                  <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() =>
                                      handleSelectParameterScore(param.id, opt.value)
                                    }
                                    className={`min-h-[44px] px-2.5 py-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 tabular-nums ${
                                      isSelected ? colorSpec.selected : colorSpec.unselected
                                    }`}
                                  >
                                    <span className="text-[14px] font-bold leading-none">
                                      {opt.value}%
                                    </span>
                                    <span
                                      className={`text-[10.5px] font-medium leading-tight truncate max-w-full ${
                                        isSelected ? 'text-white/95' : colorSpec.subLabelUnselected
                                      }`}
                                    >
                                      {opt.label}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ));
                })()}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="no-position"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-2xl border border-dashed border-black/[0.14] p-8 text-center space-y-2"
            >
              <ClipboardCheck className="w-8 h-8 text-[#B4B6C1] mx-auto" />
              <div className="text-[14.5px] font-semibold text-[#1C1D21]">
                Posisi yang Diuji Belum Dipilih
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Card 3: Ringkasan Hasil Penilaian (Below Formulir Penilaian) */}
        <div className="bg-white rounded-2xl border border-black/[0.07] p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-black/[0.06]">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-[#ee2e65] shrink-0" />
              <h3 className="text-[15.5px] font-semibold text-[#1C1D21]">
                Ringkasan Hasil Penilaian
              </h3>
            </div>
            <div className="text-[12.5px] text-[#6E717A] tabular-nums">
              Batas KKM Batch:{' '}
              <span className="font-semibold text-[#1C1D21]">
                ≥ {examGradingRule.passingScore}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
            {/* Numeric Score Readout */}
            <div className="md:col-span-5 p-4 rounded-xl bg-[#FAFBFD] border border-black/[0.06] flex items-center justify-between gap-3">
              <div>
                <div className="text-[11.5px] font-medium text-[#6E717A]">
                  Nilai Akhir Terbobot
                </div>
                <div className="text-[32px] font-bold text-[#1C1D21] leading-tight mt-0.5 tabular-nums">
                  {assessmentSummary.scoredParams > 0 ? assessmentSummary.finalScore : '—'}
                  <span className="text-[14px] font-medium text-[#8A8D98] ml-1">
                    / {examGradingRule.scaleMax}
                  </span>
                </div>
              </div>

              <div className="text-right">
                {assessmentSummary.scoredParams > 0 ? (
                  <>
                    <div className="text-[20px] font-bold text-[#1C1D21] tabular-nums">
                      Grade {assessmentSummary.gradeBand.grade}
                    </div>
                    <div
                      className={`inline-flex items-center gap-1 text-[12px] font-semibold mt-0.5 ${
                        assessmentSummary.passed ? 'text-[#146C43]' : 'text-[#942922]'
                      }`}
                    >
                      {assessmentSummary.passed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      )}
                      <span>
                        {assessmentSummary.passed ? 'Lulus KKM' : 'Di Bawah KKM'}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-[12px] text-[#8A8D98]">Menunggu nilai</div>
                )}
              </div>
            </div>

            {/* Assessor Notes + Save Button */}
            <div className="md:col-span-7 flex flex-col justify-between gap-3">
              <div className="space-y-1.5">
                <label className="block text-[12px] font-semibold text-[#1C1D21]">
                  Catatan Penguji (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Tambahkan evaluasi kekuatan atau poin perbaikan peserta..."
                  className="w-full rounded-xl border border-black/[0.1] p-3 text-[12.5px] text-[#1C1D21] outline-none focus:border-[#ee2e65] resize-none"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className={`${ACTION_BTN_PRIMARY} w-full sm:w-auto`}
                >
                  <Save className="w-4 h-4 shrink-0" />
                  <span>Simpan Hasil Penilaian</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Saved Assessment History (Accordion + Table List) */}
      <section className="bg-white rounded-2xl border border-black/[0.07] overflow-hidden">
        {/* Outer Accordion Header */}
        <div
          role="button"
          tabIndex={0}
          aria-expanded={historyOpen}
          onClick={() => setHistoryOpen((prev) => !prev)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setHistoryOpen((prev) => !prev);
            }
          }}
          className="w-full px-5 sm:px-6 py-4 flex items-center justify-between gap-3 text-left cursor-pointer hover:bg-[#FAFBFD]/80 transition-colors select-none"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <ChevronDown
              className={`w-4 h-4 text-[#1C1D21] transition-transform duration-200 shrink-0 ${
                historyOpen ? 'rotate-0' : '-rotate-90'
              }`}
            />
            <h2 className="text-[15.5px] font-semibold text-[#1C1D21] truncate">
              Riwayat Penilaian Ujian · {activeBatch.batchName} ({activeBatch.year})
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-[#FAFBFD] border border-black/[0.08] text-[12px] font-semibold text-[#1C1D21] tabular-nums shrink-0">
              {examAssessments.length}
            </span>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {historyOpen && (
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
              <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-2 border-t border-black/[0.06] space-y-4">
                {/* Toolbar Search */}
                <div className="flex items-center justify-end">
                  <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 text-[#8A8D98] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      placeholder="Cari nama, posisi, atau subject..."
                      className="w-full h-9 pl-9 pr-4 rounded-full border border-black/[0.09] text-[12.5px] bg-white outline-none focus:border-[#ee2e65]"
                    />
                  </div>
                </div>

                {filteredAssessments.length === 0 ? (
                  <div className="py-10 px-4 text-center space-y-2 rounded-2xl border border-black/[0.06] bg-[#FAFBFD]">
                    <UserCheck className="w-8 h-8 text-[#B4B6C1] mx-auto" />
                    <div className="text-[14px] font-semibold text-[#1C1D21]">
                      {examAssessments.length === 0
                        ? 'Belum ada hasil penilaian ujian tersimpan'
                        : 'Tidak ada hasil penilaian yang cocok dengan pencarian'}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-black/[0.07] overflow-hidden bg-white">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[740px]">
                        <thead>
                          <tr className="bg-[#FAFBFD] border-b border-black/[0.06] text-[11.5px] font-medium text-[#6E717A]">
                            <th className="py-3 px-4 w-[140px]">Tanggal</th>
                            <th className="py-3 px-4">Nama Peserta</th>
                            <th className="py-3 px-4">Subject</th>
                            <th className="py-3 px-4">Posisi</th>
                            <th className="py-3 px-4 w-[120px]">Nilai</th>
                            <th className="py-3 px-4 w-[130px]">Status</th>
                            <th className="py-3 px-4 w-[108px] text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-black/[0.06] text-[13px]">
                          {filteredAssessments.map((item) => {
                            const isExpanded = expandedAssessmentId === item.id;
                            return (
                              <React.Fragment key={item.id}>
                                <tr
                                  onClick={() =>
                                    setExpandedAssessmentId(isExpanded ? null : item.id)
                                  }
                                  className={`cursor-pointer transition-colors ${
                                    isExpanded ? 'bg-[#FAFBFD]' : 'bg-white hover:bg-[#FAFBFD]'
                                  }`}
                                >
                                  <td className="py-3.5 px-4 text-[12px] text-[#6E717A] tabular-nums whitespace-nowrap">
                                    {item.examDateLabel}
                                  </td>
                                  <td className="py-3.5 px-4 font-semibold text-[#1C1D21] whitespace-nowrap">
                                    {item.examineeName}
                                  </td>
                                  <td className="py-3.5 px-4 text-[12.5px] text-[#1C1D21] whitespace-nowrap">
                                    {item.subject}
                                  </td>
                                  <td className="py-3.5 px-4 text-[12.5px] text-[#6E717A] whitespace-nowrap">
                                    {item.positionName}
                                  </td>
                                  <td className="py-3.5 px-4 font-bold text-[#1C1D21] tabular-nums whitespace-nowrap">
                                    {item.finalScore}{' '}
                                    <span className="text-[11.5px] font-medium text-[#6E717A]">
                                      ({item.grade})
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-4 whitespace-nowrap">
                                    <span
                                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-semibold ${
                                        item.passed
                                          ? 'bg-[#E6F9F0] text-[#146C43]'
                                          : 'bg-[#FFECEB] text-[#942922]'
                                      }`}
                                    >
                                      <span
                                        className={`w-1.5 h-1.5 rounded-full ${
                                          item.passed ? 'bg-[#10B981]' : 'bg-[#D92D20]'
                                        }`}
                                      />
                                      <span>{item.passed ? 'Lulus' : 'Tidak Lulus'}</span>
                                    </span>
                                  </td>
                                  <td
                                    className="py-3 px-4 text-right whitespace-nowrap"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <div className="inline-flex items-center justify-end gap-1.5">
                                      {confirmDeleteId === item.id ? (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            handleDeleteExamAssessment(item.id);
                                            setConfirmDeleteId(null);
                                          }}
                                          className="inline-flex items-center justify-center gap-1 h-8 px-2.5 rounded-full bg-[#FFECEB] text-[#942922] text-[12px] font-semibold whitespace-nowrap cursor-pointer"
                                        >
                                          <Check className="w-3.5 h-3.5 shrink-0" />
                                          <span>Hapus?</span>
                                        </button>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => setConfirmDeleteId(item.id)}
                                          aria-label={`Hapus penilaian ${item.examineeName}`}
                                          className="w-8 h-8 rounded-full border border-black/[0.08] bg-white hover:bg-[#FFECEB] text-[#6E717A] hover:text-[#942922] inline-flex items-center justify-center cursor-pointer transition-colors"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        aria-label={`Detail penilaian ${item.examineeName}`}
                                        onClick={() =>
                                          setExpandedAssessmentId(isExpanded ? null : item.id)
                                        }
                                        className="w-8 h-8 rounded-full hover:bg-black/5 inline-flex items-center justify-center text-[#6E717A] cursor-pointer transition-colors"
                                      >
                                        <ChevronDown
                                          className={`w-4 h-4 transition-transform duration-200 ${
                                            isExpanded ? 'rotate-180 text-[#ee2e65]' : ''
                                          }`}
                                        />
                                      </button>
                                    </div>
                                  </td>
                                </tr>

                                {isExpanded && (
                                  <tr className="bg-[#FAFBFD]/80">
                                    <td colSpan={7} className="p-0">
                                      <div className="p-4 sm:p-5 border-t border-black/[0.05] space-y-3">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                          {item.parameterScores.map((ps) => (
                                            <div
                                              key={ps.parameterId}
                                              className="p-3 rounded-xl bg-white border border-black/[0.06] space-y-1"
                                            >
                                              {ps.segmentName && (
                                                <div className="text-[10.5px] font-medium text-[#8A8D98] truncate">
                                                  {ps.segmentName}
                                                </div>
                                              )}
                                              <div className="text-[12px] font-semibold text-[#1C1D21] truncate">
                                                {ps.label}
                                              </div>
                                              <div className="flex items-center justify-between text-[12px] tabular-nums">
                                                <span className="text-[#8A8D98]">
                                                  Bobot {ps.weightPct}%
                                                </span>
                                                <span
                                                  className={`font-bold ${
                                                    ps.score >= examGradingRule.passingScore
                                                      ? 'text-[#146C43]'
                                                      : 'text-[#942922]'
                                                  }`}
                                                >
                                                  {ps.rawValue !== undefined && ps.rawValue !== ps.score
                                                    ? `${ps.rawValue} (${ps.score})`
                                                    : ps.score}
                                                </span>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                        {item.notes && (
                                          <div className="text-[12.5px] text-[#5A5D67]">
                                            <span className="font-semibold text-[#1C1D21]">
                                              Catatan Penguji:{' '}
                                            </span>
                                            {item.notes}
                                          </div>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
};
