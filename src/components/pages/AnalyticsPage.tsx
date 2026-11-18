import React, { useMemo, useState } from 'react';
import { Download, Calendar } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getAvailableClassOptions, resolveSubjectForClassKey } from '../../utils/scheduleSubjects';
import { CustomSelect } from '../ui/CustomSelect';
import { SplitFilterButton } from '../ui/SplitFilterButton';
import { ACTION_BTN_PRIMARY } from '../../constants/buttonStyles';

export const AnalyticsPage: React.FC = () => {
  const { schedules, triggerToast } = useApp();
  const [analyticsRange, setAnalyticsRange] = useState('This Term');
  const [analyticsClass, setAnalyticsClass] = useState('All Classes');

  const classOptions = useMemo(
    () => getAvailableClassOptions(schedules.map((s) => s.classCode)),
    [schedules]
  );

  return (
    <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 md:pb-6 border-b border-black/[0.05]">
        <div className="hidden md:block">
          <h1 className="text-[24px] font-semibold tracking-tight text-[#1C1D21]">Analytics &amp; Performance</h1>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2.5 w-full md:w-auto">
          <SplitFilterButton
            value={analyticsRange}
            onChange={setAnalyticsRange}
            prefix="Period"
            icon={Calendar}
            variant="surface"
            align="right"
            ariaLabel="Filter periode analitik"
            options={[
              { value: 'This Week', label: 'This Week', mobileLabel: 'Week' },
              { value: 'This Term', label: 'This Term', mobileLabel: 'Term' },
              { value: 'Full Year', label: 'Full Year', mobileLabel: 'Year' },
            ]}
          />

          <CustomSelect
            value={analyticsClass}
            onChange={setAnalyticsClass}
            pill
            ariaLabel="Filter class analitik"
            className="min-w-[176px]"
            triggerClassName="border-black/[0.08]"
            options={[
              { value: 'All Classes', label: 'All Classes' },
              ...classOptions.map((cls) => ({
                value: cls,
                label: cls,
              })),
            ]}
          />

          <button
            onClick={() => triggerToast('Report Exported', `Analytics summary (${analyticsRange}) downloaded as CSV.`, 'success')}
            className={ACTION_BTN_PRIMARY}
          >
            <Download className="w-4 h-4 shrink-0" />
            <span className="sm:hidden">Export</span>
            <span className="hidden sm:inline">Export Report</span>
          </button>
        </div>
      </div>

      {/* Unified 4-Column Metric Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-black/[0.06] border border-black/[0.06] rounded-2xl overflow-hidden">
        <div className="p-4 sm:p-5 bg-[#FEF1F5]">
          <div className="text-[12px] font-semibold text-[#9D113C]">Mean Exam Score</div>
          <div className="flex items-baseline justify-between gap-2 mt-2">
            <span className="text-[26px] font-bold text-[#1C1D21] tabular-nums">86.4%</span>
            <span className="text-[11.5px] font-semibold text-[#9D113C]">+4.2%</span>
          </div>
          <p className="text-[11.5px] text-[#7D3A51] mt-1">Highest in Class 302 (89.1%)</p>
        </div>

        <div className="p-4 sm:p-5 bg-[#E6F9F0] border-l border-black/[0.06] sm:border-l-0">
          <div className="text-[12px] font-semibold text-[#146C43]">Attendance Rate</div>
          <div className="flex items-baseline justify-between gap-2 mt-2">
            <span className="text-[26px] font-bold text-[#1C1D21] tabular-nums">95.8%</span>
            <span className="text-[11.5px] font-semibold text-[#146C43]">+1.8%</span>
          </div>
          <p className="text-[11.5px] text-[#35684E] mt-1">Target threshold: 92.0%</p>
        </div>

        <div className="p-4 sm:p-5 bg-[#F0EFFC]">
          <div className="text-[12px] font-semibold text-[#3F3B99]">On-Time Submissions</div>
          <div className="flex items-baseline justify-between gap-2 mt-2">
            <span className="text-[26px] font-bold text-[#1C1D21] tabular-nums">91.2%</span>
            <span className="text-[11.5px] font-semibold text-[#3F3B99]">+3.1%</span>
          </div>
          <p className="text-[11.5px] text-[#5854A8] mt-1">78 of 87 assignments on time</p>
        </div>

        <div className="p-4 sm:p-5 bg-[#FFECEB] border-l border-black/[0.06] sm:border-l-0">
          <div className="text-[12px] font-semibold text-[#942922]">At-Risk Students</div>
          <div className="flex items-baseline justify-between gap-2 mt-2">
            <span className="text-[26px] font-bold text-[#1C1D21] tabular-nums">4</span>
            <span className="text-[11.5px] font-semibold text-[#942922]">-2 vs last mo</span>
          </div>
          <p className="text-[11.5px] text-[#7E3B36] mt-1">Below 75% attendance or score</p>
        </div>
      </div>

      {/* Charts & Breakdown Row */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-7">
        {/* Left 7 Columns: Subject & Class Comparison (Flat Panel + Hairline Rows) */}
        <div className="md:col-span-7 bg-white rounded-2xl p-5 sm:p-6 border border-black/[0.07] space-y-5 self-start">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-black/[0.06]">
            <div>
              <h2 className="text-[16px] font-semibold text-[#1C1D21]">Average scores by class</h2>
              <p className="text-[12px] text-[#8A8D98]">Average exam score vs. attendance rate ({analyticsRange})</p>
            </div>
            <span className="text-[12px] font-semibold text-[#6E717A]">{analyticsClass}</span>
          </div>

          <div className="divide-y divide-black/[0.05]">
            {(() => {
              const metricsByClass: Record<string, { score: number; att: number; color: string; textCls: string }> = {
                'Class 302': { score: 89, att: 96, color: 'bg-[#6C5DD3]', textCls: 'text-[#3F3B99]' },
                'Class 303': { score: 84, att: 94, color: 'bg-[#F59E0B]', textCls: 'text-[#8C5811]' },
                'Class 305': { score: 91, att: 98, color: 'bg-[#10B981]', textCls: 'text-[#146C43]' },
                'Class 304': { score: 82, att: 93, color: 'bg-[#ee2e65]', textCls: 'text-[#9D113C]' },
              };
              const orderedClasses = [
                'Class 302',
                'Class 303',
                'Class 305',
                'Class 304',
                ...classOptions.filter(
                  (c) => !['Class 302', 'Class 303', 'Class 305', 'Class 304'].includes(c)
                ),
              ];
              const rows = orderedClasses.map((classKey) => {
                const metric = metricsByClass[classKey] || {
                  score: 88,
                  att: 95,
                  color: 'bg-[#6C5DD3]',
                  textCls: 'text-[#3F3B99]',
                };
                return {
                  cls: classKey,
                  subject: resolveSubjectForClassKey(classKey, schedules),
                  ...metric,
                };
              });
              const visibleRows =
                analyticsClass === 'All Classes'
                  ? rows
                  : rows.filter((r) => r.cls === analyticsClass);
              return visibleRows.map((row) => (
              <div key={row.cls} className="py-3.5 first:pt-1 last:pb-1 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[13.5px] font-medium text-[#1C1D21]">{row.cls}</span>
                    <span className="text-[12px] text-[#8A8D98] truncate">· {row.subject}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-[12px] tabular-nums shrink-0">
                    <span className={`font-semibold ${row.textCls}`}>Avg {row.score}%</span>
                    <span className="text-[#B4B6C1]">·</span>
                    <span className="text-[#6E717A]">Att {row.att}%</span>
                  </div>
                </div>
                <div className="w-full h-2 bg-[#F4F5F8] rounded-full overflow-hidden">
                  <div className={`h-full ${row.color} rounded-full transition-all duration-[260ms] ease-[cubic-bezier(0.23,1,0.32,1)]`} style={{ width: `${row.score}%` }} />
                </div>
              </div>
              ));
            })()}
          </div>
        </div>

        {/* Right 5 Columns: Grade Distribution & Top Performers */}
        <div className="md:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-black/[0.07]">
            <h2 className="text-[16px] font-semibold text-[#1C1D21] mb-1">Grade Distribution</h2>
            <p className="text-[12px] text-[#8A8D98] mb-5">Across 87 enrolled students</p>

            <div className="flex items-center gap-6">
              <div
                className="w-28 h-28 rounded-full shrink-0 relative flex items-center justify-center"
                style={{
                  background: 'conic-gradient(#6C5DD3 0% 38%, #10B981 38% 72%, #F59E0B 72% 91%, #ee2e65 91% 100%)',
                }}
              >
                <div className="w-[72px] h-[72px] rounded-full bg-white flex flex-col items-center justify-center">
                  <span className="text-[17px] font-bold text-[#1C1D21] tabular-nums">87</span>
                  <span className="text-[10px] text-[#8A8D98] font-medium">Students</span>
                </div>
              </div>

              <div className="flex-1 space-y-2 text-[12.5px]">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[#5A5D67]"><span className="w-2.5 h-2.5 rounded-full bg-[#6C5DD3]" /> Grade A (90–100)</span>
                  <span className="font-semibold text-[#1C1D21] tabular-nums">38%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[#5A5D67]"><span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" /> Grade B (80–89)</span>
                  <span className="font-semibold text-[#1C1D21] tabular-nums">34%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[#5A5D67]"><span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" /> Grade C (70–79)</span>
                  <span className="font-semibold text-[#1C1D21] tabular-nums">19%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[#5A5D67]"><span className="w-2.5 h-2.5 rounded-full bg-[#ee2e65]" /> Needs Support</span>
                  <span className="font-semibold text-[#1C1D21] tabular-nums">9%</span>
                </div>
              </div>
            </div>
          </div>

          <section className="bg-white rounded-2xl p-5 sm:p-6 border border-black/[0.07]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[15px] font-semibold text-[#1C1D21]">Top Performing Students</h3>
              <span className="text-[11.5px] font-semibold text-[#146C43]">Honor Roll</span>
            </div>
            <div className="divide-y divide-black/[0.05]">
              {[
                { initials: 'AL', name: 'Alice Lindqvist', cls: 'Class 303', score: '96%', color: 'bg-[#D6D4FF] text-[#3F3B99]' },
                { initials: 'IS', name: 'Isabella Scott', cls: 'Class 304', score: '95%', color: 'bg-[#C4F0DC] text-[#146C43]' },
                { initials: 'SA', name: 'Sarah Anderson', cls: 'Class 302', score: '94%', color: 'bg-[#FDE6C4] text-[#8C5811]' },
              ].map((st) => (
                <div key={st.name} className="py-2.5 first:pt-1 last:pb-1 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold ${st.color}`}>
                      {st.initials}
                    </span>
                    <div>
                      <div className="text-[13px] font-semibold text-[#1C1D21]">{st.name}</div>
                      <div className="text-[11px] text-[#8A8D98]">{st.cls}</div>
                    </div>
                  </div>
                  <span className="text-[13px] font-bold text-[#1C1D21] tabular-nums">
                    {st.score}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
