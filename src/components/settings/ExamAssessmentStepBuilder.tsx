import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Layers,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import {
  ExamAssessmentScale,
  ExamGradingRule,
  ExamPositionParameter,
  ExamPositionTemplate,
  ExamSegment,
} from '../../types';
import {
  getScaleOptionAnalogousColors,
  recalculateScaleOptionWeights,
  resolveExamAssessmentConfig,
} from '../../data/examPositions';
import { normalizeExamGradingRule } from '../../data/batchDefaults';
import { CustomSelect } from '../ui/CustomSelect';
import {
  ACTION_BTN_PRIMARY,
  ACTION_BTN_SECONDARY,
  ACTION_BTN_SOFT_PRIMARY,
} from '../../constants/buttonStyles';

type BuilderStepId = 'scale' | 'position_segment' | 'criteria';

const BUILDER_STEPS: { id: BuilderStepId; stepNum: number; label: string; hint: string }[] = [
  {
    id: 'scale',
    stepNum: 1,
    label: 'Assessment Scale',
    hint: 'Buat skala nilai & label tombol',
  },
  {
    id: 'position_segment',
    stepNum: 2,
    label: 'Position & Segment',
    hint: 'Tentukan posisi & segment yang memakai skala ini',
  },
  {
    id: 'criteria',
    stepNum: 3,
    label: 'Assessment Criteria',
    hint: 'Buat parameter yang dinilai pada posisi',
  },
];

