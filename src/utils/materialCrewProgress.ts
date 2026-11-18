import { ClassMaterial, MaterialCrewProgressEntry, StudentDirectoryItem } from '../types';
import { normalizeClassKey } from './scheduleSubjects';

export function getCrewForMaterial(
  mat: ClassMaterial,
  students: StudentDirectoryItem[]
): StudentDirectoryItem[] {
  const matClass = normalizeClassKey(mat.classCode);
  if (matClass === 'All Classes') {
    return students;
  }
  return students.filter((s) => normalizeClassKey(s.classCode) === matClass);
}

export function getCrewEntryForMaterial(
  mat: ClassMaterial,
  studentId: string
): MaterialCrewProgressEntry {
  const map = mat.crewProgress;
  if (map && map[studentId]) {
    const entry = map[studentId];
    const isCompleted = Boolean(entry.isCompleted || entry.progress >= 100);
    return {
      progress: isCompleted ? 100 : Math.min(100, Math.max(0, Math.round(entry.progress))),
      isCompleted,
      updatedAt: entry.updatedAt,
    };
  }

  // If crewProgress map exists on this material, any unlisted crew member defaults to 0%
  if (map !== undefined) {
    return { progress: 0, isCompleted: false };
  }

  // Fallback for legacy persisted materials without crewProgress
  const fallbackRaw =
    mat.type === 'video'
      ? mat.watchProgress ?? 0
      : mat.studyProgress ?? mat.watchProgress ?? 0;
  const fallbackDone = Boolean(
    mat.type === 'video'
      ? mat.isWatchedCompleted || fallbackRaw >= 100
      : mat.isCompleted || mat.isWatchedCompleted || fallbackRaw >= 100
  );
  return {
    progress: fallbackDone ? 100 : Math.min(100, Math.max(0, Math.round(fallbackRaw))),
    isCompleted: fallbackDone,
  };
}

export function getCrewStatusCategory(
  entry: MaterialCrewProgressEntry
): 'completed' | 'in_progress' | 'not_started' {
  if (entry.isCompleted || entry.progress >= 100) return 'completed';
  if (entry.progress > 0) return 'in_progress';
  return 'not_started';
}

export interface MaterialCrewSummary {
  crew: StudentDirectoryItem[];
  totalCrew: number;
  completedCount: number;
  inProgressCount: number;
  notStartedCount: number;
  avgProgress: number;
}

export function getMaterialCrewSummary(
  mat: ClassMaterial,
  students: StudentDirectoryItem[]
): MaterialCrewSummary {
  const crew = getCrewForMaterial(mat, students);
  const totalCrew = crew.length;

  if (totalCrew === 0) {
    const raw =
      mat.type === 'video'
        ? mat.watchProgress ?? 0
        : mat.studyProgress ?? mat.watchProgress ?? 0;
    const done = Boolean(mat.isCompleted || mat.isWatchedCompleted || raw >= 100);
    return {
      crew: [],
      totalCrew: 0,
      completedCount: done ? 1 : 0,
      inProgressCount: !done && raw > 0 ? 1 : 0,
      notStartedCount: !done && raw === 0 ? 1 : 0,
      avgProgress: done ? 100 : Math.min(100, Math.max(0, Math.round(raw))),
    };
  }

  let completedCount = 0;
  let inProgressCount = 0;
  let notStartedCount = 0;
  let sumProgress = 0;

  crew.forEach((member) => {
    const entry = getCrewEntryForMaterial(mat, member.id);
    sumProgress += entry.progress;
    const cat = getCrewStatusCategory(entry);
    if (cat === 'completed') completedCount += 1;
    else if (cat === 'in_progress') inProgressCount += 1;
    else notStartedCount += 1;
  });

  return {
    crew,
    totalCrew,
    completedCount,
    inProgressCount,
    notStartedCount,
    avgProgress: Math.round(sumProgress / totalCrew),
  };
}

export function getMaterialsAssignedToCrew(
  student: StudentDirectoryItem,
  materials: ClassMaterial[]
): ClassMaterial[] {
  const studentClass = normalizeClassKey(student.classCode);
  return materials.filter((m) => {
    const matClass = normalizeClassKey(m.classCode);
    return matClass === 'All Classes' || matClass === studentClass;
  });
}

export interface CrewOverallMaterialSummary {
  assignedMaterials: ClassMaterial[];
  totalMaterials: number;
  completedCount: number;
  inProgressCount: number;
  notStartedCount: number;
  avgProgress: number;
}

export function getCrewOverallMaterialSummary(
  student: StudentDirectoryItem,
  materials: ClassMaterial[]
): CrewOverallMaterialSummary {
  const assignedMaterials = getMaterialsAssignedToCrew(student, materials);
  const totalMaterials = assignedMaterials.length;

  if (totalMaterials === 0) {
    return {
      assignedMaterials: [],
      totalMaterials: 0,
      completedCount: 0,
      inProgressCount: 0,
      notStartedCount: 0,
      avgProgress: 0,
    };
  }

  let completedCount = 0;
  let inProgressCount = 0;
  let notStartedCount = 0;
  let sumProgress = 0;

  assignedMaterials.forEach((mat) => {
    const entry = getCrewEntryForMaterial(mat, student.id);
    sumProgress += entry.progress;
    const cat = getCrewStatusCategory(entry);
    if (cat === 'completed') completedCount += 1;
    else if (cat === 'in_progress') inProgressCount += 1;
    else notStartedCount += 1;
  });

  return {
    assignedMaterials,
    totalMaterials,
    completedCount,
    inProgressCount,
    notStartedCount,
    avgProgress: Math.round(sumProgress / totalMaterials),
  };
}
