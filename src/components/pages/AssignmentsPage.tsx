import React, { useState } from 'react';
import { Search, Plus, Check, Filter } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PASTEL_THEMES } from '../../constants/theme';
import { ACTION_BTN_PRIMARY, ACTION_BTN_SOFT_PRIMARY } from '../../constants/buttonStyles';
import { SplitFilterButton } from '../ui/SplitFilterButton';

export const AssignmentsPage: React.FC = () => {
  const {
    assignments,
    handleGradeSubmission,
    setIsNewAssignmentOpen,
  } = useApp();

  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>(assignments[0]?.id || 'ASG-01');
  const [assignmentFilterStatus, setAssignmentFilterStatus] = useState<string>('All');
  const [assignmentSearch, setAssignmentSearch] = useState<string>('');

  const filteredAssignments = assignments.filter((a) => {
    const matchesStatus = assignmentFilterStatus === 'All' || a.status === assignmentFilterStatus;
    const matchesQuery =
      a.title.toLowerCase().includes(assignmentSearch.toLowerCase()) ||
      a.classCode.toLowerCase().includes(assignmentSearch.toLowerCase());
    return matchesStatus && matchesQuery;
  });

  const activeAssignment =
    assignments.find((a) => a.id === selectedAssignmentId) || filteredAssignments[0] || assignments[0];

  return (
    <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 md:pb-6 border-b border-black/[0.05]">
        <div className="hidden md:block">
          <h1 className="text-[24px] font-semibold tracking-tight text-[#1C1D21]">Assignment</h1>
        </div>

        <div className="flex items-center justify-end gap-2.5 w-full md:w-auto">
          <div className="relative flex-1 sm:flex-initial min-w-0">
            <Search className="w-4 h-4 text-[#8A8D98] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={assignmentSearch}
              onChange={(e) => setAssignmentSearch(e.target.value)}
              placeholder="Search assignments..."
              className="w-full sm:w-auto h-9 pl-9 pr-4 rounded-full border border-black/[0.09] text-[13px] bg-white outline-none focus:border-[#ee2e65]"
            />
          </div>
          <button
            onClick={() => setIsNewAssignmentOpen(true)}
            className={ACTION_BTN_PRIMARY}
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span className="sm:hidden">Create</span>
            <span className="hidden sm:inline">Create assignment</span>
          </button>
        </div>
      </div>

      {/* Status Filter Split Button */}
      <div className="flex items-center justify-end sm:justify-start">
        <SplitFilterButton
          value={assignmentFilterStatus}
          onChange={setAssignmentFilterStatus}
          prefix="Status"
          icon={Filter}
          variant="surface"
          ariaLabel="Filter status tugas"
          options={['All', 'Active', 'Needs Grading', 'Completed'].map((st) => ({
            value: st,
            label: st,
            mobileLabel: st === 'Needs Grading' ? 'Grading' : st,
          }))}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 lg:gap-7">
        {/* Left 7 Cols: Unified Assignment List */}
        <div className="md:col-span-7 bg-white rounded-2xl border border-black/[0.07] divide-y divide-black/[0.06] overflow-hidden self-start">
          {filteredAssignments.map((asg) => {
            const theme = PASTEL_THEMES[asg.theme] || PASTEL_THEMES.periwinkle;
            const pct = Math.round((asg.submitted / (asg.total || 1)) * 100);
            const isSelected = activeAssignment?.id === asg.id;
            return (
              <div
                key={asg.id}
                onClick={() => setSelectedAssignmentId(asg.id)}
                className={`p-4 sm:p-5 cursor-pointer transition-colors ${
                  isSelected
                    ? theme.bg
                    : 'bg-white hover:bg-[#FAFBFD]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${theme.dot}`} />
                    <span className={`${isSelected ? theme.header : theme.bg} ${theme.text} text-[11.5px] font-semibold px-2.5 py-0.5 rounded-full shrink-0`}>
                      {asg.classCode}
                    </span>
                    <span className="text-[12px] text-[#6E717A] truncate">{asg.subject}</span>
                  </div>
                  <span
                    className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full shrink-0 ${
                      asg.status === 'Completed'
                        ? 'bg-[#E6F9F0] text-[#146C43]'
                        : asg.status === 'Needs Grading'
                        ? 'bg-[#FFF5E6] text-[#8C5811]'
                        : 'bg-[#F0EFFC] text-[#3F3B99]'
                    }`}
                  >
                    {asg.status}
                  </span>
                </div>

                <h3 className="text-[15.5px] font-semibold text-[#1C1D21] mt-2.5">{asg.title}</h3>

                <div className="mt-3.5 space-y-1.5">
                  <div className="flex justify-between text-[11.5px] text-[#8A8D98] tabular-nums">
                    <span>Due: {asg.dueDate}</span>
                    <span className="font-semibold text-[#1C1D21]">
                      {asg.submitted}/{asg.total} Submitted ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-black/[0.06] rounded-full overflow-hidden">
                    <div className={`h-full ${theme.dot} rounded-full transition-all duration-300`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right 5 Cols: Submission Tracker & Grading */}
        {activeAssignment && (
          <div className="md:col-span-5 bg-white rounded-2xl p-5 sm:p-6 border border-black/[0.07] space-y-4 self-start">
            <div className="pb-3.5 border-b border-black/[0.06]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8A8D98]">
                Submission Tracker
              </span>
              <h2 className="text-[16px] font-semibold text-[#1C1D21] mt-1">{activeAssignment.title}</h2>
              <p className="text-[12px] text-[#6E717A] mt-0.5">{activeAssignment.classCode} · {activeAssignment.dueDate}</p>
            </div>

            <div className="rounded-xl border border-black/[0.06] divide-y divide-black/[0.05] overflow-hidden">
              {activeAssignment.submissions.map((sub) => (
                <div
                  key={sub.id}
                  className="bg-white px-3.5 py-3 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${sub.color}`}>
                      {sub.initials}
                    </span>
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold text-[#1C1D21] truncate">{sub.name}</div>
                      <div className="text-[11px] text-[#8A8D98]">{sub.time}</div>
                    </div>
                  </div>

                  {sub.status === 'Graded' ? (
                    <span className="px-3 py-1 rounded-full bg-[#E6F9F0] text-[#146C43] text-[12px] font-bold tabular-nums shrink-0">
                      {sub.score}/100
                    </span>
                  ) : sub.status === 'Needs Review' ? (
                    <button
                      onClick={() => handleGradeSubmission(activeAssignment.id, sub.id, 91)}
                      className={ACTION_BTN_SOFT_PRIMARY}
                    >
                      <Check className="w-4 h-4 sm:hidden shrink-0" />
                      <span className="sm:hidden">Grade</span>
                      <span className="hidden sm:inline">Grade (91)</span>
                    </button>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-[#F4F5F8] text-[#8A8D98] text-[11px] font-medium shrink-0">
                      Pending
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
