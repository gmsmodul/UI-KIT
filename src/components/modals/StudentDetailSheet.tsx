import React from 'react';
import { X, Mail, Phone, UserCheck, BookOpen } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useBottomSheetMotion } from '../../hooks/useBottomSheetMotion';
import { ACTION_BTN_SOFT_PRIMARY } from '../../constants/buttonStyles';
import { getCrewOverallMaterialSummary } from '../../utils/materialCrewProgress';

export const StudentDetailSheet: React.FC = () => {
  const {
    selectedStudentDrawer,
    setSelectedStudentDrawer,
    isBottomSheetDemoOpen,
    setIsBottomSheetDemoOpen,
    materialsList,
    setActivePage,
  } = useApp();

  const close = () => {
    setSelectedStudentDrawer(null);
    setIsBottomSheetDemoOpen(false);
  };

  const { setSheetElement, backdropRef, animateClose, sheetGestureProps } = useBottomSheetMotion({
    onClose: close,
  });

  if (!selectedStudentDrawer && !isBottomSheetDemoOpen) return null;

  const student = selectedStudentDrawer || {
    id: 'ST-DEMO',
    initials: 'JW',
    name: 'James Wilson',
    email: 'james.wilson@servolution.edu',
    classCode: 'Class 302',
    grade: 'Grade 12',
    status: 'Active' as const,
    rate: 96,
    score: 88,
    guardian: 'Robert Wilson',
    phone: '+62 812-3401-8821',
    color: 'bg-[#C4F0DC] text-[#146C43]',
  };

  const materialSummary = getCrewOverallMaterialSummary(student, materialsList);

  return (
    <div
      ref={backdropRef}
      data-modal-sheet-backdrop="true"
      className="animate-ui-fade fixed inset-0 z-50 bg-black/35 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 no-print"
    >
      <div
        ref={setSheetElement}
        {...sheetGestureProps}
        className="w-full sm:max-w-md bg-white rounded-t-[28px] sm:rounded-[26px] p-6 space-y-4 shadow-2xl animate-bottom-sheet"
      >
        <div
          data-sheet-handle="true"
          className="sm:hidden flex justify-center py-2 -mt-3 -mb-1 cursor-grab active:cursor-grabbing touch-none"
        >
          <div className="w-10 h-1 bg-black/15 rounded-full animate-sheet-handle" />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className={`w-11 h-11 rounded-full flex items-center justify-center text-[13px] font-bold ${student.color}`}
            >
              {student.initials}
            </span>
            <div>
              <h3 className="text-[16px] font-semibold text-[#1C1D21]">{student.name}</h3>
              <p className="text-[12px] text-[#8A8D98]">{student.email}</p>
            </div>
          </div>
          <button
            onClick={animateClose}
            className="w-8 h-8 rounded-full hover:bg-[#F4F5F8] flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="rounded-2xl border border-black/[0.06] grid grid-cols-2 divide-x divide-black/[0.06] text-[12.5px] overflow-hidden">
          <div className="p-3.5 bg-[#E6F9F0]">
            <div className="text-[#146C43] font-semibold text-[11px]">Attendance Rate</div>
            <div className="text-[20px] font-bold text-[#1C1D21] mt-0.5 tabular-nums">{student.rate}%</div>
          </div>
          <div className="p-3.5 bg-[#FEF1F5]">
            <div className="text-[#9D113C] font-semibold text-[11px]">Mean Score</div>
            <div className="text-[20px] font-bold text-[#1C1D21] mt-0.5 tabular-nums">{student.score}%</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-black/[0.07] divide-y divide-black/[0.05] text-[12px] overflow-hidden">
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 text-[#5A5D67]">
            <UserCheck className="w-4 h-4 text-[#ee2e65] shrink-0" />
            <span>Guardian: <strong className="text-[#1C1D21]">{student.guardian}</strong></span>
          </div>
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 text-[#5A5D67]">
            <Phone className="w-4 h-4 text-[#10B981] shrink-0" />
            <span>Contact: <strong className="text-[#1C1D21] tabular-nums">{student.phone}</strong></span>
          </div>
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 text-[#5A5D67]">
            <Mail className="w-4 h-4 text-[#F59E0B] shrink-0" />
            <span>Class: <strong className="text-[#1C1D21]">{student.classCode} ({student.grade})</strong></span>
          </div>
          <div className="flex items-center justify-between gap-2.5 px-3.5 py-2.5 text-[#5A5D67]">
            <div className="flex items-center gap-2.5 min-w-0">
              <BookOpen className="w-4 h-4 text-[#3F3B99] shrink-0" />
              <span className="truncate">
                Materi Kelas:{' '}
                <strong className="text-[#1C1D21] tabular-nums">
                  {materialSummary.completedCount}/{materialSummary.totalMaterials} Selesai ({materialSummary.avgProgress}%)
                </strong>
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                close();
                setActivePage('materials');
              }}
              className="text-[11.5px] font-semibold text-[#9D113C] hover:underline shrink-0 cursor-pointer"
            >
              Lihat
            </button>
          </div>
        </div>

        <button
          onClick={animateClose}
          className={`${ACTION_BTN_SOFT_PRIMARY} w-full`}
        >
          <X className="w-4 h-4 sm:hidden shrink-0" />
          <span className="sm:hidden">Close</span>
          <span className="hidden sm:inline">Close Profile</span>
        </button>
      </div>
    </div>
  );
};
