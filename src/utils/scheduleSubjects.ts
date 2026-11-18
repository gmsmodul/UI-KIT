import { PastelThemeKey, ScheduleItem } from '../types';

export interface ScheduleSubjectOption {
  subject: string;
  classKey: string;
  rawClassCode: string;
  theme: PastelThemeKey;
}

export function normalizeClassKey(rawClassCode: string): string {
  const trimmed = String(rawClassCode || '').trim();
  if (!trimmed) return 'Class 302';
  const lower = trimmed.toLowerCase();
  if (lower === 'all' || lower === 'all classes' || lower === 'all subjects') {
    return 'All Classes';
  }
  if (/^class\s+/i.test(trimmed)) {
    return `Class ${trimmed.replace(/^class\s+/i, '').trim()}`;
  }
  return `Class ${trimmed}`;
}

export function getScheduleSubjectOptions(schedules: ScheduleItem[]): ScheduleSubjectOption[] {
  const seen = new Set<string>();
  const result: ScheduleSubjectOption[] = [];

  for (const item of schedules) {
    const subject = item.subject.trim();
    if (!subject) continue;
    const key = subject.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({
      subject,
      classKey: normalizeClassKey(item.classCode),
      rawClassCode: item.classCode,
      theme: item.theme,
    });
  }

  return result;
}

export function resolveClassKeyForSubject(subject: string, schedules: ScheduleItem[]): string {
  const trimmed = String(subject || '').trim();
  const lower = trimmed.toLowerCase();
  if (!trimmed || lower === 'all' || lower === 'all subjects' || lower === 'all classes') {
    return 'All Classes';
  }

  const exactMatch = schedules.find((s) => s.subject.trim().toLowerCase() === lower);
  if (exactMatch) {
    return normalizeClassKey(exactMatch.classCode);
  }

  const partialMatch = schedules.find(
    (s) =>
      s.subject.trim().toLowerCase().includes(lower) ||
      lower.includes(s.subject.trim().toLowerCase())
  );
  if (partialMatch) {
    return normalizeClassKey(partialMatch.classCode);
  }

  if (/^(class\s+)?30\d$/i.test(trimmed)) {
    return normalizeClassKey(trimmed);
  }

  return 'Class 302';
}

export function resolveSubjectForClassKey(classKey: string, schedules: ScheduleItem[]): string {
  const normalizedTarget = normalizeClassKey(classKey);
  const match = schedules.find((s) => normalizeClassKey(s.classCode) === normalizedTarget);
  return match?.subject || schedules[0]?.subject || 'Mathematics';
}

export function inferGradeForClassKey(classKey: string): string {
  const normalized = normalizeClassKey(classKey);
  if (normalized === 'Class 303') return 'Grade 10';
  if (normalized === 'Class 304') return 'Grade 9';
  if (normalized === 'Class 305') return 'Grade 11';
  return 'Grade 12';
}

export function formatSubjectMobileLabel(subject: string): string {
  const trimmed = subject.trim();
  if (!trimmed) return 'All';
  if (trimmed.length <= 12) return trimmed;
  if (trimmed.toLowerCase() === 'english literature') return 'English';
  if (trimmed.toLowerCase() === 'faculty office hours') return 'Office Hrs';
  if (trimmed.toLowerCase() === 'physics theory') return 'Physics Th.';
  if (trimmed.toLowerCase() === 'thermodynamics lab') return 'Thermo Lab';
  const words = trimmed.split(/\s+/);
  return words[0].length <= 12 ? words[0] : trimmed.slice(0, 11) + '…';
}

export const DEFAULT_CLASS_KEYS = ['Class 302', 'Class 303', 'Class 304', 'Class 305'];

export function getAvailableClassOptions(
  ...rawCodeGroups: Array<Array<string | undefined | null>>
): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];

  const pushIfValid = (raw?: string | null) => {
    const trimmed = String(raw || '').trim();
    if (!trimmed) return;
    const normalized = normalizeClassKey(trimmed);
    if (!normalized || normalized === 'All Classes') return;
    if (!seen.has(normalized)) {
      seen.add(normalized);
      ordered.push(normalized);
    }
  };

  DEFAULT_CLASS_KEYS.forEach(pushIfValid);
  rawCodeGroups.forEach((group) => group.forEach(pushIfValid));

  return ordered.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

export function formatClassMobileLabel(classKey: string): string {
  const normalized = normalizeClassKey(classKey);
  if (normalized === 'All Classes') return 'All';
  return normalized.replace(/^Class\s+/i, '').trim() || normalized;
}

