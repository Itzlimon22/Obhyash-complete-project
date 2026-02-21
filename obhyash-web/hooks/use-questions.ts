import { useState, useCallback } from 'react';
import {
  getQuestionsPage,
  createQuestion,
  updateQuestion,
  deleteQuestions,
  bulkUpdateQuestionStatus,
  bulkUpdateMetadata,
  QuestionFilters,
} from '@/services/database';
import { Question, QuestionStatus } from '@/lib/types';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/error-utils';

export interface UseQuestionsOptions {
  initialPage?: number;
  initialPageSize?: number;
  initialFilters?: QuestionFilters;
  baseFilters?: QuestionFilters; // Added baseFilters to enforce restrictions
}

export const useQuestions = (options: UseQuestionsOptions = {}) => {
  const {
    initialPage = 1,
    initialPageSize = 20,
    initialFilters = {},
    baseFilters = {}, // Default to empty object
  } = options;

  // State
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  // Initialize filters with baseFilters
  const [filters, setFilters] = useState<QuestionFilters>({
    ...initialFilters,
    ...baseFilters,
  });
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(
    new Set(),
  );

  // Fetch questions with pagination
  const fetchQuestions = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getQuestionsPage(
        page,
        pageSize,
        filters,
        sortBy,
        sortOrder,
      );

      setQuestions(response.questions);
      setTotalCount(response.totalCount);
      setTotalPages(response.totalPages);
    } catch (err) {
      console.error('Fetch error:', err);
      toast.error(getErrorMessage(err));
      setQuestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, filters, sortBy, sortOrder]); // filters already contains baseFilters due to state initialization and updates

  // Pagination controls
  const goToPage = useCallback((newPage: number) => {
    setPage(newPage);
    setSelectedQuestions(new Set()); // Clear selection on page change
  }, []);

  const nextPage = useCallback(() => {
    setPage((prev) => Math.min(prev + 1, totalPages));
    setSelectedQuestions(new Set());
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setPage((prev) => Math.max(prev - 1, 1));
    setSelectedQuestions(new Set());
  }, []);

  const changePageSize = useCallback((newSize: number) => {
    setPageSize(newSize);
    setPage(1); // Reset to first page when changing page size
    setSelectedQuestions(new Set());
  }, []);

  // Filter controls
  const updateFilters = useCallback(
    (newFilters: QuestionFilters) => {
      setFilters({ ...newFilters, ...baseFilters }); // Ensure baseFilters are always applied
      setPage(1); // Reset to first page when filters change
      setSelectedQuestions(new Set());
    },
    [baseFilters],
  );

  const clearFilters = useCallback(() => {
    setFilters({ ...baseFilters }); // Reset to baseFilters instead of empty
    setPage(1);
    setSelectedQuestions(new Set());
  }, [baseFilters]);

  // Sorting controls
  const updateSort = useCallback((field: string, order: 'asc' | 'desc') => {
    setSortBy(field);
    setSortOrder(order);
  }, []);

  // Selection controls
  const toggleSelection = useCallback((id: string) => {
    setSelectedQuestions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedQuestions(new Set(questions.map((q) => q.id)));
  }, [questions]);

  const clearSelection = useCallback(() => {
    setSelectedQuestions(new Set());
  }, []);

  // CRUD Operations
  const saveQuestion = async (question: Partial<Question>) => {
    try {
      if (question.id) {
        // Update existing
        const result = await updateQuestion(question.id, question);
        if (result.success) {
          toast.success('প্রশ্ন আপডেট করা হয়েছে');
          await fetchQuestions();
          return true;
        } else {
          toast.error(getErrorMessage(result.error));
          return false;
        }
      } else {
        // Create new
        const result = await createQuestion(question);
        if (result.success) {
          toast.success('নতুন প্রশ্ন তৈরি করা হয়েছে');
          await fetchQuestions();
          return true;
        } else {
          toast.error(getErrorMessage(result.error));
          return false;
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(getErrorMessage(err));
      return false;
    }
  };

  const deleteQuestion = async (id: string) => {
    try {
      const result = await deleteQuestions([id]);
      if (result.success) {
        setQuestions((prev) => prev.filter((q) => q.id !== id));
        setTotalCount((prev) => prev - 1);
        toast.success('প্রশ্নটি মুছে ফেলা হয়েছে');
      } else {
        toast.error(getErrorMessage(result.error));
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const deleteSelected = async () => {
    if (selectedQuestions.size === 0) {
      toast.error('কোন প্রশ্ন নির্বাচন করা হয়নি');
      return;
    }

    try {
      const result = await deleteQuestions(Array.from(selectedQuestions));
      if (result.success) {
        toast.success(`${result.deletedCount} টি প্রশ্ন মুছে ফেলা হয়েছে`);
        setSelectedQuestions(new Set());
        await fetchQuestions();
      } else {
        toast.error(getErrorMessage(result.error));
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const updateStatus = async (id: string, status: QuestionStatus) => {
    try {
      const result = await bulkUpdateQuestionStatus([id], status);
      if (result.success) {
        setQuestions((prev) =>
          prev.map((q) => (q.id === id ? { ...q, status } : q)),
        );
        toast.success(`স্ট্যাটাস পরিবর্তন: ${status}`);
      } else {
        toast.error(getErrorMessage(result.error));
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const updateSelectedStatus = async (status: QuestionStatus) => {
    if (selectedQuestions.size === 0) {
      toast.error('কোন প্রশ্ন নির্বাচন করা হয়নি');
      return;
    }

    try {
      const result = await bulkUpdateQuestionStatus(
        Array.from(selectedQuestions),
        status,
      );
      if (result.success) {
        toast.success(
          `${result.updatedCount} টি প্রশ্নের স্ট্যাটাস আপডেট হয়েছে`,
        );
        setSelectedQuestions(new Set());
        await fetchQuestions();
      } else {
        toast.error(getErrorMessage(result.error));
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  // Bulk import: sequential with progress tracking
  const [importProgress, setImportProgress] = useState<{
    total: number;
    completed: number;
    failed: number;
    failedRows: number[];
    isImporting: boolean;
  }>({ total: 0, completed: 0, failed: 0, failedRows: [], isImporting: false });

  const bulkImport = async (data: Partial<Question>[]) => {
    const total = data.length;
    setImportProgress({
      total,
      completed: 0,
      failed: 0,
      failedRows: [],
      isImporting: true,
    });

    let completed = 0;
    let failed = 0;
    const failedRows: number[] = [];

    for (let i = 0; i < data.length; i++) {
      try {
        const result = await createQuestion(data[i]);
        if (result.success) {
          completed++;
        } else {
          failed++;
          failedRows.push(i + 1);
        }
      } catch {
        failed++;
        failedRows.push(i + 1);
      }
      setImportProgress({
        total,
        completed,
        failed,
        failedRows: [...failedRows],
        isImporting: true,
      });
    }

    setImportProgress({
      total,
      completed,
      failed,
      failedRows,
      isImporting: false,
    });

    if (completed > 0) {
      toast.success(
        `${completed} টি প্রশ্ন ইম্পোর্ট হয়েছে${failed > 0 ? `, ${failed} টি ব্যর্থ` : ''}`,
      );
      await fetchQuestions();
      return true;
    } else {
      toast.error('ইম্পোর্ট ব্যর্থ হয়েছে');
      return false;
    }
  };

  // Batch update metadata (subject, chapter, topic) for selected questions — with undo
  const updateSelectedMetadata = async (fields: {
    subject?: string;
    chapter?: string;
    topic?: string;
  }) => {
    if (selectedQuestions.size === 0) {
      toast.error('কোন প্রশ্ন নির্বাচন করা হয়নি');
      return;
    }

    // Snapshot old values for undo
    const ids = Array.from(selectedQuestions);
    const oldValues = new Map<
      string,
      { subject: string; chapter: string; topic: string }
    >();
    questions
      .filter((q) => ids.includes(q.id))
      .forEach((q) => {
        oldValues.set(q.id, {
          subject: q.subject || '',
          chapter: q.chapter || '',
          topic: q.topic || '',
        });
      });

    try {
      const result = await bulkUpdateMetadata(ids, fields);
      if (result.success) {
        const parts: string[] = [];
        if (fields.subject) parts.push(`বিষয়: ${fields.subject}`);
        if (fields.chapter) parts.push(`অধ্যায়: ${fields.chapter}`);
        if (fields.topic) parts.push(`টপিক: ${fields.topic}`);

        toast.success(
          `${result.updatedCount} টি প্রশ্নের ${parts.join(', ')} আপডেট হয়েছে`,
          {
            duration: 8000,
            action: {
              label: '↩ আনডু',
              onClick: async () => {
                // Restore per question with its original values
                let restored = 0;
                for (const [id, old] of oldValues) {
                  const restoreFields: {
                    subject?: string;
                    chapter?: string;
                    topic?: string;
                  } = {};
                  if (fields.subject !== undefined)
                    restoreFields.subject = old.subject;
                  if (fields.chapter !== undefined)
                    restoreFields.chapter = old.chapter;
                  if (fields.topic !== undefined)
                    restoreFields.topic = old.topic;
                  const r = await bulkUpdateMetadata([id], restoreFields);
                  if (r.success) restored++;
                }
                toast.success(
                  `${restored} টি প্রশ্ন পূর্বাবস্থায় ফিরিয়ে আনা হয়েছে`,
                );
                await fetchQuestions();
              },
            },
          },
        );
        setSelectedQuestions(new Set());
        await fetchQuestions();
      } else {
        toast.error(getErrorMessage(result.error));
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  // Export filtered questions as JSON or CSV
  const exportQuestions = async (format: 'json' | 'csv' = 'json') => {
    try {
      toast.info('এক্সপোর্ট হচ্ছে...');
      // Fetch all questions matching current filters (up to 10k, no pagination)
      const response = await getQuestionsPage(
        1,
        10000,
        filters,
        sortBy,
        sortOrder,
      );
      const data = response.questions;

      if (data.length === 0) {
        toast.error('এক্সপোর্ট করার মতো কোনো প্রশ্ন নেই');
        return;
      }

      // Map to flat export format
      const exportRows = data.map((q) => ({
        question: q.question || '',
        option1: q.options?.[0] || '',
        option2: q.options?.[1] || '',
        option3: q.options?.[2] || '',
        option4: q.options?.[3] || '',
        answer:
          q.correctAnswerIndex !== undefined
            ? String.fromCharCode(65 + q.correctAnswerIndex)
            : '',
        explanation: q.explanation || '',
        subject: q.subject || '',
        chapter: q.chapter || '',
        topic: q.topic || '',
        difficulty: q.difficulty || '',
        stream: q.stream || '',
        section: q.section || q.division || '',
        examType: q.examType || '',
        institute: q.institutes?.join(',') || '',
        year: q.years?.join(',') || '',
        status: q.status || '',
      }));

      let blob: Blob;
      let fileName: string;

      if (format === 'csv') {
        const Papa = (await import('papaparse')).default;
        const csv = Papa.unparse(exportRows);
        blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }); // BOM for Bengali
        fileName = `questions_export_${new Date().toISOString().slice(0, 10)}.csv`;
      } else {
        const json = JSON.stringify(exportRows, null, 2);
        blob = new Blob([json], { type: 'application/json;charset=utf-8' });
        fileName = `questions_export_${new Date().toISOString().slice(0, 10)}.json`;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);

      toast.success(`${data.length} টি প্রশ্ন এক্সপোর্ট হয়েছে`);
    } catch (err) {
      console.error('Export error:', err);
      toast.error(getErrorMessage(err));
    }
  };

  return {
    // Data
    questions,
    isLoading,
    totalCount,
    totalPages,
    page,
    pageSize,
    filters,
    sortBy,
    sortOrder,
    selectedQuestions,
    importProgress,

    // Pagination
    goToPage,
    nextPage,
    prevPage,
    changePageSize,

    // Filters
    updateFilters,
    clearFilters,

    // Sorting
    updateSort,

    // Selection
    toggleSelection,
    selectAll,
    clearSelection,

    // CRUD
    fetchQuestions,
    saveQuestion,
    deleteQuestion,
    deleteSelected,
    updateStatus,
    updateSelectedStatus,
    bulkImport,
    exportQuestions,
    updateSelectedMetadata,
  };
};
