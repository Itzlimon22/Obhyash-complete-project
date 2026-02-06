import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  pageSize,
  totalCount,
  onPageChange,
  onPageSizeChange,
}) => {
  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push('...');
      }

      // Show pages around current
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800">
      {/* Results Info */}
      <div className="text-sm text-neutral-600 dark:text-neutral-400">
        দেখাচ্ছে{' '}
        <span className="font-medium text-neutral-900 dark:text-white">
          {startItem}
        </span>{' '}
        থেকে{' '}
        <span className="font-medium text-neutral-900 dark:text-white">
          {endItem}
        </span>{' '}
        মোট{' '}
        <span className="font-medium text-neutral-900 dark:text-white">
          {totalCount}
        </span>{' '}
        টির মধ্যে
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center gap-2">
        {/* Previous Button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft
            size={18}
            className="text-neutral-600 dark:text-neutral-400"
          />
        </button>

        {/* Page Numbers */}
        <div className="hidden sm:flex items-center gap-1">
          {pageNumbers.map((page, index) =>
            page === '...' ? (
              <span
                key={`ellipsis-${index}`}
                className="px-3 py-2 text-neutral-400"
              >
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page as number)}
                className={`min-w-[40px] px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                  currentPage === page
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/20'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800'
                }`}
              >
                {page}
              </button>
            ),
          )}
        </div>

        {/* Mobile: Simple page indicator */}
        <div className="sm:hidden px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {currentPage} / {totalPages}
        </div>

        {/* Next Button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Next page"
        >
          <ChevronRight
            size={18}
            className="text-neutral-600 dark:text-neutral-400"
          />
        </button>

        {/* Page Size Selector */}
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="ml-2 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm font-medium text-neutral-700 dark:text-neutral-300 focus:ring-2 focus:ring-rose-500 outline-none cursor-pointer"
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>
    </div>
  );
};
