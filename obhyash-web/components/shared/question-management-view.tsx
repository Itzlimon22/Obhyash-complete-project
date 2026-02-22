'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Upload,
  Loader2,
  X,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  Download,
  LayoutList,
  Table,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Question } from '@/lib/types';
import { useQuestions } from '@/hooks/use-questions';
import { QuestionList } from '@/components/admin/questions/question-list';
import { QuestionTableView } from '@/components/admin/questions/question-table-view';
import { QuestionForm } from '@/components/admin/questions/question-form';
import { BulkUpload } from '@/components/admin/questions/bulk-upload';
import { Pagination } from '@/components/admin/questions/pagination';
import { QuestionFiltersPanel } from '@/components/admin/questions/question-filters';
import { BulkActions } from '@/components/admin/questions/bulk-actions';
import { MathText, StatusBadge } from '@/components/admin/questions/shared';
import { QuestionFilters } from '@/services/database';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface QuestionManagementViewProps {
  title?: string;
  baseFilters?: QuestionFilters;
  basePath?: string; // e.g. '/admin/questions' or '/teacher/questions' - helpful for sub-navigation if we had any
}

export default function QuestionManagementView({
  title = 'প্রশ্ন ব্যাংক (Question Bank)',
  baseFilters = {},
  basePath = '/admin/questions',
}: QuestionManagementViewProps) {
  const {
    questions,
    isLoading,
    totalCount,
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
    saveQuestion,
    deleteQuestion,
    deleteSelected,
    updateStatus,
    updateSelectedStatus,
    bulkImport,
    exportQuestions,
    importProgress,
    updateSelectedMetadata,
  } = useQuestions({ baseFilters });

  const router = useRouter();
  const { user, profile } = useAuth();

  const currentAuthorName =
    profile?.name || user?.email || (baseFilters.author as string) || 'Admin';

  // View state management
  const [viewMode, setViewMode] = useState<'list' | 'upload' | 'edit'>('list');
  const [displayStyle, setDisplayStyle] = useState<'card' | 'table'>('card');
  const [tableFontSize, setTableFontSize] = useState<number>(14);
  const [editingData, setEditingData] = useState<Partial<Question>>({});
  const [previewData, setPreviewData] = useState<Question | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Stats
  const stats = useMemo(
    () => ({
      total: totalCount,
      approved: questions.filter((q) => q.status === 'Approved').length,
      pending: questions.filter((q) => q.status === 'Pending').length,
      rejected: questions.filter((q) => q.status === 'Rejected').length,
    }),
    [questions, totalCount],
  );

  // Initial load
  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleEdit = (q: Question) => {
    setEditingData(q);
    setViewMode('edit');
  };

  const handleCreate = () => {
    setEditingData({
      type: 'MCQ',
      options: ['', '', '', ''],
      difficulty: 'Medium',
      author: currentAuthorName,
      author_name: currentAuthorName,
    });
    setViewMode('edit');
  };

  const handleSave = async (q: Partial<Question>) => {
    // Ensure author is preserved/set
    const questionToSave = {
      ...q,
      author: q.author || currentAuthorName,
      author_name: q.author_name || currentAuthorName,
    };
    const success = await saveQuestion(questionToSave);
    if (success) setViewMode('list');
  };

  const handleImport = async (data: Partial<Question>[]) => {
    // Ensure author is preserved/set for bulk import
    const dataToImport = data.map((q) => ({
      ...q,
      author: currentAuthorName,
      author_name: currentAuthorName,
    }));
    const success = await bulkImport(dataToImport);
    if (success) setViewMode('list');
    return success;
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20 w-full max-w-full box-border">
      {/* List View */}
      {viewMode === 'list' && (
        <>
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-6">
            <h1 className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-white tracking-tight shrink-0">
              {title}
            </h1>
            <div className="grid grid-cols-3 md:flex md:flex-wrap gap-2 md:gap-3 shrink-0">
              <button
                onClick={handleCreate}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-900 dark:text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
              >
                <Plus size={16} /> নতুন প্রশ্ন
              </button>

              {/* Export Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-900 dark:text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
                >
                  <Download size={16} /> এক্সপোর্ট
                </button>
                {showExportMenu && (
                  <div className="absolute right-0 top-full mt-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl z-20 overflow-hidden min-w-[140px] animate-in fade-in slide-in-from-top-2 duration-150">
                    <button
                      onClick={() => {
                        exportQuestions('json');
                        setShowExportMenu(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center gap-2 text-neutral-700 dark:text-neutral-300"
                    >
                      📄 JSON
                    </button>
                    <button
                      onClick={() => {
                        exportQuestions('csv');
                        setShowExportMenu(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center gap-2 text-neutral-700 dark:text-neutral-300 border-t border-neutral-100 dark:border-neutral-800"
                    >
                      📊 CSV
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => setViewMode('upload')}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm font-medium shadow-lg shadow-emerald-700/20 transition-all active:scale-95"
              >
                <Upload size={16} /> বাল্ক আপলোড
              </button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <div className="bg-white dark:bg-neutral-900 rounded-[1.25rem] border border-neutral-200/60 dark:border-neutral-800/60 p-3.5 md:p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] md:text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-[0.1em] opacity-80">
                    মোট প্রশ্ন
                  </p>
                  <p className="text-xl md:text-3xl font-bold text-neutral-900 dark:text-white mt-0.5 md:mt-2">
                    {stats.total}
                  </p>
                </div>
                <div className="w-9 h-9 md:w-12 md:h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                  <FileText
                    size={18}
                    className="text-neutral-600 dark:text-neutral-400"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-[1.25rem] border border-emerald-200/50 dark:border-emerald-900/30 p-3.5 md:p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] md:text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.1em] opacity-80">
                    Approved
                  </p>
                  <p className="text-xl md:text-3xl font-bold text-emerald-700 dark:text-emerald-400 mt-0.5 md:mt-2">
                    {stats.approved}
                  </p>
                </div>
                <div className="w-9 h-9 md:w-12 md:h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <CheckCircle
                    size={18}
                    className="text-emerald-600 dark:text-emerald-400"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-[1.25rem] border border-red-200/50 dark:border-red-900/30 p-3.5 md:p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] md:text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-[0.1em] opacity-80">
                    Pending
                  </p>
                  <p className="text-xl md:text-3xl font-bold text-red-700 dark:text-red-400 mt-0.5 md:mt-2">
                    {stats.pending}
                  </p>
                </div>
                <div className="w-9 h-9 md:w-12 md:h-12 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <Clock
                    size={18}
                    className="text-red-600 dark:text-red-400"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-[1.25rem] border border-red-200/50 dark:border-red-900/30 p-3.5 md:p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] md:text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-[0.1em] opacity-80">
                    Rejected
                  </p>
                  <p className="text-xl md:text-3xl font-bold text-red-700 dark:text-red-400 mt-0.5 md:mt-2">
                    {stats.rejected}
                  </p>
                </div>
                <div className="w-9 h-9 md:w-12 md:h-12 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <AlertCircle
                    size={18}
                    className="text-red-600 dark:text-red-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <QuestionFiltersPanel
            filters={filters}
            onFiltersChange={updateFilters}
            onClear={clearFilters}
          />

          {/* Bulk Actions */}
          <BulkActions
            selectedCount={selectedQuestions.size}
            totalCount={questions.length}
            onSelectAll={selectAll}
            onClearSelection={clearSelection}
            onDeleteSelected={deleteSelected}
            onUpdateStatus={updateSelectedStatus}
            onUpdateMetadata={updateSelectedMetadata}
          />

          {/* View Toggles & Table Font Size */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2 mt-4">
            <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg">
              <button
                onClick={() => setDisplayStyle('card')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  displayStyle === 'card'
                    ? 'bg-white dark:bg-neutral-900 shadow text-neutral-900 dark:text-white'
                    : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
                }`}
              >
                <LayoutList size={16} /> কার্ড ভিউ
              </button>
              <button
                onClick={() => setDisplayStyle('table')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  displayStyle === 'table'
                    ? 'bg-white dark:bg-neutral-900 shadow text-neutral-900 dark:text-white'
                    : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
                }`}
              >
                <Table size={16} /> টেবিল ভিউ
              </button>
            </div>

            {displayStyle === 'table' && (
              <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 p-1.5 rounded-xl shadow-inner border border-neutral-200 dark:border-neutral-700">
                <span className="text-xs font-bold text-neutral-500 px-2 uppercase tracking-wider">
                  ফন্ট সাইজ: {tableFontSize}px
                </span>
                <button
                  onClick={() => setTableFontSize((f) => Math.max(10, f - 1))}
                  className="p-1.5 hover:bg-white dark:hover:bg-neutral-700 rounded-md text-neutral-600 dark:text-neutral-300 shadow-sm border border-transparent hover:border-neutral-200 dark:hover:border-neutral-600 transition-all active:scale-95"
                >
                  <ZoomOut size={16} />
                </button>
                <button
                  onClick={() => setTableFontSize((f) => Math.min(24, f + 1))}
                  className="p-1.5 hover:bg-white dark:hover:bg-neutral-700 rounded-md text-neutral-600 dark:text-neutral-300 shadow-sm border border-transparent hover:border-neutral-200 dark:hover:border-neutral-600 transition-all active:scale-95"
                >
                  <ZoomIn size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Questions Table */}
          {isLoading ? (
            <div className="w-full py-20 flex justify-center bg-white dark:bg-neutral-900 rounded-t-2xl sm:rounded-xl rounded-b-none sm:rounded-b-xl animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 border border-neutral-200 dark:border-neutral-800">
              <Loader2 className="animate-spin text-red-600" size={32} />
            </div>
          ) : (
            <>
              {displayStyle === 'card' ? (
                <QuestionList
                  questions={questions}
                  selectedQuestions={selectedQuestions}
                  onEdit={handleEdit}
                  onDelete={deleteQuestion}
                  onPreview={setPreviewData}
                  onStatusChange={updateStatus}
                  onToggleSelection={toggleSelection}
                />
              ) : (
                <QuestionTableView
                  questions={questions}
                  selectedQuestions={selectedQuestions}
                  onEdit={handleEdit}
                  onDelete={deleteQuestion}
                  onToggleSelection={toggleSelection}
                  onSelectAll={() =>
                    questions.length > 0 &&
                    selectedQuestions.size === questions.length
                      ? clearSelection()
                      : selectAll()
                  }
                  fontSize={tableFontSize}
                  saveQuestion={saveQuestion}
                />
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  pageSize={pageSize}
                  totalCount={totalCount}
                  onPageChange={goToPage}
                  onPageSizeChange={changePageSize}
                />
              )}
            </>
          )}
        </>
      )}

      {/* Edit View */}
      {viewMode === 'edit' && (
        <QuestionForm
          initialData={editingData}
          onSave={handleSave}
          onCancel={() => setViewMode('list')}
        />
      )}

      {/* Upload View */}
      {viewMode === 'upload' && (
        <BulkUpload
          onImport={handleImport}
          onCancel={() => setViewMode('list')}
          importProgress={importProgress}
        />
      )}

      {/* Preview Modal */}
      {previewData && (
        <Dialog
          open={!!previewData}
          onOpenChange={(open) => {
            if (!open) setPreviewData(null);
          }}
        >
          <DialogContent
            className="sm:max-w-2xl p-0 overflow-hidden flex flex-col"
            showCloseButton={false}
          >
            <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-start shrink-0">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-neutral-400">
                    #{previewData.id}
                  </span>
                  <StatusBadge status={previewData.status} />
                </div>
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                  প্রশ্ন প্রিভিউ
                </h2>
              </div>
              <button
                onClick={() => setPreviewData(null)}
                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="text-lg font-medium text-neutral-900 dark:text-neutral-100 leading-relaxed bg-neutral-50 dark:bg-neutral-950 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800">
                <MathText
                  text={previewData.question || previewData.question || ''}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {previewData.options?.map((opt, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg border ${opt === previewData.correctAnswer ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800' : 'bg-white border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800'} flex items-center gap-3`}
                  >
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${opt === previewData.correctAnswer ? 'bg-emerald-500 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'}`}
                    >
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="text-sm text-neutral-900 dark:text-neutral-200">
                      {opt}
                    </span>
                  </div>
                ))}
              </div>

              {/* Explanation Section */}
              {(previewData.explanation || previewData.explanationImageUrl) && (
                <div className="mt-6 p-4 rounded-xl border border-emerald-100 bg-emerald-50/50 dark:border-emerald-900/30 dark:bg-emerald-900/10">
                  <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-300 mb-3 block">
                    ব্যাখ্যা / সমাধান
                  </h3>
                  {previewData.explanationImageUrl && (
                    <div className="mb-4 w-full md:w-1/2 rounded-lg overflow-hidden border border-emerald-100 dark:border-emerald-800 bg-white dark:bg-neutral-900">
                      <img
                        src={previewData.explanationImageUrl}
                        alt="Explanation"
                        className="w-full h-auto object-contain"
                      />
                    </div>
                  )}
                  {previewData.explanation && (
                    <div className="text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed">
                      <MathText text={previewData.explanation} />
                    </div>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
