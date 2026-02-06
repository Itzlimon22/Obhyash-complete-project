import { useState, useCallback } from 'react';
import {
  getQuestionsPage,
  createQuestion,
  updateQuestion,
  deleteQuestions,
  bulkUpdateQuestionStatus,
  QuestionFilters,
} from '@/services/database';
import { Question, QuestionStatus } from '@/lib/types';
import { toast } from 'sonner';

export interface UseQuestionsOptions {
  initialPage?: number;
  initialPageSize?: number;
  initialFilters?: QuestionFilters;
}

export const useQuestions = (options: UseQuestionsOptions = {}) => {
  const {
    initialPage = 1,
    initialPageSize = 20,
    initialFilters = {},
  } = options;

  // State
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filters, setFilters] = useState<QuestionFilters>(initialFilters);
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
      toast.error('Failed to load questions');
      setQuestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, filters, sortBy, sortOrder]);

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
  const updateFilters = useCallback((newFilters: QuestionFilters) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page when filters change
    setSelectedQuestions(new Set());
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setPage(1);
    setSelectedQuestions(new Set());
  }, []);

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
          toast.error(result.error || 'আপডেট ব্যর্থ হয়েছে');
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
          toast.error(result.error || 'প্রশ্ন তৈরি ব্যর্থ হয়েছে');
          return false;
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('প্রশ্ন সংরক্ষণ করা যায়নি');
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
        toast.error(result.error || 'মুছে ফেলা যায়নি');
      }
    } catch {
      toast.error('মুছে ফেলা যায়নি');
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
        toast.error(result.error || 'মুছে ফেলা যায়নি');
      }
    } catch {
      toast.error('মুছে ফেলা যায়নি');
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
        toast.error(result.error || 'স্ট্যাটাস আপডেট ব্যর্থ হয়েছে');
      }
    } catch {
      toast.error('স্ট্যাটাস আপডেট ব্যর্থ হয়েছে');
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
        toast.error(result.error || 'স্ট্যাটাস আপডেট ব্যর্থ হয়েছে');
      }
    } catch {
      toast.error('স্ট্যাটাস আপডেট ব্যর্থ হয়েছে');
    }
  };

  // Bulk import (keeping for compatibility)
  const bulkImport = async (data: Partial<Question>[]) => {
    try {
      const results = await Promise.all(data.map((q) => createQuestion(q)));
      const successCount = results.filter((r) => r.success).length;

      if (successCount > 0) {
        toast.success(`${successCount} টি প্রশ্ন ইম্পোর্ট করা হয়েছে`);
        await fetchQuestions();
        return true;
      } else {
        toast.error('ইম্পোর্ট ব্যর্থ হয়েছে');
        return false;
      }
    } catch (err) {
      console.error(err);
      toast.error('ইম্পোর্ট ব্যর্থ হয়েছে');
      return false;
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
  };
};
