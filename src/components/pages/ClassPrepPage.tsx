import React, { useMemo, useState } from 'react';
import { Plus, CheckSquare, Square, BookOpen } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  formatClassMobileLabel,
  getAvailableClassOptions,
  normalizeClassKey,
} from '../../utils/scheduleSubjects';
import { PASTEL_THEMES } from '../../constants/theme';
import { ACTION_BTN_PRIMARY } from '../../constants/buttonStyles';
import { SplitFilterButton } from '../ui/SplitFilterButton';

export const ClassPrepPage: React.FC = () => {
  const {
    schedules,
    lessonPlans,
    toggleChecklistItem,
    handleAddChecklistTask,
    setIsNewPlanModalOpen,
  } = useApp();

  const [selectedPlanId, setSelectedPlanId] = useState<string>(lessonPlans[0]?.id || 'LP-01');
  const [prepFilterClass, setPrepFilterClass] = useState('All');
  const [newTaskText, setNewTaskText] = useState('');

  const classOptions = useMemo(() => {
    const classes = getAvailableClassOptions(
      lessonPlans.map((p) => p.classCode),
      schedules.map((s) => s.classCode)
    );
    return [
      { value: 'All', label: 'All Classes', mobileLabel: 'All' },
      ...classes.map((cls) => ({
        value: cls,
        label: cls,
        mobileLabel: formatClassMobileLabel(cls),
      })),
    ];
  }, [lessonPlans, schedules]);

  const filteredPlans = useMemo(() => {
    if (prepFilterClass === 'All') {
      return lessonPlans;
    }
    return lessonPlans.filter((p) => normalizeClassKey(p.classCode) === prepFilterClass);
  }, [lessonPlans, prepFilterClass]);

  const activePlan =
    filteredPlans.find((p) => p.id === selectedPlanId) ||
    filteredPlans[0] ||
    lessonPlans[0];

  const onAddTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim() || !activePlan) return;
    handleAddChecklistTask(activePlan.id, newTaskText.trim());
    setNewTaskText('');
  };

  return (
    <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 md:pb-6 border-b border-black/[0.05]">
        <div className="hidden md:block">
          <h1 className="text-[24px] font-semibold tracking-tight text-[#1C1D21]">Class Preparation</h1>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2.5 w-full md:w-auto min-w-0">
          <SplitFilterButton
            value={prepFilterClass}
            onChange={setPrepFilterClass}
            prefix="Class"
            icon={BookOpen}
            variant="surface"
            align="right"
            ariaLabel="Filter class persiapan"
            options={classOptions}
          />

          <button
            onClick={() => setIsNewPlanModalOpen(true)}
            className={ACTION_BTN_PRIMARY}
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span className="sm:hidden">New</span>
            <span className="hidden sm:inline">New Lesson Plan</span>
          </button>
        </div>
      </div>

      {/* Unified Readiness Summary Strip */}
      <div className="rounded-2xl border border-black/[0.06] grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-black/[0.06] overflow-hidden">
        <div className="p-4 sm:p-5 bg-[#E6F9F0]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#10B981]" />
            <span className="text-[12px] font-semibold text-[#146C43]">Ready to Teach</span>
          </div>
          <div className="text-[24px] font-bold text-[#1C1D21] mt-1.5 tabular-nums">
            {lessonPlans.filter((p) => p.status === 'Ready').length} Modules
          </div>
          <p className="text-[11.5px] text-[#35684E] mt-0.5">All slides &amp; worksheets uploaded</p>
        </div>
        <div className="p-4 sm:p-5 bg-[#FFF5E6]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
            <span className="text-[12px] font-semibold text-[#8C5811]">In Preparation</span>
          </div>
          <div className="text-[24px] font-bold text-[#1C1D21] mt-1.5 tabular-nums">
            {lessonPlans.filter((p) => p.status !== 'Ready').length} Modules
          </div>
          <p className="text-[11.5px] text-[#7A592A] mt-0.5">Pending final checklist items</p>
        </div>
        <div className="p-4 sm:p-5 bg-[#F0EFFC]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#6C5DD3]" />
            <span className="text-[12px] font-semibold text-[#3F3B99]">Teaching Resources</span>
          </div>
          <div className="text-[24px] font-bold text-[#1C1D21] mt-1.5 tabular-nums">
            {lessonPlans.reduce((acc, p) => acc + p.materials.length, 0)} Files
          </div>
          <p className="text-[11.5px] text-[#5854A8] mt-0.5">PDF decks, labs &amp; video guides</p>
        </div>
      </div>

      {/* 12-Col Layout: Lesson Modules List (7 Cols) | Active Module Inspector (5 Cols) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 lg:gap-7">
        <div className="md:col-span-7 bg-white rounded-2xl border border-black/[0.07] divide-y divide-black/[0.06] overflow-hidden self-start">
          {filteredPlans.map((plan) => {
              const theme = PASTEL_THEMES[plan.theme] || PASTEL_THEMES.periwinkle;
              const isSelected = activePlan?.id === plan.id;
              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={`p-4 sm:p-5 cursor-pointer transition-colors ${
                    isSelected
                      ? theme.bg
                      : 'bg-white hover:bg-[#FAFBFD]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${theme.dot}`} />
                      <span className={`${isSelected ? theme.header : theme.bg} ${theme.text} text-[11.5px] font-semibold px-2.5 py-0.5 rounded-full shrink-0`}>
                        {plan.classCode}
                      </span>
                      <span className="text-[12px] font-medium text-[#6E717A] truncate">{plan.subject}</span>
                    </div>
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full shrink-0 tabular-nums ${
                        plan.status === 'Ready'
                          ? 'bg-[#E6F9F0] text-[#146C43]'
                          : 'bg-[#FFF5E6] text-[#8C5811]'
                      }`}
                    >
                      {plan.status} · {plan.progress}%
                    </span>
                  </div>

                  <h3 className="text-[15.5px] font-semibold text-[#1C1D21] mt-2.5">{plan.topic}</h3>

                  <div className="mt-3.5 space-y-1.5">
                    <div className="w-full h-1.5 bg-black/[0.06] rounded-full overflow-hidden">
                      <div
                        className={`h-full ${theme.dot} rounded-full transition-all duration-[240ms] ease-[cubic-bezier(0.23,1,0.32,1)]`}
                        style={{ width: `${plan.progress}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11.5px] text-[#8A8D98] tabular-nums">
                      <span>Scheduled: {plan.date}</span>
                      <span>{plan.materials.length} attachments</span>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Lesson checklist */}
        {activePlan && (
          <div className="md:col-span-5 bg-white rounded-2xl p-5 sm:p-6 border border-black/[0.07] space-y-5 self-start">
            <div className="flex items-start justify-between gap-2 pb-4 border-b border-black/[0.06]">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#8A8D98]">
                  Lesson checklist
                </span>
                <h2 className="text-[16.5px] font-semibold text-[#1C1D21] mt-1">{activePlan.topic}</h2>
                <p className="text-[12px] text-[#6E717A] mt-0.5">
                  {activePlan.classCode} · {activePlan.date}
                </p>
              </div>
              <span className="text-[12.5px] font-bold bg-[#FEF1F5] text-[#9D113C] border border-[#FBC2D4]/70 px-3 py-1 rounded-full tabular-nums shrink-0">
                {activePlan.progress}%
              </span>
            </div>

            {/* Interactive Checklist */}
            <div className="space-y-2.5">
              <div className="text-[12.5px] font-semibold text-[#1C1D21]">Preparation Checklist</div>
              <div className="rounded-xl border border-black/[0.06] divide-y divide-black/[0.05] overflow-hidden">
                {activePlan.checklist.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => toggleChecklistItem(activePlan.id, item.id)}
                    className="w-full flex items-center gap-3 bg-white px-3.5 py-2.5 text-left hover:bg-[#FAFBFD] transition-colors cursor-pointer"
                  >
                    {item.done ? (
                      <CheckSquare className="w-4 h-4 text-[#10B981] shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-[#9496A1] shrink-0" />
                    )}
                    <span className={`text-[13px] ${item.done ? 'line-through text-[#9496A1]' : 'text-[#1C1D21] font-medium'}`}>
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>

              <form onSubmit={onAddTaskSubmit} className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  placeholder="Add preparation step..."
                  className="flex-1 h-9 bg-white border border-black/[0.1] rounded-full px-3.5 text-[13px] outline-none focus:border-[#ee2e65]"
                />
                <button
                  type="submit"
                  className={ACTION_BTN_PRIMARY}
                >
                  <Plus className="w-4 h-4 sm:hidden shrink-0" />
                  <span>Add</span>
                </button>
              </form>
            </div>

            {/* Attached Materials */}
            <div className="space-y-2 pt-3 border-t border-black/[0.06]">
              <div className="text-[12.5px] font-semibold text-[#1C1D21]">Attached Materials</div>
              <div className="rounded-xl border border-black/[0.06] divide-y divide-black/[0.05] overflow-hidden">
                {activePlan.materials.map((mat, idx) => {
                  const matColor =
                    mat.type === 'VIDEO'
                      ? 'bg-[#FEF1F5] text-[#9D113C]'
                      : mat.type === 'IMG'
                      ? 'bg-[#FFF5E6] text-[#8C5811]'
                      : mat.type === 'DOC'
                      ? 'bg-[#E6F9F0] text-[#146C43]'
                      : 'bg-[#F0EFFC] text-[#3F3B99]';
                  return (
                    <div
                      key={idx}
                      className="bg-white px-3.5 py-2.5 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${matColor}`}>
                          {mat.type}
                        </span>
                        <span className="text-[12.5px] font-medium text-[#1C1D21] truncate">{mat.name}</span>
                      </div>
                      <span className="text-[11px] text-[#8A8D98] shrink-0 tabular-nums">{mat.size}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
