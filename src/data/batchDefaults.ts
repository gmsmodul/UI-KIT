import {
  AttendanceGraduationRule,
  BatchDatabaseStore,
  BatchDataset,
  BatchRecord,
  ClassAttendanceData,
  ExamGradeBand,
  ExamGradingRule,
  StudentDirectoryItem,
} from '../types';
import {
  INITIAL_EXAMS,
  INITIAL_ASSIGNMENTS,
  INITIAL_LESSON_PLANS,
  WEEKLY_SCHEDULE_DATA,
  INITIAL_STUDENTS_DIRECTORY,
  INITIAL_TRAINERS_DIRECTORY,
  INITIAL_MESSAGES_THREADS,
  INITIAL_REPORTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_MATERIALS,
  STUDENTS_DATA,
} from './mockData';
import { INITIAL_LIVE_QUIZZES, INITIAL_LIVE_QUIZ_REPORTS } from './liveQuizSeed';
import {
  cloneDefaultAssessmentScales,
  cloneDefaultExamPositions,
  cloneDefaultExamSegments,
} from './examPositions';

export const DEFAULT_GRADUATION_RULE: AttendanceGraduationRule = {
  minAttendanceRatePct: 85,
  maxUnexcusedAbsences: 3,
  maxLateCount: 5,
  lateWeightPct: 100,
  excusePolicy: 'present',
  requireExamPass: true,
  notes:
    'Peserta wajib memenuhi batas minimal kehadiran dan tidak melebihi batas alfa tanpa keterangan untuk dinyatakan lulus.',
};

export const DEFAULT_GRADE_BANDS: ExamGradeBand[] = [
  { id: 'band-a', grade: 'A', minScore: 90, label: 'Sangat Baik', passed: true },
  { id: 'band-b', grade: 'B', minScore: 80, label: 'Baik', passed: true },
  { id: 'band-c', grade: 'C', minScore: 75, label: 'Cukup (Lulus)', passed: true },
  { id: 'band-d', grade: 'D', minScore: 60, label: 'Perlu Remedial', passed: false },
  { id: 'band-e', grade: 'E', minScore: 0, label: 'Tidak Lulus', passed: false },
];

export const DEFAULT_EXAM_GRADING_RULE: ExamGradingRule = {
  passingScore: 75,
  scaleMax: 100,
  roundingMode: 'nearest',
  weights: {
    writtenExamPct: 40,
    practicalExamPct: 35,
    assignmentPct: 15,
    attendanceBonusPct: 10,
  },
  allowRemedial: true,
  maxRemedialAttempts: 2,
  remedialCapScore: 80,
  gradeBands: DEFAULT_GRADE_BANDS,
  assessmentScales: cloneDefaultAssessmentScales(),
  positionTemplates: cloneDefaultExamPositions(),
  segments: cloneDefaultExamSegments(),
};

export function normalizeExamGradingRule(
  incoming?: Partial<ExamGradingRule> | null
): ExamGradingRule {
  return {
    ...DEFAULT_EXAM_GRADING_RULE,
    ...(incoming || {}),
    weights: {
      ...DEFAULT_EXAM_GRADING_RULE.weights,
      ...(incoming?.weights || {}),
    },
    gradeBands:
      Array.isArray(incoming?.gradeBands) && incoming.gradeBands.length > 0
        ? incoming.gradeBands.map((b) => ({ ...b }))
        : DEFAULT_EXAM_GRADING_RULE.gradeBands.map((b) => ({ ...b })),
    assessmentScales:
      Array.isArray(incoming?.assessmentScales) && incoming.assessmentScales.length > 0
        ? incoming.assessmentScales.map((s) => ({
            ...s,
            options: Array.isArray(s.options) ? s.options.map((o) => ({ ...o })) : [],
          }))
        : cloneDefaultAssessmentScales(),
    positionTemplates:
      Array.isArray(incoming?.positionTemplates) && incoming.positionTemplates.length > 0
        ? incoming.positionTemplates.map((p) => ({
            ...p,
            parameters: Array.isArray(p.parameters)
              ? p.parameters.map((param) => ({ ...param }))
              : [],
          }))
        : cloneDefaultExamPositions(),
    segments: Array.isArray(incoming?.segments)
      ? incoming.segments.map((seg) => ({ ...seg }))
      : cloneDefaultExamSegments(),
  };
}

export function createSeedBatchDataset(): BatchDataset {
  return {
    exams: INITIAL_EXAMS,
    examAssessments: [],
    assignments: INITIAL_ASSIGNMENTS,
    lessonPlans: INITIAL_LESSON_PLANS,
    schedules: WEEKLY_SCHEDULE_DATA,
    students: INITIAL_STUDENTS_DIRECTORY,
    trainers: INITIAL_TRAINERS_DIRECTORY,
    messages: INITIAL_MESSAGES_THREADS,
    reports: INITIAL_REPORTS,
    notifications: INITIAL_NOTIFICATIONS,
    materials: INITIAL_MATERIALS,
    liveQuizzes: INITIAL_LIVE_QUIZZES,
    liveQuizReports: INITIAL_LIVE_QUIZ_REPORTS,
    attendanceByClass: STUDENTS_DATA,
    qrCheckIns: [],
  };
}

export function createEmptyBatchDataset(): BatchDataset {
  return {
    exams: [],
    examAssessments: [],
    assignments: [],
    lessonPlans: [],
    schedules: [],
    students: [],
    trainers: [],
    messages: [],
    reports: [],
    notifications: [],
    materials: [],
    liveQuizzes: [],
    liveQuizReports: [],
    attendanceByClass: {
      'Class 302': { attendance: [], absences: [], excuse: [] },
    },
    qrCheckIns: [],
  };
}

