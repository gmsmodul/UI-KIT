import React, { useMemo, useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  getAvailableClassOptions,
  inferGradeForClassKey,
} from '../../utils/scheduleSubjects';
import { CustomSelect } from '../ui/CustomSelect';
import { useBottomSheetMotion } from '../../hooks/useBottomSheetMotion';
import { ACTION_BTN_PRIMARY, ACTION_BTN_SECONDARY } from '../../constants/buttonStyles';

export const AddStudentModal: React.FC = () => {
  const { schedules, isAddStudentOpen, setIsAddStudentOpen, handleAddStudent } = useApp();
  const classOptions = useMemo(
    () => getAvailableClassOptions(schedules.map((s) => s.classCode)),
    [schedules]
  );
  const defaultClass = classOptions[0] || 'Class 302';

  const [form, setForm] = useState({
    name: '',
    email: '',
    classCode: defaultClass,
    guardian: '',
    phone: '+62 812-0000-0000',
  });

  const { setSheetElement, backdropRef, animateClose, sheetGestureProps } = useBottomSheetMotion({
    onClose: () => setIsAddStudentOpen(false),
  });

  if (!isAddStudentOpen) return null;

  const selectedClass = classOptions.includes(form.classCode) ? form.classCode : defaultClass;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    handleAddStudent({
      name: form.name.trim(),
      email: form.email.trim(),
      classCode: selectedClass,
      grade: inferGradeForClassKey(selectedClass),
      guardian: form.guardian.trim() || 'Parent / Guardian',
      phone: form.phone,
    });
    setForm({
      name: '',
      email: '',
      classCode: defaultClass,
      guardian: '',
      phone: '+62 812-0000-0000',
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
          <h3 className="text-[17px] font-semibold text-[#1C1D21]">Enroll New Student</h3>
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
            <label className="block text-[11.5px] font-semibold text-[#6E717A] mb-1">Full Name</label>
            <input
              required
              placeholder="e.g., Lucas Bennett"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-black/[0.1] outline-none focus:border-[#ee2e65]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11.5px] font-semibold text-[#6E717A] mb-1">Class</label>
              <CustomSelect
                className="w-full"
                triggerClassName="px-3.5 py-2 rounded-xl border-black/[0.1] text-[13px]"
                value={selectedClass}
                onChange={(val) => setForm({ ...form, classCode: val })}
                ariaLabel="Class"
                options={classOptions.map((cls) => ({
                  value: cls,
                  label: cls,
                }))}
              />
            </div>
            <div>
              <label className="block text-[11.5px] font-semibold text-[#6E717A] mb-1">Guardian Name</label>
              <input
                required
                placeholder="e.g., Nathan Bennett"
                value={form.guardian}
                onChange={(e) => setForm({ ...form, guardian: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-black/[0.1] outline-none focus:border-[#ee2e65]"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11.5px] font-semibold text-[#6E717A] mb-1">Student Email</label>
            <input
              type="email"
              placeholder="lucas.b@servolution.edu"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-black/[0.1] outline-none focus:border-[#ee2e65]"
            />
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
            <UserPlus className="w-4 h-4 sm:hidden shrink-0" />
            <span className="sm:hidden">Enroll</span>
            <span className="hidden sm:inline">Enroll Student</span>
          </button>
        </div>
      </form>
    </div>
  );
};
