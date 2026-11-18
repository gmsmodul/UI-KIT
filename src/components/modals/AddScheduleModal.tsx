import React, { useMemo, useState } from 'react';
import { X, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatClassMobileLabel, getAvailableClassOptions } from '../../utils/scheduleSubjects';
import { PastelThemeKey } from '../../types';
import { CustomSelect } from '../ui/CustomSelect';
import { useBottomSheetMotion } from '../../hooks/useBottomSheetMotion';
import { ACTION_BTN_PRIMARY, ACTION_BTN_SECONDARY } from '../../constants/buttonStyles';

type SessionTypeOption = 'Theory' | 'Practice' | 'OJT' | 'Exam';

const SESSION_TYPE_OPTIONS: SessionTypeOption[] = ['Theory', 'Practice', 'OJT', 'Exam'];

function addMinutesToTime(startHour: string, addMinutes: number): string {
  const match = String(startHour || '08:00').match(/(\d{1,2}):(\d{2})/);
  const h = match ? Math.min(23, Math.max(0, Number(match[1]))) : 8;
  const m = match ? Math.min(59, Math.max(0, Number(match[2]))) : 0;
  const total = h * 60 + m + addMinutes;
  const outH = Math.floor(total / 60) % 24;
  const outM = total % 60;
  return `${String(outH).padStart(2, '0')}:${String(outM).padStart(2, '0')}`;
}

