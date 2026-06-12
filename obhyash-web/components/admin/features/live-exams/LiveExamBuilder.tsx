"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, Search, Plus, Trash2, GripVertical, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { LiveExam, Question } from "@/lib/types";
import { getLiveExam, getLiveExamQuestions, addQuestionToLiveExam, removeQuestionFromLiveExam, reorderLiveExamQuestions } from "@/services/live-exam-admin-service";
import { getQuestionsPage } from "@/services/question-service";
import Link from "next/link";
import {  useRouter , usePathname} from 'next/navigation';

export default function LiveExamBuilder({ examId }: { examId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const basePath = pathname.startsWith('/teacher') ? '/teacher/live-exams' : '/admin/live-exams';
  const [exam, setExam] = useState<LiveExam | null>(null);
  const [examQuestions, setExamQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [searchResults, setSearchResults] = useState<Question[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchExamData();
  }, [examId]);

  const fetchExamData = async () => {
    try {
      setIsLoading(true);
      const [examData, questionsData] = await Promise.all([
        getLiveExam(examId),
        getLiveExamQuestions(examId)
      ]);
      if (!examData) {
        toast.error("Exam not found");
        router.push(basePath);
        return;
      }
      setExam(examData);
      setExamQuestions(questionsData);
    } catch (error) {
      toast.error("Failed to load exam data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    try {
      setIsSearching(true);
      const res = await getQuestionsPage(
        1, // page
        20, // pageSize
        {
          search: searchQuery,
          subject: subjectFilter || undefined,
          status: "Published" as any
        } // filters
      );
      setSearchResults(res.questions);
    } catch (error) {
      toast.error("Failed to search questions");
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddQuestion = async (question: Question) => {
    // Check if already exists
    if (examQuestions.some(eq => eq.question.id === question.id)) {
      toast.warning("Question is already in the exam");
      return;
    }

    try {
      const serial = examQuestions.length + 1;
      await addQuestionToLiveExam(examId, question.id, serial, 1);
      toast.success("Question added");
      fetchExamData(); // Refresh list
    } catch (error) {
      toast.error("Failed to add question");
    }
  };

  const handleRemoveQuestion = async (mappingId: string) => {
    try {
      await removeQuestionFromLiveExam(mappingId);
      toast.success("Question removed");
      fetchExamData();
    } catch (error) {
      toast.error("Failed to remove question");
    }
  };

  const moveQuestion = async (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === examQuestions.length - 1)
    ) return;

    const newOrder = [...examQuestions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;

    // Update serials locally
    const updates = newOrder.map((item, i) => ({
      id: item.mapping_id,
      serial: i + 1
    }));

    setExamQuestions(newOrder); // Optimistic UI update

    try {
      await reorderLiveExamQuestions(updates);
    } catch (error) {
      toast.error("Failed to save new order");
      fetchExamData(); // Revert on failure
    }
  };

  if (isLoading) return <div className="p-8 text-center">Loading builder...</div>;
  if (!exam) return null;

  return (
    <div className="p-4 md:p-8 space-y-6 h-[calc(100vh-80px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 shrink-0">
        <Link href={basePath} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
            Builder: {exam.title}
          </h1>
          <p className="text-sm text-neutral-500">
            {examQuestions.length} Questions Added • Total Marks: {exam.total_marks}
          </p>
        </div>
      </div>

      {/* Main Content Split */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        
        {/* Left Side: Selected Questions */}
        <div className="flex-1 bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-neutral-800 rounded-2xl flex flex-col overflow-hidden shadow-sm">
          <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
            <h2 className="font-bold">Exam Questions ({examQuestions.length})</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {examQuestions.length === 0 ? (
              <div className="text-center py-12 text-neutral-500">
                <AlertCircle className="mx-auto mb-2 opacity-50" size={32} />
                <p>No questions added yet.</p>
                <p className="text-sm">Search and add questions from the right panel.</p>
              </div>
            ) : (
              examQuestions.map((eq, index) => (
                <div key={eq.mapping_id} className="flex items-start gap-3 p-3 bg-neutral-50 dark:bg-neutral-800/30 border border-neutral-200 dark:border-neutral-800 rounded-xl">
                  <div className="flex flex-col items-center gap-1 text-neutral-400">
                    <button onClick={() => moveQuestion(index, 'up')} disabled={index === 0} className="hover:text-neutral-900 dark:hover:text-white disabled:opacity-30">
                      <GripVertical size={16} />
                    </button>
                    <span className="text-xs font-bold">{index + 1}</span>
                    <button onClick={() => moveQuestion(index, 'down')} disabled={index === examQuestions.length - 1} className="hover:text-neutral-900 dark:hover:text-white disabled:opacity-30">
                      <GripVertical size={16} />
                    </button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-2" dangerouslySetInnerHTML={{ __html: eq.question.question }}></p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-neutral-500">
                      <span className="px-2 py-0.5 bg-neutral-200 dark:bg-neutral-800 rounded-md">{eq.question.subject}</span>
                      <span>{eq.question.difficulty}</span>
                    </div>
                  </div>
                  <button onClick={() => handleRemoveQuestion(eq.mapping_id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Question Bank */}
        <div className="w-full lg:w-[400px] bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-neutral-800 rounded-2xl flex flex-col overflow-hidden shadow-sm shrink-0">
          <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
            <h2 className="font-bold mb-3">Question Bank</h2>
            <form onSubmit={handleSearch} className="space-y-3">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input 
                  type="text" 
                  placeholder="Search keywords..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Subject (e.g. Physics)" 
                  value={subjectFilter}
                  onChange={(e) => setSubjectFilter(e.target.value)}
                  className="flex-1 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                />
                <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl transition-colors">
                  Search
                </button>
              </div>
            </form>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {isSearching ? (
              <div className="text-center py-8 text-neutral-500 text-sm">Searching...</div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-8 text-neutral-500 text-sm">
                Search to find questions to add.
              </div>
            ) : (
              searchResults.map(q => {
                const isAdded = examQuestions.some(eq => eq.question.id === q.id);
                return (
                  <div key={q.id} className="p-3 bg-neutral-50 dark:bg-neutral-800/30 border border-neutral-200 dark:border-neutral-800 rounded-xl">
                    <p className="text-sm font-medium line-clamp-3 mb-2" dangerouslySetInnerHTML={{ __html: q.question }}></p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-neutral-500 bg-neutral-200 dark:bg-neutral-800 px-2 py-1 rounded-md">{q.subject}</span>
                      <button 
                        onClick={() => handleAddQuestion(q)}
                        disabled={isAdded}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          isAdded 
                            ? "bg-neutral-200 dark:bg-neutral-800 text-neutral-500 cursor-not-allowed" 
                            : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50"
                        }`}
                      >
                        {isAdded ? <><Check size={14} /> Added</> : <><Plus size={14} /> Add</>}
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
