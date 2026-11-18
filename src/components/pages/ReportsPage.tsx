import React, { useState } from 'react';
import { Download, Plus, Printer, Filter } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PASTEL_THEMES } from '../../constants/theme';
import { ReportItem } from '../../types';
import { SplitFilterButton } from '../ui/SplitFilterButton';
import { ACTION_BTN_PRIMARY, ACTION_BTN_SECONDARY } from '../../constants/buttonStyles';

export const ReportsPage: React.FC = () => {
  const {
    reportsList,
    handleDownloadReportCsv,
    setIsGenerateReportOpen,
  } = useApp();

  const [selectedReportId, setSelectedReportId] = useState<string>(reportsList[0]?.id || 'RPT-01');
  const [reportCategoryFilter, setReportCategoryFilter] = useState<string>('All');

  const filteredReports = reportsList.filter(
    (r) => reportCategoryFilter === 'All' || r.category === reportCategoryFilter
  );

  const activeReport: ReportItem | undefined =
    reportsList.find((r) => r.id === selectedReportId) || filteredReports[0] || reportsList[0];

  return (
    <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 md:pb-6 border-b border-black/[0.05]">
        <div className="hidden md:block">
          <h1 className="text-[24px] font-semibold tracking-tight text-[#1C1D21]">Reports</h1>
        </div>

        <div className="flex items-center justify-end gap-2.5 w-full md:w-auto">
          <button
            onClick={() => activeReport && handleDownloadReportCsv(activeReport)}
            className={ACTION_BTN_SECONDARY}
          >
            <Download className="w-4 h-4 shrink-0" />
            <span className="sm:hidden">CSV</span>
            <span className="hidden sm:inline">Quick CSV</span>
          </button>
          <button
            onClick={() => setIsGenerateReportOpen(true)}
            className={ACTION_BTN_PRIMARY}
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span className="sm:hidden">Generate</span>
            <span className="hidden sm:inline">Generate Report</span>
          </button>
        </div>
      </div>

      {/* Unified 3-Column Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-black/[0.06] border border-black/[0.06] rounded-2xl overflow-hidden">
        <div className="p-4 sm:p-5 bg-[#F0EFFC]">
          <span className="text-[12px] font-semibold text-[#3F3B99]">Compiled Reports</span>
          <div className="text-[24px] font-bold text-[#1C1D21] mt-1.5 tabular-nums">{reportsList.length} Documents</div>
          <p className="text-[11.5px] text-[#5854A8] mt-1">Term 1 · Academic Year 2026</p>
        </div>
        <div className="p-4 sm:p-5 bg-[#E6F9F0]">
          <span className="text-[12px] font-semibold text-[#146C43]">Verified Gradebooks</span>
          <div className="text-[24px] font-bold text-[#146C43] mt-1.5 tabular-nums">4 / 4 Classes</div>
          <p className="text-[11.5px] text-[#35684E] mt-1">100% assessment records synced</p>
        </div>
        <div className="p-4 sm:p-5 bg-[#FEF1F5]">
          <span className="text-[12px] font-semibold text-[#9D113C]">Export Formats</span>
          <div className="text-[24px] font-bold text-[#9D113C] mt-1.5">PDF &amp; CSV</div>
          <p className="text-[11.5px] text-[#7D3A51] mt-1">Ready for faculty &amp; parent distribution</p>
        </div>
      </div>

      {/* Category Filter Split Button */}
      <div className="flex items-center justify-end sm:justify-start">
        <SplitFilterButton
          value={reportCategoryFilter}
          onChange={setReportCategoryFilter}
          prefix="Category"
          icon={Filter}
          variant="surface"
          ariaLabel="Filter kategori laporan"
          options={['All', 'Academic', 'Attendance', 'Assessments', 'Advisory'].map((cat) => ({
            value: cat,
            label: cat,
            mobileLabel: cat,
          }))}
        />
      </div>

      {/* 12-Col Layout: Left Hairline Report List (7 Cols) | Right Document Preview (5 Cols) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-7">
        <div className="md:col-span-7 border border-black/[0.07] rounded-2xl bg-white divide-y divide-black/[0.06] overflow-hidden self-start">
          {filteredReports.map((rep) => {
            const theme = PASTEL_THEMES[rep.theme] || PASTEL_THEMES.periwinkle;
            const isSelected = activeReport?.id === rep.id;
            return (
              <div
                key={rep.id}
                onClick={() => setSelectedReportId(rep.id)}
                className={`p-4 sm:p-5 cursor-pointer transition-colors ${
                  isSelected ? theme.bg : 'hover:bg-[#FAFBFD]'
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-[12px] text-[#6E717A]">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${theme.dot}`} />
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${isSelected ? theme.header : theme.bg} ${theme.text}`}>{rep.classCode}</span>
                    <span aria-hidden="true">·</span>
                    <span>{rep.category}</span>
                  </div>
                  <span className={`font-semibold ${theme.text}`}>{rep.format}</span>
                </div>

                <h3 className="text-[15.5px] font-semibold text-[#1C1D21] mt-1.5">{rep.title}</h3>
                <p className="text-[12.5px] text-[#6E717A] mt-1 line-clamp-2">{rep.summary}</p>

                <div className="flex items-center justify-between text-[11.5px] text-[#8A8D98] mt-2.5 tabular-nums">
                  <span>Generated: {rep.generatedDate}</span>
                  <span className="font-semibold text-[#1C1D21]">Mean Score: {rep.metrics.avgScore}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right 5 Cols: Flat Single-Elevation Report Document Inspector */}
        {activeReport && (
          <div className="md:col-span-5 bg-white rounded-2xl p-6 border border-black/[0.07] space-y-5 self-start">
            <div className="flex items-start justify-between gap-2 pb-4 border-b border-black/[0.06]">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8A8D98]">
                  Report Document Preview
                </span>
                <h2 className="text-[17px] font-semibold text-[#1C1D21] mt-1">{activeReport.title}</h2>
                <p className="text-[12px] text-[#6E717A] mt-0.5">
                  {activeReport.classCode} · {activeReport.format} · {activeReport.generatedDate}
                </p>
              </div>
              <span className="text-[11.5px] font-semibold text-[#146C43] shrink-0">
                {activeReport.status}
              </span>
            </div>

            <div className="grid grid-cols-3 divide-x divide-black/[0.06] border border-black/[0.06] rounded-xl text-center overflow-hidden">
              <div className="p-3 bg-[#F0EFFC]">
                <div className="text-[11px] font-medium text-[#3F3B99]">Mean Score</div>
                <div className="text-[16px] font-bold text-[#1C1D21] mt-0.5 tabular-nums">{activeReport.metrics.avgScore}</div>
              </div>
              <div className="p-3 bg-[#E6F9F0]">
                <div className="text-[11px] font-medium text-[#146C43]">Attendance</div>
                <div className="text-[16px] font-bold text-[#146C43] mt-0.5 tabular-nums">{activeReport.metrics.attendance}</div>
              </div>
              <div className="p-3 bg-[#FEF1F5]">
                <div className="text-[11px] font-medium text-[#9D113C]">Pass Rate</div>
                <div className="text-[16px] font-bold text-[#9D113C] mt-0.5 tabular-nums">{activeReport.metrics.passRate}</div>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <div className="text-[12px] font-semibold text-[#1C1D21]">Executive Summary</div>
              <p className="text-[12.5px] text-[#5A5D67] leading-relaxed">{activeReport.summary}</p>
              <div className="text-[11.5px] text-[#8A8D98] pt-2.5 border-t border-black/[0.05]">
                Prepared by: <strong className="text-[#1C1D21]">Rasengan</strong> · Servolution Faculty
              </div>
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                onClick={() => handleDownloadReportCsv(activeReport)}
                className={`flex-1 ${ACTION_BTN_PRIMARY}`}
              >
                <Download className="w-4 h-4 shrink-0" />
                <span className="sm:hidden">Download</span>
                <span className="hidden sm:inline">Download CSV</span>
              </button>
              <button
                onClick={() => window.print()}
                className={ACTION_BTN_SECONDARY}
              >
                <Printer className="w-4 h-4 sm:hidden shrink-0" />
                <span className="sm:hidden">Print</span>
                <span className="hidden sm:inline">Print PDF</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