export const AddScheduleModal: React.FC = () => {
  const { schedules, isAddScheduleOpen, setIsAddScheduleOpen, handleAddSchedule } = useApp();
  const classOptions = useMemo(
    () => getAvailableClassOptions(schedules.map((s) => s.classCode)),
    [schedules]
  );
  const [form, setForm] = useState<{
    day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri';
    startHour: string;
    classCode: string;
    subject: string;
    room: string;
    students: number;
    type: SessionTypeOption;
    theme: PastelThemeKey;
    lateToleranceMin: number;
  }>({
    day: 'Wed',
    startHour: '10:30',
    classCode: 'Class 302',
    subject: 'Thermodynamics Lab',
    room: 'Science Lab A',
    students: 22,
    type: 'Theory',
    theme: 'peach',
    lateToleranceMin: 5,
  });

  const { setSheetElement, backdropRef, animateClose, sheetGestureProps } = useBottomSheetMotion({
    onClose: () => setIsAddScheduleOpen(false),
  });

  if (!isAddScheduleOpen) return null;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dayDateMap = { Mon: '09', Tue: '10', Wed: '11', Thu: '12', Fri: '13' };
    handleAddSchedule({
      day: form.day,
      date: dayDateMap[form.day] || '11',
      startHour: form.startHour,
      endHour: addMinutesToTime(form.startHour, 90),
      classCode: formatClassMobileLabel(form.classCode),
      subject: form.subject,
      room: form.room,
      students: form.students,
      type: form.type,
      theme: form.theme,
      lateToleranceMin: form.lateToleranceMin,
    });
  };

  return (
    <div
      ref={backdropRef}
      data-modal-sheet-backdrop="true"
      className="animate-ui-fade fixed inset-0 z-50 bg-black/35 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 no-print"
    >
      <form
        ref={setSheetElement}
        {...sheetGestureProps}
        onSubmit={onSubmit}
        className="w-full sm:max-w-md bg-white rounded-t-[28px] sm:rounded-[26px] p-6 space-y-4 shadow-2xl animate-bottom-sheet"
      >
        <div
          data-sheet-handle="true"
          className="sm:hidden flex justify-center py-2 -mt-3 -mb-1 cursor-grab active:cursor-grabbing touch-none"
        >
          <div className="w-10 h-1 bg-black/15 rounded-full animate-sheet-handle" />
        </div>
        <div className="flex items-center justify-between">
          <h3 className="text-[17px] font-semibold text-[#1C1D21]">Add Schedule Session</h3>
          <button
            type="button"
            onClick={animateClose}
            className="w-8 h-8 rounded-full hover:bg-[#F4F5F8] flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-3 text-[13px]">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11.5px] font-semibold text-[#6E717A] mb-1">Subject</label>
              <input
                required
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-black/[0.1] outline-none focus:border-[#ee2e65]"
              />
            </div>
            <div>
              <label className="block text-[11.5px] font-semibold text-[#6E717A] mb-1">Class</label>
              <CustomSelect
                className="w-full"
                triggerClassName="px-3 py-2 rounded-xl border-black/[0.1] text-[13px]"
                value={classOptions.includes(form.classCode) ? form.classCode : 'Class 302'}
                onChange={(val) => setForm({ ...form, classCode: val })}
                ariaLabel="Class"
                options={classOptions.map((cls) => ({
                  value: cls,
                  label: cls,
                }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11.5px] font-semibold text-[#6E717A] mb-1">Day</label>
              <CustomSelect
                className="w-full"
                triggerClassName="px-3 py-2 rounded-xl border-black/[0.1] text-[13px]"
                value={form.day}
                onChange={(val) => setForm({ ...form, day: val as 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' })}
                ariaLabel="Day"
                options={(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as const).map((d) => ({
                  value: d,
                  label: d,
                }))}
              />
            </div>
            <div>
              <label className="block text-[11.5px] font-semibold text-[#6E717A] mb-1">Start</label>
              <input
                required
                value={form.startHour}
                onChange={(e) => setForm({ ...form, startHour: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-black/[0.1] outline-none focus:border-[#ee2e65] tabular-nums"
              />
            </div>
          </div>
          <div>
            <span className="block text-[11.5px] font-semibold text-[#6E717A] mb-1.5">
              Session Type
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" role="radiogroup" aria-label="Session Type">
              {SESSION_TYPE_OPTIONS.map((option) => {
                const isSelected = form.type === option;
                return (
                  <label
                    key={option}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[12.5px] font-medium cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#FEF1F5] border-[#ee2e65] text-[#9D113C] font-semibold'
                        : 'bg-white border-black/[0.1] text-[#1C1D21] hover:bg-[#FAFBFD]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="sessionType"
                      value={option}
                      checked={isSelected}
                      onChange={() => setForm({ ...form, type: option })}
                      className="sr-only"
                    />
                    <span
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                        isSelected ? 'border-[#ee2e65] bg-white' : 'border-black/[0.25] bg-white'
                      }`}
                    >
                      {isSelected && <span className="w-2 h-2 rounded-full bg-[#ee2e65]" />}
                    </span>
                    <span className="truncate">{option}</span>
                  </label>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11.5px] font-semibold text-[#6E717A] mb-1">Room / Location</label>
              <input
                required
                value={form.room}
                onChange={(e) => setForm({ ...form, room: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-black/[0.1] outline-none focus:border-[#ee2e65]"
              />
            </div>
            <div>
              <label className="block text-[11.5px] font-semibold text-[#6E717A] mb-1">
                Toleransi Terlambat
              </label>
              <CustomSelect
                className="w-full"
                triggerClassName="px-3 py-2 rounded-xl border-black/[0.1] text-[13px]"
                value={String(form.lateToleranceMin)}
                onChange={(val) => setForm({ ...form, lateToleranceMin: Number(val) })}
                ariaLabel="Toleransi Terlambat"
                options={[
                  { value: '0', label: '+0 mnt (Tepat Jam Mulai)' },
                  { value: '5', label: '+5 mnt' },
                  { value: '10', label: '+10 mnt' },
                  { value: '15', label: '+15 mnt' },
                ]}
              />
            </div>
          </div>
        </div>
        <div className="flex gap-2.5 pt-2">
          <button
            type="button"
            onClick={animateClose}
            className={`${ACTION_BTN_SECONDARY} flex-1`}
          >
            <X className="w-4 h-4 sm:hidden shrink-0" />
            <span>Cancel</span>
          </button>
          <button
            type="submit"
            className={`${ACTION_BTN_PRIMARY} flex-1`}
          >
            <Check className="w-4 h-4 sm:hidden shrink-0" />
            <span className="sm:hidden">Save</span>
            <span className="hidden sm:inline">Save Session</span>
          </button>
        </div>
      </form>
    </div>
  );
};
