import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  PageId,
  ToastItem,
  Exam,
  ExamAssessmentRecord,
  Assignment,
  LessonPlan,
  ScheduleItem,
  StudentDirectoryItem,
  TrainerDirectoryItem,
  MessageThread,
  ReportItem,
  NotificationItem,
  ClassMaterial,
  LiveQuiz,
  LiveQuizSessionReport,
  ClassAttendanceData,
  StudentAttendanceRecord,
  QrAttendanceCheckInRecord,
  AttendanceGraduationRule,
  ExamGradingRule,
  BatchRecord,
  BatchDataset,
  PastelThemeKey,
} from '../types';
import { apiService } from '../services/api';
import { resolveClassKeyForSubject, resolveSubjectForClassKey } from '../utils/scheduleSubjects';
import { getCrewForMaterial, getMaterialCrewSummary } from '../utils/materialCrewProgress';
import { playUiMotionSound } from '../utils/uiMotionSound';
import {
  flushOfflineQueue,
  getOfflineQueueCount,
  subscribeOfflineQueue,
} from '../utils/offlineSyncQueue';
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
} from '../data/mockData';
import { INITIAL_LIVE_QUIZZES, INITIAL_LIVE_QUIZ_REPORTS } from '../data/liveQuizSeed';
import { UI_KIT_CATALOG } from '../components/uikit/uiKitCatalog';
import {
  DEFAULT_EXAM_GRADING_RULE,
  DEFAULT_GRADUATION_RULE,
  createDefaultBatchStore,
  createEmptyBatchDataset,
  createSeedBatchDataset,
  normalizeExamGradingRule,
} from '../data/batchDefaults';

export interface UiKitUpdateItem {
  id: string;
  title: string;
  desc: string;
  time: string;
  unread: boolean;
  theme: PastelThemeKey;
  groupId: string;
  itemLabel: string;
  sectionId?: string;
}

const INITIAL_UI_UPDATES: UiKitUpdateItem[] = [
  {
    id: 'UI-UPD-OPT',
    title: 'App Optimization (Optimistic UI, Skeletons, Preload & Offline Queue)',
    desc: 'Code-split lazy chunks + shimmer skeletons, cache-first navigation & batch hydration, tactile scale(0.97) press physics, and offline mutation replay queue.',
    time: 'Just now',
    unread: true,
    theme: 'periwinkle',
    groupId: 'behavioral',
    itemLabel: 'App Optimization',
    sectionId: 'opt-optimistic',
  },
  {
    id: 'UI-UPD-375',
    title: 'Mobile 375px Fixes (Tables→Cards, 16px, 44px, Safe-Area)',
    desc: 'Table-to-Card below 640px, single-line KPI .kpi-value clamp, 16px anti-zoom inputs + numeric keyboards, 44px touch targets (pointer: coarse), and safe-area bottom clearance.',
    time: 'Just now',
    unread: true,
    theme: 'mint',
    groupId: 'mobilekit',
    itemLabel: 'Mobile 375px Fixes',
    sectionId: 'm375-tables',
  },
  {
    id: 'UI-UPD-MUX',
    title: '6 Menu UX Rules (Type to Filter, Typed Dates, Reasons Not Grey)',
    desc: 'Auto-search >10 rows, typed dates + month/year jump, stay-open multi-select with Done CTA, collision-aware flip-up, inline blockers & inline controls <5 options.',
    time: 'Just now',
    unread: true,
    theme: 'periwinkle',
    groupId: 'dataentry',
    itemLabel: 'Menu UX Rules',
    sectionId: 'mux-type-filter',
  },
  {
    id: 'UI-UPD-KGT',
    title: 'Kanban Board, Gantt Chart & Timeline',
    desc: 'Interactive drag-and-drop Kanban columns, 14-day sprint Gantt chart, and chronological activity/milestone timelines.',
    time: 'Just now',
    unread: true,
    theme: 'coral',
    groupId: 'datadisplay',
    itemLabel: 'Kanban Board',
    sectionId: 'knb-interactive',
  },
  {
    id: 'UI-UPD-00',
    title: 'Motion & Animations Showcase',
    desc: 'Interactive preview for CSS easing curves, stagger cascades, drawers, springs & reduced-motion rules.',
    time: 'Just now',
    unread: true,
    theme: 'periwinkle',
    groupId: 'behavioral',
    itemLabel: 'Motion & Animations',
    sectionId: 'mot-easing',
  },
  {
    id: 'UI-UPD-01',
    title: 'Primary Rose (#ee2e65) Action Pills',
    desc: 'Standardized primary CTAs & responsive mobile 1-word pill controls unified in Data Entry.',
    time: '5m ago',
    unread: true,
    theme: 'coral',
    groupId: 'dataentry',
    itemLabel: 'Buttons',
    sectionId: 'btn-action-pills',
  },
  {
    id: 'UI-UPD-02',
    title: 'Directional Widening 3-Col Carousel',
    desc: 'Clip-path column wipe expansion, swipe pagination & 14-bar segmented vertical meter.',
    time: '12m ago',
    unread: true,
    theme: 'periwinkle',
    groupId: 'datadisplay',
    itemLabel: 'Carousel',
    sectionId: 'car-widening',
  },
  {
    id: 'UI-UPD-03',
    title: 'Motion Accordion & Checklist Strip',
    desc: 'Spring height AnimatePresence accordion, pastel KPI metric strip & inline checklist card.',
    time: '1h ago',
    unread: true,
    theme: 'mint',
    groupId: 'datadisplay',
    itemLabel: 'Accordion',
    sectionId: 'acc-motion',
  },
  {
    id: 'UI-UPD-04',
    title: 'Mobile Hairline List & PageTransition',
    desc: 'Responsive mobile hairline divider list vs desktop table & directional PageTransition physics.',
    time: '3h ago',
    unread: false,
    theme: 'peach',
    groupId: 'mobilekit',
    itemLabel: 'Mobile Compact Buttons',
    sectionId: 'mlt-hairline-table',
  },
];

export function normalizeAttendanceClassKey(rawClassCode: string): string {
  const trimmed = String(rawClassCode || '').trim();
  if (!trimmed) return 'Class 302';
  if (trimmed.toLowerCase() === 'all' || trimmed.toLowerCase() === 'all classes') {
    return 'All Classes';
  }
  if (/^class\s+/i.test(trimmed)) {
    return `Class ${trimmed.replace(/^class\s+/i, '').trim()}`;
  }
  return `Class ${trimmed}`;
}

interface AppContextType {
  activePage: PageId;
  prevPage: PageId;
  setActivePage: (page: PageId) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;

