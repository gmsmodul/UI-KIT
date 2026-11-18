import React, { useMemo, useState } from 'react';
import { X, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getAvailableClassOptions } from '../../utils/scheduleSubjects';
import { PastelThemeKey } from '../../types';
import { CustomSelect } from '../ui/CustomSelect';
import { useBottomSheetMotion } from '../../hooks/useBottomSheetMotion';
import { ACTION_BTN_PRIMARY, ACTION_BTN_SECONDARY } from '../../constants/buttonStyles';

export const GenerateReportModal: React.FC = () => {
  const { schedules, isGenerateReportOpen, setIsGenerateReportOpen, handleGenerateReport } = useApp();
  const classOptions = useMemo(
    () => getAvailableClassOptions(schedules.map((s) => s.classCode)),
    [schedules]
  );
  const [form, setForm] = useState<{
    title: string;
    category: 'Academic' | 'Attendance' | 'Assessments' | 'Advisory';
    classCode: string;
    format: string;
    theme: PastelThemeKey;
  }>({
    title: 'Weekly Assignment Completion Digest',
    category: 'Assessments',
    classCode: 'All Classes',
    format: 'PDF · 6 Pages',
    theme: 'mint',
  });

  const { setSheetElement, backdropRef, animateClose, sheetGestureProps } = useBottomSheetMotion({
    onClose: () => setIsGenerateReportOpen(false),
  });

  if (!isGenerateReportOpen) return null;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleGenerateReport({
      title: form.title,
      category: form.category,
      classCode: form.classCode,
      format: form.format,
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
          <h3 className="text-[17px] font-semibold text-[#1C1D21]">Generate Academic Report</h3>
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
            <label className="block text-[11.5px] font-semibold text-[#6E717A] mb-1">Report Title</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-black/[0.1] outline-none focus:border-[#ee2e65]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11.5px] font-semibold text-[#6E717A] mb-1">Category</label>
              <CustomSelect
                className="w-full"
                triggerClassName="px-3.5 py-2 rounded-xl border-black/[0.1] text-[13px]"
                value={form.category}
                onChange={(val) => setForm({ ...form, category: val as 'Academic' | 'Attendance' | 'Assessments' | 'Advisory' })}
                ariaLabel="Category"
                options={(['Academic', 'Attendance', 'Assessments', 'Advisory'] as const).map((c) => ({
                  value: c,
                  label: c,
                }))}
              />
            </div>
            <div>
              <label className="block text-[11.5px] font-semibold text-[#6E717A] mb-1">Class</label>
              <CustomSelect
                className="w-full"
                triggerClassName="px-3.5 py-2 rounded-xl border-black/[0.1] text-[13px]"
                value={form.classCode}
                onChange={(val) => setForm({ ...form, classCode: val })}
                ariaLabel="Class"
                options={[
                  { value: 'All Classes', label: 'All Classes' },
                  ...classOptions.map((cls) => ({
                    value: cls,
                    label: cls,
                  })),
                ]}
              />
            </div>
          </div>
          <div>
            <label className="block text-[11.5px] font-semibold text-[#6E717A] mb-1">Export Format</label>
            <input
              required
              value={form.format}
              onChange={(e) => setForm({ ...form, format: e.target.value })}
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
            <Check className="w-4 h-4 sm:hidden shrink-0" />
            <span className="sm:hidden">Compile</span>
            <span className="hidden sm:inline">Compile Report</span>
          </button>
        </div>
      </form>
    </div>
  );
};