interface ExamAssessmentStepBuilderProps {
  examDraft: ExamGradingRule;
  onChangeExamDraft: (updater: (prev: ExamGradingRule) => ExamGradingRule) => void;
  onPersistRule: (nextRule: ExamGradingRule, toastTitle?: string, toastMessage?: string) => void;
  onNotify: (title: string, message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const ExamAssessmentStepBuilder: React.FC<ExamAssessmentStepBuilderProps> = ({
  examDraft,
  onChangeExamDraft,
  onPersistRule,
  onNotify,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeStep, setActiveStep] = useState<BuilderStepId>('scale');
  const [confirmDeleteScaleId, setConfirmDeleteScaleId] = useState<string | null>(null);

  const [modalDraft, setModalDraft] = useState<ExamGradingRule>(() =>
    normalizeExamGradingRule(examDraft)
  );

  const savedConfig = useMemo(
    () => resolveExamAssessmentConfig(examDraft),
    [examDraft]
  );

  const modalConfig = useMemo(
    () => resolveExamAssessmentConfig(modalDraft),
    [modalDraft]
  );

  const scales = modalConfig.scales;
  const positions = modalConfig.positions;
  const segments = modalConfig.segments;

  const [selectedScaleId, setSelectedScaleId] = useState<string>(
    () => savedConfig.scales[0]?.id || ''
  );
  const [selectedPositionId, setSelectedPositionId] = useState<string>(
    () => savedConfig.positions[0]?.id || ''
  );

  useEffect(() => {
    if (scales.length > 0 && !scales.some((s) => s.id === selectedScaleId)) {
      setSelectedScaleId(scales[0].id);
    }
  }, [scales, selectedScaleId]);

  useEffect(() => {
    if (positions.length > 0 && !positions.some((p) => p.id === selectedPositionId)) {
      setSelectedPositionId(positions[0].id);
    }
  }, [positions, selectedPositionId]);

  const activeScale = useMemo(
    () => scales.find((s) => s.id === selectedScaleId) || scales[0] || null,
    [scales, selectedScaleId]
  );

  const positionsUsingActiveScale = useMemo(
    () =>
      activeScale
        ? positions.filter((p) => (p.scaleId || scales[0]?.id) === activeScale.id)
        : [],
    [positions, activeScale, scales]
  );

  const activePosition = useMemo(
    () => positions.find((p) => p.id === selectedPositionId) || positions[0] || null,
    [positions, selectedPositionId]
  );

  const positionSegments = useMemo(
    () =>
      activePosition
        ? segments.filter((seg) => seg.positionId === activePosition.id)
        : [],
    [segments, activePosition]
  );

  const totalCriteriaCount = useMemo(
    () =>
      savedConfig.positions.reduce((sum, pos) => sum + (pos.parameters?.length || 0), 0),
    [savedConfig.positions]
  );

  const handleOpenCreateModal = () => {
    const base = normalizeExamGradingRule(examDraft);
    const baseConfig = resolveExamAssessmentConfig(base);
    const ts = Date.now();
    const newScaleId = `scale-${ts}`;
    const newScale: ExamAssessmentScale = {
      id: newScaleId,
      name: '',
      options: recalculateScaleOptionWeights([
        { id: `opt-${ts}-1`, value: 20, label: 'Needs improvement' },
        { id: `opt-${ts}-2`, value: 40, label: 'Fair' },
        { id: `opt-${ts}-3`, value: 60, label: 'Good' },
        { id: `opt-${ts}-4`, value: 80, label: 'Very Good' },
        { id: `opt-${ts}-5`, value: 100, label: 'Excellent' },
      ]),
    };

    setModalDraft({
      ...base,
      assessmentScales: [...baseConfig.scales, newScale],
      positionTemplates: baseConfig.positions,
      segments: baseConfig.segments,
    });
    setSelectedScaleId(newScaleId);
    setSelectedPositionId(baseConfig.positions[0]?.id || '');
    setActiveStep('scale');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (scaleId: string, initialStep: BuilderStepId = 'scale') => {
    const base = normalizeExamGradingRule(examDraft);
    const baseConfig = resolveExamAssessmentConfig(base);
    const linkedPos =
      baseConfig.positions.find((p) => p.scaleId === scaleId) ||
      baseConfig.positions[0];

    setModalDraft(base);
    setSelectedScaleId(scaleId);
    setSelectedPositionId(linkedPos?.id || '');
    setActiveStep(initialStep);
    setIsModalOpen(true);
  };

  const handleDeleteScaleFromTable = (scaleId: string) => {
    if (savedConfig.scales.length <= 1) {
      onNotify('Minimal 1 Skala', 'Harus terdapat minimal 1 assessment scale aktif.', 'warning');
      return;
    }
    const targetScale = savedConfig.scales.find((s) => s.id === scaleId);
    const remaining = savedConfig.scales.filter((s) => s.id !== scaleId);
    const fallbackScaleId = remaining[0]?.id || '';
    const nextRule: ExamGradingRule = {
      ...examDraft,
      assessmentScales: remaining,
      positionTemplates: savedConfig.positions.map((p) =>
        p.scaleId === scaleId ? { ...p, scaleId: fallbackScaleId } : p
      ),
      segments: savedConfig.segments,
    };
    onChangeExamDraft(() => nextRule);
    onPersistRule(
      nextRule,
      'Assessment Scale Dihapus',
      targetScale ? `${targetScale.name} telah dihapus.` : 'Skala penilaian diperbarui.'
    );
    setConfirmDeleteScaleId(null);
  };

  const patchModalConfig = (
    updater: (curr: {
      scales: ExamAssessmentScale[];
      positions: ExamPositionTemplate[];
      segments: ExamSegment[];
    }) => {
      scales: ExamAssessmentScale[];
      positions: ExamPositionTemplate[];
      segments: ExamSegment[];
    }
  ): ExamGradingRule => {
    const updated = updater({ scales, positions, segments });
    const nextRule: ExamGradingRule = {
      ...modalDraft,
      assessmentScales: updated.scales,
      positionTemplates: updated.positions,
      segments: updated.segments,
    };
    setModalDraft(nextRule);
    return nextRule;
  };

  const handleStepTabClick = (targetStep: BuilderStepId) => {
    if (targetStep !== 'scale' && (!activeScale || !activeScale.name.trim())) {
      onNotify(
        'Lengkapi Langkah 1 Dulu',
        'Isi Assessment scale name terlebih dahulu sebelum melanjutkan ke langkah berikutnya.',
        'warning'
      );
      setActiveStep('scale');
      return;
    }
    if (targetStep === 'criteria' && activeScale) {
      const linked = positions.filter((p) => p.scaleId === activeScale.id);
      if (linked.length > 0 && !linked.some((p) => p.id === selectedPositionId)) {
        setSelectedPositionId(linked[0].id);
      }
    }
    setActiveStep(targetStep);
  };

  // ==================== STEP 1: ASSESSMENT SCALE HANDLERS ====================
  const handleAddScaleOption = () => {
    if (!activeScale) return;
    patchModalConfig((curr) => ({
      ...curr,
      scales: curr.scales.map((s) => {
        if (s.id !== activeScale.id) return s;
        const nextOptions = recalculateScaleOptionWeights([
          ...s.options,
          {
            id: `opt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            value: 100,
            label: '',
          },
        ]);
        return { ...s, options: nextOptions };
      }),
    }));
  };

  const handleUpdateScaleName = (name: string) => {
    if (!activeScale) return;
    patchModalConfig((curr) => ({
      ...curr,
      scales: curr.scales.map((s) => (s.id === activeScale.id ? { ...s, name } : s)),
    }));
  };

  const handleUpdateScaleOptionLabel = (optionId: string, label: string) => {
    if (!activeScale) return;
    patchModalConfig((curr) => ({
      ...curr,
      scales: curr.scales.map((s) => {
        if (s.id !== activeScale.id) return s;
        return {
          ...s,
          options: s.options.map((opt) =>
            opt.id === optionId ? { ...opt, label } : opt
          ),
        };
      }),
    }));
  };

  const handleDeleteScaleOption = (optionId: string) => {
    if (!activeScale) return;
    if (activeScale.options.length <= 1) {
      onNotify('Minimal 1 Pilihan', 'Assessment scale minimal memiliki 1 tombol nilai.', 'warning');
      return;
    }
    patchModalConfig((curr) => ({
      ...curr,
      scales: curr.scales.map((s) =>
        s.id === activeScale.id
          ? {
              ...s,
              options: recalculateScaleOptionWeights(
                s.options.filter((o) => o.id !== optionId)
              ),
            }
          : s
      ),
    }));
  };

  const handleSaveStep1 = () => {
    if (!activeScale || !activeScale.name.trim()) {
      onNotify('Nama Scale Kosong', 'Isi Assessment scale name sebelum melanjutkan.', 'warning');
      return;
    }
    const emptyOpt = activeScale.options.some((o) => !o.label.trim());
    if (emptyOpt) {
      onNotify('Label Tombol Kosong', 'Pastikan setiap scale option memiliki label tombol.', 'warning');
      return;
    }
    const normalizedRule = patchModalConfig((curr) => ({
      ...curr,
      scales: curr.scales.map((s) =>
        s.id === activeScale.id
          ? {
              ...s,
              name: s.name.trim(),
              options: recalculateScaleOptionWeights(
                s.options.map((o) => ({ ...o, label: o.label.trim() }))
              ),
            }
          : s
      ),
    }));
    onChangeExamDraft(() => normalizedRule);
    onPersistRule(
      normalizedRule,
      'Langkah 1 Disimpan',
      `Skala "${activeScale.name.trim()}" siap dipasang ke Position & Segment.`
    );

    const linked = normalizedRule.positionTemplates?.filter(
      (p) => p.scaleId === activeScale.id
    );
    if (linked && linked.length > 0) {
      setSelectedPositionId(linked[0].id);
    }
    setActiveStep('position_segment');
  };

  // ==================== STEP 2: POSITION & SEGMENT HANDLERS ====================
  const handleSelectAndTogglePositionForScale = (posId: string, attachNow?: boolean) => {
    setSelectedPositionId(posId);
    if (!activeScale || attachNow === undefined) return;
    const fallbackOtherScaleId =
      scales.find((s) => s.id !== activeScale.id)?.id || activeScale.id;

    patchModalConfig((curr) => ({
      ...curr,
      positions: curr.positions.map((p) => {
        if (p.id !== posId) return p;
        return {
          ...p,
          scaleId: attachNow ? activeScale.id : fallbackOtherScaleId,
        };
      }),
    }));
  };

  const handleAddPosition = () => {
    const newId = `pos-${Date.now()}`;
    const defaultSegId = `seg-${Date.now()}`;
    const newPosition: ExamPositionTemplate = {
      id: newId,
      name: `Posisi Baru ${positions.length + 1}`,
      department: 'Operations',
      scaleId: activeScale?.id || scales[0]?.id,
      parameters: [
        {
          id: `param-${Date.now()}`,
          segmentId: defaultSegId,
          label: 'Kualitas Eksekusi Standar',
          description: 'Kesesuaian praktik dengan SOP yang berlaku.',
          weightPct: 100,
        },
      ],
    };
    const newSegment: ExamSegment = {
      id: defaultSegId,
      positionId: newId,
      name: 'Kompetensi Utama',
    };
    patchModalConfig((curr) => ({
      ...curr,
      positions: [...curr.positions, newPosition],
      segments: [...curr.segments, newSegment],
    }));
    setSelectedPositionId(newId);
  };

  const handleDeletePosition = (posId: string) => {
    if (positions.length <= 1) {
      onNotify('Minimal 1 Position', 'Harus terdapat minimal 1 position penilaian.', 'warning');
      return;
    }
    const remaining = positions.filter((p) => p.id !== posId);
    const nextRule = patchModalConfig((curr) => ({
      ...curr,
      positions: remaining,
      segments: curr.segments.filter((s) => s.positionId !== posId),
    }));
    setSelectedPositionId(remaining[0]?.id || '');
    onChangeExamDraft(() => nextRule);
    onPersistRule(nextRule, 'Position Dihapus', 'Daftar position penilaian diperbarui.');
  };

  const handleUpdatePositionField = (
    field: 'name' | 'department' | 'scaleId',
    value: string
  ) => {
    if (!activePosition) return;
    patchModalConfig((curr) => ({
      ...curr,
      positions: curr.positions.map((p) =>
        p.id === activePosition.id ? { ...p, [field]: value } : p
      ),
    }));
  };

  const handleAddSegment = () => {
    if (!activePosition) return;
    const newSeg: ExamSegment = {
      id: `seg-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      positionId: activePosition.id,
      name: `Segment ${positionSegments.length + 1}`,
    };
    patchModalConfig((curr) => ({
      ...curr,
      segments: [...curr.segments, newSeg],
    }));
  };

  const handleUpdateSegmentName = (segmentId: string, name: string) => {
    patchModalConfig((curr) => ({
      ...curr,
      segments: curr.segments.map((seg) =>
        seg.id === segmentId ? { ...seg, name } : seg
      ),
    }));
  };

  const handleDeleteSegment = (segmentId: string) => {
    if (!activePosition) return;
    patchModalConfig((curr) => ({
      ...curr,
      segments: curr.segments.filter((s) => s.id !== segmentId),
      positions: curr.positions.map((p) =>
        p.id === activePosition.id
          ? {
              ...p,
              parameters: p.parameters.map((param) =>
                param.segmentId === segmentId ? { ...param, segmentId: undefined } : param
              ),
            }
          : p
      ),
    }));
  };

  const handleSaveStep2 = () => {
    if (!activePosition || !activePosition.name.trim()) {
      onNotify('Nama Position Kosong', 'Isi nama position sebelum melanjutkan.', 'warning');
      return;
    }
    const emptySeg = positionSegments.some((s) => !s.name.trim());
    if (emptySeg) {
      onNotify('Nama Segment Kosong', 'Isi semua nama segment atau hapus yang tidak digunakan.', 'warning');
      return;
    }

    // Ensure at least the focused position uses activeScale if no position has it yet
    const currentlyUsingActiveScale = activeScale
      ? positions.some((p) => p.scaleId === activeScale.id)
      : true;

    const nextRule = patchModalConfig((curr) => ({
      ...curr,
      positions: curr.positions.map((p) => {
        if (p.id !== activePosition.id) return p;
        return {
          ...p,
          name: p.name.trim(),
          department: p.department.trim() || 'General',
          scaleId:
            !currentlyUsingActiveScale && activeScale
              ? activeScale.id
              : p.scaleId || activeScale?.id || scales[0]?.id,
        };
      }),
      segments: curr.segments.map((s) => ({ ...s, name: s.name.trim() })),
    }));
    onChangeExamDraft(() => nextRule);
    onPersistRule(
      nextRule,
      'Langkah 2 Disimpan',
      `Position "${activePosition.name.trim()}" (${positionSegments.length} segment) siap diisi kriteria.`
    );
    setActiveStep('criteria');
  };

  // ==================== STEP 3: ASSESSMENT CRITERIA HANDLERS ====================
  const activeParams = activePosition?.parameters || [];
  const totalCriteriaWeight = activeParams.reduce(
    (sum, p) => sum + (Number(p.weightPct) || 0),
    0
  );

  const activePositionScale = useMemo(() => {
    if (!activePosition) return activeScale;
    return (
      scales.find((s) => s.id === activePosition.scaleId) ||
      activeScale ||
      scales[0] ||
      null
    );
  }, [activePosition, activeScale, scales]);

  const handleAddCriterion = (defaultSegmentId?: string) => {
    if (!activePosition) return;
    const fallbackSegId = defaultSegmentId || positionSegments[0]?.id;
    const newParam: ExamPositionParameter = {
      id: `crit-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      segmentId: fallbackSegId,
      label: '',
      description: '',
      weightPct: activeParams.length === 0 ? 100 : 20,
    };
    patchModalConfig((curr) => ({
      ...curr,
      positions: curr.positions.map((p) =>
        p.id === activePosition.id
          ? { ...p, parameters: [...p.parameters, newParam] }
          : p
      ),
    }));
  };

  const handleUpdateCriterion = (
    paramId: string,
    patch: Partial<ExamPositionParameter>
  ) => {
    if (!activePosition) return;
    patchModalConfig((curr) => ({
      ...curr,
      positions: curr.positions.map((p) =>
        p.id === activePosition.id
          ? {
              ...p,
              parameters: p.parameters.map((param) =>
                param.id === paramId ? { ...param, ...patch } : param
              ),
            }
          : p
      ),
    }));
  };

  const handleDeleteCriterion = (paramId: string) => {
    if (!activePosition) return;
    if (activeParams.length <= 1) {
      onNotify('Minimal 1 Kriteria', 'Setiap position minimal memiliki 1 assessment criteria.', 'warning');
      return;
    }
    patchModalConfig((curr) => ({
      ...curr,
      positions: curr.positions.map((p) =>
        p.id === activePosition.id
          ? {
              ...p,
              parameters: p.parameters.filter((param) => param.id !== paramId),
            }
          : p
      ),
    }));
  };

  const handleBalanceCriteriaWeights = () => {
    if (!activePosition || activeParams.length === 0) return;
    const count = activeParams.length;
    const base = Math.floor(100 / count);
    const remainder = 100 - base * count;
    patchModalConfig((curr) => ({
      ...curr,
      positions: curr.positions.map((p) =>
        p.id === activePosition.id
          ? {
              ...p,
              parameters: p.parameters.map((param, idx) => ({
                ...param,
                weightPct: base + (idx < remainder ? 1 : 0),
              })),
            }
          : p
      ),
    }));
  };

  const handleSaveStep3 = () => {
    if (!activePosition) return;
    const emptyLabel = activeParams.some((p) => !p.label.trim());
    if (emptyLabel) {
      onNotify('Nama Kriteria Kosong', 'Isi semua nama kriteria penilaian sebelum menyimpan.', 'warning');
      return;
    }
    const nextRule = patchModalConfig((curr) => ({
      ...curr,
      positions: curr.positions.map((p) =>
        p.id === activePosition.id
          ? {
              ...p,
              parameters: p.parameters.map((param) => ({
                ...param,
                label: param.label.trim(),
                description: param.description.trim(),
              })),
            }
          : p
      ),
    }));
    onChangeExamDraft(() => nextRule);
    onPersistRule(
      nextRule,
      'Parameter Penilaian Disimpan',
      `${activeParams.length} kriteria untuk ${activePosition.name} aktif di halaman Exams.`
    );
    setIsModalOpen(false);
  };

  const activeStepIndex = BUILDER_STEPS.findIndex((s) => s.id === activeStep);
  const scaleStepPct =
    activeScale && activeScale.options.length > 0
      ? Number((100 / activeScale.options.length).toFixed(1))
      : 100;

  return (
    <>
      {/* MAIN TABLE LIST OF EXISTING SCALES */}
      <div className="bg-white rounded-2xl border border-black/[0.07] overflow-hidden">
        <div className="px-5 sm:px-6 py-4 bg-[#FAFBFD] border-b border-black/[0.06] flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-[16px] font-semibold text-[#1C1D21]">
              Daftar Skala &amp; Parameter Penilaian Exams
            </h2>
            <p className="text-[12px] text-[#6E717A] tabular-nums mt-0.5">
              {savedConfig.scales.length} assessment scale · {savedConfig.positions.length} position ·{' '}
              {totalCriteriaCount} kriteria penilaian
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className={ACTION_BTN_PRIMARY}
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Buat Parameter &amp; Scale</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[760px]">
            <thead>
              <tr className="bg-white border-b border-black/[0.06] text-[11px] font-semibold uppercase tracking-wider text-[#8A8D98]">
                <th className="py-3 px-5">Assessment Scale</th>
                <th className="py-3 px-4">Tombol Nilai (100% ÷ Pilihan)</th>
                <th className="py-3 px-4">Position Terpasang</th>
                <th className="py-3 px-5 text-right w-[160px]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.05] text-[13px]">
              {savedConfig.scales.map((scale) => {
                const sortedOpts = [...scale.options].sort((a, b) => a.value - b.value);
                const linkedPositions = savedConfig.positions.filter(
                  (p) => (p.scaleId || savedConfig.scales[0]?.id) === scale.id
                );
                const perStepPct =
                  sortedOpts.length > 0 ? Number((100 / sortedOpts.length).toFixed(1)) : 100;

                return (
                  <tr
                    key={scale.id}
                    onClick={() => handleOpenEditModal(scale.id, 'scale')}
                    className="hover:bg-[#FAFBFD] transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-5 align-top">
                      <div className="font-semibold text-[#1C1D21]">{scale.name}</div>
                      <div className="text-[11.5px] text-[#6E717A] tabular-nums mt-0.5">
                        {sortedOpts.length} pilihan · +{perStepPct}% per tingkat
                      </div>
                    </td>

                    <td className="py-3.5 px-4 align-top">
                      <div className="flex flex-wrap gap-1.5">
                        {sortedOpts.map((opt, idx) => {
                          const colorSpec = getScaleOptionAnalogousColors(
                            opt.value,
                            sortedOpts,
                            idx
                          );
                          return (
                            <span
                              key={opt.id}
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-semibold tabular-nums ${colorSpec.unselected}`}
                            >
                              <span>{opt.value}%</span>
                              {opt.label && (
                                <span className={`font-medium ${colorSpec.subLabelUnselected}`}>
                                  · {opt.label}
                                </span>
                              )}
                            </span>
                          );
                        })}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 align-top">
                      {linkedPositions.length > 0 ? (
                        <div className="space-y-1">
                          {linkedPositions.map((pos) => (
                            <div
                              key={pos.id}
                              className="text-[12.5px] font-medium text-[#1C1D21] tabular-nums"
                            >
                              {pos.name}{' '}
                              <span className="text-[#8A8D98] font-normal">
                                ({pos.parameters.length} kriteria)
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[12px] text-[#8A8D98]">
                          Belum dipasang ke posisi
                        </span>
                      )}
                    </td>

                    <td
                      className="py-3 px-5 text-right align-top whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(scale.id, 'scale')}
                          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-black/[0.1] bg-white hover:bg-[#FAFBFD] text-[12px] font-semibold text-[#1C1D21] cursor-pointer transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5 shrink-0" />
                          <span>Atur</span>
                        </button>

                        {savedConfig.scales.length > 1 &&
                          (confirmDeleteScaleId === scale.id ? (
                            <button
                              type="button"
                              onClick={() => handleDeleteScaleFromTable(scale.id)}
                              className="inline-flex items-center gap-1 h-8 px-2.5 rounded-full bg-[#FFECEB] text-[#942922] text-[12px] font-semibold cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5 shrink-0" />
                              <span>Hapus?</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteScaleId(scale.id)}
                              aria-label={`Hapus scale ${scale.name}`}
                              className="w-8 h-8 rounded-full border border-black/[0.08] bg-white hover:bg-[#FFECEB] text-[#6E717A] hover:text-[#942922] inline-flex items-center justify-center cursor-pointer transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3-STEP WIZARD MODAL */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-6"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl border border-black/[0.08] shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Top Header */}
            <div className="px-5 sm:px-6 py-4 bg-white border-b border-black/[0.06] flex items-center justify-between gap-3 shrink-0">
              <div>
                <h2 className="text-[16px] sm:text-[17px] font-semibold text-[#1C1D21]">
                  Pembuatan Parameter &amp; Skala Penilaian Exams
                </h2>
                <p className="text-[12px] text-[#6E717A] tabular-nums mt-0.5">
                  Langkah {activeStepIndex + 1} dari {BUILDER_STEPS.length} ·{' '}
                  {BUILDER_STEPS[activeStepIndex]?.hint}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Tutup modal parameter penilaian"
                className="w-9 h-9 rounded-full hover:bg-black/5 text-[#6E717A] hover:text-[#1C1D21] inline-flex items-center justify-center cursor-pointer transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Step Tabs Navigation (3 Steps) */}
            <div className="px-4 sm:px-6 py-3 bg-[#F7F8FA] border-b border-black/[0.06] shrink-0">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {BUILDER_STEPS.map((step) => {
                  const isActive = activeStep === step.id;
                  const isPassed = step.stepNum < activeStepIndex + 1;
                  return (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => handleStepTabClick(step.id)}
                      className={`h-11 px-3.5 rounded-xl flex items-center gap-2.5 text-left transition-all cursor-pointer ${
                        isActive
                          ? 'bg-white text-[#1C1D21] border border-black/[0.08] shadow-xs font-semibold'
                          : 'text-[#6E717A] hover:text-[#1C1D21] hover:bg-white/60 font-medium'
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[11.5px] font-bold tabular-nums shrink-0 ${
                          isActive
                            ? 'bg-[#ee2e65] text-white'
                            : isPassed
                              ? 'bg-[#E6F9F0] text-[#146C43]'
                              : 'bg-black/[0.06] text-[#6E717A]'
                        }`}
                      >
                        {isPassed ? <Check className="w-3.5 h-3.5" /> : step.stepNum}
                      </span>
                      <span className="text-[13px] truncate">{step.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Scrollable Step Body */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1">
              {/* STEP 1: ASSESSMENT SCALE */}
              {activeStep === 'scale' && activeScale && (
                <div className="space-y-5">
                  <div className="max-w-md space-y-1.5">
                    <label className="block text-[12.5px] font-semibold text-[#1C1D21]">
                      Assessment scale name
                    </label>
                    <input
                      type="text"
                      value={activeScale.name}
                      onChange={(e) => handleUpdateScaleName(e.target.value)}
                      placeholder="Contoh: Skala Penilaian Praktik 1–5"
                      className="w-full h-11 rounded-xl border border-black/[0.12] px-4 text-[14px] font-medium text-[#1C1D21] bg-white outline-none focus:border-[#ee2e65]"
                    />
                  </div>

                  {/* Scale options box with automatic 100% / N calculation */}
                  <div className="bg-[#F7F8FA] rounded-2xl border border-black/[0.06] p-4 sm:p-5 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[13px] font-medium text-[#6E717A]">
                        Scale options
                      </span>
                      <span className="text-[12px] font-semibold text-[#1C1D21] tabular-nums">
                        Bobot: 100% ÷ {activeScale.options.length} pilihan = +{scaleStepPct}% per tingkat
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {activeScale.options.map((opt, idx) => (
                        <div key={opt.id} className="flex items-center gap-2.5">
                          <span
                            className="w-11 h-11 rounded-xl border border-black/[0.08] bg-white flex items-center justify-center text-[13.5px] font-semibold text-[#6E717A] tabular-nums shrink-0"
                            title="Urutan tingkat"
                          >
                            {idx + 1}
                          </span>
                          <input
                            type="text"
                            value={opt.label}
                            onChange={(e) =>
                              handleUpdateScaleOptionLabel(opt.id, e.target.value)
                            }
                            placeholder="Label pada tombol penilaian (mis. Good, Excellent)"
                            aria-label="Label tombol penilaian"
                            className="flex-1 min-w-0 h-11 rounded-xl border border-black/[0.1] bg-white px-4 text-[14px] text-[#1C1D21] outline-none focus:border-[#ee2e65]"
                          />
                          <div
                            className="w-20 sm:w-24 h-11 rounded-xl border border-black/[0.08] bg-white px-3 flex items-center justify-center text-[13.5px] font-bold text-[#1C1D21] tabular-nums shrink-0"
                            title="Nilai bobot otomatis (100% dibagi banyaknya scale option)"
                          >
                            {opt.value}%
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteScaleOption(opt.id)}
                            aria-label="Hapus pilihan scale"
                            className="w-10 h-10 rounded-full border border-black/[0.08] bg-white hover:bg-[#FFECEB] hover:border-[#942922]/25 text-[#6E717A] hover:text-[#942922] inline-flex items-center justify-center shrink-0 cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={handleAddScaleOption}
                        className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-full bg-white border border-black/[0.1] hover:bg-[#FEF1F5] hover:border-[#ee2e65]/40 text-[13px] font-semibold text-[#1C1D21] cursor-pointer transition-colors"
                      >
                        <Plus className="w-4 h-4 shrink-0" />
                        <span>Add selection</span>
                      </button>
                    </div>
                  </div>

                  {/* Live Button Preview with Analogous Red -> Green Spectrum */}
                  <div className="space-y-2">
                    <div className="text-[12px] font-medium text-[#6E717A]">
                      Pratinjau Tombol di Formulir Exams
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {activeScale.options.map((opt, idx) => {
                        const colorSpec = getScaleOptionAnalogousColors(
                          opt.value,
                          activeScale.options,
                          idx
                        );
                        return (
                          <div
                            key={opt.id}
                            className={`min-w-[84px] px-3 py-2 rounded-xl border text-center transition-colors ${colorSpec.unselected}`}
                          >
                            <div className="text-[13.5px] font-bold tabular-nums leading-none">
                              {opt.value}%
                            </div>
                            <div
                              className={`text-[10.5px] font-medium mt-1 whitespace-nowrap ${colorSpec.subLabelUnselected}`}
                            >
                              {opt.label || '—'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-black/[0.06]">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className={ACTION_BTN_SECONDARY}
                    >
                      <span>Batal</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveStep1}
                      className={ACTION_BTN_PRIMARY}
                    >
                      <Save className="w-4 h-4 shrink-0" />
                      <span>Save &amp; Lanjut ke Position</span>
                      <ArrowRight className="w-4 h-4 shrink-0" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: POSITION & SEGMENT (LINKED DIRECTLY TO SCALE FROM STEP 1) */}
              {activeStep === 'position_segment' && activeScale && activePosition && (
                <div className="space-y-5">
                  {/* Context Banner: Active Scale from Step 1 */}
                  <div className="rounded-2xl border border-[#ee2e65]/25 bg-[#FEF1F5]/55 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="text-[11.5px] font-semibold text-[#ee2e65]">
                        Skala dari Langkah 1 yang Akan Dipasang
                      </div>
                      <div className="text-[15px] font-bold text-[#1C1D21] truncate">
                        {activeScale.name}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {activeScale.options.map((opt, idx) => {
                        const colorSpec = getScaleOptionAnalogousColors(
                          opt.value,
                          activeScale.options,
                          idx
                        );
                        return (
                          <span
                            key={opt.id}
                            className={`px-2 py-1 rounded-lg border text-[11px] font-semibold tabular-nums ${colorSpec.unselected}`}
                          >
                            {opt.value}% · {opt.label || '—'}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Pick / Toggle Positions that will use this Scale */}
                  <div className="bg-[#F7F8FA] rounded-2xl border border-black/[0.06] p-4 sm:p-5 space-y-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="text-[13.5px] font-semibold text-[#1C1D21]">
                          Pilih atau Buat Position yang Menggunakan Skala Ini
                        </div>
                        <div className="text-[12px] text-[#6E717A] tabular-nums">
                          {positionsUsingActiveScale.length} position terpasang pada skala{' '}
                          <span className="font-semibold text-[#1C1D21]">{activeScale.name}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleAddPosition}
                        className={ACTION_BTN_SOFT_PRIMARY}
                      >
                        <Plus className="w-4 h-4 shrink-0" />
                        <span>Position Baru</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {positions.map((pos) => {
                        const isUsingThisScale = pos.scaleId === activeScale.id;
                        const isFocused = pos.id === activePosition.id;
                        const otherScaleName = scales.find((s) => s.id === pos.scaleId)?.name;

                        return (
                          <div
                            key={pos.id}
                            onClick={() => handleSelectAndTogglePositionForScale(pos.id)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                              isFocused
                                ? 'bg-white border-[#ee2e65] ring-2 ring-[#ee2e65]/15'
                                : 'bg-white border-black/[0.08] hover:border-black/[0.2]'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="text-[13.5px] font-semibold text-[#1C1D21] truncate">
                                {pos.name}
                              </div>
                              <div className="text-[11.5px] text-[#6E717A] truncate mt-0.5">
                                {pos.department} · {pos.parameters.length} kriteria
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-black/[0.05]">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectAndTogglePositionForScale(
                                    pos.id,
                                    !isUsingThisScale
                                  );
                                }}
                                className={`inline-flex items-center gap-1.5 px-2.5 h-7 rounded-full text-[11.5px] font-semibold cursor-pointer transition-colors ${
                                  isUsingThisScale
                                    ? 'bg-[#E6F9F0] text-[#146C43]'
                                    : 'bg-[#FAFBFD] border border-black/[0.1] text-[#6E717A] hover:text-[#1C1D21]'
                                }`}
                              >
                                {isUsingThisScale && <Check className="w-3 h-3 shrink-0" />}
                                <span>
                                  {isUsingThisScale ? 'Memakai Skala Ini' : 'Pasang Skala Ini'}
                                </span>
                              </button>

                              {!isUsingThisScale && otherScaleName && (
                                <span className="text-[10.5px] text-[#8A8D98] truncate max-w-[110px]">
                                  {otherScaleName}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Focused Position Details + Segments */}
                  <div className="bg-[#F7F8FA] rounded-2xl border border-black/[0.06] p-4 sm:p-5 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-black/[0.06]">
                      <div className="text-[13.5px] font-semibold text-[#1C1D21]">
                        Detail &amp; Segmentasi · {activePosition.name}
                      </div>
                      {positions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeletePosition(activePosition.id)}
                          aria-label="Hapus Position"
                          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-black/[0.08] bg-white hover:bg-[#FFECEB] text-[12px] font-medium text-[#6E717A] hover:text-[#942922] cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus Position</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-[12.5px] font-semibold text-[#1C1D21]">
                          Nama Position
                        </label>
                        <input
                          type="text"
                          value={activePosition.name}
                          onChange={(e) => handleUpdatePositionField('name', e.target.value)}
                          placeholder="Contoh: Frontliner / Cashier"
                          className="w-full h-11 rounded-xl border border-black/[0.1] bg-white px-4 text-[14px] font-medium text-[#1C1D21] outline-none focus:border-[#ee2e65]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[12.5px] font-semibold text-[#1C1D21]">
                          Department / Area
                        </label>
                        <input
                          type="text"
                          value={activePosition.department}
                          onChange={(e) => handleUpdatePositionField('department', e.target.value)}
                          placeholder="Contoh: Front of House"
                          className="w-full h-11 rounded-xl border border-black/[0.1] bg-white px-4 text-[14px] text-[#1C1D21] outline-none focus:border-[#ee2e65]"
                        />
                      </div>
                    </div>

                    {/* Segments inside same step */}
                    <div className="space-y-3 pt-2 border-t border-black/[0.06]">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[13px] font-semibold text-[#1C1D21]">
                          Segment dari {activePosition.name || 'Position'}
                        </span>
                        <span className="text-[12px] font-medium text-[#6E717A] tabular-nums">
                          {positionSegments.length} segment aktif
                        </span>
                      </div>

                      {positionSegments.length === 0 ? (
                        <div className="py-5 px-4 text-center rounded-xl border border-dashed border-black/[0.12] bg-white space-y-1.5">
                          <Layers className="w-6 h-6 text-[#B4B6C1] mx-auto" />
                          <div className="text-[13px] font-semibold text-[#1C1D21]">
                            Belum ada segment pada posisi ini
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {positionSegments.map((seg, idx) => {
                            const criteriaCount = activePosition.parameters.filter(
                              (p) => p.segmentId === seg.id
                            ).length;
                            return (
                              <div key={seg.id} className="flex items-center gap-2.5">
                                <span className="w-9 h-11 rounded-xl border border-black/[0.08] bg-white flex items-center justify-center text-[13px] font-bold text-[#6E717A] tabular-nums shrink-0">
                                  {String(idx + 1).padStart(2, '0')}
                                </span>
                                <input
                                  type="text"
                                  value={seg.name}
                                  onChange={(e) => handleUpdateSegmentName(seg.id, e.target.value)}
                                  placeholder="Nama segment (mis. Service & Hospitality)"
                                  aria-label="Nama Segment"
                                  className="flex-1 min-w-0 h-11 rounded-xl border border-black/[0.1] bg-white px-4 text-[14px] font-medium text-[#1C1D21] outline-none focus:border-[#ee2e65]"
                                />
                                <span className="hidden sm:inline text-[12px] text-[#6E717A] tabular-nums shrink-0 px-2">
                                  {criteriaCount} kriteria
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSegment(seg.id)}
                                  aria-label={`Hapus segment ${seg.name}`}
                                  className="w-10 h-10 rounded-full border border-black/[0.08] bg-white hover:bg-[#FFECEB] hover:border-[#942922]/25 text-[#6E717A] hover:text-[#942922] inline-flex items-center justify-center shrink-0 cursor-pointer transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={handleAddSegment}
                          className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-full bg-white border border-black/[0.1] hover:bg-[#FEF1F5] hover:border-[#ee2e65]/40 text-[13px] font-semibold text-[#1C1D21] cursor-pointer transition-colors"
                        >
                          <Plus className="w-4 h-4 shrink-0" />
                          <span>Add segment</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-black/[0.06]">
                    <button
                      type="button"
                      onClick={() => setActiveStep('scale')}
                      className={ACTION_BTN_SECONDARY}
                    >
                      <ArrowLeft className="w-4 h-4 shrink-0" />
                      <span>Kembali ke Scale</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveStep2}
                      className={ACTION_BTN_PRIMARY}
                    >
                      <Save className="w-4 h-4 shrink-0" />
                      <span>Save &amp; Lanjut ke Criteria</span>
                      <ArrowRight className="w-4 h-4 shrink-0" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: ASSESSMENT CRITERIA */}
              {activeStep === 'criteria' && activePosition && (
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[240px]">
                      <span className="text-[12.5px] font-semibold text-[#6E717A] shrink-0">
                        Kriteria untuk Position:
                      </span>
                      <CustomSelect
                        value={activePosition.id}
                        onChange={setSelectedPositionId}
                        ariaLabel="Pilih Position untuk Kriteria"
                        className="w-full sm:w-80"
                        triggerClassName="h-10 rounded-xl border-black/[0.1] text-[13px] font-medium"
                        options={positions.map((pos) => ({
                          value: pos.id,
                          label: `${pos.name} (${pos.parameters.length})`,
                        }))}
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      <span
                        className={`text-[12.5px] font-semibold tabular-nums ${
                          totalCriteriaWeight === 100 ? 'text-[#146C43]' : 'text-[#942922]'
                        }`}
                      >
                        Total Bobot Kriteria: {totalCriteriaWeight}%
                      </span>
                      {totalCriteriaWeight !== 100 && (
                        <button
                          type="button"
                          onClick={handleBalanceCriteriaWeights}
                          className={ACTION_BTN_SOFT_PRIMARY}
                        >
                          <span>Seimbangkan 100%</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Connected Scale Reminder Strip */}
                  {activePositionScale && (
                    <div className="rounded-xl border border-black/[0.06] bg-[#FAFBFD] px-4 py-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="text-[12.5px] text-[#6E717A]">
                        Setiap kriteria di bawah dinilai menggunakan skala:{' '}
                        <span className="font-semibold text-[#1C1D21]">
                          {activePositionScale.name}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {activePositionScale.options.map((opt, idx) => {
                          const colorSpec = getScaleOptionAnalogousColors(
                            opt.value,
                            activePositionScale.options,
                            idx
                          );
                          return (
                            <span
                              key={opt.id}
                              className={`px-2 py-0.5 rounded-md border text-[11px] font-semibold tabular-nums ${colorSpec.unselected}`}
                            >
                              {opt.value}% · {opt.label || '—'}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="bg-[#F7F8FA] rounded-2xl border border-black/[0.06] p-4 sm:p-5 space-y-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-medium text-[#6E717A]">
                        Assessment criteria · {activePosition.name}
                      </span>
                      <span className="text-[11.5px] text-[#8A8D98] tabular-nums">
                        {activeParams.length} parameter penilaian
                      </span>
                    </div>

                    <div className="space-y-3">
                      {activeParams.map((param, idx) => (
                        <div
                          key={param.id}
                          className="p-4 rounded-xl bg-white border border-black/[0.08] space-y-3"
                        >
                          <div className="flex flex-col md:flex-row md:items-center gap-2.5">
                            <span className="w-8 h-8 rounded-lg bg-[#FAFBFD] border border-black/[0.07] flex items-center justify-center text-[12px] font-bold text-[#6E717A] tabular-nums shrink-0">
                              {String(idx + 1).padStart(2, '0')}
                            </span>

                            <div className="flex-1 min-w-0">
                              <input
                                type="text"
                                value={param.label}
                                onChange={(e) =>
                                  handleUpdateCriterion(param.id, { label: e.target.value })
                                }
                                placeholder="Nama kriteria / parameter penilaian..."
                                aria-label="Nama kriteria penilaian"
                                className="w-full h-10 rounded-xl border border-black/[0.1] bg-white px-3.5 text-[13.5px] font-semibold text-[#1C1D21] outline-none focus:border-[#ee2e65]"
                              />
                            </div>

                            {positionSegments.length > 0 && (
                              <div className="w-full md:w-52 shrink-0">
                                <CustomSelect
                                  value={param.segmentId || ''}
                                  onChange={(val) =>
                                    handleUpdateCriterion(param.id, {
                                      segmentId: val || undefined,
                                    })
                                  }
                                  placeholder="Pilih Segment..."
                                  ariaLabel="Segment kriteria"
                                  className="w-full"
                                  triggerClassName="h-10 rounded-xl border-black/[0.1] text-[12.5px] font-medium"
                                  options={[
                                    ...positionSegments.map((seg) => ({
                                      value: seg.id,
                                      label: seg.name,
                                    })),
                                    { value: '', label: 'Tanpa Segment' },
                                  ]}
                                />
                              </div>
                            )}

                            <div className="flex items-center gap-2 shrink-0">
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={param.weightPct}
                                  onChange={(e) =>
                                    handleUpdateCriterion(param.id, {
                                      weightPct: Math.min(
                                        100,
                                        Math.max(0, Number(e.target.value) || 0)
                                      ),
                                    })
                                  }
                                  aria-label="Bobot persen kriteria"
                                  className="w-20 h-10 rounded-xl border border-black/[0.1] bg-white px-2.5 text-center text-[13.5px] font-semibold tabular-nums outline-none focus:border-[#ee2e65]"
                                />
                                <span className="text-[12.5px] font-semibold text-[#6E717A]">%</span>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleDeleteCriterion(param.id)}
                                aria-label={`Hapus kriteria ${param.label}`}
                                className="w-10 h-10 rounded-full border border-black/[0.08] bg-white hover:bg-[#FFECEB] hover:border-[#942922]/25 text-[#6E717A] hover:text-[#942922] inline-flex items-center justify-center shrink-0 cursor-pointer transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <input
                            type="text"
                            value={param.description}
                            onChange={(e) =>
                              handleUpdateCriterion(param.id, { description: e.target.value })
                            }
                            placeholder="Deskripsi / indikator yang dinilai pada kriteria ini..."
                            aria-label="Deskripsi kriteria penilaian"
                            className="w-full h-9 rounded-xl border border-black/[0.08] bg-[#FAFBFD] px-3.5 text-[12.5px] text-[#5A5D67] outline-none focus:border-[#ee2e65] focus:bg-white"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => handleAddCriterion()}
                        className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-full bg-white border border-black/[0.1] hover:bg-[#FEF1F5] hover:border-[#ee2e65]/40 text-[13px] font-semibold text-[#1C1D21] cursor-pointer transition-colors"
                      >
                        <Plus className="w-4 h-4 shrink-0" />
                        <span>Add criteria</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-black/[0.06]">
                    <button
                      type="button"
                      onClick={() => setActiveStep('position_segment')}
                      className={ACTION_BTN_SECONDARY}
                    >
                      <ArrowLeft className="w-4 h-4 shrink-0" />
                      <span>Kembali ke Position &amp; Segment</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveStep3}
                      className={ACTION_BTN_PRIMARY}
                    >
                      <Save className="w-4 h-4 shrink-0" />
                      <span>Simpan Konfigurasi Penilaian</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
