export type PastelThemeKey = 'periwinkle' | 'peach' | 'coral' | 'mint';

export interface PastelTheme {
  bg: string;
  header: string;
  border: string;
  text: string;
  dot: string;
  hex: string;
}

export interface Exam {
  id: number;
  day: number;
  classCode: string;
  time: string;
  title: string;
  grade: string;
  status: string;
  students: number;
  theme: PastelThemeKey;
}

export interface UpcomingExam {
  id: number;
  classCode: string;
  title: string;
  dateStr: string;
  daysLeft: string;
  theme: PastelThemeKey;
}

export interface Submission {
  id: string;
  initials: string;
  name: string;
  time: string;
  status: 'Graded' | 'Needs Review' | 'Pending';
  score: number | null;
  color: string;
}

export interface Assignment {
  id: string;
  classCode: string;
  subject: string;
  title: string;
  dueDate: string;
  status: 'Active' | 'Needs Grading' | 'Completed';
  submitted: number;
  total: number;
  theme: PastelThemeKey;
  submissions: Submission[];
}

export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

export interface MaterialItem {
  name: string;
  type: string;
  size: string;
}

export interface LessonPlan {
  id: string;
  classCode: string;
  subject: string;
  topic: string;
  date: string;
  status: 'Ready' | 'In Progress' | 'Draft';
  progress: number;
  theme: PastelThemeKey;
  materials: MaterialItem[];
  checklist: ChecklistItem[];
}

export interface ScheduleItem {
  id: string;
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri';
  date: string;
  startHour: string;
  endHour: string;
  classCode: string;
  subject: string;
  room: string;
  students: number;
  theme: PastelThemeKey;
  type: string;
  lateToleranceMin?: number;
}

export interface StudentAttendanceRecord {
  id: string;
  initials: string;
  name: string;
  email: string;
  rate: number;
  score: number;
  color: string;
  checkInTime?: string;
  attendanceStatus?: 'On Time' | 'Late';
  checkedInVia?: 'QR' | 'Manual';
  scheduleSubject?: string;
  excuseReason?: string;
}

export interface ClassAttendanceData {
  attendance: StudentAttendanceRecord[];
  absences: StudentAttendanceRecord[];
  excuse: StudentAttendanceRecord[];
}

export type QrCutoffMode = 'schedule' | 'relative';

export interface QrAttendanceSession {
  id: string;
  scheduleId: string;
  classCode: string;
  subject: string;
  room: string;
  dateStr: string;
  startHour: string;
  endHour: string;
  cutoffMode: QrCutoffMode;
  lateToleranceMin: number;
  cutoffLabel: string;
  cutoffTimestampMs: number;
  createdAt: string;
  rotatingKey?: string;
}

export interface QrAttendanceCheckInRecord {
  id: string;
  sessionId: string;
  scheduleId: string;
  classCode: string;
  subject: string;
  crewName: string;
  initials: string;
  checkInTime: string;
  checkedInAtIso: string;
  status: 'On Time' | 'Late';
  minutesDiff: number;
}

export interface StudentDirectoryItem {
  id: string;
  initials: string;
  name: string;
  email: string;
  classCode: string;
  grade: string;
  status: 'Active' | 'Honor Roll' | 'Needs Support';
  rate: number;
  score: number;
  guardian: string;
  phone: string;
  color: string;
}

export interface TrainerDirectoryItem {
  id: string;
  initials: string;
  name: string;
  email: string;
  department: string;
  assignedClass: string;
  status: 'Active' | 'Lead Trainer' | 'Part-Time';
  sessionsCount: number;
  rating: number;
  specialization: string;
  phone: string;
  color: string;
}

export interface ChatMessage {
  id: string;
  fromMe: boolean;
  text: string;
  time: string;
}

export interface MessageThread {
  id: string;
  sender: string;
  role: string;
  initials: string;
  color: string;
  time: string;
  unread: boolean;
  online: boolean;
  subject: string;
  messages: ChatMessage[];
}

