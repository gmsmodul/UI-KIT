import React, { useMemo, useState } from 'react';
import { Search, Plus, ChevronRight, Users, Award } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  formatClassMobileLabel,
  getAvailableClassOptions,
  normalizeClassKey,
} from '../../utils/scheduleSubjects';
import { SplitFilterButton } from '../ui/SplitFilterButton';
import { ACTION_BTN_PRIMARY } from '../../constants/buttonStyles';

export const TrainersPage: React.FC = () => {
  const {
    schedules,
    trainersDirectory,
    setIsAddTrainerOpen,
    setSelectedTrainerDrawer,
  } = useApp();

  const [trainerSearchQuery, setTrainerSearchQuery] = useState('');
  const [trainerClassFilter, setTrainerClassFilter] = useState('All');
  const [trainerStatusFilter, setTrainerStatusFilter] = useState('All');

  const classOptions = useMemo(() => {
    const classes = getAvailableClassOptions(
      trainersDirectory.map((t) => t.assignedClass),
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
  }, [trainersDirectory, schedules]);

  const classScopedTrainers = trainersDirectory.filter(
    (tr) =>
      trainerClassFilter === 'All' ||
      normalizeClassKey(tr.assignedClass) === trainerClassFilter
  );

  const filteredTrainers = classScopedTrainers.filter((tr) => {
    const matchesStatus = trainerStatusFilter === 'All' || tr.status === trainerStatusFilter;
    const matchesSearch =
      tr.name.toLowerCase().includes(trainerSearchQuery.toLowerCase()) ||
      tr.email.toLowerCase().includes(trainerSearchQuery.toLowerCase()) ||
      tr.department.toLowerCase().includes(trainerSearchQuery.toLowerCase()) ||
      tr.assignedClass.toLowerCase().includes(trainerSearchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const avgRating = Math.round(
    classScopedTrainers.reduce((acc, t) => acc + t.rating, 0) / (classScopedTrainers.length || 1)
  );

  const statusTabs = [
    {
      value: 'All',
      mobileLabel: 'All',
      count: classScopedTrainers.length,
      badgeClass: 'bg-[#FEF1F5] text-[#9D113C]',
      activeBadgeClass: 'bg-[#9D113C] text-white',
    },
    {
      value: 'Lead Trainer',
      mobileLabel: 'Lead',
      count: classScopedTrainers.filter((t) => t.status === 'Lead Trainer').length,
      badgeClass: 'bg-[#E6F9F0] text-[#146C43]',
      activeBadgeClass: 'bg-[#9D113C] text-white',
    },
    {
      value: 'Active',
      mobileLabel: 'Active',
      count: classScopedTrainers.filter((t) => t.status === 'Active').length,
      badgeClass: 'bg-[#F0EFFC] text-[#3F3B99]',
      activeBadgeClass: 'bg-[#9D113C] text-white',
    },
    {
      value: 'Part-Time',
      mobileLabel: 'Part',
      count: classScopedTrainers.filter((t) => t.status === 'Part-Time').length,
      badgeClass: 'bg-[#FFF5E6] text-[#8C5811]',
      activeBadgeClass: 'bg-[#9D113C] text-white',
    },
  ];

  const getClassBadgeColor = (cls: string) => {
    if (cls.includes('302')) return 'bg-[#F0EFFC] text-[#3F3B99]';
    if (cls.includes('303')) return 'bg-[#FFF5E6] text-[#8C5811]';
    if (cls.includes('304')) return 'bg-[#FFECEB] text-[#942922]';
    return 'bg-[#E6F9F0] text-[#146C43]';
  };

  return (
    <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 md:pb-6 border-b border-black/[0.05]">
        <div className="hidden md:block">
          <div className="flex items-center gap-2.5">
            <h1 className="text-[24px] font-semibold tracking-tight text-[#1C1D21]">Trainer</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#E6F9F0] text-[#146C43] text-[11.5px] font-bold tabular-nums">
              Avg {avgRating}%
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2.5 w-full md:w-auto">
          <div className="relative flex-1 sm:flex-initial min-w-[170px]">
            <Search className="w-4 h-4 text-[#8A8D98] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={trainerSearchQuery}
              onChange={(e) => setTrainerSearchQuery(e.target.value)}
              placeholder="Search trainer or email..."
              className="w-full sm:w-auto h-9 pl-9 pr-4 rounded-full border border-black/[0.09] text-[13px] bg-white outline-none focus:border-[#ee2e65]"
            />
          </div>
          <button
            onClick={() => setIsAddTrainerOpen(true)}
            className={ACTION_BTN_PRIMARY}
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span className="sm:hidden">Add</span>
            <span className="hidden sm:inline">Add Trainer</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <span className="md:hidden px-2.5 py-1 rounded-full bg-[#E6F9F0] text-[#146C43] text-[11.5px] font-bold mr-auto tabular-nums">
          Avg {avgRating}%
        </span>
        <div className="flex flex-wrap items-center justify-end md:justify-between gap-2.5 w-auto md:w-full">
          <SplitFilterButton
            value={trainerClassFilter}
            onChange={setTrainerClassFilter}
            prefix="Class"
            icon={Users}
            variant="surface"
            ariaLabel="Filter class trainer"
            options={classOptions}
          />

          <SplitFilterButton
            value={trainerStatusFilter}
            onChange={setTrainerStatusFilter}
            prefix="Status"
            icon={Award}
            variant="primary"
            align="right"
            ariaLabel="Filter status trainer"
            options={statusTabs.map((tab) => ({
              value: tab.value,
              label: tab.value,
              mobileLabel: tab.mobileLabel,
              badge: tab.count,
              badgeClassName: tab.badgeClass,
            }))}
          />
        </div>
      </div>

      {filteredTrainers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-black/[0.07] py-12 px-6 text-center space-y-2">
          <div className="text-[15px] font-semibold text-[#1C1D21]">No trainers found</div>
          <p className="text-[12.5px] text-[#8A8D98]">
            Try adjusting your search query, class selection, or status filter.
          </p>
        </div>
      ) : (
        <>
          {/* Mobile Unified Hairline List */}
          <div className="md:hidden bg-white rounded-2xl border border-black/[0.07] divide-y divide-black/[0.06] overflow-hidden">
            {filteredTrainers.map((tr) => {
              const statusBadge =
                tr.status === 'Lead Trainer'
                  ? 'bg-[#E6F9F0] text-[#146C43]'
                  : tr.status === 'Part-Time'
                  ? 'bg-[#FFF5E6] text-[#8C5811]'
                  : 'bg-[#F0EFFC] text-[#3F3B99]';
              return (
                <div
                  key={tr.id}
                  onClick={() => setSelectedTrainerDrawer(tr)}
                  className="p-4 hover:bg-[#FAFBFD] transition-colors cursor-pointer space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-10 h-10 rounded-full flex items-center justify-center text-[12.5px] font-bold shrink-0 ${tr.color}`}>
                        {tr.initials}
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-[14.5px] font-semibold text-[#1C1D21] truncate">{tr.name}</h3>
                        <p className="text-[11.5px] text-[#8A8D98] truncate">{tr.email}</p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold shrink-0 ${statusBadge}`}>
                      {tr.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[12px] pt-1 tabular-nums">
                    <div className="flex items-center gap-3 text-[#6E717A]">
                      <span>
                        <strong className="text-[#1C1D21] font-semibold">{tr.assignedClass}</strong>
                      </span>
                      <span>
                        Sessions <strong className="text-[#3F3B99] font-semibold">{tr.sessionsCount}</strong>
                      </span>
                      <span>
                        Rating <strong className="text-[#146C43] font-bold">{tr.rating}%</strong>
                      </span>
                    </div>
                    <span className="text-[#9D113C] font-semibold flex items-center gap-0.5 shrink-0">
                      Profile <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tablet & PC Table List */}
          <div className="hidden md:block overflow-hidden rounded-2xl border border-black/[0.07] bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FAFBFD] border-b border-black/[0.05] text-[11px] font-semibold uppercase tracking-wider text-[#8A8D98]">
                    <th className="py-3.5 px-5">Trainer</th>
                    <th className="py-3.5 px-4">Class</th>
                    <th className="py-3.5 px-4">Department</th>
                    <th className="py-3.5 px-4">Rating</th>
                    <th className="py-3.5 px-4 hidden lg:table-cell">Sessions / Mo</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.05] text-[13px]">
                  {filteredTrainers.map((tr) => {
                    const statusBadge =
                      tr.status === 'Lead Trainer'
                        ? 'bg-[#E6F9F0] text-[#146C43]'
                        : tr.status === 'Part-Time'
                        ? 'bg-[#FFF5E6] text-[#8C5811]'
                        : 'bg-[#F0EFFC] text-[#3F3B99]';
                    return (
                      <tr
                        key={tr.id}
                        onClick={() => setSelectedTrainerDrawer(tr)}
                        className="hover:bg-[#FAFBFD] transition-colors cursor-pointer group"
                      >
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3 min-w-0">
                            <span
                              className={`w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0 ${tr.color}`}
                            >
                              {tr.initials}
                            </span>
                            <div className="min-w-0">
                              <div className="font-semibold text-[#1C1D21] group-hover:text-[#9D113C] transition-colors truncate">
                                {tr.name}
                              </div>
                              <div className="text-[11.5px] text-[#8A8D98] truncate">{tr.email}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-full text-[11.5px] font-semibold ${getClassBadgeColor(tr.assignedClass)}`}>
                            {tr.assignedClass}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap text-[#5A5D67] font-medium">
                          {tr.department}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <span className="font-semibold text-[#146C43] tabular-nums">{tr.rating}%</span>
                            <div className="hidden lg:block w-16 h-1.5 rounded-full bg-[#F4F5F8] overflow-hidden">
                              <div
                                className="h-full rounded-full bg-[#10B981]"
                                style={{ width: `${Math.min(100, Math.max(0, tr.rating))}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 hidden lg:table-cell font-bold text-[#1C1D21] tabular-nums whitespace-nowrap">
                          {tr.sessionsCount} sessions
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${statusBadge}`}>
                            {tr.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-5 text-right whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#9D113C] group-hover:translate-x-0.5 transition-transform">
                            <span>Profile</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