  toasts: ToastItem[];
  triggerToast: (title: string, message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;

  // Exams & Exam Assessments
  exams: Exam[];
  setExams: React.Dispatch<React.SetStateAction<Exam[]>>;
  handleAddExam: (exam: Omit<Exam, 'id' | 'status'>) => void;
  isAddExamOpen: boolean;
  setIsAddExamOpen: (open: boolean) => void;
  examAssessments: ExamAssessmentRecord[];
  setExamAssessments: React.Dispatch<React.SetStateAction<ExamAssessmentRecord[]>>;
  handleAddExamAssessment: (record: Omit<ExamAssessmentRecord, 'id' | 'createdAt'>) => ExamAssessmentRecord;
  handleDeleteExamAssessment: (id: string) => void;

  // Assignments
  assignments: Assignment[];
  setAssignments: React.Dispatch<React.SetStateAction<Assignment[]>>;
  handleGradeSubmission: (assignmentId: string, submissionId: string, score: number) => void;
  handleCreateAssignment: (newAsg: Omit<Assignment, 'id' | 'submitted' | 'submissions'>) => void;
  isNewAssignmentOpen: boolean;
  setIsNewAssignmentOpen: (open: boolean) => void;

  // Lesson Plans
  lessonPlans: LessonPlan[];
  setLessonPlans: React.Dispatch<React.SetStateAction<LessonPlan[]>>;
  toggleChecklistItem: (planId: string, checkId: string) => void;
  handleAddChecklistTask: (planId: string, label: string) => void;
  handleCreateLessonPlan: (plan: Omit<LessonPlan, 'id' | 'status' | 'progress' | 'materials' | 'checklist'>) => void;
  isNewPlanModalOpen: boolean;
  setIsNewPlanModalOpen: (open: boolean) => void;

  // Schedules
  schedules: ScheduleItem[];
  setSchedules: React.Dispatch<React.SetStateAction<ScheduleItem[]>>;
  handleAddSchedule: (schedule: Omit<ScheduleItem, 'id'>) => void;
  handleUpdateScheduleTolerance: (scheduleId: string, lateToleranceMin: number) => void;
  isAddScheduleOpen: boolean;
  setIsAddScheduleOpen: (open: boolean) => void;

  // Students
  studentsDirectory: StudentDirectoryItem[];
  setStudentsDirectory: React.Dispatch<React.SetStateAction<StudentDirectoryItem[]>>;
  handleAddStudent: (st: Omit<StudentDirectoryItem, 'id' | 'status' | 'rate' | 'score' | 'color' | 'initials'>) => void;
  isAddStudentOpen: boolean;
  setIsAddStudentOpen: (open: boolean) => void;
  selectedStudentDrawer: StudentDirectoryItem | null;
  setSelectedStudentDrawer: (st: StudentDirectoryItem | null) => void;

  // Trainers
  trainersDirectory: TrainerDirectoryItem[];
  setTrainersDirectory: React.Dispatch<React.SetStateAction<TrainerDirectoryItem[]>>;
  handleAddTrainer: (tr: Omit<TrainerDirectoryItem, 'id' | 'sessionsCount' | 'rating' | 'color' | 'initials'>) => void;
  isAddTrainerOpen: boolean;
  setIsAddTrainerOpen: (open: boolean) => void;
  selectedTrainerDrawer: TrainerDirectoryItem | null;
  setSelectedTrainerDrawer: (tr: TrainerDirectoryItem | null) => void;

  // Messages
  messagesThreads: MessageThread[];
  setMessagesThreads: React.Dispatch<React.SetStateAction<MessageThread[]>>;
  selectedThreadId: string;
  setSelectedThreadId: (id: string) => void;
  handleSelectThread: (threadId: string) => void;
  handleSendMessageReply: (threadId: string, text: string) => void;
  handleComposeNewMessage: (recipient: string, subject: string, body: string) => void;
  isComposeMessageOpen: boolean;
  setIsComposeMessageOpen: (open: boolean) => void;
  unreadMessagesCount: number;

  // Reports
  reportsList: ReportItem[];
  setReportsList: React.Dispatch<React.SetStateAction<ReportItem[]>>;
  handleGenerateReport: (rep: Omit<ReportItem, 'id' | 'generatedDate' | 'status' | 'metrics' | 'summary'>) => void;
  handleDownloadReportCsv: (report: ReportItem) => void;
  isGenerateReportOpen: boolean;
  setIsGenerateReportOpen: (open: boolean) => void;

  // Class Materials
  materialsList: ClassMaterial[];
  setMaterialsList: React.Dispatch<React.SetStateAction<ClassMaterial[]>>;
  selectedMaterial: ClassMaterial | null;
  setSelectedMaterial: (mat: ClassMaterial | null) => void;
  activeVideoPlayer: ClassMaterial | null;
  setActiveVideoPlayer: (mat: ClassMaterial | null) => void;
  isUploadMaterialOpen: boolean;
  setIsUploadMaterialOpen: (open: boolean) => void;
  handleUploadMaterial: (mat: Omit<ClassMaterial, 'id' | 'uploadedAt' | 'downloadCount'>) => void;
  handleDeleteMaterial: (id: string) => void;
  handleDownloadMaterial: (mat: ClassMaterial) => void;
  handleUpdateVideoProgress: (materialId: string, watchProgress: number, isWatchedCompleted: boolean, watchedSeconds?: number) => void;
  handleUpdateMaterialProgress: (materialId: string, progress: number, isCompleted: boolean) => void;
  handleUpdateCrewMaterialProgress: (materialId: string, studentId: string, progress: number, isCompleted: boolean) => void;
  handleBulkUpdateCrewMaterialProgress: (materialId: string, studentIds: string[], progress: number, isCompleted: boolean) => void;

  // Notifications
  notifications: NotificationItem[];
  setNotifications: React.Dispatch<React.SetStateAction<NotificationItem[]>>;
  handleMarkAllRead: () => void;
  handleNotificationClick: (notif: NotificationItem) => void;
  unreadNotifCount: number;

  // LiveQuiz
  liveQuizzes: LiveQuiz[];
  setLiveQuizzes: React.Dispatch<React.SetStateAction<LiveQuiz[]>>;
  liveQuizReports: LiveQuizSessionReport[];
  handleSaveLiveQuiz: (quiz: LiveQuiz) => void;
  handleDeleteLiveQuiz: (quizId: string) => void;
  handleDuplicateLiveQuiz: (quiz: LiveQuiz) => LiveQuiz;
  handleAddLiveQuizReport: (report: LiveQuizSessionReport) => void;
  handleExportLiveQuizReportCsv: (report: LiveQuizSessionReport) => void;
  initialLiveQuizCode: string;
  setInitialLiveQuizCode: React.Dispatch<React.SetStateAction<string>>;
  pendingLiveQuizJoin: { code: string; name: string } | null;
  setPendingLiveQuizJoin: React.Dispatch<React.SetStateAction<{ code: string; name: string } | null>>;

  // Attendance & QR Check-in
  attendanceByClass: Record<string, ClassAttendanceData>;
  setAttendanceByClass: React.Dispatch<React.SetStateAction<Record<string, ClassAttendanceData>>>;
  selectedAttendanceClass: string;
  setSelectedAttendanceClass: React.Dispatch<React.SetStateAction<string>>;
  selectedAttendanceSubject: string;
  setSelectedAttendanceSubject: (subject: string) => void;
  qrCheckIns: QrAttendanceCheckInRecord[];
  activeQrCheckInSessionId: string | null;
  setActiveQrCheckInSessionId: React.Dispatch<React.SetStateAction<string | null>>;
  activeQrScanKey: string;
  setActiveQrScanKey: React.Dispatch<React.SetStateAction<string>>;
  isCrewQrScannerOpen: boolean;
  setIsCrewQrScannerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  applyQrCheckInToAttendance: (record: QrAttendanceCheckInRecord) => void;

  // UI Kit & Interactive Preview States
  isBottomSheetDemoOpen: boolean;
  setIsBottomSheetDemoOpen: (open: boolean) => void;
  activeDemoModal: string | null;
  setActiveDemoModal: (type: string | null) => void;
  activeDrawerSpec: { dir: 'left' | 'right' | 'top' | 'bottom'; type: string } | null;
  setActiveDrawerSpec: (spec: { dir: 'left' | 'right' | 'top' | 'bottom'; type: string } | null) => void;
  uiSweetAlertType: 'success' | 'confirm' | null;
  setUiSweetAlertType: (type: 'success' | 'confirm' | null) => void;
  uiSessionModal: boolean;
  setUiSessionModal: (open: boolean) => void;

  // Unified UI KIT Navigation & Updates State
  uiCategory: string;
  prevUiCategory: string;
  uiSubJump: string;
  prevUiSubJump: string;
  uiTargetSectionId: string | null;
  selectUiNode: (groupId: string, subLabel?: string, sectionId?: string) => void;
  clearUiTargetSection: () => void;
  uiSearchFocusSeq: number;
  triggerUiSearchFocus: () => void;
  isUiMobileSearchOpen: boolean;
  setIsUiMobileSearchOpen: (open: boolean) => void;
  uiUpdates: UiKitUpdateItem[];
  unreadUiUpdatesCount: number;
  markAllUiUpdatesRead: () => void;
  handleUiUpdateClick: (item: UiKitUpdateItem) => void;

  // Unified Batch & Year Database + Rules
  batches: BatchRecord[];
  activeBatchId: string;
  activeBatch: BatchRecord;
  graduationRule: AttendanceGraduationRule;
  examGradingRule: ExamGradingRule;
  lastBatchSavedAt: string;
  switchActiveBatch: (batchId: string) => void;
  createBatch: (params: {
    batchName: string;
    year: number;
    gmsAsal?: string;
    programEvent?: string;
    mode: 'copy_rules_schedule' | 'duplicate_all' | 'empty';
  }) => void;
  deleteBatch: (batchId: string) => void;
  updateBatchRules: (
    nextGraduationRule: AttendanceGraduationRule,
    nextExamGradingRule: ExamGradingRule
  ) => void;
  importBatchRecord: (incoming: BatchRecord) => void;
  saveCurrentBatchSnapshot: (showToast?: boolean) => void;

  // Network & Offline Sync Queue
  isOnline: boolean;
  pendingSyncCount: number;
  syncPendingNow: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [initialLiveQuizCode, setInitialLiveQuizCode] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams(window.location.search);
    return (params.get('code') || '').replace(/\D/g, '').slice(0, 6);
  });

  const [activeQrCheckInSessionId, setActiveQrCheckInSessionId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    const qrParam = params.get('qrSession')?.trim();
    return qrParam ? qrParam : null;
  });

  const [activeQrScanKey, setActiveQrScanKey] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams(window.location.search);
    return (params.get('k') || '').trim();
  });

  const [isCrewQrScannerOpen, setIsCrewQrScannerOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return Boolean(params.get('qrSession')?.trim());
  });

  const [pageState, setPageState] = useState<{ active: PageId; prev: PageId }>({
    active: 'uikit',
    prev: 'uikit',
  });
  const activePage = pageState.active;
  const prevPage = pageState.prev;
  const setActivePage = (nextPage: PageId) => {
    setPageState((curr) =>
      curr.active === nextPage ? curr : { active: nextPage, prev: curr.active }
    );
  };
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Unified UI KIT Navigation & Updates State (Cache-First so screen never opens empty)
  const [uiNavState, setUiNavState] = useState<{
    category: string;
    prevCategory: string;
    sub: string;
    prevSub: string;
    sectionId: string | null;
  }>(() => {
    const cached = apiService.getCachedUiNavState();
    const matchedGroup =
      (cached && UI_KIT_CATALOG.find((g) => g.id === cached.category)) || UI_KIT_CATALOG[0];
    const matchedSub =
      cached && matchedGroup.items.some((item) => item.label === cached.sub)
        ? cached.sub
        : matchedGroup.items[0]?.label || 'Grid';
    return {
      category: matchedGroup.id,
      prevCategory: matchedGroup.id,
      sub: matchedSub,
      prevSub: matchedSub,
      sectionId: null,
    };
  });
  const [uiSearchFocusSeq, setUiSearchFocusSeq] = useState(0);
  const [isUiMobileSearchOpen, setIsUiMobileSearchOpen] = useState(false);
  const [uiUpdates, setUiUpdates] = useState<UiKitUpdateItem[]>(() => {
    const readIds = new Set(apiService.getCachedReadUpdateIds());
    if (readIds.size === 0) return INITIAL_UI_UPDATES;
    return INITIAL_UI_UPDATES.map((u) => (readIds.has(u.id) ? { ...u, unread: false } : u));
  });

  const selectUiNode = useCallback((groupId: string, subLabel?: string, sectionId?: string) => {
    const group = UI_KIT_CATALOG.find((g) => g.id === groupId) || UI_KIT_CATALOG[0];
    const resolvedSub =
      subLabel && group.items.some((item) => item.label === subLabel)
        ? subLabel
        : group.items[0]?.label || 'Grid';
    playUiMotionSound('tick');
    apiService.saveCachedUiNavState({ category: group.id, sub: resolvedSub });
    setUiNavState((curr) => ({
      category: group.id,
      prevCategory: curr.category,
      sub: resolvedSub,
      prevSub: curr.sub,
      sectionId: sectionId ?? null,
    }));
  }, []);

  const clearUiTargetSection = useCallback(() => {
    setUiNavState((curr) => (curr.sectionId ? { ...curr, sectionId: null } : curr));
  }, []);

  const triggerUiSearchFocus = useCallback(() => {
    setUiSearchFocusSeq((n) => n + 1);
  }, []);

  const unreadUiUpdatesCount = useMemo(
    () => uiUpdates.filter((u) => u.unread).length,
    [uiUpdates]
  );

  const markAllUiUpdatesRead = useCallback(() => {
    setUiUpdates((prev) => {
      const next = prev.map((u) => ({ ...u, unread: false }));
      apiService.saveCachedReadUpdateIds(next.map((u) => u.id));
      return next;
    });
    triggerToast('Pembaruan Dibaca', 'Semua catatan UI KIT telah ditandai dibaca.', 'success');
  }, []);

  const handleUiUpdateClick = useCallback(
    (item: UiKitUpdateItem) => {
      setUiUpdates((prev) => {
        const next = prev.map((u) => (u.id === item.id ? { ...u, unread: false } : u));
        apiService.saveCachedReadUpdateIds(next.filter((u) => !u.unread).map((u) => u.id));
        return next;
      });
      selectUiNode(item.groupId, item.itemLabel, item.sectionId);
    },
    [selectUiNode]
  );

  // Offline status & persistent sync queue listener
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(() => getOfflineQueueCount());

  const syncPendingNow = useCallback(async () => {
    const res = await flushOfflineQueue();
    if (res.flushed > 0) {
      triggerToast(
        'Sinkronisasi Selesai',
        `${res.flushed} perubahan offline berhasil dikirim ke server.`,
        'success'
      );
    }
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeOfflineQueue(setPendingSyncCount);
    const onOnline = () => {
      setIsOnline(true);
      void syncPendingNow();
    };
    const onOffline = () => {
      setIsOnline(false);
    };
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    if (typeof navigator !== 'undefined' && navigator.onLine && getOfflineQueueCount() > 0) {
      void syncPendingNow();
    }
    return () => {
      unsubscribe();
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [syncPendingNow]);

  // Toasts
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const triggerToast = (title: string, message: string, type: 'success' | 'info' | 'warning' | 'error' = 'success') => {
    const id = Date.now() + Math.random();
    playUiMotionSound(type === 'success' ? 'success' : type === 'error' ? 'land' : 'pop');
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  // State with initial mock data
  const [exams, setExams] = useState<Exam[]>(INITIAL_EXAMS);
  const [examAssessments, setExamAssessments] = useState<ExamAssessmentRecord[]>([]);
  const [isAddExamOpen, setIsAddExamOpen] = useState(false);

  const [assignments, setAssignments] = useState<Assignment[]>(INITIAL_ASSIGNMENTS);
  const [isNewAssignmentOpen, setIsNewAssignmentOpen] = useState(false);

  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>(INITIAL_LESSON_PLANS);
  const [isNewPlanModalOpen, setIsNewPlanModalOpen] = useState(false);

  const [schedules, setSchedules] = useState<ScheduleItem[]>(WEEKLY_SCHEDULE_DATA);
  const [isAddScheduleOpen, setIsAddScheduleOpen] = useState(false);

  const [studentsDirectory, setStudentsDirectory] = useState<StudentDirectoryItem[]>(INITIAL_STUDENTS_DIRECTORY);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [selectedStudentDrawer, setSelectedStudentDrawer] = useState<StudentDirectoryItem | null>(null);

  const [trainersDirectory, setTrainersDirectory] = useState<TrainerDirectoryItem[]>(INITIAL_TRAINERS_DIRECTORY);
  const [isAddTrainerOpen, setIsAddTrainerOpen] = useState(false);
  const [selectedTrainerDrawer, setSelectedTrainerDrawer] = useState<TrainerDirectoryItem | null>(null);

  const [messagesThreads, setMessagesThreads] = useState<MessageThread[]>(INITIAL_MESSAGES_THREADS);
  const [selectedThreadId, setSelectedThreadId] = useState<string>('MSG-01');
  const [isComposeMessageOpen, setIsComposeMessageOpen] = useState(false);

  const [reportsList, setReportsList] = useState<ReportItem[]>(INITIAL_REPORTS);
  const [isGenerateReportOpen, setIsGenerateReportOpen] = useState(false);

  // Materials
  const [materialsList, setMaterialsList] = useState<ClassMaterial[]>(INITIAL_MATERIALS);
  const [selectedMaterial, setSelectedMaterial] = useState<ClassMaterial | null>(null);
  const [activeVideoPlayer, setActiveVideoPlayer] = useState<ClassMaterial | null>(null);
  const [isUploadMaterialOpen, setIsUploadMaterialOpen] = useState(false);

  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  // LiveQuiz
  const [liveQuizzes, setLiveQuizzes] = useState<LiveQuiz[]>(INITIAL_LIVE_QUIZZES);
  const [liveQuizReports, setLiveQuizReports] = useState<LiveQuizSessionReport[]>(INITIAL_LIVE_QUIZ_REPORTS);
  const [pendingLiveQuizJoin, setPendingLiveQuizJoin] = useState<{ code: string; name: string } | null>(null);

  // Attendance & QR Check-in
  const [attendanceByClass, setAttendanceByClass] = useState<Record<string, ClassAttendanceData>>(STUDENTS_DATA);
  const [selectedAttendanceClass, setSelectedAttendanceClassState] = useState<string>('Class 302');
  const [selectedAttendanceSubject, setSelectedAttendanceSubjectState] = useState<string>(
    () => WEEKLY_SCHEDULE_DATA[0]?.subject || 'Mathematics'
  );
  const schedulesRef = useRef<ScheduleItem[]>(schedules);
  useEffect(() => {
    schedulesRef.current = schedules;
  }, [schedules]);

  const setSelectedAttendanceClass: React.Dispatch<React.SetStateAction<string>> = useCallback(
    (valueOrUpdater) => {
      setSelectedAttendanceClassState((prev) => {
        const nextClass =
          typeof valueOrUpdater === 'function' ? valueOrUpdater(prev) : valueOrUpdater;
        setSelectedAttendanceSubjectState((prevSubject) => {
          const currentMapped = resolveClassKeyForSubject(prevSubject, schedulesRef.current);
          if (currentMapped === nextClass) return prevSubject;
          return resolveSubjectForClassKey(nextClass, schedulesRef.current);
        });
        return nextClass;
      });
    },
    []
  );

  const setSelectedAttendanceSubject = useCallback((subject: string) => {
    setSelectedAttendanceSubjectState(subject);
    setSelectedAttendanceClassState(resolveClassKeyForSubject(subject, schedulesRef.current));
  }, []);

  const [qrCheckIns, setQrCheckIns] = useState<QrAttendanceCheckInRecord[]>([]);
  const studentsDirRef = useRef<StudentDirectoryItem[]>(studentsDirectory);
  useEffect(() => {
    studentsDirRef.current = studentsDirectory;
  }, [studentsDirectory]);

  const applyQrCheckInToAttendance = useCallback((record: QrAttendanceCheckInRecord) => {
    setQrCheckIns((prev) => {
      if (prev.some((item) => item.id === record.id)) return prev;
      return [record, ...prev];
    });

    const classKey = normalizeAttendanceClassKey(record.classCode);
    const normalizedCrew = record.crewName.trim().toLowerCase();

    setAttendanceByClass((prev) => {
      const currentClass: ClassAttendanceData = prev[classKey] || {
        attendance: [],
        absences: [],
        excuse: [],
      };
      const currentExcuse = currentClass.excuse || [];

      const existingEntry =
        currentClass.attendance.find((s) => s.name.trim().toLowerCase() === normalizedCrew) ||
        currentClass.absences.find((s) => s.name.trim().toLowerCase() === normalizedCrew) ||
        currentExcuse.find((s) => s.name.trim().toLowerCase() === normalizedCrew);

      const dirMatch = studentsDirRef.current.find(
        (s) => s.name.trim().toLowerCase() === normalizedCrew
      );

      const updatedStudent: StudentAttendanceRecord = {
        id: existingEntry?.id || dirMatch?.id || `QR-${record.id}`,
        initials: existingEntry?.initials || dirMatch?.initials || record.initials,
        name: existingEntry?.name || dirMatch?.name || record.crewName,
        email:
          existingEntry?.email ||
          dirMatch?.email ||
          `${record.crewName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '.')}@uikit.design`,
        rate: existingEntry?.rate || dirMatch?.rate || (record.status === 'On Time' ? 98 : 88),
        score: existingEntry?.score || dirMatch?.score || 90,
        color:
          existingEntry?.color ||
          dirMatch?.color ||
          (record.status === 'On Time'
            ? 'bg-[#C4F0DC] text-[#146C43]'
            : 'bg-[#FDE0E9] text-[#9D113C]'),
        checkInTime: record.checkInTime,
        attendanceStatus: record.status,
        checkedInVia: 'QR',
        scheduleSubject: record.subject,
      };

      const cleanAttendance = currentClass.attendance.filter(
        (s) => s.name.trim().toLowerCase() !== normalizedCrew
      );
      const cleanAbsences = currentClass.absences.filter(
        (s) => s.name.trim().toLowerCase() !== normalizedCrew
      );
      const cleanExcuse = currentExcuse.filter(
        (s) => s.name.trim().toLowerCase() !== normalizedCrew
      );

      return {
        ...prev,
        [classKey]: {
          attendance: [updatedStudent, ...cleanAttendance],
          absences: cleanAbsences,
          excuse: cleanExcuse,
        },
      };
    });
  }, []);

  // UI Kit interactive modals
  const [isBottomSheetDemoOpen, setIsBottomSheetDemoOpen] = useState(false);
  const [activeDemoModal, setActiveDemoModal] = useState<string | null>(null);
  const [activeDrawerSpec, setActiveDrawerSpec] = useState<{ dir: 'left' | 'right' | 'top' | 'bottom'; type: string } | null>(null);
  const [uiSweetAlertType, setUiSweetAlertType] = useState<'success' | 'confirm' | null>(null);
  const [uiSessionModal, setUiSessionModal] = useState(false);

  // Unified Batch & Year Database State (Cache-First hydration at frame 0)
  const initialCachedStoreRef = useRef(apiService.getCachedBatchDatabaseStore());
  const [batches, setBatches] = useState<BatchRecord[]>(initialCachedStoreRef.current.batches);
  const [activeBatchId, setActiveBatchId] = useState<string>(
    initialCachedStoreRef.current.activeBatchId
  );
  const [graduationRule, setGraduationRule] = useState<AttendanceGraduationRule>(() => {
    const target =
      initialCachedStoreRef.current.batches.find(
        (b) => b.id === initialCachedStoreRef.current.activeBatchId
      ) || initialCachedStoreRef.current.batches[0];
    return target?.graduationRule
      ? { ...DEFAULT_GRADUATION_RULE, ...target.graduationRule }
      : { ...DEFAULT_GRADUATION_RULE };
  });
  const [examGradingRule, setExamGradingRule] = useState<ExamGradingRule>(() => {
    const target =
      initialCachedStoreRef.current.batches.find(
        (b) => b.id === initialCachedStoreRef.current.activeBatchId
      ) || initialCachedStoreRef.current.batches[0];
    return normalizeExamGradingRule(target?.examGradingRule);
  });
  const [lastBatchSavedAt, setLastBatchSavedAt] = useState<string>(
    initialCachedStoreRef.current.batches[0]?.updatedAt || new Date().toISOString()
  );
  const batchHydratedRef = useRef(false);

  const activeBatch = useMemo(
    () =>
      batches.find((b) => b.id === activeBatchId) ||
      batches[0] ||
      initialCachedStoreRef.current.batches[0],
    [batches, activeBatchId]
  );

  const hydrateFromBatch = useCallback((batch: BatchRecord) => {
    const data = batch.data || createSeedBatchDataset();
    setExams(Array.isArray(data.exams) ? data.exams : []);
    setExamAssessments(Array.isArray(data.examAssessments) ? data.examAssessments : []);
    setAssignments(Array.isArray(data.assignments) ? data.assignments : []);
    setLessonPlans(Array.isArray(data.lessonPlans) ? data.lessonPlans : []);
    const nextSchedules = Array.isArray(data.schedules) ? data.schedules : [];
    setSchedules(nextSchedules);
    setStudentsDirectory(Array.isArray(data.students) ? data.students : []);
    setTrainersDirectory(Array.isArray(data.trainers) ? data.trainers : []);
    setMessagesThreads(Array.isArray(data.messages) ? data.messages : []);
    setReportsList(Array.isArray(data.reports) ? data.reports : []);
    setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
    setMaterialsList(Array.isArray(data.materials) ? data.materials : []);
    setLiveQuizzes(Array.isArray(data.liveQuizzes) ? data.liveQuizzes : []);
    setLiveQuizReports(Array.isArray(data.liveQuizReports) ? data.liveQuizReports : []);
    setAttendanceByClass(data.attendanceByClass || { 'Class 302': { attendance: [], absences: [], excuse: [] } });
    setQrCheckIns(Array.isArray(data.qrCheckIns) ? data.qrCheckIns : []);
    setGraduationRule(
      batch.graduationRule
        ? { ...DEFAULT_GRADUATION_RULE, ...batch.graduationRule }
        : { ...DEFAULT_GRADUATION_RULE }
    );
    setExamGradingRule(normalizeExamGradingRule(batch.examGradingRule));
    if (nextSchedules[0]) {
      setSelectedAttendanceClassState(normalizeAttendanceClassKey(nextSchedules[0].classCode));
      if (nextSchedules[0].subject) {
        setSelectedAttendanceSubjectState(nextSchedules[0].subject);
      }
    }
    setLastBatchSavedAt(batch.updatedAt || new Date().toISOString());
  }, []);

  const buildCurrentDataset = useCallback((): BatchDataset => {
    return {
      exams,
      examAssessments,
      assignments,
      lessonPlans,
      schedules,
      students: studentsDirectory,
      trainers: trainersDirectory,
      messages: messagesThreads,
      reports: reportsList,
      notifications,
      materials: materialsList,
      liveQuizzes,
      liveQuizReports,
      attendanceByClass,
      qrCheckIns,
    };
  }, [
    exams,
    examAssessments,
    assignments,
    lessonPlans,
    schedules,
    studentsDirectory,
    trainersDirectory,
    messagesThreads,
    reportsList,
    notifications,
    materialsList,
    liveQuizzes,
    liveQuizReports,
    attendanceByClass,
    qrCheckIns,
  ]);

  // Initial load from unified Batch Database (with live QR check-in sync)
  useEffect(() => {
    let cancelled = false;
    apiService.getBatchDatabaseStore().then((store) => {
      if (cancelled) return;
      const target =
        store.batches.find((b) => b.id === store.activeBatchId) || store.batches[0];
      setBatches(store.batches);
      if (target) {
        setActiveBatchId(target.id);
        hydrateFromBatch(target);
      }
      batchHydratedRef.current = true;

      apiService.getQrCheckIns().then((serverCheckIns) => {
        if (cancelled) return;
        if (serverCheckIns.length > 0) {
          setQrCheckIns(serverCheckIns);
          [...serverCheckIns].reverse().forEach((rec) => {
            applyQrCheckInToAttendance(rec);
          });
        }
      });
    });

    return () => {
      cancelled = true;
    };
  }, [applyQrCheckInToAttendance, hydrateFromBatch]);

  // Real-time WebSocket subscription for QR Attendance check-ins
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let closedByEffect = false;

    const connect = () => {
      if (closedByEffect) return;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg?.type === 'attendance:checkin' && msg.payload) {
            const record = msg.payload as QrAttendanceCheckInRecord;
            applyQrCheckInToAttendance(record);
            triggerToast(
              record.status === 'On Time' ? 'Absensi QR: On Time' : 'Absensi QR: Late',
              `${record.crewName} (${normalizeAttendanceClassKey(record.classCode)}) · ${record.checkInTime}`,
              record.status === 'On Time' ? 'success' : 'warning'
            );
          }
        } catch {
          // ignore malformed messages
        }
      };
      ws.onclose = () => {
        if (!closedByEffect) {
          reconnectTimer = setTimeout(connect, 2500);
        }
      };
    };

    connect();

    return () => {
      closedByEffect = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) ws.close();
    };
  }, [applyQrCheckInToAttendance]);

  // Mirror legacy localStorage slices cleanly
  useEffect(() => { apiService.saveExams(exams); }, [exams]);
  useEffect(() => { apiService.saveExamAssessments(examAssessments); }, [examAssessments]);
  useEffect(() => { apiService.saveAssignments(assignments); }, [assignments]);
  useEffect(() => { apiService.saveLessonPlans(lessonPlans); }, [lessonPlans]);
  useEffect(() => { apiService.saveSchedules(schedules); }, [schedules]);
  useEffect(() => { apiService.saveStudents(studentsDirectory); }, [studentsDirectory]);
  useEffect(() => { apiService.saveTrainers(trainersDirectory); }, [trainersDirectory]);
  useEffect(() => { apiService.saveMessages(messagesThreads); }, [messagesThreads]);
  useEffect(() => { apiService.saveReports(reportsList); }, [reportsList]);
  useEffect(() => { apiService.saveMaterials(materialsList); }, [materialsList]);
  useEffect(() => { apiService.saveNotifications(notifications); }, [notifications]);
  useEffect(() => { apiService.saveLiveQuizzes(liveQuizzes); }, [liveQuizzes]);
  useEffect(() => { apiService.saveLiveQuizReports(liveQuizReports); }, [liveQuizReports]);
  useEffect(() => { apiService.saveAttendanceByClass(attendanceByClass); }, [attendanceByClass]);

  // Debounced auto-save so all operational data & rules stay unified inside the active BatchRecord
  useEffect(() => {
    if (!batchHydratedRef.current) return;
    const timer = window.setTimeout(() => {
      const now = new Date().toISOString();
      const dataset = buildCurrentDataset();
      setBatches((prev) => {
        let updatedTarget: BatchRecord | null = null;
        const nextBatches = prev.map((b) => {
          if (b.id !== activeBatchId) return b;
          updatedTarget = {
            ...b,
            updatedAt: now,
            graduationRule,
            examGradingRule,
            data: dataset,
          };
          return updatedTarget;
        });
        if (updatedTarget) {
          apiService.saveBatchRecord(updatedTarget, {
            activeBatchId,
            batches: nextBatches,
          });
        }
        return nextBatches;
      });
      setLastBatchSavedAt(now);
    }, 450);

    return () => window.clearTimeout(timer);
  }, [activeBatchId, buildCurrentDataset, graduationRule, examGradingRule]);

  const saveCurrentBatchSnapshot = useCallback(
    (showToast = true) => {
      const now = new Date().toISOString();
      const dataset = buildCurrentDataset();
      let savedRecord: BatchRecord | null = null;
      const nextBatches = batches.map((b) => {
        if (b.id !== activeBatchId) return b;
        savedRecord = {
          ...b,
          updatedAt: now,
          graduationRule,
          examGradingRule,
          data: dataset,
        };
        return savedRecord;
      });
      setBatches(nextBatches);
      setLastBatchSavedAt(now);
      if (savedRecord) {
        apiService.saveBatchRecord(savedRecord, { activeBatchId, batches: nextBatches });
      }
      if (showToast && savedRecord) {
        triggerToast(
          'Database Batch Disimpan',
          `1 paket data ${(savedRecord as BatchRecord).batchName} (${(savedRecord as BatchRecord).year}) berhasil disinkronkan.`,
          'success'
        );
      }
    },
    [activeBatchId, batches, buildCurrentDataset, graduationRule, examGradingRule]
  );

  const switchActiveBatch = useCallback(
    (targetBatchId: string) => {
      if (targetBatchId === activeBatchId) return;
      const now = new Date().toISOString();
      const currentDataset = buildCurrentDataset();
      const snapshotBatches = batches.map((b) =>
        b.id === activeBatchId
          ? {
              ...b,
              updatedAt: now,
              graduationRule,
              examGradingRule,
              data: currentDataset,
            }
          : b
      );
      const target = snapshotBatches.find((b) => b.id === targetBatchId);
      if (!target) return;

      batchHydratedRef.current = false;
      setBatches(snapshotBatches);
      setActiveBatchId(target.id);
      hydrateFromBatch(target);
      apiService.saveBatchDatabaseStore({
        activeBatchId: target.id,
        batches: snapshotBatches,
      });
      window.setTimeout(() => {
        batchHydratedRef.current = true;
      }, 60);

      triggerToast(
        'Batch Aktif Diubah',
        `Menggunakan data & aturan ${target.batchName} · ${target.year}.`,
        'info'
      );
    },
    [activeBatchId, batches, buildCurrentDataset, graduationRule, examGradingRule, hydrateFromBatch]
  );

  const createBatch = useCallback(
    (params: {
      batchName: string;
      year: number;
      gmsAsal?: string;
      programEvent?: string;
      mode: 'copy_rules_schedule' | 'duplicate_all' | 'empty';
    }) => {
      const cleanName = params.batchName.trim() || `Batch ${batches.length + 1}`;
      const cleanYear = Number(params.year) || new Date().getFullYear();
      const cleanGmsAsal = (params.gmsAsal || '').trim();
      const cleanProgramEvent = (params.programEvent || '').trim();
      const now = new Date().toISOString();
      const currentDataset = buildCurrentDataset();

      const snapshotBatches = batches.map((b) =>
        b.id === activeBatchId
          ? {
              ...b,
              updatedAt: now,
              graduationRule,
              examGradingRule,
              data: currentDataset,
            }
          : b
      );

      const cloneJson = <T,>(val: T): T => JSON.parse(JSON.stringify(val));

      let nextData: BatchDataset;
      let nextGradRule: AttendanceGraduationRule;
      let nextExamRule: ExamGradingRule;

      if (params.mode === 'duplicate_all') {
        nextData = cloneJson(currentDataset);
        nextGradRule = cloneJson(graduationRule);
        nextExamRule = cloneJson(examGradingRule);
      } else if (params.mode === 'copy_rules_schedule') {
        nextData = {
          ...createEmptyBatchDataset(),
          schedules: cloneJson(currentDataset.schedules),
          lessonPlans: cloneJson(currentDataset.lessonPlans),
          trainers: cloneJson(currentDataset.trainers),
          materials: cloneJson(currentDataset.materials),
          liveQuizzes: cloneJson(currentDataset.liveQuizzes),
        };
        nextGradRule = cloneJson(graduationRule);
        nextExamRule = cloneJson(examGradingRule);
      } else {
        nextData = createEmptyBatchDataset();
        nextGradRule = cloneJson(DEFAULT_GRADUATION_RULE);
        nextExamRule = cloneJson(DEFAULT_EXAM_GRADING_RULE);
      }

      const newBatch: BatchRecord = {
        id: `batch-${cleanYear}-${Date.now()}`,
        batchName: cleanName,
        year: cleanYear,
        gmsAsal: cleanGmsAsal,
        programEvent: cleanProgramEvent,
        createdAt: now,
        updatedAt: now,
        graduationRule: nextGradRule,
        examGradingRule: nextExamRule,
        data: nextData,
      };

      const nextBatches = [newBatch, ...snapshotBatches];
      batchHydratedRef.current = false;
      setBatches(nextBatches);
      setActiveBatchId(newBatch.id);
      hydrateFromBatch(newBatch);
      apiService.saveBatchDatabaseStore({
        activeBatchId: newBatch.id,
        batches: nextBatches,
      });
      window.setTimeout(() => {
        batchHydratedRef.current = true;
      }, 60);

      triggerToast(
        'Batch Baru Dibuat',
        `${newBatch.batchName} (${newBatch.year}) siap digunakan sebagai 1 database terpadu.`,
        'success'
      );
    },
    [activeBatchId, batches, buildCurrentDataset, graduationRule, examGradingRule, hydrateFromBatch]
  );

  const deleteBatch = useCallback(
    (batchId: string) => {
      if (batches.length <= 1) {
        triggerToast('Tidak Dapat Dihapus', 'Minimal harus ada 1 batch tersimpan di database.', 'warning');
        return;
      }
      if (batchId === activeBatchId) {
        triggerToast('Batch Sedang Aktif', 'Pindahkan ke batch lain terlebih dahulu sebelum menghapus.', 'warning');
        return;
      }
      const target = batches.find((b) => b.id === batchId);
      const nextBatches = batches.filter((b) => b.id !== batchId);
      setBatches(nextBatches);
      apiService.deleteBatchOnServer(batchId, {
        activeBatchId,
        batches: nextBatches,
      });
      triggerToast(
        'Batch Dihapus',
        target ? `${target.batchName} (${target.year}) telah dihapus dari database.` : 'Batch dihapus.',
        'info'
      );
    },
    [activeBatchId, batches]
  );

  const updateBatchRules = useCallback(
    (nextGraduationRule: AttendanceGraduationRule, nextExamGradingRule: ExamGradingRule) => {
      const now = new Date().toISOString();
      const dataset = buildCurrentDataset();
      setGraduationRule(nextGraduationRule);
      setExamGradingRule(nextExamGradingRule);

      let updatedRecord: BatchRecord | null = null;
      const nextBatches = batches.map((b) => {
        if (b.id !== activeBatchId) return b;
        updatedRecord = {
          ...b,
          updatedAt: now,
          graduationRule: nextGraduationRule,
          examGradingRule: nextExamGradingRule,
          data: dataset,
        };
        return updatedRecord;
      });
      setBatches(nextBatches);
      setLastBatchSavedAt(now);
      if (updatedRecord) {
        apiService.saveBatchRecord(updatedRecord, {
          activeBatchId,
          batches: nextBatches,
        });
      }
    },
    [activeBatchId, batches, buildCurrentDataset]
  );

  const importBatchRecord = useCallback(
    (incoming: BatchRecord) => {
      const now = new Date().toISOString();
      const currentDataset = buildCurrentDataset();
      const snapshotBatches = batches.map((b) =>
        b.id === activeBatchId
          ? {
              ...b,
              updatedAt: now,
              graduationRule,
              examGradingRule,
              data: currentDataset,
            }
          : b
      );
      const uniqueId = snapshotBatches.some((b) => b.id === incoming.id)
        ? `batch-imp-${Date.now()}`
        : incoming.id || `batch-imp-${Date.now()}`;
      const normalized: BatchRecord = {
        ...incoming,
        id: uniqueId,
        batchName: incoming.batchName || `Batch Import`,
        year: Number(incoming.year) || new Date().getFullYear(),
        gmsAsal: typeof incoming.gmsAsal === 'string' ? incoming.gmsAsal.trim() : '',
        programEvent: typeof incoming.programEvent === 'string' ? incoming.programEvent.trim() : '',
        createdAt: incoming.createdAt || now,
        updatedAt: now,
        graduationRule: { ...DEFAULT_GRADUATION_RULE, ...(incoming.graduationRule || {}) },
        examGradingRule: normalizeExamGradingRule(incoming.examGradingRule),
        data: {
          ...createEmptyBatchDataset(),
          ...(incoming.data || {}),
        },
      };

      const nextBatches = [normalized, ...snapshotBatches];
      batchHydratedRef.current = false;
      setBatches(nextBatches);
      setActiveBatchId(normalized.id);
      hydrateFromBatch(normalized);
      apiService.saveBatchDatabaseStore({
        activeBatchId: normalized.id,
        batches: nextBatches,
      });
      window.setTimeout(() => {
        batchHydratedRef.current = true;
      }, 60);

      triggerToast(
        'Batch Diimpor',
        `${normalized.batchName} (${normalized.year}) berhasil dimuat dan diaktifkan.`,
        'success'
      );
    },
    [activeBatchId, batches, buildCurrentDataset, graduationRule, examGradingRule, hydrateFromBatch]
  );

  // Handler helpers
  const handleAddExam = (examData: Omit<Exam, 'id' | 'status'>) => {
    const created: Exam = {
      ...examData,
      id: Date.now(),
      status: 'Confirmed',
    };
    setExams((prev) => [...prev, created]);
    setIsAddExamOpen(false);
    triggerToast('Exam Scheduled', `${created.title} for Class ${created.classCode} added.`, 'success');
  };

  const handleAddExamAssessment = (
    record: Omit<ExamAssessmentRecord, 'id' | 'createdAt'>
  ): ExamAssessmentRecord => {
    const created: ExamAssessmentRecord = {
      ...record,
      id: `EXA-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setExamAssessments((prev) => [created, ...prev]);

    // Sync student directory score if examinee matches an enrolled student in active batch
    const targetName = record.examineeName.trim().toLowerCase();
    setStudentsDirectory((prev) =>
      prev.map((st) =>
        (record.studentId && st.id === record.studentId) ||
        st.name.trim().toLowerCase() === targetName
          ? { ...st, score: record.finalScore }
          : st
      )
    );

    triggerToast(
      'Penilaian Ujian Disimpan',
      `${created.examineeName} (${created.positionName}) · Nilai ${created.finalScore} (${created.grade})`,
      created.passed ? 'success' : 'warning'
    );
    return created;
  };

  const handleDeleteExamAssessment = (id: string) => {
    const target = examAssessments.find((a) => a.id === id);
    setExamAssessments((prev) => prev.filter((a) => a.id !== id));
    triggerToast(
      'Penilaian Dihapus',
      target ? `Penilaian ${target.examineeName} telah dihapus.` : 'Data penilaian dihapus.',
      'info'
    );
  };

  const handleGradeSubmission = (assignmentId: string, submissionId: string, score: number) => {
    setAssignments((prev) =>
      prev.map((asg) => {
        if (asg.id !== assignmentId) return asg;
        const updatedSubs = asg.submissions.map((s) =>
          s.id === submissionId ? { ...s, status: 'Graded' as const, score } : s
        );
        const anyNeedsReview = updatedSubs.some((s) => s.status === 'Needs Review');
        return {
          ...asg,
          status: !anyNeedsReview && asg.status === 'Needs Grading' ? 'Active' : asg.status,
          submissions: updatedSubs,
        };
      })
    );
    triggerToast('Grade Saved', `Score ${score}/100 recorded for student.`, 'success');
  };

  const handleCreateAssignment = (newAsg: Omit<Assignment, 'id' | 'submitted' | 'submissions'>) => {
    const created: Assignment = {
      ...newAsg,
      id: 'ASG-' + Date.now(),
      submitted: 0,
      submissions: [
        {
          id: 'SUB-' + Date.now(),
          initials: 'JW',
          name: 'James Wilson',
          time: 'Assigned just now',
          status: 'Pending',
          score: null,
          color: 'bg-[#C4F0DC] text-[#146C43]',
        },
      ],
    };
    setAssignments((prev) => [created, ...prev]);
    setIsNewAssignmentOpen(false);
    triggerToast('Assignment Published', `${created.title} assigned to ${created.classCode}.`, 'success');
  };

  const toggleChecklistItem = (planId: string, checkId: string) => {
    setLessonPlans((prev) =>
      prev.map((plan) => {
        if (plan.id !== planId) return plan;
        const updatedChecklist = plan.checklist.map((c) =>
          c.id === checkId ? { ...c, done: !c.done } : c
        );
        const doneCount = updatedChecklist.filter((c) => c.done).length;
        const newProgress = updatedChecklist.length
          ? Math.round((doneCount / updatedChecklist.length) * 100)
          : 0;
        const newStatus = newProgress === 100 ? 'Ready' : newProgress > 0 ? 'In Progress' : 'Draft';
        return { ...plan, checklist: updatedChecklist, progress: newProgress, status: newStatus as LessonPlan['status'] };
      })
    );
  };

  const handleAddChecklistTask = (planId: string, label: string) => {
    setLessonPlans((prev) =>
      prev.map((plan) => {
        if (plan.id !== planId) return plan;
        const updatedChecklist = [
          ...plan.checklist,
          { id: 'c-' + Date.now(), label, done: false },
        ];
        const doneCount = updatedChecklist.filter((c) => c.done).length;
        const newProgress = Math.round((doneCount / updatedChecklist.length) * 100);
        return {
          ...plan,
          checklist: updatedChecklist,
          progress: newProgress,
          status: newProgress === 100 ? 'Ready' : 'In Progress',
        };
      })
    );
    triggerToast('Task Added', 'Preparation checklist updated.', 'success');
  };

  const handleCreateLessonPlan = (planData: Omit<LessonPlan, 'id' | 'status' | 'progress' | 'materials' | 'checklist'>) => {
    const created: LessonPlan = {
      ...planData,
      id: 'LP-' + Date.now(),
      status: 'Draft',
      progress: 0,
      materials: [{ name: 'Syllabus_Outline.pdf', type: 'PDF', size: '620 KB' }],
      checklist: [
        { id: 't1-' + Date.now(), label: 'Prepare presentation slides', done: false },
        { id: 't2-' + Date.now(), label: 'Upload student handout', done: false },
      ],
    };
    setLessonPlans((prev) => [created, ...prev]);
    setIsNewPlanModalOpen(false);
    triggerToast('Lesson Plan Created', `${created.topic} added to Class Preparation.`, 'success');
  };

  const handleAddSchedule = (scheduleData: Omit<ScheduleItem, 'id'>) => {
    const created: ScheduleItem = {
      ...scheduleData,
      lateToleranceMin: scheduleData.lateToleranceMin ?? 5,
      id: 'SCH-' + Date.now(),
    };
    setSchedules((prev) => [...prev, created]);
    setIsAddScheduleOpen(false);
    triggerToast('Session Scheduled', `${created.subject} added on ${created.day} (${created.startHour}).`, 'success');
  };

  const handleUpdateScheduleTolerance = (scheduleId: string, lateToleranceMin: number) => {
    setSchedules((prev) =>
      prev.map((item) => (item.id === scheduleId ? { ...item, lateToleranceMin } : item))
    );
    triggerToast(
      'Batas Waktu Diperbarui',
      `Toleransi keterlambatan diatur ke +${lateToleranceMin} menit dari jam mulai kelas.`,
      'info'
    );
  };

  const handleAddStudent = (stData: Omit<StudentDirectoryItem, 'id' | 'status' | 'rate' | 'score' | 'color' | 'initials'>) => {
    const parts = stData.name.trim().split(' ');
    const initials = (parts[0]?.[0] || 'S') + (parts[1]?.[0] || parts[0]?.[1] || 'T');
    const created: StudentDirectoryItem = {
      ...stData,
      id: 'ST-' + Date.now(),
      initials: initials.toUpperCase(),
      email: stData.email || `${parts[0].toLowerCase()}@uikit.design`,
      status: 'Active',
      rate: 100,
      score: 85,
      color: 'bg-[#D6D4FF] text-[#3F3B99]',
    };
    setStudentsDirectory((prev) => [created, ...prev]);
    setIsAddStudentOpen(false);
    triggerToast('Student Enrolled', `${created.name} added to ${created.classCode}.`, 'success');
  };

  const handleAddTrainer = (trData: Omit<TrainerDirectoryItem, 'id' | 'sessionsCount' | 'rating' | 'color' | 'initials'>) => {
    const cleanName = trData.name.replace(/^(Dr\.|Prof\.|Mr\.|Ms\.|Mrs\.)\s+/i, '').trim();
    const parts = cleanName.split(/\s+/);
    const initials = (parts[0]?.[0] || 'T') + (parts[1]?.[0] || parts[0]?.[1] || 'R');
    const created: TrainerDirectoryItem = {
      ...trData,
      id: 'TRN-' + Date.now(),
      initials: initials.toUpperCase(),
      email: trData.email || `${parts[0].toLowerCase()}@uikit.design`,
      sessionsCount: 12,
      rating: 95,
      color: 'bg-[#D6D4FF] text-[#3F3B99]',
    };
    setTrainersDirectory((prev) => [created, ...prev]);
    setIsAddTrainerOpen(false);
    triggerToast('Trainer Added', `${created.name} assigned to ${created.assignedClass}.`, 'success');
  };

  const handleSelectThread = (threadId: string) => {
    setSelectedThreadId(threadId);
    setMessagesThreads((prev) =>
      prev.map((t) => (t.id === threadId ? { ...t, unread: false } : t))
    );
  };

  const handleSendMessageReply = (threadId: string, text: string) => {
    if (!text.trim()) return;
    setMessagesThreads((prev) =>
      prev.map((t) => {
        if (t.id !== threadId) return t;
        return {
          ...t,
          unread: false,
          time: 'Just now',
          messages: [
            ...t.messages,
            { id: 'm-' + Date.now(), fromMe: true, text: text.trim(), time: 'Just now' },
          ],
        };
      })
    );
    triggerToast('Message Sent', 'Your reply has been delivered.', 'success');
  };

  const handleComposeNewMessage = (recipient: string, subject: string, body: string) => {
    if (!body.trim()) return;
    const parts = recipient.split(' ');
    const initials = (parts[0]?.[0] || 'M') + (parts[1]?.[0] || 'S');
    const createdThread: MessageThread = {
      id: 'MSG-' + Date.now(),
      sender: recipient.split('(')[0].trim(),
      role: recipient,
      initials: initials.toUpperCase(),
      color: 'bg-[#D6D4FF] text-[#3F3B99]',
      time: 'Just now',
      unread: false,
      online: true,
      subject,
      messages: [
        { id: 'm-' + Date.now(), fromMe: true, text: body.trim(), time: 'Just now' },
      ],
    };
    setMessagesThreads((prev) => [createdThread, ...prev]);
    setSelectedThreadId(createdThread.id);
    setIsComposeMessageOpen(false);
    triggerToast('New Conversation Started', `Message sent to ${createdThread.sender}.`, 'success');
  };

  const handleGenerateReport = (repData: Omit<ReportItem, 'id' | 'generatedDate' | 'status' | 'metrics' | 'summary'>) => {
    const created: ReportItem = {
      ...repData,
      id: 'RPT-' + Date.now(),
      generatedDate: 'Just now',
      status: 'Ready',
      metrics: { avgScore: '90.4%', attendance: '97.0%', passRate: '100%' },
      summary: `Newly compiled ${repData.category.toLowerCase()} report for ${repData.classCode}, verified by UI KIT Design Team.`,
    };
    setReportsList((prev) => [created, ...prev]);
    setIsGenerateReportOpen(false);
    triggerToast('Report Generated', `${created.title} is ready to download.`, 'success');
  };

  const handleDownloadReportCsv = (report: ReportItem) => {
    const csvContent = `data:text/csv;charset=utf-8,Report ID,Title,Class,Category,Generated Date,Mean Score,Attendance\n"${report.id}","${report.title}","${report.classCode}","${report.category}","${report.generatedDate}","${report.metrics.avgScore}","${report.metrics.attendance}"`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${report.id}_${report.classCode.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast('Report Downloaded', `${report.title} exported successfully.`, 'success');
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    triggerToast('Notifications Cleared', 'All notifications marked as read.', 'success');
  };

  const handleNotificationClick = (notif: NotificationItem) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, unread: false } : n))
    );
    if (notif.targetPage) {
      setActivePage(notif.targetPage);
    }
  };

  const handleUploadMaterial = (matData: Omit<ClassMaterial, 'id' | 'uploadedAt' | 'downloadCount'>) => {
    const created: ClassMaterial = {
      ...matData,
      id: 'MAT-' + Date.now(),
      uploadedAt: 'Today',
      downloadCount: 0,
      crewProgress: matData.crewProgress ?? {},
    };
    setMaterialsList((prev) => [created, ...prev]);
    setIsUploadMaterialOpen(false);
    triggerToast('Material Uploaded', `${created.title} added to ${created.classCode}.`, 'success');
  };

  const handleDeleteMaterial = (id: string) => {
    const target = materialsList.find((m) => m.id === id);
    setMaterialsList((prev) => prev.filter((m) => m.id !== id));
    if (selectedMaterial?.id === id) {
      setSelectedMaterial(null);
    }
    triggerToast('Material Removed', target ? `${target.title} was removed.` : 'Material removed.', 'info');
  };

  const handleDownloadMaterial = (mat: ClassMaterial) => {
    setMaterialsList((prev) =>
      prev.map((m) => (m.id === mat.id ? { ...m, downloadCount: m.downloadCount + 1 } : m))
    );
    const element = document.createElement('a');
    if (mat.uploadedFileDataUrl) {
      element.href = mat.uploadedFileDataUrl;
      element.download =
        mat.uploadedFileName ||
        `${mat.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.${mat.fileFormat.toLowerCase()}`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      triggerToast('Download Started', `Downloading ${element.download}`, 'success');
      return;
    }
    const topics = (mat.keyTopics || []).map((t) => '- ' + t).join('\n');
    const fileText = `UI KIT Design System Repository\n---------------------------------\nTitle: ${mat.title}\nSubject: ${mat.subject} (${mat.classCode}) - ${mat.grade}\nAuthor: ${mat.author}\nUnit: ${mat.unitName}\nFile Format: ${mat.fileFormat} | Size: ${mat.fileSize}${mat.sourceLabel ? `\nSource: ${mat.sourceLabel}` : ''}\n\nDescription:\n${mat.description}\n\nKey Topics Covered:\n${topics || 'General Curriculum Topics'}\n\nExcerpt / Key Notes:\n${mat.previewSnippet || 'Complete design system study resource prepared for review.'}`;
    const file = new Blob([fileText], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    const ext = mat.fileFormat.toLowerCase() === 'docx' ? 'docx' : mat.fileFormat.toLowerCase() === 'pptx' ? 'pptx' : mat.fileFormat.toLowerCase() === 'mp4' ? 'mp4' : mat.fileFormat.toLowerCase() === 'zip' ? 'zip' : 'pdf';
    element.download = `${mat.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.${ext}`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    triggerToast('Download Started', `Downloading ${mat.title} (${mat.fileFormat})`, 'success');
  };

  const handleUpdateVideoProgress = (
    materialId: string,
    watchProgress: number,
    isWatchedCompleted: boolean,
    watchedSeconds?: number
  ) => {
    setMaterialsList((prev) =>
      prev.map((m) => {
        if (m.id !== materialId) return m;
        const totalSecs = m.durationSeconds || 1800;
        const calculatedSeconds =
          watchedSeconds !== undefined ? watchedSeconds : Math.round((watchProgress / 100) * totalSecs);
        return {
          ...m,
          watchProgress: Math.min(100, Math.max(0, watchProgress)),
          isWatchedCompleted,
          watchedSeconds: calculatedSeconds,
        };
      })
    );
    if (activeVideoPlayer?.id === materialId) {
      setActiveVideoPlayer((prev) =>
        prev
          ? {
              ...prev,
              watchProgress: Math.min(100, Math.max(0, watchProgress)),
              isWatchedCompleted,
              watchedSeconds:
                watchedSeconds !== undefined
                  ? watchedSeconds
                  : Math.round((watchProgress / 100) * (prev.durationSeconds || 1800)),
            }
          : null
      );
    }
    if (isWatchedCompleted) {
      triggerToast('Selesai Ditonton', 'Video telah ditonton sampai habis (100%).', 'success');
    }
  };

  const handleUpdateMaterialProgress = (
    materialId: string,
    progress: number,
    isCompleted: boolean
  ) => {
    const clamped = Math.min(100, Math.max(0, Math.round(progress)));
    const finalDone = isCompleted || clamped >= 100;
    const todayLabel = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    const applyUpdate = (m: ClassMaterial): ClassMaterial => {
      const matchedCrew = getCrewForMaterial(m, studentsDirectory);
      const nextCrewProgress = { ...(m.crewProgress || {}) };
      matchedCrew.forEach((member) => {
        nextCrewProgress[member.id] = {
          progress: clamped,
          isCompleted: finalDone,
          updatedAt: todayLabel,
        };
      });
      return {
        ...m,
        studyProgress: clamped,
        isCompleted: finalDone,
        crewProgress: nextCrewProgress,
        watchProgress: m.type === 'video' ? clamped : m.watchProgress,
        isWatchedCompleted: m.type === 'video' ? finalDone : m.isWatchedCompleted,
        watchedSeconds:
          m.type === 'video'
            ? Math.round((clamped / 100) * (m.durationSeconds || 1800))
            : m.watchedSeconds,
      };
    };

    setMaterialsList((prev) =>
      prev.map((m) => (m.id === materialId ? applyUpdate(m) : m))
    );
    if (selectedMaterial?.id === materialId) {
      setSelectedMaterial((prev) => (prev ? applyUpdate(prev) : null));
    }
    if (finalDone) {
      triggerToast('Materi Selesai', 'Progress materi ditandai selesai (100%).', 'success');
    }
  };

  const handleUpdateCrewMaterialProgress = (
    materialId: string,
    studentId: string,
    progress: number,
    isCompleted: boolean
  ) => {
    const clamped = Math.min(100, Math.max(0, Math.round(progress)));
    const finalDone = isCompleted || clamped >= 100;
    const todayLabel = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    const applyCrewUpdate = (m: ClassMaterial): ClassMaterial => {
      const nextCrewProgress = {
        ...(m.crewProgress || {}),
        [studentId]: {
          progress: finalDone ? 100 : clamped,
          isCompleted: finalDone,
          updatedAt: todayLabel,
        },
      };
      const nextMat: ClassMaterial = {
        ...m,
        crewProgress: nextCrewProgress,
      };
      const summary = getMaterialCrewSummary(nextMat, studentsDirectory);
      const allDone = summary.totalCrew > 0 && summary.completedCount === summary.totalCrew;
      return {
        ...nextMat,
        studyProgress: summary.avgProgress,
        isCompleted: allDone,
        watchProgress: nextMat.type === 'video' ? summary.avgProgress : nextMat.watchProgress,
        isWatchedCompleted: nextMat.type === 'video' ? allDone : nextMat.isWatchedCompleted,
      };
    };

    setMaterialsList((prev) =>
      prev.map((m) => (m.id === materialId ? applyCrewUpdate(m) : m))
    );
    if (selectedMaterial?.id === materialId) {
      setSelectedMaterial((prev) => (prev ? applyCrewUpdate(prev) : null));
    }
  };

  const handleBulkUpdateCrewMaterialProgress = (
    materialId: string,
    studentIds: string[],
    progress: number,
    isCompleted: boolean
  ) => {
    const clamped = Math.min(100, Math.max(0, Math.round(progress)));
    const finalDone = isCompleted || clamped >= 100;
    const todayLabel = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    const applyBulkUpdate = (m: ClassMaterial): ClassMaterial => {
      const nextCrewProgress = { ...(m.crewProgress || {}) };
      studentIds.forEach((sid) => {
        nextCrewProgress[sid] = {
          progress: finalDone ? 100 : clamped,
          isCompleted: finalDone,
          updatedAt: todayLabel,
        };
      });
      const nextMat: ClassMaterial = {
        ...m,
        crewProgress: nextCrewProgress,
      };
      const summary = getMaterialCrewSummary(nextMat, studentsDirectory);
      const allDone = summary.totalCrew > 0 && summary.completedCount === summary.totalCrew;
      return {
        ...nextMat,
        studyProgress: summary.avgProgress,
        isCompleted: allDone,
        watchProgress: nextMat.type === 'video' ? summary.avgProgress : nextMat.watchProgress,
        isWatchedCompleted: nextMat.type === 'video' ? allDone : nextMat.isWatchedCompleted,
      };
    };

    setMaterialsList((prev) =>
      prev.map((m) => (m.id === materialId ? applyBulkUpdate(m) : m))
    );
    if (selectedMaterial?.id === materialId) {
      setSelectedMaterial((prev) => (prev ? applyBulkUpdate(prev) : null));
    }
    triggerToast(
      finalDone ? 'Semua Crew Selesai' : 'Progress Crew Direset',
      finalDone
        ? `${studentIds.length} UI KIT Member ditandai selesai (100%).`
        : `${studentIds.length} UI KIT Member direset ke ${clamped}%.`,
      finalDone ? 'success' : 'info'
    );
  };

  const handleSaveLiveQuiz = (quiz: LiveQuiz) => {
    setLiveQuizzes((prev) => {
      const exists = prev.some((q) => q.id === quiz.id);
      if (exists) {
        return prev.map((q) => (q.id === quiz.id ? quiz : q));
      }
      return [quiz, ...prev];
    });
    triggerToast('Kuis Disimpan', `"${quiz.title}" siap digunakan untuk LiveQuiz.`, 'success');
  };

  const handleDeleteLiveQuiz = (quizId: string) => {
    const target = liveQuizzes.find((q) => q.id === quizId);
    setLiveQuizzes((prev) => prev.filter((q) => q.id !== quizId));
    triggerToast('Kuis Dihapus', target ? `"${target.title}" telah dihapus.` : 'Kuis dihapus.', 'info');
  };

  const handleDuplicateLiveQuiz = (quiz: LiveQuiz): LiveQuiz => {
    const copy: LiveQuiz = {
      ...quiz,
      id: 'LQ-' + Date.now(),
      title: `${quiz.title} (Salinan)`,
      createdAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      questions: quiz.questions.map((q, idx) => ({
        ...q,
        id: `q-${Date.now()}-${idx}`,
        options: [...q.options],
        acceptedAnswers: q.acceptedAnswers ? [...q.acceptedAnswers] : undefined,
      })),
    };
    setLiveQuizzes((prev) => [copy, ...prev]);
    triggerToast('Kuis Diduplikasi', `"${copy.title}" ditambahkan ke perpustakaan.`, 'success');
    return copy;
  };

  const handleAddLiveQuizReport = (report: LiveQuizSessionReport) => {
    setLiveQuizReports((prev) => {
      if (prev.some((r) => r.id === report.id)) return prev;
      return [report, ...prev];
    });
  };

  const handleExportLiveQuizReportCsv = (report: LiveQuizSessionReport) => {
    const header = 'Rank,Participant,Score,Correct,TotalQuestions,AccuracyPct,BestStreak,TabSwitches\n';
    const rows = [...report.participants]
      .sort((a, b) => b.score - a.score)
      .map((p, idx) => {
        const acc = report.totalQuestions > 0 ? Math.round((p.correctCount / report.totalQuestions) * 100) : 0;
        const safeName = p.name.replace(/"/g, '""');
        return `${idx + 1},"${safeName}",${p.score},${p.correctCount},${report.totalQuestions},${acc}%,${p.bestStreak},${p.tabSwitches}`;
      })
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `LiveQuiz_${report.code}_${report.quizTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    triggerToast('CSV Diekspor', `Hasil sesi "${report.quizTitle}" berhasil diunduh.`, 'success');
  };

  const unreadMessagesCount = messagesThreads.filter((t) => t.unread).length;
  const unreadNotifCount = notifications.filter((n) => n.unread).length;

  return (
    <AppContext.Provider
      value={{
        activePage,
        prevPage,
        setActivePage,
        sidebarOpen,
        setSidebarOpen,
        mobileMenuOpen,
        setMobileMenuOpen,
        toasts,
        triggerToast,

        exams,
        setExams,
        handleAddExam,
        isAddExamOpen,
        setIsAddExamOpen,
        examAssessments,
        setExamAssessments,
        handleAddExamAssessment,
        handleDeleteExamAssessment,

        assignments,
        setAssignments,
        handleGradeSubmission,
        handleCreateAssignment,
        isNewAssignmentOpen,
        setIsNewAssignmentOpen,

        lessonPlans,
        setLessonPlans,
        toggleChecklistItem,
        handleAddChecklistTask,
        handleCreateLessonPlan,
        isNewPlanModalOpen,
        setIsNewPlanModalOpen,

        schedules,
        setSchedules,
        handleAddSchedule,
        handleUpdateScheduleTolerance,
        isAddScheduleOpen,
        setIsAddScheduleOpen,

        studentsDirectory,
        setStudentsDirectory,
        handleAddStudent,
        isAddStudentOpen,
        setIsAddStudentOpen,
        selectedStudentDrawer,
        setSelectedStudentDrawer,

        trainersDirectory,
        setTrainersDirectory,
        handleAddTrainer,
        isAddTrainerOpen,
        setIsAddTrainerOpen,
        selectedTrainerDrawer,
        setSelectedTrainerDrawer,

        messagesThreads,
        setMessagesThreads,
        selectedThreadId,
        setSelectedThreadId,
        handleSelectThread,
        handleSendMessageReply,
        handleComposeNewMessage,
        isComposeMessageOpen,
        setIsComposeMessageOpen,
        unreadMessagesCount,

        reportsList,
        setReportsList,
        handleGenerateReport,
        handleDownloadReportCsv,
        isGenerateReportOpen,
        setIsGenerateReportOpen,

        materialsList,
        setMaterialsList,
        selectedMaterial,
        setSelectedMaterial,
        activeVideoPlayer,
        setActiveVideoPlayer,
        isUploadMaterialOpen,
        setIsUploadMaterialOpen,
        handleUploadMaterial,
        handleDeleteMaterial,
        handleDownloadMaterial,
        handleUpdateVideoProgress,
        handleUpdateMaterialProgress,
        handleUpdateCrewMaterialProgress,
        handleBulkUpdateCrewMaterialProgress,

        notifications,
        setNotifications,
        handleMarkAllRead,
        handleNotificationClick,
        unreadNotifCount,

        liveQuizzes,
        setLiveQuizzes,
        liveQuizReports,
        handleSaveLiveQuiz,
        handleDeleteLiveQuiz,
        handleDuplicateLiveQuiz,
        handleAddLiveQuizReport,
        handleExportLiveQuizReportCsv,
        initialLiveQuizCode,
        setInitialLiveQuizCode,
        pendingLiveQuizJoin,
        setPendingLiveQuizJoin,

        attendanceByClass,
        setAttendanceByClass,
        selectedAttendanceClass,
        setSelectedAttendanceClass,
        selectedAttendanceSubject,
        setSelectedAttendanceSubject,
        qrCheckIns,
        activeQrCheckInSessionId,
        setActiveQrCheckInSessionId,
        activeQrScanKey,
        setActiveQrScanKey,
        isCrewQrScannerOpen,
        setIsCrewQrScannerOpen,
        applyQrCheckInToAttendance,

        isBottomSheetDemoOpen,
        setIsBottomSheetDemoOpen,
        activeDemoModal,
        setActiveDemoModal,
        activeDrawerSpec,
        setActiveDrawerSpec,
        uiSweetAlertType,
        setUiSweetAlertType,
        uiSessionModal,
        setUiSessionModal,

        uiCategory: uiNavState.category,
        prevUiCategory: uiNavState.prevCategory,
        uiSubJump: uiNavState.sub,
        prevUiSubJump: uiNavState.prevSub,
        uiTargetSectionId: uiNavState.sectionId,
        selectUiNode,
        clearUiTargetSection,
        uiSearchFocusSeq,
        triggerUiSearchFocus,
        isUiMobileSearchOpen,
        setIsUiMobileSearchOpen,
        uiUpdates,
        unreadUiUpdatesCount,
        markAllUiUpdatesRead,
        handleUiUpdateClick,

        batches,
        activeBatchId,
        activeBatch,
        graduationRule,
        examGradingRule,
        lastBatchSavedAt,
        switchActiveBatch,
        createBatch,
        deleteBatch,
        updateBatchRules,
        importBatchRecord,
        saveCurrentBatchSnapshot,
        isOnline,
        pendingSyncCount,
        syncPendingNow,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