export interface ReportItem {
  id: string;
  title: string;
  category: 'Academic' | 'Attendance' | 'Assessments' | 'Advisory';
  classCode: string;
  generatedDate: string;
  format: string;
  status: 'Ready' | 'Archived';
  theme: PastelThemeKey;
  metrics: {
    avgScore: string;
    attendance: string;
    passRate: string;
  };
  summary: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  desc: string;
  time: string;
  unread: boolean;
  category: string;
  targetPage?: PageId;
  theme: PastelThemeKey;
}

export interface ToastItem {
  id: number;
  title: string;
  message: string;
  type?: 'success' | 'info' | 'warning' | 'error';
}

export interface MaterialCrewProgressEntry {
  progress: number; // 0 - 100
  isCompleted: boolean;
  updatedAt?: string;
}

export interface ClassMaterial {
  id: string;
  title: string;
  subject: string;
  classCode: string;
  grade: string;
  type: 'document' | 'video' | 'slides' | 'lab' | 'reading';
  fileFormat: 'PDF' | 'PPTX' | 'DOCX' | 'MP4' | 'ZIP';
  fileSize: string;
  duration?: string;
  durationSeconds?: number;
  watchedSeconds?: number;
  watchProgress?: number; // 0 - 100%
  isWatchedCompleted?: boolean; // whether watched until the end
  studyProgress?: number; // 0 - 100% in-app reading/study progress
  isCompleted?: boolean; // whether material is marked completed in-app
  crewProgress?: Record<string, MaterialCrewProgressEntry>;
  uploadedAt: string;
  author: string;
  downloadCount: number;
  description: string;
  tags: string[];
  theme: PastelThemeKey;
  unitName: string;
  keyTopics?: string[];
  previewSnippet?: string;
  sourceType?: 'upload' | 'existing_media' | 'app_page';
  sourceLabel?: string;
  sourcePage?: PageId;
  sourceRefId?: string;
  uploadedFileName?: string;
  uploadedFileDataUrl?: string;
}

export type LiveQuizQuestionType = 'multiple_choice' | 'true_false' | 'short_answer';
export type LiveQuizMode = 'classic' | 'test';

export interface LiveQuizQuestion {
  id: string;
  type: LiveQuizQuestionType;
  prompt: string;
  options: string[];
  correctOptionIndex?: number;
  acceptedAnswers?: string[];
  timeLimitSec: number;
  points: number;
  explanation?: string;
}

export interface LiveQuiz {
  id: string;
  title: string;
  subject: string;
  classCode: string;
  description: string;
  theme: PastelThemeKey;
  createdAt: string;
  questions: LiveQuizQuestion[];
}

export interface LiveQuizSettings {
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showExplanation: boolean;
  streakBonus: boolean;
}

export interface LiveQuizParticipantAnswer {
  questionId: string;
  isCorrect: boolean;
  pointsAwarded: number;
  timeTakenMs: number;
  submittedValue: string;
  selectedOptionIndex?: number;
}

export interface LiveQuizParticipantView {
  id: string;
  name: string;
  avatarColor: string;
  connected: boolean;
  score: number;
  streak: number;
  bestStreak: number;
  correctCount: number;
  answeredCount: number;
  tabSwitches: number;
  finished: boolean;
  answers: LiveQuizParticipantAnswer[];
}

export interface LiveQuizSanitizedQuestion {
  id: string;
  type: LiveQuizQuestionType;
  prompt: string;
  options: string[];
  timeLimitSec: number;
  points: number;
}

export interface LiveQuizQuestionStat {
  questionId: string;
  prompt: string;
  type: LiveQuizQuestionType;
  totalAttempts: number;
  correctAttempts: number;
  accuracyPct: number;
  optionCounts?: number[];
}

export interface LiveQuizRoomState {
  code: string;
  quizId: string;
  quizTitle: string;
  subject: string;
  mode: LiveQuizMode;
  settings: LiveQuizSettings;
  status: 'lobby' | 'active' | 'ended';
  role: 'host' | 'participant';
  participantId?: string;
  totalQuestions: number;
  participants: LiveQuizParticipantView[];
  hostQuestions?: LiveQuizQuestion[];
  questionsForParticipant?: LiveQuizSanitizedQuestion[];
  reviewQuestions?: LiveQuizQuestion[];
  questionStats?: LiveQuizQuestionStat[];
  startedAt?: string;
  endedAt?: string;
}

