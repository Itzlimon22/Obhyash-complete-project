'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Search,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  Sparkles,
  Zap,
  BookOpen,
  Filter,
  CheckCircle2,
  X,
  Layers,
  RefreshCw,
  Edit3,
  FileText,
  HelpCircle,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Clock,
  Eye,
  SlidersHorizontal,
  CheckSquare,
  Square,
  ArrowUpDown,
  ListChecks,
  Upload,
  Download,
  FileSpreadsheet,
  FileCode,
  FileCheck,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { LiveExam, Question } from '@/lib/types';
import {
  getLiveExam,
  getLiveExamQuestions,
  addQuestionToLiveExam,
  addQuestionsBatchToLiveExam,
  swapLiveExamQuestion,
  removeQuestionFromLiveExam,
  reorderLiveExamQuestions,
  autoAssignQuestionsByBlueprint,
  BlueprintRule,
} from '@/services/live-exam-admin-service';
import { getQuestionsPage, createQuestion } from '@/services/question-service';
import { getHscSubjectList, getHscChapterList } from '@/lib/data/hsc-helpers';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { MathRenderer } from '@/components/common/MathRenderer';

export default function LiveExamBuilder({ examId }: { examId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const basePath = pathname.startsWith('/teacher')
    ? '/teacher/live-exams'
    : '/admin/live-exams';

  const [exam, setExam] = useState<LiveExam | null>(null);
  const [examQuestions, setExamQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- Right Panel (Question Bank) State ---
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [chapterFilter, setChapterFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [hideAddedFilter, setHideAddedFilter] = useState(true);
  const [bankQuestions, setBankQuestions] = useState<Question[]>([]);
  const [totalBankCount, setTotalBankCount] = useState(0);
  const [bankPage, setBankPage] = useState(1);
  const [bankPageSize, setBankPageSize] = useState(50);
  const [isCustomPageSize, setIsCustomPageSize] = useState(false);
  const [customPageSizeInput, setCustomPageSizeInput] = useState('');
  const [jumpToPageInput, setJumpToPageInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedBankIds, setSelectedBankIds] = useState<Set<string>>(new Set());
  const [isBatchAdding, setIsBatchAdding] = useState(false);

  // --- Swapping State ---
  const [swappingMapping, setSwappingMapping] = useState<any | null>(null);
  const [swapSearchQuery, setSwapSearchQuery] = useState('');
  const [swapCandidates, setSwapCandidates] = useState<Question[]>([]);
  const [isSwapSearching, setIsSwapSearching] = useState(false);

  // --- Blueprint Auto-Generator State ---
  const [showBlueprintModal, setShowBlueprintModal] = useState(false);
  const [blueprintRules, setBlueprintRules] = useState<BlueprintRule[]>([
    { subject: '', chapter: '', difficulty: '', count: 10 },
  ]);
  const [isGeneratingBlueprint, setIsGeneratingBlueprint] = useState(false);

  // --- Quick Create Question Modal State ---
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreatingQuestion, setIsCreatingQuestion] = useState(false);
  const [newQStem, setNewQStem] = useState('');
  const [newQOptions, setNewQOptions] = useState<string[]>(['', '', '', '']);
  const [newQCorrectIndex, setNewQCorrectIndex] = useState<number>(0);
  const [newQExplanation, setNewQExplanation] = useState('');
  const [newQSubject, setNewQSubject] = useState('');
  const [newQChapter, setNewQChapter] = useState('');
  const [newQDifficulty, setNewQDifficulty] = useState('Medium');

  // --- Bulk Upload Modal State (Excel / CSV / JSON / Raw Text) ---
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkTab, setBulkTab] = useState<'file' | 'text'>('file');
  const [bulkRawText, setBulkRawText] = useState('');
  const [bulkParsedQuestions, setBulkParsedQuestions] = useState<Partial<Question>[]>([]);
  const [bulkParseErrors, setBulkParseErrors] = useState<string[]>([]);
  const [isBulkUploading, setIsBulkUploading] = useState(false);

  // --- Assigned Filter/Search State ---
  const [assignedFilterText, setAssignedFilterText] = useState('');
  const [assignedSubjectFilter, setAssignedSubjectFilter] = useState('all');
  const [expandedSolutions, setExpandedSolutions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchExamData(true);
  }, [examId]);

  useEffect(() => {
    fetchBankQuestions(1, bankPageSize);
  }, [subjectFilter, chapterFilter, difficultyFilter, bankPageSize]);

  const totalBankPages = Math.max(1, Math.ceil(totalBankCount / bankPageSize));

  const fetchExamData = async (isInitial: boolean = false) => {
    try {
      if (isInitial) setIsLoading(true);
      const [examData, questionsData] = await Promise.all([
        getLiveExam(examId),
        getLiveExamQuestions(examId),
      ]);
      if (!examData) {
        toast.error('Exam not found');
        router.push(basePath);
        return;
      }
      setExam(examData);
      setExamQuestions(questionsData);
    } catch (error) {
      if (isInitial) {
        toast.error('Failed to load exam data: ' + String(error));
      }
    } finally {
      if (isInitial) setIsLoading(false);
    }
  };

  const fetchBankQuestions = async (page: number = 1, size: number = bankPageSize) => {
    try {
      setIsSearching(true);
      const res = await getQuestionsPage(page, size, {
        search: searchQuery || undefined,
        subject: subjectFilter || undefined,
        chapter: chapterFilter || undefined,
        difficulty: difficultyFilter || undefined,
        status: 'Approved' as any,
      });
      setBankQuestions(res.questions);
      setTotalBankCount(res.totalCount);
      setBankPage(page);
    } catch (error) {
      toast.error('প্রশ্ন লোড করতে সমস্যা হয়েছে');
    } finally {
      setIsSearching(false);
    }
  };

  const handleBankSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBankQuestions(1, bankPageSize);
  };

  const handlePageChange = (newPage: number) => {
    const targetPage = Math.max(1, Math.min(newPage, totalBankPages));
    fetchBankQuestions(targetPage, bankPageSize);
  };

  const handlePageSizeChange = (newSize: number) => {
    setBankPageSize(newSize);
    setIsCustomPageSize(false);
    fetchBankQuestions(1, newSize);
  };

  const handleCustomPageSizeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(customPageSizeInput);
    if (!parsed || parsed <= 0) {
      toast.warning('সঠিক সংখ্যা লিখুন (যেমন: ১০০, ৩০০, ১০০০)');
      return;
    }
    setBankPageSize(parsed);
    setIsCustomPageSize(true);
    fetchBankQuestions(1, parsed);
  };

  const handleJumpToPageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNum = parseInt(jumpToPageInput);
    if (!pageNum || pageNum < 1 || pageNum > totalBankPages) {
      toast.warning(`১ থেকে ${totalBankPages}-এর মধ্যে পৃষ্ঠা সংখ্যা লিখুন`);
      return;
    }
    handlePageChange(pageNum);
    setJumpToPageInput('');
  };

  // Set of assigned question IDs
  const assignedQuestionIds = useMemo(() => {
    return new Set(examQuestions.map((eq) => eq.question?.id).filter(Boolean));
  }, [examQuestions]);

  // Filtered bank questions (taking hideAdded into account)
  const displayBankQuestions = useMemo(() => {
    if (!hideAddedFilter) return bankQuestions;
    return bankQuestions.filter((q) => !assignedQuestionIds.has(q.id));
  }, [bankQuestions, hideAddedFilter, assignedQuestionIds]);

  // Statistics
  const examStats = useMemo(() => {
    const total = examQuestions.length;
    const subjectsMap: Record<string, number> = {};
    let easy = 0,
      med = 0,
      hard = 0;

    examQuestions.forEach((eq) => {
      const q = eq.question;
      if (!q) return;
      const subj = q.subject || 'অন্যান্য';
      subjectsMap[subj] = (subjectsMap[subj] || 0) + 1;

      const diff = (q.difficulty || '').toLowerCase();
      if (diff === 'easy') easy++;
      else if (diff === 'hard') hard++;
      else med++;
    });

    return { total, subjectsMap, easy, med, hard };
  }, [examQuestions]);

  // --- Handlers: Question Actions with Smooth Optimistic Updates ---
  const handleToggleSwapTarget = (mapping: any) => {
    if (swappingMapping?.mapping_id === mapping.mapping_id) {
      setSwappingMapping(null);
      toast.info('প্রতিস্থাপন মোড বাতিল করা হয়েছে');
    } else {
      setSwappingMapping(mapping);
      if (mapping.question?.subject) {
        setSubjectFilter(mapping.question.subject);
        if (mapping.question.chapter) {
          setChapterFilter(mapping.question.chapter);
        }
      }
      toast.info(
        `#${mapping.serial} নম্বর প্রশ্নটি প্রতিস্থাপনের জন্য সক্রিয় করা হয়েছে। ডানপাশের প্রশ্ন ব্যাংক থেকে পছন্দের প্রশ্নে ক্লিক করুন।`
      );
    }
  };

  const handleAddSingleQuestion = async (question: Question) => {
    if (assignedQuestionIds.has(question.id)) {
      toast.warning('এই প্রশ্নটি ইতিমধ্যেই পরীক্ষায় যুক্ত রয়েছে');
      return;
    }

    // ── IF IN SWAP / REPLACEMENT MODE ──
    if (swappingMapping) {
      const targetMappingId = swappingMapping.mapping_id;
      const targetSerial = swappingMapping.serial;

      // Instant optimistic replacement in place!
      setExamQuestions((prev) =>
        prev.map((eq) =>
          eq.mapping_id === targetMappingId ? { ...eq, question } : eq
        )
      );
      setSwappingMapping(null);

      try {
        await swapLiveExamQuestion(targetMappingId, question.id);
        toast.success(`#${targetSerial} নম্বর প্রশ্নটি সফলভাবে প্রতিস্থাপন করা হয়েছে!`);
        fetchExamData(false);
      } catch (error) {
        toast.error('প্রতিস্থাপন করা যায়নি');
        fetchExamData(false);
      }
      return;
    }

    // ── REGULAR ADD TO BOTTOM ──
    const tempMappingId = 'temp-' + Date.now();
    const serial = examQuestions.length + 1;

    // Instant optimistic update
    setExamQuestions((prev) => [
      ...prev,
      { mapping_id: tempMappingId, serial, points: 1, question },
    ]);

    try {
      await addQuestionToLiveExam(examId, question.id, serial, 1);
      toast.success('প্রশ্ন সফলভাবে যুক্ত হয়েছে!');
      fetchExamData(false);
    } catch (error) {
      toast.error('প্রশ্ন যুক্ত করা যায়নি');
      fetchExamData(false);
    }
  };

  const handleBatchAddSelected = async () => {
    if (selectedBankIds.size === 0) return;
    const idsToAdd = Array.from(selectedBankIds);
    const questionsToAdd = bankQuestions.filter((q) => selectedBankIds.has(q.id));

    // Instant optimistic update
    let curSerial = examQuestions.length + 1;
    const newItems = questionsToAdd.map((q) => ({
      mapping_id: 'temp-' + q.id,
      serial: curSerial++,
      points: 1,
      question: q,
    }));
    setExamQuestions((prev) => [...prev, ...newItems]);
    setSelectedBankIds(new Set());

    try {
      setIsBatchAdding(true);
      const count = await addQuestionsBatchToLiveExam(examId, idsToAdd, 1);
      toast.success(`${count}টি প্রশ্ন সফলভাবে যুক্ত করা হয়েছে!`);
      fetchExamData(false);
    } catch (error) {
      toast.error('বাল্ক যুক্ত করতে সমস্যা হয়েছে');
      fetchExamData(false);
    } finally {
      setIsBatchAdding(false);
    }
  };

  const handleToggleSelectQuestion = (id: string) => {
    const next = new Set(selectedBankIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedBankIds(next);
  };

  const handleSelectAllOnPage = () => {
    const selectable = displayBankQuestions
      .map((q) => q.id)
      .filter((id) => !assignedQuestionIds.has(id));
    if (selectedBankIds.size >= selectable.length && selectable.length > 0) {
      setSelectedBankIds(new Set());
    } else {
      setSelectedBankIds(new Set(selectable));
    }
  };

  const handleRemoveQuestion = async (mappingId: string) => {
    // Instant optimistic removal
    setExamQuestions((prev) =>
      prev
        .filter((eq) => eq.mapping_id !== mappingId)
        .map((eq, idx) => ({ ...eq, serial: idx + 1 }))
    );

    try {
      await removeQuestionFromLiveExam(mappingId, examId);
      toast.success('প্রশ্ন পরীক্ষা থেকে বাদ দেওয়া হয়েছে');
      fetchExamData(false);
    } catch (error) {
      toast.error('প্রশ্ন বাদ দেওয়া যায়নি');
      fetchExamData(false);
    }
  };

  const moveQuestion = async (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === examQuestions.length - 1)
    )
      return;

    const newOrder = [...examQuestions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;

    const updates = newOrder.map((item, i) => ({
      id: item.mapping_id,
      serial: i + 1,
    }));

    setExamQuestions(newOrder);

    try {
      await reorderLiveExamQuestions(updates);
    } catch (error) {
      toast.error('Failed to save order');
      fetchExamData(false);
    }
  };

  const handleSearchSwapCandidates = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!swappingMapping) return;
    try {
      setIsSwapSearching(true);
      const res = await getQuestionsPage(1, 20, {
        search: swapSearchQuery || undefined,
        subject: swappingMapping.question?.subject || undefined,
        status: 'Approved' as any,
      });
      setSwapCandidates(
        res.questions.filter((q) => !assignedQuestionIds.has(q.id)),
      );
    } catch (e) {
      toast.error('বিকল্প প্রশ্ন লোড করা যায়নি');
    } finally {
      setIsSwapSearching(false);
    }
  };

  const handleExecuteSwap = async (newQuestion: Question) => {
    if (!swappingMapping) return;
    const targetMappingId = swappingMapping.mapping_id;

    // Instant optimistic swap
    setExamQuestions((prev) =>
      prev.map((eq) =>
        eq.mapping_id === targetMappingId ? { ...eq, question: newQuestion } : eq
      )
    );
    setSwappingMapping(null);

    try {
      await swapLiveExamQuestion(targetMappingId, newQuestion.id);
      toast.success('প্রশ্নটি সফলভাবে প্রতিস্থাপন করা হয়েছে!');
      fetchExamData(false);
    } catch (e) {
      toast.error('প্রতিস্থাপন করা যায়নি');
      fetchExamData(false);
    }
  };

  // --- Handlers: Blueprint Generator ---
  const handleAddBlueprintRule = () => {
    setBlueprintRules([
      ...blueprintRules,
      { subject: '', chapter: '', difficulty: '', count: 10 },
    ]);
  };

  const handleRemoveBlueprintRule = (index: number) => {
    setBlueprintRules(blueprintRules.filter((_, i) => i !== index));
  };

  const handleUpdateBlueprintRule = (
    index: number,
    field: keyof BlueprintRule,
    value: any,
  ) => {
    const updated = [...blueprintRules];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'subject') {
      updated[index].chapter = '';
    }
    setBlueprintRules(updated);
  };

  const handleRunBlueprint = async (e: React.FormEvent) => {
    e.preventDefault();
    const validRules = blueprintRules.filter((r) => r.subject && r.count > 0);
    if (validRules.length === 0) {
      toast.warning('কমপক্ষে একটি বিষয়ের রুল সম্পূর্ণ করুন');
      return;
    }
    try {
      setIsGeneratingBlueprint(true);
      const added = await autoAssignQuestionsByBlueprint(examId, validRules);
      if (added === 0) {
        toast.warning('নির্বাচিত শর্তাবলীতে কোনো নতুন প্রশ্ন পাওয়া যায়নি');
      } else {
        toast.success(`সফলভাবে ${added}টি প্রশ্ন যুক্ত করা হয়েছে!`);
        setShowBlueprintModal(false);
        fetchExamData(false);
      }
    } catch (e) {
      toast.error('ব্লুপ্রিন্ট তৈরি করতে সমস্যা হয়েছে');
    } finally {
      setIsGeneratingBlueprint(false);
    }
  };

  // --- Handlers: Quick Question Create ---
  const handleQuickCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQStem.trim()) {
      toast.warning('প্রশ্নের বিবরণ লিখুন');
      return;
    }
    const cleanOptions = newQOptions.map((o) => o.trim());
    if (cleanOptions.some((o) => !o)) {
      toast.warning('সবগুলো অপশন পূরণ করুন');
      return;
    }

    try {
      setIsCreatingQuestion(true);
      const res = await createQuestion({
        question: newQStem,
        options: cleanOptions,
        correctAnswerIndex: newQCorrectIndex,
        explanation: newQExplanation,
        subject: newQSubject || exam?.category || 'General',
        chapter: newQChapter || '',
        difficulty: newQDifficulty as any,
        type: 'MCQ',
        status: 'Approved' as any,
      });

      if (res.success && res.id) {
        // Immediately attach to live exam
        const serial = examQuestions.length + 1;
        await addQuestionToLiveExam(examId, res.id, serial, 1);
        toast.success('নতুন প্রশ্ন তৈরি করে পরীক্ষায় যুক্ত করা হয়েছে!');
        setShowCreateModal(false);
        // Reset form
        setNewQStem('');
        setNewQOptions(['', '', '', '']);
        setNewQExplanation('');
        fetchExamData(false);
      } else {
        toast.error('প্রশ্ন সংরক্ষণ করা যায়নি: ' + (res.error || ''));
      }
    } catch (e) {
      toast.error('প্রশ্ন তৈরি করতে সমস্যা হয়েছে');
    } finally {
      setIsCreatingQuestion(false);
    }
  };

  // --- Handlers: Bulk Upload Parsing & Execution ---
  const downloadSampleTemplate = () => {
    const sampleData = [
      {
        question: 'বলের মাত্রা সমীকরণ কোনটি?',
        option1: '[MLT^-2]',
        option2: '[ML^2T^-2]',
        option3: '[MLT^-1]',
        option4: '[ML^-1T^-2]',
        correct_answer: 'A',
        explanation: 'আমরা জানি, বল F = ma = M * LT^-2 = [MLT^-2]',
        subject: 'পদার্থবিজ্ঞান',
        chapter: 'বলবিদ্যা',
        difficulty: 'Medium',
      },
      {
        question: 'হাইড্রোজেনের পারমাণবিক সংখ্যা কত?',
        option1: '1',
        option2: '2',
        option3: '3',
        option4: '4',
        correct_answer: '1',
        explanation: 'হাইড্রোজেনের পারমাণবিক সংখ্যা ১।',
        subject: 'রসায়ন',
        chapter: 'পর্যায় সারণি',
        difficulty: 'Easy',
      },
    ];
    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Questions');
    XLSX.writeFile(wb, 'live_exam_questions_sample.xlsx');
  };

  const parseAndSetQuestions = (rows: Record<string, any>[]) => {
    const parsed: Partial<Question>[] = [];
    const errors: string[] = [];

    rows.forEach((row, idx) => {
      const qStem =
        row.question ||
        row.Question ||
        row['প্রশ্ন'] ||
        row.stem ||
        row['প্রশ্নের বিবরণ'] ||
        '';

      if (!qStem) {
        errors.push(`সারি #${idx + 1}: প্রশ্নের বিবরণ পাওয়া যায়নি`);
        return;
      }

      let options: string[] = [];
      if (Array.isArray(row.options)) {
        options = row.options.map(String);
      } else {
        const o1 =
          row.option1 ||
          row.option_1 ||
          row.Option1 ||
          row['ক'] ||
          row['(ক)'] ||
          row['A'] ||
          '';
        const o2 =
          row.option2 ||
          row.option_2 ||
          row.Option2 ||
          row['খ'] ||
          row['(খ)'] ||
          row['B'] ||
          '';
        const o3 =
          row.option3 ||
          row.option_3 ||
          row.Option3 ||
          row['গ'] ||
          row['(গ)'] ||
          row['C'] ||
          '';
        const o4 =
          row.option4 ||
          row.option_4 ||
          row.Option4 ||
          row['ঘ'] ||
          row['(ঘ)'] ||
          row['D'] ||
          '';
        options = [String(o1), String(o2), String(o3), String(o4)].filter(
          (o) => o.trim() !== '',
        );
      }

      if (options.length < 2) {
        errors.push(`সারি #${idx + 1}: কমপক্ষে ২টি অপশন প্রয়োজন`);
        return;
      }

      let correctIdx = 0;
      const rawCorrect = (
        row.correct_answer ||
        row.correctAnswer ||
        row.answer ||
        row.correct_option ||
        row['উত্তর'] ||
        'A'
      )
        .toString()
        .trim();
      const upper = rawCorrect.toUpperCase();

      if (upper === 'A' || upper === '1' || upper === 'ক' || upper === '(ক)')
        correctIdx = 0;
      else if (upper === 'B' || upper === '2' || upper === 'খ' || upper === '(খ)')
        correctIdx = 1;
      else if (upper === 'C' || upper === '3' || upper === 'গ' || upper === '(গ)')
        correctIdx = 2;
      else if (upper === 'D' || upper === '4' || upper === 'ঘ' || upper === '(ঘ)')
        correctIdx = 3;
      else {
        const matchOptIdx = options.findIndex(
          (o) => o.toLowerCase().trim() === rawCorrect.toLowerCase(),
        );
        if (matchOptIdx >= 0) correctIdx = matchOptIdx;
      }

      const sub =
        row.subject || row.Subject || row['বিষয়'] || exam?.category || 'General';
      const ch = row.chapter || row.Chapter || row['অধ্যায়'] || '';
      const diff = row.difficulty || row.Difficulty || row['লেভেল'] || 'Medium';
      const exp = row.explanation || row.Explanation || row['ব্যাখ্যা'] || '';

      parsed.push({
        question: qStem,
        options,
        correctAnswerIndex: correctIdx,
        correctAnswerIndices: [correctIdx],
        explanation: exp,
        subject: sub,
        chapter: ch,
        difficulty: diff as any,
        type: 'MCQ',
        status: 'Approved' as any,
      });
    });

    setBulkParsedQuestions(parsed);
    setBulkParseErrors(errors);
  };

  const handleBulkFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fileName = file.name.toLowerCase();

    const reader = new FileReader();
    if (fileName.endsWith('.json')) {
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          const list = Array.isArray(json) ? json : [json];
          parseAndSetQuestions(list);
        } catch (err) {
          toast.error('JSON ফাইল পার্স করা যায়নি');
        }
      };
      reader.readAsText(file);
    } else {
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const json = XLSX.utils.sheet_to_json(worksheet);
          parseAndSetQuestions(json as Record<string, any>[]);
        } catch (err) {
          toast.error('এক্সেল/সিএসভি ফাইল পার্স করা যায়নি');
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleParseRawText = () => {
    if (!bulkRawText.trim()) return;
    try {
      // Try JSON parse first
      if (bulkRawText.trim().startsWith('[') || bulkRawText.trim().startsWith('{')) {
        const json = JSON.parse(bulkRawText);
        const list = Array.isArray(json) ? json : [json];
        parseAndSetQuestions(list);
        return;
      }

      // Plain text block parser: 1. Question \n A) ... B) ... Ans: C
      const blocks = bulkRawText.split(/\n\s*\n/);
      const rows: Record<string, any>[] = [];

      blocks.forEach((block) => {
        const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
        if (lines.length < 3) return;

        const qStem = lines[0].replace(/^\d+[\.\)]\s*/, '');
        const options: string[] = [];
        let ans = 'A';
        let exp = '';

        lines.slice(1).forEach((l) => {
          if (l.toLowerCase().startsWith('ans:') || l.startsWith('উত্তর:')) {
            ans = l.split(':')[1]?.trim() || 'A';
          } else if (l.toLowerCase().startsWith('exp:') || l.startsWith('ব্যাখ্যা:')) {
            exp = l.split(':')[1]?.trim() || '';
          } else if (/^[a-dA-Dক-ঘ][\.\)]\s*/.test(l)) {
            options.push(l.replace(/^[a-dA-Dক-ঘ][\.\)]\s*/, ''));
          } else {
            options.push(l);
          }
        });

        if (qStem && options.length >= 2) {
          rows.push({
            question: qStem,
            options,
            correct_answer: ans,
            explanation: exp,
            subject: exam?.category || 'General',
          });
        }
      });

      if (rows.length === 0) {
        toast.warning('কোনো প্রশ্ন পার্স করা যায়নি। ফরম্যাট ঠিক আছে কিনা পরীক্ষা করুন।');
        return;
      }
      parseAndSetQuestions(rows);
    } catch (e) {
      toast.error('টেক্সট পার্স করতে সমস্যা হয়েছে');
    }
  };

  const handleExecuteBulkUploadToExam = async () => {
    if (bulkParsedQuestions.length === 0) return;
    try {
      setIsBulkUploading(true);
      let insertedCount = 0;
      const insertedIds: string[] = [];

      for (const q of bulkParsedQuestions) {
        const res = await createQuestion(q);
        if (res.success && res.id) {
          insertedIds.push(res.id);
          insertedCount++;
        }
      }

      if (insertedIds.length > 0) {
        await addQuestionsBatchToLiveExam(examId, insertedIds, 1);
        toast.success(`সফলভাবে ${insertedCount}টি প্রশ্ন আপলোড ও লাইভ পরীক্ষায় যুক্ত করা হয়েছে!`);
        setShowBulkModal(false);
        setBulkParsedQuestions([]);
        setBulkParseErrors([]);
        setBulkRawText('');
        fetchExamData(false);
      } else {
        toast.error('প্রশ্ন আপলোড ব্যর্থ হয়েছে');
      }
    } catch (err) {
      toast.error('বাল্ক আপলোডে ত্রুটি দেখা দিয়েছে: ' + String(err));
    } finally {
      setIsBulkUploading(false);
    }
  };

  // Available subjects and chapters for question bank
  const availableBankSubjects = useMemo(() => getHscSubjectList(), []);
  const bankChaptersList = useMemo(
    () => (subjectFilter ? getHscChapterList(subjectFilter) : []),
    [subjectFilter],
  );

  // Filtered assigned questions
  const filteredAssignedQuestions = useMemo(() => {
    return examQuestions.filter((eq) => {
      const q = eq.question;
      if (!q) return false;
      const matchesSearch =
        !assignedFilterText ||
        q.question?.toLowerCase().includes(assignedFilterText.toLowerCase()) ||
        q.chapter?.toLowerCase().includes(assignedFilterText.toLowerCase());
      const matchesSub =
        assignedSubjectFilter === 'all' || q.subject === assignedSubjectFilter;
      return matchesSearch && matchesSub;
    });
  }, [examQuestions, assignedFilterText, assignedSubjectFilter]);

  // Subject-wise Grouping for clean collapsible sections
  const [collapsedSubjects, setCollapsedSubjects] = useState<Record<string, boolean>>({});

  const toggleCollapseSubject = (subj: string) => {
    setCollapsedSubjects((prev) => ({
      ...prev,
      [subj]: !prev[subj],
    }));
  };

  const groupedAssignedQuestions = useMemo(() => {
    const groups: { subject: string; items: any[] }[] = [];
    const map = new Map<string, any[]>();

    filteredAssignedQuestions.forEach((eq) => {
      const subj = eq.question?.subject || 'অন্যান্য';
      if (!map.has(subj)) {
        map.set(subj, []);
        groups.push({ subject: subj, items: map.get(subj)! });
      }
      map.get(subj)!.push(eq);
    });

    return groups;
  }, [filteredAssignedQuestions]);

  const isAllSubjectsCollapsed = useMemo(() => {
    return (
      groupedAssignedQuestions.length > 0 &&
      groupedAssignedQuestions.every((g) => collapsedSubjects[g.subject])
    );
  }, [groupedAssignedQuestions, collapsedSubjects]);

  const toggleAllSubjectsCollapse = () => {
    if (isAllSubjectsCollapsed) {
      setCollapsedSubjects({});
    } else {
      const allCol: Record<string, boolean> = {};
      groupedAssignedQuestions.forEach((g) => {
        allCol[g.subject] = true;
      });
      setCollapsedSubjects(allCol);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <RefreshCw className="animate-spin text-emerald-600" size={32} />
        <p className="text-sm font-bold text-zinc-500 font-mono">
          লাইভ এক্সাম বিল্ডার স্টুডিও লোড হচ্ছে...
        </p>
      </div>
    );
  }

  if (!exam) return null;

  return (
    <div className="p-3 sm:p-5 lg:p-6 max-w-[1700px] mx-auto space-y-4 flex flex-col min-h-[calc(100vh-60px)]">
      {/* ── Top Header & Blueprint Bar ── */}
      <div className="bg-white dark:bg-[#121215] border border-neutral-200/90 dark:border-zinc-800/90 rounded-2xl p-4 shadow-sm shrink-0 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Exam Info & Category */}
        <div className="flex items-center gap-3">
          <Link
            href={basePath}
            className="p-2.5 bg-neutral-100 dark:bg-zinc-800 hover:bg-neutral-200 dark:hover:bg-zinc-700 rounded-xl transition text-neutral-700 dark:text-zinc-300 shrink-0"
            title="ফিরে যান"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded text-[11px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase tracking-wide">
                {exam.category}
              </span>
              <h1 className="text-base sm:text-lg font-black text-neutral-900 dark:text-white truncate max-w-md sm:max-w-xl">
                {exam.title}
              </h1>
            </div>
            {/* Live Counter & Metrics */}
            <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500 dark:text-zinc-400 font-medium">
              <span className="flex items-center gap-1 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 size={13} /> {examStats.total}টি প্রশ্ন যুক্ত
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock size={13} /> {exam.duration_minutes} মিনিট
              </span>
              <span>•</span>
              <span>পূর্ণমান: {exam.total_marks}</span>
            </div>
          </div>
        </div>

        {/* Middle: Subject Breakdown Badges */}
        <div className="hidden xl:flex items-center gap-1.5 overflow-x-auto py-1">
          {Object.entries(examStats.subjectsMap).map(([subj, count]) => (
            <span
              key={subj}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-neutral-100 dark:bg-zinc-800/70 border border-neutral-200/60 dark:border-zinc-700/60 text-neutral-800 dark:text-zinc-200 whitespace-nowrap"
            >
              {subj}: <span className="text-emerald-600 dark:text-emerald-400 font-mono">{count}</span>
            </span>
          ))}
        </div>

        {/* Right: Action Buttons (Bulk Upload, Blueprint, Quick Create) */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Bulk Upload Button */}
          <button
            onClick={() => setShowBulkModal(true)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-blue-950/20 cursor-pointer"
          >
            <Upload size={14} />
            <span>বাল্ক আপলোড (Excel/JSON)</span>
          </button>

          {/* Blueprint Generator Button */}
          <button
            onClick={() => setShowBlueprintModal(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-amber-950/20 cursor-pointer"
          >
            <Zap size={14} />
            <span>স্মার্ট ব্লুপ্রিন্ট জেনারেটর</span>
          </button>

          {/* Quick Create Button */}
          <button
            onClick={() => {
              if (!newQSubject) {
                setNewQSubject(subjectFilter || availableBankSubjects[0]?.name || '');
              }
              setShowCreateModal(true);
            }}
            className="px-3.5 py-2 bg-neutral-900 hover:bg-black dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-neutral-700/40"
          >
            <Plus size={14} />
            <span>নতুন প্রশ্ন তৈরি</span>
          </button>
        </div>
      </div>

      {/* ── Main Split View ── */}
      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-[780px] lg:min-h-[880px] xl:min-h-[940px]">
        {/* ══════════════════════════════════════════════════════════
            LEFT PANEL: Assigned Questions in Live Exam
           ══════════════════════════════════════════════════════════ */}
        <div className="flex-1 bg-white dark:bg-[#121215] border border-neutral-200 dark:border-zinc-800 rounded-2xl flex flex-col overflow-hidden shadow-sm min-h-[650px] lg:min-h-[850px]">
          {/* Assigned Header & Local Search */}
          <div className="p-3.5 border-b border-neutral-200 dark:border-zinc-800 bg-neutral-50/70 dark:bg-zinc-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
            <div className="flex items-center gap-2">
              <BookOpen size={16} className="text-emerald-500" />
              <h2 className="text-xs font-black text-neutral-900 dark:text-white uppercase tracking-wider">
                পরীক্ষার নির্ধারিত প্রশ্ন তালিকা ({filteredAssignedQuestions.length}/{examQuestions.length})
              </h2>
            </div>

            {/* Filter inputs */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <div className="relative w-36 sm:w-44">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="তালিকায় খুঁজুন..."
                  value={assignedFilterText}
                  onChange={(e) => setAssignedFilterText(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-lg pl-7 pr-2 py-1 text-[11px] outline-none text-neutral-900 dark:text-white"
                />
              </div>

              {Object.keys(examStats.subjectsMap).length > 1 && (
                <select
                  value={assignedSubjectFilter}
                  onChange={(e) => setAssignedSubjectFilter(e.target.value)}
                  className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-lg px-2 py-1 text-[11px] outline-none font-semibold text-neutral-900 dark:text-white"
                >
                  <option value="all">সকল বিষয়</option>
                  {Object.keys(examStats.subjectsMap).map((s) => (
                    <option key={s} value={s}>
                      {s} ({examStats.subjectsMap[s]})
                    </option>
                  ))}
                </select>
              )}

              {groupedAssignedQuestions.length > 1 && (
                <button
                  type="button"
                  onClick={toggleAllSubjectsCollapse}
                  className="px-2 py-1 rounded-lg bg-neutral-100 dark:bg-zinc-800 hover:bg-neutral-200 dark:hover:bg-zinc-700 text-neutral-700 dark:text-zinc-300 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
                  title={isAllSubjectsCollapsed ? 'সব বিষয় বিস্তারিত দেখুন' : 'সব বিষয় গুটিয়ে নিন'}
                >
                  {isAllSubjectsCollapsed ? (
                    <>
                      <ChevronDown size={12} className="text-emerald-600" />
                      <span>সব খুলুন</span>
                    </>
                  ) : (
                    <>
                      <ChevronUp size={12} className="text-emerald-600" />
                      <span>সব লুকান</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Assigned Questions Scrollable List */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
            {filteredAssignedQuestions.length === 0 ? (
              <div className="text-center py-20 text-neutral-400 dark:text-zinc-500 space-y-3">
                <AlertCircle className="mx-auto opacity-30 text-emerald-500" size={44} />
                <p className="text-sm font-black text-neutral-800 dark:text-zinc-200">
                  {examQuestions.length === 0
                    ? 'এখনও কোনো প্রশ্ন যুক্ত করা হয়নি'
                    : 'ফিল্টারের সাথে কোনো প্রশ্ন মেলেনি'}
                </p>
                <p className="text-xs max-w-md mx-auto text-zinc-500">
                  ডানপাশের প্রশ্ন ব্যাংক থেকে পছন্দমতো প্রশ্ন নির্বাচন করে যোগ করুন অথবা
                  উপরের "বাল্ক আপলোড" / "স্মার্ট ব্লুপ্রিন্ট জেনারেটর" দিয়ে ১ ক্লিকে পুরো পরীক্ষা তৈরি করুন।
                </p>
              </div>
            ) : (
              groupedAssignedQuestions.map((group) => {
                const isCollapsed = !!collapsedSubjects[group.subject];

                return (
                  <div
                    key={group.subject}
                    className="space-y-3 rounded-2xl border border-neutral-200/70 dark:border-zinc-800/80 bg-neutral-50/40 dark:bg-zinc-900/30 p-2.5 sm:p-3 transition-all"
                  >
                    {/* Subject Sticky / Collapsible Header Card */}
                    <div
                      onClick={() => toggleCollapseSubject(group.subject)}
                      className="p-2.5 px-3 rounded-xl bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 flex items-center justify-between cursor-pointer hover:border-emerald-500/50 hover:shadow-sm transition-all select-none group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="p-1.5 rounded-lg bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 border border-emerald-600/20 shrink-0">
                          <BookOpen size={14} />
                        </span>
                        <div className="min-w-0">
                          <h3 className="text-xs font-black text-neutral-900 dark:text-white flex items-center gap-2 truncate">
                            <span className="truncate">{group.subject}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shrink-0">
                              {group.items.length}টি প্রশ্ন
                            </span>
                          </h3>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-zinc-400 group-hover:text-emerald-600 shrink-0">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider hidden sm:inline">
                          {isCollapsed ? 'প্রশ্নগুলো দেখুন' : 'গুটিয়ে নিন'}
                        </span>
                        {isCollapsed ? (
                          <ChevronDown size={16} className="text-emerald-600 transition-transform" />
                        ) : (
                          <ChevronUp size={16} className="text-emerald-600 transition-transform" />
                        )}
                      </div>
                    </div>

                    {/* Questions inside this Subject */}
                    {!isCollapsed && (
                      <div className="space-y-3 pt-1 animate-in fade-in duration-150">
                        {group.items.map((eq) => {
                          const q = eq.question;
                          if (!q) return null;
                          const isSolExpanded = !!expandedSolutions[eq.mapping_id];
                          const realIndex = examQuestions.findIndex(
                            (item) => item.mapping_id === eq.mapping_id,
                          );

                          const isSwapActive = swappingMapping?.mapping_id === eq.mapping_id;

                          return (
                            <div
                              key={eq.mapping_id}
                              className={`p-4 rounded-2xl transition-all space-y-3 group ${
                                isSwapActive
                                  ? 'bg-amber-50/40 dark:bg-amber-950/20 border-2 border-amber-500 shadow-md ring-4 ring-amber-500/15'
                                  : 'bg-white dark:bg-[#151518] border border-neutral-200/90 dark:border-zinc-800/90 hover:border-emerald-500/40 hover:shadow-md'
                              }`}
                            >
                              {/* Header Row: Serial & Badges & Actions */}
                              <div className="flex items-center justify-between gap-2 border-b border-neutral-100 dark:border-zinc-800/80 pb-2.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {/* Serial Number */}
                                  <span
                                    className={`px-2.5 py-1 rounded-lg font-mono font-black text-xs border shadow-2xs ${
                                      isSwapActive
                                        ? 'bg-amber-500 text-white border-amber-600'
                                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                    }`}
                                  >
                                    #{realIndex + 1}
                                  </span>

                                  {/* Chapter Badge */}
                                  {q.chapter && (
                                    <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-neutral-100 dark:bg-zinc-800 text-neutral-700 dark:text-zinc-300">
                                      {q.chapter}
                                    </span>
                                  )}

                                  {/* Topic Badge if available */}
                                  {q.topic && (
                                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-neutral-100/70 dark:bg-zinc-800/60 text-neutral-600 dark:text-zinc-400">
                                      {q.topic}
                                    </span>
                                  )}

                                  {/* Difficulty Badge */}
                                  {q.difficulty && (
                                    <span
                                      className={`px-2 py-0.5 text-[10px] font-bold rounded-lg ${
                                        q.difficulty.toLowerCase() === 'easy'
                                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                          : q.difficulty.toLowerCase() === 'hard'
                                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                      }`}
                                    >
                                      {q.difficulty}
                                    </span>
                                  )}
                                </div>

                                {/* Action Tools: Swap, Reorder, Remove */}
                                <div className="flex items-center gap-1">
                                  {/* 1-Click Swap Button */}
                                  <button
                                    onClick={() => handleToggleSwapTarget(eq)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                                      isSwapActive
                                        ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm ring-2 ring-amber-400/50'
                                        : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400'
                                    }`}
                                    title={
                                      isSwapActive
                                        ? 'প্রতিস্থাপন বাতিল করুন'
                                        : 'ডানপাশের প্রশ্ন ব্যাংক থেকে যেকোনো প্রশ্নে ক্লিক করে এটি প্রতিস্থাপন করুন'
                                    }
                                  >
                                    <RefreshCw size={12} className={isSwapActive ? 'animate-spin' : ''} />
                                    <span>{isSwapActive ? 'সক্রিয় (বাতিল)' : 'বদলান'}</span>
                                  </button>

                                  {/* Reorder Buttons */}
                                  <button
                                    onClick={() => moveQuestion(realIndex, 'up')}
                                    disabled={realIndex === 0}
                                    className="p-1 rounded-md text-neutral-500 hover:text-emerald-600 hover:bg-neutral-100 dark:hover:bg-zinc-800 disabled:opacity-20 transition cursor-pointer"
                                    title="উপরে নিন"
                                  >
                                    <ChevronUp size={16} />
                                  </button>
                                  <button
                                    onClick={() => moveQuestion(realIndex, 'down')}
                                    disabled={realIndex === examQuestions.length - 1}
                                    className="p-1 rounded-md text-neutral-500 hover:text-emerald-600 hover:bg-neutral-100 dark:hover:bg-zinc-800 disabled:opacity-20 transition cursor-pointer"
                                    title="নিচে নিন"
                                  >
                                    <ChevronDown size={16} />
                                  </button>

                                  {/* Remove */}
                                  <button
                                    onClick={() => handleRemoveQuestion(eq.mapping_id)}
                                    className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                                    title="পরীক্ষা থেকে বাদ দিন"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </div>
                              </div>

                              {/* Question Statement */}
                              <div className="text-sm font-semibold text-neutral-900 dark:text-zinc-100 leading-relaxed">
                                <MathRenderer text={q.question || ''} />
                              </div>

                              {/* MCQ Options Grid */}
                              {q.options && q.options.length > 0 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                                  {q.options.map((opt: string, optIdx: number) => {
                                    const isCorrect =
                                      q.correct_answer_indices?.includes(optIdx) ||
                                      q.correct_answer_index === optIdx ||
                                      q.correct_answer === opt;
                                    const optionLabels = ['(ক)', '(খ)', '(গ)', '(ঘ)', '(ঙ)'];
                                    return (
                                      <div
                                        key={optIdx}
                                        className={`p-2.5 px-3 rounded-xl border text-xs flex items-center justify-between gap-2.5 transition-all ${
                                          isCorrect
                                            ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-500/50 text-emerald-950 dark:text-emerald-200 font-bold shadow-2xs'
                                            : 'bg-neutral-50/70 dark:bg-zinc-900/50 border-neutral-200/80 dark:border-zinc-800 text-neutral-800 dark:text-zinc-200'
                                        }`}
                                      >
                                        <div className="flex items-start gap-2 min-w-0 flex-1">
                                          <span className="font-mono text-neutral-400 dark:text-zinc-500 font-bold shrink-0">
                                            {optionLabels[optIdx] || `(${optIdx + 1})`}
                                          </span>
                                          <div className="flex-1 min-w-0 leading-normal">
                                            <MathRenderer text={opt} />
                                          </div>
                                        </div>
                                        {isCorrect && (
                                          <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {/* Explanation toggle & box */}
                              {q.explanation && (
                                <div className="pt-1">
                                  <button
                                    onClick={() =>
                                      setExpandedSolutions((prev) => ({
                                        ...prev,
                                        [eq.mapping_id]: !prev[eq.mapping_id],
                                      }))
                                    }
                                    className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 hover:underline cursor-pointer"
                                  >
                                    <HelpCircle size={13} />
                                    <span>{isSolExpanded ? 'ব্যাখ্যা লুকান' : 'ব্যাখ্যা দেখুন'}</span>
                                  </button>
                                  {isSolExpanded && (
                                    <div className="mt-2 p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/25 border border-blue-200/60 dark:border-blue-900/50 text-xs text-neutral-800 dark:text-zinc-200 space-y-1 animate-in fade-in duration-150">
                                      <div className="flex items-center gap-1.5 font-bold text-blue-700 dark:text-blue-300 text-[11px]">
                                        <Sparkles size={13} />
                                        <span>সঠিক উত্তর ও বিস্তারিত সমাধান:</span>
                                      </div>
                                      <div className="pt-0.5 leading-relaxed">
                                        <MathRenderer text={q.explanation} />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            RIGHT PANEL: Multi-Select Question Bank Studio
           ══════════════════════════════════════════════════════════ */}
        <div className="w-full lg:w-[480px] xl:w-[540px] bg-white dark:bg-[#121215] border border-neutral-200 dark:border-zinc-800 rounded-2xl flex flex-col overflow-hidden shadow-sm shrink-0 min-h-[650px] lg:min-h-[850px]">
          {/* Bank Header & Filters */}
          <div className="p-3.5 border-b border-neutral-200 dark:border-zinc-800 bg-neutral-50/70 dark:bg-zinc-900/50 space-y-2.5 shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Search size={15} className="text-blue-500" />
                <span>প্রশ্ন ব্যাংক ও বাল্ক নির্বাচন</span>
              </h2>
              <span className="text-[11px] font-mono text-zinc-500 font-bold">
                মোট {totalBankCount}টি প্রশ্ন
              </span>
            </div>

            {/* Quick Limit Selector Row */}
            <div className="flex items-center justify-between gap-1 text-[11px] pt-0.5">
              <span className="text-[10px] uppercase font-black text-neutral-400 dark:text-zinc-500 tracking-wider">
                প্রতি পেজে:
              </span>
              <div className="flex items-center gap-1 overflow-x-auto">
                {[25, 50, 100, 200, 500, 1000].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => handlePageSizeChange(size)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold transition cursor-pointer ${
                      bankPageSize === size && !isCustomPageSize
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-neutral-100 dark:bg-zinc-800 text-neutral-600 dark:text-zinc-400 hover:bg-neutral-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {size}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setIsCustomPageSize(!isCustomPageSize)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition cursor-pointer ${
                    isCustomPageSize
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-neutral-100 dark:bg-zinc-800 text-neutral-600 dark:text-zinc-400 hover:bg-neutral-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  কাস্টম
                </button>
              </div>
            </div>

            {/* Custom Limit Input Bar */}
            {isCustomPageSize && (
              <form
                onSubmit={handleCustomPageSizeSubmit}
                className="flex items-center gap-1.5 p-2 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/40 rounded-xl animate-in fade-in"
              >
                <input
                  type="number"
                  min="1"
                  max="10000"
                  placeholder="কতটি প্রশ্ন দেখতে চান? (যেমন: ৩০০, ১০০০)..."
                  value={customPageSizeInput}
                  onChange={(e) => setCustomPageSizeInput(e.target.value)}
                  className="flex-1 bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-lg px-2.5 py-1 text-xs outline-none text-neutral-900 dark:text-white font-mono font-bold"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shrink-0 cursor-pointer"
                >
                  লোড করুন
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomPageSize(false);
                    handlePageSizeChange(50);
                  }}
                  className="px-2 py-1 bg-neutral-200 dark:bg-zinc-800 text-neutral-700 dark:text-zinc-300 rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  বাতিল
                </button>
              </form>
            )}

            {/* Active Replacement Mode Banner */}
            {swappingMapping && (
              <div className="p-2.5 px-3 bg-amber-500/15 border border-amber-500/40 rounded-xl flex items-center justify-between gap-2 text-xs animate-in slide-in-from-top duration-200">
                <div className="flex items-center gap-2 text-amber-950 dark:text-amber-200 font-bold min-w-0">
                  <RefreshCw size={14} className="animate-spin text-amber-600 shrink-0" />
                  <span className="truncate">
                    প্রশ্ন <strong>#{swappingMapping.serial}</strong> প্রতিস্থাপন সক্রিয় — যেকোনো প্রশ্নে ক্লিক করলেই তা <strong>#{swappingMapping.serial}</strong>-এ বসে যাবে!
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSwappingMapping(null)}
                  className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold shadow-xs shrink-0 cursor-pointer"
                >
                  বাতিল
                </button>
              </div>
            )}

            {/* Filter Form */}
            <form onSubmit={handleBankSearchSubmit} className="space-y-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="কীওয়ার্ড বা প্রশ্ন খুঁজুন..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs outline-none text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* Subject Selector */}
                <select
                  value={subjectFilter}
                  onChange={(e) => {
                    setSubjectFilter(e.target.value);
                    setChapterFilter('');
                  }}
                  className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs outline-none text-neutral-900 dark:text-white font-semibold"
                >
                  <option value="">সকল বিষয়</option>
                  {availableBankSubjects.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>

                {/* Chapter Selector */}
                <select
                  value={chapterFilter}
                  onChange={(e) => setChapterFilter(e.target.value)}
                  disabled={!subjectFilter}
                  className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs outline-none text-neutral-900 dark:text-white font-semibold disabled:opacity-50"
                >
                  <option value="">সকল অধ্যায়</option>
                  {bankChaptersList.map((ch) => (
                    <option key={ch.id} value={ch.name}>
                      {ch.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Toggles & Difficulty Row */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <label className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-600 dark:text-zinc-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hideAddedFilter}
                    onChange={(e) => setHideAddedFilter(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>যুক্ত করা প্রশ্ন বাদ দিন</span>
                </label>

                <button
                  type="submit"
                  className="px-3.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg transition cursor-pointer"
                >
                  খুঁজুন
                </button>
              </div>
            </form>

            {/* Select All Controls */}
            <div className="flex items-center justify-between pt-1 border-t border-neutral-200/50 dark:border-zinc-800/60 text-xs">
              <button
                type="button"
                onClick={handleSelectAllOnPage}
                className="text-[11px] font-bold text-neutral-700 dark:text-zinc-300 hover:text-emerald-600 flex items-center gap-1 cursor-pointer"
              >
                {selectedBankIds.size > 0 ? <CheckSquare size={14} className="text-emerald-600" /> : <Square size={14} />}
                <span>পেজের সব নির্বাচন করুন</span>
              </button>

              {selectedBankIds.size > 0 && (
                <button
                  onClick={() => setSelectedBankIds(new Set())}
                  className="text-[11px] text-rose-500 hover:underline font-bold cursor-pointer"
                >
                  নির্বাচন মুছুন ({selectedBankIds.size})
                </button>
              )}
            </div>
          </div>

          {/* Bank Scrollable Questions */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
            {isSearching ? (
              <div className="text-center py-16 text-zinc-500 text-xs font-mono">
                প্রশ্ন লোড হচ্ছে...
              </div>
            ) : displayBankQuestions.length === 0 ? (
              <div className="text-center py-16 text-neutral-400 text-xs space-y-2">
                <AlertCircle className="mx-auto opacity-30" size={32} />
                <p>কোনো প্রশ্ন পাওয়া যায়নি। ফিল্টার পরিবর্তন করে খুঁজুন।</p>
              </div>
            ) : (
              displayBankQuestions.map((q) => {
                const isAdded = assignedQuestionIds.has(q.id);
                const isChecked = selectedBankIds.has(q.id);

                return (
                  <div
                    key={q.id}
                    className={`p-3 rounded-xl border transition-all space-y-2 ${
                      isChecked
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-500/60 shadow-sm'
                        : isAdded
                        ? 'bg-neutral-100/50 dark:bg-zinc-900/20 border-neutral-200/40 dark:border-zinc-800/40 opacity-60'
                        : 'bg-neutral-50 dark:bg-zinc-900/40 border-neutral-200/80 dark:border-zinc-800'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {/* Checkbox for Batch Selection */}
                      {!isAdded && !swappingMapping && (
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelectQuestion(q.id)}
                          className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer h-4 w-4 shrink-0"
                        />
                      )}

                      {/* Question Content */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="text-xs font-medium text-neutral-900 dark:text-zinc-200 leading-relaxed line-clamp-3">
                          <MathRenderer text={q.question || ''} />
                        </div>

                        {/* Badges */}
                        <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 pt-1">
                          <span className="px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-zinc-800 font-bold text-neutral-700 dark:text-zinc-300">
                            {q.subject}
                          </span>
                          {q.chapter && (
                            <span className="truncate max-w-[130px] font-medium">
                              {q.chapter}
                            </span>
                          )}
                          <span className="font-mono text-amber-600 font-bold">
                            {q.difficulty}
                          </span>
                        </div>
                      </div>

                      {/* Single Add / Swap Button */}
                      <button
                        onClick={() => handleAddSingleQuestion(q)}
                        disabled={isAdded}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition shrink-0 cursor-pointer ${
                          isAdded
                            ? 'bg-neutral-200 dark:bg-zinc-800 text-neutral-400 cursor-not-allowed'
                            : swappingMapping
                            ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm ring-2 ring-amber-400/40'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                        }`}
                      >
                        {isAdded ? (
                          <span className="flex items-center gap-1 text-[11px]">
                            <Check size={12} /> যুক্ত আছে
                          </span>
                        ) : swappingMapping ? (
                          <span className="flex items-center gap-1 text-[11px]">
                            <RefreshCw size={12} /> #{swappingMapping.serial}-এ বসান
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[11px]">
                            <Plus size={12} /> যোগ
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Question Bank Pagination Controls */}
          <div className="p-2.5 px-3.5 border-t border-neutral-200 dark:border-zinc-800 bg-neutral-50/90 dark:bg-zinc-900/90 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs shrink-0">
            {/* Left: Summary */}
            <div className="flex items-center gap-1.5 text-[11px] text-neutral-600 dark:text-zinc-400 font-medium">
              <span className="font-mono">
                পৃষ্ঠা <strong className="text-neutral-900 dark:text-white font-bold">{bankPage}</strong> / {totalBankPages}
              </span>
              <span className="text-neutral-300 dark:text-zinc-700">•</span>
              <span className="font-mono text-zinc-500">
                মোট {totalBankCount}টি প্রশ্ন
              </span>
            </div>

            {/* Center / Right: Nav Controls */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handlePageChange(1)}
                disabled={bankPage <= 1 || isSearching}
                className="p-1 rounded-lg border border-neutral-200 dark:border-zinc-800 text-neutral-700 dark:text-zinc-300 hover:bg-neutral-100 dark:hover:bg-zinc-800 disabled:opacity-30 transition cursor-pointer"
                title="প্রথম পৃষ্ঠা"
              >
                <ChevronsLeft size={14} />
              </button>
              <button
                type="button"
                onClick={() => handlePageChange(bankPage - 1)}
                disabled={bankPage <= 1 || isSearching}
                className="p-1 px-1.5 rounded-lg border border-neutral-200 dark:border-zinc-800 text-neutral-700 dark:text-zinc-300 hover:bg-neutral-100 dark:hover:bg-zinc-800 disabled:opacity-30 transition flex items-center gap-0.5 text-[11px] font-bold cursor-pointer"
                title="পূর্ববর্তী পৃষ্ঠা"
              >
                <ChevronLeft size={14} />
                <span>আগের</span>
              </button>

              {/* Direct Page Jump Form */}
              <form onSubmit={handleJumpToPageSubmit} className="flex items-center gap-1 px-1">
                <input
                  type="number"
                  min="1"
                  max={totalBankPages}
                  value={jumpToPageInput}
                  onChange={(e) => setJumpToPageInput(e.target.value)}
                  placeholder={`${bankPage}`}
                  className="w-11 text-center bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-lg py-0.5 text-[11px] font-mono font-bold outline-none text-neutral-900 dark:text-white focus:border-emerald-500"
                  title="পৃষ্ঠা নম্বরে যান"
                />
              </form>

              <button
                type="button"
                onClick={() => handlePageChange(bankPage + 1)}
                disabled={bankPage >= totalBankPages || isSearching}
                className="p-1 px-1.5 rounded-lg border border-neutral-200 dark:border-zinc-800 text-neutral-700 dark:text-zinc-300 hover:bg-neutral-100 dark:hover:bg-zinc-800 disabled:opacity-30 transition flex items-center gap-0.5 text-[11px] font-bold cursor-pointer"
                title="পরবর্তী পৃষ্ঠা"
              >
                <span>পরের</span>
                <ChevronRight size={14} />
              </button>
              <button
                type="button"
                onClick={() => handlePageChange(totalBankPages)}
                disabled={bankPage >= totalBankPages || isSearching}
                className="p-1 rounded-lg border border-neutral-200 dark:border-zinc-800 text-neutral-700 dark:text-zinc-300 hover:bg-neutral-100 dark:hover:bg-zinc-800 disabled:opacity-30 transition cursor-pointer"
                title="সর্বশেষ পৃষ্ঠা"
              >
                <ChevronsRight size={14} />
              </button>
            </div>
          </div>

          {/* Floating / Sticky Batch Import Bar */}
          {selectedBankIds.size > 0 && (
            <div className="p-3 border-t border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-between gap-3 shrink-0 animate-in slide-in-from-bottom duration-200">
              <span className="text-xs font-black text-emerald-900 dark:text-emerald-200">
                {selectedBankIds.size}টি প্রশ্ন নির্বাচিত
              </span>
              <button
                onClick={handleBatchAddSelected}
                disabled={isBatchAdding}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-950/30 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isBatchAdding ? (
                  <RefreshCw className="animate-spin" size={14} />
                ) : (
                  <Plus size={14} />
                )}
                <span>নির্বাচিতগুলো পরীক্ষায় যুক্ত করুন</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          MODAL: Bulk Upload Questions (Excel / CSV / JSON / Text)
         ══════════════════════════════════════════════════════════ */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#141417] border border-neutral-200 dark:border-zinc-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl p-6 space-y-4 animate-in zoom-in-95 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-neutral-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Upload size={20} />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-neutral-900 dark:text-white">
                    লাইভ এক্সামে বাল্ক প্রশ্ন আপলোড (Excel / CSV / JSON)
                  </h2>
                  <p className="text-[11px] text-neutral-500">
                    এক্সেল, সিএসভি, বা টেক্সট থেকে এক ক্লিকে বহু প্রশ্ন সরাসরি পরীক্ষায় আপলোড করুন
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowBulkModal(false);
                  setBulkParsedQuestions([]);
                  setBulkParseErrors([]);
                }}
                className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-zinc-800 text-zinc-400"
              >
                <X size={16} />
              </button>
            </div>

            {/* Tab Selector & Sample Download */}
            <div className="flex items-center justify-between gap-2 border-b border-neutral-200/60 dark:border-zinc-800/60 pb-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBulkTab('file')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    bulkTab === 'file'
                      ? 'bg-blue-600 text-white'
                      : 'bg-neutral-100 dark:bg-zinc-800 text-neutral-600 dark:text-zinc-300'
                  }`}
                >
                  <FileSpreadsheet size={14} />
                  <span>এক্সেল / CSV / JSON ফাইল</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBulkTab('text')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    bulkTab === 'text'
                      ? 'bg-blue-600 text-white'
                      : 'bg-neutral-100 dark:bg-zinc-800 text-neutral-600 dark:text-zinc-300'
                  }`}
                >
                  <FileText size={14} />
                  <span>টেক্সট পেস্ট ও পার্সার</span>
                </button>
              </div>

              <button
                type="button"
                onClick={downloadSampleTemplate}
                className="text-[11px] text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Download size={13} />
                <span>নমুনা এক্সেল ডাউনলোড</span>
              </button>
            </div>

            {/* Modal Body: File or Text Tab */}
            <div className="flex-1 overflow-y-auto space-y-4">
              {bulkTab === 'file' ? (
                <div className="space-y-3">
                  <div className="border-2 border-dashed border-neutral-300 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-2xl p-6 sm:p-8 text-center transition bg-neutral-50/50 dark:bg-zinc-900/30">
                    <Upload className="mx-auto text-blue-500 mb-2" size={32} />
                    <p className="text-xs font-black text-neutral-800 dark:text-zinc-200">
                      এক্সেল (.xlsx, .xls), CSV (.csv) বা JSON ফাইল ড্রপ করুন
                    </p>
                    <p className="text-[11px] text-neutral-400 mt-1">
                      অথবা ফাইল সিলেক্ট করতে নিচে ক্লিক করুন
                    </p>
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv,.json"
                      onChange={handleBulkFileUpload}
                      className="mt-4 text-xs file:mr-3 file:py-1.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-700 dark:text-zinc-300">
                    প্রশ্ন পেস্ট করুন (MCQ ফরম্যাট):
                  </label>
                  <textarea
                    rows={6}
                    value={bulkRawText}
                    onChange={(e) => setBulkRawText(e.target.value)}
                    placeholder={`1. বলের মাত্রা সমীকরণ কোনটি?\nA) [MLT^-2]\nB) [ML^2T^-2]\nC) [MLT^-1]\nD) [ML^-1T^-2]\nAns: A\nExp: F = ma = [MLT^-2]\n\n2. দ্বিতীয় প্রশ্ন...`}
                    className="w-full bg-neutral-50 dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-2xl p-3 text-xs outline-none text-neutral-900 dark:text-white font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleParseRawText}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    টেক্সট পার্স করুন
                  </button>
                </div>
              )}

              {/* Parsing Feedback & Errors */}
              {bulkParseErrors.length > 0 && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-700 dark:text-rose-300 space-y-1">
                  <span className="font-bold">সতর্কতা / ত্রুটিসমূহ:</span>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                    {bulkParseErrors.slice(0, 5).map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                    {bulkParseErrors.length > 5 && (
                      <li>...আরও {bulkParseErrors.length - 5}টি ত্রুটি</li>
                    )}
                  </ul>
                </div>
              )}

              {/* Parsed Preview Table */}
              {bulkParsedQuestions.length > 0 && (
                <div className="space-y-2 border-t border-neutral-200/60 dark:border-zinc-800/60 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <FileCheck size={16} />
                      <span>{bulkParsedQuestions.length}টি প্রশ্ন সফলভাবে পার্স হয়েছে</span>
                    </span>
                  </div>

                  <div className="max-h-60 overflow-y-auto border border-neutral-200 dark:border-zinc-800 rounded-xl divide-y divide-neutral-200 dark:divide-zinc-800 text-xs">
                    {bulkParsedQuestions.map((q, idx) => (
                      <div key={idx} className="p-3 bg-neutral-50/50 dark:bg-zinc-900/30 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono font-bold text-emerald-600">#{idx + 1}</span>
                          <span className="text-[10px] bg-neutral-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded font-bold">
                            {q.subject} {q.chapter ? `• ${q.chapter}` : ''}
                          </span>
                        </div>
                        <p className="font-semibold text-neutral-900 dark:text-zinc-100 line-clamp-2">
                          {q.question}
                        </p>
                        <div className="grid grid-cols-2 gap-1 text-[11px] text-neutral-600 dark:text-zinc-400 pt-1">
                          {q.options?.map((opt, oIdx) => (
                            <span
                              key={oIdx}
                              className={
                                q.correctAnswerIndex === oIdx
                                  ? 'text-emerald-600 font-bold'
                                  : ''
                              }
                            >
                              ({String.fromCharCode(65 + oIdx)}) {opt}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="pt-3 flex justify-end gap-2 border-t border-neutral-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  setShowBulkModal(false);
                  setBulkParsedQuestions([]);
                  setBulkParseErrors([]);
                }}
                className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-zinc-800 text-xs font-bold"
              >
                বাতিল
              </button>

              <button
                type="button"
                onClick={handleExecuteBulkUploadToExam}
                disabled={bulkParsedQuestions.length === 0 || isBulkUploading}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-emerald-950/20 cursor-pointer disabled:opacity-50"
              >
                {isBulkUploading ? (
                  <RefreshCw className="animate-spin" size={14} />
                ) : (
                  <Upload size={14} />
                )}
                <span>
                  {isBulkUploading
                    ? 'আপলোড হচ্ছে...'
                    : `লাইভ পরীক্ষায় ${bulkParsedQuestions.length}টি প্রশ্ন যুক্ত করুন`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          MODAL: Multi-Chapter Smart Blueprint Generator
         ══════════════════════════════════════════════════════════ */}
      {showBlueprintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#141417] border border-neutral-200 dark:border-zinc-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl p-6 space-y-4 animate-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-neutral-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                  <Zap size={20} />
                </div>
                <div>
                  <h2 className="text-sm font-black text-neutral-900 dark:text-white">
                    স্মার্ট ব্লুপ্রিন্ট ও ব্যালান্সড প্রশ্ন জেনারেটর
                  </h2>
                  <p className="text-[11px] text-neutral-500">
                    বিষয় ও অধ্যায়ভিত্তিক নিয়ম অনুযায়ী ব্যালান্সড প্রশ্নপত্র তৈরি করুন
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBlueprintModal(false)}
                className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-zinc-800 text-zinc-400"
              >
                <X size={16} />
              </button>
            </div>

            {/* Rules List */}
            <form onSubmit={handleRunBlueprint} className="space-y-3 flex-1 overflow-y-auto">
              {blueprintRules.map((rule, idx) => {
                const chList = rule.subject ? getHscChapterList(rule.subject) : [];

                return (
                  <div
                    key={idx}
                    className="p-3.5 bg-neutral-50 dark:bg-zinc-900/50 border border-neutral-200/80 dark:border-zinc-800 rounded-2xl space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-neutral-700 dark:text-zinc-300 font-mono">
                        রুল #{idx + 1}
                      </span>
                      {blueprintRules.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveBlueprintRule(idx)}
                          className="text-rose-500 hover:text-rose-600 text-xs font-bold"
                        >
                          মুছুন
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                      {/* Subject */}
                      <div>
                        <label className="text-[10px] font-bold text-neutral-600 dark:text-zinc-400">
                          বিষয় *
                        </label>
                        <select
                          required
                          value={rule.subject}
                          onChange={(e) =>
                            handleUpdateBlueprintRule(idx, 'subject', e.target.value)
                          }
                          className="w-full bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs outline-none font-semibold text-neutral-900 dark:text-white mt-0.5"
                        >
                          <option value="">বিষয় বাছুন</option>
                          {availableBankSubjects.map((s) => (
                            <option key={s.id} value={s.name}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Chapter */}
                      <div>
                        <label className="text-[10px] font-bold text-neutral-600 dark:text-zinc-400">
                          অধ্যায়
                        </label>
                        <select
                          value={rule.chapter}
                          onChange={(e) =>
                            handleUpdateBlueprintRule(idx, 'chapter', e.target.value)
                          }
                          disabled={!rule.subject}
                          className="w-full bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs outline-none font-semibold text-neutral-900 dark:text-white mt-0.5 disabled:opacity-50"
                        >
                          <option value="">সকল অধ্যায়</option>
                          {chList.map((ch) => (
                            <option key={ch.id} value={ch.name}>
                              {ch.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Difficulty */}
                      <div>
                        <label className="text-[10px] font-bold text-neutral-600 dark:text-zinc-400">
                          কাঠিন্য
                        </label>
                        <select
                          value={rule.difficulty}
                          onChange={(e) =>
                            handleUpdateBlueprintRule(idx, 'difficulty', e.target.value)
                          }
                          className="w-full bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs outline-none font-semibold text-neutral-900 dark:text-white mt-0.5"
                        >
                          <option value="">মিক্সড / সকল</option>
                          <option value="Easy">Easy (সহজ)</option>
                          <option value="Medium">Medium (মাঝারি)</option>
                          <option value="Hard">Hard (কঠিন)</option>
                        </select>
                      </div>

                      {/* Count */}
                      <div>
                        <label className="text-[10px] font-bold text-neutral-600 dark:text-zinc-400">
                          সংখ্যা
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={rule.count}
                          onChange={(e) =>
                            handleUpdateBlueprintRule(idx, 'count', Number(e.target.value))
                          }
                          className="w-full bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs outline-none font-mono font-bold text-neutral-900 dark:text-white mt-0.5"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              <button
                type="button"
                onClick={handleAddBlueprintRule}
                className="w-full py-2 border-2 border-dashed border-neutral-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-neutral-600 dark:text-zinc-400 hover:border-emerald-500 hover:text-emerald-600 transition flex items-center justify-center gap-1"
              >
                <Plus size={14} />
                <span>আরেকটি বিষয়/অধ্যায় রুল যোগ করুন</span>
              </button>

              <div className="pt-3 flex justify-end gap-2 border-t border-neutral-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowBlueprintModal(false)}
                  className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-zinc-800 text-xs font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isGeneratingBlueprint}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-amber-950/20 cursor-pointer disabled:opacity-50"
                >
                  {isGeneratingBlueprint ? (
                    <RefreshCw className="animate-spin" size={14} />
                  ) : (
                    <Zap size={14} />
                  )}
                  <span>ব্লুপ্রিন্ট অনুযায়ী তৈরি করুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          MODAL: Quick Create Question & Attach
         ══════════════════════════════════════════════════════════ */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#141417] border border-neutral-200 dark:border-zinc-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl p-6 space-y-4 animate-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-neutral-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                  <Edit3 size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-black text-neutral-900 dark:text-white">
                    তাৎক্ষণিক প্রশ্ন তৈরি ও সংযোজন
                  </h2>
                  <p className="text-[11px] text-neutral-500">
                    সরাসরি লাইভ পরীক্ষায় নতুন প্রশ্ন লিখে যুক্ত করুন (LaTeX ও বাংলা সাপোর্টেড)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-zinc-800 text-zinc-400"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleQuickCreateQuestion} className="space-y-3.5 flex-1 overflow-y-auto">
              {/* Question Statement */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700 dark:text-zinc-300">
                  প্রশ্নের বিবরণ (Question Stem) *
                </label>
                <textarea
                  required
                  rows={2}
                  value={newQStem}
                  onChange={(e) => setNewQStem(e.target.value)}
                  placeholder="যেমন: বলের মাত্রা সমীকরণ কোনটি? অথবা LaTeX: $F = ma$"
                  className="w-full bg-neutral-50 dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-xl p-3 text-xs outline-none text-neutral-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Options */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-700 dark:text-zinc-300">
                  ৪টি অপশন ও সঠিক উত্তর সিলেক্ট করুন *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {newQOptions.map((opt, optIdx) => (
                    <div
                      key={optIdx}
                      className={`flex items-center gap-2 p-2 rounded-xl border ${
                        newQCorrectIndex === optIdx
                          ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20'
                          : 'border-neutral-200 dark:border-zinc-800 bg-neutral-50 dark:bg-zinc-900'
                      }`}
                    >
                      <input
                        type="radio"
                        name="correctOpt"
                        checked={newQCorrectIndex === optIdx}
                        onChange={() => setNewQCorrectIndex(optIdx)}
                        className="text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        title="সঠিক উত্তর হিসেবে সিলেক্ট করুন"
                      />
                      <span className="text-xs font-bold font-mono text-zinc-400">
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <input
                        type="text"
                        required
                        value={opt}
                        onChange={(e) => {
                          const copy = [...newQOptions];
                          copy[optIdx] = e.target.value;
                          setNewQOptions(copy);
                        }}
                        placeholder={`অপশন ${optIdx + 1}`}
                        className="flex-1 bg-transparent border-none text-xs outline-none text-neutral-900 dark:text-white font-medium"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Taxonomy: Subject, Chapter, Difficulty */}
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold text-neutral-600 dark:text-zinc-400">
                    বিষয়
                  </label>
                  <select
                    value={newQSubject}
                    onChange={(e) => setNewQSubject(e.target.value)}
                    className="w-full bg-neutral-50 dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs outline-none font-semibold text-neutral-900 dark:text-white mt-0.5"
                  >
                    <option value="">বিষয় বাছুন</option>
                    {availableBankSubjects.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-neutral-600 dark:text-zinc-400">
                    অধ্যায়
                  </label>
                  <input
                    type="text"
                    value={newQChapter}
                    onChange={(e) => setNewQChapter(e.target.value)}
                    placeholder="অধ্যায়..."
                    className="w-full bg-neutral-50 dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs outline-none text-neutral-900 dark:text-white mt-0.5"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-neutral-600 dark:text-zinc-400">
                    কাঠিন্য
                  </label>
                  <select
                    value={newQDifficulty}
                    onChange={(e) => setNewQDifficulty(e.target.value)}
                    className="w-full bg-neutral-50 dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs outline-none font-semibold text-neutral-900 dark:text-white mt-0.5"
                  >
                    <option value="Easy">Easy (সহজ)</option>
                    <option value="Medium">Medium (মাঝারি)</option>
                    <option value="Hard">Hard (কঠিন)</option>
                  </select>
                </div>
              </div>

              {/* Explanation */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700 dark:text-zinc-300">
                  ব্যাখ্যা / সমাধান (ঐচ্ছিক)
                </label>
                <textarea
                  rows={2}
                  value={newQExplanation}
                  onChange={(e) => setNewQExplanation(e.target.value)}
                  placeholder="ব্যাখ্যা বা সূত্রের সমাধান লিখুন..."
                  className="w-full bg-neutral-50 dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs outline-none text-neutral-900 dark:text-white"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex justify-end gap-2 border-t border-neutral-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-zinc-800 text-xs font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isCreatingQuestion}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-emerald-950/20 cursor-pointer disabled:opacity-50"
                >
                  {isCreatingQuestion ? (
                    <RefreshCw className="animate-spin" size={14} />
                  ) : (
                    <Plus size={14} />
                  )}
                  <span>তৈরি করে যুক্ত করুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
