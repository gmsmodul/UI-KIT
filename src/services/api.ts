import {
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
  QrAttendanceSession,
  QrAttendanceCheckInRecord,
  BatchDatabaseStore,
  BatchRecord,
} from '../types';
import { createDefaultBatchStore } from '../data/batchDefaults';
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

/**
 * Service Layer for Servolution OS.
 * Can easily be switched to real REST/GraphQL/Firebase endpoints by configuring API_BASE_URL.
 */
const API_BASE_URL = typeof window !== 'undefined' ? (window as unknown as { __API_URL__?: string }).__API_URL__ || '' : '';

// LocalStorage Persistence Helpers
function loadStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = localStorage.getItem(`servolution_${key}`);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`servolution_${key}`, JSON.stringify(value));
  } catch {
    // quota exceeded or private mode
  }
}

export const apiService = {
  // Exams
  async getExams(): Promise<Exam[]> {
    if (API_BASE_URL) {
      const res = await fetch(`${API_BASE_URL}/api/exams`);
      return res.json();
    }
    return loadStorage<Exam[]>('exams', INITIAL_EXAMS);
  },
  async saveExams(exams: Exam[]): Promise<void> {
    saveStorage('exams', exams);
  },
  async getExamAssessments(): Promise<ExamAssessmentRecord[]> {
    return loadStorage<ExamAssessmentRecord[]>('exam_assessments', []);
  },
  async saveExamAssessments(assessments: ExamAssessmentRecord[]): Promise<void> {
    saveStorage('exam_assessments', assessments);
  },

  // Assignments
  async getAssignments(): Promise<Assignment[]> {
    if (API_BASE_URL) {
      const res = await fetch(`${API_BASE_URL}/api/assignments`);
      return res.json();
    }
    return loadStorage<Assignment[]>('assignments', INITIAL_ASSIGNMENTS);
  },
  async saveAssignments(assignments: Assignment[]): Promise<void> {
    saveStorage('assignments', assignments);
  },

  // Lesson Plans
  async getLessonPlans(): Promise<LessonPlan[]> {
    if (API_BASE_URL) {
      const res = await fetch(`${API_BASE_URL}/api/lesson-plans`);
      return res.json();
    }
    return loadStorage<LessonPlan[]>('lesson_plans', INITIAL_LESSON_PLANS);
  },
  async saveLessonPlans(plans: LessonPlan[]): Promise<void> {
    saveStorage('lesson_plans', plans);
  },

  // Schedules
  async getSchedules(): Promise<ScheduleItem[]> {
    if (API_BASE_URL) {
      const res = await fetch(`${API_BASE_URL}/api/schedules`);
      return res.json();
    }
    return loadStorage<ScheduleItem[]>('schedules', WEEKLY_SCHEDULE_DATA);
  },
  async saveSchedules(schedules: ScheduleItem[]): Promise<void> {
    saveStorage('schedules', schedules);
  },

  // Students Directory
  async getStudents(): Promise<StudentDirectoryItem[]> {
    if (API_BASE_URL) {
      const res = await fetch(`${API_BASE_URL}/api/students`);
      return res.json();
    }
    return loadStorage<StudentDirectoryItem[]>('students', INITIAL_STUDENTS_DIRECTORY);
  },
  async saveStudents(students: StudentDirectoryItem[]): Promise<void> {
    saveStorage('students', students);
  },

  // Trainers Directory
  async getTrainers(): Promise<TrainerDirectoryItem[]> {
    if (API_BASE_URL) {
      const res = await fetch(`${API_BASE_URL}/api/trainers`);
      return res.json();
    }
    return loadStorage<TrainerDirectoryItem[]>('trainers', INITIAL_TRAINERS_DIRECTORY);
  },
  async saveTrainers(trainers: TrainerDirectoryItem[]): Promise<void> {
    saveStorage('trainers', trainers);
  },

  // Message Threads
  async getMessages(): Promise<MessageThread[]> {
    if (API_BASE_URL) {
      const res = await fetch(`${API_BASE_URL}/api/messages`);
      return res.json();
    }
    return loadStorage<MessageThread[]>('messages', INITIAL_MESSAGES_THREADS);
  },
  async saveMessages(messages: MessageThread[]): Promise<void> {
    saveStorage('messages', messages);
  },

  // Reports
  async getReports(): Promise<ReportItem[]> {
    if (API_BASE_URL) {
      const res = await fetch(`${API_BASE_URL}/api/reports`);
      return res.json();
    }
    return loadStorage<ReportItem[]>('reports', INITIAL_REPORTS);
  },
  async saveReports(reports: ReportItem[]): Promise<void> {
    saveStorage('reports', reports);
  },

  // Notifications
  async getNotifications(): Promise<NotificationItem[]> {
    if (API_BASE_URL) {
      const res = await fetch(`${API_BASE_URL}/api/notifications`);
      return res.json();
    }
    return loadStorage<NotificationItem[]>('notifications', INITIAL_NOTIFICATIONS);
  },
  async saveNotifications(notifs: NotificationItem[]): Promise<void> {
    saveStorage('notifications', notifs);
  },

  // Class Materials
  async getMaterials(): Promise<ClassMaterial[]> {
    if (API_BASE_URL) {
      const res = await fetch(`${API_BASE_URL}/api/materials`);
      return res.json();
    }
    return loadStorage<ClassMaterial[]>('materials', INITIAL_MATERIALS);
  },
  async saveMaterials(materials: ClassMaterial[]): Promise<void> {
    saveStorage('materials', materials);
  },

  // LiveQuiz Library & Session Reports
  async getLiveQuizzes(): Promise<LiveQuiz[]> {
    return loadStorage<LiveQuiz[]>('live_quizzes', INITIAL_LIVE_QUIZZES);
  },
  async saveLiveQuizzes(quizzes: LiveQuiz[]): Promise<void> {
    saveStorage('live_quizzes', quizzes);
  },
  async getLiveQuizReports(): Promise<LiveQuizSessionReport[]> {
    return loadStorage<LiveQuizSessionReport[]>('live_quiz_reports', INITIAL_LIVE_QUIZ_REPORTS);
  },
  async saveLiveQuizReports(reports: LiveQuizSessionReport[]): Promise<void> {
    saveStorage('live_quiz_reports', reports);
  },

  // Attendance & QR Check-in
  async getAttendanceByClass(): Promise<Record<string, ClassAttendanceData>> {
    const raw = loadStorage<Record<string, ClassAttendanceData & { delayed?: ClassAttendanceData['excuse'] }>>(
      'attendance_by_class',
      STUDENTS_DATA
    );
    const normalized: Record<string, ClassAttendanceData> = {};
    Object.entries(raw).forEach(([cls, buckets]) => {
      normalized[cls] = {
        attendance: Array.isArray(buckets.attendance) ? buckets.attendance : [],
        absences: Array.isArray(buckets.absences) ? buckets.absences : [],
        excuse: Array.isArray(buckets.excuse)
          ? buckets.excuse
          : Array.isArray(buckets.delayed)
            ? buckets.delayed
            : [],
      };
    });
    return normalized;
  },
  async saveAttendanceByClass(data: Record<string, ClassAttendanceData>): Promise<void> {
    saveStorage('attendance_by_class', data);
  },
  async createQrAttendanceSession(payload: {
    scheduleId: string;
    classCode: string;
    subject: string;
    room: string;
    dateStr: string;
    startHour: string;
    endHour: string;
    lateToleranceMin: number;
  }): Promise<QrAttendanceSession> {
    const res = await fetch(`${API_BASE_URL}/api/attendance/qr-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error('Gagal membuat sesi QR absensi.');
    }
    return res.json();
  },
  async rotateQrAttendanceKey(sessionId: string): Promise<{ key: string }> {
    const res = await fetch(
      `${API_BASE_URL}/api/attendance/qr-session/${encodeURIComponent(sessionId)}/rotate`,
      { method: 'POST' }
    );
    if (!res.ok) {
      throw new Error('Gagal memperbarui token QR.');
    }
    return res.json();
  },
  async getQrAttendanceSession(
    sessionId: string,
    key?: string
  ): Promise<{
    session: QrAttendanceSession;
    checkIns: QrAttendanceCheckInRecord[];
    scanGrant: string;
  }> {
    const query = key ? `?k=${encodeURIComponent(key)}` : '';
    const res = await fetch(
      `${API_BASE_URL}/api/attendance/qr-session/${encodeURIComponent(sessionId)}${query}`
    );
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || 'Sesi QR tidak ditemukan atau sudah berakhir.');
    }
    return res.json();
  },
  async submitQrCheckIn(
    sessionId: string,
    crewName: string,
    scanGrant: string
  ): Promise<{
    alreadyCheckedIn: boolean;
    record: QrAttendanceCheckInRecord;
    session: QrAttendanceSession;
  }> {
    const res = await fetch(`${API_BASE_URL}/api/attendance/qr-checkin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, crewName, scanGrant }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(body.error || 'Gagal mencatat absensi QR.');
    }
    return body;
  },
  async getQrCheckIns(sessionId?: string): Promise<QrAttendanceCheckInRecord[]> {
    const query = sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : '';
    const res = await fetch(`${API_BASE_URL}/api/attendance/checkins${query}`);
    if (!res.ok) return [];
    return res.json();
  },

  // Unified Batch & Year Database
  async getBatchDatabaseStore(): Promise<BatchDatabaseStore> {
    const localFallback = loadStorage<BatchDatabaseStore | null>('batch_database', null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/batches`);
      if (res.ok) {
        const serverStore = (await res.json()) as BatchDatabaseStore;
        if (Array.isArray(serverStore?.batches) && serverStore.batches.length > 0) {
          saveStorage('batch_database', serverStore);
          return serverStore;
        }
        const seedStore =
          localFallback && Array.isArray(localFallback.batches) && localFallback.batches.length > 0
            ? localFallback
            : createDefaultBatchStore();
        saveStorage('batch_database', seedStore);
        await fetch(`${API_BASE_URL}/api/batches/store`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(seedStore),
        }).catch(() => null);
        return seedStore;
      }
    } catch {
      // Fallback to localStorage below
    }
    if (localFallback && Array.isArray(localFallback.batches) && localFallback.batches.length > 0) {
      return localFallback;
    }
    const defaultStore = createDefaultBatchStore();
    saveStorage('batch_database', defaultStore);
    return defaultStore;
  },

  async saveBatchDatabaseStore(store: BatchDatabaseStore): Promise<void> {
    saveStorage('batch_database', store);
    try {
      await fetch(`${API_BASE_URL}/api/batches/store`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(store),
      });
    } catch {
      // Offline / network error silently keeps localStorage mirror
    }
  },

  async saveBatchRecord(batch: BatchRecord, storeSnapshot?: BatchDatabaseStore): Promise<void> {
    if (storeSnapshot) {
      saveStorage('batch_database', storeSnapshot);
    }
    try {
      await fetch(`${API_BASE_URL}/api/batches/${encodeURIComponent(batch.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batch),
      });
    } catch {
      // Offline / network error silently keeps localStorage mirror
    }
  },

  async setActiveBatchOnServer(batchId: string, storeSnapshot?: BatchDatabaseStore): Promise<void> {
    if (storeSnapshot) {
      saveStorage('batch_database', storeSnapshot);
    }
    try {
      await fetch(`${API_BASE_URL}/api/batches/active`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchId }),
      });
    } catch {
      // Offline / network error silently keeps localStorage mirror
    }
  },

  async deleteBatchOnServer(batchId: string, storeSnapshot?: BatchDatabaseStore): Promise<void> {
    if (storeSnapshot) {
      saveStorage('batch_database', storeSnapshot);
    }
    try {
      await fetch(`${API_BASE_URL}/api/batches/${encodeURIComponent(batchId)}`, {
        method: 'DELETE',
      });
    } catch {
      // Offline / network error silently keeps localStorage mirror
    }
  },
};