export function createDefaultBatchStore(): BatchDatabaseStore {
  const now = new Date().toISOString();
  const initialBatch: BatchRecord = {
    id: 'batch-2026-1',
    batchName: 'Batch 1',
    year: 2026,
    gmsAsal: 'GMS Pusat',
    programEvent: 'Servolution Academy',
    createdAt: now,
    updatedAt: now,
    graduationRule: { ...DEFAULT_GRADUATION_RULE },
    examGradingRule: normalizeExamGradingRule(DEFAULT_EXAM_GRADING_RULE),
    data: createSeedBatchDataset(),
  };

  return {
    activeBatchId: initialBatch.id,
    batches: [initialBatch],
  };
}

export function resolveGradeBand(score: number, examRule: ExamGradingRule): ExamGradeBand {
  const sorted = [...examRule.gradeBands].sort((a, b) => b.minScore - a.minScore);
  const matched = sorted.find((band) => score >= band.minScore);
  return (
    matched ||
    sorted[sorted.length - 1] || {
      id: 'band-fallback',
      grade: score >= examRule.passingScore ? 'C' : 'E',
      minScore: 0,
      label: score >= examRule.passingScore ? 'Lulus' : 'Tidak Lulus',
      passed: score >= examRule.passingScore,
    }
  );
}

export function applyScoreRounding(value: number, mode: ExamGradingRule['roundingMode']): number {
  if (mode === 'floor') return Math.floor(value);
  if (mode === 'ceil') return Math.ceil(value);
  return Math.round(value);
}

export interface StudentBatchEvaluation {
  studentId: string;
  name: string;
  initials: string;
  color: string;
  effectiveAttendanceRate: number;
  unexcusedAbsences: number;
  lateCount: number;
  excuseCount: number;
  examScore: number;
  gradeBand: ExamGradeBand;
  attendanceEligible: boolean;
  examPassed: boolean;
  overallPassed: boolean;
  reasons: string[];
}

export function evaluateStudentBatchEligibility(
  student: StudentDirectoryItem,
  attendanceByClass: Record<string, ClassAttendanceData>,
  graduationRule: AttendanceGraduationRule,
  examGradingRule: ExamGradingRule
): StudentBatchEvaluation {
  const normalizedName = student.name.trim().toLowerCase();
  let unexcusedAbsences = 0;
  let lateCount = 0;
  let excuseCount = 0;
  let presentCount = 0;

  Object.values(attendanceByClass).forEach((bucket) => {
    (bucket.attendance || []).forEach((rec) => {
      if (rec.name.trim().toLowerCase() === normalizedName) {
        if (rec.attendanceStatus === 'Late') {
          lateCount += 1;
        } else {
          presentCount += 1;
        }
      }
    });
    (bucket.absences || []).forEach((rec) => {
      if (rec.name.trim().toLowerCase() === normalizedName) {
        unexcusedAbsences += 1;
      }
    });
    (bucket.excuse || []).forEach((rec) => {
      if (rec.name.trim().toLowerCase() === normalizedName) {
        excuseCount += 1;
      }
    });
  });

  // Start from student's historical rate and adjust proportionally if excuse/late rules tighten
  let effectiveAttendanceRate = student.rate;
  const totalTrackedSessions = presentCount + lateCount + unexcusedAbsences + excuseCount;
  if (totalTrackedSessions > 0) {
    const latePenalty = lateCount * (1 - graduationRule.lateWeightPct / 100);
    const excusePenalty =
      graduationRule.excusePolicy === 'absent' ? excuseCount : 0;
    const penaltyPct = ((latePenalty + excusePenalty) / Math.max(10, totalTrackedSessions * 4)) * 100;
    effectiveAttendanceRate = Math.max(0, Math.min(100, Math.round(student.rate - penaltyPct)));
  }

  const examScore = applyScoreRounding(student.score, examGradingRule.roundingMode);
  const gradeBand = resolveGradeBand(examScore, examGradingRule);
  const examPassed = examScore >= examGradingRule.passingScore && gradeBand.passed;

  const reasons: string[] = [];
  if (effectiveAttendanceRate < graduationRule.minAttendanceRatePct) {
    reasons.push(`Kehadiran ${effectiveAttendanceRate}% < ${graduationRule.minAttendanceRatePct}%`);
  }
  if (unexcusedAbsences > graduationRule.maxUnexcusedAbsences) {
    reasons.push(`Absent ${unexcusedAbsences} > maks ${graduationRule.maxUnexcusedAbsences}`);
  }
  if (lateCount > graduationRule.maxLateCount) {
    reasons.push(`Late ${lateCount} > maks ${graduationRule.maxLateCount}`);
  }

  const attendanceEligible = reasons.length === 0;
  if (graduationRule.requireExamPass && !examPassed) {
    reasons.push(`Nilai Exams ${examScore} < KKM ${examGradingRule.passingScore}`);
  }

  const overallPassed =
    attendanceEligible && (!graduationRule.requireExamPass || examPassed);

  return {
    studentId: student.id,
    name: student.name,
    initials: student.initials,
    color: student.color,
    effectiveAttendanceRate,
    unexcusedAbsences,
    lateCount,
    excuseCount,
    examScore,
    gradeBand,
    attendanceEligible,
    examPassed,
    overallPassed,
    reasons,
  };
}
