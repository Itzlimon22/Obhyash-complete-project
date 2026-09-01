'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Upload,
  Download,
  LayoutList,
  Table,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  FileQuestion,
  Layers,
  Eye,
} from 'lucide-react';
import { Question } from '@/lib/types';
import { useQuestions } from '@/hooks/use-questions';
import { QuestionBankHealthBar } from '@/components/admin/questions/question-bank-health-bar';
import { QuestionFiltersPanel } from '@/components/admin/questions/question-filters';
import { MassBulkActions } from '@/components/admin/questions/mass-bulk-actions';
import { QuestionInspectorDrawer } from '@/components/admin/questions/question-inspector-drawer';
import { QuestionList } from '@/components/admin/questions/question-list';
import { QuestionTableView } from '@/components/admin/questions/question-table-view';
import { Pagination } from '@/components/admin/questions/pagination';

export default function AdvancedQuestionBankPage() {
  const router = useRouter();

  const {
    questions,
    isLoading,
    totalCount,
    approvedCount,
    pendingCount,
    rejectedCount,
    totalPages,
    page,
    pageSize,
    filters,
    selectedQuestions,
    fetchQuestions,
    goToPage,
    changePageSize,
    updateFilters,
    clearFilters,
    toggleSelection,
    selectAll,
    clearSelection,
    deleteQuestion,
    deleteSelected,
    updateStatus,
    updateSelectedStatus,
    bulkImport,
    exportQuestions,
    updateSelectedMetadata,
    saveQuestion,
  } = useQuestions({});

  // View state
  const [displayStyle, setDisplayStyle] = useState<'card' | 'table'>('card');
  const [tableFontSize, setTableFontSize] = useState<number>(14);
  const [inspectingQuestion, setInspectingQuestion] = useState<Question | null>(
    null,
  );
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleEdit = (q: Question) => {
    router.push(`/admin/questions/${q.id}`);
  };

  const handleCreate = () => {
    router.push('/admin/questions/new');
  };

  const handleStatusFilterClick = (status: string | null) => {
    updateFilters({ ...filters, status: status || null });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300 pb-24">
      {/* ── Top Master Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-neutral-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 tracking-wider uppercase">
              প্রশ্ন ভাণ্ডার কমান্ড সেন্টার • Question Bank Master
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
            প্রশ্ন ব্যাংক ব্যবস্থাপনা
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-zinc-400 mt-0.5">
            সমগ্র প্ল্যাটফর্মের প্রশ্ন ভাণ্ডার পরীক্ষণ, অনুমোদন, মেটাডাটা রি-অ্যাসাইন ও ফিল্টারিং
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* New Question */}
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={15} />
            <span>নতুন প্রশ্ন তৈরি</span>
          </button>

          {/* Bulk Upload Link */}
          <Link
            href="/admin/questions/bulk-upload"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
          >
            <Upload size={15} />
            <span>বাল্ক আপলোড (Excel/R2)</span>
          </Link>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="px-3.5 py-2 bg-neutral-100 dark:bg-zinc-800 hover:bg-neutral-200 dark:hover:bg-zinc-700 text-neutral-800 dark:text-zinc-200 rounded-xl text-xs font-bold transition border border-neutral-200 dark:border-zinc-700/60 flex items-center gap-1.5"
            >
              <Download size={14} />
              <span>এক্সপোর্ট</span>
            </button>

            {showExportMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 overflow-hidden min-w-[130px] animate-in fade-in">
                <button
                  onClick={() => {
                    exportQuestions('csv');
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-neutral-50 dark:hover:bg-zinc-800 text-neutral-700 dark:text-zinc-300"
                >
                  📊 CSV এক্সেল
                </button>
                <button
                  onClick={() => {
                    exportQuestions('json');
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-neutral-50 dark:hover:bg-zinc-800 text-neutral-700 dark:text-zinc-300 border-t border-neutral-100 dark:border-zinc-800"
                >
                  📄 JSON ফাইল
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Question Bank Health & Quality Bar ── */}
      <QuestionBankHealthBar
        totalCount={totalCount}
        approvedCount={approvedCount}
        pendingCount={pendingCount}
        rejectedCount={rejectedCount}
        onFilterStatus={handleStatusFilterClick}
        activeStatusFilter={filters.status}
      />

      {/* ── Multi-Filter & Search Engine ── */}
      <QuestionFiltersPanel
        filters={filters}
        onFiltersChange={updateFilters}
        onClear={clearFilters}
      />

      {/* ── Mass Bulk Actions Bar (When items selected) ── */}
      <MassBulkActions
        selectedCount={selectedQuestions.size}
        totalCount={totalCount}
        onSelectAll={selectAll}
        onClearSelection={clearSelection}
        onDeleteSelected={deleteSelected}
        onUpdateStatus={updateSelectedStatus}
        onUpdateMetadata={updateSelectedMetadata}
      />

      {/* ── View Controls Bar (Card vs Table + Zoom) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-neutral-500 dark:text-zinc-400">
            দেখানো হচ্ছে: {questions.length} / {totalCount} টি প্রশ্ন
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom Buttons (Table View Only) */}
          {displayStyle === 'table' && (
            <div className="flex items-center gap-1 bg-neutral-100 dark:bg-zinc-850 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setTableFontSize((prev) => Math.max(11, prev - 1))}
                className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-zinc-800 text-neutral-600 dark:text-zinc-400"
                title="Zoom Out Font"
              >
                <ZoomOut size={14} />
              </button>
              <span className="text-[11px] font-mono font-bold px-1 text-neutral-600 dark:text-zinc-400">
                {tableFontSize}px
              </span>
              <button
                type="button"
                onClick={() => setTableFontSize((prev) => Math.min(18, prev + 1))}
                className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-zinc-800 text-neutral-600 dark:text-zinc-400"
                title="Zoom In Font"
              >
                <ZoomIn size={14} />
              </button>
            </div>
          )}

          {/* Style Switcher */}
          <div className="flex items-center gap-1 bg-neutral-100 dark:bg-zinc-850 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setDisplayStyle('card')}
              className={`p-1.5 rounded-lg transition ${
                displayStyle === 'card'
                  ? 'bg-white dark:bg-zinc-800 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-zinc-400'
              }`}
              title="কার্ড ভিউ"
            >
              <LayoutList size={16} />
            </button>
            <button
              type="button"
              onClick={() => setDisplayStyle('table')}
              className={`p-1.5 rounded-lg transition ${
                displayStyle === 'table'
                  ? 'bg-white dark:bg-zinc-800 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-zinc-400'
              }`}
              title="টেবিল ভিউ"
            >
              <Table size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Question List / Table View ── */}
      {displayStyle === 'card' ? (
        <QuestionList
          questions={questions}
          selectedQuestions={selectedQuestions}
          onToggleSelection={toggleSelection}
          onEdit={handleEdit}
          onDelete={deleteQuestion}
          onStatusChange={updateStatus}
          onPreview={(q: Question) => setInspectingQuestion(q)}
        />
      ) : (
        <QuestionTableView
          questions={questions}
          selectedQuestions={selectedQuestions}
          onToggleSelection={toggleSelection}
          onSelectAll={selectAll}
          onEdit={handleEdit}
          onDelete={deleteQuestion}
          fontSize={tableFontSize}
          saveQuestion={saveQuestion}
        />
      )}

      {/* ── Pagination Controls ── */}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        pageSize={pageSize}
        totalCount={totalCount}
        onPageChange={goToPage}
        onPageSizeChange={changePageSize}
      />

      {/* ── Live KaTeX Question Inspector Drawer ── */}
      <QuestionInspectorDrawer
        question={inspectingQuestion}
        onClose={() => setInspectingQuestion(null)}
        onEdit={(q) => {
          setInspectingQuestion(null);
          handleEdit(q);
        }}
        onApprove={(id) => {
          updateStatus(id, 'Approved');
          setInspectingQuestion((prev) =>
            prev ? { ...prev, status: 'Approved' } : null,
          );
        }}
        onReject={(id) => {
          updateStatus(id, 'Rejected');
          setInspectingQuestion((prev) =>
            prev ? { ...prev, status: 'Rejected' } : null,
          );
        }}
        onDelete={(id) => {
          deleteQuestion(id);
          setInspectingQuestion(null);
        }}
      />
    </div>
  );
}
