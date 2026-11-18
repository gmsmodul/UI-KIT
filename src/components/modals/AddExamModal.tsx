import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PastelThemeKey } from '../../types';
import { useBottomSheetMotion } from '../../hooks/useBottomSheetMotion';
import { ACTION_BTN_PRIMARY, ACTION_BTN_SECONDARY } from '../../constants/buttonStyles';

export const AddExamModal: React.FC = () => {
  const { isAddExamOpen, setIsAddExamOpen, handleAddExam } = useApp();
  const [form, setForm] = useState({
    day: '1',
    classCode: '302',
    time: '11:00 am',
    title: 'Biology Exam',
    grade: 'Grade 11',
    students: 20,
    theme: 'mint' as PastelThemeKey,
  });

  const { setSheetElement, backdropRef, animateClose, sheetGestureProps } = useBottomSheetMotion({
    onClose: () => setIsAddExamOpen(false),
  });

  if (!isAddExamOpen) return null;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAddExam({
      day: parseInt(form.day, 10) || 1,
      classCode: form.classCode,
      time: form.time,
      title: form.title,
      grade: form.grade,
      students: Number(form.students) || 20,
      theme: form.theme,
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
          <h3 className="text-[17px] font-semibold text-[#1C1D21]">Schedule New Exam</h3>
          <button
            type="button"
            onClick={animateClose}
            className="w-8 h-8 rounded-full hover:bg-[#F4F5F8] flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-3 text-[13px]">
          <div>
            <label className="block text-[11.5px] font-semibold text-[#6E717A] mb-1">Exam Title</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-black/[0.1] outline-none focus:border-[#ee2e65]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11.5px] font-semibold text-[#6E717A] mb-1">Class Code</label>
              <input
                required
                value={form.classCode}
                onChange={(e) => setForm({ ...form, classCode: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-black/[0.1] outline-none focus:border-[#ee2e65]"
              />
            </div>
            <div>
              <label className="block text-[11.5px] font-semibold text-[#6E717A] mb-1">Day (1–6)</label>
              <input
                required
                type="number"
                min="1"
                max="6"
                value={form.day}
                onChange={(e) => setForm({ ...form, day: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-black/[0.1] outline-none focus:border-[#ee2e65]"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11.5px] font-semibold text-[#6E717A] mb-1">Time</label>
              <input
                required
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-black/[0.1] outline-none focus:border-[#ee2e65]"
              />
            </div>
            <div>
              <label className="block text-[11.5px] font-semibold text-[#6E717A] mb-1">Grade</label>
              <input
                required
                value={form.grade}
                onChange={(e) => setForm({ ...form, grade: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-black/[0.1] outline-none focus:border-[#ee2e65]"
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
            <span className="hidden sm:inline">Save Exam</span>
          </button>
        </div>
      </form>
    </div>
  );
};