export interface LiveQuizAnswerResult {
  questionId: string;
  isCorrect: boolean;
  pointsAwarded: number;
  totalScore: number;
  streak: number;
  correctDisplay?: string;
  explanation?: string;
}

export interface LiveQuizSessionReport {
  id: string;
  code: string;
  quizId: string;
  quizTitle: string;
  subject: string;
  mode: LiveQuizMode;
  endedAt: string;
  totalQuestions: number;
  participantCount: number;
  avgAccuracy: number;
  topScorer?: string;
  participants: LiveQuizParticipantView[];
  questionStats: LiveQuizQuestionStat[];
}

export interface AttendanceGraduationRule {
  minAttendanceRatePct: number;
  maxUnexcusedAbsences: number;
  maxLateCount: number;
  lateWeightPct: 100 | 75 | 50 | 0;
  excusePolicy: 'present' | 'neutral' | 'absent';
  requireExamPass: boolean;
  notes: string;
}

export interface ExamGradeBand {
  id: string;
  grade: string;
  minScore: number;
  label: string;
  passed: boolean;
}

export interface ExamScaleOption {
  id: string;
  value: number;
  label: string;
}

export interface ExamAssessmentScale {
  id: string;
  name: string;
  options: ExamScaleOption[];
}

export interface ExamSegment {
  id: string;
  positionId: string;
  name: string;
}

export interface ExamPositionParameter {
  id: string;
  segmentId?: string;
  label: string;
  description: string;
  weightPct: number;
}

export interface ExamPositionTemplate {
  id: string;
  name: string;
  department: string;
  scaleId?: string;
  parameters: ExamPositionParameter[];
}

export interface ExamGradingRule {
  passingScore: number;
  scaleMax: number;
  roundingMode: 'nearest' | 'floor' | 'ceil';
  weights: {
    writtenExamPct: number;
    practicalExamPct: number;
    assignmentPct: number;
    attendanceBonusPct: number;
  };
  allowRemedial: boolean;
  maxRemedialAttempts: number;
  remedialCapScore: number;
  gradeBands: ExamGradeBand[];
  assessmentScales?: ExamAssessmentScale[];
  positionTemplates?: ExamPositionTemplate[];
  segments?: ExamSegment[];
}

export interface ExamParameterScore {
  parameterId: string;
  segmentName?: string;
  label: string;
  weightPct: number;
  score: number;
  rawValue?: number;
  scaleLabel?: string;
}

export interface ExamAssessmentRecord {
  id: string;
  examDate: string;
  examDateLabel: string;
  subject: string;
  examineeName: string;
  studentId?: string;
  positionId: string;
  positionName: string;
  parameterScores: ExamParameterScore[];
  finalScore: number;
  grade: string;
  gradeLabel: string;
  passed: boolean;
  notes?: string;
  createdAt: string;
}

export interface BatchDataset {
  exams: Exam[];
  examAssessments?: ExamAssessmentRecord[];
  assignments: Assignment[];
  lessonPlans: LessonPlan[];
  schedules: ScheduleItem[];
  students: StudentDirectoryItem[];
  trainers: TrainerDirectoryItem[];
  messages: MessageThread[];
  reports: ReportItem[];
  notifications: NotificationItem[];
  materials: ClassMaterial[];
  liveQuizzes: LiveQuiz[];
  liveQuizReports: LiveQuizSessionReport[];
  attendanceByClass: Record<string, ClassAttendanceData>;
  qrCheckIns: QrAttendanceCheckInRecord[];
}

export interface BatchRecord {
  id: string;
  batchName: string;
  year: number;
  gmsAsal?: string;
  programEvent?: string;
  createdAt: string;
  updatedAt: string;
  graduationRule: AttendanceGraduationRule;
  examGradingRule: ExamGradingRule;
  data: BatchDataset;
}

export interface BatchDatabaseStore {
  activeBatchId: string;
  batches: BatchRecord[];
}

export type PageId =
  | 'overview'
  | 'materials'
  | 'prep'
  | 'attendance'
  | 'exams'
  | 'assignments'
  | 'livequiz'
  | 'schedule'
  | 'students'
  | 'trainers'
  | 'messages'
  | 'analytics'
  | 'reports'
  | 'settings'
  | 'uikit'
  | 'profile';
