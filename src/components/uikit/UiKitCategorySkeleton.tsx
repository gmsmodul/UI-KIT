import React from 'react';

export const UiKitCategorySkeleton: React.FC = () => {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Memuat komponen UI KIT">
      {/* Page Title & Quick Jump Header Skeleton */}
      <div className="pb-4 border-b border-gray-200 space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-48 rounded-lg ui-skeleton-shimmer" />
          <div className="h-4.5 w-4.5 rounded-full ui-skeleton-shimmer" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="h-3.5 w-24 rounded ui-skeleton-shimmer" />
          <div className="h-3.5 w-28 rounded ui-skeleton-shimmer" />
          <div className="h-3.5 w-20 rounded ui-skeleton-shimmer" />
        </div>
      </div>

      {/* Section Cards matching UiDocSection geometry */}
      {[1, 2].map((sectionIdx) => (
        <div key={sectionIdx} className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="h-5 w-52 rounded-md ui-skeleton-shimmer" />
            <div className="h-7 w-28 rounded-full ui-skeleton-shimmer" />
          </div>
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-200 flex items-center gap-5">
              <div className="h-3.5 w-12 rounded ui-skeleton-shimmer" />
              <div className="h-3.5 w-10 rounded ui-skeleton-shimmer" />
              <div className="h-3.5 w-12 rounded ui-skeleton-shimmer" />
            </div>
            <div className="p-5 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="h-24 rounded-xl ui-skeleton-shimmer" />
                <div className="h-24 rounded-xl ui-skeleton-shimmer" />
                <div className="h-24 rounded-xl ui-skeleton-shimmer hidden lg:block" />
              </div>
              <div className="h-10 w-full rounded-lg ui-skeleton-shimmer" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
