import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Database,
  CheckCircle2,
  Award,
  Plus,
  Download,
  Upload,
  Save,
  RotateCcw,
  Minus,
  Check,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  AttendanceGraduationRule,
  BatchRecord,
  ExamGradingRule,
} from '../../types';
import {
  DEFAULT_EXAM_GRADING_RULE,
  DEFAULT_GRADUATION_RULE,
  evaluateStudentBatchEligibility,
  normalizeExamGradingRule,
  resolveGradeBand,
} from '../../data/batchDefaults';
import { CustomSelect } from '../ui/CustomSelect';
import { ExamAssessmentStepBuilder } from '../settings/ExamAssessmentStepBuilder';
import {
  ACTION_BTN_DANGER_SOFT,
  ACTION_BTN_PRIMARY,
  ACTION_BTN_SECONDARY,
  ACTION_BTN_SOFT_PRIMARY,
} from '../../constants/buttonStyles';

type SettingsTab = 'database' | 'graduation' | 'exams';

function formatSavedTime(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '-';
  }
}

export const SettingsPage: React.FC = () => {
  const {
    batches,
    activeBatchId,
    activeBatch,
    graduationRule,
    examGradingRule,
    lastBatchSavedAt,
    studentsDirectory,
    attendanceByClass,
    schedules,
    exams,
    assignments,
    lessonPlans,
    materialsList,
    liveQuizzes,
    reportsList,
    qrCheckIns,
    switchActiveBatch,
    createBatch,
    deleteBatch,
    updateBatchRules,
    importBatchRecord,
    saveCurrentBatchSnapshot,
    triggerToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<SettingsTab>('database');

  // Tab 1: Database Batch & Tahun state
  const [yearFilter, setYearFilter] = useState<string>('All');
  const [newBatchFormOpen, setNewBatchFormOpen] = useState(false);
  const [newBatchName, setNewBatchName] = useState(() => `Batch ${batches.length + 1}`);
  const [newBatchYear, setNewBatchYear] = useState<number>(2026);
  const [newBatchGmsAsal, setNewBatchGmsAsal] = useState<string>('');
  const [newBatchProgramEvent, setNewBatchProgramEvent] = useState<string>('');
  const [newBatchMode, setNewBatchMode] = useState<
    'copy_rules_schedule' | 'duplicate_all' | 'empty'
  >('copy_rules_schedule');
  const [confirmDeleteBatchId, setConfirmDeleteBatchId] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  // Tab 2 & 3 Draft state (synced when activeBatch changes)
  const [gradDraft, setGradDraft] = useState<AttendanceGraduationRule>(graduationRule);
  const [examDraft, setExamDraft] = useState<ExamGradingRule>(() =>
    normalizeExamGradingRule(examGradingRule)
  );

  useEffect(() => {
    setGradDraft({ ...graduationRule });
  }, [graduationRule, activeBatchId]);

  useEffect(() => {
    setExamDraft(normalizeExamGradingRule(examGradingRule));
  }, [examGradingRule, activeBatchId]);

  const availableYears = useMemo(() => {
    const years = Array.from(new Set(batches.map((b) => String(b.year)))).sort(
      (a, b) => Number(b) - Number(a)
    );
    return [{ value: 'All', label: 'Semua Tahun' }, ...years.map((y) => ({ value: y, label: y }))];
  }, [batches]);

  const filteredBatches = useMemo(() => {
    return batches.filter((b) => yearFilter === 'All' || String(b.year) === yearFilter);
  }, [batches, yearFilter]);

  const totalAttendanceRecords = useMemo(() => {
    return Object.values(attendanceByClass).reduce(
      (acc, cls) =>
        acc + (cls.attendance?.length || 0) + (cls.absences?.length || 0) + (cls.excuse?.length || 0),
      0
    );
  }, [attendanceByClass]);

  const totalUnifiedRecords = useMemo(() => {
    return (
      studentsDirectory.length +
      schedules.length +
      exams.length +
      assignments.length +
      lessonPlans.length +
      materialsList.length +
      liveQuizzes.length +
      reportsList.length +
      totalAttendanceRecords
    );
  }, [
    studentsDirectory.length,
    schedules.length,
    exams.length,
    assignments.length,
    lessonPlans.length,
    materialsList.length,
    liveQuizzes.length,
    reportsList.length,
    totalAttendanceRecords,
  ]);

  // Live graduation evaluations using current draft rules
  const graduationEvaluations = useMemo(() => {
    return studentsDirectory.map((student) =>
      evaluateStudentBatchEligibility(student, attendanceByClass, gradDraft, examDraft)
    );
  }, [studentsDirectory, attendanceByClass, gradDraft, examDraft]);

  const eligibleCount = useMemo(
    () => graduationEvaluations.filter((ev) => ev.overallPassed).length,
    [graduationEvaluations]
  );

  // Live exam weights & distribution
  const totalExamWeight =
    Number(examDraft.weights.writtenExamPct || 0) +
    Number(examDraft.weights.practicalExamPct || 0) +
    Number(examDraft.weights.assignmentPct || 0) +
    Number(examDraft.weights.attendanceBonusPct || 0);

  const gradeDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    examDraft.gradeBands.forEach((b) => {
      counts[b.grade] = 0;
    });
    studentsDirectory.forEach((st) => {
      const band = resolveGradeBand(st.score, examDraft);
      counts[band.grade] = (counts[band.grade] || 0) + 1;
    });
    return counts;
  }, [studentsDirectory, examDraft]);

  const handleCreateBatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createBatch({
      batchName: newBatchName.trim() || `Batch ${batches.length + 1}`,
      year: Number(newBatchYear) || 2026,
      gmsAsal: newBatchGmsAsal.trim(),
      programEvent: newBatchProgramEvent.trim(),
      mode: newBatchMode,
    });
    setNewBatchFormOpen(false);
    setNewBatchName(`Batch ${batches.length + 2}`);
    setNewBatchGmsAsal('');
    setNewBatchProgramEvent('');
  };

  const handleExportBatchJson = (batch: BatchRecord) => {
    const payload = batch.id === activeBatchId
      ? {
          ...batch,
          graduationRule: gradDraft,
          examGradingRule: examDraft,
        }
      : batch;
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${batch.batchName.replace(/\s+/g, '_')}_${batch.year}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    triggerToast(
      'Export Batch Berhasil',
      `1 file JSON terpadu (${batch.batchName} · ${batch.year}) telah diunduh.`,
      'success'
    );
  };

  const handleImportBatchFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || '{}')) as BatchRecord;
        if (!parsed || typeof parsed !== 'object' || !parsed.data) {
          triggerToast(
            'Format File Tidak Valid',
            'File JSON harus berisi struktur BatchRecord dengan objek data.',
            'error'
          );
          return;
        }
        importBatchRecord(parsed);
      } catch {
        triggerToast('Gagal Membaca JSON', 'Pastikan file yang diunggah berformat JSON valid.', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSaveGraduationRule = (e: React.FormEvent) => {
    e.preventDefault();
    updateBatchRules(gradDraft, examDraft);
    triggerToast(
      'Aturan Kelulusan Disimpan',
      `Kriteria kehadiran & kelulusan untuk ${activeBatch.batchName} (${activeBatch.year}) diperbarui.`,
      'success'
    );
  };

  const handleResetGraduationRule = () => {
    const next = { ...DEFAULT_GRADUATION_RULE };
    setGradDraft(next);
    updateBatchRules(next, examDraft);
    triggerToast('Aturan Direset', 'Kriteria kelulusan dikembalikan ke standar awal.', 'info');
  };

  const handleBalanceExamWeights = () => {
    if (totalExamWeight === 100) return;
    if (totalExamWeight <= 0) {
      setExamDraft((prev) => ({
        ...prev,
        weights: { ...DEFAULT_EXAM_GRADING_RULE.weights },
      }));
      return;
    }
    const factor = 100 / totalExamWeight;
    const w1 = Math.round(examDraft.weights.writtenExamPct * factor);
    const w2 = Math.round(examDraft.weights.practicalExamPct * factor);
    const w3 = Math.round(examDraft.weights.assignmentPct * factor);
    const w4 = Math.max(0, 100 - w1 - w2 - w3);
    setExamDraft((prev) => ({
      ...prev,
      weights: {
        writtenExamPct: w1,
        practicalExamPct: w2,
        assignmentPct: w3,
        attendanceBonusPct: w4,
      },
    }));
  };

  const handleSaveExamRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (totalExamWeight !== 100) {
      triggerToast(
        'Bobot Belum 100%',
        `Total bobot komponen saat ini ${totalExamWeight}%. Klik "Seimbangkan 100%" terlebih dahulu.`,
        'warning'
      );
      return;
    }
    updateBatchRules(gradDraft, examDraft);
    triggerToast(
      'Aturan Penilaian Disimpan',
      `KKM & aturan penilaian exams untuk ${activeBatch.batchName} (${activeBatch.year}) diperbarui.`,
      'success'
    );
  };

  const handleResetExamRule = () => {
    const next = normalizeExamGradingRule(DEFAULT_EXAM_GRADING_RULE);
    setExamDraft(next);
    updateBatchRules(gradDraft, next);
    triggerToast('Aturan Direset', 'Aturan penilaian exams dikembalikan ke standar awal.', 'info');
  };

  const handlePersistAssessmentBuilder = (
    nextRule: ExamGradingRule,
    toastTitle?: string,
    toastMessage?: string
  ) => {
    setExamDraft(nextRule);
    updateBatchRules(gradDraft, nextRule);
    if (toastTitle && toastMessage) {
      triggerToast(toastTitle, toastMessage, 'success');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 md:pb-6 border-b border-black/[0.05]">
        <div className="hidden md:block">
          <h1 className="text-[24px] font-semibold tracking-tight text-[#1C1D21]">Settings</h1>
          <p className="text-[12.5px] text-[#6E717A] mt-0.5 tabular-nums">
            {activeBatch.batchName} · Tahun {activeBatch.year} · Tersimpan {formatSavedTime(lastBatchSavedAt)}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2.5 w-full md:w-auto">
          <button
            type="button"
            onClick={() => handleExportBatchJson(activeBatch)}
            className={ACTION_BTN_SECONDARY}
          >
            <Download className="w-4 h-4 shrink-0" />
            <span className="sm:hidden">Export</span>
            <span className="hidden sm:inline">Export 1 Batch</span>
          </button>

          <button
            type="button"
            onClick={() => saveCurrentBatchSnapshot(true)}
            className={ACTION_BTN_PRIMARY}
          >
            <Save className="w-4 h-4 shrink-0" />
            <span className="sm:hidden">Simpan</span>
            <span className="hidden sm:inline">Simpan 1 Data Batch</span>
          </button>
        </div>
      </div>

      {/* Unified 4-Column Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-black/[0.06] border border-black/[0.06] rounded-2xl overflow-hidden">
        <div className="p-4 sm:p-5 bg-[#F0EFFC]">
          <span className="text-[12px] font-semibold text-[#3F3B99]">Batch &amp; Tahun Aktif</span>
          <div className="text-[22px] sm:text-[24px] font-bold text-[#1C1D21] mt-1.5 tabular-nums truncate">
            {activeBatch.batchName} · {activeBatch.year}
          </div>
          <p className="text-[11.5px] text-[#5854A8] mt-1 tabular-nums truncate">
            {[activeBatch.gmsAsal, activeBatch.programEvent].filter(Boolean).join(' · ') ||
              `${batches.length} batch tersimpan di database`}
          </p>
        </div>

        <div className="p-4 sm:p-5 bg-[#E6F9F0] border-l border-black/[0.06] sm:border-l-0">
          <span className="text-[12px] font-semibold text-[#146C43]">Kesatuan 1 Data Batch</span>
          <div className="text-[22px] sm:text-[24px] font-bold text-[#1C1D21] mt-1.5 tabular-nums">
            {totalUnifiedRecords} Entitas
          </div>
          <p className="text-[11.5px] text-[#35684E] mt-1 tabular-nums">
            {studentsDirectory.length} siswa · {schedules.length} sesi · {exams.length} ujian
          </p>
        </div>

        <div className="p-4 sm:p-5 bg-[#FFF5E6]">
          <span className="text-[12px] font-semibold text-[#8C5811]">Minimal Kehadiran Lulus</span>
          <div className="text-[22px] sm:text-[24px] font-bold text-[#1C1D21] mt-1.5 tabular-nums">
            {gradDraft.minAttendanceRatePct}%
          </div>
          <p className="text-[11.5px] text-[#7A592A] mt-1 tabular-nums">
            Maks {gradDraft.maxUnexcusedAbsences} absent · {gradDraft.maxLateCount} late
          </p>
        </div>

        <div className="p-4 sm:p-5 bg-[#FEF1F5] border-l border-black/[0.06] sm:border-l-0">
          <span className="text-[12px] font-semibold text-[#9D113C]">KKM Penilaian Exams</span>
          <div className="text-[22px] sm:text-[24px] font-bold text-[#1C1D21] mt-1.5 tabular-nums">
            {examDraft.passingScore} / {examDraft.scaleMax}
          </div>
          <p className="text-[11.5px] text-[#7D3A51] mt-1 tabular-nums">
            {eligibleCount}/{studentsDirectory.length} siswa memenuhi syarat
          </p>
        </div>
      </div>

      {/* Top Segmented Section Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex flex-wrap items-center gap-1 bg-[#F4F5F8] p-1 rounded-xl">
          {[
            { id: 'database' as const, label: 'Database Batch & Tahun', icon: Database },
            { id: 'graduation' as const, label: 'Kriteria Kelulusan Attendance', icon: CheckCircle2 },
            { id: 'exams' as const, label: 'Aturan Penilaian Exams', icon: Award },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-1.5 h-9 px-3.5 sm:px-4 rounded-lg text-[13px] font-medium whitespace-nowrap transition-all cursor-pointer ${
                  active
                    ? 'bg-white text-[#1C1D21] shadow-xs font-semibold'
                    : 'text-[#6E717A] hover:text-[#1C1D21]'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-[#ee2e65]' : ''}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: DATABASE BATCH & TAHUN */}
      {activeTab === 'database' && (
        <div className="space-y-6">
          {/* Toolbar & Import/Create Controls */}
          <div className="bg-white rounded-2xl border border-black/[0.07] p-5 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-[16px] font-semibold text-[#1C1D21]">
                  Penyimpanan Database per Batch &amp; Tahun
                </h2>
                <p className="text-[12.5px] text-[#6E717A] mt-0.5">
                  Setiap batch menyimpan seluruh data kelas, jadwal, siswa, absensi, nilai, kriteria kelulusan, dan aturan exams menjadi 1 kesatuan data.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <CustomSelect
                  value={yearFilter}
                  onChange={setYearFilter}
                  pill
                  ariaLabel="Filter tahun batch"
                  className="min-w-[148px]"
                  options={availableYears}
                />

                <input
                  ref={importInputRef}
                  type="file"
                  accept="application/json,.json"
                  onChange={handleImportBatchFile}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => importInputRef.current?.click()}
                  className={ACTION_BTN_SECONDARY}
                >
                  <Upload className="w-4 h-4 shrink-0" />
                  <span>Import JSON</span>
                </button>

                <button
                  type="button"
                  onClick={() => setNewBatchFormOpen((prev) => !prev)}
                  className={ACTION_BTN_PRIMARY}
                >
                  <Plus className="w-4 h-4 shrink-0" />
                  <span>Buat Batch Baru</span>
                </button>
              </div>
            </div>

            {/* Inline Create Batch Form */}
            {newBatchFormOpen && (
              <form
                onSubmit={handleCreateBatchSubmit}
                className="border-t border-black/[0.06] pt-5 space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
                  <div className="md:col-span-3 space-y-1.5">
                    <label className="text-[12px] font-semibold text-[#1C1D21]">Nama Batch</label>
                    <input
                      type="text"
                      required
                      value={newBatchName}
                      onChange={(e) => setNewBatchName(e.target.value)}
                      placeholder="Contoh: Batch 2 / Angkatan Q3"
                      className="w-full h-9 rounded-full border border-black/[0.1] px-3.5 text-[13px] bg-white outline-none focus:border-[#ee2e65]"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-[12px] font-semibold text-[#1C1D21]">Tahun</label>
                    <input
                      type="number"
                      min={2020}
                      max={2099}
                      required
                      value={newBatchYear}
                      onChange={(e) => setNewBatchYear(Number(e.target.value))}
                      className="w-full h-9 rounded-full border border-black/[0.1] px-3.5 text-[13px] tabular-nums bg-white outline-none focus:border-[#ee2e65]"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-[12px] font-semibold text-[#1C1D21]">GMS Asal</label>
                    <input
                      type="text"
                      required
                      value={newBatchGmsAsal}
                      onChange={(e) => setNewBatchGmsAsal(e.target.value)}
                      placeholder="Contoh: GMS Surabaya"
                      className="w-full h-9 rounded-full border border-black/[0.1] px-3.5 text-[13px] bg-white outline-none focus:border-[#ee2e65]"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-[12px] font-semibold text-[#1C1D21]">Program Event</label>
                    <input
                      type="text"
                      required
                      value={newBatchProgramEvent}
                      onChange={(e) => setNewBatchProgramEvent(e.target.value)}
                      placeholder="Contoh: Servolution Camp"
                      className="w-full h-9 rounded-full border border-black/[0.1] px-3.5 text-[13px] bg-white outline-none focus:border-[#ee2e65]"
                    />
                  </div>

                  <div className="md:col-span-3 space-y-1.5">
                    <label className="text-[12px] font-semibold text-[#1C1D21]">Basis Data Awal</label>
                    <CustomSelect
                      value={newBatchMode}
                      onChange={(v) =>
                        setNewBatchMode(v as 'copy_rules_schedule' | 'duplicate_all' | 'empty')
                      }
                      pill
                      className="w-full"
                      options={[
                        { value: 'copy_rules_schedule', label: 'Salin Aturan & Jadwal' },
                        { value: 'duplicate_all', label: 'Duplikat Semua Data' },
                        { value: 'empty', label: 'Batch Kosong Baru' },
                      ]}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setNewBatchFormOpen(false)}
                    className={ACTION_BTN_SECONDARY}
                  >
                    <span>Batal</span>
                  </button>
                  <button type="submit" className={ACTION_BTN_PRIMARY}>
                    <Check className="w-4 h-4 shrink-0" />
                    <span>Simpan &amp; Aktifkan</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Unified Batch Records Table */}
          <div className="bg-white rounded-2xl border border-black/[0.07] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FAFBFD] border-b border-black/[0.05] text-[11px] font-semibold uppercase tracking-wider text-[#8A8D98]">
                    <th className="py-3.5 px-5">Batch &amp; Tahun</th>
                    <th className="py-3.5 px-4">GMS Asal &amp; Program Event</th>
                    <th className="py-3.5 px-4">Isi 1 Paket Data</th>
                    <th className="py-3.5 px-4">Aturan Kelulusan &amp; Exams</th>
                    <th className="py-3.5 px-4">Diperbarui</th>
                    <th className="py-3.5 px-5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.05] text-[13px]">
                  {filteredBatches.map((batch) => {
                    const isActive = batch.id === activeBatchId;
                    const grad = isActive ? gradDraft : batch.graduationRule;
                    const exam = isActive ? examDraft : batch.examGradingRule;
                    const stCount = isActive ? studentsDirectory.length : batch.data.students.length;
                    const schCount = isActive ? schedules.length : batch.data.schedules.length;
                    const exCount = isActive ? exams.length : batch.data.exams.length;
                    const matCount = isActive ? materialsList.length : batch.data.materials.length;

                    return (
                      <tr
                        key={batch.id}
                        className={isActive ? 'bg-[#FEF1F5]/45' : 'hover:bg-[#FAFBFD] transition-colors'}
                      >
                        <td className="py-4 px-5 align-middle">
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                isActive ? 'bg-[#ee2e65]' : 'bg-[#B4B6C1]'
                              }`}
                            />
                            <div>
                              <div className="font-semibold text-[#1C1D21]">
                                {batch.batchName}
                              </div>
                              <div className="text-[12px] text-[#6E717A] tabular-nums">
                                Tahun {batch.year} {isActive ? '· Aktif Saat Ini' : ''}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4 align-middle">
                          <div className="font-medium text-[#1C1D21]">
                            {batch.gmsAsal || '-'}
                          </div>
                          <div className="text-[12px] text-[#6E717A]">
                            {batch.programEvent || '-'}
                          </div>
                        </td>

                        <td className="py-4 px-4 align-middle text-[12.5px] text-[#5A5D67] tabular-nums">
                          {stCount} siswa · {schCount} jadwal · {exCount} ujian · {matCount} materi
                        </td>

                        <td className="py-4 px-4 align-middle text-[12.5px] text-[#5A5D67] tabular-nums">
                          Min hadir {grad.minAttendanceRatePct}% · KKM {exam.passingScore}/{exam.scaleMax}
                        </td>

                        <td className="py-4 px-4 align-middle text-[12px] text-[#8A8D98] tabular-nums whitespace-nowrap">
                          {formatSavedTime(isActive ? lastBatchSavedAt : batch.updatedAt)}
                        </td>

                        <td className="py-4 px-5 align-middle text-right whitespace-nowrap">
                          <div className="inline-flex items-center justify-end gap-2">
                            {isActive ? (
                              <button
                                type="button"
                                disabled
                                className={ACTION_BTN_SOFT_PRIMARY}
                              >
                                <Check className="w-4 h-4 shrink-0" />
                                <span>Aktif</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => switchActiveBatch(batch.id)}
                                className={ACTION_BTN_SOFT_PRIMARY}
                              >
                                <span>Aktifkan</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleExportBatchJson(batch)}
                              className={ACTION_BTN_SECONDARY}
                            >
                              <Download className="w-4 h-4 shrink-0" />
                              <span>Export</span>
                            </button>

                            {!isActive && batches.length > 1 && (
                              confirmDeleteBatchId === batch.id ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    deleteBatch(batch.id);
                                    setConfirmDeleteBatchId(null);
                                  }}
                                  className={ACTION_BTN_DANGER_SOFT}
                                >
                                  <Minus className="w-4 h-4 shrink-0" />
                                  <span>Konfirmasi Hapus</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteBatchId(batch.id)}
                                  className={ACTION_BTN_SECONDARY}
                                >
                                  <Minus className="w-4 h-4 shrink-0 text-[#942922]" />
                                  <span className="text-[#942922]">Hapus</span>
                                </button>
                              )
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Snapshot Composition Matrix inside Active 1-Batch Record */}
          <div className="bg-white rounded-2xl border border-black/[0.07] p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-black/[0.06]">
              <div>
                <h3 className="text-[15px] font-semibold text-[#1C1D21]">
                  Struktur 1 Kesatuan Data — {activeBatch.batchName} ({activeBatch.year})
                </h3>
                <p className="text-[12px] text-[#8A8D98]">
                  Seluruh modul operasional berikut tersimpan otomatis dalam 1 dokumen batch pada database server.
                </p>
              </div>
              <span className="text-[12px] font-semibold text-[#146C43] tabular-nums">
                ID: {activeBatch.id}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-y sm:divide-y-0 border border-black/[0.06] rounded-xl overflow-hidden divide-x divide-black/[0.05]">
              {[
                { label: 'Siswa', value: `${studentsDirectory.length} data` },
                { label: 'Jadwal Sesi', value: `${schedules.length} sesi` },
                { label: 'Absensi & QR', value: `${totalAttendanceRecords + qrCheckIns.length} log` },
                { label: 'Exams & Tugas', value: `${exams.length + assignments.length} item` },
                { label: 'Materi & Quiz', value: `${materialsList.length + liveQuizzes.length} modul` },
              ].map((cell) => (
                <div key={cell.label} className="p-3.5 bg-[#FAFBFD]">
                  <div className="text-[11.5px] font-medium text-[#6E717A]">{cell.label}</div>
                  <div className="text-[15px] font-bold text-[#1C1D21] mt-1 tabular-nums">
                    {cell.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: KRITERIA KELULUSAN ATTENDANCE */}
      {activeTab === 'graduation' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Rules Form (5 Cols) */}
          <form
            onSubmit={handleSaveGraduationRule}
            className="lg:col-span-5 bg-white rounded-2xl border border-black/[0.07] p-5 sm:p-6 space-y-5"
          >
            <div className="pb-3.5 border-b border-black/[0.06]">
              <h2 className="text-[16px] font-semibold text-[#1C1D21]">
                Aturan Kriteria Kelulusan Attendance
              </h2>
              <p className="text-[12px] text-[#6E717A] mt-0.5">
                Berlaku khusus untuk {activeBatch.batchName} · Tahun {activeBatch.year}
              </p>
            </div>

            {/* Min Attendance Rate */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[13px]">
                <label className="font-semibold text-[#1C1D21]">Minimal Persentase Kehadiran</label>
                <span className="font-bold text-[#ee2e65] tabular-nums">
                  {gradDraft.minAttendanceRatePct}%
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={50}
                  max={100}
                  step={1}
                  value={gradDraft.minAttendanceRatePct}
                  onChange={(e) =>
                    setGradDraft((prev) => ({
                      ...prev,
                      minAttendanceRatePct: Number(e.target.value),
                    }))
                  }
                  className="flex-1 accent-[#ee2e65] cursor-pointer"
                />
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={gradDraft.minAttendanceRatePct}
                  onChange={(e) =>
                    setGradDraft((prev) => ({
                      ...prev,
                      minAttendanceRatePct: Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                    }))
                  }
                  className="w-20 h-9 rounded-full border border-black/[0.1] px-3 text-center text-[13px] font-semibold tabular-nums outline-none focus:border-[#ee2e65]"
                />
              </div>
            </div>

            {/* Max Unexcused Absences & Max Late */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="text-[12.5px] font-semibold text-[#1C1D21]">
                  Maks. Absent Tanpa Izin
                </label>
                <input
                  type="number"
                  min={0}
                  max={30}
                  value={gradDraft.maxUnexcusedAbsences}
                  onChange={(e) =>
                    setGradDraft((prev) => ({
                      ...prev,
                      maxUnexcusedAbsences: Math.max(0, Number(e.target.value) || 0),
                    }))
                  }
                  className="w-full h-9 rounded-full border border-black/[0.1] px-3.5 text-[13px] font-semibold tabular-nums outline-none focus:border-[#ee2e65]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[12.5px] font-semibold text-[#1C1D21]">
                  Maks. Terlambat (Late)
                </label>
                <input
                  type="number"
                  min={0}
                  max={30}
                  value={gradDraft.maxLateCount}
                  onChange={(e) =>
                    setGradDraft((prev) => ({
                      ...prev,
                      maxLateCount: Math.max(0, Number(e.target.value) || 0),
                    }))
                  }
                  className="w-full h-9 rounded-full border border-black/[0.1] px-3.5 text-[13px] font-semibold tabular-nums outline-none focus:border-[#ee2e65]"
                />
              </div>
            </div>

            {/* Late Weight */}
            <div className="space-y-2">
              <label className="text-[12.5px] font-semibold text-[#1C1D21]">
                Bobot Kehadiran Saat Late
              </label>
              <div className="grid grid-cols-4 gap-2">
                {([100, 75, 50, 0] as const).map((pct) => {
                  const selected = gradDraft.lateWeightPct === pct;
                  return (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setGradDraft((prev) => ({ ...prev, lateWeightPct: pct }))}
                      className={`h-9 rounded-full text-[13px] font-medium tabular-nums transition-colors cursor-pointer ${
                        selected
                          ? 'bg-[#ee2e65] text-white'
                          : 'bg-[#FAFBFD] border border-black/[0.08] text-[#1C1D21] hover:bg-[#FEF1F5]'
                      }`}
                    >
                      {pct}%
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Excuse Policy */}
            <div className="space-y-1.5">
              <label className="text-[12.5px] font-semibold text-[#1C1D21]">
                Kebijakan Status Excuse (Izin)
              </label>
              <CustomSelect
                value={gradDraft.excusePolicy}
                onChange={(val) =>
                  setGradDraft((prev) => ({
                    ...prev,
                    excusePolicy: val as AttendanceGraduationRule['excusePolicy'],
                  }))
                }
                pill
                className="w-full"
                options={[
                  { value: 'present', label: 'Dihitung Hadir (Memenuhi Kehadiran)' },
                  { value: 'neutral', label: 'Netral (Tidak Mempengaruhi Pembagi)' },
                  { value: 'absent', label: 'Dihitung Tidak Hadir' },
                ]}
              />
            </div>

            {/* Combine with Exam Pass */}
            <div className="flex items-center justify-between gap-3 py-2 border-y border-black/[0.06]">
              <div>
                <div className="text-[13px] font-semibold text-[#1C1D21]">
                  Wajib Lulus KKM Penilaian Exams
                </div>
                <div className="text-[11.5px] text-[#6E717A] tabular-nums">
                  Siswa wajib mencapai nilai ≥ {examDraft.passingScore} selain lolos kehadiran
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setGradDraft((prev) => ({ ...prev, requireExamPass: !prev.requireExamPass }))
                }
                className={`w-11 h-6 rounded-full transition-colors p-0.5 cursor-pointer shrink-0 ${
                  gradDraft.requireExamPass ? 'bg-[#ee2e65]' : 'bg-black/[0.15]'
                }`}
                aria-label="Toggle wajib lulus KKM Exams"
              >
                <span
                  className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                    gradDraft.requireExamPass ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-[12.5px] font-semibold text-[#1C1D21]">
                Catatan Kebijakan Kelulusan
              </label>
              <textarea
                rows={3}
                value={gradDraft.notes}
                onChange={(e) => setGradDraft((prev) => ({ ...prev, notes: e.target.value }))}
                className="w-full rounded-xl border border-black/[0.1] p-3 text-[12.5px] text-[#1C1D21] outline-none focus:border-[#ee2e65]"
              />
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleResetGraduationRule}
                className={ACTION_BTN_SECONDARY}
              >
                <RotateCcw className="w-4 h-4 shrink-0" />
                <span>Reset Default</span>
              </button>
              <button type="submit" className={ACTION_BTN_PRIMARY}>
                <Save className="w-4 h-4 shrink-0" />
                <span>Simpan Aturan Kelulusan</span>
              </button>
            </div>
          </form>

          {/* Live Student Eligibility Evaluation (7 Cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-black/[0.07] overflow-hidden">
            <div className="px-5 py-4 border-b border-black/[0.06] flex flex-wrap items-center justify-between gap-2 bg-[#FAFBFD]">
              <div>
                <h3 className="text-[15.5px] font-semibold text-[#1C1D21]">
                  Simulasi Kelulusan Siswa Batch Aktif
                </h3>
                <p className="text-[12px] text-[#6E717A] tabular-nums">
                  {eligibleCount} memenuhi syarat · {studentsDirectory.length - eligibleCount} perlu perhatian
                </p>
              </div>
              <span className="text-[12px] font-semibold text-[#146C43] tabular-nums">
                Min. {gradDraft.minAttendanceRatePct}% Hadir
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white border-b border-black/[0.05] text-[11px] font-semibold uppercase tracking-wider text-[#8A8D98]">
                    <th className="py-3 px-4">Siswa</th>
                    <th className="py-3 px-3">Kehadiran</th>
                    <th className="py-3 px-3">Absent / Late</th>
                    <th className="py-3 px-3">Nilai Exams</th>
                    <th className="py-3 px-4 text-right">Status Kelulusan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.05] text-[12.5px]">
                  {graduationEvaluations.map((ev) => (
                    <tr key={ev.studentId} className="hover:bg-[#FAFBFD] transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-[10.5px] font-bold shrink-0 ${ev.color}`}
                          >
                            {ev.initials}
                          </span>
                          <span className="font-semibold text-[#1C1D21] truncate">{ev.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-bold tabular-nums text-[#1C1D21]">
                        {ev.effectiveAttendanceRate}%
                      </td>
                      <td className="py-3 px-3 text-[#6E717A] tabular-nums">
                        {ev.unexcusedAbsences} abs · {ev.lateCount} late
                      </td>
                      <td className="py-3 px-3 font-semibold tabular-nums text-[#1C1D21]">
                        {ev.examScore} ({ev.gradeBand.grade})
                      </td>
                      <td className="py-3 px-4 text-right">
                        {ev.overallPassed ? (
                          <span className="text-[12px] font-semibold text-[#146C43]">
                            Memenuhi Syarat
                          </span>
                        ) : (
                          <span className="text-[12px] font-semibold text-[#942922]">
                            {ev.reasons[0] || 'Belum Memenuhi'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {graduationEvaluations.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-[#8A8D98]">
                        Belum ada data siswa pada batch ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ATURAN PENILAIAN EXAMS */}
      {activeTab === 'exams' && (
        <div className="space-y-6">
          <ExamAssessmentStepBuilder
            examDraft={examDraft}
            onChangeExamDraft={setExamDraft}
            onPersistRule={handlePersistAssessmentBuilder}
            onNotify={triggerToast}
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Exam Grading Form (7 Cols) */}
          <form
            onSubmit={handleSaveExamRule}
            className="lg:col-span-7 bg-white rounded-2xl border border-black/[0.07] p-5 sm:p-6 space-y-5"
          >
            <div className="pb-3.5 border-b border-black/[0.06]">
              <h2 className="text-[16px] font-semibold text-[#1C1D21]">
                Aturan Penilaian Exams &amp; Konversi Grade
              </h2>
              <p className="text-[12px] text-[#6E717A] mt-0.5">
                Tersimpan menyatu dalam {activeBatch.batchName} · Tahun {activeBatch.year}
              </p>
            </div>

            {/* KKM, Scale, Rounding */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="space-y-1.5">
                <label className="text-[12.5px] font-semibold text-[#1C1D21]">
                  Nilai Batas Lulus (KKM)
                </label>
                <input
                  type="number"
                  min={0}
                  max={examDraft.scaleMax}
                  value={examDraft.passingScore}
                  onChange={(e) =>
                    setExamDraft((prev) => ({
                      ...prev,
                      passingScore: Math.min(prev.scaleMax, Math.max(0, Number(e.target.value) || 0)),
                    }))
                  }
                  className="w-full h-9 rounded-full border border-black/[0.1] px-3.5 text-[13px] font-semibold tabular-nums outline-none focus:border-[#ee2e65]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[12.5px] font-semibold text-[#1C1D21]">
                  Skala Maksimal
                </label>
                <input
                  type="number"
                  min={10}
                  max={1000}
                  value={examDraft.scaleMax}
                  onChange={(e) =>
                    setExamDraft((prev) => ({
                      ...prev,
                      scaleMax: Math.max(10, Number(e.target.value) || 100),
                    }))
                  }
                  className="w-full h-9 rounded-full border border-black/[0.1] px-3.5 text-[13px] font-semibold tabular-nums outline-none focus:border-[#ee2e65]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[12.5px] font-semibold text-[#1C1D21]">
                  Pembulatan Nilai
                </label>
                <CustomSelect
                  value={examDraft.roundingMode}
                  onChange={(val) =>
                    setExamDraft((prev) => ({
                      ...prev,
                      roundingMode: val as ExamGradingRule['roundingMode'],
                    }))
                  }
                  pill
                  className="w-full"
                  options={[
                    { value: 'nearest', label: 'Terdekat (Round)' },
                    { value: 'floor', label: 'Ke Bawah (Floor)' },
                    { value: 'ceil', label: 'Ke Atas (Ceil)' },
                  ]}
                />
              </div>
            </div>

            {/* Component Weights */}
            <div className="space-y-3 pt-2 border-t border-black/[0.06]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-[13.5px] font-semibold text-[#1C1D21]">
                    Bobot Komponen Nilai Akhir
                  </div>
                  <div
                    className={`text-[12px] font-medium tabular-nums flex items-center gap-1.5 mt-0.5 ${
                      totalExamWeight === 100 ? 'text-[#146C43]' : 'text-[#942922]'
                    }`}
                  >
                    {totalExamWeight !== 100 && <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
                    <span>Total Bobot: {totalExamWeight}% (Wajib 100%)</span>
                  </div>
                </div>
                {totalExamWeight !== 100 && (
                  <button
                    type="button"
                    onClick={handleBalanceExamWeights}
                    className={ACTION_BTN_SOFT_PRIMARY}
                  >
                    <span>Seimbangkan 100%</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { key: 'writtenExamPct' as const, label: 'Ujian Tertulis (%)' },
                  { key: 'practicalExamPct' as const, label: 'Praktik / Lab (%)' },
                  { key: 'assignmentPct' as const, label: 'Tugas / Quiz (%)' },
                  { key: 'attendanceBonusPct' as const, label: 'Kehadiran (%)' },
                ].map((item) => (
                  <div key={item.key} className="space-y-1.5">
                    <label className="text-[11.5px] font-semibold text-[#6E717A]">{item.label}</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={examDraft.weights[item.key]}
                      onChange={(e) =>
                        setExamDraft((prev) => ({
                          ...prev,
                          weights: {
                            ...prev.weights,
                            [item.key]: Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                          },
                        }))
                      }
                      className="w-full h-9 rounded-full border border-black/[0.1] px-3.5 text-[13px] font-semibold tabular-nums outline-none focus:border-[#ee2e65]"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Remedial Policy */}
            <div className="space-y-3 pt-2 border-t border-black/[0.06]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[13px] font-semibold text-[#1C1D21]">Izinkan Ujian Remedial</div>
                  <div className="text-[11.5px] text-[#6E717A]">
                    Siswa di bawah KKM dapat mengulang ujian dengan batas nilai maksimal tertentu
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setExamDraft((prev) => ({ ...prev, allowRemedial: !prev.allowRemedial }))
                  }
                  className={`w-11 h-6 rounded-full transition-colors p-0.5 cursor-pointer shrink-0 ${
                    examDraft.allowRemedial ? 'bg-[#ee2e65]' : 'bg-black/[0.15]'
                  }`}
                  aria-label="Toggle remedial exams"
                >
                  <span
                    className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                      examDraft.allowRemedial ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {examDraft.allowRemedial && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-semibold text-[#1C1D21]">
                      Maks. Kesempatan Remedial
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={examDraft.maxRemedialAttempts}
                      onChange={(e) =>
                        setExamDraft((prev) => ({
                          ...prev,
                          maxRemedialAttempts: Math.max(1, Number(e.target.value) || 1),
                        }))
                      }
                      className="w-full h-9 rounded-full border border-black/[0.1] px-3.5 text-[13px] font-semibold tabular-nums outline-none focus:border-[#ee2e65]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[12px] font-semibold text-[#1C1D21]">
                      Batas Nilai Maks. Remedial
                    </label>
                    <input
                      type="number"
                      min={examDraft.passingScore}
                      max={examDraft.scaleMax}
                      value={examDraft.remedialCapScore}
                      onChange={(e) =>
                        setExamDraft((prev) => ({
                          ...prev,
                          remedialCapScore: Math.min(
                            prev.scaleMax,
                            Math.max(0, Number(e.target.value) || 0)
                          ),
                        }))
                      }
                      className="w-full h-9 rounded-full border border-black/[0.1] px-3.5 text-[13px] font-semibold tabular-nums outline-none focus:border-[#ee2e65]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Grade Conversion Table */}
            <div className="space-y-2.5 pt-2 border-t border-black/[0.06]">
              <div className="text-[13.5px] font-semibold text-[#1C1D21]">
                Konversi Grade &amp; Status Kelulusan
              </div>
              <div className="rounded-xl border border-black/[0.06] overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#FAFBFD] border-b border-black/[0.05] text-[11px] font-semibold uppercase tracking-wider text-[#8A8D98]">
                      <th className="py-2.5 px-3.5">Grade</th>
                      <th className="py-2.5 px-3.5">Min. Skor</th>
                      <th className="py-2.5 px-3.5">Predikat</th>
                      <th className="py-2.5 px-3.5 text-right">Status Lulus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.05] text-[12.5px]">
                    {examDraft.gradeBands.map((band) => (
                      <tr key={band.id}>
                        <td className="py-2.5 px-3.5 font-bold text-[#1C1D21]">{band.grade}</td>
                        <td className="py-2.5 px-3.5">
                          <input
                            type="number"
                            min={0}
                            max={examDraft.scaleMax}
                            value={band.minScore}
                            onChange={(e) =>
                              setExamDraft((prev) => ({
                                ...prev,
                                gradeBands: prev.gradeBands.map((b) =>
                                  b.id === band.id
                                    ? { ...b, minScore: Math.max(0, Number(e.target.value) || 0) }
                                    : b
                                ),
                              }))
                            }
                            className="w-20 h-8 rounded-full border border-black/[0.1] px-2.5 text-center text-[12.5px] font-semibold tabular-nums outline-none focus:border-[#ee2e65]"
                          />
                        </td>
                        <td className="py-2.5 px-3.5">
                          <input
                            type="text"
                            value={band.label}
                            onChange={(e) =>
                              setExamDraft((prev) => ({
                                ...prev,
                                gradeBands: prev.gradeBands.map((b) =>
                                  b.id === band.id ? { ...b, label: e.target.value } : b
                                ),
                              }))
                            }
                            className="w-full h-8 rounded-full border border-black/[0.1] px-3 text-[12.5px] outline-none focus:border-[#ee2e65]"
                          />
                        </td>
                        <td className="py-2.5 px-3.5 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              setExamDraft((prev) => ({
                                ...prev,
                                gradeBands: prev.gradeBands.map((b) =>
                                  b.id === band.id ? { ...b, passed: !b.passed } : b
                                ),
                              }))
                            }
                            className={`text-[12px] font-semibold cursor-pointer ${
                              band.passed ? 'text-[#146C43]' : 'text-[#942922]'
                            }`}
                          >
                            {band.passed ? 'Lulus' : 'Tidak Lulus'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Save / Reset Actions */}
            <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleResetExamRule}
                className={ACTION_BTN_SECONDARY}
              >
                <RotateCcw className="w-4 h-4 shrink-0" />
                <span>Reset Default</span>
              </button>
              <button type="submit" className={ACTION_BTN_PRIMARY}>
                <Save className="w-4 h-4 shrink-0" />
                <span>Simpan Aturan Exams</span>
              </button>
            </div>
          </form>

          {/* Right 5 Cols: Live Grade Distribution Preview */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-black/[0.07] p-5 sm:p-6 space-y-5">
            <div className="pb-3.5 border-b border-black/[0.06]">
              <h3 className="text-[15.5px] font-semibold text-[#1C1D21]">
                Distribusi Grade Siswa Batch Aktif
              </h3>
              <p className="text-[12px] text-[#6E717A] tabular-nums mt-0.5">
                Kalkulasi langsung terhadap {studentsDirectory.length} siswa dengan KKM {examDraft.passingScore}
              </p>
            </div>

            <div className="divide-y divide-black/[0.05]">
              {examDraft.gradeBands.map((band) => {
                const count = gradeDistribution[band.grade] || 0;
                const pct =
                  studentsDirectory.length > 0
                    ? Math.round((count / studentsDirectory.length) * 100)
                    : 0;
                return (
                  <div key={band.id} className="py-3 first:pt-1 last:pb-1 space-y-1.5">
                    <div className="flex items-center justify-between text-[13px] tabular-nums">
                      <span className="font-semibold text-[#1C1D21]">
                        Grade {band.grade} ·{' '}
                        <span className="font-normal text-[#6E717A]">
                          {band.label} (≥ {band.minScore})
                        </span>
                      </span>
                      <span className="font-bold text-[#1C1D21]">
                        {count} siswa ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[#F4F5F8] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-[240ms] ease-[cubic-bezier(0.23,1,0.32,1)] ${
                          band.passed ? 'bg-[#10B981]' : 'bg-[#ee2e65]'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          </div>
        </div>
      )}
    </div>
  );
};
