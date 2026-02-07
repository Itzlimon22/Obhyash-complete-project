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
} from 'lucide-react';
import { Question } from '@/lib/types';
import { useQuestions } from '@/hooks/use-questions';
import { QuestionList } from '@/components/admin/questions/question-list';
import { QuestionForm } from '@/components/admin/questions/question-form';
import { BulkUpload } from '@/components/admin/questions/bulk-upload';
import { Pagination } from '@/components/admin/questions/pagination';
import { QuestionFiltersPanel } from '@/components/admin/questions/question-filters';
import { BulkActions } from '@/components/admin/questions/bulk-actions';
import { MathText, StatusBadge } from '@/components/admin/questions/shared';

export default function QuestionManagementPage() {
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
  } = useQuestions();

  const router = useRouter();

  // View state management
  const [viewMode, setViewMode] = useState<'list' | 'upload' | 'edit'>('list');
  const [editingData, setEditingData] = useState<Partial<Question>>({});
  const [previewData, setPreviewData] = useState<Question | null>(null);

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
    });
    setViewMode('edit');
  };

  const handleSave = async (q: Partial<Question>) => {
    const success = await saveQuestion(q);
    if (success) setViewMode('list');
  };

  const handleImport = async (data: Partial<Question>[]) => {
    const success = await bulkImport(data);
    if (success) setViewMode('list');
    return success;
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* List View */}
      {viewMode === 'list' && (
        <>
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white tracking-tight">
                প্রশ্ন ব্যাংক (Question Bank)
              </h1>
              <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-2">
                পরীক্ষার প্রশ্নপত্র ম্যানেজ এবং রিভিউ করুন।
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/admin/questions/new')}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-900 dark:text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                <Plus size={16} /> নতুন প্রশ্ন
              </button>
              <button
                onClick={() => router.push('/admin/questions/bulk-upload')}
                className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-medium shadow-lg shadow-rose-500/20 transition-all active:scale-95"
              >
                <Upload size={16} /> বাল্ক আপলোড
              </button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    মোট প্রশ্ন
                  </p>
                  <p className="text-3xl font-bold text-neutral-900 dark:text-white mt-2">
                    {stats.total}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                  <FileText
                    size={24}
                    className="text-neutral-600 dark:text-neutral-400"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-emerald-200 dark:border-emerald-900/30 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    Approved
                  </p>
                  <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-400 mt-2">
                    {stats.approved}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <CheckCircle
                    size={24}
                    className="text-emerald-600 dark:text-emerald-400"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-amber-200 dark:border-amber-900/30 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                    Pending
                  </p>
                  <p className="text-3xl font-bold text-amber-700 dark:text-amber-400 mt-2">
                    {stats.pending}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Clock
                    size={24}
                    className="text-amber-600 dark:text-amber-400"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-rose-200 dark:border-rose-900/30 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                    Rejected
                  </p>
                  <p className="text-3xl font-bold text-rose-700 dark:text-rose-400 mt-2">
                    {stats.rejected}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                  <AlertCircle
                    size={24}
                    className="text-rose-600 dark:text-rose-400"
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
          />

          {/* Questions Table */}
          {isLoading ? (
            <div className="py-20 flex justify-center bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
              <Loader2 className="animate-spin text-rose-600" size={32} />
            </div>
          ) : (
            <>
              <QuestionList
                questions={questions}
                selectedQuestions={selectedQuestions}
                onEdit={handleEdit}
                onDelete={deleteQuestion}
                onPreview={setPreviewData}
                onStatusChange={updateStatus}
                onToggleSelection={toggleSelection}
              />

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
        />
      )}

      {/* Preview Modal */}
      {previewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/60 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-start">
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
